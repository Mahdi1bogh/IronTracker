
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { AccentColor, BeforeInstallPromptEvent } from '../../core/types';
import { SectionCard } from '../../components/ui/SectionCard';
import { Icons } from '../../components/icons/Icons';
import { triggerHaptic, downloadFile, generateCSV } from '../../core/utils';
import { STORAGE_KEYS, THEMES } from '../../core/constants';
import { useConfirm } from '../../hooks/useConfirm';

interface SettingsViewProps {
    installPrompt: BeforeInstallPromptEvent | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    installPrompt
}) => {
    const navigate = useNavigate();
    const accentColor = useStore(s => s.accentColor);
    const setAccentColor = useStore(s => s.setAccentColor);
    const history = useStore(s => s.history);
    const library = useStore(s => s.library);
    const programs = useStore(s => s.programs);
    const setHistory = useStore(s => s.setHistory);
    const setLibrary = useStore(s => s.setLibrary);
    const setPrograms = useStore(s => s.setPrograms);
    const resetData = useStore(s => s.resetData);
    const confirm = useConfirm();

    // Local state for toggles to allow immediate UI update
    const [hapticTactile, setHapticTactile] = useState(localStorage.getItem(STORAGE_KEYS.HAPTIC_TACTILE) !== 'false');
    const [hapticSession, setHapticSession] = useState(localStorage.getItem(STORAGE_KEYS.HAPTIC_SESSION) !== 'false');
    const [notifEnabled, setNotifEnabled] = useState(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) !== 'false');

    const toggleNotif = () => {
        const newVal = !notifEnabled;
        setNotifEnabled(newVal);
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, String(newVal));
        triggerHaptic('click');
        
        // Request permission if enabling
        if (newVal && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    };

    return (
      <div className="space-y-6 animate-fade-in pb-20">
          <h2 className="text-2xl font-black italic uppercase px-1">Configuration</h2>
          
          <SectionCard className="p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Apparence</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 px-2 no-scrollbar -mx-2 p-4">
                  {Object.entries(THEMES).map(([key, val]) => (
                      <button 
                         key={key} 
                         onClick={() => { triggerHaptic('tick'); setAccentColor(key as AccentColor); }} 
                         className={`w-10 h-10 min-w-[2.5rem] rounded-full border-2 flex items-center justify-center transition-all ${accentColor === key ? 'border-white scale-110' : 'border-transparent'}`}
                         style={{ backgroundColor: val.primary }}
                      >
                          {accentColor === key && <span className="text-black bg-white/50 rounded-full w-4 h-4" />}
                      </button>
                  ))}
              </div>
          </SectionCard>

          <SectionCard className="p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Feedback & Alertes</h3>
              <div className="space-y-3">
                  <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">Vibrations Tactiles</span>
                      <button onClick={() => { 
                          const newVal = !hapticTactile; 
                          setHapticTactile(newVal); 
                          localStorage.setItem(STORAGE_KEYS.HAPTIC_TACTILE, String(newVal)); 
                          triggerHaptic('click'); 
                      }} className={`w-12 h-6 rounded-full transition-colors relative ${hapticTactile ? 'bg-primary' : 'bg-surface2'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hapticTactile ? 'left-7' : 'left-1'}`} />
                      </button>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">Vibrations Séance</span>
                      <button onClick={() => { 
                          const newVal = !hapticSession; 
                          setHapticSession(newVal); 
                          localStorage.setItem(STORAGE_KEYS.HAPTIC_SESSION, String(newVal));
                          triggerHaptic('click'); 
                      }} className={`w-12 h-6 rounded-full transition-colors relative ${hapticSession ? 'bg-primary' : 'bg-surface2'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hapticSession ? 'left-7' : 'left-1'}`} />
                      </button>
                  </div>
                  <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                          <span className="font-bold text-sm">Notifications Système</span>
                          <span className="text-[10px] text-secondary">Pour le chrono en arrière-plan</span>
                      </div>
                      <button onClick={toggleNotif} className={`w-12 h-6 rounded-full transition-colors relative ${notifEnabled ? 'bg-primary' : 'bg-surface2'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                  </div>
              </div>
          </SectionCard>

          <SectionCard className="p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Données</h3>
              <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => {
                      triggerHaptic('success');
                      const data = { history, library, programs };
                      const date = new Date().toISOString().split('T')[0];
                      downloadFile(JSON.stringify(data), `irontracker_backup_${date}.json`);
                  }} className="bg-surface2 p-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-surface2/80 transition-colors">
                      <Icons.Download /> Sauvegarder
                  </button>
                  <label className="bg-surface2 p-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-surface2/80 transition-colors cursor-pointer">
                      <Icons.Upload /> Restaurer
                      <input type="file" accept=".json" className="hidden" onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                              try {
                                  const parsed = JSON.parse(ev.target?.result as string);
                                  if (parsed.history) setHistory(parsed.history);
                                  if (parsed.library) setLibrary(parsed.library);
                                  if (parsed.programs) setPrograms(parsed.programs);
                                  triggerHaptic('success');
                                  alert("Données restaurées !");
                              } catch(err) {
                                  triggerHaptic('error');
                                  alert("Erreur fichier invalide");
                              }
                          };
                          reader.readAsText(file);
                      }} />
                  </label>
                  <button onClick={() => {
                      triggerHaptic('success');
                      const csv = generateCSV(history, library);
                      const date = new Date().toISOString().split('T')[0];
                      downloadFile(csv, `irontracker_export_${date}.csv`, 'text/csv');
                  }} className="col-span-2 bg-surface2 p-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-surface2/80 transition-colors">
                      <Icons.Table /> Exporter CSV (Excel)
                  </button>
              </div>
          </SectionCard>

          {installPrompt && (
              <button onClick={() => { installPrompt.prompt(); }} className="w-full py-4 bg-primary text-background font-black uppercase rounded-[2rem] shadow-xl active:scale-95 transition-all">
                  Installer l'application
              </button>
          )}

          <div className="pt-8">
              <button onClick={() => {
                  confirm({
                      title: "RÉINITIALISER TOUT ?",
                      message: "Voulez-vous vraiment tout effacer ?",
                      subMessage: "Historique, programmes et bibliothèque seront supprimés définitivement.",
                      variant: 'danger',
                      onConfirm: () => {
                          resetData();
                          // TimeBuffer pour laisser le temps à la modale de confirmation de se fermer
                          setTimeout(() => navigate('/'), 100);
                          triggerHaptic('success');
                      }
                  });
              }} className="w-full py-4 bg-danger/10 text-danger font-black uppercase rounded-[2rem] border border-danger/20 hover:bg-danger/20 transition-all">
                  Zone de Danger : Reset
              </button>
              <div className="text-center mt-4 flex flex-col items-center gap-1">
                  <div className="text-xs font-black italic text-white uppercase tracking-widest">IronTracker</div>
                  <div className="text-[10px] text-secondary font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                      v3.7.0 • Onyx Pulse
                  </div>
              </div>
          </div>
      </div>
    );
};
