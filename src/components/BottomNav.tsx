import React, { useState } from 'react';
import { Home, Calendar, Trophy, Newspaper, Menu, X, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export default function BottomNav() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Agenda', icon: Calendar, href: '#agenda' },
    { label: 'PORSAS', icon: Trophy, href: '#porsas' },
    { label: 'Berita', icon: Newspaper, href: '#berita' },
  ];

  return (
    <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col items-center gap-4">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col gap-4 mb-2">
            {navItems.map((item, index) => (
              <motion.a 
                key={item.label} 
                href={item.href}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setIsOpen(false)}
                className="w-12 h-12 bg-brand-dark/90 backdrop-blur-xl border border-brand-gold/30 rounded-full flex items-center justify-center text-brand-gold shadow-xl hover:scale-110 transition-transform relative group"
              >
                <item.icon size={20} />
                <span className="absolute right-16 bg-brand-dark text-white text-[10px] py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold uppercase tracking-widest border border-brand-gold/20">
                  {item.label}
                </span>
              </motion.a>
            ))}
          </div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-brand-gold text-brand-dark rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-4 border-brand-dark/10"
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>
    </div>
  );
}
