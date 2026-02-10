
import React from 'react';
import { triggerHaptic } from '../../core/utils';
import { Icons } from '../icons/Icons';

interface RestTimerOverlayProps {
    restTime: number | null;
    showGo: boolean;
    setRestTarget: (val: number | null | ((prev: number | null) => number | null)) => void;
}

export const RestTimerOverlay: React.FC<RestTimerOverlayProps> = ({ 
    restTime, showGo, setRestTarget 
}) => {
    if (restTime === null) return null;

    return (
        <div className="fixed left-0 right-0 z-40 pb-8 flex justify-center pointer-events-none transition-all duration-300 ease-in-out bottom-0 px-4">
             <div className={`
                pointer-events-auto 
                flex items-center gap-4 
                px-6 py-4 
                rounded-xl 
                shadow-lg 
                backdrop-blur-md 
                border 
                animate-slide-in-bottom 
                transition-all
                ${showGo 
                    ? 'bg-success/20 border-success text-success scale-110' 
                    : 'bg-white border-border text-neutral-800'
                }
             `}>
                {/* Timer Display */}
                <div className="flex flex-col items-center min-w-[80px]">
                   {showGo ? (
                       <div className="flex items-center gap-2 animate-pulse">
                           <Icons.Flame size={24} fill="currentColor" />
                           <span className="text-2xl font-bold">GO!</span>
                       </div>
                   ) : (
                       <>
                           <span className="text-[9px] font-medium uppercase text-secondary/70 tracking-wider mb-0.5">Repos</span>
                           <span className="text-3xl font-mono font-bold tracking-tighter leading-none tabular-nums">
                               {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
                           </span>
                       </>
                   )}
                </div>

                {/* Controls Divider */}
                {!showGo && <div className="w-px h-8 bg-border mx-1" />}

                {/* Controls */}
                {!showGo && (
                    <div className="flex gap-1.5">
                       <button 
                           onClick={() => { triggerHaptic('click'); setRestTarget((prev) => (prev || Date.now()) - 30000); }} 
                           className="w-10 h-10 rounded-lg bg-surface border border-border text-secondary font-bold text-xs active:scale-90 hover:text-primary transition-all flex items-center justify-center"
                       >
                           -30
                       </button>
                       <button 
                           onClick={() => { triggerHaptic('click'); setRestTarget((prev) => (prev || Date.now()) + 30000); }} 
                           className="w-10 h-10 rounded-lg bg-surface border border-border text-secondary font-bold text-xs active:scale-90 hover:text-primary transition-all flex items-center justify-center"
                       >
                           +30
                       </button>
                       <button 
                           onClick={() => { triggerHaptic('click'); setRestTarget(null); }} 
                           className="w-10 h-10 rounded-lg bg-danger/10 border border-danger/30 text-danger font-bold active:scale-90 hover:bg-danger/20 transition-all flex items-center justify-center ml-1"
                       >
                           <Icons.Close size={16} />
                       </button>
                    </div>
                )}
             </div>
        </div>
    );
};
