
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { SectionCard } from '../components/ui/SectionCard';
import { Modal } from '../components/ui/Modal';
import { Icons } from '../components/Icons';
import { FATIGUE_COLORS, TYPE_COLORS } from '../constants';
import { triggerHaptic, formatDuration, parseDuration } from '../utils';
import { PALETTE } from '../styles/tokens';

interface DashboardViewProps {
    onStartSession: (progName: string, sess: any, mode: 'active' | 'log') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onStartSession }) => {
    const navigate = useNavigate();
    const history = useStore(s => s.history);
    const programs = useStore(s => s.programs);
    const library = useStore(s => s.library);
    
    const [calDate, setCalDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showHistoryProgramPicker, setShowHistoryProgramPicker] = useState(false);
    
    const curMonth = calDate.getMonth();
    const curYear = calDate.getFullYear();
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const firstDay = new Date(curYear, curMonth, 1).getDay();
    const emptyDays = firstDay === 0 ? 6 : firstDay - 1;

    const getExerciseById = (id: number) => library.find(l => l.id === id);

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-black italic uppercase px-1">Tableau de Bord</h2>

        <SectionCard className="p-4">
          <div className="flex justify-between items-center mb-6 px-1">
            <button onClick={() => { triggerHaptic('click'); setCalDate(new Date(curYear, curMonth - 1)); }} className="p-2 bg-surface2 border border-border/50 rounded-lg text-secondary hover:text-white transition-colors"><Icons.ChevronLeft size={16} /></button>
            <h3 className="text-xs font-black uppercase tracking-widest">{calDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => { triggerHaptic('click'); setCalDate(new Date(curYear, curMonth + 1)); }} className="p-2 bg-surface2 border border-border/50 rounded-lg text-secondary hover:text-white transition-colors"><Icons.ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['L','M','M','J','V','S','D'].map(d => <div key={d} className="text-center text-[9px] font-bold text-secondary/40 mb-2">{d}</div>)}
            {Array.from({ length: emptyDays }).map((_, i) => <div key={i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const daySessions = history.filter(s => {
                const d = new Date(s.startTime);
                return d.getDate() === day && d.getMonth() === curMonth && d.getFullYear() === curYear;
              });
              const count = daySessions.length;
              const intensity = count > 0 ? Math.min(100, daySessions.reduce((acc, s) => acc + s.exercises.length, 0) * 10) : 0;
              
              const typesInDay = new Set<string>();
              daySessions.forEach(s => s.exercises.forEach(e => {
                  if (e.sets.some(st => st.done)) {
                      const lib = getExerciseById(e.exerciseId);
                      if (lib) typesInDay.add(lib.type);
                  }
              }));
              const typeDots = Array.from(typesInDay);
              const lastSession = daySessions[daySessions.length - 1];
              const fatigueScore = lastSession ? lastSession.fatigue : null;

              return (
                <button key={i} onClick={() => { triggerHaptic('click'); setSelectedDate(new Date(curYear, curMonth, day)); }} className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-mono transition-all ${count > 0 ? 'border border-primary/20 shadow-lg' : 'text-secondary hover:bg-surface2'}`} style={count > 0 ? { backgroundColor: `rgba(var(--primary-rgb), ${intensity/100 * 0.4 + 0.1})`, borderColor: 'var(--primary)' } : {}}>
                  {fatigueScore && <div className="absolute top-1.5 left-1.5 w-1 h-3 rounded-full" style={{ backgroundColor: FATIGUE_COLORS[fatigueScore] }} />}
                  <span className={count > 0 ? 'text-white font-bold' : ''}>{day}</span>
                  {count > 0 && (
                      <div className="flex gap-1 mt-1">
                          {typeDots.map(t => (
                              <div key={t} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[t as keyof typeof TYPE_COLORS] }} />
                          ))}
                      </div>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>
        
        <div className="space-y-3">
            <button 
                onClick={() => { triggerHaptic('click'); navigate('/programs'); }} 
                className="w-full py-4 bg-primary text-background rounded-[2rem] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all border-2 border-white/10 group font-black uppercase tracking-tighter text-xl"
            >
                <div className="w-8 h-8 group-hover:scale-110 transition-transform"><Icons.Dumbbell /></div>
                <span>Démarrer</span>
            </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => { triggerHaptic('click'); navigate('/records'); }} className="bg-surface border border-border p-6 rounded-[2rem] flex flex-col items-center gap-2 active:scale-95 transition-all">
            <span className="text-gold"><Icons.Records /></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Records</span>
          </button>
          <button onClick={() => { triggerHaptic('click'); navigate('/analytics'); }} className="bg-surface border border-border p-6 rounded-[2rem] flex flex-col items-center gap-2 active:scale-95 transition-all">
            <span className="text-success"><Icons.TrendUp /></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Progrès</span>
          </button>
          <div className="col-span-2 grid grid-cols-3 gap-4">
               <button onClick={() => { triggerHaptic('click'); navigate('/tools/1rm'); }} className="bg-surface border border-border p-4 rounded-[1.5rem] flex flex-col items-center gap-2 active:scale-95 transition-all">
                 <span className="text-cyan1rm font-black text-lg">1RM</span>
                 <span className="text-[9px] font-bold uppercase tracking-widest text-secondary">Max</span>
               </button>
               <button onClick={() => { triggerHaptic('click'); navigate('/tools/converter'); }} className="bg-surface border border-border p-4 rounded-[1.5rem] flex flex-col items-center gap-2 active:scale-95 transition-all">
                 <span className="text-purpleEquip text-lg"><Icons.Exchange size={24} /></span>
                 <span className="text-[9px] font-bold uppercase tracking-widest text-secondary">Conv.</span>
               </button>
               <button onClick={() => { triggerHaptic('click'); navigate('/tools/plate'); }} className="bg-surface border border-border p-4 rounded-[1.5rem] flex flex-col items-center gap-2 active:scale-95 transition-all">
                 <span className="text-lg" style={{ color: PALETTE.accents.blue.primary }}><Icons.Disc /></span>
                 <span className="text-[9px] font-bold uppercase tracking-widest text-secondary">Disques</span>
               </button>
          </div>
        </div>

        {/* DATE MODAL */}
        {selectedDate && (
          <Modal title={showHistoryProgramPicker ? (selectedDate.setHours(0,0,0,0) < new Date().setHours(0,0,0,0) ? "Saisir : Choisir Modèle" : "Ajouter : Choisir Modèle") : selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} onClose={() => { setSelectedDate(null); setShowHistoryProgramPicker(false); }}>
              {!showHistoryProgramPicker ? (
                  <div className="space-y-4">
                      {history.filter(s => {
                          const d = new Date(s.startTime);
                          return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                      }).map(s => {
                          const startTime = new Date(s.startTime);
                          const endTime = s.endTime ? new Date(s.endTime) : null;
                          const duration = s.endTime ? Math.floor((s.endTime - s.startTime) / 60000) : null;
                          return (
                          <div key={s.id} className="bg-surface2/30 p-4 rounded-2xl border border-border/50">
                              <div className="flex justify-between items-start mb-4 border-b border-border/30 pb-2">
                                 <div>
                                    <h4 className="font-bold">{s.sessionName}</h4>
                                    <div className="text-[10px] text-secondary">{s.programName} • Forme {s.fatigue}/5</div>
                                 </div>
                                 <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setSelectedDate(null); navigate(`/history/edit/${s.id}`); }} className="p-1.5 bg-surface2 hover:bg-primary/20 text-secondary hover:text-primary rounded-lg transition-colors"><Icons.Settings /></button>
                                    </div>
                                    <div className="text-[10px] font-mono text-secondary">
                                        {startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} {endTime && ` - ${endTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
                                    </div>
                                    {duration && <div className="text-[10px] font-black uppercase text-primary mt-1">{Math.floor(duration/60)}h{String(duration%60).padStart(2, '0')}</div>}
                                 </div>
                              </div>
                              <div className="space-y-3">
                                  {s.exercises.map(ex => {
                                      const doneSets = ex.sets.filter(st => st.done);
                                      if (doneSets.length === 0) return null;
                                      const libEx = getExerciseById(ex.exerciseId);
                                      const isCardio = libEx?.type === 'Cardio';
                                      const isStatic = libEx?.type === 'Isométrique' || libEx?.type === 'Étirement';
                                      const weightStr = doneSets.map(st => (st.isWarmup ? 'W' : '') + st.weight).join(',');
                                      const repStr = doneSets.map(st => (st.isWarmup ? 'W' : '') + (isStatic ? formatDuration(parseDuration(st.reps)) : st.reps)).join(',');
                                      const rirStr = doneSets.map(st => isCardio ? formatDuration(st.rir || '0') : (st.rir || '-')).join(',');
                                      return (
                                          <div key={ex.exerciseId} className="text-xs">
                                              <div className="font-bold text-white mb-0.5">{libEx?.name || `Exo #${ex.exerciseId}`}</div>
                                              <div className="font-mono text-secondary text-[11px] mb-1">{weightStr} {isCardio ? "Lvl" : "kg"} x {repStr} {isCardio ? "m" : isStatic ? "s" : "reps"} | {isCardio ? "" : "RIR "}{rirStr}</div>
                                          </div>
                                      )
                                  })}
                              </div>
                          </div>
                          );
                      })}
                      
                      {history.filter(s => {
                          const d = new Date(s.startTime);
                          return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                      }).length === 0 && <div className="text-center text-secondary/50 italic py-4">Aucune séance ce jour-là</div>}

                      <button onClick={() => setShowHistoryProgramPicker(true)} className="w-full py-4 bg-primary text-background font-black uppercase rounded-[2rem] shadow-xl active:scale-95 transition-all">
                          + Ajouter une séance
                      </button>
                  </div>
              ) : (
                  <div className="space-y-4">
                      <button onClick={() => { setShowHistoryProgramPicker(false); }} className="text-xs font-bold uppercase text-secondary mb-2">← Retour</button>
                      <div className="space-y-4">
                         {programs.map(prog => (
                             <div key={prog.id} className="space-y-2">
                                 <h4 className="font-black italic text-sm text-primary uppercase">{prog.name}</h4>
                                 {prog.sessions.map(sess => (
                                     <button key={sess.id} onClick={() => { 
                                         let start = new Date(selectedDate);
                                         const now = new Date();
                                         const isToday = start.getDate() === now.getDate() && start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
                                         const isPast = start.setHours(0,0,0,0) < now.setHours(0,0,0,0);
                                         
                                         let mode: 'active' | 'log' = 'active';

                                         if (isToday) {
                                             start = now; 
                                             mode = 'active';
                                         } else if (isPast) {
                                             start.setHours(8, 0, 0, 0); 
                                             mode = 'log'; 
                                         } else {
                                             start.setHours(8, 0, 0, 0);
                                             mode = 'active'; 
                                         }

                                         onStartSession(prog.name, { ...sess, startTime: start.getTime() }, mode);
                                         setShowHistoryProgramPicker(false);
                                         setSelectedDate(null);
                                     }} className="w-full text-left bg-surface2/30 hover:bg-surface2 p-3 rounded-xl border border-transparent hover:border-primary/30 transition-all flex justify-between items-center group">
                                         <span className="font-bold text-sm">{sess.name}</span>
                                         <span className="text-xs text-secondary group-hover:text-primary transition-colors">Choisir →</span>
                                     </button>
                                 ))}
                             </div>
                         ))}
                      </div>
                  </div>
              )}
          </Modal>
        )}
      </div>
    );
};
