import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  increment 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Wish } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Heart, 
  Download, 
  Share2, 
  User, 
  Plus, 
  X, 
  MessageSquare,
  Sparkles,
  Award,
  Globe
} from 'lucide-react';
import html2canvas from 'html2canvas';

const templates = [
  { id: 1, name: 'Klasik Islami' },
  { id: 2, name: 'Emas Mewah' },
  { id: 3, name: 'Modern Hijau' }
];

export default function WishWall() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'alumni' | 'santri' | 'umum'>('all');
  const [likedWishes, setLikedWishes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: 'umum' as 'alumni' | 'santri' | 'umum',
    angkatan: '',
    message: '',
    template: 1 as 1 | 2 | 3
  });

  useEffect(() => {
    // Load liked wishes from local storage
    const storedLikes = localStorage.getItem('milad_liked_wishes');
    if (storedLikes) setLikedWishes(JSON.parse(storedLikes));

    // Listen for wishes
    const q = query(collection(db, 'wishes'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setWishes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Wish)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'wishes'));

    return () => unsub();
  }, []);

  const handleLike = async (wishId: string) => {
    if (likedWishes.includes(wishId)) return;

    try {
      await updateDoc(doc(db, 'wishes', wishId), {
        likes: increment(1)
      });
      const newLikes = [...likedWishes, wishId];
      setLikedWishes(newLikes);
      localStorage.setItem('milad_liked_wishes', JSON.stringify(newLikes));
    } catch (err) {
      console.error("Failed to like wish", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'wishes'), {
        ...formData,
        status: 'approved',
        likes: 0,
        timestamp: new Date().toISOString()
      });
      setShowForm(false);
      setFormData({
        name: '',
        role: 'umum',
        angkatan: '',
        message: '',
        template: 1
      });
    } catch (err) {
      console.error("Failed to send wish", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWishes = wishes.filter(w => {
    if (filter === 'all') return true;
    return w.role === filter;
  });

  const downloadCard = async (id: string, name: string) => {
    const cardElement = document.getElementById(`wish-card-${id}`);
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });
      const link = document.createElement('a');
      link.download = `ucapan-milad-sukahideng-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed to download card", err);
    }
  };

  const shareToWhatsApp = (wish: Wish) => {
    const text = `Ucapan Milad ke-104 Pesantren Sukahideng dari ${wish.name} (${wish.role})${wish.angkatan ? ` Angkatan ${wish.angkatan}` : ''}: "${wish.message}"\n\nKirim ucapanmu juga di: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div id="wish-wall" className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
        <div className="max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-brand-gold font-serif italic mb-4"
          >
            <Sparkles size={20} />
            <span>Pesan Cinta & Harapan</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-6">Wall Ucapan Milad</h2>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-brand-cream flex items-center justify-center overflow-hidden">
                  <User size={20} className="text-brand-dark/30" />
                </div>
              ))}
            </div>
            <p className="text-sm">
              <span className="font-bold text-brand-dark">{wishes.length} ucapan</span> telah dikirim dari seluruh penjuru nusantara
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <button 
            onClick={() => setShowForm(true)}
            className="px-8 py-4 bg-brand-dark text-brand-gold rounded-full font-bold shadow-xl hover:shadow-brand-gold/20 transition-all flex items-center gap-2 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Kirim Ucapan Anda
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-12">
        {(['all', 'alumni', 'santri', 'umum'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              filter === f 
                ? 'bg-brand-gold text-brand-dark shadow-md' 
                : 'bg-white text-slate-500 hover:bg-brand-gold/10'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Wishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredWishes.map((wish) => (
            <WishCard 
              key={wish.id} 
              wish={wish} 
              onLike={() => handleLike(wish.id)}
              isLiked={likedWishes.includes(wish.id)}
              onDownload={() => downloadCard(wish.id, wish.name)}
              onShare={() => shareToWhatsApp(wish)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredWishes.length === 0 && !isSubmitting && (
        <div className="text-center py-24 bg-white/30 rounded-3xl border-2 border-dashed border-brand-gold/20">
          <MessageSquare size={48} className="mx-auto text-brand-gold/30 mb-4" />
          <p className="text-slate-500 italic">Belum ada ucapan untuk kategori ini. <br/>Jadilah yang pertama mengirimkan doa!</p>
        </div>
      )}

      {/* Floating Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md"
              onClick={() => setShowForm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-brand-cream rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-brand-gold/10 flex justify-between items-center">
                <h3 className="text-2xl font-serif font-bold text-brand-dark">Kirim Ucapan Anda</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-brand-dark">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">Nama Lengkap</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-brand-gold outline-none transition-all"
                      placeholder="Contoh: Akhmad Fauzi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">Kategori</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as any})}
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-brand-gold outline-none transition-all"
                    >
                      <option value="umum">Umum</option>
                      <option value="alumni">Alumni</option>
                      <option value="santri">Santri</option>
                    </select>
                  </div>
                </div>

                {(formData.role === 'alumni' || formData.role === 'santri') && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">Tahun Angkatan / Masuk</label>
                    <input 
                      type="text" 
                      value={formData.angkatan}
                      onChange={e => setFormData({...formData, angkatan: e.target.value})}
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-brand-gold outline-none transition-all"
                      placeholder="Contoh: 2012 atau 'Angkatan XXX'"
                    />
                  </motion.div>
                )}

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400">Pesan Ucapan</label>
                    <span className={`text-[10px] font-bold ${formData.message.length > 200 ? 'text-red-500' : 'text-slate-400'}`}>
                      {formData.message.length}/200
                    </span>
                  </div>
                  <textarea 
                    required
                    maxLength={200}
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-brand-gold outline-none transition-all resize-none h-32"
                    placeholder="Tuliskan doa dan ucapan selamat Milad ke-104..."
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-4">Pilih Desain Kartu</label>
                  <div className="grid grid-cols-3 gap-4">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({...formData, template: t.id as 1 | 2 | 3})}
                        className={`aspect-[4/5] rounded-xl border-2 transition-all overflow-hidden relative ${
                          formData.template === t.id ? 'border-brand-gold ring-4 ring-brand-gold/10' : 'border-slate-100 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className={`w-full h-full p-2 flex flex-col items-center justify-center text-center ${
                          t.id === 1 ? 'bg-brand-dark text-white' : 
                          t.id === 2 ? 'bg-brand-cream text-brand-dark border-brand-gold/20' : 
                          'bg-white text-brand-dark'
                        }`}>
                          <span className="text-[10px] font-bold uppercase tracking-tighter">{t.name}</span>
                          <div className={`mt-2 h-1 w-8 rounded-full ${t.id === 1 ? 'bg-brand-gold' : 'bg-brand-forest'}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  disabled={isSubmitting || formData.message.length === 0}
                  className="w-full py-4 bg-brand-dark text-brand-gold rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-brand-gold/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={20} />
                      Kirim Pesan Sekarang
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WishCard({ wish, onLike, isLiked, onDownload, onShare }: { 
  wish: Wish; 
  onLike: () => void | Promise<void>; 
  isLiked: boolean;
  onDownload: () => void | Promise<void>;
  onShare: () => void;
  key?: React.Key;
}) {
  const getTemplateStyle = () => {
    switch (wish.template) {
      case 1: // Klasik Islami
        return {
          card: "bg-brand-dark text-white",
          pattern: "opacity-10",
          accent: "bg-brand-gold",
          text: "text-brand-cream/80",
          header: "text-brand-gold",
          ornament: true
        };
      case 2: // Emas Mewah
        return {
          card: "bg-[#fdfcf9] text-brand-dark border-4 border-double border-brand-gold/30",
          pattern: "opacity-5",
          accent: "bg-brand-dark",
          text: "text-slate-600",
          header: "text-brand-gold",
          ornament: false
        };
      case 3: // Modern Hijau
        return {
          card: "bg-white text-brand-dark border-l-8 border-brand-forest",
          pattern: "opacity-0",
          accent: "bg-brand-forest",
          text: "text-slate-500",
          header: "text-brand-forest",
          ornament: false
        };
      default:
        return { card: "bg-white", pattern: "", accent: "", text: "", header: "", ornament: false };
    }
  };

  const style = getTemplateStyle();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group"
    >
      {/* Capturable Card Area */}
      <div 
        id={`wish-card-${wish.id}`} 
        className={`relative aspect-[4/5] p-10 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl ${style.card}`}
      >
        {/* Background Pattern */}
        <div className={`absolute inset-0 z-0 ${style.pattern}`} 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l2.121 2.121L34.243 0l2.121 2.121L38.485 0l2.121 2.121L42.728 0l2.121 2.121L46.97 0l2.121 2.121L51.213 0l2.121 2.121L55.456 0l2.121 2.121L59.698 0l2.121 2.121L63.94 0v60H0V0h30zM0 30l2.121-2.121L4.243 30l2.121-2.121L8.485 30l2.121-2.121L12.728 30l2.121-2.121L16.97 30l2.121-2.121L21.213 30l2.121-2.121L25.456 30l2.121-2.121L29.698 30v30H0V30z' fill='%23d4af37' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` 
          }} 
        />

        <div className="relative z-10 w-full">
          {wish.template === 1 && (
             <div className="mb-6 opacity-30 text-[10px] tracking-[0.5em] font-serif uppercase">
               بسم الله الرحمن الرحيم
             </div>
          )}

          <div className={`inline-block mb-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-opacity-10 ${style.accent} ${style.header}`}>
            Milad ke-104 Sukahideng
          </div>

          {style.ornament && <div className="w-16 h-px bg-brand-gold mx-auto mb-8 opacity-50" />}

          <h4 className={`text-xl font-serif font-bold mb-2 ${wish.template === 2 ? 'text-brand-dark' : ''}`}>
            {wish.name}
          </h4>
          
          <div className="flex items-center justify-center gap-2 mb-8 text-[10px] font-bold uppercase tracking-widest opacity-60">
            {wish.role === 'alumni' ? <Award size={12} /> : wish.role === 'santri' ? <MessageSquare size={12} /> : <Globe size={12} />}
            <span>{wish.role} {wish.angkatan && `• ${wish.angkatan}`}</span>
          </div>

          <p className={`text-sm leading-relaxed italic ${style.text}`}>
            "{wish.message}"
          </p>

          {style.ornament && <div className="w-16 h-px bg-brand-gold mx-auto mt-8 opacity-50" />}
          
          {wish.template === 3 && (
            <div className={`mt-8 text-[9px] font-bold uppercase tracking-widest ${style.header} opacity-40`}>
              Pesantren Sukahideng • 2026
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={onLike}
            className={`flex items-center gap-1.5 text-sm font-bold transition-all ${
              isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
            }`}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'animate-bounce' : ''} />
            <span>{wish.likes || 0}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onDownload}
            className="p-2 bg-white text-brand-dark rounded-full shadow-md hover:bg-brand-gold hover:text-white transition-all transform hover:-translate-y-1"
            title="Unduh Kartu"
          >
            <Download size={16} />
          </button>
          <button 
            onClick={onShare}
            className="p-2 bg-brand-dark text-brand-gold rounded-full shadow-md hover:shadow-brand-gold/20 transition-all transform hover:-translate-y-1"
            title="Bagikan ke WhatsApp"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
