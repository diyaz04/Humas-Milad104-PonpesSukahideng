import React, { useState, useEffect } from 'react';
import { Menu, X, MoreHorizontal, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onMenuOpen: () => void;
  onOpenDonation: () => void;
  onOpenAlumni: () => void;
}

export default function Navbar({ onMenuOpen, onOpenDonation, onOpenAlumni }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      // Detect active section
      const sections = [...primaryLinks, ...moreLinks].map(link => link.href.replace('#', ''));
      let current = '';
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the top of the section is near the top of the viewport
          if (rect.top <= 100) {
            current = section;
          }
        }
      }
      
      if (current) {
        setActiveSection(current);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const primaryLinks = [
    { name: 'Beranda', href: '#hero' },
    { name: 'Tentang', href: '#about' },
    { name: 'Ucapan', href: '#wish-wall' },
    { name: 'Multimedia', href: '#video-content' },
    { name: 'Agenda', href: '#agenda' },
  ];

  const moreLinks = [
    { name: 'Merchandise', href: '#merchandise' },
    { name: 'PORSAS', href: '#porsas' },
    { name: 'Dokumen', href: '#pusat-informasi' },
    { name: 'Berita', href: '#berita' },
  ];

  const isMoreActive = moreLinks.some(link => link.href.replace('#', '') === activeSection);

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

        <div className="hidden md:flex gap-8 items-center">
          {primaryLinks.map((item) => {
            const isActive = item.href.replace('#', '') === activeSection;
            return (
              <a 
                key={item.name} 
                href={item.href}
                className={`text-sm font-medium tracking-widest transition-all uppercase whitespace-nowrap relative group/link ${isActive ? 'text-brand-gold' : 'text-brand-cream/80 hover:text-brand-gold'}`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand-gold transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover/link:w-full'}`} />
              </a>
            );
          })}
          
          <div className="relative">
            <button 
              onClick={() => setShowMore(!showMore)}
              onMouseEnter={() => setShowMore(true)}
              className={`p-2 transition-colors relative ${isMoreActive || showMore ? 'text-brand-gold' : 'text-brand-cream/80 hover:text-brand-gold'}`}
            >
              <MoreHorizontal size={24} />
              {isMoreActive && !showMore && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-gold rounded-full" />
              )}
            </button>
            
            <AnimatePresence>
              {showMore && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  onMouseLeave={() => setShowMore(false)}
                  className="absolute right-0 mt-2 w-48 bg-brand-dark/95 backdrop-blur-xl border border-brand-gold/20 rounded-2xl shadow-2xl overflow-hidden py-3"
                >
                  {moreLinks.map((item) => {
                    const isActive = item.href.replace('#', '') === activeSection;
                    return (
                      <a 
                        key={item.name} 
                        href={item.href}
                        onClick={() => setShowMore(false)}
                        className={`block px-6 py-2.5 text-xs font-bold transition-all uppercase tracking-widest hover:bg-white/5 ${isActive ? 'text-brand-gold' : 'text-brand-cream/70 hover:text-brand-gold'}`}
                      >
                        {item.name}
                      </a>
                    );
                  })}
                  <div className="border-t border-brand-gold/10 my-2 pt-2">
                    <button 
                      onClick={() => { onOpenDonation(); setShowMore(false); }}
                      className="w-full text-left px-6 py-2.5 text-xs font-bold text-brand-cream/70 hover:text-brand-gold hover:bg-white/5 transition-all uppercase tracking-widest"
                    >
                      Donasi
                    </button>
                    <button 
                      onClick={() => { onOpenAlumni(); setShowMore(false); }}
                      className="w-full text-left px-6 py-2.5 text-xs font-bold text-brand-cream/70 hover:text-brand-gold hover:bg-white/5 transition-all uppercase tracking-widest"
                    >
                      Konfirmasi Alumni
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a 
            href="#daftar-porsas" 
            className="bg-brand-gold text-brand-dark px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-lightgold transition-all transform hover:scale-105 shadow-lg shadow-brand-gold/20"
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
