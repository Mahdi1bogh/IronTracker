
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '../../core/utils';

interface ModalProps {
    title: string;
    onClose: () => void;
    children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
    const [mounted, setMounted] = useState(false);
    const modalId = useRef(`modal_${Date.now()}`).current;
    const historyPushed = useRef(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';

        // 1. PUSH : On tente d'ajouter une entrée dans l'historique
        try {
            window.history.pushState({ modalId }, '', window.location.href);
            historyPushed.current = true;
        } catch (e) {
            console.debug('History API restricted');
        }

        // 2. LISTEN : Si l'utilisateur appuie sur Retour, on ferme la modale
        const handlePopState = (e: PopStateEvent) => {
            // L'historique est déjà revenu en arrière (action navigateur), on ferme juste la modale
            e.preventDefault();
            onClose();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('popstate', handlePopState);
            
            // 3. CLEANUP : Si on a réussi à push, on doit revenir en arrière
            if (historyPushed.current) {
                try {
                    // On vérifie si l'état actuel est bien celui de NOTRE modale pour ne pas casser la navigation
                    if (window.history.state?.modalId === modalId) {
                        window.history.back();
                    }
                } catch (e) {
                    // Ignore security errors during cleanup
                }
            }
        };
    }, []); // Dépendances vides pour ne l'exécuter qu'au montage/démontage

    const handleManualClose = () => {
        triggerHaptic('click');
        if (historyPushed.current) {
            try {
                // Si on a pushé l'historique, on fait un back() qui déclenchera le popstate -> onClose
                window.history.back();
            } catch (e) {
                // Fallback si le back() est bloqué
                onClose();
            }
        } else {
            // Si pas d'historique (mode restreint), on ferme directement
            onClose();
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
                onClick={handleManualClose}
            />
            
            {/* Content */}
            <div className="bg-surface border border-white/10 w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] relative z-10 animate-zoom-in overflow-hidden">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-surface2/20 flex-shrink-0">
                    <h3 className="text-lg font-black italic uppercase text-white truncate pr-4">{title}</h3>
                    <button 
                        onClick={handleManualClose} 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:text-white transition-colors active:scale-90"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-5 overflow-y-auto overflow-x-hidden no-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
