
import React, { useMemo, useRef, useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { WorkoutSession } from '../../../core/types';
import { Icons } from '../../../components/icons/Icons';
import { useStore } from '../../../store/useStore';
import { calculate1RM, parseDuration, formatDuration, triggerHaptic } from '../../../core/utils';
import { FATIGUE_COLORS } from '../../../core/constants';

// Déclaration pour la lib chargée via CDN
declare const html2canvas: any;

interface SessionDetailModalProps {
    session: WorkoutSession;
    onClose: () => void;
    onEdit: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, onClose, onEdit }) => {
    const library = useStore(s => s.library);
    const history = useStore(s => s.history);
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    // Formattage des dates et heures
    const dateTimeInfo = useMemo(() => {
        const start = new Date(session.startTime);
        const dateStr = start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'h');
        
        const startTimeStr = formatTime(session.startTime);
        const endTimeStr = session.endTime ? formatTime(session.endTime) : '??';
        
        return { dateStr, timeRange: `${startTimeStr} - ${endTimeStr}` };
    }, [session]);

    // Stats globales du ticket + Comparaison Moyenne
    const stats = useMemo(() => {
        const duration = session.endTime ? Math.floor((session.endTime - session.startTime) / 60000) : 0;
        const totalSets = session.exercises.reduce((acc, e) => acc + e.sets.filter(s => s.done && !s.isWarmup).length, 0);
        
        const calculateVolume = (sess: WorkoutSession) => sess.exercises.reduce((acc, e) => {
            const lib = library.find(l => l.id === e.exerciseId);
            if (lib?.type === 'Cardio' || lib?.type === 'Statique') return acc;
            return acc + e.sets.filter(s => s.done && !s.isWarmup).reduce((a, s) => a + (parseFloat(s.weight)||0) * (parseFloat(s.reps)||0), 0);
        }, 0);

        const currentVolume = calculateVolume(session);

        // Calcul de la moyenne sur les 5 dernières séances du même type
        const previousSessions = history
            .filter(h => h.programName === session.programName && h.sessionName === session.sessionName && h.id !== session.id)
            .sort((a,b) => b.startTime - a.startTime)
            .slice(0, 5);
        
        let avgVolume = 0;
        let intensityRatio = 100;

        if (previousSessions.length > 0) {
            const sumVol = previousSessions.reduce((acc, h) => acc + calculateVolume(h), 0);
            avgVolume = sumVol / previousSessions.length;
            intensityRatio = avgVolume > 0 ? Math.round((currentVolume / avgVolume) * 100) : 100;
        }

        return { duration, totalSets, totalVolume: currentVolume, intensityRatio, hasHistory: previousSessions.length > 0 };
    }, [session, library, history]);

    const handleShare = async () => {
        if (!receiptRef.current || isSharing) return;
        setIsSharing(true);
        triggerHaptic('click');

        try {
            // Petit délai pour laisser le temps au state UI de se mettre à jour si besoin
            await new Promise(r => setTimeout(r, 50));

            const canvas = await html2canvas(receiptRef.current, {
                scale: 3, // Haute résolution pour Retina
                backgroundColor: '#0f172a', // Match background
                useCORS: true,
                logging: false,
                windowWidth: 400 // Force width pour éviter layout shifts
            });

            canvas.toBlob(async (blob: Blob | null) => {
                if (!blob) {
                    setIsSharing(false);
                    return;
                }

                const file = new File([blob], `irontracker_${session.startTime}.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'IronTracker Session',
                            text: `Séance ${session.sessionName} terminée !`
                        });
                        triggerHaptic('success');
                    } catch (shareError) {
                        console.debug('Share cancelled or failed', shareError);
                    }
                } else {
                    // Fallback Download
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `irontracker_${session.startTime}.png`;
                    link.click();
                    triggerHaptic('success');
                }
                setIsSharing(false);
            }, 'image/png');

        } catch (error) {
            console.error('Capture failed', error);
            triggerHaptic('error');
            alert("Erreur lors de la génération de l'image.");
            setIsSharing(false);
        }
    };

    return (
        <Modal title="Ticket Séance" onClose={onClose}>
            <div className="flex flex-col animate-fade-in space-y-4">
                {/* RECEIPT CONTAINER (Ce qui sera capturé) */}
                <div ref={receiptRef} className="bg-surface rounded-none sm:rounded-3xl p-5 font-mono text-xs text-secondary/80 leading-relaxed border-t-4 border-primary/50 relative overflow-hidden shadow-2xl">
                    
                    {/* Background Texture Effect */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>

                    {/* HEADER TICKET */}
                    <div className="text-center pb-4 border-b border-dashed border-white/20 mb-4 space-y-2">
                        <div className="uppercase tracking-[0.2em] text-[8px] text-secondary/40 font-bold">IronTracker System Log</div>
                        <div className="text-xl font-black text-white uppercase break-words tracking-tight">{session.sessionName}</div>
                        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[10px] font-bold text-secondary">
                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{session.programName}</span>
                            <span>{dateTimeInfo.dateStr}</span>
                            <span className="opacity-50 text-[8px]">•</span>
                            <span>{dateTimeInfo.timeRange}</span>
                        </div>
                    </div>

                    {/* KEY METRICS ROW */}
                    <div className="grid grid-cols-4 gap-2 text-center pb-4 border-b border-dashed border-white/20 mb-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase opacity-50 mb-1">Durée</span>
                            <span className="font-bold text-white text-sm">{stats.duration}<span className="text-[10px] font-normal opacity-70">m</span></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase opacity-50 mb-1">Sets</span>
                            <span className="font-bold text-white text-sm">{stats.totalSets}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase opacity-50 mb-1">Vol.</span>
                            <span className="font-bold text-white text-sm">{(stats.totalVolume/1000).toFixed(1)}<span className="text-[10px] font-normal opacity-70">k</span></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase opacity-50 mb-1">RPE</span>
                            <span className="font-bold text-sm" style={{color: FATIGUE_COLORS[session.fatigue]}}>{session.fatigue}/5</span>
                        </div>
                    </div>

                    {/* INTENSITY BAR (Always Visible now) */}
                    <div className="pb-4 border-b border-dashed border-white/20 mb-4">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[8px] uppercase font-bold text-secondary">Intensité Relative</span>
                            {stats.hasHistory ? (
                                <span className={`text-[10px] font-bold ${stats.intensityRatio >= 100 ? 'text-success' : 'text-secondary'}`}>{stats.intensityRatio}% <span className="text-[8px] font-normal opacity-50">vs Moyenne</span></span>
                            ) : (
                                <span className="text-[10px] font-bold text-white/50 italic">Session de Référence</span>
                            )}
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                            <div 
                                className={`h-full ${!stats.hasHistory ? 'bg-white/20' : stats.intensityRatio >= 100 ? 'bg-gradient-to-r from-success/80 to-success' : 'bg-white/30'}`} 
                                style={{ width: `${Math.min(100, stats.intensityRatio)}%` }}
                            />
                            {stats.hasHistory && stats.intensityRatio > 100 && (
                                <div className="h-full bg-warning w-1 animate-pulse" style={{ width: `${Math.min(20, stats.intensityRatio - 100)}%` }} />
                            )}
                        </div>
                    </div>

                    {/* EXERCISES LIST */}
                    <div className="space-y-5">
                        {session.exercises.map((ex, i) => {
                            const lib = library.find(l => l.id === ex.exerciseId);
                            const isCardio = lib?.type === 'Cardio';
                            const isStatic = lib?.type === 'Statique' || lib?.type === 'Étirement';

                            return (
                                <div key={i} className="space-y-1">
                                    {/* Exo Header */}
                                    <div className="flex justify-between items-baseline text-white">
                                        <div className="font-bold uppercase truncate pr-4 max-w-[85%] text-[11px]">
                                            {i + 1}. {lib?.name || `ID ${ex.exerciseId}`}
                                        </div>
                                        <div className="text-[8px] font-bold opacity-40 bg-white/5 px-1.5 rounded">{lib?.muscle.substring(0,3).toUpperCase()}</div>
                                    </div>

                                    {/* Exo Sets */}
                                    <div className="pl-2 space-y-0.5">
                                        {ex.sets.map((set, j) => {
                                            if (!set.done) return null;
                                            
                                            // Formatting logic
                                            let perfStr = "";
                                            let subStr = "";

                                            if (isCardio) {
                                                perfStr = `Lvl ${set.weight} • ${set.reps}m`;
                                                if (set.rir && set.rir !== "0") subStr = `${formatDuration(parseDuration(set.rir))}`;
                                            } else if (isStatic) {
                                                perfStr = `+${set.weight}kg • ${formatDuration(parseDuration(set.reps))}`;
                                            } else {
                                                perfStr = `${set.weight}kg x ${set.reps}`;
                                                if (!set.isWarmup) {
                                                    const e1rm = calculate1RM(set.weight, set.reps);
                                                    subStr = `1RM:${e1rm}`;
                                                }
                                            }

                                            return (
                                                <div key={j} className={`flex justify-between items-center ${set.isWarmup ? 'opacity-40 italic' : ''}`}>
                                                    <div className="flex gap-2 items-center">
                                                        <span className="text-secondary/50 font-bold text-[10px]">#{j + 1}</span>
                                                        <span>{perfStr}</span>
                                                    </div>
                                                    <div className="text-[9px] opacity-50 flex gap-2 font-bold">
                                                        {set.isWarmup && <span>WARMUP</span>}
                                                        <span>{subStr}</span>
                                                        {set.rir && !isCardio && <span className="text-secondary">@{set.rir}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* SOCIAL FOOTER (Visible on Capture) */}
                    <div className="mt-8 pt-4 border-t border-dashed border-white/20 flex justify-between items-end">
                        <div className="text-[8px] uppercase tracking-widest text-secondary/50">
                            Generated by
                            <br/>
                            <span className="text-white font-black text-[10px]">IRONTRACKER</span>
                        </div>
                        <div className="text-[8px] text-secondary/30 font-mono">
                            #{session.id}
                        </div>
                    </div>
                </div>

                {/* ACTIONS (Compact) */}
                <div className="flex gap-2">
                    <button 
                        onClick={onClose} 
                        className="flex-1 h-11 rounded-xl bg-surface2 hover:bg-surface2/80 text-white font-sans font-bold uppercase text-[10px] transition-colors border border-transparent hover:border-white/10"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={onEdit} 
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface2 hover:bg-surface2/80 text-secondary hover:text-white transition-colors border border-transparent hover:border-white/10"
                    >
                        <Icons.Edit size={18} />
                    </button>
                    <button 
                        onClick={handleShare} 
                        disabled={isSharing}
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-gold text-black shadow-lg shadow-gold/20 active:scale-95 transition-all"
                    >
                        {isSharing ? (
                            <span className="animate-pulse text-[10px] font-black">...</span>
                        ) : (
                            <Icons.Upload size={18} strokeWidth={2} />
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
