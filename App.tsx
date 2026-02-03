
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ProgramSession } from './core/types';
import { THEMES } from './core/constants';
import { triggerHaptic } from './core/utils';
import { storage } from './services/storage';

// Store & Hooks
import { useStore } from './store/useStore';
import { useTimer } from './hooks/useTimer';
import { usePWA } from './hooks/usePWA';

// Views & Layouts
import { Modal } from './components/ui/Modal';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { AppHeader } from './components/common/AppHeader';
import { RestTimerOverlay } from './components/common/RestTimerOverlay';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { WorkoutToolsModal } from './components/common/WorkoutToolsModal';
import { Icons } from './components/icons/Icons';

// Lazy Features (Feature-Based Architecture)
const DashboardView = React.lazy(() => import('./features/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const WorkoutView = React.lazy(() => import('./features/workout/WorkoutView').then(m => ({ default: m.WorkoutView })));
const AnalyticsView = React.lazy(() => import('./features/analytics/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const ProgramsView = React.lazy(() => import('./features/programs/ProgramsView').then(m => ({ default: m.ProgramsView })));
const ProgramEditorView = React.lazy(() => import('./features/programs/ProgramEditorView').then(m => ({ default: m.ProgramEditorView })));
const LibraryView = React.lazy(() => import('./features/library/LibraryView').then(m => ({ default: m.LibraryView })));
const SettingsView = React.lazy(() => import('./features/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const HistoryEditorView = React.lazy(() => import('./features/history/HistoryEditorView').then(m => ({ default: m.HistoryEditorView })));

// New History Hub (Replaces RecordsView)
const HistoryHubView = React.lazy(() => import('./features/history/HistoryHubView').then(m => ({ default: m.HistoryHubView })));

// Tools Feature
const OneRMView = React.lazy(() => import('./features/tools/ToolsView').then(m => ({ default: m.OneRMView })));
const ConverterView = React.lazy(() => import('./features/tools/ToolsView').then(m => ({ default: m.ConverterView })));
const PlateCalcView = React.lazy(() => import('./features/tools/ToolsView').then(m => ({ default: m.PlateCalcView })));

export default function App() {
  // Global State
  const history = useStore(s => s.history);
  const session = useStore(s => s.session);
  const accentColor = useStore(s => s.accentColor);
  const setSession = useStore(s => s.setSession);
  const initData = useStore(s => s.initData);
  const library = useStore(s => s.library);

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

  // Global Theme Injection (Handles Portals correctly)
  useEffect(() => {
      const theme = THEMES[accentColor] || THEMES.blue;
      document.documentElement.style.setProperty('--primary', theme.primary);
      document.documentElement.style.setProperty('--primary-glow', theme.glow);
  }, [accentColor]);

  // Timers (Global to App for persistence across views)
  const { 
    timerString, 
    restTarget, setRestTarget, 
    restTime, showGo 
  } = useTimer();

  const { installPrompt } = usePWA();
  const navigate = useNavigate();
  const location = useLocation();

  // Local UI State
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [previewSession, setPreviewSession] = useState<{ programName: string, session: ProgramSession, mode?: 'active'|'log' } | null>(null);

  // Close tools on navigation
  useEffect(() => {
      setShowToolsModal(false);
  }, [location.pathname]);

  // Actions
  const startSession = (progName: string, sess: ProgramSession, mode: 'active' | 'log' = 'active') => {
      triggerHaptic('success');
      
      const newSessionPayload = {
        id: Date.now(),
        programName: progName,
        sessionName: sess.name,
        startTime: (sess as any).startTime || Date.now(),
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
            sets: Array(e.sets).fill(null).map(() => ({ weight: "", reps: "", done: (sess as any).startTime ? true : false, rir: e.targetRir || "" }))
        }))
      };

      setSession(newSessionPayload);

      // Stability Fix: TimeBuffer for Mobile Navigation
      // If we are in a modal (preview), close it first, let history settle, then navigate.
      if (previewSession) {
          setPreviewSession(null);
          setTimeout(() => {
              navigate('/workout');
          }, 100);
      } else {
          // Direct start (Smart Widget), no modal to close
          navigate('/workout');
      }
  };

  const isWorkoutView = location.pathname === '/workout';

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 pb-safe">
      
      <AppHeader 
          session={session} 
          timerString={timerString} 
          restTarget={restTarget} 
          restTime={restTime} 
          setRestTarget={setRestTarget} 
      />

      <main className="pt-20 px-4 max-w-lg mx-auto min-h-screen pb-12">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<DashboardView onStartSession={startSession} onOpenTools={() => setShowToolsModal(true)} />} />
            <Route path="/workout" element={session ? <WorkoutView /> : <Navigate to="/" />} />
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/tools/1rm" element={<OneRMView />} />
            <Route path="/tools/converter" element={<ConverterView />} />
            <Route path="/tools/plate" element={<PlateCalcView />} />
            <Route path="/programs" element={<ProgramsView onStartPreview={(name, sess) => setPreviewSession({programName: name, session: sess, mode: 'active'})} />} />
            <Route path="/programs/edit/:id" element={<ProgramEditorView />} />
            <Route path="/library" element={<LibraryView />} />
            <Route path="/settings" element={<SettingsView installPrompt={installPrompt} />} />
            {/* History Hub replaces RecordsView and standalone modals */}
            <Route path="/history" element={<HistoryHubView onStartSession={startSession} />} />
            {/* Redirect old route for safety */}
            <Route path="/records" element={<Navigate to="/history?tab=records" replace />} />
            <Route path="/history/edit/:id" element={<HistoryEditorView />} />
          </Routes>
        </Suspense>
      </main>

      {/* GLOBAL REST TIMER OVERLAY */}
      {isWorkoutView && (
          <RestTimerOverlay 
              restTime={restTime} 
              showGo={showGo} 
              setRestTarget={setRestTarget as any} 
          />
      )}

      {/* PREVIEW MODAL */}
      {previewSession && (
          <Modal title="Aperçu" onClose={() => setPreviewSession(null)}>
              <div className="space-y-6">
                  <div className="text-center pb-2 border-b border-white/5">
                      <div className="text-[10px] uppercase font-black text-primary tracking-widest mb-1 border border-primary/30 px-2 py-0.5 rounded-full bg-primary/5 inline-block">
                          {previewSession.programName}
                      </div>
                      <div className="font-black italic text-2xl text-white mt-1">{previewSession.session.name}</div>
                  </div>
                  
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
                      {previewSession.session.exos.map((ex, idx) => {
                          const libEx = library.find(l => l.id === ex.exerciseId);
                          return (
                              <div key={idx} className="bg-surface2/30 border border-white/5 p-3 rounded-2xl flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-secondary text-xs font-bold">
                                          {idx + 1}
                                      </div>
                                      <div>
                                          <div className="font-bold text-sm text-white">{libEx?.name || `Exo #${ex.exerciseId}`}</div>
                                          <div className="text-[10px] text-secondary uppercase font-bold">{libEx?.muscle}</div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-white font-mono font-bold text-sm bg-surface2 px-2 py-1 rounded-lg border border-white/5">
                                          {ex.sets} x {ex.reps}
                                      </div>
                                      <div className="text-[9px] text-secondary mt-1">{ex.rest}s</div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>

                  <button 
                      onClick={() => startSession(previewSession.programName, previewSession.session, previewSession.mode)} 
                      className="w-full h-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.4)] active:scale-95 transition-all group relative overflow-hidden"
                  >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <Icons.Play size={28} fill="currentColor" className="text-white drop-shadow-md" />
                      <span className="ml-2 font-black italic text-lg tracking-wider">START</span>
                  </button>
              </div>
          </Modal>
      )}

      {/* GLOBAL WORKOUT TOOLS */}
      {showToolsModal && <WorkoutToolsModal onClose={() => setShowToolsModal(false)} />}

      {/* GLOBAL CONFIRMATION */}
      <ConfirmationModal />
    </div>
  );
}
