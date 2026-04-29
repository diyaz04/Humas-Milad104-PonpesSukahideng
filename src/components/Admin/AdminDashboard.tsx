import React from 'react';
import { motion } from 'motion/react';
import { X, Lock, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';
import { Setting, News, ScheduleItem, Koorwil, Sport, Registration, Match, FAQ, AdminType } from '../../types';

import MiladPanel from './MiladPanel';
import JadwalPanel from './JadwalPanel';
import PorsasPanel from './PorsasPanel';

interface AdminDashboardProps {
  type: AdminType;
  onClose: () => void;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  user: User | null;
  settings: Setting | null;
  news: News[];
  faqs: FAQ[];
  schedule: ScheduleItem[];
  koorwils: Koorwil[];
  sports: Sport[];
  registrations: Registration[];
  matches: Match[];
}

export default function AdminDashboard({ 
  type, 
  onClose, 
  isAdmin, 
  onLogin, 
  onLogout, 
  user,
  settings,
  news,
  faqs,
  schedule,
  koorwils,
  sports,
  registrations,
  matches
}: AdminDashboardProps) {
  
  const getTitle = () => {
    switch (type) {
      case 'milad': return 'Admin Konten Landing Page';
      case 'jadwal': return 'Kelola Agenda & Jadwal';
      case 'porsas': return 'Manajemen PORSAS';
      default: return 'Admin Panel';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-brand-cream flex flex-col md:overflow-hidden"
    >
      <div className="bg-brand-dark px-8 py-4 flex justify-between items-center text-brand-cream border-b border-brand-gold/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-gold rounded-xl flex items-center justify-center text-brand-dark">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-brand-gold">{getTitle()}</h2>
            <p className="text-[10px] uppercase tracking-widest text-brand-gold/50 font-bold">Admin Panel Access</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="p-2 text-brand-gold/50 hover:text-brand-gold transition-all"
          >
            <X size={28} />
          </button>
        </div>
      </div>

      <div className="flex-grow p-8 overflow-y-auto bg-slate-50">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            {type === 'milad' && <MiladPanel settings={settings} news={news} faqs={faqs} />}
            {type === 'jadwal' && <JadwalPanel schedule={schedule} />}
            {type === 'porsas' && <PorsasPanel koorwils={koorwils} sports={sports} registrations={registrations} matches={matches} />}
          </motion.div>
      </div>
    </motion.div>
  );
}
