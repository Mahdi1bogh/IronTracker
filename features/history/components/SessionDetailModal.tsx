
import React, { useMemo } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { WorkoutSession } from '../../../core/types';
import { Icons } from '../../../components/icons/Icons';
import { useStore } from '../../../store/useStore';
import { calculate1RM, parseDuration, formatDuration } from '../../../core/utils';
import { FATIGUE_COLORS } from '../../../core/constants';

interface SessionDetailModalProps {
    session: WorkoutSession;
    onClose: () => void;
    onEdit: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, onClose, onEdit }) => {
    const library = useStore(s => s.library);

    // Formattage des dates et heures
    const dateTimeInfo = useMemo(() => {
        const start = new Date(session.startTime);
        const dateStr = start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'h');
        
        const startTimeStr = formatTime(session.startTime);
        // Si pas de fin, on estime la fin ou on met ??
        const endTimeStr = session.endTime ? formatTime(session.endTime) : '??';
        
        return { dateStr, timeRange: `${startTimeStr} - ${endTimeStr}` };
    }, [session]);

    // Stats globales du ticket
    const stats = useMemo(() => {
        const duration = session.endTime ? Math.floor((session.endTime - session.startTime) / 60000) : 0;
        const totalSets = session.exercises.reduce((acc, e) => acc + e.sets.filter(s => s.done && !s.isWarmup).length, 0);
        const totalVolume = session.exercises.reduce((acc, e) => {
            const lib = library.find(l => l.id === e.exerciseId);
            if (lib?.type === 'Cardio' || lib?.type === 'Statique') return acc;
            return acc + e.sets.filter(s => s.done && !s.isWarmup).reduce((a, s) => a + (parseFloat(s.weight)||0) * (parseFloat(s.reps)||0), 0);
        }, 0);
        return { duration, totalSets, totalVolume };
    }, [session, library]);

    return (
        <Modal title="Ticket Séance" onClose={onClose}>
            <div className="flex flex-col animate-fade-in">
                {/* RECEIPT CONTAINER */}
                <div className="bg-surface rounded-none sm:rounded-xl p-4 font-mono text-xs text-secondary/80 leading-relaxed border-t-4 border-primary/50 relative overflow-hidden">
                    
                    {/* Background Texture Effect */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>

                    {/* HEADER TICKET */}
                    <div className="text-center pb-4 border-b border-dashed border-white/20 mb-4 space-y-2">
                        <div className="uppercase tracking-[0.2em] text-[10px] text-secondary/50">IronTracker System Log</div>
                        <div className="text-xl font-bold text-white uppercase break-words">{session.sessionName}</div>
                        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[10px] font-medium">
                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-white">{session.programName}</span>
                            <span className="opacity-50 text-[8px]">•</span>
                            <span>{dateTimeInfo.dateStr}</span>
                            <span className="opacity-50 text-[8px]">•</span>
                            <span>{dateTimeInfo.timeRange}</span>
                        </div>
                    </div>

                    {/* KEY METRICS ROW */}
                    <div className="grid grid-cols-4 gap-2 text-center pb-4 border-b border-dashed border-white/20 mb-4">
                        <div>
                            <div className="text-[9px] uppercase opacity-50">Durée</div>
                            <div className="font-bold text-white">{stats.duration}m</div>
                        </div>
                        <div>
                            <div className="text-[9px] uppercase opacity-50">Sets</div>
                            <div className="font-bold text-white">{stats.totalSets}</div>
                        </div>
                        <div>
                            <div className="text-[9px] uppercase opacity-50">Vol.</div>
                            <div className="font-bold text-white">{(stats.totalVolume/1000).toFixed(1)}k</div>
                        </div>
                        <div>
                            <div className="text-[9px] uppercase opacity-50">RPE</div>
                            <div className="font-bold" style={{color: FATIGUE_COLORS[session.fatigue]}}>{session.fatigue}/5</div>
                        </div>
                    </div>

                    {/* EXERCISES LIST */}
                    <div className="space-y-6">
                        {session.exercises.map((ex, i) => {
                            const lib = library.find(l => l.id === ex.exerciseId);
                            const isCardio = lib?.type === 'Cardio';
                            const isStatic = lib?.type === 'Statique' || lib?.type === 'Étirement';

                            return (
                                <div key={i} className="space-y-1">
                                    {/* Exo Header */}
                                    <div className="flex justify-between items-baseline text-white">
                                        <div className="font-bold uppercase truncate pr-4 max-w-[80%]">
                                            {i + 1}. {lib?.name || `ID ${ex.exerciseId}`}
                                        </div>
                                        <div className="text-[9px] opacity-50">{lib?.muscle.substring(0,3).toUpperCase()}</div>
                                    </div>

                                    {/* Exo Sets */}
                                    <div className="pl-4 border-l border-white/10 space-y-0.5">
                                        {ex.sets.map((set, j) => {
                                            if (!set.done) return null;
                                            
                                            // Formatting logic based on type
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
                                                    subStr = `(1RM: ${e1rm})`;
                                                }
                                            }

                                            return (
                                                <div key={j} className={`flex justify-between items-center ${set.isWarmup ? 'opacity-40 italic' : ''}`}>
                                                    <div className="flex gap-2">
                                                        <span className="opacity-50 w-4 text-right">#{j+1}</span>
                                                        <span>{perfStr}</span>
                                                    </div>
                                                    <div className="text-[9px] opacity-50 flex gap-2">
                                                        {set.isWarmup && <span>WARMUP</span>}
                                                        <span>{subStr}</span>
                                                        {set.rir && !isCardio && <span>@{set.rir}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Exo Notes (Block dédié plus visible) */}
                                        {ex.notes && ex.notes.trim().length > 0 && (
                                            <div className="pt-2 pb-1">
                                                <div className="flex gap-2 items-start text-[10px] text-secondary/80 italic bg-white/5 p-2 rounded border border-white/5">
                                                    <Icons.Note size={12} className="flex-shrink-0 mt-0.5 opacity-70" />
                                                    <span className="break-words leading-tight">{ex.notes}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* FOOTER */}
                    <div className="mt-8 pt-4 border-t-2 border-dashed border-white/20 text-center space-y-4">
                        <div className="text-[10px] uppercase opacity-40">*** END OF REPORT ***</div>
                        
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={onClose} 
                                className="flex-1 py-3 rounded-xl bg-surface2 hover:bg-surface2/80 text-white font-sans font-bold uppercase text-xs transition-colors"
                            >
                                Fermer
                            </button>
                            <button 
                                onClick={onEdit} 
                                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-primary font-sans font-bold uppercase text-xs border border-primary/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <Icons.Edit size={14} /> Modifier
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
