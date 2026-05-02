import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Copy, Check, Send, ArrowRight, Wallet, QrCode } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function Donation() {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const bankAccounts = [
    { bank: 'BSI', number: '7150814884', name: 'IMAM CAHYADI' },
    { bank: 'BRI', number: '0161 0110 2977 507', name: 'IMAM CAHYADI' },
    { bank: 'Mandiri', number: '1770024878750', name: 'IMAM CAHYADI' },
    { bank: 'BCA', number: '8480158815', name: 'IMAM CAHYADI' },
  ];

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num.replace(/\s/g, ''));
    setCopied(num);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) {
      alert("Harap isi nama dan nominal donasi.");
      return;
    }

    setLoading(true);
    try {
      const amountNum = parseInt(formData.amount.replace(/[^0-9]/g, ''));
      
      const donationData = {
        name: formData.name,
        amount: amountNum,
        message: formData.message,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'donations'), donationData);

      // WhatsApp Redirect
      const waNumber = "6285721754753"; // Neng Fatim
      const waMessage = `Konfirmasi Donasi Milad 104 & PORSAS\n\nNama: ${formData.name}\nNominal: Rp ${amountNum.toLocaleString('id-ID')}\nPesan: ${formData.message || '-'}\n\n*Saya akan mengirimkan bukti transfer setelah ini.*`;
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
      
      window.open(waUrl, '_blank');
      setFormData({ name: '', amount: '', message: '' });
      alert("Terima kasih atas niat baik Anda! Anda akan diarahkan ke WhatsApp untuk konfirmasi bukti transfer.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'donations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-gold">
            <Heart size={40} className="fill-brand-gold" />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-brand-dark mb-4">Wakaf & Donasi</h1>
          <p className="text-brand-dark/60 font-medium max-w-xl mx-auto uppercase tracking-widest text-xs">
            Dukung Kesuksesan Milad ke-104 & PORSAS Ponpes Sukahideng
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Bank Accounts */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-brand-dark flex items-center gap-3 mb-8">
              <Wallet className="text-brand-gold" /> Rekening Tujuan
            </h2>
            
            <div className="grid gap-4">
              {bankAccounts.map((acc, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl font-black text-brand-dark/20 italic">{acc.bank}</span>
                    <button 
                      onClick={() => handleCopy(acc.number)}
                      className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-brand-gold transition-colors"
                    >
                      {copied === acc.number ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="font-mono text-xl font-bold text-brand-dark mb-1 tracking-wider">
                    {acc.number}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                    A/N {acc.name}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-brand-dark p-6 rounded-3xl text-white mt-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <QrCode size={18} className="text-brand-gold" /> Konfirmasi Cepat
              </h3>
              <p className="text-xs text-brand-cream/60 leading-relaxed mb-4">
                Setelah melakukan transfer, mohon kirimkan bukti transfer melalui formulir di samping atau langsung hubungi Panitia (Neng Fatim).
              </p>
              <a 
                href="https://wa.me/6285721754753" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:text-white transition-colors"
              >
                Chat WhatsApp <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-50 self-start">
            <h2 className="text-xl font-bold text-brand-dark mb-6">Form Donatur</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: H. Ahmad"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Nominal Donasi (Rp)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Contoh: 500000"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Pesan / Doa (Opsional)</label>
                <textarea 
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tuliskan pesan atau doa Anda..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand-dark text-white rounded-2xl py-5 px-8 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-brand-gold transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {loading ? "Memproses..." : (
                  <>
                    Kirim Konfirmasi <Send size={16} />
                  </>
                )}
              </button>
            </form>
            <div className="mt-8 pt-8 border-t border-slate-100 italic text-[10px] text-slate-400 text-center">
              "Sedekah tidak akan mengurangi harta..." (HR. Muslim)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
