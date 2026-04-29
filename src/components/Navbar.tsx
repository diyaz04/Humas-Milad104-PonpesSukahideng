import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  onMenuOpen: () => void;
}

export default function Navbar({ onMenuOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'glass-nav py-4 shadow-xl' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-brand-gold/20 blur-xl rounded-full scale-110 group-hover:bg-brand-gold/40 transition-all duration-500" />
            <div className="relative bg-white/10 backdrop-blur-sm p-1 border border-brand-gold/30 rounded-xl shadow-2xl transition-transform hover:scale-110 duration-500">
              <img 
                src="https://lh3.googleusercontent.com/d/10ePHDITHyany16gFdE6axqBjSwr2UROr" 
                alt="Sukahideng Logo" 
                className="h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div>
            <h1 className={`font-serif font-bold leading-none tracking-tight transition-all duration-300 ${scrolled ? 'text-brand-gold text-lg' : 'text-brand-gold text-2xl drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]'}`}>SUKAHIDENG</h1>
            {!scrolled && <p className="text-[10px] text-brand-gold/70 tracking-[0.2em] uppercase mt-1">Alumni & Santri</p>}
          </div>
        </div>

        <div className="hidden md:flex gap-10 items-center">
          {['About', 'Agenda', 'Merchandise', 'Porsas', 'Berita'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-brand-cream/80 hover:text-brand-gold tracking-widest transition-colors uppercase"
            >
              {item}
            </a>
          ))}
          <a 
            href="#daftar-porsas" 
            className="bg-brand-gold text-brand-dark px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-lightgold transition-all transform hover:scale-105"
          >
            Daftar PORSAS
          </a>
        </div>

        <button 
          onClick={onMenuOpen}
          className="md:hidden p-2 text-brand-gold"
        >
          <Menu size={28} />
        </button>
      </div>
    </nav>
  );
}
