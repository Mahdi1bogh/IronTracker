
import React, { useState, useMemo } from 'react';
import { useWorkoutManager } from '../hooks/useWorkoutManager';
import { SectionCard } from '../components/ui/SectionCard';
import { Modal } from '../components/ui/Modal';
import { Icons } from '../components/Icons';
import { QuickPlateModal } from '../components/tools/QuickPlateModal';
import { triggerHaptic, getExerciseStats, calculate1RM, formatDuration } from '../utils';
import { TYPE_COLORS, FATIGUE_COLORS } from '../constants';
import { EQUIPMENTS } from '../data/equipments';

// Helper for Trend Symbol
const getTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return { sym: '', color: 'text-secondary' };
    if (current > previous) return { sym: '▴', color: 'text-success' };
    if (current < previous) return { sym: '▾', color: 'text-danger' };
    return { sym: '▸', color: 'text-secondary' };
};

export const WorkoutView: React.FC = () => {
    const { 
        session, isLogMode, library, history, getExerciseById,
        updateSet, addSet, removeSet, removeExercise, moveExercise, addExercise, 
        generateWarmup, cancelSession, finishSession, updateSessionSettings, updateExerciseNotes
    } = useWorkoutManager();

    // UI State
    const [activeDetailExo, setActiveDetailExo] = useState<{ idx: number, tab: 'info' | 'history' | 'notes' } | null>(null);
    const [showAddExoModal, setShowAddExoModal] = useState(false);
    const [showSessionSettings, setShowSessionSettings] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [libraryFilter, setLibraryFilter] = useState('');
    const [quickPlateTarget, setQuickPlateTarget] = useState<string | null>(null);
    const [logDuration, setLogDuration] = useState<string>("60"); 
    
    // Warmup Selection State
    const [warmupTargetExo, setWarmupTargetExo] = useState<number | null>(null);

    const isSessionComplete = useMemo(() => {
        if (!session) return false;
        if (session.exercises.length === 0) return false;
        return session.exercises.every(ex => ex.sets.length > 0 && ex.sets.every(s => s.done));
    }, [session]);

    if (!session) return null;

    const activeExoStats = useMemo(() => {
        if (!activeDetailExo) return null;
        const exo = session.exercises[activeDetailExo.idx];
        const libEx = getExerciseById(exo.exerciseId);
        if (!libEx) return null;
        return {
            lib: libEx,
            stats: getExerciseStats(libEx.id, history, libEx.type),
            history: history.filter(h => h.exercises.some(e => e.exerciseId === libEx.id)).slice(0, 5)
        };
    }, [activeDetailExo, session.exercises, history, library, getExerciseById]);

    // Bloquer les caractères non désirés (- et e)
    const preventNegative = (e: React.KeyboardEvent) => {
        if (['-', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
      <div className="space-y-6 pb-24 animate-zoom-in">
        {/* Header Section */}
        <div className="flex items-start justify-between">
            <div className="text-left">
                <h2 className="text-2xl font-black italic uppercase leading-none">{session.sessionName}</h2>
                <div className="flex gap-2 items-center mt-1">
                    <p className="text-secondary text-xs uppercase tracking-widest">{session.programName}</p>
                    {isLogMode && <span className="text-[9px] font-bold bg-secondary/20 text-secondary px-1.5 rounded uppercase">Mode Saisie</span>}
                </div>
            </div>
            <button onClick={() => setShowSessionSettings(true)} className="p-2 bg-surface2 rounded-xl text-secondary hover:text-white transition-colors border border-transparent hover:border-border">
                <Icons.Settings size={20} />
            </button>
        </div>
        
        {/* Exercises List */}
        {session.exercises.map((exo, exoIdx) => {
           const libEx = getExerciseById(exo.exerciseId);
           const isCardio = libEx?.type === 'Cardio';
           const isStatic = libEx?.type === 'Statique' || libEx?.type === 'Étirement';
           
           // Stats Calculations
           const stats = libEx ? getExerciseStats(libEx.id, history, libEx.type) : { lastSessionString: '-', prSessionString: '-', lastSessionVolume: 0, lastBestSet: null, pr: 0 };
           
           // Current Session Metrics
           const currentVolume = exo.sets.filter(s => s.done && !s.isWarmup).reduce((acc, s) => acc + (parseFloat(s.weight)||0) * (parseFloat(s.reps)||0), 0);
           const currentBestE1RM = exo.sets.reduce((best, s) => {
               if(s.done && !s.isWarmup) {
                   const e = calculate1RM(s.weight, s.reps);
                   return e > best ? e : best;
               }
               return best;
           }, 0);

           // Deltas & Trends (Only relevant for Standard exercises in this compact view)
           const tonDelta = currentVolume - stats.lastSessionVolume;
           const tonPct = stats.lastSessionVolume > 0 ? Math.round((tonDelta / stats.lastSessionVolume) * 100) : 0;
           const tonTrend = getTrend(currentVolume, stats.lastSessionVolume);
           
           const rmDelta = currentBestE1RM - (stats.lastBestSet?.e1rm || 0);
           const rmPct = stats.lastBestSet?.e1rm ? Math.round((rmDelta / stats.lastBestSet.e1rm) * 100) : 0;
           const rmTrend = getTrend(currentBestE1RM, stats.lastBestSet?.e1rm || 0);

           return (
             <SectionCard key={exoIdx} className="overflow-hidden">
                {/* Exercise Header */}
                <div className="p-3 bg-surface2/20 border-b border-border">
                   <div className="flex justify-between items-start mb-3">
                       <div className="flex gap-3 items-center w-full overflow-hidden">
                           <div className="flex flex-col gap-1 flex-shrink-0">
                              {exoIdx > 0 && <button onClick={() => moveExercise(exoIdx, exoIdx - 1)} className="p-0.5 text-secondary hover:text-white"><Icons.ChevronUp size={14} /></button>}
                              {exoIdx < session.exercises.length - 1 && <button onClick={() => moveExercise(exoIdx, exoIdx + 1)} className="p-0.5 text-secondary hover:text-white"><Icons.ChevronDown size={14} /></button>}
                           </div>
                           <div className="min-w-0 flex-1">
                               <div className="font-black uppercase text-sm truncate">{libEx?.name || 'Inconnu'}</div>
                               <div className="text-[10px] text-secondary flex justify-between items-center pr-2 mt-0.5">
                                   <span>{exo.target} • {exo.rest}s</span>
                               </div>
                           </div>
                       </div>
                       
                       {/* Tools Actions */}
                       <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                           {!isCardio && !isStatic && (
                               <button onClick={() => setQuickPlateTarget(exo.sets[exo.sets.length-1]?.weight || "20")} className="p-2 rounded-lg text-secondary hover:text-white transition-colors">
                                   <Icons.Disc size={18} />
                               </button>
                           )}
                           <button onClick={() => { triggerHaptic('click'); setWarmupTargetExo(exoIdx); }} className="p-2 rounded-lg text-secondary hover:text-gold transition-colors">
                               <Icons.Flame size={18} />
                           </button>
                           <button onClick={() => { triggerHaptic('click'); setActiveDetailExo({ idx: exoIdx, tab: 'info' }); }} className={`p-2 rounded-lg transition-colors ${exo.notes ? 'text-white bg-surface2' : 'text-secondary hover:text-white'}`}>
                               <Icons.Search size={18} />
                           </button>
                           <button onClick={() => { triggerHaptic('error'); removeExercise(exoIdx); }} className="p-2 text-danger/50 hover:text-danger rounded-lg"><Icons.Trash size={18} /></button>
                       </div>
                   </div>

                   {/* Stats Grid (Aligned) */}
                   <div className="grid grid-cols-2 gap-2 text-[10px]">
                       {/* Column 1: History */}
                       <div className="bg-surface2/30 rounded-lg p-2 border border-white/5 space-y-1">
                           <div className="text-[8px] font-black uppercase text-secondary/50 mb-1 border-b border-white/5 pb-0.5">Historique</div>
                           <div className="flex justify-between items-center h-4">
                               <span className="text-secondary/70">Perf.</span>
                               <span className="text-secondary font-mono font-bold truncate ml-2">{stats.lastSessionString}</span>
                           </div>
                           {!isCardio && !isStatic && (
                               <>
                                   <div className="flex justify-between items-center h-4">
                                       <span className="text-secondary/70">1RM</span>
                                       <span className="text-secondary font-mono font-bold">{Math.round(stats.lastBestSet?.e1rm || 0)} <span className="text-[8px] font-normal">kg</span></span>
                                   </div>
                                   <div className="flex justify-between items-center h-4">
                                       <span className="text-secondary/70">Ton.</span>
                                       <span className="text-secondary font-mono font-bold">{Math.round(stats.lastSessionVolume)} <span className="text-[8px] font-normal">kg</span></span>
                                   </div>
                               </>
                           )}
                       </div>

                       {/* Column 2: Current Session */}
                       <div className="bg-primary/5 rounded-lg p-2 border border-primary/5 space-y-1">
                           <div className="text-[8px] font-black uppercase text-primary/50 mb-1 border-b border-primary/5 pb-0.5">Session</div>
                           <div className="flex justify-between items-center h-4">
                               <span className="text-primary/70">Perf.</span>
                               <span className="text-primary/90 font-mono font-bold truncate ml-2 italic">{currentVolume > 0 || (isCardio || isStatic) ? "En cours..." : "-"}</span>
                           </div>
                           {!isCardio && !isStatic && (
                               <>
                                   <div className="flex justify-between items-center h-4">
                                       <span className="text-primary/70">1RM</span>
                                       <div className="flex items-center gap-1 font-mono font-bold">
                                           <span className="text-primary/90">{Math.round(currentBestE1RM)} <span className="text-[8px] font-normal opacity-70">kg</span></span>
                                           {stats.lastBestSet?.e1rm && currentBestE1RM > 0 ? (
                                              <span className={`text-[8px] ${rmTrend.color}`}>
                                                  {rmTrend.sym}{Math.abs(rmPct)}%
                                              </span>
                                           ) : null}
                                       </div>
                                   </div>
                                   <div className="flex justify-between items-center h-4">
                                       <span className="text-primary/70">Ton.</span>
                                       <div className="flex items-center gap-1 font-mono font-bold">
                                           <span className="text-primary/90">{Math.round(currentVolume)} <span className="text-[8px] font-normal opacity-70">kg</span></span>
                                           {stats.lastSessionVolume > 0 && currentVolume > 0 && (
                                               <span className={`text-[8px] ${tonTrend.color}`}>
                                                   {tonTrend.sym}{Math.abs(tonPct)}%
                                               </span>
                                           )}
                                       </div>
                                   </div>
                               </>
                           )}
                       </div>
                   </div>
                </div>

                {/* Sets List */}
                <div className="p-2 space-y-2">
                   {exo.sets.map((set, setIdx) => {
                       return (
                          <div key={setIdx} className={`grid grid-cols-12 gap-2 items-center ${set.done ? 'opacity-50' : ''} relative`}>
                              {/* Left Controls */}
                              <div className="col-span-2 flex flex-col items-center justify-center gap-1">
                                  <div className="flex gap-1">
                                      <button onClick={() => removeSet(exoIdx, setIdx)} className="w-5 h-5 flex items-center justify-center text-danger/30 hover:text-danger bg-danger/5 rounded"><Icons.Close size={10} /></button>
                                      <button 
                                        onClick={() => updateSet(exoIdx, setIdx, 'isWarmup', !set.isWarmup)} 
                                        className={`w-6 h-6 flex items-center justify-center text-center font-mono text-[10px] font-bold rounded border transition-colors ${set.isWarmup ? 'text-warning bg-warning/10 border-warning' : 'text-secondary border-transparent bg-surface2/50'}`}
                                      >
                                          {set.isWarmup ? 'W' : setIdx + 1}
                                      </button>
                                  </div>
                              </div>
                              
                              {/* Inputs */}
                              <div className="col-span-3 relative">
                                  <input 
                                     type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" placeholder={isCardio ? "Lvl" : "kg"}
                                     className="w-full bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-white/20 border border-transparent text-xs"
                                     value={set.weight}
                                     onChange={(e) => updateSet(exoIdx, setIdx, 'weight', e.target.value)}
                                  />
                              </div>
                              <div className="col-span-3 relative">
                                  <input 
                                     type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" placeholder={isCardio ? "Dist" : isStatic ? "T (s)" : "reps"}
                                     className="w-full bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-white/20 border border-transparent text-xs"
                                     value={set.reps}
                                     onChange={(e) => updateSet(exoIdx, setIdx, 'reps', e.target.value)}
                                  />
                              </div>
                               <div className="col-span-2 relative">
                                  <input 
                                     type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" placeholder={isCardio ? "T (min)" : "RIR"}
                                     className="w-full bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-white/20 border border-transparent text-xs"
                                     value={set.rir || ''}
                                     onChange={(e) => updateSet(exoIdx, setIdx, 'rir', e.target.value)}
                                  />
                               </div>

                              {/* Validation Button with Timestamp */}
                              <button 
                                 onClick={() => updateSet(exoIdx, setIdx, 'done', !set.done)}
                                 className={`col-span-2 h-9 rounded-xl flex flex-col items-center justify-center transition-all relative ${set.done ? 'bg-success text-white scale-95' : 'bg-surface2 text-secondary hover:bg-surface2/80 active:scale-95'}`}
                              >
                                 {set.done ? (
                                     <>
                                        <Icons.Check size={14} strokeWidth={3} />
                                        {set.completedAt && (
                                            <span className="text-[7px] font-mono font-bold leading-none mt-0.5 opacity-90">
                                                {new Date(set.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        )}
                                     </>
                                 ) : ''}
                              </button>
                          </div>
                       );
                   })}
                   <button onClick={() => addSet(exoIdx)} className="w-full py-2 bg-surface2/30 rounded-xl text-[10px] font-bold uppercase text-secondary border border-dashed border-border/50 hover:border-white/20 transition-colors flex items-center justify-center gap-2">
                      <Icons.Plus size={12} /> Série
                   </button>
                </div>
             </SectionCard>
           );
        })}

        <button onClick={() => setShowAddExoModal(true)} className="w-full py-4 border-2 border-dashed border-border rounded-[2rem] text-secondary font-black uppercase hover:text-white hover:border-white transition-colors flex items-center justify-center gap-2">
            <Icons.Plus size={18} /> Ajouter Exercice
        </button>

        <div className="flex gap-4 pt-4">
             <button onClick={cancelSession} className="flex-1 py-4 bg-danger/10 text-danger font-black uppercase rounded-[2rem] border border-danger/20 hover:bg-danger/20 transition-all active:scale-95">Annuler</button>
             
             <button 
                onClick={() => setShowFinishModal(true)} 
                className={`flex-1 py-4 font-black uppercase rounded-[2rem] shadow-lg transition-all flex flex-col items-center justify-center leading-none active:scale-95 ${isSessionComplete ? 'bg-success text-white shadow-success/20 animate-pulse-slow' : 'bg-surface2 text-secondary border border-border'}`}
            >
                 <span>Terminer</span>
                 {!isSessionComplete && <span className="text-[9px] font-normal mt-1 opacity-70">Séries incomplètes</span>}
             </button>
        </div>

        {/* SETTINGS MODAL */}
        {showSessionSettings && (
            <Modal title="Réglages Séance" onClose={() => setShowSessionSettings(false)}>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-secondary font-bold">Début de séance</label>
                        <div className="flex gap-2">
                             <input type="date" value={new Date(session.startTime).toISOString().split('T')[0]} onChange={e => {
                                 const d = new Date(e.target.value);
                                 const old = new Date(session.startTime);
                                 d.setHours(old.getHours(), old.getMinutes());
                                 updateSessionSettings(d.getTime(), session.bodyWeight, session.fatigue);
                             }} className="flex-1 bg-surface2 p-3 rounded-xl text-sm font-bold outline-none" />
                             <input type="time" value={new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} onChange={e => {
                                 const [h, m] = e.target.value.split(':').map(Number);
                                 const d = new Date(session.startTime);
                                 d.setHours(h, m);
                                 updateSessionSettings(d.getTime(), session.bodyWeight, session.fatigue);
                             }} className="w-24 bg-surface2 p-3 rounded-xl text-sm font-bold outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                         <div className="space-y-2">
                             <label className="text-[10px] uppercase text-secondary font-bold">
                                 Durée (min) { !isLogMode && <span className="text-primary ml-1">(Chrono Actif)</span> }
                             </label>
                             <input 
                                 type="number" min="0" onKeyDown={preventNegative}
                                 inputMode="decimal" 
                                 value={logDuration} 
                                 onChange={e => setLogDuration(e.target.value)} 
                                 className={`w-full bg-surface2 p-3 rounded-xl text-sm font-bold outline-none ${!isLogMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                 disabled={!isLogMode}
                             />
                         </div>
                         <div className="space-y-2">
                             <label className="text-[10px] uppercase text-secondary font-bold">Poids (kg)</label>
                             <input type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" value={session.bodyWeight} onChange={e => updateSessionSettings(session.startTime, e.target.value, session.fatigue)} className="w-full bg-surface2 p-3 rounded-xl text-sm font-bold outline-none" />
                         </div>
                    </div>
                    
                    <div className="space-y-2">
                         <label className="text-[10px] uppercase text-secondary font-bold">Fatigue Ressentie</label>
                         <div className="flex bg-surface2 rounded-xl overflow-hidden">
                            {[1, 2, 3, 4, 5].map(v => (
                                <button 
                                    key={v}
                                    onClick={() => updateSessionSettings(session.startTime, session.bodyWeight, String(v))}
                                    className={`flex-1 py-3 text-xs font-bold ${session.fatigue === String(v) ? 'text-black' : 'text-secondary/30'}`}
                                    style={{ backgroundColor: session.fatigue === String(v) ? FATIGUE_COLORS[v] : 'transparent' }}
                                >
                                    {v}
                                </button>
                            ))}
                         </div>
                    </div>
                </div>
            </Modal>
        )}

        {/* FINISH CONFIRMATION MODAL */}
        {showFinishModal && (
            <Modal title="Bilan" onClose={() => setShowFinishModal(false)}>
                 <div className="space-y-6 text-center">
                     {!isSessionComplete && (
                         <div className="bg-warning/10 border border-warning/20 p-3 rounded-xl text-warning text-xs font-bold mb-4">
                             ⚠️ Certaines séries ne sont pas validées.
                         </div>
                     )}
                     
                     <div className="grid grid-cols-2 gap-4">
                         <div className="bg-surface2/30 p-4 rounded-2xl">
                             <div className="text-[10px] text-secondary uppercase">Durée</div>
                             {isLogMode ? (
                                 <div className="text-xl font-black font-mono">{logDuration} min</div>
                             ) : (
                                 <div className="text-xl font-black font-mono">{Math.floor((Date.now() - session.startTime) / 60000)} min</div>
                             )}
                         </div>
                         <div className="bg-surface2/30 p-4 rounded-2xl">
                             <div className="text-[10px] text-secondary uppercase">Volume</div>
                             <div className="text-xl font-black font-mono">{session.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.done && !s.isWarmup).length, 0)} sets</div>
                         </div>
                     </div>

                     <div className="space-y-2">
                        <button onClick={() => finishSession(logDuration)} className="w-full py-3 bg-success text-white font-black uppercase rounded-xl shadow-xl shadow-success/20 active:scale-95 transition-all">
                            Valider et Sauvegarder
                        </button>
                        <button onClick={() => setShowFinishModal(false)} className="w-full py-3 bg-surface2 text-secondary font-bold uppercase text-xs rounded-xl hover:bg-surface2/80 transition-colors">
                            Continuer l'entraînement
                        </button>
                     </div>
                 </div>
            </Modal>
        )}

        {/* WARMUP SELECTION MODAL */}
        {warmupTargetExo !== null && (
            <Modal title="Échauffement" onClose={() => setWarmupTargetExo(null)}>
                <div className="space-y-6 text-center">
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <Icons.Flame size={32} className="text-gold" />
                        <p className="text-sm font-bold text-white">Combien de séries ?</p>
                        <p className="text-xs text-secondary">Basé sur la charge de travail actuelle.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(count => (
                            <button 
                                key={count} 
                                onClick={() => { 
                                    generateWarmup(warmupTargetExo, count); 
                                    setWarmupTargetExo(null); 
                                }}
                                className="bg-surface2 hover:bg-surface2/80 p-4 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95"
                            >
                                <span className="text-2xl font-black text-white">{count}</span>
                                <span className="text-[9px] uppercase text-secondary font-bold">Série{count > 1 ? 's' : ''}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        )}

        {/* QUICK PLATE MODAL */}
        {quickPlateTarget && (
            <QuickPlateModal targetWeight={quickPlateTarget} onClose={() => setQuickPlateTarget(null)} />
        )}

        {/* EXERCISE DETAIL MODAL */}
        {activeDetailExo && activeExoStats && (
            <Modal title={activeExoStats.lib.name} onClose={() => setActiveDetailExo(null)}>
                <div className="space-y-6">
                    <div className="flex bg-surface2 p-1 rounded-xl">
                        {(['info', 'history', 'notes'] as const).map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveDetailExo({ ...activeDetailExo, tab })}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${activeDetailExo.tab === tab ? 'bg-primary text-background shadow-sm' : 'text-secondary hover:text-white'}`}
                            >
                                {tab === 'info' ? 'Infos' : tab === 'history' ? 'Historique' : 'Notes'}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[200px]">
                        {activeDetailExo.tab === 'info' && (
                            <div className="space-y-4 animate-fade-in">
                                {activeExoStats.lib.type === 'Cardio' ? (
                                    // CARDIO STATS
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-surface2/30 p-3 rounded-xl border border-white/5">
                                            <div className="text-[9px] uppercase text-secondary">Dist. Max</div>
                                            <div className="text-xl font-black text-white">{activeExoStats.stats.maxDistance} <span className="text-xs text-secondary font-normal">m</span></div>
                                            <div className="text-[8px] text-secondary/50 mt-1">Meilleure distance</div>
                                        </div>
                                        <div className="bg-surface2/30 p-3 rounded-xl border border-white/5">
                                            <div className="text-[9px] uppercase text-secondary">Temps Max</div>
                                            <div className="text-xl font-black text-white">{formatDuration(activeExoStats.stats.maxDuration)}</div>
                                            <div className="text-[8px] text-secondary/50 mt-1">Plus longue séance</div>
                                        </div>
                                    </div>
                                ) : (activeExoStats.lib.type === 'Statique' || activeExoStats.lib.type === 'Étirement') ? (
                                    // STATIQUE STATS
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-surface2/30 p-3 rounded-xl border border-white/5">
                                            <div className="text-[9px] uppercase text-secondary">Temps Max</div>
                                            <div className="text-xl font-black text-white">{formatDuration(activeExoStats.stats.maxDuration)}</div>
                                            <div className="text-[8px] text-secondary/50 mt-1">Record de tenue</div>
                                        </div>
                                        <div className="bg-surface2/30 p-3 rounded-xl border border-white/5">
                                            <div className="text-[9px] uppercase text-secondary">Lest Max</div>
                                            <div className="text-xl font-black text-white">{activeExoStats.stats.prMax} <span className="text-xs text-secondary font-normal">kg</span></div>
                                            <div className="text-[8px] text-secondary/50 mt-1">Surcharge maximale</div>
                                        </div>
                                    </div>
                                ) : (
                                    // STANDARD STATS (Poly/Iso)
                                    <div className="grid grid-cols-2 gap-4">
                                         <div className="bg-surface2/30 p-3 rounded-xl border border-white/5">
                                             <div className="text-[9px] uppercase text-secondary">Record</div>
                                             <div className="text-xl font-black text-white">{activeExoStats.stats.pr} <span className="text-xs text-secondary font-normal">kg</span></div>
                                             <div className="text-[8px] text-secondary/50 mt-1">Meilleur 1RM théorique</div>
                                         </div>
                                         <div className="bg-surface2/30 p-3 rounded-xl border border-white/5">
                                             <div className="text-[9px] uppercase text-secondary">Max</div>
                                             <div className="text-xl font-black text-white">{activeExoStats.stats.prMax} <span className="text-xs text-secondary font-normal">kg</span></div>
                                             <div className="text-[8px] text-secondary/50 mt-1">Poids réel le plus lourd</div>
                                         </div>
                                    </div>
                                )}
                                
                                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icons.Flame size={14} className="text-blue-400" />
                                        <span className="text-xs font-bold text-blue-400 uppercase">Échauffement Intelligent</span>
                                    </div>
                                    <p className="text-[10px] text-secondary leading-relaxed">
                                        Cliquez sur la <strong>Flamme</strong> pour ajouter 1 à 3 séries de montée en gamme (50%, 70%, 90% de la charge de travail).
                                        <br/><br/>
                                        Cliquez sur le <strong>numéro d'une série</strong> pour la marquer en <span className="text-warning">Warmup (W)</span>. Ces séries ne comptent pas dans votre volume global.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase text-secondary border-b border-border/50 pb-1">Conseils Techniques</h4>
                                    {activeExoStats.lib.tips ? (
                                        <div className="text-sm space-y-3">
                                            {activeExoStats.lib.tips.setup && <div><span className="text-primary font-bold text-xs uppercase block mb-1">Setup</span> <span className="text-secondary-foreground">{activeExoStats.lib.tips.setup.join('. ')}.</span></div>}
                                            {activeExoStats.lib.tips.exec && <div><span className="text-primary font-bold text-xs uppercase block mb-1">Exécution</span> <span className="text-secondary-foreground">{activeExoStats.lib.tips.exec.join('. ')}.</span></div>}
                                            {activeExoStats.lib.tips.mistake && <div><span className="text-danger font-bold text-xs uppercase block mb-1">À éviter</span> <span className="text-secondary-foreground">{activeExoStats.lib.tips.mistake.join('. ')}.</span></div>}
                                        </div>
                                    ) : <div className="text-secondary italic text-xs">Aucun conseil disponible.</div>}
                                </div>
                            </div>
                        )}
                        {activeDetailExo.tab === 'history' && (
                            <div className="space-y-3 animate-fade-in">
                                {activeExoStats.history.length > 0 ? activeExoStats.history.map(h => (
                                    <div key={h.id} className="bg-surface2/30 p-3 rounded-xl">
                                        <div className="flex justify-between items-end mb-1">
                                            <div className="text-[10px] uppercase text-secondary">{new Date(h.startTime).toLocaleDateString()}</div>
                                            <div className="text-[10px] font-bold">{h.sessionName}</div>
                                        </div>
                                        <div className="font-mono text-sm">{getExerciseStats(activeExoStats.lib.id, [h], activeExoStats.lib.type).lastSessionString}</div>
                                    </div>
                                )) : <div className="text-center text-secondary py-4 italic">Aucun historique</div>}
                            </div>
                        )}
                        {activeDetailExo.tab === 'notes' && (
                            <div className="animate-fade-in">
                                <textarea 
                                    className="w-full h-32 bg-surface2/30 p-3 rounded-xl outline-none text-sm resize-none" 
                                    placeholder="Notes personnelles pour cet exercice..."
                                    value={session.exercises[activeDetailExo.idx].notes}
                                    onChange={(e) => updateExerciseNotes(activeDetailExo.idx, e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        )}

        {/* Add Exercise Modal */}
        {showAddExoModal && (
            <Modal title="Ajouter Exercice" onClose={() => { setShowAddExoModal(false); setLibraryFilter(''); }}>
                <div className="space-y-4">
                <input placeholder="Rechercher..." className="w-full bg-surface2 p-3 rounded-2xl outline-none" onChange={(e) => setLibraryFilter(e.target.value)} autoFocus />
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {library.filter(l => !l.isArchived && ((l.name || '').toLowerCase().includes(libraryFilter.toLowerCase()) || (l.muscle || '').toLowerCase().includes(libraryFilter.toLowerCase()))).sort((a,b) => (a.isFavorite === b.isFavorite) ? (a.name || '').localeCompare(b.name || '') : (a.isFavorite ? -1 : 1)).map(l => (
                        <button key={l.id} onClick={() => { addExercise(l.id); setShowAddExoModal(false); setLibraryFilter(''); }} className="w-full p-3 bg-surface2/50 rounded-2xl text-left hover:bg-surface2 transition-colors flex justify-between items-center group">
                        <div className="flex-1"><div className="flex items-center gap-2">{l.isFavorite && <span className="text-gold"><Icons.Star /></span>}<div className="font-bold text-sm group-hover:text-white transition-colors">{l.name}</div></div><div className="text-[10px] text-secondary uppercase mt-1 flex gap-2"><span>{l.muscle} • {EQUIPMENTS[l.equipment as keyof typeof EQUIPMENTS]}</span><span style={{ color: TYPE_COLORS[l.type as keyof typeof TYPE_COLORS] }}>● {l.type}</span></div></div>
                        <div className="text-xl text-white font-black">+</div>
                        </button>
                    ))}
                </div>
                </div>
            </Modal>
        )}
      </div>
    );
};
