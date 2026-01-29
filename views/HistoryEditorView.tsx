
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { WorkoutSession, SetRecord } from '../types';
import { EditorHeader } from '../components/ui/EditorHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { Modal } from '../components/ui/Modal';
import { Icons } from '../components/Icons';
import { triggerHaptic, moveItem } from '../utils';
import { EQUIPMENTS } from '../data/equipments';
import { TYPE_COLORS } from '../constants';
import { useConfirm } from '../hooks/useConfirm';

export const HistoryEditorView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const history = useStore(s => s.history);
    const setHistory = useStore(s => s.setHistory);
    const library = useStore(s => s.library);
    const confirm = useConfirm();

    const [editingHistorySession, setEditingHistorySession] = useState<WorkoutSession | null>(null);
    const [historyDuration, setHistoryDuration] = useState<string>("60");
    const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
    const [showAddExoModal, setShowAddExoModal] = useState(false);
    const [libraryFilter, setLibraryFilter] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const found = history.find(h => h.id === parseInt(id || "0"));
        if (found) {
            setEditingHistorySession(JSON.parse(JSON.stringify(found)));
            setHistoryDuration(found.endTime ? Math.floor((found.endTime - found.startTime) / 60000).toString() : "60");
        } else {
            navigate('/');
        }
    }, [id, history, navigate]);

    if (!editingHistorySession) return null;

    const getExerciseById = (id: number) => library.find(l => l.id === id);

    const handleUpdate = (updatedSession: WorkoutSession) => {
        setEditingHistorySession(updatedSession);
        setIsDirty(true);
    };

    const updateHistorySet = (exoIdx: number, setIdx: number, field: keyof SetRecord, value: any) => {
        const newSession = { ...editingHistorySession };
        const exo = newSession.exercises[exoIdx];
        exo.sets[setIdx] = { ...exo.sets[setIdx], [field]: value };
        handleUpdate(newSession);
    };

    const onDeleteExercise = (idx: number) => {
        confirm({
            title: "SUPPRIMER ?",
            message: "Supprimer l'exercice ?",
            subMessage: "Toutes les séries de cet exercice seront perdues.",
            variant: 'danger',
            onConfirm: () => {
                const newExos = [...editingHistorySession.exercises];
                newExos.splice(idx, 1);
                handleUpdate({...editingHistorySession, exercises: newExos});
            }
        });
    };

    // --- SHARED ACTIONS ---
    const handleCancel = () => {
        if (isDirty) {
            confirm({
                title: "ANNULER ?",
                message: "Annuler les modifications ?",
                subMessage: "Tous les changements non sauvegardés seront perdus.",
                variant: 'danger',
                onConfirm: () => navigate('/')
            });
        } else {
            navigate('/');
        }
    };

    const handleSave = () => {
        confirm({
            title: "SAUVEGARDER ?",
            message: "Enregistrer les modifications de la séance ?",
            variant: 'primary',
            confirmLabel: "Sauvegarder",
            onConfirm: () => {
                const durationMin = parseInt(historyDuration) || 0;
                const endTime = editingHistorySession.startTime + (durationMin * 60 * 1000);
                const sessionToSave = { ...editingHistorySession, endTime: durationMin > 0 ? endTime : undefined };
                setHistory(prev => {
                    const existingIdx = prev.findIndex(h => h.id === sessionToSave.id);
                    let newHist;
                    if (existingIdx >= 0) {
                        newHist = [...prev];
                        newHist[existingIdx] = sessionToSave;
                    } else {
                        newHist = [...prev, sessionToSave];
                    }
                    return newHist.sort((a,b) => b.startTime - a.startTime);
                });
                triggerHaptic('success');
                navigate('/');
            }
        });
    };

    // Bloquer les caractères non désirés (- et e)
    const preventNegative = (e: React.KeyboardEvent) => {
        if (['-', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
          <div className="space-y-6 animate-slide-in-bottom pb-24">
              <EditorHeader 
                  title={editingHistorySession.sessionName}
                  onCancel={handleCancel}
                  onSave={handleSave}
              />
              
              <SectionCard className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[9px] uppercase text-secondary">Date</label>
                          <input type="date" value={new Date(editingHistorySession.startTime).toISOString().split('T')[0]} onChange={e => {
                               const d = new Date(e.target.value);
                               const old = new Date(editingHistorySession.startTime);
                               d.setHours(old.getHours(), old.getMinutes());
                               handleUpdate({...editingHistorySession, startTime: d.getTime()});
                          }} className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold outline-none" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] uppercase text-secondary">Heure</label>
                          <input type="time" value={new Date(editingHistorySession.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} onChange={e => {
                              const [h, m] = e.target.value.split(':').map(Number);
                              const d = new Date(editingHistorySession.startTime);
                              d.setHours(h, m);
                              handleUpdate({...editingHistorySession, startTime: d.getTime()});
                          }} className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold outline-none" />
                      </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                           <label className="text-[9px] uppercase text-secondary">Durée (min)</label>
                           <input type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" value={historyDuration} onChange={e => { setHistoryDuration(e.target.value); setIsDirty(true); }} className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold outline-none" />
                      </div>
                      <div className="space-y-1">
                           <label className="text-[9px] uppercase text-secondary">Poids (kg)</label>
                           <input type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" value={editingHistorySession.bodyWeight} onChange={e => handleUpdate({...editingHistorySession, bodyWeight: e.target.value})} className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold outline-none" />
                      </div>
                      <div className="space-y-1">
                           <label className="text-[9px] uppercase text-secondary">Forme (1-5)</label>
                           <input type="number" min="1" max="5" onKeyDown={preventNegative} inputMode="numeric" value={editingHistorySession.fatigue} onChange={e => handleUpdate({...editingHistorySession, fatigue: e.target.value})} className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold outline-none" />
                      </div>
                  </div>
              </SectionCard>

              {editingHistorySession.exercises.map((exo, eIdx) => {
                  const libEx = getExerciseById(exo.exerciseId);
                  const isCardio = libEx?.type === 'Cardio';
                  const isStatic = libEx?.type === 'Statique' || libEx?.type === 'Étirement';
                  return (
                      <SectionCard key={eIdx} className="overflow-hidden">
                          <div className="p-4 bg-surface2/20 flex justify-between items-center border-b border-white/10">
                               <div className="flex gap-3 items-center">
                                   <div className="flex flex-col gap-1">
                                      {eIdx > 0 && <button onClick={() => { const newExos = moveItem(editingHistorySession.exercises, eIdx, eIdx - 1); handleUpdate({...editingHistorySession, exercises: newExos}); }} className="p-0.5 text-secondary hover:text-white"><Icons.ChevronUp size={14} /></button>}
                                      {eIdx < editingHistorySession.exercises.length - 1 && <button onClick={() => { const newExos = moveItem(editingHistorySession.exercises, eIdx, eIdx + 1); handleUpdate({...editingHistorySession, exercises: newExos}); }} className="p-0.5 text-secondary hover:text-white"><Icons.ChevronDown size={14} /></button>}
                                   </div>
                                   <div className="font-black italic uppercase">{libEx?.name || `Exo #${exo.exerciseId}`}</div>
                               </div>
                               <div className="flex items-center gap-1">
                                   <button 
                                      onClick={() => setExpandedNotes(prev => ({...prev, [`hist_${eIdx}`]: !prev[`hist_${eIdx}`]}))}
                                      className={`p-2 rounded-lg transition-colors ${exo.notes ? 'text-white bg-surface2' : 'text-secondary hover:text-white'}`}
                                   ><Icons.Note size={18} /></button>
                                   <button onClick={() => { triggerHaptic('error'); onDeleteExercise(eIdx); }} className="p-2 text-danger/50 hover:text-danger rounded-lg"><Icons.Trash size={18} /></button>
                               </div>
                          </div>
                          
                          {expandedNotes[`hist_${eIdx}`] && (
                             <div className="px-4 py-2 border-b border-white/10 bg-surface2/10">
                                <textarea 
                                   value={exo.notes || ''} 
                                   onChange={(e) => {
                                      const newExos = [...editingHistorySession.exercises];
                                      newExos[eIdx].notes = e.target.value;
                                      handleUpdate({...editingHistorySession, exercises: newExos});
                                   }}
                                   maxLength={280}
                                   rows={2}
                                   className="w-full bg-background border border-white/10 rounded-xl p-3 text-xs font-mono outline-none focus:border-primary placeholder-secondary/30"
                                   placeholder="Note pour cette séance..."
                                />
                             </div>
                          )}
                          
                          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[9px] font-bold uppercase text-secondary">
                              <div className="col-span-2 text-center">#</div>
                              <div className="col-span-3 text-center">{isCardio ? "Lvl" : "Poids"}</div>
                              <div className="col-span-3 text-center">{isCardio ? "Dist" : isStatic ? "Durée" : "Reps"}</div>
                              <div className="col-span-2 text-center">{isCardio ? "Durée" : "RIR"}</div>
                              <div className="col-span-2 text-right">Valid</div>
                          </div>

                          <div className="px-4 pb-4 space-y-2">
                              {exo.sets.map((set, sIdx) => (
                                  <div key={sIdx} className="grid grid-cols-12 gap-2 items-center text-xs">
                                      <div className="col-span-2 flex items-center justify-center relative gap-1">
                                          <button onClick={() => {
                                               const newSession = JSON.parse(JSON.stringify(editingHistorySession));
                                               newSession.exercises[eIdx].sets.splice(sIdx, 1);
                                               handleUpdate(newSession);
                                          }} className="w-5 h-5 flex items-center justify-center text-danger/50 hover:text-danger bg-danger/10 rounded"><Icons.Close size={10} /></button>
                                          <button 
                                            onClick={() => updateHistorySet(eIdx, sIdx, 'isWarmup', !set.isWarmup)} 
                                            className={`w-6 h-6 flex items-center justify-center text-center font-mono text-[10px] font-bold rounded border transition-colors ${set.isWarmup ? 'text-warning bg-warning/10 border-warning' : 'text-secondary border-transparent'}`}
                                          >
                                              {set.isWarmup ? 'W' : sIdx + 1}
                                          </button>
                                      </div>
                                      
                                      <input type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" className="col-span-3 bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-primary border border-transparent" placeholder={isCardio?"Lvl":"kg"} value={set.weight} onChange={e => updateHistorySet(eIdx, sIdx, 'weight', e.target.value)} />
                                      <input type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" className="col-span-3 bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-primary border border-transparent" placeholder={isCardio?"Dist (m)":isStatic?"T (s)":"reps"} value={set.reps} onChange={e => updateHistorySet(eIdx, sIdx, 'reps', e.target.value)} />
                                      <input type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" className="col-span-2 bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-primary border border-transparent" placeholder={isCardio?"T (min)":"RIR"} value={set.rir || ''} onChange={e => updateHistorySet(eIdx, sIdx, 'rir', e.target.value)} />
                                      
                                      <div className="col-span-2 flex items-center justify-end">
                                          <button 
                                            onClick={() => updateHistorySet(eIdx, sIdx, 'done', !set.done)} 
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${set.done ? 'bg-success border-success text-white' : 'bg-surface2 border-white/10 text-secondary/30'}`}
                                          >✓</button>
                                      </div>
                                  </div>
                              ))}
                              <button onClick={() => {
                                   const newExos = [...editingHistorySession.exercises];
                                   const last = newExos[eIdx].sets[newExos[eIdx].sets.length-1];
                                   newExos[eIdx].sets.push({ weight: last?.weight||"", reps: last?.reps||"", done: true, rir: last?.rir||"" });
                                   handleUpdate({...editingHistorySession, exercises: newExos});
                              }} className="w-full py-2 bg-surface2/50 rounded-xl text-[10px] font-bold uppercase text-secondary border border-dashed border-white/10 hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
                                  <Icons.Plus size={12} /> Série
                              </button>
                          </div>
                      </SectionCard>
                  );
              })}
              
              <button onClick={() => setShowAddExoModal(true)} className="w-full py-4 border-2 border-dashed border-white/10 rounded-[2rem] text-secondary font-black uppercase hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2">
                  <Icons.Plus size={18} /> Ajouter Exercice
              </button>
              
              {showAddExoModal && (
                <Modal title="Ajouter Exercice" onClose={() => { setShowAddExoModal(false); setLibraryFilter(''); }}>
                    <div className="space-y-4">
                    <input placeholder="Rechercher..." className="w-full bg-surface2 p-3 rounded-2xl outline-none" onChange={(e) => setLibraryFilter(e.target.value)} autoFocus />
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {library.filter(l => !l.isArchived && ((l.name || '').toLowerCase().includes(libraryFilter.toLowerCase()) || (l.muscle || '').toLowerCase().includes(libraryFilter.toLowerCase()))).sort((a,b) => (a.isFavorite === b.isFavorite) ? (a.name || '').localeCompare(b.name || '') : (a.isFavorite ? -1 : 1)).map(l => (
                            <button key={l.id} onClick={() => {
                                const newExos = [...editingHistorySession.exercises, { exerciseId: l.id, target: "3 x 10", rest: 90, targetRir: "", isBonus: true, notes: "", sets: [{ weight: "", reps: "", done: true, rir: "" }] }];
                                handleUpdate({...editingHistorySession, exercises: newExos});
                                setLibraryFilter(''); setShowAddExoModal(false);
                            }} className="w-full p-3 bg-surface2/50 rounded-2xl text-left hover:bg-surface2 transition-colors flex justify-between items-center group">
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
