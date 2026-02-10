
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HistoryCalendar } from './components/HistoryCalendar';
import { HistoryNotes } from './components/HistoryNotes';
import { RecordsView } from './RecordsView';
import { Icons } from '../../components/icons/Icons';
import { triggerHaptic } from '../../core/utils';
import { ProgramSession } from '../../core/types';
import { useStore } from '../../store/useStore';
import { STORAGE_KEYS } from '../../core/constants';

interface HistoryHubViewProps {
    onStartSession: (progName: string, sess: ProgramSession, mode: 'active' | 'log') => void;
}

export const HistoryHubView: React.FC<HistoryHubViewProps> = ({ onStartSession }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const reindexDashboard = useStore(s => s.reindexDashboard);
    
    const initialTab = (searchParams.get('tab') as 'calendar' | 'records' | 'notes') || 'calendar';
    const [activeTab, setActiveTab] = useState<'calendar' | 'records' | 'notes'>(initialTab);

    // Sync tab state with URL without pushing to history stack on every click
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['calendar', 'records', 'notes'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    // Handle "Mark as Seen" for PRs when visiting Records tab
    useEffect(() => {
        if (activeTab === 'records') {
            localStorage.setItem(STORAGE_KEYS.LAST_SEEN_PR, Date.now().toString());
            // Trigger a re-calculation of dashboard stats (to remove the Notification Dot)
            reindexDashboard();
        }
    }, [activeTab, reindexDashboard]);

    const handleTabChange = (tab: 'calendar' | 'records' | 'notes') => {
        triggerHaptic('click');
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-zoom-in pt-2">
            
            {/* HUB HEADER & TABS */}
            <div className="flex flex-col gap-4 mb-4 flex-shrink-0">
                <div className="flex justify-between items-center px-1">
                     <h2 className="text-2xl font-bold uppercase text-neutral-800">
                        {activeTab === 'calendar' ? 'Journal' : activeTab === 'records' ? 'Records' : 'Carnet'}
                     </h2>
                     <div className="bg-surface p-1 rounded-lg border border-border flex gap-1">
                         <button 
                            onClick={() => handleTabChange('calendar')}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeTab === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-primary'}`}
                         >
                             <Icons.Calendar size={20} />
                         </button>
                         <button 
                            onClick={() => handleTabChange('records')}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeTab === 'records' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-primary'}`}
                         >
                             <Icons.Records size={20} />
                         </button>
                         <button 
                            onClick={() => handleTabChange('notes')}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeTab === 'notes' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-primary'}`}
                         >
                             <Icons.Note size={20} />
                         </button>
                     </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 min-h-0 relative">
                {activeTab === 'calendar' && <HistoryCalendar onStartSession={onStartSession} />}
                {activeTab === 'records' && <RecordsView />}
                {activeTab === 'notes' && <HistoryNotes />}
            </div>
        </div>
    );
};
