
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Program } from '../types';
import { EditorHeader } from '../components/ui/EditorHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { Modal } from '../components/ui/Modal';
import { Icons } from '../components/Icons';
import { TYPE_COLORS } from '../constants';
import { triggerHaptic } from '../utils';
import { EQUIPMENTS } from '../data/equipments';
import { useConfirm } from '../hooks/useConfirm';

export const ProgramEditorView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const programs = useStore(s => s.programs);
    const setPrograms = useStore(s => s.setPrograms);
    const library = useStore(s => s.library);
    const confirm = useConfirm();

    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [programExoPicker, setProgramExoPicker] = useState<number | null>(null);
    const [libraryFilter, setLibraryFilter] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (id === 'new') {
            setEditingProgram({ id: `prog_${Date.now()}`, name: "Nouveau Programme", sessions: [] });
            setIsDirty(true);
        } else {
            const found = programs.find(p => p.id === id);
            if (found) {
                setEditingProgram(JSON.parse(JSON.stringify(found)));
            } else {
                navigate('/programs');
            }
        }
    }, [id, programs, navigate]);

    if (!editingProgram) return null;

    const getExerciseById = (id: number) => library.find(l => l.id === id);

    const handleUpdate = (updatedProgram: Program) => {
        setEditingProgram(updatedProgram);
        setIsDirty(true);
    };

    const onDeleteSession = (sIdx: number) => {
        confirm({
            title: "SUPPRIMER ?",
            message: "Supprimer cette séance ?",
            variant: 'danger',
            onConfirm: () => {
                const newSess = editingProgram.sessions.filter((_, i) => i !== sIdx);
                handleUpdate({...editingProgram, sessions: newSess});
            }
        });
    };

    const onDeleteExercise = (sIdx: number, eIdx: number) => {
        confirm({
            title: "SUPPRIMER ?",
            message: "Retirer cet exercice ?",
            variant: 'danger',
            onConfirm: () => {
                const newSess = [...editingProgram.sessions];
                newSess[sIdx].exos.splice(eIdx, 1);
                handleUpdate({...editingProgram, sessions: newSess});
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
          <div className="space-y-6 animate-zoom-in pb-20">
              <EditorHeader 
                 title={editingProgram.name} 
                 onCancel={() => { 
                    if (isDirty) {
                        confirm({
                            title: "ANNULER ?",
                            message: "Quitter sans sauvegarder ?",
                            subMessage: "Les modifications seront perdues.",
                            variant: 'danger',
                            onConfirm: () => navigate('/programs')
                        });
                    } else {
                        navigate('/programs'); 
                    }
                 }} 
                 onSave={() => {
                     if (!editingProgram.name.trim()) return;
                     confirm({
                         title: "SAUVEGARDER ?",
                         message: "Enregistrer les modifications du programme ?",
                         variant: 'primary',
                         confirmLabel: "Sauvegarder",
                         onConfirm: () => {
                             setPrograms(prev => {
                                 const idx = prev.findIndex(p => p.id === editingProgram.id);
                                 if (idx >= 0) {
                                     const newProgs = [...prev];
                                     newProgs[idx] = editingProgram;
                                     return newProgs;
                                 }
                                 return [...prev, editingProgram];
                             });
                             triggerHaptic('success');
                             navigate('/programs');
                         }
                     });
                 }}
              />
              
              <SectionCard className="p-6">
                  <div className="space-y-1 mb-6">
                      <label className="text-[10px] uppercase text-secondary">Nom du programme</label>
                      <input value={editingProgram.name} onChange={e => handleUpdate({...editingProgram, name: e.target.value})} className="w-full bg-surface2 p-3 rounded-xl font-bold outline-none focus:border-primary border border-transparent" />
                  </div>
                  
                  <div className="space-y-6">
                      {editingProgram.sessions.map((sess, sIdx) => (
                          <div key={sess.id} className="bg-surface2/30 rounded-2xl border border-white/5 p-4">
                              <div className="flex justify-between items-center mb-4 gap-2">
                                  <div className="flex flex-col gap-1">
                                      {sIdx > 0 && <button onClick={() => { const newSess = [...editingProgram.sessions]; const item = newSess.splice(sIdx, 1)[0]; newSess.splice(sIdx - 1, 0, item); handleUpdate({...editingProgram, sessions: newSess}); }} className="p-1 bg-surface2 rounded text-secondary hover:text-white"><Icons.ChevronUp size={14} /></button>}
                                      {sIdx < editingProgram.sessions.length - 1 && <button onClick={() => { const newSess = [...editingProgram.sessions]; const item = newSess.splice(sIdx, 1)[0]; newSess.splice(sIdx + 1, 0, item); handleUpdate({...editingProgram, sessions: newSess}); }} className="p-1 bg-surface2 rounded text-secondary hover:text-white"><Icons.ChevronDown size={14} /></button>}
                                  </div>
                                  <input value={sess.name} onChange={e => {
                                      const newSess = [...editingProgram.sessions];
                                      newSess[sIdx].name = e.target.value;
                                      handleUpdate({...editingProgram, sessions: newSess});
                                  }} className="bg-transparent font-bold text-sm outline-none w-full" placeholder="Nom séance" />
                                  <button onClick={() => { triggerHaptic('error'); onDeleteSession(sIdx); }} className="p-2 text-danger/50 hover:text-danger rounded-lg"><Icons.Trash size={16} /></button>
                              </div>
                              <div className="space-y-2">
                                  {sess.exos.map((ex, eIdx) => {
                                      const libEx = getExerciseById(ex.exerciseId);
                                      return (
                                          <div key={eIdx} className="bg-surface2/50 p-3 rounded-xl flex flex-col gap-2 relative border border-transparent hover:border-white/10 transition-colors">
                                              <div className="flex justify-between items-start gap-3">
                                                   <div className="flex flex-col gap-1 pt-1">
                                                       {eIdx > 0 && <button onClick={() => { const newSess = [...editingProgram.sessions]; const item = newSess[sIdx].exos.splice(eIdx, 1)[0]; newSess[sIdx].exos.splice(eIdx - 1, 0, item); handleUpdate({...editingProgram, sessions: newSess}); }} className="p-0.5 hover:text-white text-secondary"><Icons.ChevronUp size={14} /></button>}
                                                       {eIdx < sess.exos.length - 1 && <button onClick={() => { const newSess = [...editingProgram.sessions]; const item = newSess[sIdx].exos.splice(eIdx, 1)[0]; newSess[sIdx].exos.splice(eIdx + 1, 0, item); handleUpdate({...editingProgram, sessions: newSess}); }} className="p-0.5 hover:text-white text-secondary"><Icons.ChevronDown size={14} /></button>}
                                                   </div>

                                                  <div className="flex-1">
                                                      <div className="font-bold text-xs truncate">{libEx?.name || 'Inconnu'}</div>
                                                      {libEx && <span className="text-[9px] font-bold uppercase opacity-70" style={{color: TYPE_COLORS[libEx.type as keyof typeof TYPE_COLORS]}}>{libEx.type.substring(0,4).toUpperCase()}</span>}
                                                  </div>
                                                  
                                                  <button onClick={() => { triggerHaptic('error'); onDeleteExercise(sIdx, eIdx); }} className="text-secondary/50 hover:text-danger p-1"><Icons.Close size={16} /></button>
                                              </div>
                                              
                                              <div className="grid grid-cols-4 gap-2 pl-6">
                                                  <div className="space-y-0.5">
                                                      <label className="text-[8px] uppercase text-secondary">Sets</label>
                                                      <input type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" value={ex.sets} onChange={e => {
                                                          const newSess = [...editingProgram.sessions];
                                                          newSess[sIdx].exos[eIdx].sets = parseInt(e.target.value) || 0;
                                                          handleUpdate({...editingProgram, sessions: newSess});
                                                      }} className="w-full bg-surface2 text-center text-[10px] rounded p-1.5 outline-none focus:border-primary border border-transparent font-mono font-bold" />
                                                  </div>
                                                  <div className="space-y-0.5">
                                                      <label className="text-[8px] uppercase text-secondary">Reps</label>
                                                      <input type="text" value={ex.reps} onChange={e => {
                                                          const newSess = [...editingProgram.sessions];
                                                          newSess[sIdx].exos[eIdx].reps = e.target.value;
                                                          handleUpdate({...editingProgram, sessions: newSess});
                                                      }} className="w-full bg-surface2 text-center text-[10px] rounded p-1.5 outline-none focus:border-primary border border-transparent font-mono font-bold" />
                                                  </div>
                                                  <div className="space-y-0.5">
                                                      <label className="text-[8px] uppercase text-secondary">RIR</label>
                                                      <input type="text" value={ex.targetRir || ""} placeholder="-" onChange={e => {
                                                          const newSess = [...editingProgram.sessions];
                                                          newSess[sIdx].exos[eIdx].targetRir = e.target.value;
                                                          handleUpdate({...editingProgram, sessions: newSess});
                                                      }} className="w-full bg-surface2 text-center text-[10px] rounded p-1.5 outline-none focus:border-primary border border-transparent font-mono font-bold" />
                                                  </div>
                                                  <div className="space-y-0.5">
                                                      <label className="text-[8px] uppercase text-secondary">Rest</label>
                                                      <input type="number" min="0" onKeyDown={preventNegative} inputMode="decimal" value={ex.rest} onChange={e => {
                                                          const newSess = [...editingProgram.sessions];
                                                          newSess[sIdx].exos[eIdx].rest = parseInt(e.target.value) || 0;
                                                          handleUpdate({...editingProgram, sessions: newSess});
                                                      }} className="w-full bg-surface2 text-center text-[10px] rounded p-1.5 outline-none focus:border-primary border border-transparent font-mono font-bold" />
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                                  <button onClick={() => { triggerHaptic('click'); setProgramExoPicker(sIdx); setLibraryFilter(''); }} className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[10px] uppercase text-secondary hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
                                      <Icons.Plus size={14} /> Ajouter Exercice
                                  </button>
                              </div>
                          </div>
                      ))}
                      <button onClick={() => { 
                          triggerHaptic('click'); 
                          handleUpdate({
                              ...editingProgram, 
                              sessions: [...editingProgram.sessions, { id: `sess_${Date.now()}`, name: "Nouvelle Séance", exos: [] }]
                          });
                      }} className="w-full py-4 bg-surface2 rounded-2xl font-bold uppercase text-xs text-secondary hover:text-white transition-colors flex items-center justify-center gap-2">
                          <Icons.Plus size={16} /> Ajouter Séance
                      </button>
                  </div>
              </SectionCard>

              {programExoPicker !== null && (
                <Modal title="Choisir Exercice" onClose={() => { setProgramExoPicker(null); setLibraryFilter(''); }}>
                    <div className="space-y-4">
                    <input placeholder="Rechercher..." className="w-full bg-surface2 p-3 rounded-2xl outline-none" onChange={(e) => setLibraryFilter(e.target.value)} autoFocus />
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {library.filter(l => !l.isArchived && ((l.name || '').toLowerCase().includes(libraryFilter.toLowerCase()) || (l.muscle || '').toLowerCase().includes(libraryFilter.toLowerCase()))).sort((a,b) => (a.isFavorite === b.isFavorite) ? (a.name || '').localeCompare(b.name || '') : (a.isFavorite ? -1 : 1)).map(l => (
                            <button key={l.id} onClick={() => {
                                if (editingProgram && programExoPicker !== null) {
                                    const newSess = [...editingProgram.sessions]; 
                                    newSess[programExoPicker].exos.push({ exerciseId: l.id, sets: 3, reps: "10", rest: 120 }); 
                                    handleUpdate({...editingProgram, sessions: newSess});
                                }
                                setLibraryFilter(''); setProgramExoPicker(null);
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
