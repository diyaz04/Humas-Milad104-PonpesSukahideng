import React, { useState } from 'react';
import { doc, setDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Setting, News, FAQ } from '../../types';
import { Plus, Trash2, Edit2, Check, Save } from 'lucide-react';
import FAQPanel from './FAQPanel';

interface MiladPanelProps {
  settings: Setting | null;
  news: News[];
  faqs: FAQ[];
}

export default function MiladPanel({ settings, news, faqs }: MiladPanelProps) {
  const [localSettings, setLocalSettings] = useState<Setting>(settings || {
    heroTitle: '',
    heroTagline: '',
    countdownDate: '',
    aboutTitle: '',
    aboutText: ''
  });

  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: ''
  });

  const saveSettings = async () => {
    await setDoc(doc(db, 'settings', 'general'), localSettings);
    alert("Pengaturan tersimpan!");
  };

  const addNews = async () => {
    if (!newsForm.title || !newsForm.content) return;
    await addDoc(collection(db, 'news'), {
      ...newsForm,
      date: new Date(newsForm.date).toISOString()
    });
    setNewsForm({ title: '', content: '', date: new Date().toISOString().split('T')[0], imageUrl: '' });
  };

  const deleteNews = async (id: string) => {
    if (confirm("Hapus berita ini?")) {
      await deleteDoc(doc(db, 'news', id));
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-2xl font-serif font-bold text-brand-dark mb-8 border-b pb-4">Pengaturan Landing Page</h3>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Judul Hero</label>
            <input 
              type="text" 
              value={localSettings.heroTitle} 
              onChange={e => setLocalSettings({...localSettings, heroTitle: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-gold outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Tagline</label>
            <textarea 
              value={localSettings.heroTagline} 
              onChange={e => setLocalSettings({...localSettings, heroTagline: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-gold outline-none h-24"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Tanggal Countdown (ISO Format)</label>
            <input 
              type="datetime-local" 
              value={localSettings.countdownDate.substring(0,16)} 
              onChange={e => setLocalSettings({...localSettings, countdownDate: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-gold outline-none"
            />
          </div>
          <div className="pt-4">
            <h4 className="font-serif font-bold text-lg mb-4">Bagian Tentang Milad</h4>
            <div className="space-y-4">
              <input 
                type="text" 
                value={localSettings.aboutTitle} 
                onChange={e => setLocalSettings({...localSettings, aboutTitle: e.target.value})}
                placeholder="Judul Tentang"
                className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-gold outline-none"
              />
              <textarea 
                value={localSettings.aboutText} 
                onChange={e => setLocalSettings({...localSettings, aboutText: e.target.value})}
                placeholder="Isi Teks Tentang"
                className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-gold outline-none h-40"
              />
            </div>
          </div>
          <button 
            onClick={saveSettings}
            className="w-full bg-brand-dark text-brand-gold py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Save size={18} /> Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-2xl font-serif font-bold text-brand-dark mb-8 border-b pb-4">Tambah Berita</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Judul Berita" 
              value={newsForm.title}
              onChange={e => setNewsForm({...newsForm, title: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none"
            />
            <textarea 
              placeholder="Isi Berita" 
              value={newsForm.content}
              onChange={e => setNewsForm({...newsForm, content: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none h-32"
            />
            <input 
              type="date" 
              value={newsForm.date}
              onChange={e => setNewsForm({...newsForm, date: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none"
            />
            <input 
              type="text" 
              placeholder="URL Gambar (opsional)" 
              value={newsForm.imageUrl}
              onChange={e => setNewsForm({...newsForm, imageUrl: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none"
            />
            <button 
              onClick={addNews}
              className="w-full bg-brand-gold text-brand-dark py-4 rounded-xl font-bold uppercase tracking-widest"
            >
              Publikasikan Berita
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-2xl font-serif font-bold text-brand-dark mb-6">Daftar Berita</h3>
          <div className="space-y-4">
            {news.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <div className="truncate pr-4">
                  <p className="font-bold text-brand-dark truncate">{item.title}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{new Date(item.date).toDateString()}</p>
                </div>
                <button 
                  onClick={() => deleteNews(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        <FAQPanel faqs={faqs} />
      </div>
    </div>
  );
}
