
import React from 'react';
import { useStore } from '../../store/useStore';
import { triggerHaptic } from '../../utils';
import { Icons } from '../Icons';

export const ConfirmationModal: React.FC = () => {
    const confirmation = useStore(s => s.confirmation);
    const closeConfirmation = useStore(s => s.closeConfirmation);

    if (!confirmation) return null;

    const { 
        title, 
        message, 
        subMessage, 
        confirmLabel = "Confirmer", 
        cancelLabel = "Annuler", 
        variant = 'primary', 
        onConfirm, 
        onCancel 
    } = confirmation;

    const isDanger = variant === 'danger';

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border p-6 rounded-[2rem] w-full max-w-sm shadow-2xl space-y-5 animate-zoom-in">
               
               <div className="flex flex-col items-center gap-2">
                   {isDanger && <Icons.TrendUp className="text-warning rotate-180" size={32} />}
                   <h3 className={`text-xl font-black italic uppercase text-center ${isDanger ? 'text-white' : 'text-white'}`}>{title || "Confirmation"}</h3>
               </div>

               <div className="space-y-2 text-center">
                   <div className={`font-bold text-sm ${isDanger ? 'text-warning' : 'text-white'}`}>
                       {isDanger && "⚠️ "}{message}
                   </div>
                   {subMessage && <div className="text-xs text-secondary whitespace-pre-wrap">{subMessage}</div>}
               </div>
               
               <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                      onClick={() => { 
                          triggerHaptic('click'); 
                          if (onCancel) onCancel(); 
                          closeConfirmation(); 
                      }} 
                      className="py-3.5 bg-surface2 rounded-xl text-xs font-bold uppercase text-secondary hover:text-white hover:bg-surface2/80 transition-colors"
                  >
                      {cancelLabel}
                  </button>
                  <button 
                      onClick={() => { 
                          triggerHaptic(isDanger ? 'success' : 'success');
                          onConfirm(); 
                          closeConfirmation(); 
                      }} 
                      className={`py-3.5 rounded-xl text-xs font-bold uppercase text-black shadow-lg transition-transform active:scale-95 ${isDanger ? 'bg-warning shadow-warning/20' : 'bg-success shadow-success/20'}`}
                  >
                      {confirmLabel}
                  </button>
               </div>
            </div>
        </div>
    );
};
