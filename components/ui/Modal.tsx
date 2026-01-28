
import React from 'react';
import { triggerHaptic } from '../../utils';

interface ModalProps {
    title: string;
    onClose: () => void;
    children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[400] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-surface border border-border w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-in-bottom">
      <div className="p-6 border-b border-border flex justify-between items-center bg-surface2/20">
        <h3 className="text-xl font-black italic uppercase">{title}</h3>
        <button onClick={() => { triggerHaptic('click'); onClose(); }} className="p-2 text-secondary hover:text-white transition-colors">✕</button>
      </div>
      <div className="p-6 overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
  </div>
);
