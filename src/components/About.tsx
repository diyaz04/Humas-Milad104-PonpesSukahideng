import React from 'react';
import { motion } from 'motion/react';
import { Setting } from '../types';

interface AboutProps {
  settings: Setting | null;
}

export default function About({ settings }: AboutProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="w-16 h-1 bg-brand-gold mb-8" />
        <h2 className="text-4xl md:text-6xl font-serif font-bold text-brand-dark mb-8 leading-tight">
          {settings?.aboutTitle || "Makna Milad ke-104"}
        </h2>
        <p className="text-brand-dark/70 text-lg md:text-xl leading-relaxed font-light mb-8">
          {settings?.aboutText || "Pesantren Sukahideng telah berdiri selama lebih dari satu abad, membimbing generasi dengan ilmu dan akhlak. Milad ke-104 ini merupakan momentum untuk bersyukur dan mengaktualisasikan nilai-nilai pesantren dalam menjawab tantangan zaman."}
        </p>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <span className="text-4xl font-serif text-brand-gold block mb-2">104</span>
            <span className="text-xs uppercase tracking-widest text-brand-dark/50">Tahun Berkhidmat</span>
          </div>
          <div>
            <span className="text-4xl font-serif text-brand-gold block mb-2">5k+</span>
            <span className="text-xs uppercase tracking-widest text-brand-dark/50">Alumni Santri</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative"
      >
        <div className="aspect-[2/3] bg-brand-dark rounded-[40px] overflow-hidden shadow-2xl relative z-10 border-8 border-white">
          <img 
            src="https://lh3.googleusercontent.com/d/1MmKPl5WVlkLhO_W4HORKVyaSAeQKqM3c" 
            alt="Pesantren Sukahideng" 
            className="w-full h-full object-cover object-center hover:scale-110 transition-all duration-700"
          />
        </div>
        
        {/* Abstract shapes */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl z-0" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-brand-forest/10 rounded-full blur-3xl z-0" />
        
        <div className="absolute -bottom-6 -right-6 w-32 h-32 border-4 border-brand-gold rounded-[20px] z-20" />
      </motion.div>
    </div>
  );
}
