import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, CheckCircle2, AlertCircle, Bike, Music, Send } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export default function IndividualRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Gowes' as 'Gowes' | 'Karaoke Religi',
    participantType: 'alumni' as 'alumni' | 'santri' | 'umum',
    angkatan: '',
    phone: '',
    address: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || (formData.participantType === 'alumni' && !formData.angkatan)) {
      alert("Harap isi semua kolom yang diperlukan.");
      return;
    }

    setStatus('loading');
    try {
      await addDoc(collection(db, 'registrations'), {
        ...formData,
        type: 'individual',
        sportName: formData.category,
        members: `Nama: ${formData.name}, Status: ${formData.participantType}${formData.participantType === 'alumni' ? `, Angkatan: ${formData.angkatan}` : ''}, Alamat: ${formData.address}`,
        contact: formData.phone,
        timestamp: new Date().toISOString()
      });
      setStatus('success');
      setFormData({ name: '', category: formData.category, participantType: 'alumni', angkatan: '', phone: '', address: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
    }
  };

  return (
    <div id="daftar-individu" className="py-24 bg-brand-green relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-forest/30 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-gold text-brand-dark rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-6 shadow-lg shadow-brand-gold/20">
            <UserPlus size={14} /> Pendaftaran Individu
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-cream mb-6">Pendaftaran Bidang <span className="text-brand-lightgold shadow-sm">Umum & Seni</span></h2>
          <p className="text-brand-cream/80 max-w-2xl mx-auto leading-relaxed">
            Pendaftaran khusus untuk kegiatan dan lomba individu yang tidak melalui Korwil. Terbuka untuk seluruh alumni santri Sukahideng.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Info Side */}
          <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-6">
            <div className={`p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] border transition-all ${formData.category === 'Gowes' ? 'bg-brand-gold text-brand-dark border-brand-gold shadow-2xl shadow-brand-gold/40 scale-[1.02]' : 'bg-brand-forest/60 border-brand-gold/20 text-brand-cream hover:bg-brand-forest/80'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${formData.category === 'Gowes' ? 'bg-brand-dark text-brand-gold' : 'bg-brand-gold text-brand-dark shadow-lg shadow-brand-gold/20'}`}>
                  <Bike size={20} className="sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-xl font-bold uppercase tracking-wider leading-tight">Gowes Napak Tilas</h3>
                  <p className={`text-[8px] sm:text-xs ${formData.category === 'Gowes' ? 'text-brand-dark/70' : 'text-brand-lightgold font-medium'} italic mt-0.5 sm:mt-1`}>Silaturahmi</p>
                </div>
              </div>
              <p className={`text-[10px] sm:text-sm leading-relaxed mb-4 sm:mb-6 hidden sm:block ${formData.category === 'Gowes' ? 'text-brand-dark/90' : 'text-brand-cream/70'}`}>
                Kegiatan bersepeda bersama menyusuri jejak perjuangan para leluhur dan guru Sukahideng.
              </p>
              <button 
                onClick={() => setFormData({...formData, category: 'Gowes'})}
                className={`w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold uppercase tracking-widest text-[8px] sm:text-xs transition-all ${formData.category === 'Gowes' ? 'bg-brand-dark text-brand-gold' : 'bg-brand-gold/10 border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/20'}`}
              >
                {formData.category === 'Gowes' ? 'Terpilih ✅' : 'Pilih'}
              </button>
            </div>

            <div className={`p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] border transition-all ${formData.category === 'Karaoke Religi' ? 'bg-brand-gold text-brand-dark border-brand-gold shadow-2xl shadow-brand-gold/40 scale-[1.02]' : 'bg-brand-forest/60 border-brand-gold/20 text-brand-cream hover:bg-brand-forest/80'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${formData.category === 'Karaoke Religi' ? 'bg-brand-dark text-brand-gold' : 'bg-brand-gold text-brand-dark shadow-lg shadow-brand-gold/20'}`}>
                  <Music size={20} className="sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-xl font-bold uppercase tracking-wider leading-tight">Karaoke Religi</h3>
                  <p className={`text-[8px] sm:text-xs ${formData.category === 'Karaoke Religi' ? 'text-brand-dark/70' : 'text-brand-lightgold font-medium'} italic mt-0.5 sm:mt-1`}>Nada Islami</p>
                </div>
              </div>
              <p className={`text-[10px] sm:text-sm leading-relaxed mb-4 sm:mb-6 hidden sm:block ${formData.category === 'Karaoke Religi' ? 'text-brand-dark/90' : 'text-brand-cream/70'}`}>
                Tunjukkan bakat vokal terbaik dalam membawakan lagu-lagu bernuansa islami yang menginspirasi.
              </p>
              <button 
                onClick={() => setFormData({...formData, category: 'Karaoke Religi'})}
                className={`w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold uppercase tracking-widest text-[8px] sm:text-xs transition-all ${formData.category === 'Karaoke Religi' ? 'bg-brand-dark text-brand-gold' : 'bg-brand-gold/10 border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/20'}`}
              >
                {formData.category === 'Karaoke Religi' ? 'Terpilih ✅' : 'Pilih'}
              </button>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3">
            <div className="bg-brand-dark/60 backdrop-blur-2xl border border-brand-gold/20 rounded-[40px] p-8 md:p-12 shadow-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <UserPlus size={120} />
              </div>
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Fulan bin Fulan"
                      className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all placeholder:text-brand-cream/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">No. WhatsApp</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0812xxxx"
                      className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all font-mono placeholder:text-brand-cream/30"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">Status Pendaftar</label>
                    <select 
                      value={formData.participantType}
                      onChange={e => setFormData({ ...formData, participantType: e.target.value as any })}
                      className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="alumni" className="bg-brand-dark">Alumni</option>
                      <option value="santri" className="bg-brand-dark">Santri</option>
                      <option value="umum" className="bg-brand-dark">Umum (Masyarakat)</option>
                    </select>
                  </div>
                  <div>
                    {/* Placeholder for alignment */}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {formData.participantType === 'alumni' && (
                    <motion.div 
                      key="angkatan-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">Angkatan / Tahun Lulus</label>
                      <input 
                        type="text" 
                        value={formData.angkatan}
                        onChange={e => setFormData({ ...formData, angkatan: e.target.value })}
                        placeholder="Contoh: 2015"
                        className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all placeholder:text-brand-cream/30"
                        required
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">Kategori Pendaftaran</label>
                  <div className="w-full bg-brand-gold text-brand-dark rounded-2xl px-6 py-4 font-bold uppercase tracking-widest text-xs shadow-lg shadow-brand-gold/20">
                    {formData.category}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">Alamat Sekarang / Wilayah</label>
                  <textarea 
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Contoh: Singaparna, Tasikmalaya"
                    className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all resize-none h-32 placeholder:text-brand-cream/30"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-brand-lightgold hover:bg-brand-gold text-brand-dark py-5 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-brand-gold/30 active:scale-95"
                  >
                    {status === 'loading' ? (
                      <div className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={20} />
                        {formData.category === 'Gowes' ? 'Daftar Kegiatan' : `Daftar Lomba ${formData.category.split(' ')[0]}`}
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {status === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 mt-6 text-green-400 justify-center font-medium bg-green-400/10 py-3 rounded-xl border border-green-400/20"
                      >
                        <CheckCircle2 size={20} />
                        Pendaftaran berhasil! Sampai jumpa di lokasi.
                      </motion.div>
                    )}
                    {status === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 mt-6 text-red-400 justify-center font-medium bg-red-400/10 py-3 rounded-xl border border-red-400/20"
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
      </div>
    </div>
  );
}
