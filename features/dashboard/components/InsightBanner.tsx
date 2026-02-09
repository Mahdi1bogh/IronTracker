
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../../components/icons/Icons';
import { InsightItem } from '../../../core/types';
import { triggerHaptic } from '../../../core/utils';

interface InsightBannerProps {
    insight: InsightItem[] | { title: string | null; text: string | null; } | null;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({ insight }) => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // Normalize input to array
    const items: InsightItem[] = Array.isArray(insight) ? insight : (insight ? [{ 
        id: 'legacy', 
        title: insight.title || '', 
        text: insight.text || '', 
        level: 'info', 
        priority: 10 
    }] : []);

    // Timer Ref for Auto-Play
    const timerRef = useRef<number | null>(null);
    const touchStartX = useRef<number | null>(null);

    const resetTimer = () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % items.length);
        }, 6000);
    };

    useEffect(() => {
        if (items.length > 1) {
            resetTimer();
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [items.length]);

    if (items.length === 0) return null;

    const currentItem = items[currentIndex];

    // Colors based on level
    const getColors = (level: string) => {
        switch(level) {
            case 'danger': return { iconBg: 'bg-danger/10', iconColor: 'text-danger', border: 'border-danger/20' };
            case 'warning': return { iconBg: 'bg-warning/10', iconColor: 'text-warning', border: 'border-warning/20' };
            case 'success': return { iconBg: 'bg-success/10', iconColor: 'text-success', border: 'border-success/20' };
            default: return { iconBg: 'bg-primary/10', iconColor: 'text-primary', border: 'border-primary/20' };
        }
    };

    const style = getColors(currentItem.level);

    // --- SWIPE HANDLERS ---
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        // Pause timer on touch
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const endX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - endX;

        if (Math.abs(diff) > 50) { // Threshold 50px
            triggerHaptic('tick');
            if (diff > 0) {
                // Swipe Left -> Next
                setCurrentIndex(prev => (prev + 1) % items.length);
            } else {
                // Swipe Right -> Prev
                setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
            }
        }
        
        // Resume timer
        if (items.length > 1) resetTimer();
        touchStartX.current = null;
    };

    return (
        <div className="relative mx-1">
            <div 
                onClick={() => navigate('/analytics')} 
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="bg-surface2/30 border border-white/5 rounded-2xl p-3 flex flex-col justify-center min-h-[60px] backdrop-blur-md cursor-pointer active:scale-[0.99] transition-transform group animate-zoom-in delay-75 overflow-hidden"
            >
                 <div className="flex items-center gap-3 relative z-10">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors duration-500 ${style.iconBg} ${style.iconColor} ${style.border}`}>
                         {currentItem.level === 'danger' || currentItem.level === 'warning' ? <Icons.Flame size={16} /> : <Icons.TrendUp size={16} />}
                     </div>
                     <div className="flex-1 min-w-0 pr-2">
                         <div className="text-[10px] font-bold uppercase text-secondary tracking-wider flex justify-between">
                             <span>{currentItem.title}</span>
                             {items.length > 1 && (
                                 <div className="flex gap-1">
                                     {items.map((_, i) => (
                                         <div 
                                            key={i} 
                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white scale-110' : 'bg-white/10'}`} 
                                         />
                                     ))}
                                 </div>
                             )}
                         </div>
                         <div className="text-xs font-bold text-white truncate animate-fade-in key={currentIndex}">
                             {currentItem.text}
                         </div>
                     </div>
                     <Icons.ChevronRight size={16} className="text-secondary/30 group-hover:text-white transition-colors" />
                 </div>
            </div>
        </div>
    );
};
