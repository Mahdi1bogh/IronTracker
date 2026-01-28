
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { LibraryExercise, ExerciseType } from '../types';
import { triggerHaptic } from '../utils';
import { Icons } from '../components/Icons';
import { TYPE_COLORS } from '../constants';
import { EQUIPMENTS } from '../data/equipments';
import { EXERCISE_TYPE_LIST } from '../data/exerciseTypes';
import { Modal } from '../components/ui/Modal';
import { useConfirm } from '../hooks/useConfirm';

const MUSCLE_ORDER = ['Pectoraux', 'Dos', 'Épaules', 'Bras', 'Avant-bras', 'Abdos', 'Jambes', 'Mollets', 'Cou', 'Cardio'];

export const LibraryView: React.FC = () => {
    const library = useStore(s => s.library);
    const setLibrary = useStore(s => s.setLibrary);
    const confirm = useConfirm();
    
    const [libraryFilter, setLibraryFilter] = useState('');
    const [editingExercise, setEditingExercise] = useState<LibraryExercise | null>(null);

    const onDeleteExercise = (id: number) => {
        confirm({
            title: "ARCHIVER ?",
            message: "Voulez-vous archiver cet exercice ?",
            subMessage: "Il sera masqué de la liste mais conservé dans votre historique.",
            variant: 'danger',
            onConfirm: () => { 
                setLibrary(prev => prev.map(l => l.id === id ? { ...l, isArchived: true } : l)); 
                triggerHaptic('success');
            }
        });
    };

    const onToggleFavorite = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic('tick');
        setLibrary(prev => prev.map(l => l.id === id ? { ...l, isFavorite: !l.isFavorite } : l));
    };

    return (
      <div className="space-y-4 animate-fade-in pb-24 h-full flex flex-col">
          <div className="flex justify-between items-center px-1">
              <h2 className="text-2xl font-black italic uppercase">Bibliothèque</h2>
              <div className="text-xs font-bold text-secondary bg-surface2 px-3 py-1 rounded-full">{library.filter(l => !l.isArchived).length} Exos</div>
          </div>

          <div className="space-y-2">
            <button 
                onClick={() => { 
                    triggerHaptic('click'); 
                    setEditingExercise({ id: 0, name: "", type: "Isolation", muscle: "Pectoraux", equipment: "BB" }); 
                }} 
                className="w-full py-4 bg-primary text-background font-black uppercase rounded-[2rem] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
                <Icons.Plus size={18} strokeWidth={3} />
                <span>Nouveau</span>
            </button>

            <div className="bg-surface2 p-2 rounded-2xl flex items-center gap-2 border border-transparent focus-within:border-primary/50 transition-colors">
                <span className="text-secondary pl-2"><Icons.Search size={16} /></span>
                <input 
                    className="bg-transparent w-full p-2 outline-none font-bold text-sm placeholder-secondary/50" 
                    placeholder="Rechercher (nom, muscle...)" 
                    value={libraryFilter}
                    onChange={e => setLibraryFilter(e.target.value)}
                />
                {libraryFilter && <button onClick={() => setLibraryFilter('')} className="p-2 text-secondary hover:text-white">✕</button>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {library.filter(l => !l.isArchived && (l.name.toLowerCase().includes(libraryFilter.toLowerCase()) || l.muscle.toLowerCase().includes(libraryFilter.toLowerCase()))).sort((a,b) => (a.isFavorite === b.isFavorite) ? a.name.localeCompare(b.name) : (a.isFavorite ? -1 : 1)).map(l => (
                  <div key={l.id} className="bg-surface border border-transparent hover:border-border p-3 rounded-2xl flex justify-between items-center group cursor-pointer transition-all active:scale-95" onClick={() => { triggerHaptic('click'); setEditingExercise(l); }}>
                      <div className="flex items-center gap-3">
                          <button onClick={(e) => onToggleFavorite(l.id, e)} className={`text-lg transition-transform hover:scale-110 ${l.isFavorite ? 'text-gold' : 'text-secondary/20'}`}>
                             {l.isFavorite ? <Icons.Star /> : <Icons.StarOutline />}
                          </button>
                          <div>
                              <div className="font-bold text-sm leading-tight">{l.name}</div>
                              <div className="flex gap-2 mt-1">
                                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface2 text-secondary">{l.muscle}</span>
                                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface2" style={{ color: TYPE_COLORS[l.type] }}>{l.type}</span>
                              </div>
                          </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                           <button onClick={(e) => { e.stopPropagation(); onDeleteExercise(l.id); }} className="p-2 text-danger/50 hover:text-danger bg-danger/10 rounded-lg"><Icons.Trash size={16} /></button>
                      </div>
                  </div>
              ))}
              {libraryFilter && library.filter(l => !l.isArchived && l.name.toLowerCase().includes(libraryFilter.toLowerCase())).length === 0 && (
                  <div className="text-center py-10 text-secondary">Aucun exercice trouvé.</div>
              )}
          </div>

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
      </div>
    );
};
