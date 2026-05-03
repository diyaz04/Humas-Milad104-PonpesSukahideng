import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Share2, ArrowLeft, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { News } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface NewsDetailProps {
  news: News;
  onClose: () => void;
}

export default function NewsDetail({ news, onClose }: NewsDetailProps) {
  useEffect(() => {
    const incrementViews = async () => {
      try {
        const newsRef = doc(db, 'news', news.id);
        await updateDoc(newsRef, {
          views: increment(1)
        });
      } catch (error) {
        console.error("Error incrementing views:", error);
      }
    };

    incrementViews();
  }, [news.id]);

  const shareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?news=${news.id}`;
    if (navigator.share) {
      navigator.share({
        title: news.title,
        text: news.content.substring(0, 100) + '...',
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert("Link berita telah disalin ke clipboard!");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-brand-cream overflow-y-auto"
    >
      {/* Header Navigation */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-brand-cream/80 backdrop-blur-md border-b border-brand-gold/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-brand-dark/60 hover:text-brand-dark transition-all font-bold uppercase tracking-widest text-xs"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          
          <button 
            onClick={shareLink}
            className="flex items-center gap-2 bg-brand-gold text-brand-dark px-4 py-2 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-brand-lightgold transition-all"
          >
            <Share2 size={14} /> Bagikan
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-wrap items-center gap-6 mb-6">
            <div className="flex items-center gap-3 text-brand-gold font-bold uppercase tracking-widest text-xs">
              <Calendar size={14} />
              {format(parseISO(news.date), 'eeee, dd MMMM yyyy', { locale: id })}
            </div>
            
            <div className="flex items-center gap-2 text-brand-dark/40 font-bold uppercase tracking-widest text-xs">
              <Eye size={14} />
              {news.views || 0} Dilihat
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-brand-dark mb-8 leading-tight">
            {news.title}
          </h1>

          {news.images && news.images.length > 0 ? (
            <div className={`grid gap-4 mb-12 ${news.images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {news.images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`aspect-video rounded-[32px] overflow-hidden shadow-xl border-4 border-white ${news.images!.length === 3 && idx === 0 ? 'md:col-span-2' : ''}`}
                >
                  <img 
                    src={img} 
                    alt={`${news.title} ${idx + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : news.imageUrl && (
            <div className="aspect-video w-full rounded-[40px] overflow-hidden mb-12 shadow-2xl border-4 border-white">
              <img 
                src={news.imageUrl} 
                alt={news.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="prose prose-lg max-w-none text-brand-dark/75 leading-relaxed font-light">
            {news.content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-6">{paragraph}</p>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Decorative Ornaments */}
      <div className="fixed bottom-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl z-0 pointer-events-none" />
      <div className="fixed top-0 left-0 w-48 h-48 bg-brand-forest/5 rounded-full blur-3xl z-0 pointer-events-none" />
    </motion.div>
  );
}
