import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Users, Shield, Target, 
  Wind, Activity, Grid, Circle, 
  Sword, Dumbbell, Medal, Zap, Disc,
  Palette, Music, Book, Languages,
  UserPlus, ChevronRight
} from 'lucide-react';
import { Sport } from '../types';

interface PorsasProps {
  sports: Sport[];
}

const getSportIcon = (name: string, category: string) => {
  const n = name.toLowerCase();
  
  if (category === 'seni') {
    if (n.includes('lukis') || n.includes('gambar') || n.includes('kaligrafi')) return Palette;
    if (n.includes('musik') || n.includes('sholawat') || n.includes('hadroh')) return Music;
    if (n.includes('puisi') || n.includes('sastra') || n.includes('kitab')) return Book;
    if (n.includes('pidato') || n.includes('dakwah')) return Languages;
    return Palette;
  }

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
  const olahraga = sports.filter(s => s.category === 'olahraga');
  const seni = sports.filter(s => s.category === 'seni');

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-brand-gold/20 text-brand-gold rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
            <Trophy size={14} /> Event PORSAS
          </div>
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-brand-cream leading-tight mb-8">
            Pekan Olahraga <br />
            <span className="text-brand-gold">& Seni Alumni</span>
          </h2>
          <p className="text-brand-cream/60 text-lg md:text-xl font-light leading-relaxed">
            Ajang silaturahmi & kompetisi yang mempertemukan alumni santri Sukahideng. Selain olahraga bergengsi, PORSAS kali ini juga menghadirkan cabang lomba seni untuk individu.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="w-32 h-32 rounded-3xl border border-brand-gold/20 flex flex-col items-center justify-center p-4 text-center">
            <Users size={32} className="text-brand-gold mb-2" />
            <span className="text-xs uppercase tracking-widest leading-tight text-brand-gold/70 font-medium">Ukhuwah</span>
          </div>
          <div className="w-32 h-32 rounded-3xl bg-brand-gold flex flex-col items-center justify-center p-4 text-center text-brand-dark">
            <Medal size={32} className="mb-2" />
            <span className="text-xs uppercase tracking-widest leading-tight font-bold">Prestasi</span>
          </div>
        </div>
      </div>

      {/* Cabang Olahraga */}
      {olahraga.length > 0 && (
        <div className="mb-20">
          <h3 className="text-2xl font-serif font-bold text-brand-gold uppercase tracking-widest mb-10 flex items-center gap-4">
            <span className="h-px bg-brand-gold/30 flex-grow" />
            Cabang Olahraga
            <span className="h-px bg-brand-gold/30 flex-grow" />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {olahraga.map((sport, idx) => {
              const Icon = getSportIcon(sport.name, 'olahraga');
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
                    <div className="flex gap-2 mb-2">
                      <span className="text-[8px] uppercase font-bold tracking-widest bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded">{sport.gender}</span>
                      <span className="text-[8px] uppercase font-bold tracking-widest bg-white/5 text-brand-cream/40 px-2 py-0.5 rounded">{sport.type}</span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-brand-cream uppercase tracking-wider">{sport.name}</h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cabang Seni */}
      {seni.length > 0 && (
        <div className="mb-20">
          <h3 className="text-2xl font-serif font-bold text-brand-gold uppercase tracking-widest mb-10 flex items-center gap-4">
            <span className="h-px bg-brand-gold/30 flex-grow" />
            Cabang Seni
            <span className="h-px bg-brand-gold/30 flex-grow" />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {seni.map((sport, idx) => {
              const Icon = getSportIcon(sport.name, 'seni');
              return (
                <motion.div
                  key={sport.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative h-64 rounded-[40px] bg-brand-dark/50 border border-brand-gold/10 p-8 flex flex-col justify-end overflow-hidden hover:border-brand-gold transition-all"
                >
                  <div className="absolute top-0 right-0 p-8 text-brand-gold/10 group-hover:text-brand-gold/20 transition-colors">
                    <Icon size={120} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex gap-2 mb-2">
                      <span className="text-[8px] uppercase font-bold tracking-widest bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded">{sport.gender}</span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-brand-cream uppercase tracking-wider">{sport.name}</h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {sports.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-64 rounded-[40px] bg-brand-forest/50 animate-pulse border border-brand-gold/5" />
          ))}
        </div>
      )}

      <div className="mt-20 flex flex-col items-center gap-8 text-center">
        <div className="max-w-2xl">
          <h4 className="text-xl font-serif font-bold text-brand-gold uppercase tracking-[0.2em] mb-4">Mekanisme Pendaftaran</h4>
          <p className="text-brand-cream/40 text-sm italic">Cabang olahraga & sebagian besar cabang seni dikoordinasikan oleh masing-masing Koorwil. Khusus kegiatan Gowes & lomba Karaoke Religi dapat mendaftar secara langsung.</p>
        </div>
        
        <div className="flex flex-wrap gap-6 justify-center">
          <a href="#daftar-porsas" className="group flex items-center gap-4 bg-brand-gold text-brand-dark px-10 py-5 rounded-3xl font-bold uppercase tracking-widest hover:bg-brand-lightgold transition-all shadow-xl shadow-brand-gold/20">
            <Shield size={20} />
            Daftar via Koorwil
            <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <ChevronRight size={18} />
            </motion.div>
          </a>
          <a href="#daftar-individu" className="flex items-center gap-4 bg-brand-forest border border-brand-gold/30 text-brand-gold px-10 py-5 rounded-3xl font-bold uppercase tracking-widest hover:border-brand-gold hover:bg-brand-gold/5 transition-all">
            <UserPlus size={20} />
            Daftar Individu (Kegiatan/Seni)
          </a>
        </div>
        
        <a href="#bagan-porsas" className="flex items-center gap-2 text-brand-gold/60 hover:text-brand-gold text-xs font-bold uppercase tracking-widest transition-colors">
          Lihat Bagan Pertandingan <ChevronRight size={14} />
        </a>
      </div>
    </div>
  );
}
