import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, MapPin, Users, Check, X, Phone, User, Calendar, MessageSquare } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Basecamp, Koorwil } from '../types';

interface BasecampBookingProps {
  basecamps: Basecamp[];
  koorwils: Koorwil[];
}

export default function BasecampBooking({ basecamps, koorwils }: BasecampBookingProps) {
  const [selectedBasecamp, setSelectedBasecamp] = useState<Basecamp | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    koorwil: '',
    coordinatorName: '',
    contact: ''
  });

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBasecamp || !formData.koorwil || !formData.coordinatorName || !formData.contact) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'basecamps', selectedBasecamp.id), {
        isBooked: true,
        bookedBy: formData.koorwil,
        coordinatorName: formData.coordinatorName,
        bookedByContact: formData.contact,
        bookedAt: new Date().toISOString()
      });
      alert(`Berhasil booking ${selectedBasecamp.name}! Silakan hubungi panitia untuk konfirmasi lebih lanjut.`);
      setSelectedBasecamp(null);
      setFormData({ koorwil: '', coordinatorName: '', contact: '' });
    } catch (err: any) {
      alert("Gagal melakukan booking: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-brand-gold font-serif italic mb-4"
        >
          <Home size={20} />
          <span>Akomodasi Kontingen</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-6">Booking Penginapan Kontingen</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Fasilitas istirahat khusus untuk rombongan kontingen selama rangkaian acara Milad ke-104. 
          Satu unit penginapan diperuntukkan bagi satu kontingen/korwil.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {basecamps.map((bc) => (
          <motion.div
            key={bc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`relative group bg-white rounded-3xl p-6 shadow-sm border-2 transition-all ${
              bc.isBooked 
                ? 'border-slate-100 opacity-80' 
                : 'border-brand-gold/10 hover:border-brand-gold hover:shadow-xl hover:shadow-brand-gold/10'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
              bc.isBooked ? 'bg-slate-100 text-slate-400' : 'bg-brand-gold/10 text-brand-gold'
            }`}>
              <Home size={24} />
            </div>

            <h3 className="text-xl font-serif font-bold text-brand-dark mb-2">{bc.name}</h3>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={14} className="text-brand-gold" />
                <span>{bc.location}</span>
              </div>
              {bc.capacity && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users size={14} className="text-brand-gold" />
                  <span>Kapasitas: {bc.capacity}</span>
                </div>
              )}
              {bc.price ? (
                <div className="text-sm font-bold text-brand-forest">
                  Rp {bc.price.toLocaleString('id-ID')}
                </div>
              ) : (
                <div className="text-sm font-bold text-brand-gold uppercase tracking-widest text-[10px]">Gratis / Fasilitas</div>
              )}
            </div>

            {bc.isBooked ? (
              <div className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                <Check size={16} /> Sudah dibooking
              </div>
            ) : (
              <button
                onClick={() => setSelectedBasecamp(bc)}
                className="w-full py-4 bg-brand-dark text-brand-gold rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-brand-dark transition-all"
              >
                Booking Sekarang
              </button>
            )}

            {bc.isBooked && bc.bookedBy && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Oleh Korwil</p>
                <p className="text-xs font-bold text-brand-dark">{bc.bookedBy}</p>
              </div>
            )}
          </motion.div>
        ))}

        {basecamps.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400 italic">Daftar basecamp belum tersedia. Hubungi admin untuk informasi lebih lanjut.</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedBasecamp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md"
              onClick={() => setSelectedBasecamp(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-brand-cream rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-brand-gold/10 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-brand-dark">Booking {selectedBasecamp.name}</h3>
                  <p className="text-xs text-brand-gold font-bold uppercase tracking-widest mt-1">Khusus Koordinator Wilayah</p>
                </div>
                <button onClick={() => setSelectedBasecamp(null)} className="text-slate-400 hover:text-brand-dark transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleBooking} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Pilih Korwil</label>
                  <select 
                    required
                    value={formData.koorwil}
                    onChange={e => setFormData({...formData, koorwil: e.target.value})}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-gold transition-all"
                  >
                    <option value="">-- Pilih Korwil Anda --</option>
                    {koorwils.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Nama Koordinator / PIC</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="Nama lengkap penanggung jawab"
                      value={formData.coordinatorName}
                      onChange={e => setFormData({...formData, coordinatorName: e.target.value})}
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-brand-gold transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Nomor WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="tel" 
                      required
                      placeholder="628123456789"
                      value={formData.contact}
                      onChange={e => setFormData({...formData, contact: e.target.value})}
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-brand-gold transition-all"
                    />
                  </div>
                </div>

                <div className="p-4 bg-brand-gold/5 rounded-2xl border border-brand-gold/10">
                   <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                     <MessageSquare size={10} /> Konfirmasi
                   </p>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">
                     "Setelah melakukan booking, harap segera mengirimkan surat tugas koordinator atau bukti fisik lainnya ke Sekretariat Milad (08xxx)."
                   </p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-dark text-brand-gold py-5 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-brand-dark/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi Booking'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
