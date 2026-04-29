import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Users, Shield, Target, 
  Wind, Activity, Grid, Circle, 
  Sword, Dumbbell, Medal, Zap, Disc
} from 'lucide-react';
import { Sport } from '../types';

interface PorsasProps {
  sports: Sport[];
}

const getSportIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('bola') || n.includes('futsal')) return Activity;
  if (n.includes('tangkis') || n.includes('badminton')) return Wind;
  if (n.includes('catur')) return Grid;
  if (n.includes('voli')) return Circle;
  if (n.includes('pingpong') || n.includes('tenis meja')) return Disc;
  if (n.includes('lari') || n.includes('atletik')) return Zap;
  if (n.includes('silat') || n.includes('karate')) return Sword;
  if (n.includes('angkat')) return Dumbbell;
  return Target;
};

export default function Porsas({ sports }: PorsasProps) {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-brand-gold/20 text-brand-gold rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
            <Trophy size={14} /> Event PORSAS
          </div>
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-brand-cream leading-tight mb-8">
            Pekan Olahraga <br />
            <span className="text-brand-gold">Alumni Santri</span>
          </h2>
          <p className="text-brand-cream/60 text-lg md:text-xl font-light leading-relaxed">
            Ajang silaturahmi melalui kompetisi olahraga yang mempertemukan para alumni santri Sukahideng dari berbagai Koorwil. Junjung tinggi sportivitas dan persaudaraan.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="w-32 h-32 rounded-3xl border border-brand-gold/20 flex flex-col items-center justify-center p-4 text-center">
            <Users size={32} className="text-brand-gold mb-2" />
            <span className="text-xs uppercase tracking-widest leading-tight text-brand-gold/70 font-medium">Solidaritas</span>
          </div>
          <div className="w-32 h-32 rounded-3xl bg-brand-gold flex flex-col items-center justify-center p-4 text-center text-brand-dark">
            <Shield size={32} className="mb-2" />
            <span className="text-xs uppercase tracking-widest leading-tight font-bold">Integritas</span>
          </div>
        </div>
      </div>

      {/* Cabang Olahraga */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {sports.map((sport, idx) => {
          const Icon = getSportIcon(sport.name);
          return (
            <motion.div
              key={sport.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative h-64 rounded-[40px] bg-brand-forest border border-brand-gold/10 p-8 flex flex-col justify-end overflow-hidden hover:border-brand-gold transition-all"
            >
              <div className="absolute top-0 right-0 p-8 text-brand-gold/10 group-hover:text-brand-gold/20 transition-colors">
                <Icon size={120} />
              </div>
              
              <div className="relative z-10">
                <span className="text-brand-gold font-serif italic text-lg block mb-1">Cabang</span>
                <h3 className="text-2xl font-serif font-bold text-brand-cream uppercase tracking-wider">{sport.name}</h3>
              </div>
            </motion.div>
          );
        })}
        {sports.length === 0 && (
          [1,2,3,4].map(i => (
            <div key={i} className="h-64 rounded-[40px] bg-brand-forest/50 animate-pulse border border-brand-gold/5" />
          ))
        )}
      </div>

      <div className="mt-20 flex flex-wrap gap-6 justify-center">
        <a href="#daftar-porsas" className="group flex items-center gap-4 bg-brand-gold text-brand-dark px-12 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-brand-lightgold transition-all">
          Daftar Tim Sekarang
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <Trophy size={18} />
          </motion.div>
        </a>
        <a href="#bagan-porsas" className="px-12 py-5 border border-brand-gold/30 text-brand-gold rounded-full font-bold uppercase tracking-widest hover:border-brand-gold hover:bg-brand-gold/5 transition-all">
          Lihat Bagan Pertandingan
        </a>
      </div>
    </div>
  );
}
