
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ChartContainer, CHART_CONFIG } from '../components/ui/ChartContainer';
import { Modal } from '../components/ui/Modal';
import { Icons } from '../components/Icons';
import { TYPE_COLORS } from '../constants';
import { triggerHaptic, calculate1RM } from '../utils';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, Cell, ComposedChart, PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, ReferenceArea, LabelList } from 'recharts';
import { EXERCISE_TYPE_LIST } from '../data/exerciseTypes';
import { EQUIPMENTS } from '../data/equipments';
import { PALETTE } from '../styles/tokens';

// Helper consts
const MUSCLE_COLORS: Record<string, string> = {
  'Pectoraux': PALETTE.muscle.pecs, 
  'Dos': PALETTE.muscle.back, 
  'Jambes': PALETTE.muscle.legs, 
  'Épaules': PALETTE.muscle.shoulders,
  'Bras': PALETTE.muscle.arms, 
  'Abdos': PALETTE.muscle.abs, 
  'Mollets': PALETTE.muscle.calves, 
  'Avant-bras': PALETTE.muscle.forearms, 
  'Cardio': PALETTE.muscle.cardio, 
  'Cou': PALETTE.muscle.neck
};
const MUSCLE_ORDER = ['Pectoraux', 'Dos', 'Épaules', 'Bras', 'Avant-bras', 'Abdos', 'Jambes', 'Mollets', 'Cou', 'Cardio'];

const PERIODS = [
    { key: '7d', label: '7J' },
    { key: '30d', label: '30J' },
    { key: '90d', label: '90J' },
    { key: '1y', label: '1A' },
    { key: 'all', label: '∞' }
];

const SBD_IDS = [33, 1, 20]; // Squat, Bench, Deadlift IDs

// Reusable Segmented Control Component for consistency (KISS)
const SegmentedControl = ({ options, value, onChange }: { options: { id: string, label: string }[], value: string, onChange: (val: string) => void }) => (
    <div className="bg-surface2 p-1 rounded-xl flex gap-1">
        {options.map(opt => (
            <button 
                key={opt.id} 
                onClick={() => { triggerHaptic('click'); onChange(opt.id); }} 
                className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${value === opt.id ? 'bg-primary text-background shadow-sm' : 'text-secondary hover:text-white'}`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

export const AnalyticsView: React.FC = () => {
    const navigate = useNavigate();
    const history = useStore(s => s.history);
    const library = useStore(s => s.library);

    const [analyticsTab, setAnalyticsTab] = useState<'micro' | 'macro' | 'physio' | 'habits'>('micro');
    const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d'|'30d'|'90d'|'1y'|'all'>('30d');
    
    // Multi-select state for exercises
    const [selectedExos, setSelectedExos] = useState<number[]>([]);
    
    const [analyticsMetric, setAnalyticsMetric] = useState<'1rm'|'max'|'volume'|'tonnage'>('1rm');
    const [volumeChartMode, setVolumeChartMode] = useState<'muscle' | 'type'>('muscle');
    const [habitsMode, setHabitsMode] = useState<'freq' | 'duration'>('freq');
    const [showExoPicker, setShowExoPicker] = useState(false);
    const [libraryFilter, setLibraryFilter] = useState('');
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

    const getExerciseById = (id: number) => library.find(l => l.id === id);

    const getFilterTime = () => {
        const now = Date.now();
        switch(analyticsPeriod) {
            case '7d': return now - 7 * 24 * 3600 * 1000;
            case '30d': return now - 30 * 24 * 3600 * 1000;
            case '90d': return now - 90 * 24 * 3600 * 1000;
            case '1y': return now - 365 * 24 * 3600 * 1000;
            case 'all': return 0;
        }
    };

    // --- SBD Logic ---
    const isSBDSelected = useMemo(() => {
        return SBD_IDS.every(id => selectedExos.includes(id)) && selectedExos.length === 3;
    }, [selectedExos]);

    const sbdStats = useMemo(() => {
        if (!isSBDSelected) return null;
        
        const minTime = getFilterTime();
        const relevantHistory = history.filter(s => s.startTime >= minTime);
        const stats = { S: 0, B: 0, D: 0, Total: 0, Ratio: 0 };
        
        // Find max 1RM for each lift in period (excluding warmups)
        [33, 1, 20].forEach((id, idx) => {
             let maxLift = 0;
             relevantHistory.forEach(s => {
                 const ex = s.exercises.find((e:any) => e.exerciseId === id);
                 if (ex) {
                     ex.sets.forEach((st:any) => {
                         if (st.done && !st.isWarmup) {
                             const e1rm = calculate1RM(st.weight, st.reps);
                             if (e1rm > maxLift) maxLift = e1rm;
                         }
                     });
                 }
             });
             if (idx === 0) stats.S = maxLift;
             if (idx === 1) stats.B = maxLift;
             if (idx === 2) stats.D = maxLift;
        });

        stats.Total = stats.S + stats.B + stats.D;
        
        // Find latest bodyweight
        const latestSess = history.find(s => s.bodyWeight && parseFloat(s.bodyWeight) > 0);
        const bw = latestSess ? parseFloat(latestSess.bodyWeight) : 0;
        
        if (bw > 0) stats.Ratio = parseFloat((stats.Total / bw).toFixed(2));

        return stats;
    }, [isSBDSelected, history, getFilterTime]);

    const handleSBDToggle = () => {
        triggerHaptic('click');
        if (isSBDSelected) {
            setSelectedExos([]);
        } else {
            setSelectedExos(SBD_IDS);
        }
    };

    const progData = useMemo(() => {
        if (selectedExos.length === 0) return [];
        
        const minTime = getFilterTime();
        const filteredHistory = history.filter(s => s.startTime >= minTime).sort((a,b) => a.startTime - b.startTime);

        return filteredHistory.map(s => {
            const dataPoint: any = {
                date: new Date(s.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                fullDate: new Date(s.startTime).toLocaleDateString('fr-FR'),
                timestamp: s.startTime // for sorting if needed
            };

            let hasData = false;

            selectedExos.forEach(eid => {
                const ex = s.exercises.find((e:any) => e.exerciseId === eid);
                if (ex) {
                    // Filter warmups out
                    const doneSets = ex.sets.filter((st:any) => st.done && !st.isWarmup);
                    if (doneSets.length > 0) {
                        let val = 0;
                        if (analyticsMetric === '1rm') {
                            val = Math.max(...doneSets.map((ds:any) => calculate1RM(ds.weight, ds.reps)));
                        } else if (analyticsMetric === 'max') {
                            val = Math.max(...doneSets.map((ds:any) => parseFloat(ds.weight) || 0));
                        } else if (analyticsMetric === 'volume') {
                            val = doneSets.length;
                        } else if (analyticsMetric === 'tonnage') {
                            val = doneSets.reduce((acc:number, ds:any) => acc + ((parseFloat(ds.weight)||0) * (parseFloat(ds.reps)||0)), 0);
                        }
                        if (val > 0) {
                            dataPoint[`val_${eid}`] = val;
                            hasData = true;
                        }
                    }
                }
            });

            return hasData ? dataPoint : null;
        }).filter(d => d !== null);
    }, [history, selectedExos, analyticsPeriod, analyticsMetric, getFilterTime]);

    const radarData = useMemo(() => {
        const minTime = getFilterTime();
        const relevantHistory = history.filter(s => s.startTime >= minTime);
        const counts: Record<string, number> = {};
        
        relevantHistory.forEach(s => {
            s.exercises.forEach((e:any) => {
                const lib = getExerciseById(e.exerciseId);
                if (!lib) return;
                // Exclude warmups from Radar Chart
                const hardSets = e.sets.filter((st:any) => st.done && !st.isWarmup).length;
                if (hardSets > 0) {
                    const m = lib.muscle || 'Autre';
                    counts[m] = (counts[m] || 0) + hardSets;
                }
            });
        });

        return MUSCLE_ORDER.filter(m => m !== 'Cardio').map(m => ({
            subject: m,
            A: counts[m] || 0,
            fullMark: Math.max(...Object.values(counts), 10)
        }));
    }, [history, analyticsPeriod, getExerciseById, getFilterTime]);

    const physioData = useMemo(() => {
        const minTime = getFilterTime();
        const filtered = history.filter(s => s.startTime >= minTime).sort((a,b) => a.startTime - b.startTime);
        
        return filtered.map(s => {
            let totalVol = 0;
            s.exercises.forEach((e:any) => {
                e.sets.forEach((st:any) => {
                   if (st.done && !st.isWarmup) {
                       const w = parseFloat(st.weight) || 0;
                       const r = parseFloat(st.reps) || 0;
                       totalVol += (w * r);
                   }
                });
            });
            
            return {
               date: new Date(s.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
               fullDate: new Date(s.startTime).toLocaleDateString('fr-FR'),
               fatigue: parseInt(s.fatigue) || 3,
               perf: totalVol
            };
        });
    }, [history, analyticsPeriod, getFilterTime]);

    const habitsData = useMemo(() => {
        const minTime = getFilterTime();
        const filtered = history.filter(s => s.startTime >= minTime);
        
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const dayCounts = new Array(7).fill(0);
        const dayDurations = new Array(7).fill(0); // Total duration per day index
        const dayDurCounts = new Array(7).fill(0); // Count of sessions with duration per day index
        
        const equipCounts: Record<string, number> = { 'Libre': 0, 'Machine': 0, 'PDC': 0 };
        
        filtered.forEach(s => {
            const d = new Date(s.startTime);
            const idx = d.getDay();
            dayCounts[idx]++;
            
            if (s.endTime && s.endTime > s.startTime) {
                const durMin = (s.endTime - s.startTime) / 60000;
                dayDurations[idx] += durMin;
                dayDurCounts[idx]++;
            }
            
            s.exercises.forEach((e:any) => {
                const lib = getExerciseById(e.exerciseId);
                if (lib) {
                    // Habits count all sets including warmups? Probably strictly working sets is better for equipment usage
                    const sets = e.sets.filter((st:any) => st.done && !st.isWarmup).length;
                    if (sets > 0) {
                        if (['BB','DB','EZ','KB','TB','PL'].includes(lib.equipment)) equipCounts['Libre'] += sets;
                        else if (['EM','SM','CB'].includes(lib.equipment)) equipCounts['Machine'] += sets;
                        else if (lib.equipment === 'BW') equipCounts['PDC'] += sets;
                    }
                }
            });
        });
        
        const freqData = days.map((d, i) => ({ 
            name: d, 
            count: dayCounts[i],
            duration: dayDurCounts[i] > 0 ? Math.round(dayDurations[i] / dayDurCounts[i]) : 0
        }));
        
        const pieData = [
            { name: 'Libre', value: equipCounts['Libre'], color: PALETTE.accents.blue.primary },
            { name: 'Machine', value: equipCounts['Machine'], color: PALETTE.accents.purple.primary },
            { name: 'PDC', value: equipCounts['PDC'], color: PALETTE.accents.emerald.primary }
        ].filter(d => d.value > 0);

        return { freqData, pieData };
    }, [history, analyticsPeriod, getExerciseById, getFilterTime]);

    const [weekStart, weekEnd] = useMemo(() => {
        const start = new Date();
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1) + (currentWeekOffset * 7);
        start.setDate(diff);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return [start, end];
    }, [currentWeekOffset]);
        
    const volumeData = useMemo(() => {
        const counts: Record<string, number> = {};
        history.forEach(s => {
            const d = new Date(s.startTime);
            const dTime = d.setHours(0,0,0,0);
            const wStartTime = weekStart.setHours(0,0,0,0);
            const wEndTime = weekEnd.setHours(23,59,59,999);
            if (dTime >= wStartTime && dTime <= wEndTime) {
                s.exercises.forEach((e:any) => {
                    const lib = getExerciseById(e.exerciseId);
                    if (!lib) return;
                    // Strict filtering of warmups, removal of RIR filter
                    const doneSets = e.sets.filter((st:any) => st.done && !st.isWarmup).length;
                    
                    if (volumeChartMode === 'muscle') {
                        const muscle = lib.muscle || 'Autre';
                        counts[muscle] = (counts[muscle] || 0) + doneSets;
                    } else {
                        const type = lib.type;
                        counts[type] = (counts[type] || 0) + doneSets;
                    }
                });
            }
        });
        if (volumeChartMode === 'muscle') {
            return MUSCLE_ORDER.map(m => ({ name: m, sets: counts[m] || 0, color: MUSCLE_COLORS[m] }));
        } else {
            return EXERCISE_TYPE_LIST.map(t => ({ name: t, sets: counts[t] || 0, color: TYPE_COLORS[t] }));
        }
    }, [history, weekStart, weekEnd, library, volumeChartMode, getExerciseById]);

    return (
    <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex items-center gap-4 px-1">
             <button onClick={() => navigate('/')} className="p-2 bg-surface2 rounded-full text-secondary hover:text-white transition-colors">
                 <Icons.ChevronLeft />
             </button>
             <h2 className="text-2xl font-black italic uppercase">Progression</h2>
        </div>
        
        <SegmentedControl 
            options={[
                { id: 'micro', label: 'Micro' },
                { id: 'macro', label: 'Macro' },
                { id: 'physio', label: 'Physio' },
                { id: 'habits', label: 'Habitudes' }
            ]}
            value={analyticsTab}
            onChange={(v) => setAnalyticsTab(v as any)}
        />

        <div className="flex justify-end">
            <SegmentedControl 
                options={PERIODS.map(p => ({ id: p.key, label: p.label }))}
                value={analyticsPeriod}
                onChange={(v) => setAnalyticsPeriod(v as any)}
            />
        </div>
        
        {analyticsTab === 'micro' && (
            <div className="space-y-4 animate-fade-in">
                <div className="flex gap-2">
                    <button onClick={() => setShowExoPicker(true)} className="flex-1 bg-surface2 p-3 rounded-xl flex items-center justify-between text-[10px] font-bold border border-transparent hover:border-primary/50 transition-colors uppercase">
                        <span>{selectedExos.length > 0 ? `${selectedExos.length} sélectionné(s)` : 'Choisir Exercice(s)'}</span>
                        <Icons.Menu />
                    </button>
                    <button 
                        onClick={handleSBDToggle} 
                        className={`p-3 rounded-xl text-[10px] font-black uppercase border transition-colors ${isSBDSelected ? 'bg-gold/20 text-gold border-gold' : 'bg-surface2 text-secondary border-transparent hover:bg-gold/10'}`}
                    >
                        SBD
                    </button>
                </div>
                
                {/* SBD Stats Display */}
                {isSBDSelected && sbdStats && (
                    <div className="bg-surface2/30 border border-gold/20 p-4 rounded-2xl grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="text-[9px] uppercase text-secondary font-bold">Total SBD</div>
                            <div className="text-2xl font-black text-gold tracking-tight">{sbdStats.Total} <span className="text-xs text-secondary">kg</span></div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] uppercase text-secondary font-bold">Ratio</div>
                            <div className="text-2xl font-black text-white tracking-tight">{sbdStats.Ratio} <span className="text-xs text-secondary">xPDC</span></div>
                        </div>
                    </div>
                )}

                <div className="flex justify-center">
                    <SegmentedControl 
                        options={[
                            { id: '1rm', label: '1RM' },
                            { id: 'max', label: 'Max' },
                            { id: 'volume', label: 'Volume' },
                            { id: 'tonnage', label: 'Tonnage' }
                        ]}
                        value={analyticsMetric}
                        onChange={(v) => setAnalyticsMetric(v as any)}
                    />
                </div>

                {selectedExos.length > 0 && (
                    <ChartContainer 
                        title={`Progression (${analyticsMetric === '1rm' ? '1RM Estimé' : analyticsMetric === 'max' ? 'Charge Max' : analyticsMetric})`}
                        footer={
                            <div className="flex flex-wrap justify-center gap-4">
                                {selectedExos.map((eid, idx) => {
                                    const colors = [PALETTE.accents.blue.primary, PALETTE.accents.purple.primary, PALETTE.accents.emerald.primary, PALETTE.accents.gold.primary, PALETTE.accents.red.primary];
                                    const color = colors[idx % colors.length];
                                    return (
                                        <div key={eid} className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                            <span className="text-[10px] text-secondary uppercase font-bold">{getExerciseById(eid)?.name || 'Exo'}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        }
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={progData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid {...CHART_CONFIG.gridStyle} />
                                <XAxis dataKey="date" {...CHART_CONFIG.axisStyle} tickMargin={10} height={20} tick={true} />
                                <YAxis {...CHART_CONFIG.axisStyle} width={45} domain={['auto','auto']} tick={true} />
                                <Tooltip {...CHART_CONFIG.tooltipStyle} />
                                {selectedExos.map((eid, idx) => {
                                    const colors = [PALETTE.accents.blue.primary, PALETTE.accents.purple.primary, PALETTE.accents.emerald.primary, PALETTE.accents.gold.primary, PALETTE.accents.red.primary];
                                    const color = colors[idx % colors.length];
                                    return (
                                        <Area key={eid} type="monotone" dataKey={`val_${eid}`} stroke={color} fillOpacity={0.1} fill={color} strokeWidth={3} connectNulls />
                                    );
                                })}
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                )}
            </div>
        )}

        {analyticsTab === 'macro' && (
            <div className="space-y-4 animate-fade-in">
                 <div className="flex justify-between items-center bg-surface2 rounded-xl p-2 mb-2">
                     <button onClick={() => setCurrentWeekOffset(o => o - 1)} className="p-2 bg-background/50 rounded-lg text-secondary hover:text-white"><Icons.ChevronLeft size={16} /></button>
                     <div className="flex flex-col items-center">
                         <span className="text-[10px] uppercase font-bold text-secondary">Semaine du</span>
                         <span className="text-xs font-mono font-bold">{weekStart.toLocaleDateString()}</span>
                     </div>
                     <div className="flex gap-2">
                         {currentWeekOffset !== 0 && <button onClick={() => setCurrentWeekOffset(0)} className="px-2 py-1 bg-primary/20 text-primary rounded text-[9px] font-bold uppercase">RST</button>}
                         <button onClick={() => setCurrentWeekOffset(o => o + 1)} className="p-2 bg-background/50 rounded-lg text-secondary hover:text-white"><Icons.ChevronRight size={16} /></button>
                     </div>
                 </div>
                 
                 <ChartContainer 
                    title="Volume Hebdo" 
                    height="h-96"
                    action={
                        <SegmentedControl 
                            options={[{ id: 'muscle', label: 'Muscle' }, { id: 'type', label: 'Type' }]}
                            value={volumeChartMode}
                            onChange={(v) => setVolumeChartMode(v as any)}
                        />
                    }
                 >
                    <div className="flex-1 min-h-0 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={volumeData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 20 }}>
                                {volumeChartMode === 'muscle' && (
                                    <ReferenceArea x1={10} x2={20} fill={PALETTE.success} fillOpacity={0.1} />
                                )}
                                <XAxis type="number" hide={false} tickLine={true} axisLine={true} height={20} interval={0} tickCount={10} allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={85} {...CHART_CONFIG.axisStyle} fill={PALETTE.text.white} tick={true} interval={0} />
                                <Tooltip {...CHART_CONFIG.tooltipStyle} />
                                <Bar dataKey="sets" radius={[0, 4, 4, 0]} barSize={16}>
                                    {volumeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    <LabelList dataKey="sets" position="right" fill="white" fontSize={11} fontWeight="bold" formatter={(val: number) => val > 0 ? val : ''} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </ChartContainer>
                 
                 <ChartContainer 
                    title="Équilibre Musculaire" 
                    height="h-72"
                    footer={
                        <div className="flex justify-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[10px] text-secondary uppercase font-bold">Volume (Sets)</span>
                            </div>
                        </div>
                    }
                 >
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#ffffff20" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: PALETTE.text.secondary, fontSize: 10 }} />
                            <Radar name="Sets" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.3} />
                            <Tooltip {...CHART_CONFIG.tooltipStyle} />
                        </RadarChart>
                     </ResponsiveContainer>
                 </ChartContainer>
            </div>
        )}

        {analyticsTab === 'physio' && (
            <div className="space-y-4 animate-fade-in">
                 <ChartContainer 
                    title="Volume vs Fatigue" 
                    footer={
                        <div className="flex justify-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-border" />
                                <span className="text-[10px] text-secondary uppercase font-bold">Volume</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[10px] text-secondary uppercase font-bold">Fatigue</span>
                            </div>
                        </div>
                    }
                 >
                     <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={physioData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                             <XAxis dataKey="date" {...CHART_CONFIG.axisStyle} height={20} tick={true} />
                             <YAxis yAxisId="left" orientation="left" width={45} {...CHART_CONFIG.axisStyle} tick={true} />
                             <YAxis yAxisId="right" orientation="right" width={45} stroke="var(--primary)" domain={[0, 6]} {...CHART_CONFIG.axisStyle} tick={true} />
                             <Tooltip {...CHART_CONFIG.tooltipStyle} />
                             <Bar yAxisId="left" dataKey="perf" fill={PALETTE.border} radius={[4, 4, 0, 0]} barSize={8} />
                             <Line yAxisId="right" type="monotone" dataKey="fatigue" stroke="var(--primary)" strokeWidth={2} dot={true} />
                         </ComposedChart>
                     </ResponsiveContainer>
                 </ChartContainer>
            </div>
        )}

        {analyticsTab === 'habits' && (
             <div className="space-y-4 animate-fade-in">
                 <div className="flex flex-col gap-4">
                     <ChartContainer 
                        title={habitsMode === 'freq' ? "Fréquence / Jours" : "Durée Moy. / Jours"} 
                        height="h-64"
                        action={
                            <SegmentedControl 
                                options={[{ id: 'freq', label: 'Freq.' }, { id: 'duration', label: 'Durée' }]}
                                value={habitsMode}
                                onChange={(v) => setHabitsMode(v as any)}
                            />
                        }
                     >
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={habitsData.freqData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                 <XAxis dataKey="name" {...CHART_CONFIG.axisStyle} interval={0} fontSize={10} height={20} tick={true} />
                                 <YAxis 
                                    {...CHART_CONFIG.axisStyle} 
                                    width={35} 
                                    fontSize={10} 
                                    tick={true} 
                                    domain={[0, (dataMax: number) => (Math.max(dataMax, 0) + 1)]}
                                    allowDecimals={false}
                                 />
                                 <Tooltip {...CHART_CONFIG.tooltipStyle} />
                                 <Bar dataKey={habitsMode === 'freq' ? 'count' : 'duration'} fill="var(--primary)" radius={[4,4,0,0]}>
                                     <LabelList 
                                        dataKey={habitsMode === 'freq' ? 'count' : 'duration'} 
                                        position="top" 
                                        fill="white" 
                                        fontSize={10} 
                                        formatter={(val: number) => val > 0 ? (habitsMode === 'duration' ? `${val}m` : val) : ''} 
                                     />
                                 </Bar>
                             </BarChart>
                         </ResponsiveContainer>
                     </ChartContainer>
                     
                     <ChartContainer 
                        title="Matériel Utilisé" 
                        height="h-56"
                        footer={
                            <div className="flex flex-wrap justify-center gap-3">
                                {habitsData.pieData.map(entry => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[10px] text-secondary uppercase font-bold">{entry.name}</span>
                                </div>
                                ))}
                            </div>
                        }
                     >
                         <ResponsiveContainer width="100%" height="100%">
                             <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                 <Pie data={habitsData.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}>
                                     {habitsData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                 </Pie>
                                 <Tooltip {...CHART_CONFIG.tooltipStyle} />
                             </PieChart>
                         </ResponsiveContainer>
                     </ChartContainer>
                 </div>
             </div>
        )}

        {/* ANALYTICS PICKER MODAL */}
        {showExoPicker && (
         <Modal title="Comparer Exercices" onClose={() => { setShowExoPicker(false); setLibraryFilter(''); }}>
            <div className="space-y-4">
               <input placeholder="Rechercher..." className="w-full bg-surface2 p-3 rounded-2xl outline-none text-sm" onChange={(e) => setLibraryFilter(e.target.value)} autoFocus />
               <div className="max-h-60 overflow-y-auto space-y-2">
                 {library.filter(l => !l.isArchived && ((l.name || '').toLowerCase().includes(libraryFilter.toLowerCase()) || (l.muscle || '').toLowerCase().includes(libraryFilter.toLowerCase()))).sort((a,b) => (a.isFavorite === b.isFavorite) ? (a.name || '').localeCompare(b.name || '') : (a.isFavorite ? -1 : 1)).map(l => {
                    const isSelected = selectedExos.includes(l.id);
                    return (
                        <button key={l.id} onClick={() => {
                            if (isSelected) setSelectedExos(prev => prev.filter(id => id !== l.id));
                            else setSelectedExos(prev => [...prev, l.id]);
                            triggerHaptic('tick');
                        }} className={`w-full p-3 rounded-2xl text-left transition-colors flex justify-between items-center group ${isSelected ? 'bg-primary/20 border border-primary' : 'bg-surface2/50 border border-transparent hover:bg-surface2'}`}>
                        <div className="flex-1"><div className="flex items-center gap-2">{l.isFavorite && <span className="text-gold"><Icons.Star /></span>}<div className="font-bold text-sm group-hover:text-primary transition-colors">{l.name}</div></div><div className="text-[10px] text-secondary uppercase mt-1 flex gap-2"><span>{l.muscle} • {EQUIPMENTS[l.equipment as keyof typeof EQUIPMENTS]}</span><span style={{ color: TYPE_COLORS[l.type as keyof typeof TYPE_COLORS] }}>● {l.type}</span></div></div>
                        <div className={`text-xl font-black ${isSelected ? 'text-primary' : 'text-surface2'}`}>✓</div>
                        </button>
                    );
                 })}
               </div>
               <button onClick={() => setShowExoPicker(false)} className="w-full py-3 bg-primary text-background font-black uppercase rounded-[2rem]">Valider</button>
            </div>
         </Modal>
        )}
    </div>
    );
};
