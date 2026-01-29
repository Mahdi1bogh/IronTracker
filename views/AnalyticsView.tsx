
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Icons } from '../components/Icons';
import { SectionCard } from '../components/ui/SectionCard';
import { PALETTE } from '../styles/tokens';
import { calculate1RM, triggerHaptic, parseDuration, formatDuration } from '../utils';
import { MUSCLE_COLORS, TYPE_COLORS } from '../constants';
import { ExerciseType } from '../types';
import { 
    AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, 
    RadarChart, PolarGrid, PolarAngleAxis, Radar, 
    BarChart, Bar, Cell, LineChart, Line, YAxis, CartesianGrid,
    ComposedChart, ReferenceArea, PieChart, Pie, Legend
} from 'recharts';

const MUSCLE_ORDER = ['Pectoraux', 'Dos', 'Épaules', 'Bras', 'Abdos', 'Jambes'];
const TYPE_ORDER = ['Polyarticulaire', 'Isolation', 'Cardio', 'Statique'];

// Mapping Equipment -> New Category Names
const EQUIP_CAT_MAP: Record<string, string> = {
    'BB': 'Lib. 2m.', 'EZ': 'Lib. 2m.', 'TB': 'Lib. 2m.',
    'DB': 'Lib. 1m.', 'KB': 'Lib. 1m.', 'PL': 'Lib. 1m.',
    'EM': 'Machine', 'SM': 'Machine',
    'CB': 'Poulie',
    'BW': 'PDC',
    'RB': 'Divers', 'OT': 'Divers'
};

// Colors for New Categories
const CAT_COLORS: Record<string, string> = {
    'Lib. 2m.': PALETTE.accents.blue.primary,
    'Lib. 1m.': PALETTE.accents.red.primary,    
    'Machine': PALETTE.accents.orange.primary, 
    'Poulie': PALETTE.accents.purple.primary,  
    'PDC': PALETTE.accents.emerald.primary,
    'Divers': PALETTE.accents.gray.primary
};

// Legend Details for Tooltip
const LEGEND_DETAILS = [
    { label: 'Lib. 2m.', desc: 'BB, EZ, TB' },
    { label: 'Lib. 1m.', desc: 'DB, KB, Disque' },
    { label: 'Machine', desc: 'Machine, Smith' },
    { label: 'Poulie', desc: 'Câble' },
    { label: 'PDC', desc: 'Poids du corps' },
    { label: 'Divers', desc: 'Élastique, Autre' }
];

// SBD Elite Standards (for Chart Normalization only)
const SBD_STANDARDS = { S: 2.2, B: 1.7, D: 2.8 };

export const AnalyticsView: React.FC = () => {
    const navigate = useNavigate();
    const history = useStore(s => s.history);
    const library = useStore(s => s.library);
    const accentColor = useStore(s => s.accentColor);

    const primaryColor = PALETTE.accents[accentColor]?.primary || PALETTE.accents.blue.primary;

    const [period, setPeriod] = useState<'7d'|'30d'|'90d'>('30d');
    const [selectedDetailExo, setSelectedDetailExo] = useState<number>(33); 
    const [detailMetric, setDetailMetric] = useState<'1rm' | 'max' | 'volume' | 'tonnage'>('1rm');
    const [volumeMode, setVolumeMode] = useState<'muscle' | 'type'>('muscle');

    // Identify if selected exercise is Static/Cardio (Time based)
    const selectedLib = useMemo(() => library.find(l => l.id === selectedDetailExo), [library, selectedDetailExo]);
    const isTimeBased = selectedLib ? (selectedLib.type === 'Statique' || selectedLib.type === 'Étirement') : false;
    const isCardio = selectedLib?.type === 'Cardio';

    // Auto-switch metric to "max" (Temps/Dist) when switching to a Time-based exercise 
    // because "1rm" (Lest) is often 0 for these exercises.
    useEffect(() => {
        if ((isTimeBased || isCardio) && detailMetric === '1rm') {
            setDetailMetric('max');
        }
    }, [selectedDetailExo, isTimeBased, isCardio]);

    const getCutoff = () => {
        const now = Date.now();
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        return now - (days * 24 * 3600 * 1000);
    };

    const relevantHistory = useMemo(() => {
        const cutoff = getCutoff();
        return history.filter(s => s.startTime >= cutoff).sort((a,b) => a.startTime - b.startTime);
    }, [history, period]);

    const overviewStats = useMemo(() => {
        const totalSessions = relevantHistory.length;
        const totalSets = relevantHistory.reduce((acc, s) => acc + s.exercises.reduce((ac, e) => ac + e.sets.filter(st => st.done && !st.isWarmup).length, 0), 0);
        const totalTonnage = relevantHistory.reduce((acc, s) => {
            return acc + s.exercises.reduce((ac, e) => {
                const lib = library.find(l => l.id === e.exerciseId);
                // Exclude Cardio/Iso from Tonnage Overview to avoid skewing data with seconds
                if (lib && (lib.type === 'Cardio' || lib.type === 'Statique' || lib.type === 'Étirement')) return ac;
                return ac + e.sets.filter(st => st.done && !st.isWarmup).reduce((a, st) => a + (parseFloat(st.weight)||0) * (parseFloat(st.reps)||0), 0);
            }, 0);
        }, 0);
        return { totalSessions, totalSets, totalTonnage: Math.round(totalTonnage / 1000) };
    }, [relevantHistory, library]);

    const volFatigueData = useMemo(() => {
        return relevantHistory.map(s => ({
            date: new Date(s.startTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }),
            volume: s.exercises.reduce((acc, e) => acc + e.sets.filter(st => st.done && !st.isWarmup).length, 0),
            fatigue: parseInt(s.fatigue) || 3
        }));
    }, [relevantHistory]);

    const weeklyVolumeData = useMemo(() => {
        const counts: Record<string, number> = {};
        if (volumeMode === 'muscle') MUSCLE_ORDER.forEach(m => counts[m] = 0);
        else TYPE_ORDER.forEach(t => counts[t] = 0);
        
        relevantHistory.forEach(s => {
            s.exercises.forEach(e => {
                const lib = library.find(l => l.id === e.exerciseId);
                if (lib) {
                    const key = volumeMode === 'muscle' ? lib.muscle : lib.type;
                    if (counts[key] !== undefined) {
                        counts[key] += e.sets.filter(st => st.done && !st.isWarmup).length;
                    }
                }
            });
        });

        const weeks = period === '7d' ? 1 : period === '30d' ? 4 : 12;
        const labels = volumeMode === 'muscle' ? MUSCLE_ORDER : TYPE_ORDER;
        
        return labels.map(label => ({
            name: volumeMode === 'muscle' ? label : label.substring(0,4).toUpperCase(),
            realName: label,
            avgSets: Math.round((counts[label] / weeks) * 10) / 10
        }));
    }, [relevantHistory, library, period, volumeMode]);

    const equipmentData = useMemo(() => {
        const counts: Record<string, number> = {};
        relevantHistory.forEach(s => {
            s.exercises.forEach(e => {
                const lib = library.find(l => l.id === e.exerciseId);
                if (lib && lib.equipment) {
                    const cat = EQUIP_CAT_MAP[lib.equipment] || 'Divers';
                    counts[cat] = (counts[cat] || 0) + e.sets.filter(st => st.done && !st.isWarmup).length;
                }
            });
        });
        
        return Object.entries(counts)
            .map(([name, value]) => ({ 
                name, 
                value,
                color: CAT_COLORS[name] || PALETTE.text.secondary
            }))
            .sort((a,b) => b.value - a.value);
    }, [relevantHistory, library]);

    const exerciseDetailData = useMemo(() => {
        return relevantHistory
            .filter(h => h.exercises.some(e => e.exerciseId === selectedDetailExo))
            .map(h => {
                const ex = h.exercises.find(e => e.exerciseId === selectedDetailExo);
                if (!ex) return null;
                const validSets = ex.sets.filter(s => s.done && !s.isWarmup);
                if (validSets.length === 0) return null;
                let val = 0;

                const isTime = isTimeBased;

                if (detailMetric === 'volume') {
                    val = validSets.length;
                } 
                else if (isTime) {
                    // --- STATIC / ETIREMENT ---
                    if (detailMetric === '1rm') {
                        // "Lest Max" -> Stored in Weight
                        val = Math.max(...validSets.map(s => parseFloat(s.weight) || 0));
                    } else if (detailMetric === 'max') {
                        // "Temps Max" -> Stored in Reps
                        val = Math.max(...validSets.map(s => parseDuration(s.reps)));
                    } else { // tonnage
                        // "Temps s/Tension" -> Sum of Reps
                        val = validSets.reduce((acc, s) => acc + parseDuration(s.reps), 0);
                    }
                } 
                else if (isCardio) {
                    // --- CARDIO ---
                    if (detailMetric === '1rm') {
                        // "Vitesse/Lvl Max" -> Stored in Weight
                        val = Math.max(...validSets.map(s => parseFloat(s.weight) || 0));
                    } else if (detailMetric === 'max') {
                        // "Dist. Max" -> Stored in Reps (usually distance)
                        val = Math.max(...validSets.map(s => parseFloat(s.reps) || 0));
                    } else { // tonnage
                        // "Distance Totale" -> Sum of Reps
                        val = validSets.reduce((acc, s) => acc + (parseFloat(s.reps)||0), 0);
                    }
                } 
                else {
                    // --- STANDARD (Poly / Iso) ---
                    if (detailMetric === '1rm') {
                        // 1RM Est.
                        val = Math.max(...validSets.map(s => calculate1RM(s.weight, s.reps)));
                    } else if (detailMetric === 'max') {
                        // Poids Max
                        val = Math.max(...validSets.map(s => parseFloat(s.weight) || 0));
                    } else { // tonnage
                        // Tonnage
                        val = validSets.reduce((acc, s) => acc + ((parseFloat(s.weight)||0) * (parseFloat(s.reps)||0)), 0);
                    }
                }

                return {
                    date: new Date(h.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                    val: val
                };
            }).filter(Boolean);
    }, [relevantHistory, selectedDetailExo, detailMetric, isTimeBased, isCardio]);

    // Enhanced SBD Logic
    const sbdStats = useMemo(() => {
        const squatIds = [33, 34, 35];
        const benchIds = [1, 2, 3, 4];
        const deadliftIds = [20, 40];
        
        const maxes = { S: 0, B: 0, D: 0 };
        
        history.forEach(s => {
            s.exercises.forEach(e => {
                let category: 'S'|'B'|'D'|null = null;
                if (squatIds.includes(e.exerciseId)) category = 'S';
                else if (benchIds.includes(e.exerciseId)) category = 'B';
                else if (deadliftIds.includes(e.exerciseId)) category = 'D';

                if (category) {
                    const libEx = library.find(l => l.id === e.exerciseId);
                    e.sets.forEach(st => {
                        if (st.done && !st.isWarmup) {
                            let w = parseFloat(st.weight) || 0;
                            // Conversion logic for DB Bench Press: (Weight * 2) / 0.8
                            if (category === 'B' && libEx?.equipment === 'DB') {
                                w = (w * 2) / 0.8;
                            }
                            const e1rm = calculate1RM(w, st.reps);
                            if (e1rm > maxes[category!]) maxes[category!] = e1rm;
                        }
                    });
                }
            });
        });
        
        const total = Math.round(maxes.S + maxes.B + maxes.D);
        
        // Secure Bodyweight
        let lastBW = 75; 
        if (history.length > 0 && history[0].bodyWeight) {
            const parsed = parseFloat(history[0].bodyWeight);
            if (!isNaN(parsed) && parsed > 0) lastBW = parsed;
        }
        
        const currentRatio = (total / lastBW).toFixed(2);

        // CHART NORMALIZATION (Visual Only)
        // Value for Chart = (Current Ratio / Elite Ratio) * 100
        const getNormValue = (max: number, elite: number) => {
            const ratio = max / lastBW;
            return Math.min(100, Math.round((ratio / elite) * 100));
        };

        const ratioS = maxes.S / lastBW;
        const ratioB = maxes.B / lastBW;
        const ratioD = maxes.D / lastBW;

        return {
            data: [
                { 
                    name: 'Squat', 
                    value: getNormValue(maxes.S, SBD_STANDARDS.S), 
                    displayRatio: ratioS.toFixed(2), 
                    raw: Math.round(maxes.S), 
                    fullMark: 100 
                },
                { 
                    name: 'Bench', 
                    value: getNormValue(maxes.B, SBD_STANDARDS.B), 
                    displayRatio: ratioB.toFixed(2), 
                    raw: Math.round(maxes.B), 
                    fullMark: 100 
                },
                { 
                    name: 'Deadlift', 
                    value: getNormValue(maxes.D, SBD_STANDARDS.D), 
                    displayRatio: ratioD.toFixed(2), 
                    raw: Math.round(maxes.D), 
                    fullMark: 100 
                }
            ],
            total,
            ratio: currentRatio
        };
    }, [history, library]);

    // Nice Domain for Y-Axis
    const niceDomain = ([dataMin, dataMax]: [number, number]): [number, number] => {
        if (!dataMax || dataMax === 0 || !isFinite(dataMax)) return [0, 10];
        return [0, Math.ceil(dataMax * 1.1)];
    };

    return (
        <div className="space-y-6 pb-24 animate-zoom-in relative pt-4">
            
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                 <h2 className="text-3xl font-black italic uppercase text-white">Activité</h2>
                 <div className="bg-surface2/50 p-1 rounded-xl flex gap-1 border border-white/5">
                     {['7d', '30d', '90d'].map((p) => (
                         <button 
                            key={p} 
                            onClick={() => { triggerHaptic('click'); setPeriod(p as any); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${period === p ? 'bg-primary text-black' : 'text-secondary hover:text-white'}`}
                         >
                             {p}
                         </button>
                     ))}
                 </div>
            </div>

            {/* 1. Overview Cards */}
            <div className="grid grid-cols-3 gap-3">
                <SectionCard className="p-4 flex flex-col items-center justify-center gap-1">
                    <div className="text-2xl font-black text-white">{overviewStats.totalSessions}</div>
                    <div className="text-[9px] font-bold uppercase text-secondary">Séances</div>
                </SectionCard>
                <SectionCard className="p-4 flex flex-col items-center justify-center gap-1">
                    <div className="text-2xl font-black text-white">{overviewStats.totalSets}</div>
                    <div className="text-[9px] font-bold uppercase text-secondary">Sets</div>
                </SectionCard>
                <SectionCard className="p-4 flex flex-col items-center justify-center gap-1">
                    <div className="text-2xl font-black text-white">{overviewStats.totalTonnage}k</div>
                    <div className="text-[9px] font-bold uppercase text-secondary">Tonnage</div>
                </SectionCard>
            </div>

            {/* 2. Volume vs Fatigue */}
            <SectionCard className="p-5 h-72 relative">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    <h3 className="text-xs font-black uppercase text-white">Volume vs Fatigue</h3>
                </div>
                {volFatigueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="85%">
                        <ComposedChart data={volFatigueData} margin={{ left: -20, right: 0 }}>
                             <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: PALETTE.text.secondary, fontSize: 10}} dy={10} minTickGap={20} />
                             <YAxis yAxisId="left" orientation="left" stroke={PALETTE.accents.blue.primary} axisLine={false} tickLine={false} tick={{fill: PALETTE.text.secondary, fontSize: 10}} />
                             <YAxis yAxisId="right" orientation="right" domain={[0, 6]} hide />
                             <Tooltip contentStyle={{backgroundColor: PALETTE.surface, borderRadius: '12px', border: '1px solid #334155'}} itemStyle={{fontSize: '11px', color: '#fff'}} cursor={{fill: 'transparent'}} />
                             <Bar yAxisId="left" dataKey="volume" fill={PALETTE.accents.blue.primary} barSize={8} radius={[4,4,0,0]} fillOpacity={0.6} />
                             <Line yAxisId="right" type="monotone" dataKey="fatigue" stroke={PALETTE.accents.orange.primary} strokeWidth={2} dot={{r:3}} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-secondary/40 text-xs italic">Pas de données</div>
                )}
            </SectionCard>

            {/* 3. Weekly Volume & Target Zone */}
            <SectionCard className="p-5 h-72 relative flex flex-col">
                <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                        <h3 className="text-xs font-black uppercase text-white">Volume Hebdo (Moy.)</h3>
                    </div>
                    <div className="flex bg-surface2/50 p-0.5 rounded-lg border border-white/5">
                        <button onClick={() => setVolumeMode('muscle')} className={`px-2 py-1 text-[8px] font-bold uppercase rounded ${volumeMode === 'muscle' ? 'bg-white/10 text-white' : 'text-secondary'}`}>Muscle</button>
                        <button onClick={() => setVolumeMode('type')} className={`px-2 py-1 text-[8px] font-bold uppercase rounded ${volumeMode === 'type' ? 'bg-white/10 text-white' : 'text-secondary'}`}>Type</button>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyVolumeData} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: PALETTE.text.secondary, fontSize: 9}} dy={10} interval={0} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: PALETTE.text.secondary, fontSize: 10}} />
                            <ReferenceArea y1={10} y2={20} fill={PALETTE.accents.emerald.primary} fillOpacity={0.1} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: PALETTE.surface, borderRadius: '12px', border: '1px solid #334155'}} itemStyle={{color:'#fff'}} />
                            <Bar dataKey="avgSets" radius={[4,4,0,0]}>
                                {weeklyVolumeData.map((entry, index) => {
                                    const color = volumeMode === 'muscle' 
                                        ? MUSCLE_COLORS[entry.realName] 
                                        : TYPE_COLORS[entry.realName as ExerciseType];
                                    return <Cell key={`cell-${index}`} fill={color || PALETTE.text.secondary} fillOpacity={0.8} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </SectionCard>

            <div className="grid grid-cols-2 gap-3 relative">
                 {/* 4. Equipment Donut - Hover z-50 to bring to top */}
                 <SectionCard className="p-4 h-72 flex flex-col relative z-0 hover:z-50 transition-all">
                     <div className="flex items-center gap-2 mb-2">
                         <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                         <div className="flex items-center gap-1">
                             <h3 className="text-xs font-black uppercase text-white">Matériel</h3>
                             <div className="group relative">
                                <Icons.Search size={10} className="text-secondary cursor-help" />
                                <div className="absolute left-full top-0 ml-2 w-44 p-3 bg-surface border border-white/10 rounded-xl text-[9px] text-secondary hidden group-hover:block z-50 shadow-2xl">
                                    <span className="font-bold text-white block mb-2 uppercase tracking-widest border-b border-white/10 pb-1">Légende</span>
                                    <div className="space-y-1.5">
                                        {LEGEND_DETAILS.map((item, idx) => (
                                            <div key={idx} className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: CAT_COLORS[item.label]}} /> 
                                                    <span className="font-bold text-white text-[10px]">{item.label}</span>
                                                </div>
                                                <span className="text-[8px] text-secondary/70 pl-3.5 leading-tight">{item.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             </div>
                         </div>
                     </div>
                     <div className="flex-1 min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                 <Pie data={equipmentData} innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value" stroke="none">
                                     {equipmentData.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={entry.color} />
                                     ))}
                                 </Pie>
                                 <Tooltip contentStyle={{backgroundColor: PALETTE.surface, borderRadius: '8px', border: '1px solid #334155', fontSize: '10px'}} itemStyle={{color:'#fff'}} />
                                 <Legend 
                                     layout="horizontal" 
                                     verticalAlign="bottom" 
                                     align="center"
                                     iconSize={6}
                                     wrapperStyle={{fontSize: '9px', opacity: 0.8, paddingTop: '10px'}} 
                                     formatter={(value, entry: any) => {
                                         return <span style={{color: '#fff'}}>{value}</span>;
                                     }}
                                 />
                             </PieChart>
                         </ResponsiveContainer>
                     </div>
                 </SectionCard>

                 {/* 6. SBD Ratios - Hover z-50 to bring to top */}
                 <SectionCard className="p-4 h-72 flex flex-col relative z-0 hover:z-50 transition-all">
                     <div className="flex items-center gap-2 mb-2">
                         <div className="w-1 h-4 bg-gold rounded-full"></div>
                         <div className="flex items-center gap-1">
                             <h3 className="text-xs font-black uppercase text-white">SBD (Ratio)</h3>
                             <div className="group relative">
                                <Icons.Search size={10} className="text-secondary cursor-help" />
                                <div className="absolute right-0 top-6 w-48 p-3 bg-surface border border-white/10 rounded-xl text-[9px] text-secondary hidden group-hover:block z-50 shadow-2xl">
                                    <div className="font-bold text-white mb-2 text-center uppercase tracking-widest border-b border-white/10 pb-1">Ratio = 1RM / PDC</div>
                                    <div className="grid grid-cols-5 gap-y-1 gap-x-2 text-center items-center">
                                        <div className="font-bold text-left text-white/50">Lvl</div>
                                        <div className="font-bold text-gold">S</div>
                                        <div className="font-bold text-gold">B</div>
                                        <div className="font-bold text-gold">D</div>
                                        <div className="font-bold text-primary">Tot</div>

                                        <div className="text-left text-white">Nov</div>
                                        <div>0.8</div><div>0.5</div><div>1.0</div><div>2.5</div>

                                        <div className="text-left text-white">Int</div>
                                        <div>1.2</div><div>0.8</div><div>1.5</div><div>3.5</div>

                                        <div className="text-left text-white">Adv</div>
                                        <div>1.8</div><div>1.2</div><div>2.2</div><div>5.5</div>

                                        <div className="text-left text-white">Eli</div>
                                        <div>2.2</div><div>1.7</div><div>2.8</div><div>6.5</div>
                                    </div>
                                    <div className="mt-2 text-[8px] italic opacity-50 text-center text-white/50">*Graphique normalisé sur standards Élite</div>
                                </div>
                             </div>
                         </div>
                     </div>
                     <div className="flex-1 min-h-0 relative">
                         <ResponsiveContainer width="100%" height="100%">
                             <RadarChart cx="50%" cy="50%" outerRadius="65%" data={sbdStats.data}>
                                 <PolarGrid stroke={PALETTE.border} />
                                 <PolarAngleAxis dataKey="name" tick={{ fill: PALETTE.text.secondary, fontSize: 9, fontWeight: 700 }} />
                                 <Radar name="Niveau" dataKey="value" stroke={PALETTE.accents.gold.primary} fill={PALETTE.accents.gold.primary} fillOpacity={0.4} />
                                 <PolarGrid gridType="circle" />
                                 <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-surface border border-white/10 p-2 rounded-lg text-xs">
                                                    <div className="font-bold text-gold">{d.name}</div>
                                                    <div>Ratio: <span className="font-mono text-white">{d.displayRatio}x</span></div>
                                                    <div>Max: <span className="font-mono text-white">{d.raw}kg</span></div>
                                                    <div className="text-[9px] text-secondary mt-1">Niveau: {d.value}% Élite</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                 />
                             </RadarChart>
                         </ResponsiveContainer>
                         <div className="absolute bottom-0 right-0 text-[10px] text-gold font-bold text-right leading-tight">
                             <div>Total: {sbdStats.total} kg</div>
                             <div className="text-secondary/70">Ratio: {sbdStats.ratio}x</div>
                         </div>
                     </div>
                 </SectionCard>
            </div>

            {/* 5. Exercise Detail (Updated Y-Axis for Time Based Exercises) */}
            <SectionCard className="p-5 h-80 relative flex flex-col">
                <div className="flex flex-col gap-3 mb-4 z-10 relative">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary rounded-full"></div>
                            <h3 className="text-xs font-black uppercase text-white">Détails Exercice</h3>
                        </div>
                        <select 
                            className="bg-surface2/50 text-[10px] text-white p-1 rounded font-bold outline-none max-w-[120px] border border-white/10"
                            value={detailMetric}
                            onChange={(e) => setDetailMetric(e.target.value as any)}
                        >
                            <option value="1rm">{isTimeBased ? "Lest Max" : isCardio ? "Vitesse/Lvl Max" : "1RM Est."}</option>
                            <option value="max">{isTimeBased ? "Temps Max" : isCardio ? "Dist. Max" : "Poids Max"}</option>
                            <option value="volume">Volume (Sets)</option>
                            <option value="tonnage">{isTimeBased ? "Temps s/Tension" : isCardio ? "Dist. Totale" : "Tonnage"}</option>
                        </select>
                    </div>
                    <select 
                        className="bg-surface2/50 text-[10px] text-white p-2 rounded-lg font-bold outline-none w-full border border-white/10"
                        value={selectedDetailExo}
                        onChange={(e) => setSelectedDetailExo(parseInt(e.target.value))}
                    >
                        {library.filter(l => !l.isArchived).sort((a,b) => a.name.localeCompare(b.name)).map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex-1 w-full min-h-0 relative">
                    {exerciseDetailData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={exerciseDetailData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
                                <CartesianGrid stroke={PALETTE.border} strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: PALETTE.text.secondary, fontSize: 10, fontWeight: 600}} 
                                    dy={10}
                                    minTickGap={30}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: PALETTE.text.secondary, fontSize: 10, fontWeight: 600}} 
                                    domain={niceDomain}
                                    tickFormatter={(val) => (isTimeBased && detailMetric !== '1rm' && detailMetric !== 'volume') || (isCardio && detailMetric === 'tonnage') ? formatDuration(val) : val}
                                />
                                <Tooltip 
                                    contentStyle={{backgroundColor: PALETTE.surface, border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'}}
                                    itemStyle={{color: '#fff', fontSize: '12px', fontWeight: 'bold'}}
                                    formatter={(val: number) => (isTimeBased && detailMetric !== '1rm' && detailMetric !== 'volume') || (isCardio && detailMetric === 'tonnage') ? formatDuration(val) : val}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="val" 
                                    stroke={primaryColor} 
                                    strokeWidth={3} 
                                    dot={{fill: primaryColor, r: 4}}
                                    activeDot={{r: 6, strokeWidth: 0}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-secondary/40 text-xs italic">
                            Pas assez de données
                        </div>
                    )}
                </div>
            </SectionCard>
        </div>
    );
};
