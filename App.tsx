
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, WorkoutSession, Program, LibraryExercise, SetRecord, AccentColor, BeforeInstallPromptEvent, ExerciseType, ProgramSession } from './types';
import { STORAGE_KEYS, Icons, THEMES, TYPE_COLORS, FATIGUE_COLORS } from './constants';
import { EXERCISE_TYPE_LIST } from './data/exerciseTypes';
import { getExerciseStats, calculate1RM, downloadFile, formatDuration, parseDuration, generateCSV, smartFormatTime, triggerHaptic } from './utils';
import { DEFAULT_LIBRARY } from './data/exerciseLibrary';
import { DEFAULT_PROGRAMS } from './data/programs';
import { EQUIPMENTS } from './data/equipments';
import { storage } from './services/storage';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, Cell, ComposedChart, LabelList, ReferenceArea } from 'recharts';

const MUSCLE_COLORS: Record<string, string> = {
  'Pectoraux': '#58a6ff', 'Dos': '#3fb950', 'Jambes': '#d29922', 'Épaules': '#a371f7',
  'Bras': '#f85149', 'Abdos': '#00ffcc', 'Mollets': '#ff7b72', 'Avant-bras': '#79c0ff', 'Cardio': '#8b949e', 'Cou': '#79c0ff'
};

const MUSCLE_ORDER = ['Pectoraux', 'Dos', 'Épaules', 'Bras', 'Avant-bras', 'Abdos', 'Jambes', 'Mollets', 'Cou', 'Cardio'];

const RATIO_ZONES = {
    global: [
        { max: 2.0, label: "Fondation", color: "#e0e0e0" },
        { max: 3.0, label: "Intermédiaire", color: "#e3f2fd" },
        { max: 4.0, label: "Avancé", color: "#e8f5e9" },
        { max: 5.0, label: "Elite", color: "#fff3e0" },
        { max: 10.0, label: "Pro", color: "#ffebee" }
    ],
    squat: [
        { max: 1.25, label: "Fondation", color: "#e0e0e0" },
        { max: 1.75, label: "Intermédiaire", color: "#e3f2fd" },
        { max: 2.25, label: "Avancé", color: "#e8f5e9" },
        { max: 2.75, label: "Elite", color: "#fff3e0" },
        { max: 10.0, label: "Pro", color: "#ffebee" }
    ],
    bench: [
        { max: 0.75, label: "Fondation", color: "#e0e0e0" },
        { max: 1.25, label: "Intermédiaire", color: "#e3f2fd" },
        { max: 1.75, label: "Avancé", color: "#e8f5e9" },
        { max: 2.25, label: "Elite", color: "#fff3e0" },
        { max: 10.0, label: "Pro", color: "#ffebee" }
    ],
    deadlift: [
        { max: 1.5, label: "Fondation", color: "#e0e0e0" },
        { max: 2.0, label: "Intermédiaire", color: "#e3f2fd" },
        { max: 2.5, label: "Avancé", color: "#e8f5e9" },
        { max: 3.0, label: "Elite", color: "#fff3e0" },
        { max: 10.0, label: "Pro", color: "#ffebee" }
    ]
};

const getAccentStyle = (color: AccentColor) => {
  const theme = THEMES[color] || THEMES.blue;
  return { '--primary': theme.primary, '--primary-glow': theme.glow } as React.CSSProperties;
};

// --- COMPONENTS ---

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children?: React.ReactNode }) => (
  <div className="fixed inset-0 z-[400] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-surface border border-border w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
      <div className="p-6 border-b border-border flex justify-between items-center bg-surface2/20">
        <h3 className="text-xl font-black italic uppercase">{title}</h3>
        <button onClick={() => { triggerHaptic('click'); onClose(); }} className="p-2 text-secondary hover:text-white transition-colors">✕</button>
      </div>
      <div className="p-6 overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

const EditorHeader = ({ 
  title, 
  onCancel, 
  onSave, 
  saveLabel = "Sauver", 
  cancelLabel = "Annuler",
  children 
}: { 
  title?: string, 
  onCancel: () => void, 
  onSave: () => void, 
  saveLabel?: string, 
  cancelLabel?: string,
  children?: React.ReactNode 
}) => (
  <div className="flex justify-between items-center px-1 mb-6 gap-2">
    <button onClick={() => { triggerHaptic('click'); onCancel(); }} className="px-4 py-2 text-danger text-[10px] font-bold uppercase tracking-wider bg-danger/10 border border-danger/20 rounded-full transition-all active:scale-95 whitespace-nowrap">
      {cancelLabel}
    </button>
    <div className="flex-1 text-center min-w-0">
      {children || <h2 className="text-xl font-black italic uppercase leading-tight truncate">{title}</h2>}
    </div>
    <button onClick={() => { triggerHaptic('success'); onSave(); }} className="px-6 py-3 bg-success text-white text-xs font-black rounded-full uppercase shadow-lg shadow-success/20 active:scale-95 whitespace-nowrap">
      {saveLabel}
    </button>
  </div>
);

const SectionCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-surface border border-border rounded-[2rem] shadow-sm ${className}`}>
        {children}
    </div>
);

const moveItem = <T,>(arr: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= arr.length) return arr;
  const newArr = [...arr];
  const [item] = newArr.splice(from, 1);
  newArr.splice(to, 0, item);
  return newArr;
};

// --- MAIN APP ---

export default function App() {
  const [view, setView] = useState<View>(View.Dashboard);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [calDate, setCalDate] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);

  // Safety lock: prevents saving empty state to storage before initial load is complete
  const [isLoaded, setIsLoaded] = useState(false);

  const [restTarget, setRestTarget] = useState<number | null>(null); 
  const [restTime, setRestTime] = useState<number | null>(null); 
  const [showGo, setShowGo] = useState(false);

  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [previewSession, setPreviewSession] = useState<{ programName: string, session: ProgramSession } | null>(null);
  
  const [showAddExoModal, setShowAddExoModal] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<{ message: string; subMessage?: string; onConfirm: () => void; variant?: 'danger' | 'primary' } | null>(null);
  
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const [editingExercise, setEditingExercise] = useState<LibraryExercise | null>(null);
  const [libraryFilter, setLibraryFilter] = useState('');
  
  const [programExoPicker, setProgramExoPicker] = useState<number | null>(null); 
  
  const [oneRMWeight, setOneRMWeight] = useState("100");
  const [oneRMReps, setOneRMReps] = useState("5");
  const est1RM = useMemo(() => calculate1RM(oneRMWeight, oneRMReps), [oneRMWeight, oneRMReps]);

  const [convBB, setConvBB] = useState("");
  const [convDB, setConvDB] = useState("");

  const [analyticsExo, setAnalyticsExo] = useState<string>('');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d'|'30d'|'90d'|'1y'|'all'>('30d');
  const [analyticsMetric, setAnalyticsMetric] = useState<'max'|'volume'|'tonnage'>('max');
  
  const [volumeChartMode, setVolumeChartMode] = useState<'muscle' | 'type'>('muscle');
  const [sbdViewMode, setSbdViewMode] = useState<'tracking' | 'ratio'>('ratio');
  const [sbdRatioCategory, setSbdRatioCategory] = useState<'global'|'squat'|'bench'|'deadlift'>('global');
  
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedDaySessions, setSelectedDaySessions] = useState<WorkoutSession[] | null>(null);

  const getExerciseById = useCallback((id: number): LibraryExercise | undefined => {
      return library.find(l => l.id === id);
  }, [library]);

  // --- ANALYTICS DATA ---
  const progData = useMemo(() => {
        if (!analyticsExo) return [];
        const targetId = parseInt(analyticsExo);
        if (isNaN(targetId)) return [];
        
        const now = Date.now();
        let minTime = 0;
        switch(analyticsPeriod) {
            case '7d': minTime = now - 7 * 24 * 3600 * 1000; break;
            case '30d': minTime = now - 30 * 24 * 3600 * 1000; break;
            case '90d': minTime = now - 90 * 24 * 3600 * 1000; break;
            case '1y': minTime = now - 365 * 24 * 3600 * 1000; break;
            case 'all': minTime = 0; break;
        }

        const filteredHistory = history.filter(s => s.startTime >= minTime).sort((a,b) => a.startTime - b.startTime);

        return filteredHistory.map(s => {
            const ex = s.exercises.find(e => e.exerciseId === targetId);
            if (!ex) return null;
            const doneSets = ex.sets.filter(st => st.done);
            if (doneSets.length === 0) return null;
            let value = 0;
            if (analyticsMetric === 'max') {
                value = Math.max(...doneSets.map(ds => parseFloat(ds.weight) || 0));
            } else if (analyticsMetric === 'volume') {
                value = doneSets.length;
            } else if (analyticsMetric === 'tonnage') {
                value = doneSets.reduce((acc, ds) => acc + ((parseFloat(ds.weight)||0) * (parseFloat(ds.reps)||0)), 0);
            }
            return {
                date: new Date(s.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                fullDate: new Date(s.startTime).toLocaleDateString('fr-FR'),
                value: value
            };
        }).filter(d => d !== null);

  }, [history, analyticsExo, analyticsPeriod, analyticsMetric]);

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
                s.exercises.forEach(e => {
                    const lib = getExerciseById(e.exerciseId);
                    if (!lib) return;
                    if (volumeChartMode === 'muscle') {
                        const hardSets = e.sets.filter(st => {
                            if (!st.done) return false;
                            const rir = parseInt(st.rir || '10');
                            return rir <= 4;
                        }).length; 
                        const muscle = lib.muscle || 'Autre';
                        counts[muscle] = (counts[muscle] || 0) + hardSets;
                    } else {
                        const doneSets = e.sets.filter(st => st.done).length;
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

  const sbdData = useMemo(() => {
        const sortedHistory = history.slice().sort((a,b) => a.startTime - b.startTime);
        const currentPR = { squat: 0, bench: 0, dead: 0 };
        const dataPoints: any[] = [];
        const SQUAT_ID = 33; 
        const BENCH_ID = 1;
        const DEAD_ID = 20;

        sortedHistory.forEach(s => {
             const getSessionE1RM = (exId: number, isDB: boolean = false) => {
                 const ex = s.exercises.find(e => e.exerciseId === exId);
                 if (!ex) return 0;
                 const doneSets = ex.sets.filter(st => st.done);
                 if (doneSets.length === 0) return 0;
                 return Math.max(...doneSets.map(st => {
                     let w = parseFloat(st.weight) || 0;
                     if (isDB) w = (w * 2) / 0.80; 
                     return calculate1RM(w, st.reps);
                 }));
             };
             const bbSquat = getSessionE1RM(SQUAT_ID);
             const bbBench = getSessionE1RM(BENCH_ID);
             const bbDead = getSessionE1RM(DEAD_ID);

             if (bbSquat > currentPR.squat) currentPR.squat = bbSquat;
             if (bbBench > currentPR.bench) currentPR.bench = bbBench;
             if (bbDead > currentPR.dead) currentPR.dead = bbDead;

             const totalSBD = currentPR.squat + currentPR.bench + currentPR.dead;
             const bw = parseFloat(s.bodyWeight) || 0;

             if (totalSBD > 0 || bw > 0) {
                 const ratioGlobal = (totalSBD > 0 && bw > 0) ? parseFloat((totalSBD / bw).toFixed(2)) : null;
                 dataPoints.push({
                     date: new Date(s.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                     fullDate: new Date(s.startTime).toLocaleDateString('fr-FR'),
                     sbd: totalSBD > 0 ? totalSBD : null,
                     bw: bw > 0 ? bw : null,
                     ratioGlobal,
                     ratioSquat: (currentPR.squat > 0 && bw > 0) ? parseFloat((currentPR.squat / bw).toFixed(2)) : null,
                     ratioBench: (currentPR.bench > 0 && bw > 0) ? parseFloat((currentPR.bench / bw).toFixed(2)) : null,
                     ratioDeadlift: (currentPR.dead > 0 && bw > 0) ? parseFloat((currentPR.dead / bw).toFixed(2)) : null
                 });
             }
        });
        return dataPoints;
  }, [history]);

  // --- INITIALIZATION ---
  useEffect(() => {
    let loadedLib = storage.library.load();
    let loadedProgs = storage.programs.load();
    let loadedHist = storage.history.load();
    let loadedSess = storage.session.load();
    const t = storage.theme.load() as AccentColor;
    
    if (loadedLib.length === 0) loadedLib = DEFAULT_LIBRARY;
    if (loadedProgs.length === 0) loadedProgs = DEFAULT_PROGRAMS;

    setLibrary(loadedLib);
    setPrograms(loadedProgs);
    setHistory(loadedHist);
    if (t) setAccentColor(t);
    if (loadedSess) {
      setSession(loadedSess);
      setView(View.Workout);
      setElapsed(Math.floor((Date.now() - loadedSess.startTime) / 1000));
    }
    // Enable saving ONLY after initial load is complete
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Save Effect - Guarded by isLoaded
  useEffect(() => {
    if (!isLoaded) return;
    storage.history.save(history);
    storage.programs.save(programs);
    storage.library.save(library);
    storage.theme.save(accentColor);
  }, [history, programs, library, accentColor, isLoaded]);

  useEffect(() => {
    let interval: number;
    if (session) {
      interval = window.setInterval(() => setElapsed(Math.floor((Date.now() - session.startTime) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [session]);

  // --- REST TIMER ---
  useEffect(() => {
    if (!restTarget) {
        if (restTime !== null) setRestTime(null);
        return;
    }
    const updateTimer = () => {
        const now = Date.now();
        const diff = Math.ceil((restTarget - now) / 1000);
        if (diff <= 0) {
            if (!showGo) {
                setRestTime(0);
                setShowGo(true);
                triggerHaptic('warning'); // Heavy vibration pattern for Go
                setTimeout(() => {
                    setShowGo(false);
                    setRestTarget(null);
                }, 4000);
            }
        } else {
            setRestTime(diff);
        }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [restTarget, showGo]);

  const timerString = useMemo(() => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [elapsed]);

  const updateSet = (exoIdx: number, setIdx: number, field: keyof SetRecord, value: any) => {
    if (!session) return;
    const newSession = { ...session };
    const exo = newSession.exercises[exoIdx];
    const wasDone = exo.sets[setIdx].done;
    
    const updates: Partial<SetRecord> = { [field]: value };
    
    if (field === 'done') {
        if (value === true) {
            updates.completedAt = Date.now();
            triggerHaptic('success'); // Validation feedback
        } else {
            updates.completedAt = undefined;
            triggerHaptic('click'); // Uncheck feedback
        }
    }
    exo.sets[setIdx] = { ...exo.sets[setIdx], ...updates };

    if (field === 'done' && value === true && !wasDone) {
      setRestTarget(Date.now() + (exo.rest * 1000));
    }
    setSession(newSession);
    storage.session.save(newSession);
  };

  const handleDeleteExo = (id: number) => {
    triggerHaptic('click');
    const inHistory = history.some(s => s.exercises.some(e => e.exerciseId === id));
    if (inHistory) {
         setPendingConfirm({
            message: "Archiver l'exercice ?",
            subMessage: "Cet exercice est utilisé dans votre historique. Il sera masqué des listes mais conservé dans les archives.",
            variant: 'danger',
            onConfirm: () => setLibrary(prev => prev.map(l => l.id === id ? { ...l, isArchived: true } : l))
         });
    } else {
         setPendingConfirm({
            message: "Supprimer définitivement ?",
            subMessage: "Cet exercice n'a jamais été utilisé. La suppression sera totale.",
            variant: 'danger',
            onConfirm: () => setLibrary(prev => prev.filter(l => l.id !== id))
        });
    }
  };

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      triggerHaptic('tick');
      setLibrary(prev => prev.map(l => l.id === id ? { ...l, isFavorite: !l.isFavorite } : l));
  };

  const startSession = (progName: string, sess: ProgramSession) => {
      triggerHaptic('success');
      setSession({
        id: Date.now(),
        programName: progName,
        sessionName: sess.name,
        startTime: Date.now(),
        bodyWeight: history[0]?.bodyWeight || "",
        fatigue: "3",
        exercises: sess.exos.map(e => ({
            exerciseId: e.exerciseId,
            target: `${e.sets} x ${e.reps}`,
            rest: e.rest,
            targetRir: e.targetRir, 
            isBonus: false,
            notes: "",
            sets: Array(e.sets).fill(null).map(() => ({ weight: "", reps: "", done: false, rir: e.targetRir || "" }))
        }))
      });
      setView(View.Workout);
      setPreviewSession(null);
  };

  // --- RENDER METHODS ---
  const renderDashboard = () => {
    const curMonth = calDate.getMonth();
    const curYear = calDate.getFullYear();
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const firstDay = new Date(curYear, curMonth, 1).getDay();
    const emptyDays = firstDay === 0 ? 6 : firstDay - 1;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <SectionCard className="p-5">
          <div className="flex justify-between items-center mb-6 px-2">
            <button onClick={() => { triggerHaptic('click'); setCalDate(new Date(curYear, curMonth - 1)); }} className="p-3 text-primary text-2xl font-black">◀</button>
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary">{calDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => { triggerHaptic('click'); setCalDate(new Date(curYear, curMonth + 1)); }} className="p-3 text-primary text-2xl font-black">▶</button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['L','M','M','J','V','S','D'].map(d => <div key={d} className="text-center text-[9px] font-bold text-secondary/40 mb-2">{d}</div>)}
            {Array.from({ length: emptyDays }).map((_, i) => <div key={i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const daySessions = history.filter(s => {
                const d = new Date(s.startTime);
                return d.getDate() === day && d.getMonth() === curMonth && d.getFullYear() === curYear;
              });
              const count = daySessions.length;
              const intensity = count > 0 ? Math.min(100, daySessions.reduce((acc, s) => acc + s.exercises.length, 0) * 10) : 0;
              const typesInDay = new Set<ExerciseType>();
              daySessions.forEach(s => s.exercises.forEach(e => {
                  const hasDoneSets = e.sets.some(st => st.done);
                  if (hasDoneSets) {
                      const lib = getExerciseById(e.exerciseId);
                      if (lib) typesInDay.add(lib.type);
                  }
              }));
              const typeDots = Array.from(typesInDay);
              const lastSession = daySessions[daySessions.length - 1];
              const fatigueScore = lastSession ? lastSession.fatigue : null;

              return (
                <button key={i} onClick={() => { if (count > 0) { triggerHaptic('click'); setSelectedDaySessions(daySessions); } }} className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-mono transition-all ${count > 0 ? 'border border-primary/20 shadow-lg' : 'text-secondary/30'}`} style={count > 0 ? { backgroundColor: `rgba(88, 166, 255, ${intensity/100 * 0.4 + 0.1})`, borderColor: 'var(--primary)' } : {}}>
                  {fatigueScore && <div className="absolute top-1.5 left-1.5 w-1 h-3 rounded-full" style={{ backgroundColor: FATIGUE_COLORS[fatigueScore] }} />}
                  <span className={count > 0 ? 'text-white font-bold' : ''}>{day}</span>
                  {count > 0 && (
                      <div className="flex gap-1 mt-1">
                          {typeDots.map(t => (
                              <div key={t} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[t] }} />
                          ))}
                      </div>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => { triggerHaptic('click'); setView(View.Records); }} className="bg-surface border border-border p-6 rounded-[2rem] flex flex-col items-center gap-2 active:scale-95 transition-all">
            <span className="text-gold"><Icons.Records /></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Records</span>
          </button>
          <button onClick={() => { triggerHaptic('click'); setView(View.Analytics); }} className="bg-surface border border-border p-6 rounded-[2rem] flex flex-col items-center gap-2 active:scale-95 transition-all">
            <span className="text-primary"><Icons.Analytics /></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Progrès</span>
          </button>
        </div>

        <button onClick={() => { triggerHaptic('click'); setView(View.Programs); }} className="w-full py-6 bg-primary text-background font-black rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase text-lg active:scale-95 transition-all">
          <Icons.Fitness /> Commencer
        </button>
      </div>
    );
  };

  const renderWorkout = () => {
      if (!session) return null;
      const allSetsDone = session.exercises.every(ex => ex.sets.every(s => s.done));
      
      return (
      <div className="space-y-6 pb-40 animate-in fade-in duration-500">
        <div className="flex justify-between items-center px-1">
           <button onClick={() => { triggerHaptic('error'); setPendingConfirm({
            message: "Annuler la séance ?",
            subMessage: "La progression actuelle sera perdue.",
            variant: "danger",
            onConfirm: () => { 
                setRestTarget(null); setRestTime(null); setShowGo(false);
                setSession(null); storage.session.save(null); setView(View.Dashboard); 
            }
          })}} className="px-4 py-2 text-danger text-[10px] font-bold uppercase bg-danger/10 border border-danger/20 rounded-full transition-all active:scale-95">Annuler</button>
          <div className="flex-1 text-center">
            <h2 className="text-xl font-black italic uppercase leading-tight">{session.sessionName}</h2>
            <div className="text-secondary text-[10px] font-bold uppercase tracking-widest">{session.programName}</div>
          </div>
          <button 
            disabled={!allSetsDone}
            onClick={() => { triggerHaptic('click'); setPendingConfirm({
            message: "Terminer la séance ?",
            onConfirm: () => {
              triggerHaptic('success');
              setRestTarget(null); setRestTime(null); setShowGo(false);
              const finishedSession = { ...session };
              finishedSession.exercises.forEach(ex => {
                  const libDef = getExerciseById(ex.exerciseId);
                  if (libDef?.type === 'Cardio') {
                      ex.sets.forEach(s => { if (s.rir) s.rir = String(parseDuration(s.rir)); });
                  }
                  if (libDef?.type === 'Isométrique' || libDef?.type === 'Étirement') {
                      ex.sets.forEach(s => { s.reps = String(parseDuration(s.reps)); });
                  }
              });
              const finished = { ...finishedSession, endTime: Date.now() };
              setHistory(prev => [finished, ...prev]);
              setSession(null);
              storage.session.save(null);
              setView(View.Dashboard);
            }
          })}} className={`px-6 py-3 text-xs font-black rounded-full uppercase shadow-lg transition-all ${allSetsDone ? 'bg-success text-white shadow-success/20' : 'bg-surface2 text-secondary/30 cursor-not-allowed border border-border/50'}`}>Finir</button>
        </div>

        <div className="bg-surface border border-border px-6 py-4 rounded-[2rem] flex items-center justify-between gap-4">
             <div className="flex-1 space-y-1">
                 <label className="text-[9px] font-bold uppercase text-secondary">Poids de Corps (kg)</label>
                 <input type="text" inputMode="decimal" value={session.bodyWeight} onChange={e => {setSession({...session, bodyWeight: e.target.value}); storage.session.save({...session, bodyWeight: e.target.value})}} className="w-full bg-background border border-border p-2 rounded-xl text-sm font-mono font-bold text-center focus:border-primary outline-none" placeholder="Ex: 80" />
             </div>
             <div className="flex-1 space-y-1">
                 <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold uppercase text-secondary">Forme (1-5)</label>
                    <button className="text-[9px] text-primary" onClick={() => alert("1 = Épuisé\n5 = Olympique")}>?</button>
                 </div>
                 <input type="number" min="1" max="5" value={session.fatigue} onChange={e => {setSession({...session, fatigue: e.target.value}); storage.session.save({...session, fatigue: e.target.value})}} className="w-full bg-background border border-border p-2 rounded-xl text-sm font-mono font-bold text-center focus:border-primary outline-none" placeholder="3" />
             </div>
        </div>

        {session.exercises.map((exo, eIdx) => {
          const libEx = getExerciseById(exo.exerciseId);
          const stats = getExerciseStats(exo.exerciseId, history, libEx?.type);
          const isCardio = libEx?.type === 'Cardio';
          const isStatic = libEx?.type === 'Isométrique' || libEx?.type === 'Étirement';
          const bestSet = [...exo.sets].filter(s => s.done).sort((a,b) => calculate1RM(b.weight, b.reps) - calculate1RM(a.weight, a.reps))[0];
          const currentE1RM = (bestSet && !isCardio && !isStatic) ? calculate1RM(bestSet.weight, bestSet.reps) : 0;
          const delta = currentE1RM - stats.lastE1RM;
          const deltaStr = `(${delta > 0 ? '▲ +' : delta < 0 ? '▼' : '▬'}${delta.toFixed(1)}kg)`;
          const deltaClass = delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-secondary';

          return (
            <SectionCard key={eIdx} className="overflow-hidden animate-in slide-in-from-bottom duration-300">
              <div className="p-6 border-b border-border bg-surface2/20">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black italic uppercase leading-none">{libEx?.name || `Exo #${exo.exerciseId}`}</h3>
                        {libEx?.tips && (
                            <button onClick={() => { triggerHaptic('click'); setPendingConfirm({
                                message: libEx.name,
                                subMessage: [
                                    ...(libEx.tips.setup ? ["SETUP:", ...libEx.tips.setup] : []),
                                    ...(libEx.tips.exec ? ["EXEC:", ...libEx.tips.exec] : []),
                                    ...(libEx.tips.mistake ? ["ERREURS:", ...libEx.tips.mistake] : [])
                                ].join('\n'),
                                onConfirm: () => {}, variant: 'primary'
                            })}} className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 rounded-full border border-primary/40">?</button>
                        )}
                        <button 
                           onClick={() => setExpandedNotes(prev => ({...prev, [eIdx]: !prev[eIdx]}))} 
                           className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-all ${exo.notes ? 'bg-secondary/20 text-white border-secondary/40' : 'text-secondary/50 border-secondary/20 hover:text-white'}`}
                        >
                           <Icons.Note />
                        </button>
                    </div>
                    
                    <div className="text-[10px] font-bold uppercase tracking-wider text-secondary mb-2">
                        Objectif : {exo.target} | {isCardio ? "Durée" : "RIR"} {exo.targetRir || '-'} | REST {exo.rest}s
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{libEx?.muscle || 'Muscle'}</span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border" style={{ backgroundColor: `${TYPE_COLORS[libEx?.type || 'Isolation']}20`, borderColor: `${TYPE_COLORS[libEx?.type || 'Isolation']}40`, color: TYPE_COLORS[libEx?.type || 'Isolation'] }}>
                         {libEx?.type}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface2 text-secondary">{EQUIPMENTS[libEx?.equipment || 'OT']}</span>
                      {!isCardio && !isStatic && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gold/10 border border-gold/30 rounded-full">
                                <span className="text-[8px] font-black text-gold uppercase">PR 1RM:</span>
                                <span className="text-[10px] font-mono text-white font-bold">{stats.pr}kg</span>
                          </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                      <button onClick={() => {
                          triggerHaptic('error');
                          setPendingConfirm({
                            message: "Supprimer cet exercice ?",
                            subMessage: "L'exercice sera retiré de la séance en cours.",
                            variant: 'danger',
                            onConfirm: () => {
                              const newExos = [...session.exercises];
                              newExos.splice(eIdx, 1);
                              setSession({...session, exercises: newExos});
                            }
                          });
                      }} className="text-danger/40 p-2 hover:text-danger transition-colors">✕</button>
                      <div className="flex gap-1">
                        {eIdx > 0 && <button onClick={() => { triggerHaptic('click'); setSession({...session, exercises: moveItem(session.exercises, eIdx, eIdx - 1)})}} className="text-secondary hover:text-primary p-1">▲</button>}
                        {eIdx < session.exercises.length - 1 && <button onClick={() => { triggerHaptic('click'); setSession({...session, exercises: moveItem(session.exercises, eIdx, eIdx + 1)})}} className="text-secondary hover:text-primary p-1">▼</button>}
                      </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-background/40 p-3 rounded-2xl border border-border/40">
                      <div className="text-[9px] font-bold uppercase text-secondary mb-1">Dernière Séance</div>
                      <div className="text-[9px] font-mono text-secondary italic break-words">{stats.lastDetailed}</div>
                   </div>
                   {!isCardio && !isStatic && (
                       <div className="bg-background/40 p-3 rounded-2xl border border-border/40 text-center flex flex-col justify-center">
                          <div className="text-[9px] font-bold uppercase text-secondary mb-1">e1RM Session</div>
                          <div className="text-xs font-mono font-bold flex items-center justify-center gap-2">
                            <span className="text-white">{currentE1RM}kg</span>
                            <span className="text-secondary/50">|</span>
                            <span className={deltaClass}>{deltaStr}</span>
                          </div>
                       </div>
                   )}
                </div>
              </div>

              {expandedNotes[eIdx] && (
                 <div className="px-6 py-2 animate-in slide-in-from-top duration-200 border-b border-border/30">
                    <textarea 
                       value={exo.notes || ''} 
                       onChange={(e) => {
                          const newExos = [...session.exercises];
                          newExos[eIdx].notes = e.target.value;
                          setSession({...session, exercises: newExos});
                       }}
                       maxLength={280}
                       rows={2}
                       className="w-full bg-background border border-border rounded-xl p-3 text-xs font-mono outline-none focus:border-primary placeholder-secondary/30"
                       placeholder="Note pour la prochaine fois..."
                    />
                 </div>
              )}

              <div className="p-6 space-y-4">
                {exo.sets.map((set, sIdx) => {
                  const isSetValid = set.weight !== "" && set.reps !== "";
                  return (
                  <div key={sIdx} className={`p-4 rounded-2xl border transition-all ${set.done ? 'bg-success/5 border-success/30' : 'bg-surface2/40 border-transparent'}`}>
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-[10px] font-mono font-bold text-secondary">{sIdx+1}</div>
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold uppercase text-secondary block text-center mb-1">{isCardio ? "Niveau" : isStatic ? "Lest" : "Poids"}</label>
                        <input type="text" inputMode="decimal" value={set.weight} onChange={e => updateSet(eIdx, sIdx, 'weight', e.target.value)} className="w-full bg-background border border-border text-center py-2.5 rounded-xl text-sm font-mono focus:border-primary outline-none" placeholder={isCardio ? "Lvl" : "kg"} />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold uppercase text-secondary block text-center mb-1">{isCardio ? "Dist." : isStatic ? "Durée" : "Reps"}</label>
                        <input type="text" inputMode="decimal" value={set.reps} onChange={e => updateSet(eIdx, sIdx, 'reps', e.target.value)} onBlur={e => isStatic && updateSet(eIdx, sIdx, 'reps', smartFormatTime(e.target.value, 'Isométrique'))} className="w-full bg-background border border-border text-center py-2.5 rounded-xl text-sm font-mono focus:border-primary outline-none" placeholder={isCardio ? "m" : isStatic ? "s" : "reps"} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold uppercase text-secondary block text-center mb-1">{isCardio ? "Durée" : "RIR"}</label>
                        <input type="text" inputMode="decimal" value={set.rir} onChange={e => updateSet(eIdx, sIdx, 'rir', e.target.value)} onBlur={e => isCardio && updateSet(eIdx, sIdx, 'rir', smartFormatTime(e.target.value, 'Cardio'))} className="w-full bg-background border border-border text-center py-2.5 rounded-xl text-[10px] font-mono focus:border-primary outline-none" placeholder={isCardio ? "MM:SS" : "RIR"} />
                      </div>
                      <div className="col-span-3 flex gap-1 pt-4">
                        <button disabled={!isSetValid} onClick={() => updateSet(eIdx, sIdx, 'done', !set.done)} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] transition-all flex flex-col items-center justify-center leading-none ${!isSetValid ? 'bg-surface2 text-secondary/20 border border-transparent cursor-not-allowed' : set.done ? 'bg-success text-white' : 'bg-surface2 text-secondary border border-border'}`}>
                             {set.done ? <><span>OK</span>{set.completedAt && <span className="text-[8px] font-mono opacity-80 mt-0.5">{new Date(set.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}</> : 'VAL'}
                        </button>
                        <button onClick={() => {
                          if (set.done) {
                            triggerHaptic('error');
                            setPendingConfirm({ message: "Supprimer la série ?", subMessage: "Cette série est déjà validée.", variant: 'danger', onConfirm: () => {
                                const newExos = [...session.exercises]; newExos[eIdx].sets.splice(sIdx, 1); setSession({...session, exercises: newExos});
                            }});
                          } else {
                            triggerHaptic('click');
                            const newExos = [...session.exercises]; newExos[eIdx].sets.splice(sIdx, 1); setSession({...session, exercises: newExos});
                          }
                        }} className="p-2.5 text-danger/40">✕</button>
                      </div>
                    </div>
                  </div>
                  );
                })}
                <button onClick={() => {
                  triggerHaptic('click');
                  const newExos = [...session.exercises];
                  const last = newExos[eIdx].sets[newExos[eIdx].sets.length-1];
                  newExos[eIdx].sets.push({ weight: last?.weight || "", reps: last?.reps || "", done: false, rir: last?.rir || "" });
                  setSession({...session, exercises: newExos});
                }} className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-primary">+ Ajouter Série</button>
              </div>
            </SectionCard>
          );
        })}
        <button onClick={() => { triggerHaptic('click'); setShowAddExoModal(true); }} className="w-full py-6 border-2 border-dashed border-border rounded-[2rem] text-secondary font-black uppercase">+ Mouvement</button>
      </div>
    );
  };
  const renderEditorProgram = () => {
    if (!editingProgram) return null;
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <EditorHeader
          title={editingProgram.name}
          onCancel={() => setPendingConfirm({ message: "Annuler ?", subMessage: "Modifications perdues.", variant: 'danger', onConfirm: () => { setEditingProgram(null); setView(View.Programs); } })}
          onSave={() => setPendingConfirm({ message: "Sauvegarder ?", variant: 'primary', onConfirm: () => {
              const newProgs = programs.map(p => p.id === editingProgram.id ? editingProgram : p);
              if (!programs.find(p => p.id === editingProgram.id)) newProgs.push(editingProgram);
              setPrograms(newProgs); setEditingProgram(null); setView(View.Programs);
          }})}
        >
          <input value={editingProgram.name} onChange={e => setEditingProgram({...editingProgram, name: e.target.value})} className="bg-transparent border-b border-border text-center w-full text-xl font-black italic uppercase outline-none focus:border-primary" placeholder="Nom du programme" />
        </EditorHeader>

        {(editingProgram.sessions || []).map((sess, sIdx) => (
          <SectionCard key={sess.id} className="overflow-hidden p-6">
             <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-2">
                <input value={sess.name} onChange={e => { const newSess = [...editingProgram.sessions]; newSess[sIdx].name = e.target.value; setEditingProgram({...editingProgram, sessions: newSess}); }} className="bg-transparent font-black italic uppercase text-lg outline-none w-full" placeholder="Nom séance" />
                <button onClick={() => { const newSess = [...editingProgram.sessions]; newSess.splice(sIdx, 1); setEditingProgram({...editingProgram, sessions: newSess}); }} className="text-danger p-2">✕</button>
             </div>
             <div className="space-y-3">
               {(sess.exos || []).map((ex, exIdx) => {
                 const libEx = getExerciseById(ex.exerciseId);
                 const isCardio = libEx?.type === 'Cardio';
                 return (
                   <div key={exIdx} className="bg-surface2/30 p-4 rounded-2xl flex justify-between items-center gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-bold">{libEx?.name || `Exo #${ex.exerciseId}`}</div>
                        <div className="flex gap-2 mt-1">
                           <div className="flex flex-col">
                             <label className="text-[9px] font-bold uppercase text-secondary">Séries</label>
                             <input type="number" value={ex.sets} onChange={e => { const newSess = [...editingProgram.sessions]; newSess[sIdx].exos[exIdx].sets = parseInt(e.target.value); setEditingProgram({...editingProgram, sessions: newSess}); }} className="bg-surface2/50 w-16 py-2 rounded-xl text-center font-mono font-bold text-xs focus:border-primary border border-transparent outline-none" />
                           </div>
                           <div className="flex flex-col">
                             <label className="text-[9px] font-bold uppercase text-secondary">{isCardio ? "Dist/Dur" : "Reps"}</label>
                             <input type="text" value={ex.reps} onChange={e => { const newSess = [...editingProgram.sessions]; newSess[sIdx].exos[exIdx].reps = e.target.value; setEditingProgram({...editingProgram, sessions: newSess}); }} className="bg-surface2/50 w-20 py-2 rounded-xl text-center font-mono font-bold text-xs focus:border-primary border border-transparent outline-none" />
                           </div>
                           <div className="flex flex-col">
                             <label className="text-[9px] font-bold uppercase text-secondary">{isCardio ? "Durée" : "RIR"}</label>
                             <input type="text" value={ex.targetRir || ''} onChange={e => { const newSess = [...editingProgram.sessions]; newSess[sIdx].exos[exIdx].targetRir = e.target.value; setEditingProgram({...editingProgram, sessions: newSess}); }} className="bg-surface2/50 w-16 py-2 rounded-xl text-center font-mono font-bold text-xs focus:border-primary border border-transparent outline-none" />
                           </div>
                           <div className="flex flex-col">
                             <label className="text-[9px] font-bold uppercase text-secondary">Repos</label>
                             <input type="number" value={ex.rest} onChange={e => { const newSess = [...editingProgram.sessions]; newSess[sIdx].exos[exIdx].rest = parseInt(e.target.value); setEditingProgram({...editingProgram, sessions: newSess}); }} className="bg-surface2/50 w-16 py-2 rounded-xl text-center font-mono font-bold text-xs focus:border-primary border border-transparent outline-none" />
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => { const newSess = [...editingProgram.sessions]; newSess[sIdx].exos.splice(exIdx, 1); setEditingProgram({...editingProgram, sessions: newSess}); }} className="text-danger/50 hover:text-danger">✕</button>
                        <div className="flex flex-col">
                            {exIdx > 0 && <button onClick={() => { const newSess = [...editingProgram.sessions]; newSess[sIdx].exos = moveItem(newSess[sIdx].exos, exIdx, exIdx - 1); setEditingProgram({...editingProgram, sessions: newSess}); }} className="text-xs text-secondary">▲</button>}
                            {exIdx < sess.exos.length - 1 && <button onClick={() => { const newSess = [...editingProgram.sessions]; newSess[sIdx].exos = moveItem(newSess[sIdx].exos, exIdx, exIdx + 1); setEditingProgram({...editingProgram, sessions: newSess}); }} className="text-xs text-secondary">▼</button>}
                        </div>
                      </div>
                   </div>
                 );
               })}
               <button onClick={() => setProgramExoPicker(sIdx)} className="w-full py-3 border border-dashed border-border rounded-xl text-xs font-bold uppercase text-secondary">+ Exo</button>
             </div>
          </SectionCard>
        ))}
        <button onClick={() => setEditingProgram({ ...editingProgram, sessions: [...editingProgram.sessions, { id: Date.now().toString(), name: "Nouvelle Séance", exos: [] }] })} className="w-full py-4 bg-surface border border-border rounded-[2rem] text-sm font-black uppercase text-secondary">+ Ajouter Séance</button>
      </div>
    );
  };

  const renderPrograms = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black italic uppercase">Programmes</h2>
          <button onClick={() => { triggerHaptic('click'); setEditingProgram({ id: Date.now().toString(), name: "Nouveau Programme", sessions: [] }); setView(View.EditorProgram); }} className="px-4 py-2 bg-primary text-background rounded-full text-xs font-black uppercase shadow-lg shadow-primary/20 hover:scale-105 transition-transform">+ Créer</button>
       </div>
       <div className="grid gap-6">
          {programs.map(prog => (
             <SectionCard key={prog.id} className="p-6">
                <div className="flex justify-between items-start mb-6">
                   <h3 className="text-lg font-black italic uppercase leading-tight max-w-[70%]">{prog.name}</h3>
                   <div className="flex gap-1">
                      <button onClick={() => { triggerHaptic('click'); setEditingProgram(JSON.parse(JSON.stringify(prog))); setView(View.EditorProgram); }} className="p-2 text-secondary hover:text-white bg-surface2 rounded-xl transition-colors"><Icons.Settings /></button>
                      <button onClick={() => { triggerHaptic('error'); setPendingConfirm({ message: "Supprimer le programme ?", subMessage: "Irréversible.", variant: 'danger', onConfirm: () => setPrograms(prev => prev.filter(p => p.id !== prog.id)) })}} className="p-2 text-danger bg-danger/10 rounded-xl hover:bg-danger/20 transition-colors">✕</button>
                   </div>
                </div>
                <div className="space-y-3">
                   {(prog.sessions || []).map(sess => (
                      <button key={sess.id} onClick={() => { triggerHaptic('click'); setPreviewSession({ programName: prog.name, session: sess }); }} className="w-full text-left bg-surface2/30 hover:bg-surface2 p-4 rounded-2xl border border-transparent hover:border-primary/30 transition-all group">
                         <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">{sess.name}</span>
                            <span className="text-[10px] font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">Démarrer ➔</span>
                         </div>
                         <div className="text-[10px] text-secondary mt-1 flex gap-2">
                            <span>{(sess.exos || []).length} Mouvements</span>
                            <span>•</span>
                            <span>{(sess.exos || []).reduce((acc, ex) => acc + ex.sets, 0)} Séries</span>
                         </div>
                      </button>
                   ))}
                   {(prog.sessions || []).length === 0 && <div className="text-center text-[10px] text-secondary/50 italic py-2">Aucune séance</div>}
                </div>
             </SectionCard>
          ))}
       </div>
    </div>
  );

  const renderLibrary = () => {
    const filteredLib = library.filter(l => {
        if (l.isArchived) return false;
        const q = libraryFilter.toLowerCase();
        return (l.name || '').toLowerCase().includes(q) || (l.muscle || '').toLowerCase().includes(q) || (l.type || '').toLowerCase().includes(q);
    }).sort((a,b) => (a.isFavorite === b.isFavorite) ? (a.name || '').localeCompare(b.name || '') : (a.isFavorite ? -1 : 1));

    return (
     <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black italic uppercase">Bibliothèque</h2>
          <button onClick={() => { triggerHaptic('click'); setEditingExercise({ id: 0, name: '', type: 'Isolation', muscle: 'Pectoraux', equipment: 'BB', tips: {} }); }} className="px-4 py-2 bg-primary text-background rounded-full text-xs font-black uppercase">+ Exo</button>
        </div>
        <input value={libraryFilter} onChange={e => setLibraryFilter(e.target.value)} placeholder="Rechercher (Nom, Muscle...)" className="w-full bg-surface border border-border p-3 rounded-2xl outline-none focus:border-primary text-sm" />
        <div className="grid gap-3">
           {filteredLib.map(l => (
             <div key={l.id} className="bg-surface border border-border p-4 rounded-2xl flex justify-between items-center">
                <div className="flex-1">
                   <div className="flex items-center gap-2">
                       <button onClick={(e) => toggleFavorite(l.id, e)} className={`transition-transform active:scale-125 ${l.isFavorite ? 'text-gold' : 'text-secondary/30'}`}>{l.isFavorite ? <Icons.Star /> : <Icons.StarOutline />}</button>
                       <div className="font-bold">{l.name}</div>
                   </div>
                   <div className="text-[10px] text-secondary uppercase mt-1 flex gap-2 pl-7">
                       <span>{l.muscle} • {EQUIPMENTS[l.equipment]}</span>
                       <span style={{ color: TYPE_COLORS[l.type] }}>● {l.type}</span>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => { triggerHaptic('click'); setEditingExercise(l); }} className="text-secondary p-2"><Icons.Settings /></button>
                   <button onClick={() => handleDeleteExo(l.id)} className="text-danger p-2">✕</button>
                </div>
             </div>
           ))}
        </div>
     </div>
    );
  };

  const renderSettings = () => (
     <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="text-2xl font-black italic uppercase px-1">Paramètres</h2>
        <SectionCard className="p-6">
           <h3 className="text-sm font-bold uppercase tracking-wider text-secondary mb-4">Thème</h3>
           <div className="flex gap-3 justify-center flex-wrap">
             {(Object.keys(THEMES) as AccentColor[]).map(c => (
                <button key={c} onClick={() => { triggerHaptic('click'); setAccentColor(c); }} className={`w-10 h-10 rounded-full border-2 transition-all ${accentColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50'}`} style={{ backgroundColor: THEMES[c].primary }} />
             ))}
           </div>
        </SectionCard>

        <SectionCard className="p-6 space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Données (JSON)</h3>
           <div className="grid grid-cols-2 gap-3">
               <button onClick={() => {
                   triggerHaptic('click');
                   const exportData = { meta: { app: "IronTracker", version: "V1.0", date: new Date().toISOString() }, library: library, programs: programs, history: history };
                   downloadFile(JSON.stringify(exportData, null, 2), `backup_iron_${new Date().toISOString().split('T')[0]}.json`);
               }} className="py-4 bg-surface2 rounded-2xl text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-2 hover:bg-surface2/80 transition-colors">
                  <span className="text-primary scale-125"><Icons.Download /></span> <span>Exporter</span>
               </button>
               <label className="py-4 bg-surface2 rounded-2xl text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface2/80 transition-colors">
                  <span className="text-primary scale-125"><Icons.Upload /></span> <span>Importer</span>
                  <input type="file" className="hidden" accept=".json" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                         triggerHaptic('success');
                         const reader = new FileReader();
                         reader.onload = (ev) => {
                            try {
                               const data = JSON.parse(ev.target?.result as string);
                               const newHistory = data.history || data;
                               if (newHistory && Array.isArray(newHistory)) setHistory(newHistory);
                               if (data.programs) setPrograms(data.programs);
                               if (data.library) setLibrary(data.library);
                               alert("Import réussi !");
                            } catch (err) { alert("Fichier invalide"); }
                         };
                         reader.readAsText(file);
                      }
                  }} />
               </label>
           </div>
        </SectionCard>

        <SectionCard className="p-6 space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Analytique</h3>
           <button onClick={() => { triggerHaptic('click'); const csv = generateCSV(history, library); downloadFile(csv, `irontracker_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv'); }} className="w-full py-4 bg-surface2 rounded-2xl text-xs font-bold uppercase flex items-center justify-center gap-3 hover:bg-surface2/80 transition-colors">
              <span className="text-success scale-125"><Icons.Table /></span> Export CSV Complet (Excel)
           </button>
        </SectionCard>

        <div className="bg-danger/5 border border-danger/20 p-6 rounded-[2rem] shadow-lg space-y-4">
            <h3 className="text-sm font-black uppercase text-danger">Zone de Danger</h3>
            <button onClick={() => { triggerHaptic('error'); setPendingConfirm({ message: "Réinitialiser TOUTES les données ?", subMessage: "Irréversible.", variant: 'danger', onConfirm: () => { 
                // Soft Reset: Clear storage and reset state manually to defaults
                // This triggers the useEffect to save these defaults cleanly without race conditions
                localStorage.clear();
                setHistory([]);
                setPrograms(DEFAULT_PROGRAMS);
                setLibrary(DEFAULT_LIBRARY);
                setSession(null);
                setAccentColor('blue');
                setView(View.Dashboard);
                triggerHaptic('success');
            }})}} className="w-full py-3 bg-danger/10 text-danger rounded-xl text-xs font-bold uppercase border border-danger/20">
                Tout effacer (Reset Factory)
            </button>
        </div>
        
        {installPrompt && (
           <button onClick={() => { installPrompt.prompt(); installPrompt.userChoice.then(res => { if (res.outcome === 'accepted') setInstallPrompt(null); }); }} className="w-full py-4 bg-primary text-background rounded-[2rem] text-sm font-black uppercase shadow-xl animate-pulse">
              Installer l'Application
           </button>
        )}
     </div>
  );
  
  const renderRecords = () => (
      <div className="space-y-6 animate-in fade-in duration-500">
         <div className="flex justify-between items-center px-1">
            <h2 className="text-2xl font-black italic uppercase">Records</h2>
            <button onClick={() => { triggerHaptic('click'); setView(View.OneRMCalculator); }} className="text-[10px] font-bold uppercase tracking-wider bg-surface2 px-3 py-1.5 rounded-full">Calculateur 1RM</button>
         </div>
         <div className="grid gap-4">
            {MUSCLE_ORDER.filter(m => m !== 'Cardio').map(muscle => {
               const exos = library.filter(l => l.muscle === muscle && !l.isArchived);
               const stats = exos.map(e => ({ name: e.name, ...getExerciseStats(e.id, history, e.type) })).filter(s => s.pr > 0).sort((a,b) => b.pr - a.pr);
               if (stats.length === 0) return null;
               return (
                  <SectionCard key={muscle} className="p-5">
                     <h3 className="text-sm font-black uppercase text-primary mb-3">{muscle}</h3>
                     <div className="space-y-3">
                        {stats.map(s => (
                           <div key={s.name} className="flex justify-between items-center border-b border-border/30 pb-2 last:border-0">
                              <span className="text-xs font-bold text-secondary truncate pr-4">{s.name}</span>
                              <div className="text-right">
                                 <div className="text-sm font-mono font-bold text-white">{s.pr}kg <span className="text-[8px] text-secondary">1RM</span></div>
                                 <div className="text-[9px] text-secondary">{s.prMax}kg max</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </SectionCard>
               );
            })}
         </div>
      </div>
  );

  const renderAnalytics = () => (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="text-2xl font-black italic uppercase px-1">Progrès</h2>
        
        <SectionCard className="p-6">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Progression</h3>
              <select value={analyticsExo} onChange={e => { triggerHaptic('click'); setAnalyticsExo(e.target.value); }} className="bg-surface2 text-xs font-bold px-3 py-1.5 rounded-full outline-none max-w-[200px]">
                  <option value="">Sélectionner Exercice</option>
                  {library.filter(l => !l.isArchived).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
           </div>
           
           <div className="flex justify-end mb-4">
              <div className="flex bg-surface2 rounded-full p-0.5">
                  {['max', 'volume', 'tonnage'].map(m => (
                     <button key={m} onClick={() => { triggerHaptic('tick'); setAnalyticsMetric(m as any); }} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${analyticsMetric === m ? 'bg-primary text-background' : 'text-secondary hover:text-white'}`}>{m}</button>
                  ))}
               </div>
           </div>

           <div className="flex gap-4 h-64">
              {/* Vertical Time Selector (Left of Axis) */}
              <div className="flex flex-col justify-between py-2 bg-surface2/30 rounded-full px-1">
                 {['7d','30d','90d','1y','all'].map(p => (
                     <button key={p} onClick={() => { triggerHaptic('tick'); setAnalyticsPeriod(p as any); }} className={`w-8 h-8 flex items-center justify-center rounded-full text-[9px] font-bold uppercase transition-all ${analyticsPeriod === p ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-white'}`}>
                        {p.replace('all', '∞')}
                     </button>
                 ))}
              </div>

              <div className="flex-1 w-full">
                  {progData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={progData}>
                            <defs><linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#8b949e'}} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{fontSize: 10, fill: '#8b949e'}} axisLine={false} tickLine={false} dx={-10} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px'}} itemStyle={{color: '#fff', fontSize: '12px', fontWeight: 'bold'}} labelStyle={{color: '#8b949e', fontSize: '10px', marginBottom: '4px'}} />
                            <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                         </AreaChart>
                      </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-secondary text-xs italic opacity-50 border border-dashed border-border/50 rounded-xl">Veuillez sélectionner un exercice</div>}
              </div>
           </div>
        </SectionCard>

        <SectionCard className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Volume Hebdo</h3>
                <div className="flex bg-surface2 rounded-full p-0.5">
                     <button onClick={() => { triggerHaptic('tick'); setVolumeChartMode('muscle'); }} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${volumeChartMode === 'muscle' ? 'bg-primary text-background' : 'text-secondary'}`}>Muscles</button>
                     <button onClick={() => { triggerHaptic('tick'); setVolumeChartMode('type'); }} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${volumeChartMode === 'type' ? 'bg-primary text-background' : 'text-secondary'}`}>Types</button>
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={volumeData} layout="vertical" margin={{left: 20}}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tick={{fontSize: 9, fill: '#8b949e'}} width={70} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px'}} itemStyle={{ color: '#fff' }} />
                      <Bar dataKey="sets" radius={[0, 4, 4, 0]} barSize={16}>
                        {volumeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || MUSCLE_COLORS[entry.name] || '#58a6ff'} />)}
                        <LabelList dataKey="sets" position="right" fill="#e6edf3" fontSize={10} formatter={(v: number) => v > 0 ? v : ''} />
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-end mt-4">
                <div className="flex items-center gap-2 text-[10px] font-bold bg-surface2 px-2 py-1 rounded-full">
                    <button onClick={() => { triggerHaptic('click'); setCurrentWeekOffset(prev => prev - 1); }} className="text-secondary hover:text-white px-2">◀</button>
                    <button onClick={() => { triggerHaptic('click'); setCurrentWeekOffset(0); }} className="text-primary hover:text-white px-1">RST</button>
                    <span className="mx-1 text-secondary/50">|</span>
                    <span>{weekStart.toLocaleDateString()}</span>
                    <button onClick={() => { triggerHaptic('click'); setCurrentWeekOffset(prev => prev + 1); }} className="text-secondary hover:text-white px-2">▶</button>
                </div>
            </div>
        </SectionCard>

        <SectionCard className="p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">SBD Tracker</h3>
               <div className="flex bg-surface2 rounded-full p-0.5">
                  <button onClick={() => { triggerHaptic('tick'); setSbdViewMode('tracking'); }} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${sbdViewMode === 'tracking' ? 'bg-primary text-background' : 'text-secondary'}`}>Tracking</button>
                  <button onClick={() => { triggerHaptic('tick'); setSbdViewMode('ratio'); }} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${sbdViewMode === 'ratio' ? 'bg-primary text-background' : 'text-secondary'}`}>Niveaux</button>
               </div>
            </div>
            {sbdViewMode === 'ratio' && (
                <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar pb-1">
                    {(['global', 'squat', 'bench', 'deadlift'] as const).map(cat => (
                         <button key={cat} onClick={() => { triggerHaptic('tick'); setSbdRatioCategory(cat); }} className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase whitespace-nowrap transition-all ${sbdRatioCategory === cat ? 'bg-primary/20 border-primary text-primary' : 'border-transparent text-secondary hover:text-white'}`}>{cat}</button>
                    ))}
                </div>
            )}
            {sbdData.length > 0 ? (
               <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={sbdData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#8b949e'}} axisLine={false} tickLine={false} dy={10} />
                        {sbdViewMode === 'ratio' ? (
                            <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#8b949e'}} tickFormatter={(val) => Number(val).toFixed(1)} axisLine={false} tickLine={false} dx={-10} domain={[0, (dataMax: number) => parseFloat((Math.max(dataMax, RATIO_ZONES[sbdRatioCategory][0].max) * 1.2).toFixed(2))]} />
                        ) : (
                            <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#8b949e'}} axisLine={false} tickLine={false} dx={-10} domain={['auto', 'auto']} />
                        )}
                        <Tooltip contentStyle={{backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px'}} labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label} />
                        {sbdViewMode === 'tracking' ? (
                           <>
                              <Area yAxisId="left" type="monotone" dataKey="sbd" name="Total SBD" stroke="var(--primary)" fill="url(#colorVal)" strokeWidth={3} />
                              <Line yAxisId="left" type="monotone" dataKey="bw" name="Poids Corps" stroke="#ff7b72" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                           </>
                        ) : (
                           <>
                             {RATIO_ZONES[sbdRatioCategory].map((level, i) => (
                                 <ReferenceArea key={i} yAxisId="left" y1={i === 0 ? 0 : RATIO_ZONES[sbdRatioCategory][i-1].max} y2={level.max} fill={level.color} fillOpacity={0.05} label={{ value: `${level.label} (≤${level.max})`, position: 'insideTopRight', fill: '#8b949e', fontSize: 10, opacity: 0.7 }} />
                             ))}
                             <Line yAxisId="left" type="monotone" dataKey={sbdRatioCategory === 'global' ? 'ratioGlobal' : sbdRatioCategory === 'squat' ? 'ratioSquat' : sbdRatioCategory === 'bench' ? 'ratioBench' : 'ratioDeadlift'} name={`Ratio ${sbdRatioCategory.toUpperCase()}`} stroke="#d29922" strokeWidth={3} dot={{r: 4, fill: '#d29922'}} connectNulls />
                           </>
                        )}
                     </ComposedChart>
                  </ResponsiveContainer>
               </div>
            ) : <div className="h-64 flex items-center justify-center text-secondary text-xs italic">Pas assez de données SBD</div>}
        </SectionCard>
      </div>
    );

  const renderOneRMCalc = () => (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="text-2xl font-black italic uppercase px-1">Calculateur 1RM</h2>
        <SectionCard className="p-6 space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] uppercase text-secondary">Poids (kg)</label>
               <input type="number" value={oneRMWeight} onChange={e => setOneRMWeight(e.target.value)} className="w-full bg-background border border-border p-3 rounded-xl text-lg font-mono font-bold text-center outline-none focus:border-primary" />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] uppercase text-secondary">Reps</label>
               <input type="number" value={oneRMReps} onChange={e => setOneRMReps(e.target.value)} className="w-full bg-background border border-border p-3 rounded-xl text-lg font-mono font-bold text-center outline-none focus:border-primary" />
             </div>
           </div>
           <div className="pt-4 border-t border-border/50 text-center">
             <div className="text-[10px] font-bold uppercase tracking-wider text-secondary mb-2">Estimation 1RM (Wathen)</div>
             <div className="text-4xl font-black italic text-primary">{est1RM} <span className="text-lg text-foreground not-italic">kg</span></div>
           </div>
           <div className="grid grid-cols-4 gap-2 pt-4">
              {[0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60].map(pct => (
                 <div key={pct} className="bg-surface2/30 p-2 rounded-xl text-center">
                    <div className="text-[8px] font-bold text-secondary">{Math.round(pct * 100)}%</div>
                    <div className="text-xs font-mono font-bold">{Math.round(est1RM * pct)}</div>
                 </div>
              ))}
           </div>
        </SectionCard>

        <SectionCard className="p-6 space-y-6">
           <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Convertisseur</h3>
           <div className="space-y-2">
              <label className="text-[10px] uppercase text-secondary">Barre (Total) ➔ Haltères (Par main)</label>
              <div className="flex gap-2">
                 <input type="number" value={convBB} onChange={e => { setConvBB(e.target.value); setConvDB(e.target.value ? Math.round((parseFloat(e.target.value) * 0.80) / 2).toString() : ""); }} placeholder="Barre..." className="w-full bg-background border border-border p-3 rounded-xl text-center font-mono outline-none" />
                 <div className="flex items-center text-secondary">➔</div>
                 <div className="w-full bg-surface2 p-3 rounded-xl text-center font-mono font-bold text-primary">{convDB}</div>
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] uppercase text-secondary">Haltères (Par main) ➔ Barre (Total)</label>
              <div className="flex gap-2">
                 <input type="number" value={convDB} onChange={e => { setConvDB(e.target.value); setConvBB(e.target.value ? Math.round((parseFloat(e.target.value) * 2) / 0.80).toString() : ""); }} placeholder="Haltère..." className="w-full bg-background border border-border p-3 rounded-xl text-center font-mono outline-none" />
                 <div className="flex items-center text-secondary">➔</div>
                 <div className="w-full bg-surface2 p-3 rounded-xl text-center font-mono font-bold text-primary">{convBB}</div>
              </div>
           </div>
        </SectionCard>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 pb-safe" style={getAccentStyle(accentColor)}>
      <header className="fixed top-0 inset-x-0 z-30 bg-background/80 backdrop-blur-md border-b border-border h-16 flex justify-center px-4">
        <div className="w-full max-w-lg flex items-center justify-between">
            <h1 className="text-2xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-glow cursor-pointer" onClick={() => { triggerHaptic('click'); setView(View.Dashboard); }}>IRON<span className="text-foreground">TRACKER</span></h1>
            <div className="flex items-center gap-2">
                {view === View.Workout && !restTarget && <button onClick={() => { triggerHaptic('click'); setRestTarget(Date.now() + 180000); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-secondary active:scale-90 transition-transform">⏱️</button>}
                {restTime !== null && view !== View.Workout && <button onClick={() => { triggerHaptic('click'); setRestTarget(null); }} className="px-3 py-1 bg-surface border border-primary/30 rounded-full flex items-center gap-2 animate-pulse hover:bg-surface2 transition-colors"><span className="w-2 h-2 rounded-full bg-primary" /><span className="font-mono font-bold text-primary text-xs">{Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}</span></button>}
                {session && view === View.Workout && <div className="px-3 py-1 bg-surface2/50 text-white text-[10px] font-mono font-bold rounded-full border border-border">{timerString}</div>}
                {session && view !== View.Workout && <button onClick={() => { triggerHaptic('click'); setView(View.Workout); }} className="px-3 py-1 bg-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-full border border-green-500/50 animate-pulse">En cours {timerString}</button>}
            </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-lg mx-auto min-h-screen pb-32">
        {view === View.Dashboard && renderDashboard()}
        {view === View.Workout && renderWorkout()}
        {view === View.Analytics && renderAnalytics()}
        {view === View.OneRMCalculator && renderOneRMCalc()}
        {view === View.Programs && renderPrograms()}
        {view === View.EditorProgram && renderEditorProgram()}
        {view === View.Library && renderLibrary()}
        {view === View.Settings && renderSettings()}
        {view === View.Records && renderRecords()}
      </main>

      {view !== View.Workout && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
            <nav className="w-full max-w-lg mx-6 h-20 bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/50 flex items-center justify-around px-2 pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
            {[
                { id: View.Dashboard, icon: <Icons.Dashboard />, label: "Home" },
                { id: View.Programs, icon: <Icons.Programs />, label: "Progs" },
                { id: View.Library, icon: <Icons.Note />, label: "Biblio" },
                { id: View.Settings, icon: <Icons.Settings />, label: "Config" },
            ].map((item) => {
                const isActive = view === item.id;
                return (
                <button
                    key={item.id}
                    onClick={() => { triggerHaptic('click'); setView(item.id); }}
                    className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group ${isActive ? 'text-primary' : 'text-secondary hover:text-white'}`}
                >
                    <span className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'group-active:scale-90'}`}>
                    {item.icon}
                    </span>
                    {isActive && (
                    <span className="absolute bottom-3 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_2px_var(--primary)] animate-in zoom-in duration-300" />
                    )}
                </button>
                )
            })}
            </nav>
        </div>
      )}

      {restTime !== null && view === View.Workout && (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4 flex justify-center pointer-events-none">
             <div className={`w-full max-w-lg bg-surface/90 backdrop-blur border ${showGo ? 'border-success bg-success/20' : 'border-border'} p-4 rounded-[2rem] shadow-2xl pointer-events-auto flex justify-between items-center animate-in slide-in-from-bottom duration-300 transition-colors`}>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase text-secondary">Repos</span>
                   {showGo ? <span className="text-3xl font-black italic text-success animate-pulse">GO !</span> : <span className="text-3xl font-mono font-bold text-primary">{Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}</span>}
                </div>
                {!showGo && (
                    <div className="flex gap-2">
                       <button onClick={() => { triggerHaptic('click'); setRestTarget(prev => (prev || Date.now()) - 30000); }} className="w-10 h-10 rounded-full bg-surface2 border border-border text-white font-bold active:scale-90">-30</button>
                       <button onClick={() => { triggerHaptic('click'); setRestTarget(prev => (prev || Date.now()) + 30000); }} className="w-10 h-10 rounded-full bg-surface2 border border-border text-white font-bold active:scale-90">+30</button>
                       <button onClick={() => { triggerHaptic('click'); setRestTarget(null); }} className="w-10 h-10 rounded-full bg-danger/20 border border-danger/40 text-danger font-bold active:scale-90">✕</button>
                    </div>
                )}
             </div>
          </div>
      )}

      {selectedDaySessions && (
          <Modal title="Historique" onClose={() => setSelectedDaySessions(null)}>
              <div className="space-y-4">
                  {selectedDaySessions.map(s => {
                      const startTime = new Date(s.startTime);
                      const endTime = s.endTime ? new Date(s.endTime) : null;
                      const duration = s.endTime ? Math.floor((s.endTime - s.startTime) / 60000) : null;
                      return (
                      <div key={s.id} className="bg-surface2/30 p-4 rounded-2xl border border-border/50">
                          <div className="flex justify-between items-start mb-4 border-b border-border/30 pb-2">
                             <div>
                                <h4 className="font-bold">{s.sessionName}</h4>
                                <div className="text-[10px] text-secondary">{s.programName} • Forme {s.fatigue}/5</div>
                             </div>
                             <div className="text-right flex flex-col items-end">
                                <div className="text-[10px] font-mono text-secondary">
                                    {startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} {endTime && ` - ${endTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
                                </div>
                                {duration && <div className="text-[10px] font-black uppercase text-primary mt-1">{Math.floor(duration/60)}h{String(duration%60).padStart(2, '0')}</div>}
                             </div>
                          </div>
                          <div className="space-y-3">
                              {s.exercises.map(ex => {
                                  const doneSets = ex.sets.filter(st => st.done);
                                  if (doneSets.length === 0) return null;
                                  const libEx = getExerciseById(ex.exerciseId);
                                  const isCardio = libEx?.type === 'Cardio';
                                  const isStatic = libEx?.type === 'Isométrique' || libEx?.type === 'Étirement';
                                  const weightStr = doneSets.map(st => st.weight).join(',');
                                  const repStr = doneSets.map(st => isStatic ? formatDuration(parseDuration(st.reps)) : st.reps).join(',');
                                  const rirStr = doneSets.map(st => isCardio ? formatDuration(st.rir || '0') : (st.rir || '-')).join(',');
                                  return (
                                      <div key={ex.exerciseId} className="text-xs">
                                          <div className="font-bold text-white mb-0.5">{libEx?.name || `Exo #${ex.exerciseId}`}</div>
                                          <div className="font-mono text-secondary text-[11px] mb-1">{weightStr} {isCardio ? "Lvl" : "kg"} x {repStr} {isCardio ? "m" : isStatic ? "s" : "reps"} | {isCardio ? "" : "RIR "}{rirStr}</div>
                                          {ex.notes && <div className="flex items-start gap-1.5 mt-0.5 text-[10px] text-secondary/70 italic pl-1 border-l-2 border-secondary/20"><span className="scale-75 opacity-70"><Icons.Note /></span><span>{ex.notes}</span></div>}
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                      );
                  })}
              </div>
          </Modal>
      )}

      {previewSession && (
          <Modal title={previewSession.session.name} onClose={() => setPreviewSession(null)}>
              <div className="space-y-6">
                  <div className="text-center">
                      <div className="text-xs uppercase text-secondary mb-1">Programme</div>
                      <div className="font-black italic text-lg">{previewSession.programName}</div>
                  </div>
                  <div className="space-y-3">
                      {previewSession.session.exos.map((ex, idx) => {
                          const libEx = getExerciseById(ex.exerciseId);
                          return (
                              <div key={idx} className="bg-surface2/30 p-3 rounded-2xl flex justify-between items-center">
                                  <div><div className="font-bold text-sm">{libEx?.name || `Exo #${ex.exerciseId}`}</div><div className="text-[10px] text-secondary uppercase">{libEx?.muscle}</div></div>
                                  <div className="text-right text-xs font-mono"><div className="text-white font-bold">{ex.sets} x {ex.reps}</div><div className="text-secondary">{ex.rest}s</div></div>
                              </div>
                          )
                      })}
                  </div>
                  <button onClick={() => startSession(previewSession.programName, previewSession.session)} className="w-full py-4 bg-primary text-background font-black uppercase rounded-[2rem] shadow-xl active:scale-95 transition-all">Démarrer la séance</button>
              </div>
          </Modal>
      )}

      {showAddExoModal && (
         <Modal title="Ajouter Exercice" onClose={() => { setShowAddExoModal(false); setLibraryFilter(''); }}>
            <div className="space-y-4">
               <input placeholder="Rechercher..." className="w-full bg-surface2 p-3 rounded-2xl outline-none" onChange={(e) => setLibraryFilter(e.target.value)} autoFocus />
               <div className="max-h-60 overflow-y-auto space-y-2">
                 {library.filter(l => !l.isArchived && ((l.name || '').toLowerCase().includes(libraryFilter.toLowerCase()) || (l.muscle || '').toLowerCase().includes(libraryFilter.toLowerCase()))).sort((a,b) => (a.isFavorite === b.isFavorite) ? (a.name || '').localeCompare(b.name || '') : (a.isFavorite ? -1 : 1)).map(l => (
                    <button key={l.id} onClick={() => {
                       if (session) {
                          const newExos = [...session.exercises, { exerciseId: l.id, target: "3 x 10", rest: 90, targetRir: "", isBonus: true, notes: "", sets: [{ weight: "", reps: "", done: false, rir: "" }] }];
                          setSession({...session, exercises: newExos});
                       }
                       setLibraryFilter(''); setShowAddExoModal(false);
                    }} className="w-full p-3 bg-surface2/50 rounded-2xl text-left hover:bg-surface2 transition-colors flex justify-between items-center group">
                       <div className="flex-1"><div className="flex items-center gap-2">{l.isFavorite && <span className="text-gold"><Icons.Star /></span>}<div className="font-bold text-sm group-hover:text-primary transition-colors">{l.name}</div></div><div className="text-[10px] text-secondary uppercase mt-1 flex gap-2"><span>{l.muscle} • {EQUIPMENTS[l.equipment]}</span><span style={{ color: TYPE_COLORS[l.type] }}>● {l.type}</span></div></div>
                       <div className="text-xl text-primary font-black">+</div>
                    </button>
                 ))}
               </div>
            </div>
         </Modal>
      )}

      {programExoPicker !== null && (
          <Modal title="Choisir Exercice" onClose={() => { setProgramExoPicker(null); setLibraryFilter(''); }}>
             <div className="space-y-4">
               <input placeholder="Rechercher..." className="w-full bg-surface2 p-3 rounded-2xl outline-none" onChange={(e) => setLibraryFilter(e.target.value)} autoFocus />
               <div className="max-h-60 overflow-y-auto space-y-2">
                 {library.filter(l => !l.isArchived && ((l.name || '').toLowerCase().includes(libraryFilter.toLowerCase()) || (l.muscle || '').toLowerCase().includes(libraryFilter.toLowerCase()))).sort((a,b) => (a.isFavorite === b.isFavorite) ? (a.name || '').localeCompare(b.name || '') : (a.isFavorite ? -1 : 1)).map(l => (
                    <button key={l.id} onClick={() => {
                        if (editingProgram && programExoPicker !== null) {
                            const newSess = [...editingProgram.sessions]; newSess[programExoPicker].exos.push({ exerciseId: l.id, sets: 3, reps: "10", rest: 120 }); setEditingProgram({...editingProgram, sessions: newSess});
                        }
                        setLibraryFilter(''); setProgramExoPicker(null);
                    }} className="w-full p-3 bg-surface2/50 rounded-2xl text-left hover:bg-surface2 transition-colors flex justify-between items-center group">
                       <div className="flex-1"><div className="flex items-center gap-2">{l.isFavorite && <span className="text-gold"><Icons.Star /></span>}<div className="font-bold text-sm group-hover:text-primary transition-colors">{l.name}</div></div><div className="text-[10px] text-secondary uppercase mt-1 flex gap-2"><span>{l.muscle} • {EQUIPMENTS[l.equipment]}</span><span style={{ color: TYPE_COLORS[l.type] }}>● {l.type}</span></div></div>
                       <div className="text-xl text-primary font-black">+</div>
                    </button>
                 ))}
               </div>
            </div>
         </Modal>
      )}

      {editingExercise && (
         <Modal title={editingExercise.id ? "Modifier" : "Créer"} onClose={() => setEditingExercise(null)}>
            <div className="space-y-4">
               <div className="space-y-1">
                  <label className="text-[10px] uppercase text-secondary">Nom</label>
                  <input value={editingExercise.name} onChange={e => setEditingExercise({...editingExercise, name: e.target.value})} className="w-full bg-surface2 p-3 rounded-xl outline-none" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] uppercase text-secondary">Type</label>
                     <select value={editingExercise.type} onChange={e => setEditingExercise({...editingExercise, type: e.target.value as ExerciseType})} className="w-full bg-surface2 p-3 rounded-xl outline-none">
                        {EXERCISE_TYPE_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] uppercase text-secondary">Muscle</label>
                     <select value={editingExercise.muscle} onChange={e => setEditingExercise({...editingExercise, muscle: e.target.value})} className="w-full bg-surface2 p-3 rounded-xl outline-none">
                        {MUSCLE_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                  </div>
               </div>
               <div className="space-y-1">
                   <label className="text-[10px] uppercase text-secondary">Équipement</label>
                   <select value={editingExercise.equipment} onChange={e => setEditingExercise({...editingExercise, equipment: e.target.value})} className="w-full bg-surface2 p-3 rounded-xl outline-none">
                        {Object.entries(EQUIPMENTS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                   </select>
               </div>
               <div className="space-y-2 pt-2 border-t border-border/50">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Conseils Techniques</label>
                  <div className="space-y-2">
                     <textarea placeholder="Setup (1 par ligne)" rows={2} className="w-full bg-surface2 p-3 rounded-xl text-xs outline-none" value={editingExercise.tips?.setup?.join('\n') || ''} onChange={e => setEditingExercise({...editingExercise, tips: { ...editingExercise.tips, setup: e.target.value.split('\n') }})} />
                     <textarea placeholder="Exécution (1 par ligne)" rows={2} className="w-full bg-surface2 p-3 rounded-xl text-xs outline-none" value={editingExercise.tips?.exec?.join('\n') || ''} onChange={e => setEditingExercise({...editingExercise, tips: { ...editingExercise.tips, exec: e.target.value.split('\n') }})} />
                     <textarea placeholder="Erreurs (1 par ligne)" rows={2} className="w-full bg-surface2 p-3 rounded-xl text-xs outline-none" value={editingExercise.tips?.mistake?.join('\n') || ''} onChange={e => setEditingExercise({...editingExercise, tips: { ...editingExercise.tips, mistake: e.target.value.split('\n') }})} />
                  </div>
               </div>
               <button onClick={() => {
                  if (!editingExercise.name) return;
                  if (editingExercise.id) {
                     setLibrary(prev => prev.map(l => l.id === editingExercise.id ? editingExercise : l));
                  } else {
                     const maxId = library.reduce((max, l) => Math.max(max, l.id), 0);
                     setLibrary(prev => [...prev, { ...editingExercise, id: maxId + 1 }]);
                  }
                  setEditingExercise(null);
               }} className="w-full py-3 bg-primary text-background font-black uppercase rounded-[2rem]">Sauvegarder</button>
            </div>
         </Modal>
      )}

      {pendingConfirm && (
         <div className="fixed inset-0 z-[500] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-surface border border-border p-6 rounded-[2rem] w-full max-w-sm shadow-2xl space-y-4">
               <h3 className="text-lg font-black italic uppercase text-center">{pendingConfirm.message}</h3>
               {pendingConfirm.subMessage && <div className="text-sm text-secondary text-center whitespace-pre-wrap">{pendingConfirm.subMessage}</div>}
               <div className="grid grid-cols-2 gap-4 pt-2">
                  <button onClick={() => setPendingConfirm(null)} className="py-3 bg-surface2 rounded-xl text-xs font-bold uppercase">Annuler</button>
                  <button onClick={() => { pendingConfirm.onConfirm(); setPendingConfirm(null); }} className={`py-3 rounded-xl text-xs font-bold uppercase text-white ${pendingConfirm.variant === 'primary' ? 'bg-primary' : 'bg-danger'}`}>Confirmer</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
