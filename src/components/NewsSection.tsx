import React from 'react';
import { motion } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronRight, Eye } from 'lucide-react';
import { News } from '../types';

interface NewsSectionProps {
  news: News[];
  onReadMore: (news: News) => void;
}

export default function NewsSection({ news, onReadMore }: NewsSectionProps) {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-4">Berita & Pengumuman</h2>
          <p className="text-brand-dark/60 uppercase tracking-widest text-sm italic">Informasi Terbaru Seputar Milad 104</p>
        </div>
        <a href="#berita" className="flex items-center gap-2 text-brand-gold font-bold uppercase tracking-widest text-xs hover:gap-4 transition-all">
          Informasi Milad <ChevronRight size={16} />
        </a>
      </div>

      <div className="grid md:grid-cols-3 gap-10">
        {news.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-brand-gold/5"
          >
            <div className="aspect-[16/10] overflow-hidden relative">
              <img 
                src={item.imageUrl || "https://images.unsplash.com/photo-1518005020455-ec480746e38e?auto=format&fit=crop&q=80&w=800"} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute top-6 left-6 px-4 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-brand-dark uppercase tracking-widest">
                {format(parseISO(item.date), 'dd MMM yyyy', { locale: id })}
              </div>
              
              {/* Optional: View count badge on image */}
              <div className="absolute top-6 right-6 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                <Eye size={10} />
                {item.views || 0}
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-serif font-bold text-brand-dark mb-4 leading-tight group-hover:text-brand-gold transition-colors">
                {item.title}
              </h3>
              <p className="text-brand-dark/60 text-sm leading-relaxed line-clamp-3 mb-6">
                {item.content}
              </p>
              <button 
                onClick={() => onReadMore(item)}
                className="text-brand-gold font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:gap-3 transition-all"
              >
                Baca Selengkapnya <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}
        
        {news.length === 0 && (
          <div className="md:col-span-3 py-20 text-center border-2 border-dashed border-brand-gold/10 rounded-[40px] text-brand-dark/30">
            Belum ada berita terbaru.
          </div>
        )}
      </div>
    </div>
  );
}
