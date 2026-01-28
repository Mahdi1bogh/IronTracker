
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ProgramSession } from './types';
import { THEMES } from './constants';
import { triggerHaptic } from './utils';
import { storage } from './services/storage';

// Store & Hooks
import { useStore } from './store/useStore';
import { useTimer } from './hooks/useTimer';
import { usePWA } from './hooks/usePWA';

// Views & Components
import { Icons } from './components/Icons';
import { Modal } from './components/ui/Modal';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { DashboardView } from './views/DashboardView';
import { WorkoutView } from './views/WorkoutView';
import { AnalyticsView } from './views/AnalyticsView';
import { ProgramsView } from './views/ProgramsView';
import { LibraryView } from './views/LibraryView';
import { SettingsView } from './views/SettingsView';
import { RecordsView } from './views/RecordsView';
import { OneRMView, ConverterView, PlateCalcView } from './views/ToolsView';
import { ProgramEditorView } from './views/ProgramEditorView';
import { HistoryEditorView } from './views/HistoryEditorView';
import { WorkoutToolsModal } from './components/tools/WorkoutToolsModal';

export default function App() {
  // Global State
  const history = useStore(s => s.history);
  const session = useStore(s => s.session);
  const accentColor = useStore(s => s.accentColor);
  const isLoaded = useStore(s => s.isLoaded);
  const library = useStore(s => s.library);
  const setSession = useStore(s => s.setSession);
  const initData = useStore(s => s.initData);

  // Persistence Subscription
  useEffect(() => {
      initData();
      const unsub = useStore.subscribe((state, prevState) => {
          if (state.history !== prevState.history) storage.history.save(state.history);
          if (state.library !== prevState.library) storage.library.save(state.library);
          if (state.programs !== prevState.programs) storage.programs.save(state.programs);
          if (state.accentColor !== prevState.accentColor) storage.theme.save(state.accentColor);
          if (state.session !== prevState.session) storage.session.save(state.session);
      });
      return unsub;
  }, [initData]);

  // Timers
  const { 
    timerString, 
    restTarget, setRestTarget, 
    restTime, showGo 
  } = useTimer();

  const { installPrompt } = usePWA();
  const navigate = useNavigate();
  const location = useLocation();

  // Local UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  
  // Modals
  const [previewSession, setPreviewSession] = useState<{ programName: string, session: ProgramSession, mode?: 'active'|'log' } | null>(null);

  // Initial Redirect
  useEffect(() => {
    if (isLoaded && session && location.pathname !== '/workout') {
      navigate('/workout');
    }
  }, [isLoaded, session, navigate, location.pathname]);

  useEffect(() => {
      setIsMenuOpen(false);
      setShowToolsModal(false);
  }, [location.pathname]);

  // Actions
  const startSession = (progName: string, sess: any, mode: 'active' | 'log' = 'active') => {
      triggerHaptic('success');
      setSession({
        id: Date.now(),
        programName: progName,
        sessionName: sess.name,
        startTime: sess.startTime || Date.now(),
        bodyWeight: history[0]?.bodyWeight || "",
        fatigue: "3",
        mode: mode,
        exercises: sess.exos.map((e:any) => ({
            exerciseId: e.exerciseId,
            target: `${e.sets} x ${e.reps}`,
            rest: e.rest,
            targetRir: e.targetRir, 
            isBonus: false,
            notes: "",
            sets: Array(e.sets).fill(null).map(() => ({ weight: "", reps: "", done: sess.startTime ? true : false, rir: e.targetRir || "" }))
        }))
      });
      navigate('/workout');
      setPreviewSession(null);
  };

  const getAccentStyle = () => {
    const theme = THEMES[accentColor] || THEMES.blue;
    return { '--primary': theme.primary, '--primary-glow': theme.glow } as React.CSSProperties;
  };

  const isWorkoutView = location.pathname === '/workout';
  const isLogMode = session?.mode === 'log';
  const showBottomNav = ['/', '/programs', '/library', '/settings'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 pb-safe" style={getAccentStyle()}>
      <header className="fixed top-0 inset-x-0 z-30 bg-background/80 backdrop-blur-md border-b border-border h-16 flex justify-center px-4">
        <div className="w-full max-w-lg flex items-center justify-between">
            <h1 className="text-2xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-glow cursor-pointer" onClick={() => { if(!session) { triggerHaptic('click'); navigate('/'); } }}>IRON<span className="text-foreground">TRACKER</span></h1>
            <div className="flex items-center gap-2">
                {isWorkoutView && !isLogMode && !restTarget && <button onClick={() => { triggerHaptic('click'); setRestTarget(Date.now() + 180000); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-secondary active:scale-90 transition-transform">⏱️</button>}
                {restTime !== null && !isWorkoutView && <button onClick={() => { triggerHaptic('click'); navigate('/workout'); }} className="px-3 py-1 bg-surface border border-primary/30 rounded-full flex items-center gap-2 animate-pulse hover:bg-surface2 transition-colors"><span className="w-2 h-2 rounded-full bg-primary" /><span className="font-mono font-bold text-primary text-xs">{Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}</span></button>}
                {session && isWorkoutView && !isLogMode && <div className="px-3 py-1 bg-surface2/50 text-white text-[10px] font-mono font-bold rounded-full border border-border">{timerString}</div>}
                {session && !isWorkoutView && <button onClick={() => { triggerHaptic('click'); navigate('/workout'); }} className="px-3 py-1 bg-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-full border border-green-500/50 animate-pulse">En cours</button>}
                {isWorkoutView ? (
                    <button onClick={() => { triggerHaptic('click'); setShowToolsModal(true); }} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-secondary hover:text-white`}>
                        <Icons.Tools size={20} />
                    </button>
                ) : null}
            </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-lg mx-auto min-h-screen pb-32">
        <Routes>
          <Route path="/" element={<DashboardView onStartSession={startSession} />} />
          <Route path="/workout" element={session ? <WorkoutView /> : <Navigate to="/" />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/tools/1rm" element={<OneRMView />} />
          <Route path="/tools/converter" element={<ConverterView />} />
          <Route path="/tools/plate" element={<PlateCalcView />} />
          <Route path="/programs" element={<ProgramsView onStartPreview={(name, sess) => setPreviewSession({programName: name, session: sess, mode: 'active'})} />} />
          <Route path="/programs/edit/:id" element={<ProgramEditorView />} />
          <Route path="/library" element={<LibraryView />} />
          <Route path="/settings" element={<SettingsView installPrompt={installPrompt} />} />
          <Route path="/records" element={<RecordsView />} />
          <Route path="/history/edit/:id" element={<HistoryEditorView />} />
        </Routes>
      </main>

      {(showBottomNav || isMenuOpen) && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30 pointer-events-none animate-slide-in-bottom">
            <nav className="w-full max-w-lg mx-6 h-20 bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/50 flex items-center justify-around px-2 pointer-events-auto">
            {[
                { path: '/', icon: <Icons.Dashboard />, label: "Home" },
                { path: '/programs', icon: <Icons.Programs />, label: "Progs" },
                { path: '/library', icon: <Icons.Note />, label: "Biblio" },
                { path: '/settings', icon: <Icons.Settings />, label: "Config" },
            ].map((item) => {
                const isActive = location.pathname === item.path;
                return (
                <button
                    key={item.path}
                    onClick={() => { triggerHaptic('click'); navigate(item.path); }}
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

      {restTime !== null && isWorkoutView && (
          <div className={`fixed left-0 right-0 z-40 p-4 flex justify-center pointer-events-none transition-all duration-300 ease-in-out bottom-0`}>
             <div className={`w-full max-w-lg bg-surface/90 backdrop-blur border ${showGo ? 'border-success bg-success/20' : 'border-border'} p-4 rounded-[2rem] shadow-2xl pointer-events-auto flex justify-between items-center animate-slide-in-bottom transition-colors`}>
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

      {previewSession && (
          <Modal title={previewSession.session.name} onClose={() => setPreviewSession(null)}>
              <div className="space-y-6">
                  <div className="text-center">
                      <div className="text-xs uppercase text-secondary mb-1">Programme</div>
                      <div className="font-black italic text-lg">{previewSession.programName}</div>
                  </div>
                  <div className="space-y-3">
                      {previewSession.session.exos.map((ex, idx) => {
                          const libEx = library.find(l => l.id === ex.exerciseId);
                          return (
                              <div key={idx} className="bg-surface2/30 p-3 rounded-2xl flex justify-between items-center">
                                  <div><div className="font-bold text-sm">{libEx?.name || `Exo #${ex.exerciseId}`}</div><div className="text-[10px] text-secondary uppercase">{libEx?.muscle}</div></div>
                                  <div className="text-right text-xs font-mono"><div className="text-white font-bold">{ex.sets} x {ex.reps}</div><div className="text-secondary">{ex.rest}s</div></div>
                              </div>
                          )
                      })}
                  </div>
                  <button onClick={() => startSession(previewSession.programName, previewSession.session, previewSession.mode)} className="w-full py-4 bg-primary text-background font-black uppercase rounded-[2rem] shadow-xl active:scale-95 transition-all">Démarrer la séance</button>
              </div>
          </Modal>
      )}

      {/* WORKOUT TOOLS MODAL */}
      {showToolsModal && <WorkoutToolsModal onClose={() => setShowToolsModal(false)} />}

      {/* GLOBAL CONFIRMATION MODAL */}
      <ConfirmationModal />
    </div>
  );
}
