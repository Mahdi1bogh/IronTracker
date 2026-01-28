
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { SetRecord, ExerciseInstance } from '../types';
import { SectionCard } from '../components/ui/SectionCard';
import { Modal } from '../components/ui/Modal';
import { Icons } from '../components/Icons';
import { triggerHaptic, getExerciseStats, calculate1RM, formatDuration, parseDuration } from '../utils';
import { storage } from '../services/storage';
import { TYPE_COLORS, FATIGUE_COLORS } from '../constants';
import { EQUIPMENTS } from '../data/equipments';
import { useConfirm } from '../hooks/useConfirm';

const moveItem = <T,>(arr: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= arr.length) return arr;
    const newArr = [...arr];
    const [item] = newArr.splice(from, 1);
    newArr.splice(to, 0, item);
    return newArr;
};

export const WorkoutView: React.FC = () => {
    const navigate = useNavigate();
    const session = useStore(s => s.session);
    const setSession = useStore(s => s.setSession);
    const setHistory = useStore(s => s.setHistory);
    const history = useStore(s => s.history);
    const library = useStore(s => s.library);
    const setRestTarget = useStore(s => s.setRestTarget);
    
    const confirm = useConfirm();

    const [activeDetailExo, setActiveDetailExo] = useState<{ idx: number, tab: 'info' | 'history' | 'notes' } | null>(null);
    const [showAddExoModal, setShowAddExoModal] = useState(false);
    const [showSessionSettings, setShowSessionSettings] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [libraryFilter, setLibraryFilter] = useState('');
    
    const [logDuration, setLogDuration] = useState<string>("60"); 

    const isSessionComplete = useMemo(() => {
        if (!session) return false;
        return session.exercises.every(ex => ex.sets.every(s => s.done));
    }, [session]);

    if (!session) return null;

    const isLogMode = session.mode === 'log';

    const getExerciseById = (id: number) => library.find(l => l.id === id);

    const updateSet = (exoIdx: number, setIdx: number, field: keyof SetRecord, value: any) => {
        const newSession = { ...session };
        const exo = newSession.exercises[exoIdx];
        const wasDone = exo.sets[setIdx].done;
        
        if (field === 'done' && value === true) {
             const currentSet = exo.sets[setIdx];
             if (!currentSet.weight || !currentSet.reps) {
                 triggerHaptic('error');
                 return; 
             }
        }

        const updates: Partial<SetRecord> = { [field]: value };
        if (field === 'done') {
            if (value === true) {
                updates.completedAt = Date.now();
                triggerHaptic('success');
            } else {
                updates.completedAt = undefined;
                triggerHaptic('click');
            }
        }
        exo.sets[setIdx] = { ...exo.sets[setIdx], ...updates };
        
        if (!isLogMode && field === 'done' && value === true && !wasDone) {
          setRestTarget(Date.now() + (exo.rest * 1000));
        }
        setSession(newSession);
        storage.session.save(newSession);
    };

    const addSet = (exoIdx: number) => {
        triggerHaptic('click');
        const newSession = { ...session };
        const exo = newSession.exercises[exoIdx];
        const lastSet = exo.sets[exo.sets.length - 1];
        exo.sets.push({ 
            weight: lastSet ? lastSet.weight : "", 
            reps: lastSet ? lastSet.reps : "", 
            rir: lastSet ? lastSet.rir : "", 
            done: false 
        });
        setSession(newSession);
        storage.session.save(newSession);
    };

    const removeSet = (exoIdx: number, setIdx: number) => {
        triggerHaptic('error');
        const newSession = { ...session };
        newSession.exercises[exoIdx].sets.splice(setIdx, 1);
        setSession(newSession);
        storage.session.save(newSession);
    };

    const removeExercise = (exoIdx: number) => {
        confirm({
            title: "SUPPRIMER ?",
            message: "Voulez-vous retirer cet exercice de la séance ?",
            variant: 'danger',
            onConfirm: () => {
                const newSession = { ...session };
                newSession.exercises.splice(exoIdx, 1);
                setSession(newSession);
                storage.session.save(newSession);
            }
        });
    };

    const moveExercise = (from: number, to: number) => {
        triggerHaptic('click');
        const newSession = { ...session };
        newSession.exercises = moveItem(newSession.exercises, from, to);
        setSession(newSession);
        storage.session.save(newSession);
    };

    const addExercise = (libExId: number) => {
        const libEx = getExerciseById(libExId);
        if (!libEx) return;
        const newSession = { ...session };
        newSession.exercises.push({
            exerciseId: libExId,
            target: "3 x 10",
            rest: 90,
            isBonus: true,
            notes: "",
            sets: Array(3).fill(null).map(() => ({ weight: "", reps: "", done: false, rir: "" }))
        });
        setSession(newSession);
        storage.session.save(newSession);
        setShowAddExoModal(false);
        setLibraryFilter('');
        triggerHaptic('success');
    };

    const handleFinishSession = () => {
        triggerHaptic('success');
        
        let endTime = Date.now();
        if (isLogMode) {
            const dur = parseInt(logDuration) || 60;
            endTime = session.startTime + (dur * 60 * 1000);
        }

        const finishedSession = { 
            ...session, 
            endTime: endTime
        };
        
        setHistory(prev => [finishedSession, ...prev].sort((a,b) => b.startTime - a.startTime));
        setSession(null);
        setRestTarget(null);
        navigate('/');
        storage.session.save(null);
    };

    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex items-start justify-between">
            <div className="text-left">
                <h2 className="text-2xl font-black italic uppercase leading-none">{session.sessionName}</h2>
                <div className="flex gap-2 items-center mt-1">
                    <p className="text-secondary text-xs uppercase tracking-widest">{session.programName}</p>
                    {isLogMode && <span className="text-[9px] font-bold bg-secondary/20 text-secondary px-1.5 rounded uppercase">Mode Saisie</span>}
                </div>
            </div>
            <button onClick={() => setShowSessionSettings(true)} className="p-2 bg-surface2 rounded-xl text-secondary hover:text-primary transition-colors border border-transparent hover:border-primary/50">
                <Icons.Settings size={20} />
            </button>
        </div>
        
        {session.exercises.map((exo, exoIdx) => {
           const libEx = getExerciseById(exo.exerciseId);
           const isCardio = libEx?.type === 'Cardio';
           const isStatic = libEx?.type === 'Isométrique' || libEx?.type === 'Étirement';
           
           // Stats retrieval
           const stats = libEx ? getExerciseStats(libEx.id, history, libEx.type) : { lastSessionString: '-', prSessionString: '-', lastSessionTonnage: 0, lastBestSet: null, pr: 0 };

           // CALCULATE CURRENT STATS (Filter out warmups)
           const currentDoneSets = exo.sets.filter(s => s.done && !s.isWarmup);
           const currentTonnage = currentDoneSets.reduce((acc, s) => acc + (parseFloat(s.weight)||0) * (parseFloat(s.reps)||0), 0);
           const currentMaxE1RM = currentDoneSets.length > 0 ? Math.max(...currentDoneSets.map(s => calculate1RM(s.weight, s.reps))) : 0;
           
           // Volume Delta
           let volDelta = 0;
           if (stats.lastSessionTonnage > 0 && currentTonnage > 0) {
               volDelta = Math.round(((currentTonnage - stats.lastSessionTonnage) / stats.lastSessionTonnage) * 100);
           }
           const volColorClass = volDelta > 0 ? 'text-success bg-success/10 border-success/30' : (volDelta < 0 ? 'text-danger bg-danger/10 border-danger/30' : 'text-secondary bg-surface2 border-border');

           // 1RM Delta (Current vs Last Session Best)
           const lastE1RM = stats.lastBestSet?.e1rm || 0;
           const diffE1RM = currentMaxE1RM > 0 && lastE1RM > 0 ? currentMaxE1RM - lastE1RM : 0;

           // Next Goal Suggestion
           let nextGoal = "-";
           if (!isCardio && !isStatic && stats.lastBestSet) {
               const { weight, reps } = stats.lastBestSet;
               if (reps >= 12) {
                   nextGoal = `${weight + 2.5}kg x ${reps}`;
               } else {
                   nextGoal = `${weight}kg x ${reps + 1}`;
               }
           }

           return (
             <SectionCard key={exoIdx} className="overflow-hidden">
                {/* HEADER */}
                <div className="p-3 bg-surface2/20 border-b border-border flex justify-between items-start">
                   <div className="flex gap-3 items-center overflow-hidden w-full">
                       <div className="flex flex-col gap-1 flex-shrink-0">
                          {exoIdx > 0 && <button onClick={() => moveExercise(exoIdx, exoIdx - 1)} className="p-0.5 text-secondary hover:text-white"><Icons.ChevronUp size={14} /></button>}
                          {exoIdx < session.exercises.length - 1 && <button onClick={() => moveExercise(exoIdx, exoIdx + 1)} className="p-0.5 text-secondary hover:text-white"><Icons.ChevronDown size={14} /></button>}
                       </div>
                       <div className="min-w-0 flex-1">
                           <div className="font-black uppercase text-sm truncate">{libEx?.name || 'Inconnu'}</div>
                           
                           {/* HEADER INFO: TARGET & TONNAGE */}
                           <div className="text-[10px] text-secondary flex justify-between items-center pr-2 mt-0.5">
                               <span>Cible: {exo.target} • {exo.rest}s</span>
                               <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold font-mono flex items-center gap-1 leading-none ${volColorClass}`}>
                                    <span>{volDelta > 0 ? '▴' : (volDelta < 0 ? '▾' : '▸')}</span>
                                    <span>Ton. {volDelta !== 0 ? `${Math.abs(volDelta)}%` : '-'}</span>
                               </div>
                           </div>
                           
                           {/* SMART STATS (Grid Layout) */}
                           <div className="mt-2 grid grid-cols-2 gap-1.5">
                               {/* Row 1: Last (Full Width) */}
                               <div className="col-span-2 flex items-center gap-1.5 bg-surface2 border border-border rounded px-1.5 py-0.5 overflow-hidden">
                                   <span className="text-[9px] font-black text-secondary uppercase flex-shrink-0">DER.</span>
                                   <span className="text-[10px] font-mono text-secondary truncate">{stats.lastSessionString}</span>
                               </div>

                               {/* Row 2: E1RM & Obj */}
                               <div className="flex items-center gap-1.5 bg-cyan1rm/10 border border-cyan1rm/30 rounded px-1.5 py-0.5 overflow-hidden">
                                   <span className="text-[9px] font-black text-cyan1rm uppercase flex-shrink-0">1RM</span>
                                   {!isCardio && !isStatic ? (
                                       <span className="text-[10px] font-mono text-cyan1rm truncate flex gap-1 items-center">
                                           {currentMaxE1RM > 0 ? `${currentMaxE1RM}kg` : '-'}
                                           {diffE1RM !== 0 && (
                                               <>
                                                   <span className="text-secondary/50 mx-0.5">|</span>
                                                   <span className={diffE1RM > 0 ? 'text-success' : 'text-danger'}>
                                                       {diffE1RM > 0 ? '▴' : '▾'}{Math.abs(diffE1RM)}kg
                                                   </span>
                                               </>
                                           )}
                                       </span>
                                   ) : (
                                       <span className="text-[10px] font-mono text-cyan1rm">-</span>
                                   )}
                               </div>
                               <div className="flex items-center gap-1.5 bg-purpleEquip/10 border border-purpleEquip/30 rounded px-1.5 py-0.5 overflow-hidden">
                                   <span className="text-[9px] font-black text-purpleEquip uppercase flex-shrink-0">Obj.</span>
                                   <span className="text-[10px] font-mono text-purpleEquip truncate">{!isCardio && !isStatic ? nextGoal : '-'}</span>
                               </div>
                           </div>
                       </div>
                   </div>
                   <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                       <button onClick={() => { triggerHaptic('click'); setActiveDetailExo({ idx: exoIdx, tab: 'info' }); }} className={`p-2 rounded-lg transition-colors ${exo.notes ? 'text-primary bg-primary/10' : 'text-secondary hover:text-white'}`}>
                           <Icons.Search size={18} />
                       </button>
                       <button onClick={() => { triggerHaptic('error'); removeExercise(exoIdx); }} className="p-2 text-danger/50 hover:text-danger rounded-lg"><Icons.Trash size={18} /></button>
                   </div>
                </div>

                {/* SETS LIST */}
                <div className="p-2 space-y-2">
                   {exo.sets.map((set, setIdx) => (
                      <div key={setIdx} className={`grid grid-cols-12 gap-2 items-center ${set.done ? 'opacity-50' : ''}`}>
                          {/* HORIZONTAL LAYOUT FOR TRASH + INDEX */}
                          <div className="col-span-2 flex items-center justify-center gap-1">
                              <button onClick={() => removeSet(exoIdx, setIdx)} className="w-5 h-5 flex items-center justify-center text-danger/30 hover:text-danger bg-danger/5 rounded"><Icons.Close size={10} /></button>
                              <button 
                                onClick={() => updateSet(exoIdx, setIdx, 'isWarmup', !set.isWarmup)} 
                                className={`w-6 h-6 flex items-center justify-center text-center font-mono text-[10px] font-bold rounded border transition-colors ${set.isWarmup ? 'text-warning bg-warning/10 border-warning' : 'text-secondary border-transparent bg-surface2/50'}`}
                              >
                                  {set.isWarmup ? 'W' : setIdx + 1}
                              </button>
                          </div>
                          
                          <input 
                             type="number" inputMode="decimal" placeholder={isCardio ? "Lvl" : "kg"}
                             className="col-span-3 bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-primary border border-transparent text-xs"
                             value={set.weight}
                             onChange={(e) => updateSet(exoIdx, setIdx, 'weight', e.target.value)}
                          />
                          <input 
                             type="number" inputMode="decimal" placeholder={isCardio ? "Dist (m)" : isStatic ? "T (s)" : "reps"}
                             className="col-span-3 bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-primary border border-transparent text-xs"
                             value={set.reps}
                             onChange={(e) => updateSet(exoIdx, setIdx, 'reps', e.target.value)}
                          />
                           <input 
                             type="number" inputMode="decimal" placeholder={isCardio ? "T (min)" : "RIR"}
                             className="col-span-2 bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-primary border border-transparent text-xs"
                             value={set.rir || ''}
                             onChange={(e) => updateSet(exoIdx, setIdx, 'rir', e.target.value)}
                          />
                          <button 
                             onClick={() => updateSet(exoIdx, setIdx, 'done', !set.done)}
                             className={`col-span-2 h-9 rounded-xl flex items-center justify-center transition-all relative ${set.done ? 'bg-success text-white' : 'bg-surface2 text-secondary'}`}
                          >
                             {set.done ? '✓' : ''}
                             {!isLogMode && set.done && set.completedAt && (
                                 <span className="absolute -bottom-2 right-0 text-[8px] font-mono text-secondary bg-surface rounded px-0.5 shadow-sm">
                                     {new Date(set.completedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                 </span>
                             )}
                          </button>
                      </div>
                   ))}
                   <button onClick={() => addSet(exoIdx)} className="w-full py-2 bg-surface2/30 rounded-xl text-[10px] font-bold uppercase text-secondary border border-dashed border-border/50 hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
                      <Icons.Plus size={12} /> Série
                   </button>
                </div>
             </SectionCard>
           );
        })}

        <button onClick={() => setShowAddExoModal(true)} className="w-full py-4 border-2 border-dashed border-border rounded-[2rem] text-secondary font-black uppercase hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2">
            <Icons.Plus size={18} /> Ajouter Exercice
        </button>

        {/* RESTORED: Session Control Buttons */}
        <div className="flex gap-4 pt-4">
             <button onClick={() => {
                 confirm({
                     title: "ANNULER LA SÉANCE ?",
                     message: "Voulez-vous vraiment annuler ?",
                     subMessage: "Tout progrès non sauvegardé sera perdu.",
                     variant: 'danger',
                     onConfirm: () => { setSession(null); setRestTarget(null); navigate('/'); storage.session.save(null); }
                 });
             }} className="flex-1 py-4 bg-danger/10 text-danger font-black uppercase rounded-[2rem]">Annuler</button>
             
             <button onClick={() => setShowFinishModal(true)} className={`flex-1 py-4 font-black uppercase rounded-[2rem] shadow-lg transition-all flex flex-col items-center justify-center leading-none ${isSessionComplete ? 'bg-success text-white shadow-success/20' : 'bg-surface2 text-secondary border border-border'}`}>
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
                                 setSession({ ...session, startTime: d.getTime() });
                             }} className="flex-1 bg-surface2 p-3 rounded-xl text-sm font-bold outline-none" />
                             <input type="time" value={new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} onChange={e => {
                                 const [h, m] = e.target.value.split(':').map(Number);
                                 const d = new Date(session.startTime);
                                 d.setHours(h, m);
                                 setSession({ ...session, startTime: d.getTime() });
                             }} className="w-24 bg-surface2 p-3 rounded-xl text-sm font-bold outline-none" />
                        </div>
                    </div>

                    {isLogMode && (
                        <div className="space-y-2">
                             <label className="text-[10px] uppercase text-secondary font-bold">Durée (minutes)</label>
                             <input 
                                type="number" inputMode="decimal"
                                value={logDuration}
                                onChange={e => setLogDuration(e.target.value)}
                                className="w-full bg-surface2 p-3 rounded-xl text-lg font-mono font-bold outline-none focus:border-primary border border-transparent"
                             />
                             <p className="text-[10px] text-secondary">Indiquez la durée totale estimée.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-secondary font-bold">Poids de corps (kg)</label>
                        <input 
                            type="number" inputMode="decimal"
                            value={session.bodyWeight} 
                            onChange={e => setSession({ ...session, bodyWeight: e.target.value })} 
                            className="w-full bg-surface2 p-3 rounded-xl text-lg font-mono font-bold outline-none focus:border-primary border border-transparent"
                            placeholder="ex: 75.5"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-secondary font-bold">Niveau de Forme (RPE)</label>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between bg-surface2/50 p-2 rounded-2xl">
                                 {[1, 2, 3, 4, 5].map(lvl => (
                                     <button key={lvl} onClick={() => setSession({...session, fatigue: String(lvl)})} className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${session.fatigue === String(lvl) ? 'scale-110 shadow-lg text-black' : 'text-secondary hover:bg-surface2'}`} style={{ backgroundColor: session.fatigue === String(lvl) ? FATIGUE_COLORS[String(lvl)] : 'transparent' }}>
                                         {lvl}
                                     </button>
                                 ))}
                            </div>
                            <div className="flex justify-between px-2 text-[9px] text-secondary font-bold uppercase tracking-wider">
                                <span>Épuisé</span>
                                <span>En forme</span>
                            </div>
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
                        <p className="text-sm text-secondary">Confirmer la fin de la séance ?</p>
                        <button onClick={handleFinishSession} className="w-full py-3 bg-success text-white font-black uppercase rounded-xl shadow-xl shadow-success/20 active:scale-95 transition-all">
                            Valider et Sauvegarder
                        </button>
                        <button onClick={() => setShowFinishModal(false)} className="w-full py-3 bg-surface2 text-secondary font-bold uppercase text-xs rounded-xl hover:bg-surface2/80 transition-colors">
                            Continuer l'entraînement
                        </button>
                     </div>
                 </div>
            </Modal>
        )}

        {/* DETAILS MODAL */}
        {activeDetailExo && (() => {
            const exo = session.exercises[activeDetailExo.idx];
            const libEx = getExerciseById(exo.exerciseId);
            const historyExo = history.filter(h => h.exercises.some(e => e.exerciseId === exo.exerciseId)).slice(0, 5);

            return (
                <Modal title={libEx?.name || 'Détails'} onClose={() => setActiveDetailExo(null)}>
                    <div className="space-y-4">
                        <div className="flex bg-surface2 rounded-xl p-1 gap-1">
                             {['info', 'history', 'notes'].map((t) => (
                                 <button key={t} onClick={() => setActiveDetailExo({ ...activeDetailExo, tab: t as any })} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeDetailExo.tab === t ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-white'}`}>
                                     {t === 'info' ? 'Infos' : t === 'history' ? 'Historique' : 'Notes'}
                                 </button>
                             ))}
                        </div>

                        {activeDetailExo.tab === 'info' && libEx && (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-surface2 text-secondary">{libEx.muscle}</span>
                                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-surface2" style={{ color: TYPE_COLORS[libEx.type] }}>{libEx.type}</span>
                                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-surface2 text-secondary">{EQUIPMENTS[libEx.equipment]}</span>
                                </div>
                                {libEx.tips && (
                                    <div className="space-y-3 text-sm">
                                        {libEx.tips.setup && <div className="bg-surface2/30 p-3 rounded-xl"><h4 className="font-bold text-xs uppercase text-primary mb-1">Setup</h4><ul className="list-disc list-inside text-secondary/80 text-xs">{libEx.tips.setup.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
                                        {libEx.tips.exec && <div className="bg-surface2/30 p-3 rounded-xl"><h4 className="font-bold text-xs uppercase text-success mb-1">Exécution</h4><ul className="list-disc list-inside text-secondary/80 text-xs">{libEx.tips.exec.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
                                        {libEx.tips.mistake && <div className="bg-surface2/30 p-3 rounded-xl"><h4 className="font-bold text-xs uppercase text-danger mb-1">Erreurs</h4><ul className="list-disc list-inside text-secondary/80 text-xs">{libEx.tips.mistake.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
                                    </div>
                                )}
                                <div className="bg-warning/10 border border-warning/20 p-3 rounded-xl">
                                    <h4 className="font-bold text-xs uppercase text-warning mb-1 flex items-center gap-1"><span className="w-4 h-4 bg-warning text-black rounded flex items-center justify-center text-[10px]">W</span> Échauffement</h4>
                                    <p className="text-secondary/80 text-xs leading-relaxed">
                                        Cliquez sur le numéro d'une série pour la passer en <span className="text-warning font-bold">Warmup</span> (W). 
                                        Ces séries sont exclues de vos statistiques (Volume, 1RM).
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeDetailExo.tab === 'history' && (
                            <div className="space-y-3">
                                {/* PR SECTION IN HISTORY TAB */}
                                {getExerciseStats(exo.exerciseId, history, libEx?.type).pr > 0 && (
                                    <div className="bg-gold/10 border border-gold/30 p-3 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                             <span className="text-[10px] font-black uppercase text-gold flex items-center gap-1"><Icons.Star size={10} fill="currentColor" /> Record Personnel (PR)</span>
                                             <span className="text-[10px] font-bold text-cyan1rm">1RM: {getExerciseStats(exo.exerciseId, history, libEx?.type).pr}kg</span>
                                        </div>
                                        <div className="font-mono text-xs text-white bg-surface2/50 p-1.5 rounded-lg border border-gold/20">
                                            {getExerciseStats(exo.exerciseId, history, libEx?.type).prSessionString}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {historyExo.map((h, i) => {
                                        const hEx = h.exercises.find(e => e.exerciseId === exo.exerciseId);
                                        if (!hEx) return null;
                                        const doneSets = hEx.sets.filter(s => s.done);
                                        if (doneSets.length === 0) return null;
                                        
                                        const isCardio = libEx?.type === 'Cardio';
                                        const isStatic = libEx?.type === 'Isométrique' || libEx?.type === 'Étirement';
                                        
                                        const weightStr = doneSets.map(st => (st.isWarmup ? 'W' : '') + st.weight).join(',');
                                        const repStr = doneSets.map(st => (st.isWarmup ? 'W' : '') + (isStatic ? formatDuration(parseDuration(st.reps)) : st.reps)).join(',');
                                        const rirStr = doneSets.map(st => isCardio ? formatDuration(st.rir || '0') : (st.rir || '-')).join(',');

                                        return (
                                            <div key={i} className="bg-surface2/30 p-3 rounded-xl text-xs">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-bold text-white">{new Date(h.startTime).toLocaleDateString()}</span>
                                                    <span className="text-secondary">{h.sessionName}</span>
                                                </div>
                                                <div className="font-mono text-secondary">
                                                    {weightStr} {isCardio ? "Lvl" : "kg"} x {repStr} {isCardio ? "m" : isStatic ? "s" : "reps"}
                                                    <div className="text-[10px] mt-0.5 opacity-70">| {isCardio ? "" : "RIR "}{rirStr}</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {historyExo.length === 0 && <div className="text-center text-secondary py-4">Aucun historique.</div>}
                                </div>
                            </div>
                        )}

                        {activeDetailExo.tab === 'notes' && (
                             <div className="space-y-2">
                                <textarea 
                                    autoFocus
                                    className="w-full bg-surface2/50 p-3 rounded-xl text-xs outline-none border border-border focus:border-primary h-32" 
                                    placeholder="Notes personnelles pour cet exercice..." 
                                    value={exo.notes} 
                                    onChange={(e) => {
                                        const newSess = {...session};
                                        newSess.exercises[activeDetailExo.idx].notes = e.target.value;
                                        setSession(newSess);
                                    }}
                                />
                                <p className="text-[10px] text-secondary">Ces notes sont spécifiques à cette séance.</p>
                             </div>
                        )}
                    </div>
                </Modal>
            );
        })()}

        {showAddExoModal && (
            <Modal title="Ajouter Exercice" onClose={() => { setShowAddExoModal(false); setLibraryFilter(''); }}>
                <div className="space-y-4">
                <input placeholder="Rechercher..." className="w-full bg-surface2 p-3 rounded-2xl outline-none" onChange={(e) => setLibraryFilter(e.target.value)} autoFocus />
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {library.filter(l => !l.isArchived && ((l.name || '').toLowerCase().includes(libraryFilter.toLowerCase()) || (l.muscle || '').toLowerCase().includes(libraryFilter.toLowerCase()))).sort((a,b) => (a.isFavorite === b.isFavorite) ? (a.name || '').localeCompare(b.name || '') : (a.isFavorite ? -1 : 1)).map(l => (
                        <button key={l.id} onClick={() => addExercise(l.id)} className="w-full p-3 bg-surface2/50 rounded-2xl text-left hover:bg-surface2 transition-colors flex justify-between items-center group">
                        <div className="flex-1"><div className="flex items-center gap-2">{l.isFavorite && <span className="text-gold"><Icons.Star /></span>}<div className="font-bold text-sm group-hover:text-primary transition-colors">{l.name}</div></div><div className="text-[10px] text-secondary uppercase mt-1 flex gap-2"><span>{l.muscle} • {EQUIPMENTS[l.equipment as keyof typeof EQUIPMENTS]}</span><span style={{ color: TYPE_COLORS[l.type as keyof typeof TYPE_COLORS] }}>● {l.type}</span></div></div>
                        <div className="text-xl text-primary font-black">+</div>
                        </button>
                    ))}
                </div>
                </div>
            </Modal>
        )}
      </div>
    );
};
