
import React from 'react';
import { useStore } from '../../store/useStore';
import { triggerHaptic } from '../../utils';

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

    return (
        <div className="fixed inset-0 z-[500] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border p-6 rounded-[2rem] w-full max-w-sm shadow-2xl space-y-4 animate-zoom-in">
               <h3 className="text-lg font-black italic uppercase text-center">{title || message}</h3>
               {title && <div className="text-sm font-bold text-center">{message}</div>}
               {subMessage && <div className="text-xs text-secondary text-center whitespace-pre-wrap">{subMessage}</div>}
               
               <div className="grid grid-cols-2 gap-4 pt-2">
                  <button 
                      onClick={() => { 
                          triggerHaptic('click'); 
                          if (onCancel) onCancel(); 
                          closeConfirmation(); 
                      }} 
                      className="py-3 bg-surface2 rounded-xl text-xs font-bold uppercase hover:bg-surface2/80 transition-colors"
                  >
                      {cancelLabel}
                  </button>
                  <button 
                      onClick={() => { 
                          if (variant === 'danger') triggerHaptic('success'); // Confirming danger = done
                          else triggerHaptic('success');
                          onConfirm(); 
                          closeConfirmation(); 
                      }} 
                      className={`py-3 rounded-xl text-xs font-bold uppercase text-white shadow-lg transition-transform active:scale-95 ${variant === 'primary' ? 'bg-primary shadow-primary/20' : 'bg-danger shadow-danger/20'}`}
                  >
                      {confirmLabel}
                  </button>
               </div>
            </div>
        </div>
    );
};
