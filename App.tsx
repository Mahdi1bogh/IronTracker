
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, WorkoutSession, Program, LibraryExercise, ExerciseInstance, SetRecord, AccentColor, BeforeInstallPromptEvent, ExerciseType, ProgramSession } from './types';
import { STORAGE_KEYS, Icons, THEMES } from './constants';
import { getExerciseStats, calculate1RM, downloadFile, formatDuration, parseDuration, generateCSV } from './utils';
import { DEFAULT_LIBRARY } from './data/library';
import { DEFAULT_PROGRAMS } from './data/programs';
import { EQUIPMENTS } from './data/equipments';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, ReferenceLine, LineChart, Line, Cell, PieChart, Pie, ComposedChart, LabelList, ReferenceArea } from 'recharts';

const MUSCLE_COLORS: Record<string, string> = {
  'Pectoraux': '#58a6ff', 'Dos': '#3fb950', 'Jambes': '#d29922', 'Épaules': '#a371f7',
  'Bras': '#f85149', 'Abdos': '#00ffcc', 'Mollets': '#ff7b72', 'Avant-bras': '#79c0ff', 'Cardio': '#8b949e', 'Cou': '#79c0ff'
};

const MUSCLE_ORDER = ['Pectoraux', 'Dos', 'Épaules', 'Bras', 'Avant-bras', 'Abdos', 'Jambes', 'Mollets', 'Cou', 'Cardio'];

// Ratio Levels Definitions
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

const getRatioLabel = (ratio: number, type: 'global'|'squat'|'bench'|'deadlift') => {
    const zones = RATIO_ZONES[type];
    for (const z of zones) {
        if (ratio < z.max) return z.label;
    }
    return "Pro";
};

const getAccentStyle = (color: AccentColor) => {
  const theme = THEMES[color] || THEMES.blue;
  return { '--primary': theme.primary, '--primary-glow': theme.glow } as React.CSSProperties;
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children?: React.ReactNode }) => (
  <div className="fixed inset-0 z-[400] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-surface border border-border w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
      <div className="p-6 border-b border-border flex justify-between items-center bg-surface2/20">
        <h3 className="text-xl font-black italic uppercase">{title}</h3>
        <button onClick={onClose} className="p-2 text-secondary hover:text-white transition-colors">✕</button>
      </div>
      <div className="p-6 overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

// Reusable Header Component
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
    <button onClick={onCancel} className="px-4 py-2 text-danger text-[10px] font-black uppercase bg-danger/10 border border-danger/20 rounded-full transition-all active:scale-95 whitespace-nowrap">
      {cancelLabel}
    </button>
    <div className="flex-1 text-center min-w-0">
      {children || <h2 className="text-xl font-black italic uppercase leading-tight truncate">{title}</h2>}
    </div>
    <button onClick={onSave} className="px-6 py-3 bg-success text-white text-xs font-black rounded-full uppercase shadow-lg shadow-success/20 active:scale-95 whitespace-nowrap">
      {saveLabel}
    </button>
  </div>
);

// Helper to move items in array
const moveItem = <T,>(arr: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= arr.length) return arr;
  const newArr = [...arr];
  const [item] = newArr.splice(from, 1);
  newArr.splice(to, 0, item);
  return newArr;
};

export default function App() {
  const [view, setView] = useState<View>(View.Dashboard);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [calDate, setCalDate] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);

  // States for Rest Timer & Modals
  const [restTarget, setRestTarget] = useState<number | null>(null); 
  const [restTime, setRestTime] = useState<number | null>(null); 
  const [showGo, setShowGo] = useState(false);

  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  // Preview Session State
  const [previewSession, setPreviewSession] = useState<{ programName: string, session: ProgramSession } | null>(null);
  
  const [showAddExoModal, setShowAddExoModal] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<{ message: string; subMessage?: string; onConfirm: () => void; variant?: 'danger' | 'primary' } | null>(null);
  
  // UX State for Notes
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Library Editor State
  const [editingExercise, setEditingExercise] = useState<LibraryExercise | null>(null);
  const [libraryFilter, setLibraryFilter] = useState('');
  
  // Program Editor Pickers
  const [programExoPicker, setProgramExoPicker] = useState<number | null>(null); // sessionIdx
  
  // 1RM Calc State
  const [oneRMWeight, setOneRMWeight] = useState("100");
  const [oneRMReps, setOneRMReps] = useState("5");
  const est1RM = useMemo(() => calculate1RM(oneRMWeight, oneRMReps), [oneRMWeight, oneRMReps]);

  // Converter State
  const [convBB, setConvBB] = useState("");
  const [convDB, setConvDB] = useState("");

  // Analytics State
  const [analyticsExo, setAnalyticsExo] = useState('');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d'|'30d'|'90d'|'1y'|'all'>('30d');
  const [analyticsMetric, setAnalyticsMetric] = useState<'max'|'volume'|'tonnage'>('max');
  
  // SBD Analytics State
  const [sbdViewMode, setSbdViewMode] = useState<'tracking' | 'ratio'>('ratio');
  const [sbdRatioCategory, setSbdRatioCategory] = useState<'global'|'squat'|'bench'|'deadlift'>('global');
  
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedDaySessions, setSelectedDaySessions] = useState<WorkoutSession[] | null>(null);

  // --- ANALYTICS DATA CALCULATION ---
  const progData = useMemo(() => {
        if (!analyticsExo || analyticsExo === 'global') return [];
        const targetId = analyticsExo; 
        
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
            const ex = s.exercises.find(e => e.id === targetId);
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
                    const muscle = library.find(l => l.id === e.id)?.muscle || 'Autre';
                    const hardSets = e.sets.filter(st => {
                        if (!st.done) return false;
                        const rir = parseInt(st.rir || '10');
                        return rir <= 4;
                    }).length; 
                    counts[muscle] = (counts[muscle] || 0) + hardSets;
                });
            }
        });
        
        return MUSCLE_ORDER.map(m => ({ name: m, sets: counts[m] || 0 }));
  }, [history, weekStart, weekEnd, library]);

  const sbdData = useMemo(() => {
        const sortedHistory = history.slice().sort((a,b) => a.startTime - b.startTime);
        
        const currentPR = { squat: 0, bench: 0, dead: 0 };
        const dataPoints: any[] = [];

        sortedHistory.forEach(s => {
             let sessionMaxSquat = 0;
             let sessionMaxBench = 0;
             let sessionMaxDead = 0;

             const getSessionE1RM = (exId: string, isDB: boolean = false) => {
                 const ex = s.exercises.find(e => e.id === exId);
                 if (!ex) return 0;
                 const doneSets = ex.sets.filter(st => st.done);
                 if (doneSets.length === 0) return 0;
                 
                 return Math.max(...doneSets.map(st => {
                     let w = parseFloat(st.weight) || 0;
                     if (isDB) w = (w * 2) / 0.80; // NEW RATIO 0.80
                     return calculate1RM(w, st.reps);
                 }));
             };

             const bbSquat = getSessionE1RM('barbell_squat');
             const dbSquat = getSessionE1RM('dumbbell_squat', true);
             sessionMaxSquat = Math.max(bbSquat, dbSquat);

             const bbBench = getSessionE1RM('barbell_bench_press');
             const dbBench = getSessionE1RM('dumbbell_bench_press', true);
             sessionMaxBench = Math.max(bbBench, dbBench);

             const bbDead = getSessionE1RM('barbell_deadlift');
             const rdlDead = getSessionE1RM('romanian_deadlift');
             sessionMaxDead = Math.max(bbDead, rdlDead);

             if (sessionMaxSquat > currentPR.squat) currentPR.squat = sessionMaxSquat;
             if (sessionMaxBench > currentPR.bench) currentPR.bench = sessionMaxBench;
             if (sessionMaxDead > currentPR.dead) currentPR.dead = sessionMaxDead;

             const totalSBD = currentPR.squat + currentPR.bench + currentPR.dead;
             const bw = parseFloat(s.bodyWeight) || 0;

             if (totalSBD > 0 || bw > 0) {
                 const ratioGlobal = (totalSBD > 0 && bw > 0) ? parseFloat((totalSBD / bw).toFixed(2)) : null;
                 const ratioSquat = (currentPR.squat > 0 && bw > 0) ? parseFloat((currentPR.squat / bw).toFixed(2)) : null;
                 const ratioBench = (currentPR.bench > 0 && bw > 0) ? parseFloat((currentPR.bench / bw).toFixed(2)) : null;
                 const ratioDeadlift = (currentPR.dead > 0 && bw > 0) ? parseFloat((currentPR.dead / bw).toFixed(2)) : null;

                 dataPoints.push({
                     date: new Date(s.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                     fullDate: new Date(s.startTime).toLocaleDateString('fr-FR'),
                     sbd: totalSBD > 0 ? totalSBD : null,
                     bw: bw > 0 ? bw : null,
                     ratioGlobal,
                     ratioSquat,
                     ratioBench,
                     ratioDeadlift
                 });
             }
        });

        return dataPoints;
  }, [history]);

  useEffect(() => {
    const l = localStorage.getItem(STORAGE_KEYS.LIB);
    const p = localStorage.getItem(STORAGE_KEYS.PROGS);
    const h = localStorage.getItem(STORAGE_KEYS.HIST);
    const s = localStorage.getItem(STORAGE_KEYS.SESS);
    const t = localStorage.getItem(STORAGE_KEYS.THEME) as AccentColor;

    if (l) setLibrary(JSON.parse(l)); else setLibrary(DEFAULT_LIBRARY);
    if (p) setPrograms(JSON.parse(p)); else setPrograms(DEFAULT_PROGRAMS);
    if (h) setHistory(JSON.parse(h));
    if (t) setAccentColor(t);
    if (s) {
      const active = JSON.parse(s);
      setSession(active);
      setView(View.Workout);
      setElapsed(Math.floor((Date.now() - active.startTime) / 1000));
    }
  }, []);

  // --- INSTALL PROMPT LISTENER ---
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HIST, JSON.stringify(history));
    localStorage.setItem(STORAGE_KEYS.PROGS, JSON.stringify(programs));
    localStorage.setItem(STORAGE_KEYS.LIB, JSON.stringify(library));
    localStorage.setItem(STORAGE_KEYS.THEME, accentColor);
  }, [history, programs, library, accentColor]);

  useEffect(() => {
    let interval: number;
    if (session) {
      interval = window.setInterval(() => setElapsed(Math.floor((Date.now() - session.startTime) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [session]);

  // --- REST TIMER LOGIC ---
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
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200]);
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
        } else {
            updates.completedAt = undefined;
        }
    }

    exo.sets[setIdx] = { ...exo.sets[setIdx], ...updates };

    if (field === 'done' && value === true && !wasDone) {
      setRestTarget(Date.now() + (exo.rest * 1000));
    }
    setSession(newSession);
    localStorage.setItem(STORAGE_KEYS.SESS, JSON.stringify(newSession));
  };

  const handleDeleteExo = (id: string) => {
    const inHistory = history.some(s => s.exercises.some(e => e.id === id));
    const inProgs = programs.some(p => p.sessions.some(s => s.exos.some(e => e.id === id)));
    setPendingConfirm({
        message: "Supprimer l'exercice ?",
        subMessage: (inHistory || inProgs) ? "Utilisé dans l'historique ou programmes." : "Action irréversible.",
        variant: 'danger',
        onConfirm: () => setLibrary(prev => prev.filter(l => l.id !== id))
    });
  };

  const startSession = (progName: string, sess: ProgramSession) => {
      setSession({
        id: Date.now(),
        programName: progName,
        sessionName: sess.name,
        startTime: Date.now(),
        bodyWeight: history[0]?.bodyWeight || "",
        fatigue: "3",
        exercises: sess.exos.map(e => ({
            id: e.id,
            target: `${e.sets} x ${e.reps}`,
            rest: e.rest,
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
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <section className="bg-surface border border-border p-5 rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-center mb-6 px-2">
            <button onClick={() => setCalDate(new Date(curYear, curMonth - 1))} className="p-3 text-primary text-2xl font-black">◀</button>
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary">{calDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => setCalDate(new Date(curYear, curMonth + 1))} className="p-3 text-primary text-2xl font-black">▶</button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['L','M','M','J','V','S','D'].map(d => <div key={d} className="text-center text-[9px] font-black text-secondary/40 mb-2">{d}</div>)}
            {Array.from({ length: emptyDays }).map((_, i) => <div key={i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const daySessions = history.filter(s => {
                const d = new Date(s.startTime);
                return d.getDate() === day && d.getMonth() === curMonth && d.getFullYear() === curYear;
              });
              const count = daySessions.length;
              const intensity = count > 0 ? Math.min(100, daySessions.reduce((acc, s) => acc + s.exercises.length, 0) * 10) : 0;
              
              return (
                <button key={i} onClick={() => count > 0 && setSelectedDaySessions(daySessions)} className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-mono transition-all ${count > 0 ? 'border border-primary/20 shadow-lg' : 'text-secondary/30'}`} style={count > 0 ? { backgroundColor: `rgba(88, 166, 255, ${intensity/100 * 0.4 + 0.1})`, borderColor: 'var(--primary)' } : {}}>
                  <span className={count > 0 ? 'text-white font-bold' : ''}>{day}</span>
                  {count > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-[0_0_5px_var(--primary)]" />}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setView(View.Records)} className="bg-surface border border-border p-6 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all">
            <span className="text-gold"><Icons.Records /></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Records</span>
          </button>
          <button onClick={() => setView(View.Analytics)} className="bg-surface border border-border p-6 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all">
            <span className="text-primary"><Icons.Analytics /></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Progrès</span>
          </button>
        </div>

        <button onClick={() => setView(View.Programs)} className="w-full py-6 bg-primary text-background font-black rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase text-lg active:scale-95 transition-all">
          <Icons.Fitness /> Commencer
        </button>
      </div>
    );
  };

  const renderWorkout = () => {
      if (!session) return null;
      return (
      <div className="space-y-6 pb-40 animate-in fade-in duration-500">
        <div className="flex justify-between items-center px-1">
           <button onClick={() => setPendingConfirm({
            message: "Annuler la séance ?",
            subMessage: "La progression actuelle sera perdue.",
            variant: "danger",
            onConfirm: () => { 
                setRestTarget(null);
                setRestTime(null);
                setShowGo(false);
                setSession(null); 
                localStorage.removeItem(STORAGE_KEYS.SESS); 
                setView(View.Dashboard); 
            }
          })} className="px-4 py-2 text-danger text-[10px] font-black uppercase bg-danger/10 border border-danger/20 rounded-full transition-all active:scale-95">Annuler</button>
          <div className="flex-1 text-center">
            <h2 className="text-xl font-black italic uppercase leading-tight">{session.sessionName}</h2>
            <div className="text-secondary text-[10px] font-black uppercase tracking-widest">{session.programName}</div>
          </div>
          <button onClick={() => setPendingConfirm({
            message: "Terminer la séance ?",
            onConfirm: () => {
              setRestTarget(null);
              setRestTime(null);
              setShowGo(false);
              // Convert any Cardio "MM:SS" RIRs to seconds before saving history
              const finishedSession = { ...session };
              finishedSession.exercises.forEach(ex => {
                  const libDef = library.find(l => l.id === ex.id);
                  if (libDef?.type === 'Cardio') {
                      ex.sets.forEach(s => {
                          if (s.rir && s.rir.includes(':')) {
                              s.rir = String(parseDuration(s.rir));
                          }
                      });
                  }
              });

              const finished = { ...finishedSession, endTime: Date.now() };
              setHistory(prev => [finished, ...prev]);
              setSession(null);
              localStorage.removeItem(STORAGE_KEYS.SESS);
              setView(View.Dashboard);
            }
          })} className="px-6 py-3 bg-success text-white text-xs font-black rounded-full uppercase shadow-lg shadow-success/20">Finir</button>
        </div>

        <div className="bg-surface border border-border px-6 py-4 rounded-[2rem] flex items-center justify-between gap-4">
             <div className="flex-1 space-y-1">
                 <label className="text-[8px] font-black uppercase text-secondary">Poids de Corps (kg)</label>
                 <input type="number" value={session.bodyWeight} onChange={e => {setSession({...session, bodyWeight: e.target.value}); localStorage.setItem(STORAGE_KEYS.SESS, JSON.stringify({...session, bodyWeight: e.target.value}))}} className="w-full bg-background border border-border p-2 rounded-lg text-sm font-mono font-bold text-center focus:border-primary outline-none" placeholder="Ex: 80" />
             </div>
             <div className="flex-1 space-y-1">
                 <div className="flex justify-between items-center">
                    <label className="text-[8px] font-black uppercase text-secondary">Forme Physique (1-5)</label>
                    <button className="text-[8px] text-primary" onClick={() => alert("1 = Épuisé\n5 = Olympique")}>?</button>
                 </div>
                 <input type="number" min="1" max="5" value={session.fatigue} onChange={e => {setSession({...session, fatigue: e.target.value}); localStorage.setItem(STORAGE_KEYS.SESS, JSON.stringify({...session, fatigue: e.target.value}))}} className="w-full bg-background border border-border p-2 rounded-lg text-sm font-mono font-bold text-center focus:border-primary outline-none" placeholder="3" />
             </div>
        </div>

        {session.exercises.map((exo, eIdx) => {
          const stats = getExerciseStats(exo.id, history);
          const libEx = library.find(l => l.id === exo.id);
          const isCardio = libEx?.type === 'Cardio';

          const bestSet = [...exo.sets].filter(s => s.done).sort((a,b) => calculate1RM(b.weight, b.reps) - calculate1RM(a.weight, a.reps))[0];
          const currentE1RM = bestSet ? calculate1RM(bestSet.weight, bestSet.reps) : 0;
          
          const delta = currentE1RM - stats.lastE1RM;
          const isPos = delta > 0;
          const isNeg = delta < 0;
          const deltaSymbol = isPos ? '▲' : isNeg ? '▼' : '▬';
          const deltaStr = `(${deltaSymbol} ${isPos ? '+' : ''}${delta.toFixed(1)}kg)`;
          const deltaClass = isPos ? 'text-success' : isNeg ? 'text-danger' : 'text-secondary';

          return (
            <div key={eIdx} className="bg-surface border border-border rounded-[2.5rem] overflow-hidden shadow-lg animate-in slide-in-from-bottom duration-300">
              <div className="p-6 border-b border-border bg-surface2/20">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black italic uppercase leading-none">{libEx?.name || exo.id}</h3>
                        {libEx?.tips && (
                            <button onClick={() => setPendingConfirm({
                                message: libEx.name,
                                subMessage: [
                                    ...(libEx.tips.setup ? ["SETUP:", ...libEx.tips.setup] : []),
                                    ...(libEx.tips.exec ? ["EXEC:", ...libEx.tips.exec] : []),
                                    ...(libEx.tips.mistake ? ["ERREURS:", ...libEx.tips.mistake] : [])
                                ].join('\n'),
                                onConfirm: () => {}, variant: 'primary'
                            })} className="text-[10px] font-black bg-primary/20 text-primary px-1.5 rounded-full border border-primary/40">?</button>
                        )}
                        <button 
                           onClick={() => setExpandedNotes(prev => ({...prev, [eIdx]: !prev[eIdx]}))} 
                           className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border transition-all ${exo.notes ? 'bg-secondary/20 text-white border-secondary/40' : 'text-secondary/50 border-secondary/20 hover:text-white'}`}
                        >
                           <Icons.Note />
                        </button>
                    </div>
                    
                    <div className="text-[9px] font-black uppercase text-secondary mb-2">
                        Objectif : {exo.target} | {isCardio ? "Durée" : "RIR"} {exo.sets[0]?.rir || '-'} | REST {exo.rest}s
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{libEx?.muscle || 'Muscle'}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-surface2 text-secondary">{libEx?.type}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-surface2 text-secondary">{EQUIPMENTS[libEx?.equipment || 'OT']}</span>
                      {!isCardio && (
                          <>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gold/10 border border-gold/30 rounded-full">
                                <span className="text-[8px] font-black text-gold uppercase">Record Max:</span>
                                <span className="text-[10px] font-mono text-white font-bold">{stats.prMax}kg</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan1rm/10 border border-cyan1rm/30 rounded-full">
                                <span className="text-[8px] font-black text-cyan1rm uppercase">PR 1RM:</span>
                                <span className="text-[10px] font-mono text-white font-bold">{stats.pr}kg</span>
                            </div>
                          </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                      <button onClick={() => {
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
                        {eIdx > 0 && (
                            <button onClick={() => {
                                const newExos = moveItem(session.exercises, eIdx, eIdx - 1);
                                setSession({ ...session, exercises: newExos });
                            }} className="text-secondary hover:text-primary p-1">▲</button>
                        )}
                        {eIdx < session.exercises.length - 1 && (
                            <button onClick={() => {
                                const newExos = moveItem(session.exercises, eIdx, eIdx + 1);
                                setSession({ ...session, exercises: newExos });
                            }} className="text-secondary hover:text-primary p-1">▼</button>
                        )}
                      </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-background/40 p-3 rounded-2xl border border-border/40">
                      <div className="text-[8px] font-black uppercase text-secondary mb-1">Dernière Séance</div>
                      <div className="text-[9px] font-mono text-secondary italic break-words">{stats.lastDetailed}</div>
                   </div>
                   {!isCardio && (
                       <div className="bg-background/40 p-3 rounded-2xl border border-border/40 text-center flex flex-col justify-center">
                          <div className="text-[8px] font-black uppercase text-secondary mb-1">e1RM Session</div>
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
                {exo.sets.map((set, sIdx) => (
                  <div key={sIdx} className={`p-4 rounded-2xl border transition-all ${set.done ? 'bg-success/5 border-success/30' : 'bg-surface2/40 border-transparent'}`}>
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-[10px] font-mono font-bold text-secondary">{sIdx+1}</div>
                      <div className="col-span-3">
                        <label className="text-[8px] uppercase text-secondary block text-center mb-1">{isCardio ? "Niveau" : "Poids"}</label>
                        <input type="number" value={set.weight} onChange={e => updateSet(eIdx, sIdx, 'weight', e.target.value)} className="w-full bg-background border border-border text-center py-2.5 rounded-xl text-sm font-mono focus:border-primary outline-none" placeholder={isCardio ? "Lvl" : "kg"} />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[8px] uppercase text-secondary block text-center mb-1">{isCardio ? "Dist." : "Reps"}</label>
                        <input type="number" value={set.reps} onChange={e => updateSet(eIdx, sIdx, 'reps', e.target.value)} className="w-full bg-background border border-border text-center py-2.5 rounded-xl text-sm font-mono focus:border-primary outline-none" placeholder={isCardio ? "m" : "reps"} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[8px] uppercase text-secondary block text-center mb-1">{isCardio ? "Durée" : "RIR"}</label>
                        <input 
                            type="text" 
                            value={set.rir} 
                            onChange={e => updateSet(eIdx, sIdx, 'rir', e.target.value)} 
                            className="w-full bg-background border border-border text-center py-2.5 rounded-xl text-[10px] font-mono focus:border-primary outline-none" 
                            placeholder={isCardio ? "MM:SS" : "RIR"} 
                        />
                      </div>
                      <div className="col-span-3 flex gap-1 pt-4">
                        <button onClick={() => updateSet(eIdx, sIdx, 'done', !set.done)} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] transition-all flex flex-col items-center justify-center leading-none ${set.done ? 'bg-success text-white' : 'bg-surface2 text-secondary border border-border'}`}>
                             {set.done ? (
                                <>
                                  <span>OK</span>
                                  {set.completedAt && <span className="text-[8px] font-mono opacity-80 mt-0.5">{new Date(set.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                </>
                             ) : 'VAL'}
                        </button>
                        <button onClick={() => {
                          const deleteSet = () => {
                            const newExoSets = [...exo.sets];
                            newExoSets.splice(sIdx, 1);
                            const newExos = [...session.exercises];
                            newExos[eIdx].sets = newExoSets;
                            setSession({...session, exercises: newExos});
                          };

                          if (set.done) {
                            setPendingConfirm({
                              message: "Supprimer la série ?",
                              subMessage: "Cette série est déjà validée.",
                              variant: 'danger',
                              onConfirm: deleteSet
                            });
                          } else {
                            deleteSet();
                          }
                        }} className="p-2.5 text-danger/40">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  const newExos = [...session.exercises];
                  const last = newExos[eIdx].sets[newExos[eIdx].sets.length-1];
                  newExos[eIdx].sets.push({ weight: last?.weight || "", reps: last?.reps || "", done: false, rir: last?.rir || "" });
                  setSession({...session, exercises: newExos});
                }} className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-[10px] font-black uppercase text-secondary hover:text-primary">+ Ajouter Série</button>
              </div>
            </div>
          );
        })}
        <button onClick={() => setShowAddExoModal(true)} className="w-full py-6 border-2 border-dashed border-border rounded-[2.5rem] text-secondary font-black uppercase">+ Mouvement</button>
      </div>
    );
  };
  const renderEditorProgram = () => {
    if (!editingProgram) return null;
    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <EditorHeader
          title={editingProgram.name}
          onCancel={() => { 
              setPendingConfirm({
                  message: "Annuler les modifications ?",
                  subMessage: "Toutes les modifications non sauvegardées seront perdues.",
                  variant: 'danger',
                  onConfirm: () => {
                     setEditingProgram(null); 
                     setView(View.Programs);
                  }
              });
          }}
          onSave={() => {
             setPendingConfirm({
                 message: "Sauvegarder les modifications ?",
                 variant: 'primary',
                 onConfirm: () => {
                     const newProgs = programs.map(p => p.id === editingProgram.id ? editingProgram : p);
                     if (!programs.find(p => p.id === editingProgram.id)) newProgs.push(editingProgram);
                     setPrograms(newProgs);
                     setEditingProgram(null);
                     setView(View.Programs);
                 }
             });
          }}
          saveLabel="Sauver"
          cancelLabel="Annuler"
        >
          <input 
            value={editingProgram.name} 
            onChange={e => setEditingProgram({...editingProgram, name: e.target.value})}
            className="bg-transparent border-b border-border text-center w-full text-xl font-black italic uppercase outline-none focus:border-primary"
            placeholder="Nom du programme"
          />
        </EditorHeader>

        {editingProgram.sessions.map((sess, sIdx) => (
          <div key={sess.id} className="bg-surface border border-border rounded-[2.5rem] overflow-hidden shadow-lg p-6">
             <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-2">
                <input 
                  value={sess.name}
                  onChange={e => {
                    const newSess = [...editingProgram.sessions];
                    newSess[sIdx].name = e.target.value;
                    setEditingProgram({...editingProgram, sessions: newSess});
                  }}
                  className="bg-transparent font-black italic uppercase text-lg outline-none w-full"
                  placeholder="Nom séance (ex: Push A)"
                />
                <button onClick={() => {
                   const newSess = [...editingProgram.sessions];
                   newSess.splice(sIdx, 1);
                   setEditingProgram({...editingProgram, sessions: newSess});
                }} className="text-danger p-2">✕</button>
             </div>
             
             <div className="space-y-3">
               {sess.exos.map((ex, exIdx) => {
                 const libEx = library.find(l => l.id === ex.id);
                 const isCardio = libEx?.type === 'Cardio';
                 
                 return (
                   <div key={exIdx} className="bg-surface2/30 p-4 rounded-xl flex justify-between items-center gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-bold">{libEx?.name || ex.id}</div>
                        <div className="flex gap-2 mt-1">
                           <div className="flex flex-col">
                             <label className="text-[8px] uppercase text-secondary">Séries</label>
                             <input type="number" value={ex.sets} onChange={e => {
                                const newSess = [...editingProgram.sessions];
                                newSess[sIdx].exos[exIdx].sets = parseInt(e.target.value);
                                setEditingProgram({...editingProgram, sessions: newSess});
                             }} className="bg-background w-12 text-center rounded text-xs p-1" />
                           </div>
                           <div className="flex flex-col">
                             <label className="text-[8px] uppercase text-secondary">{isCardio ? "Dist." : "Reps"}</label>
                             <input type="text" value={ex.reps} onChange={e => {
                                const newSess = [...editingProgram.sessions];
                                newSess[sIdx].exos[exIdx].reps = e.target.value;
                                setEditingProgram({...editingProgram, sessions: newSess});
                             }} className="bg-background w-16 text-center rounded text-xs p-1" />
                           </div>
                           <div className="flex flex-col">
                             <label className="text-[8px] uppercase text-secondary">{isCardio ? "Durée" : "RIR"}</label>
                             <input type="text" value={ex.targetRir || ''} onChange={e => {
                                const newSess = [...editingProgram.sessions];
                                newSess[sIdx].exos[exIdx].targetRir = e.target.value;
                                setEditingProgram({...editingProgram, sessions: newSess});
                             }} className="bg-background w-12 text-center rounded text-xs p-1" placeholder={isCardio ? "MM:SS" : "1-2"} />
                           </div>
                           <div className="flex flex-col">
                             <label className="text-[8px] uppercase text-secondary">Repos</label>
                             <input type="number" value={ex.rest} onChange={e => {
                                const newSess = [...editingProgram.sessions];
                                newSess[sIdx].exos[exIdx].rest = parseInt(e.target.value);
                                setEditingProgram({...editingProgram, sessions: newSess});
                             }} className="bg-background w-12 text-center rounded text-xs p-1" />
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => {
                           const newSess = [...editingProgram.sessions];
                           newSess[sIdx].exos.splice(exIdx, 1);
                           setEditingProgram({...editingProgram, sessions: newSess});
                        }} className="text-danger/50 hover:text-danger">✕</button>
                        <div className="flex flex-col">
                            {exIdx > 0 && <button onClick={() => {
                                const newSess = [...editingProgram.sessions];
                                newSess[sIdx].exos = moveItem(newSess[sIdx].exos, exIdx, exIdx - 1);
                                setEditingProgram({...editingProgram, sessions: newSess});
                            }} className="text-xs text-secondary">▲</button>}
                            {exIdx < sess.exos.length - 1 && <button onClick={() => {
                                const newSess = [...editingProgram.sessions];
                                newSess[sIdx].exos = moveItem(newSess[sIdx].exos, exIdx, exIdx + 1);
                                setEditingProgram({...editingProgram, sessions: newSess});
                            }} className="text-xs text-secondary">▼</button>}
                        </div>
                      </div>
                   </div>
                 );
               })}
               <button onClick={() => {
                  setProgramExoPicker(sIdx);
               }} className="w-full py-3 border border-dashed border-border rounded-xl text-xs font-bold uppercase text-secondary">+ Exo</button>
             </div>
          </div>
        ))}
        
        <button onClick={() => {
           setEditingProgram({
             ...editingProgram,
             sessions: [...editingProgram.sessions, { id: Date.now().toString(), name: "Nouvelle Séance", exos: [] }]
           });
        }} className="w-full py-4 bg-surface border border-border rounded-[2rem] text-sm font-black uppercase text-secondary">+ Ajouter Séance</button>
      </div>
    );
  };

  const renderPrograms = () => (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black italic uppercase">Programmes</h2>
        <button onClick={() => {
           setEditingProgram({ id: Date.now().toString(), name: "Nouveau Programme", sessions: [] });
           setView(View.EditorProgram);
        }} className="px-4 py-2 bg-primary text-background rounded-full text-xs font-black uppercase">+ Créer</button>
      </div>
      
      {programs.map(prog => (
        <div key={prog.id} className="bg-surface border border-border rounded-[2.5rem] p-6 shadow-lg">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-black italic uppercase">{prog.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => {
                  // DEEP COPY to allow cancel without mutations
                  setEditingProgram(JSON.parse(JSON.stringify(prog)));
                  setView(View.EditorProgram);
                }} className="p-2 bg-surface2 rounded-full text-secondary"><Icons.Settings /></button>
                <button onClick={() => {
                   setPendingConfirm({
                     message: "Supprimer le programme ?",
                     variant: 'danger',
                     onConfirm: () => setPrograms(prev => prev.filter(p => p.id !== prog.id))
                   });
                }} className="p-2 bg-danger/10 text-danger rounded-full">✕</button>
              </div>
           </div>
           
           <div className="space-y-2">
             {prog.sessions.map(sess => (
               <div key={sess.id} className="bg-background/50 p-4 rounded-2xl flex justify-between items-center">
                  <span className="font-bold text-sm text-secondary">{sess.name}</span>
                  <button onClick={() => setPreviewSession({ programName: prog.name, session: sess })} className="px-4 py-2 bg-primary text-background text-[10px] font-black uppercase rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all">
                    Aperçu
                  </button>
               </div>
             ))}
           </div>
        </div>
      ))}
    </div>
  );

  const renderLibrary = () => {
    // ENHANCED SEARCH: Check Name, Muscle, Type, and ID
    const filteredLib = library.filter(l => {
        const q = libraryFilter.toLowerCase();
        return l.name.toLowerCase().includes(q) || 
               l.muscle.toLowerCase().includes(q) ||
               l.type.toLowerCase().includes(q) ||
               l.id.toLowerCase().includes(q);
    }).sort((a,b) => a.name.localeCompare(b.name));

    return (
     <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black italic uppercase">Bibliothèque</h2>
          <button onClick={() => setEditingExercise({ id: '', name: '', type: 'Isolation', muscle: 'Pectoraux', equipment: 'BB', tips: {} })} className="px-4 py-2 bg-primary text-background rounded-full text-xs font-black uppercase">+ Exo</button>
        </div>
        
        <input 
           value={libraryFilter}
           onChange={e => setLibraryFilter(e.target.value)}
           placeholder="Rechercher (Nom, Muscle, Cardio...)"
           className="w-full bg-surface border border-border p-3 rounded-2xl outline-none focus:border-primary text-sm"
        />
        
        <div className="grid gap-3">
           {filteredLib.map(l => (
             <div key={l.id} className="bg-surface border border-border p-4 rounded-2xl flex justify-between items-center">
                <div>
                   <div className="font-bold">{l.name}</div>
                   <div className="text-[10px] text-secondary uppercase mt-1">{l.muscle} • {l.equipment}</div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setEditingExercise(l)} className="text-secondary p-2"><Icons.Settings /></button>
                   <button onClick={() => handleDeleteExo(l.id)} className="text-danger p-2">✕</button>
                </div>
             </div>
           ))}
        </div>
     </div>
    );
  };

  const renderSettings = () => (
     <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <h2 className="text-2xl font-black italic uppercase px-1">Paramètres</h2>
        
        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-lg">
           <h3 className="text-sm font-black uppercase text-secondary mb-4">Thème</h3>
           <div className="flex gap-3 justify-center">
             {(Object.keys(THEMES) as AccentColor[]).map(c => (
                <button 
                  key={c}
                  onClick={() => setAccentColor(c)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${accentColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50'}`}
                  style={{ backgroundColor: THEMES[c].primary }}
                />
             ))}
           </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-lg space-y-4">
           <h3 className="text-sm font-black uppercase text-secondary">Sauvegarde (JSON)</h3>
           <div className="grid grid-cols-2 gap-3">
               <button onClick={() => downloadFile(JSON.stringify({ history, programs, library }, null, 2), `backup_iron_${new Date().toISOString().split('T')[0]}.json`)} className="py-4 bg-surface2 rounded-2xl text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-2 hover:bg-surface2/80 transition-colors">
                  <span className="text-primary scale-125"><Icons.Download /></span>
                  <span>Exporter</span>
               </button>
               <label className="py-4 bg-surface2 rounded-2xl text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface2/80 transition-colors">
                  <span className="text-primary scale-125"><Icons.Upload /></span>
                  <span>Importer</span>
                  <input type="file" className="hidden" accept=".json" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                         const reader = new FileReader();
                         reader.onload = (ev) => {
                            try {
                               const data = JSON.parse(ev.target?.result as string);
                               if (data.history) setHistory(data.history);
                               if (data.programs) setPrograms(data.programs);
                               if (data.library) setLibrary(data.library);
                               alert("Import réussi !");
                            } catch (err) {
                               alert("Fichier invalide");
                            }
                         };
                         reader.readAsText(file);
                      }
                  }} />
               </label>
           </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-lg space-y-4">
           <h3 className="text-sm font-black uppercase text-secondary">Exports Analytiques</h3>
           <button onClick={() => {
               const csv = generateCSV(history, library);
               downloadFile(csv, `irontracker_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
           }} className="w-full py-4 bg-surface2 rounded-2xl text-xs font-bold uppercase flex items-center justify-center gap-3 hover:bg-surface2/80 transition-colors">
              <span className="text-success scale-125"><Icons.Table /></span> Export CSV Complet (Excel)
           </button>
        </div>

        <div className="bg-danger/5 border border-danger/20 p-6 rounded-[2.5rem] shadow-lg space-y-4">
            <h3 className="text-sm font-black uppercase text-danger">Zone de Danger</h3>
            <button onClick={() => setPendingConfirm({
                message: "Réinitialiser TOUTES les données ?",
                subMessage: "L'historique, les programmes et la bibliothèque seront effacés. Cette action est irréversible.",
                variant: 'danger',
                onConfirm: () => {
                    localStorage.clear();
                    window.location.reload();
                }
            })} className="w-full py-3 bg-danger/10 text-danger rounded-xl text-xs font-bold uppercase border border-danger/20">
                Tout effacer (Reset Factory)
            </button>
        </div>
        
        {installPrompt && (
           <button onClick={() => {
              installPrompt.prompt();
              installPrompt.userChoice.then(res => {
                 if (res.outcome === 'accepted') setInstallPrompt(null);
              });
           }} className="w-full py-4 bg-primary text-background rounded-[2rem] text-sm font-black uppercase shadow-xl animate-pulse">
              Installer l'Application
           </button>
        )}
     </div>
  );
  
  const renderRecords = () => (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
         <div className="flex justify-between items-center px-1">
            <h2 className="text-2xl font-black italic uppercase">Records</h2>
            <button onClick={() => setView(View.OneRMCalculator)} className="text-[10px] font-black uppercase bg-surface2 px-3 py-1.5 rounded-full">Calculateur 1RM</button>
         </div>

         <div className="grid gap-4">
            {MUSCLE_ORDER.filter(m => m !== 'Cardio').map(muscle => {
               const exos = library.filter(l => l.muscle === muscle);
               const stats = exos.map(e => ({ name: e.name, ...getExerciseStats(e.id, history) })).filter(s => s.pr > 0).sort((a,b) => b.pr - a.pr);
               if (stats.length === 0) return null;
               
               return (
                  <div key={muscle} className="bg-surface border border-border p-5 rounded-[2rem]">
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
                  </div>
               );
            })}
         </div>
      </div>
  );

  const renderAnalytics = () => (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <h2 className="text-2xl font-black italic uppercase px-1">Progrès</h2>

        {/* Global Controls */}
        <div className="bg-surface border border-border p-2 rounded-[2rem] flex p-1">
             {['7d','30d','90d','1y','all'].map(p => (
                 <button key={p} onClick={() => setAnalyticsPeriod(p as any)} className={`flex-1 py-2 rounded-full text-[10px] font-black uppercase transition-all ${analyticsPeriod === p ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-white'}`}>
                    {p}
                 </button>
             ))}
        </div>

        {/* PROGRESSION CHART */}
        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-lg">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase text-secondary">Progression</h3>
              <select value={analyticsExo} onChange={e => setAnalyticsExo(e.target.value)} className="bg-surface2 text-xs font-bold px-3 py-1.5 rounded-full outline-none max-w-[150px]">
                  <option value="">Sélectionner Exercice</option>
                  {library.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
           </div>
           
           <div className="h-64 w-full">
              {progData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={progData}>
                        <defs>
                           <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#8b949e'}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{fontSize: 10, fill: '#8b949e'}} axisLine={false} tickLine={false} dx={-10} domain={['auto', 'auto']} />
                        <Tooltip 
                           contentStyle={{backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px'}} 
                           itemStyle={{color: '#fff', fontSize: '12px', fontWeight: 'bold'}}
                           labelStyle={{color: '#8b949e', fontSize: '10px', marginBottom: '4px'}}
                        />
                        <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                     </AreaChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-full flex items-center justify-center text-secondary text-xs italic opacity-50">
                      Veuillez sélectionner un exercice ci-dessus pour voir l'historique
                  </div>
              )}
           </div>
           
           <div className="flex justify-center gap-4 mt-4">
              {['max', 'volume', 'tonnage'].map(m => (
                 <button key={m} onClick={() => setAnalyticsMetric(m as any)} className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border transition-all ${analyticsMetric === m ? 'bg-primary/20 border-primary text-primary' : 'border-transparent text-secondary hover:text-white'}`}>
                    {m}
                 </button>
              ))}
           </div>
        </div>

        {/* VOLUME SEMAINE */}
        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase text-secondary">Volume Hebdo</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold bg-surface2 px-2 py-1 rounded-full">
                    <button onClick={() => setCurrentWeekOffset(prev => prev - 1)} className="text-secondary hover:text-white px-2">◀</button>
                    <button onClick={() => setCurrentWeekOffset(0)} className="text-primary hover:text-white px-1">RST</button>
                    <span className="mx-1 text-secondary/50">|</span>
                    <span>{weekStart.toLocaleDateString()}</span>
                    <button onClick={() => setCurrentWeekOffset(prev => prev + 1)} className="text-secondary hover:text-white px-2">▶</button>
                </div>
            </div>
            
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={volumeData} layout="vertical" margin={{left: 20}}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tick={{fontSize: 9, fill: '#8b949e'}} width={70} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                        contentStyle={{backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px'}} 
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="sets" radius={[0, 4, 4, 0]} barSize={16}>
                        {volumeData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={MUSCLE_COLORS[entry.name] || '#58a6ff'} />
                        ))}
                        <LabelList dataKey="sets" position="right" fill="#e6edf3" fontSize={10} formatter={(v: number) => v > 0 ? v : ''} />
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center text-[9px] text-secondary mt-2 font-mono">
               Séries EFFECTIVES (RIR ≤ 4) uniquement
            </div>
        </div>

        {/* SBD RATIO & TRACKING */}
        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-lg">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-black uppercase text-secondary">SBD Tracker</h3>
               <div className="flex bg-surface2 rounded-full p-0.5">
                  <button onClick={() => setSbdViewMode('tracking')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${sbdViewMode === 'tracking' ? 'bg-primary text-background' : 'text-secondary'}`}>Tracking</button>
                  <button onClick={() => setSbdViewMode('ratio')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${sbdViewMode === 'ratio' ? 'bg-primary text-background' : 'text-secondary'}`}>Niveaux</button>
               </div>
            </div>
            
            {sbdViewMode === 'ratio' && (
                <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar pb-1">
                    {(['global', 'squat', 'bench', 'deadlift'] as const).map(cat => (
                         <button key={cat} onClick={() => setSbdRatioCategory(cat)} className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase whitespace-nowrap transition-all ${sbdRatioCategory === cat ? 'bg-primary/20 border-primary text-primary' : 'border-transparent text-secondary hover:text-white'}`}>
                             {cat}
                         </button>
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
                            <YAxis 
                                yAxisId="left" 
                                tick={{fontSize: 10, fill: '#8b949e'}}
                                tickFormatter={(val) => Number(val).toFixed(1)}
                                axisLine={false} 
                                tickLine={false} 
                                dx={-10} 
                                domain={[0, (dataMax: number) => {
                                    const catMax = RATIO_ZONES[sbdRatioCategory][0].max; // Ensure at least lowest zone is visible
                                    return parseFloat((Math.max(dataMax, catMax) * 1.2).toFixed(2));
                                }]}
                            />
                        ) : (
                            <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#8b949e'}} axisLine={false} tickLine={false} dx={-10} domain={['auto', 'auto']} />
                        )}
                        <YAxis yAxisId="right" orientation="right" hide />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px'}} 
                            labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                        />
                        
                        {sbdViewMode === 'tracking' ? (
                           <>
                              <Area yAxisId="left" type="monotone" dataKey="sbd" name="Total SBD" stroke="var(--primary)" fill="url(#colorVal)" strokeWidth={3} />
                              <Line yAxisId="right" type="monotone" dataKey="bw" name="Poids Corps" stroke="#ff7b72" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                           </>
                        ) : (
                           <>
                             {RATIO_ZONES[sbdRatioCategory].map((level, i) => (
                                 <ReferenceArea 
                                    key={i} 
                                    yAxisId="left" 
                                    y1={i === 0 ? 0 : RATIO_ZONES[sbdRatioCategory][i-1].max} 
                                    y2={level.max} 
                                    fill={level.color} 
                                    fillOpacity={0.05} 
                                    label={{
                                        value: `${level.label} (≤${level.max})`,
                                        position: 'insideTopRight',
                                        fill: '#8b949e',
                                        fontSize: 10,
                                        opacity: 0.7
                                    }}
                                 />
                             ))}
                             <Line 
                                yAxisId="left" 
                                type="monotone" 
                                dataKey={sbdRatioCategory === 'global' ? 'ratioGlobal' : sbdRatioCategory === 'squat' ? 'ratioSquat' : sbdRatioCategory === 'bench' ? 'ratioBench' : 'ratioDeadlift'} 
                                name={`Ratio ${sbdRatioCategory.toUpperCase()}`} 
                                stroke="#d29922" 
                                strokeWidth={3} 
                                dot={{r: 4, fill: '#d29922'}} 
                                connectNulls
                             />
                           </>
                        )}
                     </ComposedChart>
                  </ResponsiveContainer>
               </div>
            ) : (
               <div className="h-64 flex items-center justify-center text-secondary text-xs italic">
                  Pas assez de données (Squat + Bench + Deadlift requis)
               </div>
            )}
        </div>
      </div>
    );

    const renderOneRMCalc = () => (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <h2 className="text-2xl font-black italic uppercase px-1">Calculateur 1RM</h2>
        
        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-lg space-y-4">
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
             <div className="text-[10px] font-black uppercase text-secondary mb-2">Estimation 1RM (Wathen)</div>
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
        </div>

        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-lg space-y-6">
           <h3 className="text-sm font-black uppercase text-secondary">Convertisseur</h3>
           
           <div className="space-y-2">
              <label className="text-[10px] uppercase text-secondary">Barre (Total) ➔ Haltères (Par main)</label>
              <div className="flex gap-2">
                 <input type="number" value={convBB} onChange={e => {
                    setConvBB(e.target.value);
                    setConvDB(e.target.value ? Math.round((parseFloat(e.target.value) * 0.80) / 2).toString() : ""); // NEW RATIO 0.80
                 }} placeholder="Barre..." className="w-full bg-background border border-border p-3 rounded-xl text-center font-mono outline-none" />
                 <div className="flex items-center text-secondary">➔</div>
                 <div className="w-full bg-surface2 p-3 rounded-xl text-center font-mono font-bold text-primary">{convDB}</div>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] uppercase text-secondary">Haltères (Par main) ➔ Barre (Total)</label>
              <div className="flex gap-2">
                 <input type="number" value={convDB} onChange={e => {
                    setConvDB(e.target.value);
                    setConvBB(e.target.value ? Math.round((parseFloat(e.target.value) * 2) / 0.80).toString() : ""); // NEW RATIO 0.80
                 }} placeholder="Haltère..." className="w-full bg-background border border-border p-3 rounded-xl text-center font-mono outline-none" />
                 <div className="flex items-center text-secondary">➔</div>
                 <div className="w-full bg-surface2 p-3 rounded-xl text-center font-mono font-bold text-primary">{convBB}</div>
              </div>
           </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 pb-safe" style={getAccentStyle(accentColor)}>
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-30 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-6">
        <h1 className="text-2xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-glow cursor-pointer" onClick={() => setView(View.Dashboard)}>
          IRON<span className="text-foreground">TRACKER</span>
        </h1>
        <div className="flex items-center gap-2">
            {view === View.Workout && !restTarget && (
                <button onClick={() => setRestTarget(Date.now() + 60000)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-secondary active:scale-90 transition-transform">
                    ⏱️
                </button>
            )}
            {/* Show Header Timer only if Bottom Overlay is NOT showing */}
            {restTime !== null && view !== View.Workout && (
               <button onClick={() => setRestTarget(null)} className="px-3 py-1 bg-surface border border-primary/30 rounded-full flex items-center gap-2 animate-pulse hover:bg-surface2 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-mono font-bold text-primary text-xs">{Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}</span>
               </button>
            )}
            {session && view === View.Workout && (
                <div className="px-3 py-1 bg-surface2/50 text-white text-[10px] font-mono font-bold rounded-full border border-border">
                    {timerString}
                </div>
            )}
            {session && view !== View.Workout && (
                <button onClick={() => setView(View.Workout)} className="px-3 py-1 bg-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-full border border-green-500/50 animate-pulse">
                    En cours {timerString}
                </button>
            )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-20 px-4 max-w-lg mx-auto min-h-screen">
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

      {/* BOTTOM NAV */}
      {view !== View.Workout && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-surface/90 backdrop-blur-xl border border-border/50 rounded-full px-6 py-3 shadow-2xl flex items-center gap-8">
          <button onClick={() => setView(View.Dashboard)} className={`transition-colors ${view === View.Dashboard ? 'text-primary' : 'text-secondary hover:text-white'}`}><Icons.Dashboard /></button>
          <button onClick={() => setView(View.Programs)} className={`transition-colors ${view === View.Programs ? 'text-primary' : 'text-secondary hover:text-white'}`}><Icons.Programs /></button>
          <button onClick={() => setView(View.Library)} className={`transition-colors ${view === View.Library ? 'text-primary' : 'text-secondary hover:text-white'}`}><Icons.Note /></button>
          <button onClick={() => setView(View.Settings)} className={`transition-colors ${view === View.Settings ? 'text-primary' : 'text-secondary hover:text-white'}`}><Icons.Settings /></button>
        </nav>
      )}

      {/* --- REST TIMER FULLSCREEN OVERLAY (Optional but requested logic implicit) --- */}
      {restTime !== null && view === View.Workout && (
          <div className="fixed inset-x-0 bottom-0 z-40 p-4 pointer-events-none">
             <div className={`bg-surface/90 backdrop-blur border ${showGo ? 'border-success bg-success/20' : 'border-border'} p-4 rounded-3xl shadow-2xl pointer-events-auto flex justify-between items-center animate-in slide-in-from-bottom duration-300 transition-colors`}>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase text-secondary">Repos</span>
                   {showGo ? (
                       <span className="text-3xl font-black italic text-success animate-pulse">GO !</span>
                   ) : (
                       <span className="text-3xl font-mono font-bold text-primary">{Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}</span>
                   )}
                </div>
                {!showGo && (
                    <div className="flex gap-2">
                       <button onClick={() => setRestTarget(prev => (prev || Date.now()) - 30000)} className="w-10 h-10 rounded-full bg-surface2 border border-border text-white font-bold active:scale-90">-30</button>
                       <button onClick={() => setRestTarget(prev => (prev || Date.now()) + 30000)} className="w-10 h-10 rounded-full bg-surface2 border border-border text-white font-bold active:scale-90">+30</button>
                       <button onClick={() => setRestTarget(null)} className="w-10 h-10 rounded-full bg-danger/20 border border-danger/40 text-danger font-bold active:scale-90">✕</button>
                    </div>
                )}
             </div>
          </div>
      )}

      {/* MODALS */}
      {selectedDaySessions && (
          <Modal title={`Séances du ${selectedDaySessions[0]?.startTime ? new Date(selectedDaySessions[0].startTime).toLocaleDateString() : ''}`} onClose={() => setSelectedDaySessions(null)}>
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
                                <div className="text-[10px] text-secondary">{s.programName}</div>
                                <div className="text-[10px] text-secondary mt-1">Forme : {s.fatigue}/5</div>
                             </div>
                             <div className="text-right flex flex-col items-end">
                                <div className="text-[10px] font-mono text-secondary">
                                    {startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                    {endTime && ` - ${endTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
                                </div>
                                {duration && <div className="text-[10px] font-black uppercase text-primary mt-1">{Math.floor(duration/60)}h{String(duration%60).padStart(2, '0')}</div>}
                             </div>
                          </div>
                          <div className="space-y-3">
                              {s.exercises.map(ex => {
                                  const doneSets = ex.sets.filter(st => st.done);
                                  if (doneSets.length === 0) return null;
                                  
                                  const libEx = library.find(l => l.id === ex.id);
                                  const isCardio = libEx?.type === 'Cardio';

                                  const weightStr = doneSets.map(st => st.weight).join(',');
                                  const repStr = doneSets.map(st => st.reps).join(',');
                                  // Cardio formatting in history: Parse stored seconds back to MM:SS if possible
                                  const rirStr = doneSets.map(st => isCardio ? formatDuration(st.rir || '0') : (st.rir || '-')).join(',');

                                  return (
                                      <div key={ex.id} className="text-xs">
                                          <div className="font-bold text-white mb-0.5">{libEx?.name || ex.id}</div>
                                          <div className="font-mono text-secondary text-[11px] mb-1">
                                            {weightStr} {isCardio ? "Lvl" : "kg"} x {repStr} {isCardio ? "m" : "reps"} | {isCardio ? "" : "RIR "}{rirStr}
                                          </div>
                                          {ex.notes && (
                                              <div className="flex items-start gap-1.5 mt-0.5 text-[10px] text-secondary/70 italic pl-1 border-l-2 border-secondary/20">
                                                  <span className="scale-75 opacity-70"><Icons.Note /></span>
                                                  <span>{ex.notes}</span>
                                              </div>
                                          )}
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
                          const libEx = library.find(l => l.id === ex.id);
                          return (
                              <div key={idx} className="bg-surface2/30 p-3 rounded-xl flex justify-between items-center">
                                  <div>
                                      <div className="font-bold text-sm">{libEx?.name || ex.id}</div>
                                      <div className="text-[10px] text-secondary uppercase">{libEx?.muscle}</div>
                                  </div>
                                  <div className="text-right text-xs font-mono">
                                      <div className="text-white font-bold">{ex.sets} x {ex.reps}</div>
                                      <div className="text-secondary">{ex.rest}s</div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
                  <button onClick={() => startSession(previewSession.programName, previewSession.session)} className="w-full py-4 bg-primary text-background font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all">
                      Démarrer la séance
                  </button>
              </div>
          </Modal>
      )}

      {showAddExoModal && (
         <Modal title="Ajouter Exercice" onClose={() => setShowAddExoModal(false)}>
            <div className="space-y-4">
               <input 
                 autoFocus
                 placeholder="Rechercher (Nom, Muscle, Cardio...)" 
                 className="w-full bg-surface2 p-3 rounded-xl outline-none" 
                 onChange={(e) => setLibraryFilter(e.target.value)}
               />
               <div className="max-h-60 overflow-y-auto space-y-2">
                 {library.filter(l => {
                    const q = libraryFilter.toLowerCase();
                    return l.name.toLowerCase().includes(q) || 
                           l.muscle.toLowerCase().includes(q) ||
                           l.type.toLowerCase().includes(q) ||
                           l.id.toLowerCase().includes(q);
                 }).map(l => (
                    <button key={l.id} onClick={() => {
                       if (session) {
                          const newExos = [...session.exercises, {
                             id: l.id,
                             target: "3 x 10",
                             rest: 120,
                             isBonus: true,
                             notes: "",
                             sets: [{ weight: "", reps: "", done: false }]
                          }];
                          setSession({...session, exercises: newExos});
                       }
                       setShowAddExoModal(false);
                    }} className="w-full p-3 bg-surface2/50 rounded-xl text-left hover:bg-surface2 transition-colors flex justify-between items-center">
                       <div>
                          <div className="font-bold text-sm">{l.name}</div>
                          <div className="text-[10px] text-secondary">{l.muscle}</div>
                       </div>
                       <div className="text-xl text-primary">+</div>
                    </button>
                 ))}
               </div>
            </div>
         </Modal>
      )}

      {programExoPicker !== null && (
          <Modal title="Choisir Exercice" onClose={() => setProgramExoPicker(null)}>
             <div className="space-y-4">
               <input 
                 autoFocus
                 placeholder="Rechercher (Nom, Muscle, Cardio...)" 
                 className="w-full bg-surface2 p-3 rounded-xl outline-none" 
                 onChange={(e) => setLibraryFilter(e.target.value)}
               />
               <div className="max-h-60 overflow-y-auto space-y-2">
                 {library.filter(l => {
                    const q = libraryFilter.toLowerCase();
                    return l.name.toLowerCase().includes(q) || 
                           l.muscle.toLowerCase().includes(q) ||
                           l.type.toLowerCase().includes(q) ||
                           l.id.toLowerCase().includes(q);
                 }).map(l => (
                    <button key={l.id} onClick={() => {
                        if (editingProgram && programExoPicker !== null) {
                            const newSess = [...editingProgram.sessions];
                            newSess[programExoPicker].exos.push({ id: l.id, sets: 3, reps: "10", rest: 120 });
                            setEditingProgram({...editingProgram, sessions: newSess});
                        }
                        setProgramExoPicker(null);
                    }} className="w-full p-3 bg-surface2/50 rounded-xl text-left hover:bg-surface2 transition-colors flex justify-between items-center">
                       <div>
                          <div className="font-bold text-sm">{l.name}</div>
                          <div className="text-[10px] text-secondary">{l.muscle}</div>
                       </div>
                       <div className="text-xl text-primary">+</div>
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
                        <option value="Polyarticulaire">Poly.</option>
                        <option value="Isolation">Iso.</option>
                        <option value="Cardio">Cardio</option>
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
                  <label className="text-[10px] font-black uppercase text-secondary">Conseils Techniques</label>
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
                     setLibrary(prev => [...prev, { ...editingExercise, id: editingExercise.name.toLowerCase().replace(/\s+/g, '_') }]);
                  }
                  setEditingExercise(null);
               }} className="w-full py-3 bg-primary text-background font-black uppercase rounded-xl">Sauvegarder</button>
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
                  <button onClick={() => {
                     pendingConfirm.onConfirm();
                     setPendingConfirm(null);
                  }} className={`py-3 rounded-xl text-xs font-bold uppercase text-white ${pendingConfirm.variant === 'primary' ? 'bg-primary' : 'bg-danger'}`}>
                     Confirmer
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
