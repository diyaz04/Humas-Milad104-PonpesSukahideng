import React, { useState } from 'react';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FAQ } from '../../types';
import { Plus, Trash2, MessageSquare, Save } from 'lucide-react';

interface FAQPanelProps {
  faqs: FAQ[];
}

export default function FAQPanel({ faqs }: FAQPanelProps) {
  const [form, setForm] = useState({
    question: '',
    answer: '',
    order: 0
  });

  const addFaq = async () => {
    if (!form.question || !form.answer) return;
    await addDoc(collection(db, 'faqs'), {
      ...form,
      order: faqs.length
    });
    setForm({ question: '', answer: '', order: 0 });
  };

  const deleteFaq = async (id: string) => {
    if (confirm("Hapus pertanyaan ini?")) {
      await deleteDoc(doc(db, 'faqs', id));
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <h3 className="text-2xl font-serif font-bold text-brand-dark mb-8 border-b pb-4 flex items-center gap-3">
        <MessageSquare className="text-brand-gold" /> Tanya Jawab (Chatbot)
      </h3>
      
      <div className="space-y-6 mb-12">
        <div className="grid gap-4">
          <input 
            type="text" 
            placeholder="Pertanyaan (Contoh: Kapan acara dimulai?)" 
            value={form.question}
            onChange={e => setForm({...form, question: e.target.value})}
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
          />
          <textarea 
            placeholder="Jawaban Admin" 
            value={form.answer}
            onChange={e => setForm({...form, answer: e.target.value})}
            className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold h-24"
          />
          <button 
            onClick={addFaq}
            className="bg-brand-gold text-brand-dark py-3 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Tambah Tanya Jawab
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Daftar Tanya Jawab Aktif</h4>
        {faqs.sort((a,b) => a.order - b.order).map((faq) => (
          <div key={faq.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-start gap-4">
            <div className="flex-grow">
              <p className="font-bold text-brand-dark mb-1">Q: {faq.question}</p>
              <p className="text-sm text-brand-dark/60 italic leading-relaxed">A: {faq.answer}</p>
            </div>
            <button 
              onClick={() => deleteFaq(faq.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {faqs.length === 0 && (
          <p className="text-center py-8 text-slate-400 italic">Belum ada tanya jawab yang diatur.</p>
        )}
      </div>
    </div>
  );
}
