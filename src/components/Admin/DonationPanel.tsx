import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Heart, Check, X, Search, Trash2, Calendar, User, Wallet, Loader2 } from 'lucide-react';
import { Donation } from '../../types';
import ConfirmModal from './ConfirmModal';

export default function DonationPanel() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'donations'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Donation));
      setDonations(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'donations');
    });
    return unsubscribe;
  }, []);

  const handleUpdateStatus = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'donations', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'donations');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'donations', deleteId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'donations');
    }
  };

  const filteredDonations = donations.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.message?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalDonations = donations
    .filter(d => d.status === 'verified')
    .reduce((sum, current) => sum + current.amount, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-bold uppercase tracking-widest text-[10px]">Memuat Data Donasi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Terkumpul</p>
            <p className="text-2xl font-bold text-brand-dark">Rp {totalDonations.toLocaleString('id-ID')}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <Wallet size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Donatur</p>
            <p className="text-2xl font-bold text-brand-dark">{donations.filter(d => d.status === 'verified').length}</p>
          </div>
          <div className="w-12 h-12 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center">
            <Heart size={24} className="fill-brand-gold" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Menunggu Verifikasi</p>
            <p className="text-2xl font-bold text-orange-500">{donations.filter(d => d.status === 'pending').length}</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
            <Loader2 size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-brand-dark flex items-center gap-3">
              <Heart className="text-brand-gold" /> Daftar Donasi
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Pantau dan verifikasi setiap donasi yang masuk</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari donatur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-3 text-sm focus:ring-2 focus:ring-brand-gold/20 outline-none w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Donatur</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nominal</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDonations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-gold/5 flex items-center justify-center text-brand-gold font-bold">
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark">{d.name}</p>
                        {d.message && <p className="text-[10px] text-slate-400 italic mt-0.5">"{d.message}"</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-mono font-bold text-brand-dark">
                    Rp {d.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${
                      d.status === 'verified' ? 'bg-green-100 text-green-700' : 
                      d.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {d.status === 'verified' ? 'Terverifikasi' : 
                       d.status === 'rejected' ? 'Dibatalkan' : 
                       'Menunggu'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase">{new Date(d.timestamp).toLocaleDateString('id-ID')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(d.id, 'verified')}
                            className="p-2 bg-green-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/20 transition-all"
                            title="Setujui"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(d.id, 'rejected')}
                            className="p-2 bg-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all"
                            title="Tolak"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setDeleteId(d.id)}
                        className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDonations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic text-sm">
                    Tidak ada data donasi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Data Donasi"
        message="Apakah Anda yakin ingin menghapus data donasi ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
