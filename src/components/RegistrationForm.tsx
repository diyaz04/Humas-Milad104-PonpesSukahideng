import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Koorwil, Sport } from '../types';

interface RegistrationFormProps {
  koorwils: Koorwil[];
  sports: Sport[];
}

export default function RegistrationForm({ koorwils, sports }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    teamName: '',
    koorwil: '',
    sport: '',
    members: '',
    contact: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamName || !formData.koorwil || !formData.sport || !formData.members || !formData.contact) return;

    setStatus('loading');
    try {
      await addDoc(collection(db, 'registrations'), {
        ...formData,
        timestamp: new Date().toISOString()
      });
      setStatus('success');
      setFormData({ teamName: '', koorwil: '', sport: '', members: '', contact: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-brand-forest/50 backdrop-blur-xl border border-brand-gold/10 rounded-[40px] p-8 md:p-16 shadow-2xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-dark">
              <Send size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-brand-cream uppercase tracking-wider">Pendaftaran Tim</h2>
              <p className="text-brand-gold/60 text-sm italic">Pastikan data yang diinput sudah benar</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold/70 font-bold mb-2 ml-1">Nama Tim / Kabilah</label>
                <input 
                  type="text" 
                  value={formData.teamName}
                  onChange={e => setFormData({ ...formData, teamName: e.target.value })}
                  placeholder="Contoh: El-Aziz FC"
                  className="w-full bg-brand-dark/50 border border-brand-gold/20 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold/70 font-bold mb-2 ml-1">Asal Koorwil</label>
                <select 
                  value={formData.koorwil}
                  onChange={e => setFormData({ ...formData, koorwil: e.target.value })}
                  className="w-full bg-brand-dark/50 border border-brand-gold/20 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all appearance-none"
                  required
                >
                  <option value="" disabled>Pilih Wilayah</option>
                  {koorwils.map(k => (
                    <option key={k.id} value={k.name} className="bg-brand-dark">{k.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold/70 font-bold mb-2 ml-1">Cabang Olahraga</label>
                <select 
                  value={formData.sport}
                  onChange={e => setFormData({ ...formData, sport: e.target.value })}
                  className="w-full bg-brand-dark/50 border border-brand-gold/20 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all appearance-none"
                  required
                >
                  <option value="" disabled>Pilih Cabang</option>
                  {sports.map(s => (
                    <option key={s.id} value={s.name} className="bg-brand-dark">{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold/70 font-bold mb-2 ml-1">Kontak PIC (WA)</label>
                <input 
                  type="text" 
                  value={formData.contact}
                  onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="0812xxxx"
                  className="w-full bg-brand-dark/50 border border-brand-gold/20 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-full flex flex-col">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold/70 font-bold mb-2 ml-1 md:h-[22px]">Daftar Nama Anggota</label>
                <textarea 
                  value={formData.members}
                  onChange={e => setFormData({ ...formData, members: e.target.value })}
                  placeholder="Tuliskan nama-nama anggota tim..."
                  className="flex-grow w-full bg-brand-dark/50 border border-brand-gold/20 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all resize-none min-h-[200px]"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 mt-6">
              <button 
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-brand-gold text-brand-dark py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-brand-lightgold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={20} />
                    Kirim Pendaftaran
                  </>
                )}
              </button>

              <AnimatePresence>
                {status === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 mt-4 text-green-400 justify-center font-medium"
                  >
                    <CheckCircle2 size={20} />
                    Pendaftaran berhasil dikirim!
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 mt-4 text-red-400 justify-center font-medium"
                  >
                    <AlertCircle size={20} />
                    Terjadi kesalahan. Silakan coba lagi.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
