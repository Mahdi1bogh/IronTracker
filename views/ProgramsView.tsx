
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { SectionCard } from '../components/ui/SectionCard';
import { Icons } from '../components/Icons';
import { triggerHaptic } from '../utils';
import { useConfirm } from '../hooks/useConfirm';

interface ProgramsViewProps {
    onStartPreview: (progName: string, sess: any) => void;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({ onStartPreview }) => {
    const navigate = useNavigate();
    const programs = useStore(s => s.programs);
    const setPrograms = useStore(s => s.setPrograms);
    const confirm = useConfirm();

    const onDeleteProgram = (id: string) => {
        confirm({
            title: "SUPPRIMER ?",
            message: "Voulez-vous supprimer ce programme ?",
            subMessage: "Cette action est irréversible.",
            variant: 'danger',
            onConfirm: () => {
                setPrograms(prev => prev.filter(p => p.id !== id));
                triggerHaptic('success');
            }
        });
    };

    return (
      <div className="space-y-6 animate-fade-in pb-24">
          <h2 className="text-2xl font-black italic uppercase px-1">Programmes</h2>
          
          <button 
              onClick={() => { 
                  triggerHaptic('click'); 
                  navigate('/programs/edit/new');
              }} 
              className="w-full py-4 bg-primary text-background font-black uppercase rounded-[2rem] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
              <Icons.Plus size={18} strokeWidth={3} />
              <span>Nouveau Programme</span>
          </button>

          {programs.map(prog => (
              <SectionCard key={prog.id} className="overflow-hidden">
                  <div className="p-4 bg-surface2/30 border-b border-border flex justify-between items-center">
                      <h3 className="font-black italic text-lg uppercase">{prog.name}</h3>
                      <div className="flex items-center gap-1">
                          <button onClick={() => { triggerHaptic('click'); onDeleteProgram(prog.id); }} className="p-2 text-secondary/50 hover:text-danger transition-colors rounded-lg"><Icons.Trash size={18} /></button>
                          <button onClick={() => { triggerHaptic('click'); navigate(`/programs/edit/${prog.id}`); }} className="p-2 text-secondary hover:text-primary transition-colors rounded-lg"><Icons.Settings size={18} /></button>
                      </div>
                  </div>
                  <div className="p-2 space-y-2">
                      {prog.sessions.map(sess => (
                          <div key={sess.id} className="bg-surface2/20 p-3 rounded-xl flex justify-between items-center group hover:bg-surface2/50 transition-all cursor-pointer" onClick={() => { triggerHaptic('click'); onStartPreview(prog.name, sess); }}>
                              <div>
                                  <div className="font-bold text-sm">{sess.name}</div>
                                  <div className="text-[10px] text-secondary">{sess.exos.length} exercices</div>
                              </div>
                              <button className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all border border-primary/20 group-hover:border-transparent">
                                  <Icons.ChevronRight size={16} />
                              </button>
                          </div>
                      ))}
                  </div>
              </SectionCard>
          ))}

          {programs.length === 0 && (
              <div className="text-center py-10 text-secondary">
                  Aucun programme. Créez-en un pour commencer !
              </div>
          )}
      </div>
    );
};
