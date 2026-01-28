
import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { triggerHaptic } from '../utils';

export const useTimer = () => {
    const session = useStore(s => s.session);
    const restTarget = useStore(s => s.restTarget);
    const setRestTarget = useStore(s => s.setRestTarget);

    const [elapsed, setElapsed] = useState(0);
    const [restTime, setRestTime] = useState<number | null>(null);
    const [showGo, setShowGo] = useState(false);

    // Workout Duration Timer
    useEffect(() => {
        let interval: number;
        if (session) {
            // Update immediately to avoid 1s delay on render
            setElapsed(Math.floor((Date.now() - session.startTime) / 1000));
            interval = window.setInterval(() => {
                setElapsed(Math.floor((Date.now() - session.startTime) / 1000));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [session]);

    // Rest Countdown Timer
    useEffect(() => {
        if (!restTarget) {
            if (restTime !== null) setRestTime(null);
            return;
        }
        
        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.ceil((restTarget - now) / 1000);
            
            if (diff <= 0) {
                if (!showGo) {
                    setRestTime(0);
                    setShowGo(true);
                    triggerHaptic('warning');
                    // Auto-hide "GO" after 4s
                    setTimeout(() => {
                        setShowGo(false);
                        setRestTarget(null);
                    }, 4000);
                }
            } else {
                setRestTime(diff);
            }
        };

        updateTimer(); // Run immediately
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [restTarget, showGo, setRestTarget]);

    const timerString = useMemo(() => {
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, [elapsed]);

    return {
        timerString,
        restTarget,
        setRestTarget,
        restTime,
        showGo
    };
};
