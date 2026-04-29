import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ScheduleItem } from '../../types';
import { Plus, Trash2, Edit2, Search, AlertCircle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface JadwalPanelProps {
  schedule: ScheduleItem[];
}

export default function JadwalPanel({ schedule }: JadwalPanelProps) {
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ScheduleItem>>({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    category: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, 'schedule', editingId), form);
      setEditingId(null);
    } else {
      await addDoc(collection(db, 'schedule'), form);
    }
    setForm({ name: '', date: '', startTime: '', endTime: '', location: '', description: '', category: '' });
  };

  const confirmDeleteItem = async () => {
    if (deleteItemId) {
      await deleteDoc(doc(db, 'schedule', deleteItemId));
      setDeleteItemId(null);
    }
  };

  const editItem = (item: ScheduleItem) => {
    setForm(item);
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-2xl font-serif font-bold text-brand-dark mb-8 border-b pb-4">
          {editingId ? 'Edit Agenda' : 'Tambah Agenda Baru'}
        </h3>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Nama Kegiatan</label>
            <input 
              type="text" 
              required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Kategori</label>
            <input 
              type="text" 
              placeholder="e.g. Utama, Olahraga, Keagamaan"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Tanggal</label>
            <input 
              type="date" 
              required
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Jam Mulai</label>
            <input 
              type="time" 
              required
              value={form.startTime}
              onChange={e => setForm({...form, startTime: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Jam Selesai</label>
            <input 
              type="time" 
              required
              value={form.endTime}
              onChange={e => setForm({...form, endTime: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Lokasi</label>
            <input 
              type="text" 
              required
              value={form.location}
              onChange={e => setForm({...form, location: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Deskripsi</label>
            <textarea 
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold h-24"
            />
          </div>
          <div className="md:col-span-3 flex gap-4">
            <button 
              type="submit"
              className="flex-grow bg-brand-dark text-brand-gold py-4 rounded-xl font-bold uppercase tracking-widest"
            >
              {editingId ? 'Simpan Update' : 'Tambah ke Jadwal'}
            </button>
            {editingId && (
              <button 
                type="button"
                onClick={() => { setEditingId(null); setForm({}); }}
                className="px-8 border-2 border-slate-100 rounded-xl text-slate-400 font-bold uppercase text-xs"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-2xl font-serif font-bold text-brand-dark">Agenda Terdaftar</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input type="text" placeholder="Cari agenda..." className="pl-10 pr-4 py-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 ring-brand-gold" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              <tr>
                <th className="px-8 py-4">Nama Kegiatan</th>
                <th className="px-8 py-4">Waktu</th>
                <th className="px-8 py-4">Lokasi</th>
                <th className="px-8 py-4">Kategori</th>
                <th className="px-8 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {schedule.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 font-bold text-brand-dark">{item.name}</td>
                  <td className="px-8 py-6 text-sm">
                    <div className="text-slate-600 font-bold">{item.date}</div>
                    <div className="text-slate-400 text-xs">{item.startTime} - {item.endTime}</div>
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-500">{item.location}</td>
                  <td className="px-8 py-6 text-sm">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{item.category}</span>
                  </td>
                  <td className="px-8 py-6 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => editItem(item)} className="p-2 text-brand-forest hover:bg-brand-forest/5 rounded-lg transition-all"><Edit2 size={18} /></button>
                      <button onClick={() => setDeleteItemId(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteItemId !== null}
        onClose={() => setDeleteItemId(null)}
        onConfirm={confirmDeleteItem}
        title="Hapus Agenda?"
        message="Apakah Anda yakin ingin menghapus agenda kegiatan ini? Data ini akan hilang dari jadwal umum."
      />
    </div>
  );
}
