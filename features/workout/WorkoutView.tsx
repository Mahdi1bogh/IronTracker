
import React, { useState, useMemo } from 'react';
import { useWorkoutManager } from './hooks/useWorkoutManager';
import { Modal } from '../../components/ui/Modal';
import { Icons } from '../../components/icons/Icons';
import { QuickPlateModal } from '../../components/common/QuickPlateModal';
import { triggerHaptic, getExerciseStats, formatDuration } from '../../core/utils';
import { FATIGUE_COLORS, TYPE_COLORS } from '../../core/constants';
import { EQUIPMENTS } from '../../core/data/equipments';
import { ExerciseCard } from './components/ExerciseCard';

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

    // Helper pour format HH:mm strict
    const getTimeString = (ts: number) => {
        const d = new Date(ts);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
      <div className="space-y-6 pb-24 animate-zoom-in">
        {/* Header Section */}
        <div className="flex items-start justify-between">
            <div className="text-left">
                <h2 className="text-2xl font-bold uppercase leading-none text-white">{session.sessionName}</h2>
                <div className="flex gap-2 items-center mt-1">
                    <p className="text-secondary text-xs uppercase tracking-wider">{session.programName}</p>
                    {isLogMode && <span className="text-[9px] font-medium bg-primary/10 text-primary px-1.5 rounded uppercase">Mode Saisie</span>}
                </div>
            </div>
            <button onClick={() => setShowSessionSettings(true)} className="p-2 bg-surface rounded-lg text-secondary hover:text-primary transition-colors border border-border">
                <Icons.Settings size={20} />
            </button>
        </div>
        
        {/* Exercises List - Utilisation du composant ExerciseCard local au feature */}
        <div className="space-y-6">
            {session.exercises.map((exo, exoIdx) => {
                const libEx = getExerciseById(exo.exerciseId);
                const isCardio = libEx?.type === 'Cardio';
                const isStatic = libEx?.type === 'Statique' || libEx?.type === 'Étirement';
                const stats = libEx ? getExerciseStats(libEx.id, history, libEx.type) : { lastSessionString: '-', prSessionString: '-', lastSessionVolume: 0, lastBestSet: null, pr: 0 };

                return (
                    <ExerciseCard 
                        key={exoIdx}
                        exo={exo}
                        exoIdx={exoIdx}
                        libEx={libEx}
                        stats={stats}
                        isCardio={isCardio}
                        isStatic={isStatic}
                        isLogMode={isLogMode}
                        isFirst={exoIdx === 0}
                        isLast={exoIdx === session.exercises.length - 1}
                        onMove={moveExercise}
                        onRemove={(idx) => { triggerHaptic('error'); removeExercise(idx); }}
                        onAddSet={addSet}
                        onRemoveSet={removeSet}
                        onUpdateSet={updateSet}
                        onOpenDetail={() => { triggerHaptic('click'); setActiveDetailExo({ idx: exoIdx, tab: 'info' }); }}
                        onWarmup={() => { triggerHaptic('click'); setWarmupTargetExo(exoIdx); }}
                        onPlateHelp={(target) => setQuickPlateTarget(target)}
                    />
                );
            })}
        </div>

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
                             <input type="time" value={getTimeString(session.startTime)} onChange={e => {
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
