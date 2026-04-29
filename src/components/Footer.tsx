import React, { useState, useRef, useEffect } from 'react';
import { Facebook, Instagram, Youtube, Send, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FooterProps {
  onAdminTrigger: (keyword: string) => void;
}

export default function Footer({ onAdminTrigger }: FooterProps) {
  const [clickCount, setClickCount] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const [keyword, setKeyword] = useState('');
  const lastClickTime = useRef<number>(0);

  const handleTriggerClick = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 3000) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount >= 5) {
        setShowInput(true);
        setClickCount(0);
      }
    } else {
      setClickCount(1);
    }
    lastClickTime.current = now;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAdminTrigger(keyword.toLowerCase());
      setKeyword('');
      setShowInput(false);
    }
    if (e.key === 'Escape') {
      setShowInput(false);
    }
  };

  return (
    <footer className="bg-brand-dark text-brand-cream py-24 relative overflow-hidden">
      {/* Ornaments */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-16 relative z-10">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-white p-0.5 border border-white rounded-lg shadow-lg inline-block">
              <img 
                src="https://lh3.googleusercontent.com/d/1JcDX0c_j35jb8Rj1kw0bCgQwwXC2Jp4w" 
                alt="Sukahideng Logo" 
                className="h-16 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-3xl font-serif font-bold text-brand-gold tracking-widest uppercase">Sukahideng</h2>
          </div>
          <p className="text-brand-cream/50 text-sm leading-relaxed max-w-sm">
            Menanamkan nilai-nilai keislaman, kemandirian, dan khidmah kepada masyarakat sejak tahun 1922.
          </p>
          <div className="flex gap-4">
            {[Instagram, Facebook, Youtube].map((Icon, idx) => (
              <a key={idx} href="#" className="w-10 h-10 rounded-full border border-brand-gold/20 flex items-center justify-center hover:bg-brand-gold hover:text-brand-dark transition-all">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-serif font-bold text-brand-cream/80 uppercase tracking-widest mb-8">Navigasi</h3>
          <ul className="space-y-4 text-sm text-brand-cream/50 font-medium tracking-wide">
            {['About', 'Agenda', 'Porsas', 'Berita'].map(item => (
              <li key={item}>
                <a href={`#${item.toLowerCase()}`} className="hover:text-brand-gold transition-colors inline-flex items-center gap-2 group">
                  <div className="w-0 h-px bg-brand-gold group-hover:w-4 transition-all" />
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-serif font-bold text-brand-cream/80 uppercase tracking-widest mb-8">Kontak Kami</h3>
          <ul className="space-y-4 text-sm text-brand-cream/50 font-medium tracking-wide">
            <li className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-brand-forest/50 flex items-center justify-center text-brand-gold">
                <Send size={18} />
              </div>
              <span>Humas Panitia Milad Pondok Pesantren Sukahideng Ke-104</span>
            </li>
            <li className="leading-relaxed">
              Kp. Bageur Desa Sukarapih Kecamatan Sukarame Kabupaten Tasikmalaya, Jawa Barat
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-24 pt-12 border-t border-brand-gold/10 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-xs text-brand-cream/30 uppercase tracking-[0.3em] text-center md:text-left" onClick={handleTriggerClick}>
          © 2026 Humas & Publikasi Panitia Milad 104 Ponpes Sukahideng.
        </p>
        <div className="text-[10px] text-brand-cream/20 font-serif italic">
          Khidmah - Ilmu - Amal
        </div>
      </div>

      {/* Secret Input Overlay */}
      <AnimatePresence>
        {showInput && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-brand-dark/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full">
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-brand-gold rounded-3xl flex items-center justify-center text-brand-dark">
                  <Lock size={32} />
                </div>
              </div>
              <h4 className="text-brand-cream font-serif text-2xl text-center mb-8">Masukkan Kode Akses</h4>
              <input 
                autoFocus
                type="password" 
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketuk Enter untuk konfirmasi..."
                className="w-full bg-brand-forest border-2 border-brand-gold/30 rounded-2xl px-6 py-5 text-brand-cream text-center text-xl tracking-[0.5em] focus:outline-none focus:border-brand-gold transition-all"
              />
              <button 
                onClick={() => setShowInput(false)}
                className="mt-8 text-brand-gold/50 hover:text-brand-gold w-full text-center text-xs uppercase tracking-[0.3em]"
              >
                Batalkan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
