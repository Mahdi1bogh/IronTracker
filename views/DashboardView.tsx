
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Modal } from '../components/ui/Modal';
import { SectionCard } from '../components/ui/SectionCard';
import { Icons } from '../components/Icons';
import { FATIGUE_COLORS, MUSCLE_COLORS, TYPE_COLORS, MUSCLE_GROUPS } from '../constants';
import { triggerHaptic, getExerciseStats } from '../utils';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { ProgramSession } from '../types';

interface DashboardViewProps {
    onStartSession: (progName: string, sess: ProgramSession, mode: 'active' | 'log') => void;
    onOpenTools: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onStartSession, onOpenTools }) => {
    const navigate = useNavigate();
    const history = useStore(s => s.history);
    const programs = useStore(s => s.programs);
    const library = useStore(s => s.library);
    const activeSession = useStore(s => s.session);
    
    // Calendar State
    const [calDate, setCalDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showHistoryProgramPicker, setShowHistoryProgramPicker] = useState(false);
    const [calendarMode, setCalendarMode] = useState<'muscle' | 'type'>('muscle');

    // Notes Modal State
    const [showNotesModal, setShowNotesModal] = useState(false);

    // Smart Selector State
    const [selectedProgIndex, setSelectedProgIndex] = useState(0);
    
    // Swipe State
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const volumeData = useMemo(() => {
        const today = new Date();
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay(); 
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0,0,0,0);

        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const data = days.map(d => ({ day: d, val: 0, today: false }));

        history.forEach(s => {
            if (s.startTime >= startOfWeek.getTime()) {
                const sDate = new Date(s.startTime);
                let sDayIdx = sDate.getDay() - 1;
                if (sDayIdx === -1) sDayIdx = 6; 
                
                const setPayload = s.exercises.reduce((acc, ex) => acc + ex.sets.filter(st => st.done && !st.isWarmup).length, 0);
                if (data[sDayIdx]) {
                    data[sDayIdx].val += setPayload;
                }
            }
        });
        return data;
    }, [history]);

    const totalWeeklySets = volumeData.reduce((acc, d) => acc + d.val, 0);

    // Consolidated Notes
    const allNotes = useMemo(() => {
        const notesList: { date: number, session: string, fatigue: string, exercise: string, note: string, perf: string }[] = [];
        history.forEach(s => {
            s.exercises.forEach(e => {
                if (e.notes) {
                    const lib = library.find(l => l.id === e.exerciseId);
                    // Retrieve specific performance for this session context
                    const stats = getExerciseStats(e.exerciseId, [s], lib?.type);

                    notesList.push({
                        date: s.startTime,
                        session: s.sessionName,
                        fatigue: s.fatigue,
                        exercise: lib?.name || "Inconnu",
                        note: e.notes,
                        perf: stats.lastSessionString
                    });
                }
            });
        });
        return notesList.sort((a,b) => b.date - a.date);
    }, [history, library]);

    // Insight Logic (Focus Algorithm Phase 4)
    const insights = useMemo(() => {
        if (history.length === 0) return { title: "Bienvenue", text: "Commencez votre premier entraînement !" };
        
        const now = Date.now();
        // 1. Sliding Window 28 Days
        const cutoff = now - (28 * 24 * 3600 * 1000);
        const recentHistory = history.filter(s => s.startTime > cutoff);
        
        const counts: Record<string, number> = {};
        
        recentHistory.forEach(s => {
            s.exercises.forEach(e => {
                const lib = library.find(l => l.id === e.exerciseId);
                if (lib) {
                    if (!counts[lib.muscle]) counts[lib.muscle] = 0;
                    counts[lib.muscle] += e.sets.filter(st => st.done && !st.isWarmup).length;
                }
            });
        });

        // 2. Calculate Weekly Average
        const avgWeekly: Record<string, number> = {};
        Object.keys(counts).forEach(m => {
            avgWeekly[m] = Math.round((counts[m] / 4) * 10) / 10;
        });

        // 3. Logic Checks
        let alertMessage = null;
        let alertTitle = null;

        // Check 1: Antagonist Ratios
        const getVol = (m: string) => avgWeekly[m] || 0;
        
        // Push/Pull Ratio (Pecs/Dos)
        const pecs = getVol('Pectoraux');
        const dos = getVol('Dos');
        if (dos > 0 && pecs / dos > 1.5) {
            alertTitle = "Déséquilibre";
            alertMessage = "Volume Pectoraux trop élevé par rapport au Dos (Ratio > 1.5).";
        } else if (pecs > 0 && dos / pecs > 1.5) {
            alertTitle = "Déséquilibre";
            alertMessage = "Volume Dos trop élevé par rapport aux Pectoraux.";
        }

        const muscles = Object.keys(avgWeekly);

        if (!alertMessage) {
            // Check 2: Volume Thresholds
            // Find neglected Primary
            const neglectedPrimary = muscles.find(m => 
                MUSCLE_GROUPS.PRIMARY.includes(m) && avgWeekly[m] < 10
            );

            if (neglectedPrimary) {
                alertTitle = "Volume Faible";
                alertMessage = `${neglectedPrimary} est sous-dosé (< 10 sets/sem).`;
            } else {
                // Find neglected Secondary
                const neglectedSecondary = muscles.find(m => 
                    MUSCLE_GROUPS.SECONDARY.includes(m) && avgWeekly[m] < 6
                );
                
                if (neglectedSecondary) {
                    alertTitle = "Optimisation";
                    alertMessage = `${neglectedSecondary} pourrait bénéficier de plus de volume.`;
                }
            }
        }

        if (!alertMessage) {
             // Check 3: High Volume
             const highVol = muscles.find(m => 
                (MUSCLE_GROUPS.PRIMARY.includes(m) && avgWeekly[m] > 22) ||
                (MUSCLE_GROUPS.SECONDARY.includes(m) && avgWeekly[m] > 15)
             );
             if (highVol) {
                 alertTitle = "Surentraînement ?";
                 alertMessage = `Volume très élevé pour ${highVol} (> ${Math.round(avgWeekly[highVol])} sets/sem).`;
             }
        }

        if (alertMessage) return { title: alertTitle, text: alertMessage };
        
        return { title: "Bon Rythme", text: "Volume d'entraînement équilibré." };
    }, [history, library]);

    const availableSessions = useMemo(() => {
        const list: { progName: string, sess: ProgramSession }[] = [];
        programs.forEach(p => {
            p.sessions.forEach(s => {
                list.push({ progName: p.name, sess: s });
            });
        });
        return list;
    }, [programs]);

    useMemo(() => {
        if (availableSessions.length === 0) return;
        if (history.length > 0) {
            const lastSess = history[0];
            const foundIdx = availableSessions.findIndex(item => item.progName === lastSess.programName && item.sess.name === lastSess.sessionName);
            if (foundIdx >= 0) {
                const next = (foundIdx + 1) % availableSessions.length;
                setSelectedProgIndex(next);
            }
        }
    }, [history, availableSessions.length]);

    const currentSelection = availableSessions[selectedProgIndex];

    const cycleSelection = (dir: -1 | 1) => {
        if (activeSession) return; // Lock if session active
        triggerHaptic('tick');
        setSelectedProgIndex(prev => {
            const next = prev + dir;
            if (next < 0) return availableSessions.length - 1;
            if (next >= availableSessions.length) return 0;
            return next;
        });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const distance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;

        if (distance > minSwipeDistance) {
            cycleSelection(1);
        } else if (distance < -minSwipeDistance) {
            cycleSelection(-1);
        }
        
        touchStartX.current = null;
        touchEndX.current = null;
    };

    const currentMonthStats = useMemo(() => {
        const now = new Date();
        const thisMonth = history.filter(s => {
            const d = new Date(s.startTime);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        return {
            count: thisMonth.length,
            time: Math.round(thisMonth.reduce((acc, s) => acc + (s.endTime ? (s.endTime - s.startTime)/60000 : 60), 0) / 60)
        };
    }, [history]);

    const curMonth = calDate.getMonth();
    const curYear = calDate.getFullYear();
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const firstDay = new Date(curYear, curMonth, 1).getDay();
    const emptyDays = firstDay === 0 ? 6 : firstDay - 1;

    return (
      <div className="animate-zoom-in space-y-6 pt-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-end px-2">
             <div>
                 <h1 className="text-4xl font-black tracking-tighter text-white italic">HELLO.</h1>
                 <p className="text-xs font-bold uppercase tracking-widest text-primary/80">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
             </div>
             <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full bg-surface2/50 flex items-center justify-center text-secondary hover:text-white transition-colors border border-white/5">
                 <Icons.Settings size={20} />
             </button>
        </div>

        {/* INSIGHT BANNER */}
        <div onClick={() => navigate('/analytics')} className="bg-surface2/30 border border-white/5 rounded-2xl p-3 flex items-center justify-between mx-1 backdrop-blur-md cursor-pointer active:scale-98 transition-transform">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                     <Icons.TrendUp size={16} />
                 </div>
                 <div className="flex-1 min-w-0 pr-2">
                     <div className="text-[10px] font-bold uppercase text-secondary tracking-wider">{insights?.title || "Analyse"}</div>
                     <div className="text-xs font-bold text-white truncate">{insights?.text || "Données insuffisantes"}</div>
                 </div>
             </div>
             <Icons.ChevronRight size={16} className="text-secondary/30" />
        </div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-2 gap-4">
            
            {/* 1. ACTIVITY CHART (Large) */}
            <SectionCard 
                className="col-span-2 p-5 relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-transform"
            >
                <div onClick={() => navigate('/analytics')} className="h-full flex flex-col justify-between relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-primary to-primary/50 rounded-2xl text-white shadow-lg shadow-primary/20">
                                <Icons.Flame size={20} fill="currentColor" />
                            </div>
                            <div>
                                 <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">Activité Hebdo</div>
                                 <div className="text-2xl font-black text-white leading-none">{totalWeeklySets} <span className="text-xs text-secondary font-bold">SETS</span></div>
                            </div>
                        </div>
                        <Icons.ChevronRight size={16} className="text-secondary/30 group-hover:text-white transition-colors" />
                    </div>
                    
                    <div className="h-24 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#ffffff60', fontSize: 9, fontWeight: 700}} 
                                    interval={0}
                                    dy={10}
                                    padding={{ left: 10, right: 10 }}
                                />
                                <Tooltip cursor={{stroke: 'var(--primary)', strokeWidth: 1}} content={<></>} />
                                <Area 
                                    type="monotone" 
                                    dataKey="val" 
                                    stroke="var(--primary)" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorVal)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </SectionCard>

            {/* 2. SMART SELECTOR (Large) */}
            <SectionCard 
                className="col-span-2 p-3 flex flex-col items-center justify-center gap-3 touch-pan-y"
            >
                <div 
                    className="w-full flex flex-col items-center gap-3"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {activeSession ? (
                        // ACTIVE SESSION STATE
                        <>
                            <div className="w-full text-center py-2 opacity-50 select-none">
                                 <div className="text-[9px] font-black text-secondary uppercase tracking-widest mb-1">Séance en cours</div>
                                 <div className="text-lg font-bold text-white truncate">{activeSession.sessionName}</div>
                            </div>
                            <button 
                                onClick={() => { triggerHaptic('click'); navigate('/workout'); }}
                                className="w-full h-16 rounded-[1.5rem] bg-surface2 border border-primary/20 text-primary flex items-center justify-center shadow-lg active:scale-95 transition-all group animate-pulse"
                            >
                                <span className="ml-2 font-black italic text-lg tracking-wider">REPRENDRE</span>
                            </button>
                        </>
                    ) : availableSessions.length > 0 ? (
                        // STANDARD SELECTOR STATE
                        <>
                            <div className="w-full flex items-center justify-between px-2 select-none">
                                <button onClick={() => cycleSelection(-1)} className="p-2 text-secondary hover:text-white active:scale-90 transition-transform">
                                    <Icons.ChevronLeft size={20} />
                                </button>
                                <div className="text-center pointer-events-none">
                                    <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 border border-primary/30 px-2 py-0.5 rounded-full bg-primary/5 inline-block">{currentSelection.progName}</div>
                                    <div className="text-xl font-black text-white truncate max-w-[200px]">{currentSelection.sess.name}</div>
                                </div>
                                <button onClick={() => cycleSelection(1)} className="p-2 text-secondary hover:text-white active:scale-90 transition-transform">
                                    <Icons.ChevronRight size={20} />
                                </button>
                            </div>
                            <button 
                                onClick={() => { triggerHaptic('success'); onStartSession(currentSelection.progName, currentSelection.sess, 'active'); }}
                                className="w-full h-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.4)] active:scale-95 transition-all group"
                            >
                                <Icons.Play size={28} fill="currentColor" className="text-white drop-shadow-md" />
                                <span className="ml-2 font-black italic text-lg tracking-wider">START</span>
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => navigate('/programs')}
                            className="w-full h-24 rounded-[1.5rem] flex items-center justify-center gap-2 text-secondary hover:text-white transition-colors border-2 border-dashed border-white/10 hover:border-white/30"
                        >
                            <Icons.Plus size={20} />
                            <span className="font-bold">Créer un programme</span>
                        </button>
                    )}
                </div>
            </SectionCard>

            {/* 3. ROUTINES WIDGET */}
            <SectionCard 
                className="p-4 flex flex-col justify-between group h-36 active:scale-[0.98] transition-transform cursor-pointer"
            >
                <div onClick={() => { triggerHaptic('click'); navigate('/programs'); }} className="h-full flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-secondary group-hover:text-white transition-colors">
                        <Icons.Repeat size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-white italic tracking-tight">ROUTINES</div>
                        <div className="text-[10px] text-secondary font-medium uppercase tracking-wide">{programs.length} programmes</div>
                    </div>
                </div>
            </SectionCard>

            {/* 4. HISTORY WIDGET */}
            <SectionCard 
                className="p-4 flex flex-col justify-between group h-36 active:scale-[0.98] transition-transform cursor-pointer"
            >
                <div onClick={() => { triggerHaptic('click'); setShowHistoryModal(true); }} className="h-full flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-secondary group-hover:text-white transition-colors">
                            <Icons.History size={20} />
                        </div>
                        {currentMonthStats.count > 0 && <span className="text-[10px] font-black text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">+{currentMonthStats.count}</span>}
                    </div>
                    <div>
                        <div className="text-lg font-black text-white italic tracking-tight">HISTORIQUE</div>
                        <div className="text-[10px] text-secondary font-medium uppercase tracking-wide">{currentMonthStats.count} ce mois</div>
                    </div>
                </div>
            </SectionCard>

            {/* 5. NOTES WIDGET */}
            <SectionCard 
                className="flex flex-col justify-center gap-2 group h-24 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden relative"
            >
                 <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                 
                 <div onClick={() => { triggerHaptic('click'); setShowNotesModal(true); }} className="w-full h-full flex flex-col items-center justify-center relative z-10 p-4">
                     <div className="p-2 bg-white/5 rounded-2xl border border-white/10 text-gold group-hover:scale-110 transition-transform mb-1">
                        <Icons.BookOpen size={20} />
                     </div>
                     <div className="text-[10px] font-black text-white uppercase tracking-widest">CARNET</div>
                 </div>
            </SectionCard>

            {/* 6. TOOLS WIDGET */}
            <SectionCard 
                className="p-0 flex flex-col items-center justify-center gap-2 group h-24 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden relative"
            >
                 <div onClick={() => { triggerHaptic('click'); onOpenTools(); }} className="w-full h-full flex flex-col items-center justify-center relative z-10">
                     <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="p-2 bg-white/5 rounded-2xl border border-white/10 text-primary group-hover:scale-110 transition-transform mb-1">
                        <Icons.Calculator size={20} />
                     </div>
                     <div className="text-[10px] font-black text-white uppercase tracking-widest">OUTILS</div>
                 </div>
            </SectionCard>

             {/* 7. LIBRARY WIDGET */}
             <SectionCard 
                className="p-0 flex flex-col items-center justify-center gap-2 group h-24 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden relative col-span-2"
            >
                 <div onClick={() => { triggerHaptic('click'); navigate('/library'); }} className="w-full h-full flex flex-row items-center justify-between px-6 relative z-10">
                     <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/5 rounded-2xl border border-white/10 text-white group-hover:scale-110 transition-transform">
                            <Icons.Dumbbell size={20} />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-white italic">BIBLIOTHÈQUE</div>
                            <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">{library.filter(l => !l.isArchived).length} EXERCICES</div>
                        </div>
                     </div>
                     <Icons.ChevronRight size={20} className="text-secondary/50" />
                 </div>
            </SectionCard>

        </div>

        {/* HISTORY MODAL */}
        {showHistoryModal && (
            <Modal title="Calendrier" onClose={() => setShowHistoryModal(false)}>
                 <div className="space-y-6">
                    {/* Month Nav & Toggle */}
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center px-2 bg-white/5 p-2 rounded-xl border border-white/5">
                            <button onClick={() => { triggerHaptic('click'); setCalDate(new Date(curYear, curMonth - 1)); }} className="p-2 text-secondary hover:text-white"><Icons.ChevronLeft size={16} /></button>
                            <h3 className="text-sm font-bold uppercase tracking-widest">{calDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                            <button onClick={() => { triggerHaptic('click'); setCalDate(new Date(curYear, curMonth + 1)); }} className="p-2 text-secondary hover:text-white"><Icons.ChevronRight size={16} /></button>
                        </div>
                        
                        <div className="flex bg-surface2/50 p-1 rounded-xl">
                            <button 
                                onClick={() => setCalendarMode('muscle')} 
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-colors ${calendarMode === 'muscle' ? 'bg-surface text-white shadow-sm' : 'text-secondary'}`}
                            >
                                Muscles
                            </button>
                            <button 
                                onClick={() => setCalendarMode('type')} 
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-colors ${calendarMode === 'type' ? 'bg-surface text-white shadow-sm' : 'text-secondary'}`}
                            >
                                Mouvements
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {['L','M','M','J','V','S','D'].map(d => <div key={d} className="text-center text-[10px] font-bold text-secondary/40">{d}</div>)}
                        {Array.from({ length: emptyDays }).map((_, i) => <div key={i} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const daySessions = history.filter(s => {
                                const d = new Date(s.startTime);
                                return d.getDate() === day && d.getMonth() === curMonth && d.getFullYear() === curYear;
                            });
                            
                            const count = daySessions.length;
                            // Last session used for Fatigue indicator
                            const lastSession = daySessions[daySessions.length - 1];
                            const fatigueScore = lastSession ? lastSession.fatigue : null;

                            // Collect unique markers (Muscle or Type)
                            const markers = new Set<string>();
                            daySessions.forEach(s => {
                                s.exercises.forEach(e => {
                                    const l = library.find(lib => lib.id === e.exerciseId);
                                    if (l) {
                                        if (calendarMode === 'muscle') markers.add(l.muscle);
                                        else markers.add(l.type);
                                    }
                                });
                            });
                            
                            // Limit to 4 dots max to prevent overflow
                            const dots = Array.from(markers).slice(0, 4);

                            return (
                                <button 
                                    key={i} 
                                    onClick={() => { triggerHaptic('click'); setSelectedDate(new Date(curYear, curMonth, day)); }} 
                                    className={`aspect-square flex flex-col items-center justify-between py-1.5 rounded-xl text-xs transition-all relative overflow-hidden ${count > 0 ? 'bg-surface2 border border-white/5' : 'text-secondary/50 hover:bg-white/5 border border-transparent'}`}
                                >
                                    {/* Fatigue Pill (Vertical, Top Left) */}
                                    {fatigueScore && count > 0 && (
                                        <div 
                                            className="absolute top-1.5 left-1.5 w-1 h-2.5 rounded-full" 
                                            style={{ backgroundColor: FATIGUE_COLORS[fatigueScore] }} 
                                        />
                                    )}
                                    
                                    {/* Date Number */}
                                    <span className={`font-bold ${count > 0 ? 'text-white' : ''}`}>{day}</span>
                                    
                                    {/* Activity Dots (FitNotes Style) */}
                                    <div className="flex gap-0.5 h-1.5 items-end">
                                        {dots.map((m, idx) => (
                                            <div 
                                                key={idx} 
                                                className="w-1.5 h-1.5 rounded-full" 
                                                style={{ backgroundColor: calendarMode === 'muscle' ? MUSCLE_COLORS[m] : TYPE_COLORS[m as keyof typeof TYPE_COLORS] }} 
                                            />
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Modal>
        )}

        {showNotesModal && (
            <Modal title="Carnet de bord" onClose={() => setShowNotesModal(false)}>
                <div className="space-y-4">
                    {allNotes.length > 0 ? (
                        allNotes.map((n, i) => (
                            <div key={i} className="bg-surface2/30 p-4 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase text-secondary">{new Date(n.date).toLocaleDateString()}</span>
                                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                                        <span className="text-[9px] text-secondary/70 uppercase truncate max-w-[120px]">{n.session}</span>
                                    </div>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface2 border border-white/5" style={{ color: FATIGUE_COLORS[n.fatigue] }}>
                                        RPE {n.fatigue}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-end">
                                    <div className="font-bold text-primary text-sm">{n.exercise}</div>
                                    <div className="text-[10px] font-mono font-bold text-white bg-primary/10 px-2 py-0.5 rounded text-right">{n.perf}</div>
                                </div>
                                
                                <div className="text-xs text-white/80 italic font-medium leading-relaxed border-l-2 border-primary/30 pl-2">
                                    "{n.note}"
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-secondary">
                            Aucune note enregistrée. Ajoutez des notes lors de vos séances.
                        </div>
                    )}
                </div>
            </Modal>
        )}
        
        {selectedDate && (
            <Modal title={showHistoryProgramPicker ? "Ajouter une séance" : selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })} onClose={() => { setSelectedDate(null); setShowHistoryProgramPicker(false); }}>
              {!showHistoryProgramPicker ? (
                  <div className="space-y-3">
                      {history.filter(s => {
                          const d = new Date(s.startTime);
                          return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                      }).map(s => {
                          const muscles = Array.from(new Set(s.exercises.map(e => {
                              const l = library.find(lib => lib.id === e.exerciseId);
                              return l?.muscle;
                          }).filter(Boolean))).slice(0, 3).join(' • ');
                          
                          return (
                            <div key={s.id} onClick={() => { setSelectedDate(null); setShowHistoryModal(false); navigate(`/history/edit/${s.id}`); }} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/20 cursor-pointer flex justify-between items-center group transition-colors">
                                    <div>
                                        <div className="font-bold text-white">{s.sessionName}</div>
                                        <div className="text-[10px] text-secondary uppercase">{s.programName}</div>
                                        <div className="text-[10px] text-primary/70 font-medium mt-0.5">{muscles}</div>
                                    </div>
                                    <Icons.Settings size={16} className="text-secondary group-hover:text-white" />
                            </div>
                          );
                      })}
                      
                      {history.filter(s => {
                          const d = new Date(s.startTime);
                          return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                      }).length === 0 && <div className="text-center text-secondary/50 italic py-4">Rien ce jour-là</div>}

                      <button onClick={() => setShowHistoryProgramPicker(true)} className="w-full py-4 bg-white/10 text-white font-black uppercase rounded-[2rem] border border-white/10 active:scale-95 transition-all hover:bg-white/20">
                          + Ajouter
                      </button>
                  </div>
              ) : (
                  <div className="space-y-4">
                      <button onClick={() => { setShowHistoryProgramPicker(false); }} className="text-xs font-bold uppercase text-secondary mb-2">← Retour</button>
                      <div className="space-y-2">
                         {programs.map(prog => (
                             <div key={prog.id} className="space-y-2">
                                 <h4 className="font-bold text-xs text-secondary uppercase px-2">{prog.name}</h4>
                                 {prog.sessions.map(sess => (
                                     <button key={sess.id} onClick={() => { 
                                         let start = new Date(selectedDate);
                                         const now = new Date();
                                         const isToday = start.getDate() === now.getDate() && start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
                                         
                                         let mode: 'active' | 'log' = 'active';
                                         if (isToday) { start = now; mode = 'active'; } 
                                         else { start.setHours(12, 0, 0, 0); mode = 'log'; }

                                         onStartSession(prog.name, sess, mode);
                                         setShowHistoryProgramPicker(false);
                                         setSelectedDate(null);
                                         setShowHistoryModal(false);
                                     }} className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-xl flex justify-between items-center group transition-colors">
                                         <span className="font-bold text-sm">{sess.name}</span>
                                         <Icons.Plus size={16} className="text-primary opacity-0 group-hover:opacity-100" />
                                     </button>
                                 ))}
                             </div>
                         ))}
                      </div>
                  </div>
              )}
          </Modal>
        )}
      </div>
    );
};
