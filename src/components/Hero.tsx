import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO } from 'date-fns';
import { Setting } from '../types';
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  settings: Setting | null;
}

export default function Hero({ settings }: HeroProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!settings?.countdownDate) return;

    const timer = setInterval(() => {
      const target = parseISO(settings.countdownDate);
      const now = new Date();
      
      if (target > now) {
        setTimeLeft({
          days: differenceInDays(target, now),
          hours: differenceInHours(target, now) % 24,
          minutes: differenceInMinutes(target, now) % 60,
          seconds: differenceInSeconds(target, now) % 60
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings?.countdownDate]);

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 pt-20 overflow-hidden bg-brand-dark">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-100 bg-[url('https://assets.promediateknologi.id/crop/0x0:0x0/1200x600/webp/photo/2022/12/30/388964777.jpg')] bg-cover bg-center mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-brand-dark/80 to-brand-dark" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="relative z-10 max-w-4xl"
      >
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5, duration: 1 }}
        >
          <h1 className="text-5xl md:text-8xl font-serif font-bold text-brand-cream leading-tight mb-6">
            {settings?.heroTitle || "Milad ke-104 Pesantren Sukahideng"}
          </h1>
          <p className="text-brand-gold/80 text-lg md:text-2xl font-light tracking-widest uppercase mb-12 max-w-2xl mx-auto">
            {settings?.heroTagline || "Meneguhkan Khidmah, Menginspirasi Umat"}
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex justify-center gap-2 md:gap-8 mb-16 px-2"
        >
          {[
            { label: 'Hari', value: timeLeft.days },
            { label: 'Jam', value: timeLeft.hours },
            { label: 'Menit', value: timeLeft.minutes },
            { label: 'Detik', value: timeLeft.seconds }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="w-[72px] h-[72px] md:w-28 md:h-28 rounded-xl md:rounded-2xl border border-brand-gold/30 flex flex-col items-center justify-center bg-brand-gold/5 backdrop-blur-sm group hover:border-brand-gold transition-all">
                <span className="text-2xl md:text-5xl font-serif font-bold text-brand-gold group-hover:scale-110 transition-transform">
                  {item.value.toString().padStart(2, '0')}
                </span>
                <span className="text-[8px] md:text-xs text-brand-cream/60 uppercase tracking-widest mt-0.5 md:mt-1">{item.label}</span>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="flex flex-col md:flex-row gap-6 justify-center items-center"
        >
          <a href="#agenda" className="px-10 py-4 bg-brand-gold text-brand-dark rounded-full font-bold uppercase tracking-widest hover:bg-brand-lightgold transition-all shadow-xl shadow-brand-gold/20">
            Lihat Agenda
          </a>
          <a href="#daftar-porsas" className="px-10 py-4 border border-brand-gold text-brand-gold rounded-full font-bold uppercase tracking-widest hover:bg-brand-gold/10 transition-all">
            Daftar PORSAS
          </a>
        </motion.div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 z-10 text-brand-gold/50 cursor-pointer"
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <ChevronDown size={32} />
      </motion.div>
    </div>
  );
}
