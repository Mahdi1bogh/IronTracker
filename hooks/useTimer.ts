
import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { triggerHaptic } from '../core/utils';
import { STORAGE_KEYS } from '../core/constants';

// --- INLINE WORKER CODE ---
// Defines the worker script as a string to avoid external file loading issues (404s, paths)
const WORKER_SCRIPT = `
let timerInterval = null;

self.onmessage = function(e) {
    const { type, payload } = e.data;

    if (type === 'START') {
        if (timerInterval) clearInterval(timerInterval);
        
        const target = payload.targetTime;
        
        // Immediate check
        const now = Date.now();
        const diff = Math.ceil((target - now) / 1000);
        self.postMessage({ type: 'TICK', val: diff });

        // Start loop
        timerInterval = setInterval(() => {
            const current = Date.now();
            const left = Math.ceil((target - current) / 1000);
            
            if (left <= 0) {
                self.postMessage({ type: 'DONE' });
                clearInterval(timerInterval);
                timerInterval = null;
            } else {
                self.postMessage({ type: 'TICK', val: left });
            }
        }, 1000);
    } 
    else if (type === 'STOP') {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
};
`;

export const useTimer = () => {
    const session = useStore(s => s.session);
    const restTarget = useStore(s => s.restTarget);
    const setRestTarget = useStore(s => s.setRestTarget);

    const [elapsed, setElapsed] = useState(0);
    const [restTime, setRestTime] = useState<number | null>(null);
    const [showGo, setShowGo] = useState(false);
    
    // --- TIMER ENGINE (WORKER) ---
    useEffect(() => {
        // 1. Create Worker from String (Blob)
        // This guarantees the worker code is loaded regardless of server config or paths.
        const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        // 2. Handler Logic
        const handleComplete = () => {
            setRestTime(0);
            setShowGo(true);
            triggerHaptic('warning');
            
            // System Notification
            const isNotifEnabled = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) !== 'false';
            if (isNotifEnabled && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    // Force close previous to avoid stacking
                    // Note: 'tag' option handles replacement automatically on Android
                    new Notification('Repos Terminé !', {
                        body: 'Il est temps de repartir.',
                        icon: '/icon.svg',
                        vibrate: [200, 100, 200],
                        tag: 'iron-timer',
                        renotify: true
                    } as any);
                } catch (e) {
                    console.debug('Notification error', e);
                }
            }

            // Auto-hide "GO"
            setTimeout(() => {
                setShowGo(false);
                setRestTarget((prev) => {
                   if (prev && prev <= Date.now()) return null;
                   return prev;
                });
            }, 4000);
        };

        // 3. Message Listener
        worker.onmessage = (e) => {
            const { type, val } = e.data;
            if (type === 'TICK') {
                // Only update state if value actually changed to avoid excessive renders (though React batches)
                setRestTime(val); 
            } 
            else if (type === 'DONE') {
                handleComplete();
            }
        };

        // 4. Initial Command (Start/Stop)
        if (restTarget) {
            const now = Date.now();
            const diff = Math.ceil((restTarget - now) / 1000);
            
            if (diff > 0) {
                setRestTime(diff); // Immediate UI update
                worker.postMessage({ type: 'START', payload: { targetTime: restTarget } });
            } else {
                handleComplete(); // Target is already past
            }
        } else {
            setRestTime(null);
            worker.postMessage({ type: 'STOP' });
        }

        // 5. Cleanup
        return () => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };
    }, [restTarget, setRestTarget]); // Re-run whenever target changes

    // --- PERMISSIONS ---
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // --- SESSION DURATION (Main Thread - Low Priority) ---
    useEffect(() => {
        let interval: number;
        if (session) {
            setElapsed(Math.floor((Date.now() - session.startTime) / 1000));
            interval = window.setInterval(() => {
                setElapsed(Math.floor((Date.now() - session.startTime) / 1000));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [session]);

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
