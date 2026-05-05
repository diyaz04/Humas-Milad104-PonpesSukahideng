import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Lock, LogOut, Mail, Key, LayoutDashboard, Calendar, Trophy, ShoppingBag, Heart, Users, Settings, UserCheck } from 'lucide-react';
import { User } from 'firebase/auth';
import { auth, signInWithEmailAndPassword } from '../../lib/firebase';
import { Setting, News, ScheduleItem, Koorwil, Sport, Registration, Match, FAQ, AdminType, DocumentResource } from '../../types';

import MiladPanel from './MiladPanel';
import JadwalPanel from './JadwalPanel';
import PorsasPanel from './PorsasPanel';
import MerchandisePanel from './MerchandisePanel';
import DonationPanel from './DonationPanel';
import RegistrationPanel from './RegistrationPanel';
import CheckInPanel from './CheckInPanel';

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
  documents: DocumentResource[];
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
  matches,
  documents
}: AdminDashboardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Exclude<AdminType, 'super' | null>>(
    type === 'super' ? 'milad' : (type || 'milad')
  );
  
  const getTitle = () => {
    if (type === 'super') return 'Super Admin Panel';
    switch (type) {
      case 'milad': return 'Admin Konten Landing Page';
      case 'jadwal': return 'Kelola Agenda & Jadwal';
      case 'porsas': return 'Manajemen PORSAS';
      case 'pesanan': return 'Manajemen Pesanan Merchandise';
      case 'donasi': return 'Manajemen Wakaf & Donasi';
      case 'registrasi': return 'Manajemen Alumni & Check-In';
      case 'heregistrasi': return 'Sistem Heregistrasi Peserta';
      default: return 'Admin Panel';
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Email atau password salah.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isAuthRequired = type === 'super' || type === 'pesanan' || type === 'donasi' || type === 'registrasi';

  const tabs = [
    { id: 'milad', label: 'Konten', icon: LayoutDashboard },
    { id: 'jadwal', label: 'Agenda', icon: Calendar },
    { id: 'porsas', label: 'PORSAS', icon: Trophy },
    { id: 'pesanan', label: 'Pesanan', icon: ShoppingBag },
    { id: 'donasi', label: 'Donasi', icon: Heart },
    { id: 'registrasi', label: 'Alumni', icon: Users },
    { id: 'heregistrasi', label: 'Check-In', icon: UserCheck },
  ];

  const currentTab = type === 'super' ? activeTab : type;

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
            {type === 'super' ? <Settings size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-brand-gold">{getTitle()}</h2>
            <p className="text-[10px] uppercase tracking-widest text-brand-gold/50 font-bold">Admin Panel Access</p>
          </div>
        </div>
        
        {type === 'super' && (
          <div className="hidden lg:flex items-center gap-2 bg-brand-forest/20 p-1 rounded-xl border border-brand-gold/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-brand-gold text-brand-dark' : 'text-brand-gold/60 hover:text-brand-gold'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-6">
          {user && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <LogOut size={16} /> Logout
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 text-brand-gold/50 hover:text-brand-gold transition-all"
          >
            <X size={28} />
          </button>
        </div>
      </div>

      {type === 'super' && (
        <div className="lg:hidden bg-brand-dark/95 px-8 py-2 overflow-x-auto border-b border-brand-gold/10 flex gap-4 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-gold/40'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-grow p-4 md:p-8 overflow-y-auto bg-slate-50">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            {(!isAuthRequired || (user && auth.currentUser)) ? (
              <>
                {currentTab === 'milad' && <MiladPanel settings={settings} news={news} faqs={faqs} documents={documents} />}
                {currentTab === 'jadwal' && <JadwalPanel schedule={schedule} />}
                {currentTab === 'porsas' && <PorsasPanel koorwils={koorwils} sports={sports} registrations={registrations} matches={matches} />}
                {currentTab === 'pesanan' && <MerchandisePanel user={user} />}
                {currentTab === 'donasi' && <DonationPanel />}
                {currentTab === 'registrasi' && <RegistrationPanel />}
                {currentTab === 'heregistrasi' && <CheckInPanel />}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-20 h-20 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mb-6">
                  <Lock size={40} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-brand-dark mb-2">Autentikasi Diperlukan</h3>
                <p className="text-slate-500 mb-8 max-w-sm">
                  {type === 'super' ? 'Super Admin Panel memerlukan login administrator untuk akses penuh.' : 'Bagian ini memerlukan login untuk alasan keamanan.'}
                </p>

                <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200 border border-slate-100">
                  <form onSubmit={handleEmailLogin} className="space-y-4 mb-8">
                    <div className="text-left">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-brand-gold transition-all"
                          placeholder="admin@sukahideng.com"
                        />
                      </div>
                    </div>
                    <div className="text-left">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Password</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-brand-gold transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-dark text-brand-gold py-4 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-brand-dark/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {loading ? 'Logging in...' : 'Login Ke Panel'}
                    </button>
                  </form>

                  <div className="relative flex items-center justify-center mb-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <span className="relative bg-white px-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Atau</span>
                  </div>

                  <button 
                    onClick={onLogin}
                    className="w-full border-2 border-slate-100 text-slate-600 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                    Login dengan Google
                  </button>
                </div>
              </div>
            )}
          </motion.div>
      </div>
    </motion.div>
  );
}

