
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '../../utils';

interface ModalProps {
    title: string;
    onClose: () => void;
    children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Empêcher le scroll du body quand la modale est ouverte
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
                onClick={() => { triggerHaptic('click'); onClose(); }}
            />
            
            {/* Content */}
            <div className="bg-surface border border-white/10 w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] relative z-10 animate-zoom-in overflow-hidden">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-surface2/20 flex-shrink-0">
                    <h3 className="text-lg font-black italic uppercase text-white truncate pr-4">{title}</h3>
                    <button 
                        onClick={() => { triggerHaptic('click'); onClose(); }} 
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
