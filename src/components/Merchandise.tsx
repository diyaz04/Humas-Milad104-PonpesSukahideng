import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ArrowRight, X, Package, CreditCard, Send, CheckCircle2, ChevronRight, Copy, Camera } from 'lucide-react';
import { Product, ProductOrder, MerchantConfig } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

interface MerchandiseProps {
  products: Product[];
}

type OrderStep = 'details' | 'payment-instruction' | 'payment-proof' | 'success';

export default function Merchandise({ products }: MerchandiseProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentStep, setCurrentStep] = useState<OrderStep>('details');
  const [orderCode, setOrderCode] = useState('');
  const [bankConfig, setBankConfig] = useState<MerchantConfig | null>(null);
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerContact: '',
    address: '',
    quantity: 1,
    paymentProof: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  useEffect(() => {
    const fetchBank = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'merchant_config'));
        if (snap.exists()) {
          setBankConfig(snap.data() as MerchantConfig);
        } else {
          console.warn('Bank configuration not found');
        }
      } catch (error) {
        console.error('Error fetching bank config:', error);
      }
    };
    fetchBank();
  }, [selectedProduct]); // Refetch when product is selected to ensure fresh data

  const activeProducts = products.filter(p => p.isActive);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      
      // Image Compression Logic
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 0.7 quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setOrderData({ ...orderData, paymentProof: compressedDataUrl });
      };
    };
    reader.readAsDataURL(file);
  };

  const generateOrderCode = () => {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `MLD-${random}`;
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('payment-instruction');
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return;

    setStatus('loading');
    try {
      const code = generateOrderCode();
      const order: Partial<ProductOrder> = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        customerName: orderData.customerName,
        customerContact: orderData.customerContact,
        address: orderData.address,
        quantity: orderData.quantity,
        totalPrice: selectedProduct.price * orderData.quantity,
        paymentProof: orderData.paymentProof,
        status: 'pending',
        timestamp: new Date().toISOString(),
        orderCode: code
      };

      await addDoc(collection(db, 'productOrders'), order);
      setOrderCode(code);
      setCurrentStep('success');
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setCurrentStep('details');
    setOrderData({ customerName: '', customerContact: '', address: '', quantity: 1, paymentProof: '' });
    setOrderCode('');
  };

  return (
    <div id="merchandise" className="scroll-mt-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 px-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 text-brand-gold font-bold uppercase tracking-[0.3em] text-[10px] mb-4">
            <ShoppingBag size={14} /> 
            Official Store
          </div>
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-slate-800 leading-tight mb-8">
            Merchandise <br />
            <span className="text-brand-gold italic">Milad ke-104</span>
          </h2>
          <p className="text-slate-500 text-lg font-light leading-relaxed">
            Miliki kenang-kenangan eksklusif Milad ke-104 Pondok Pesantren Sukahideng. Koleksi terbatas melalui sistem Pre-Order. 
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-6">
        {activeProducts.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white rounded-[40px] overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all"
          >
            <div className="aspect-square bg-slate-50 relative overflow-hidden">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <Package size={64} />
                    </div>
                )}
                <div className="absolute top-4 right-4 bg-brand-gold text-brand-dark px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest">
                    Pre-Order
                </div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">{product.name}</h3>
              <p className="text-slate-400 text-sm mb-6 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-mono font-bold text-brand-gold">Rp {product.price.toLocaleString()}</span>
                <button 
                  onClick={() => setSelectedProduct(product)}
                  className="w-12 h-12 bg-brand-dark text-brand-gold rounded-2xl flex items-center justify-center group-hover:bg-brand-gold group-hover:text-brand-dark transition-all"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {activeProducts.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 italic">Belum ada produk merchandise yang tersedia saat ini.</p>
            </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[96vh] md:max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-8 h-8 md:w-10 md:h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-400 hover:text-brand-gold transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-full md:w-1/2 bg-slate-50 flex items-center justify-center h-32 sm:h-48 md:h-auto">
                {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                    <Package size={60} className="text-slate-200" />
                )}
              </div>

              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
                <AnimatePresence mode="wait">
                  {currentStep === 'details' && (
                    <motion.div 
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col h-full"
                    >
                        <div className="mb-4 md:mb-8">
                            <div className="flex items-center gap-2 text-brand-gold font-bold uppercase tracking-widest text-[8px] md:text-[10px] mb-1 md:mb-2">
                                <Package size={12} /> Form Pemesanan
                            </div>
                            <h3 className="text-xl md:text-3xl font-serif font-bold text-slate-800 mb-1 md:mb-2 line-clamp-1">{selectedProduct.name}</h3>
                            <p className="text-lg md:text-2xl font-mono font-bold text-brand-gold">Rp {selectedProduct.price.toLocaleString()}</p>
                        </div>

                        <form onSubmit={handleNextToPayment} className="space-y-3 md:space-y-4 flex-grow">
                            <div>
                                <label className="block text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 md:mb-2 ml-1">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    required
                                    value={orderData.customerName}
                                    onChange={e => setOrderData({ ...orderData, customerName: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:border-brand-gold transition-all text-sm"
                                    placeholder="Nama Anda..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div>
                                    <label className="block text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 md:mb-2 ml-1">Kontak WA</label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={orderData.customerContact}
                                        onChange={e => setOrderData({ ...orderData, customerContact: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:border-brand-gold transition-all text-sm"
                                        placeholder="0812..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 md:mb-2 ml-1">Jumlah</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        value={orderData.quantity}
                                        onChange={e => setOrderData({ ...orderData, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:border-brand-gold transition-all font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 md:mb-2 ml-1">Alamat Lengkap Pengiriman</label>
                                <textarea 
                                    required
                                    value={orderData.address}
                                    onChange={e => setOrderData({ ...orderData, address: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:border-brand-gold transition-all h-20 md:h-24 text-sm"
                                    placeholder="Sertakan Kelurahan, Kecamatan, Kab/Kota, Prov..."
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-brand-dark text-brand-gold py-4 md:py-5 rounded-2xl md:rounded-3xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-brand-dark/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-2 md:mt-4 text-sm"
                            >
                                Lanjut Pembayaran <ArrowRight size={18} />
                            </button>
                        </form>
                    </motion.div>
                  )}

                  {currentStep === 'payment-instruction' && (
                    <motion.div 
                      key="payment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col h-full text-center py-6"
                    >
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mb-4 md:mb-6 mx-auto">
                            <CreditCard size={24} className="md:size-[28px]" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-800 mb-1 md:mb-2">Instruksi Pembayaran</h3>
                        <p className="text-slate-500 text-[10px] md:text-sm mb-4 md:mb-8 leading-relaxed">
                            Mohon lakukan transfer sesuai total biaya di bawah ini. Harap membayar terlebih dahulu sebelum melanjutkan ke tahap konfirmasi.
                        </p>

                        <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-4 md:p-8 mb-4 md:mb-8 border border-slate-100">
                            <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1 md:mb-2">Total Transfer</span>
                            <div className="text-2xl md:text-3xl font-mono font-bold text-brand-dark mb-4 md:mb-6">
                                Rp {(selectedProduct.price * orderData.quantity).toLocaleString()}
                            </div>
                            
                            {!bankConfig ? (
                                <div className="p-4 md:p-8 text-center text-slate-400 italic text-[10px] md:text-xs">
                                    Memuat data rekening...
                                </div>
                            ) : (
                                <div className="space-y-3 md:space-y-4 text-left font-sans">
                                    <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-brand-gold/20 flex items-center justify-between">
                                        <div className="flex-grow">
                                            <span className="text-[7px] md:text-[8px] uppercase font-bold text-slate-400 block mb-0.5 md:mb-1">Nama Bank</span>
                                            <span className="font-bold text-xs md:text-sm text-brand-dark">{bankConfig.bankName}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[7px] md:text-[8px] uppercase font-bold text-slate-400 block mb-0.5 md:mb-1">Atas Nama</span>
                                            <span className="font-bold text-[9px] md:text-[10px] text-brand-dark uppercase">{bankConfig.accountName}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (bankConfig.accountNumber) {
                                                navigator.clipboard.writeText(bankConfig.accountNumber);
                                                alert('Nomor rekening disalin!');
                                            }
                                        }}
                                        className="w-full flex items-center justify-between p-3 md:p-4 bg-brand-dark text-white rounded-xl md:rounded-2xl group hover:bg-brand-gold hover:text-brand-dark transition-all"
                                    >
                                        <div className="text-left">
                                            <span className="text-[7px] md:text-[8px] uppercase font-bold text-white/50 group-hover:text-brand-dark/50 block mb-0.5 md:mb-1">Nomor Rekening (Klik Salin)</span>
                                            <span className="font-mono font-bold text-lg md:text-xl">{bankConfig.accountNumber}</span>
                                        </div>
                                        <Copy size={16} className="opacity-50 group-hover:opacity-100" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => {
                                if (!bankConfig) {
                                    alert('Mohon tunggu sebentar, data rekening sedang dimuat.');
                                    return;
                                }
                                setCurrentStep('payment-proof');
                            }}
                            className="w-full bg-brand-gold text-brand-dark py-4 md:py-5 rounded-2xl md:rounded-3xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-sm"
                        >
                            Saya Sudah Bayar <ChevronRight size={18} />
                        </button>
                        <button 
                            onClick={() => setCurrentStep('details')}
                            className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-4 md:mt-6 hover:text-brand-dark transition-colors"
                        >
                            Kembali Edit Pesanan
                        </button>
                    </motion.div>
                  )}

                  {currentStep === 'payment-proof' && (
                    <motion.div 
                      key="proof"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col h-full"
                    >
                        <div className="mb-4 md:mb-8">
                            <div className="flex items-center gap-2 text-brand-gold font-bold uppercase tracking-widest text-[8px] md:text-[10px] mb-1 md:mb-2">
                                <Camera size={12} /> Konfirmasi Pembayaran
                            </div>
                            <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-800">Lampirkan Bukti Transfer</h3>
                        </div>

                        <div className="space-y-4 md:space-y-6 flex-grow">
                            <p className="text-slate-500 text-[10px] md:text-sm leading-relaxed bg-brand-gold/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-brand-gold/10">
                                Harap pastikan foto bukti transfer terlihat jelas mencantumkan 
                                <span className="font-bold text-brand-dark"> nominal</span>, 
                                <span className="font-bold text-brand-dark"> tanggal</span>, dan 
                                <span className="font-bold text-brand-dark"> status berhasil</span>.
                            </p>

                            <div className="relative">
                                <label className="block text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 md:mb-2 ml-1">Unggah Bukti Pembayaran</label>
                                <label className="flex flex-col items-center justify-center w-full h-32 md:h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl md:rounded-3xl cursor-pointer hover:bg-slate-100 hover:border-brand-gold transition-all overflow-hidden group">
                                    {orderData.paymentProof ? (
                                        <img src={orderData.paymentProof} alt="Bukti" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <Camera className="w-8 h-8 md:w-10 md:h-10 text-slate-300 group-hover:text-brand-gold mb-2 transition-colors" />
                                            <p className="text-[10px] md:text-xs text-slate-400 font-medium">Klik untuk pilih foto bukti</p>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="hidden" 
                                        onChange={handleFileChange}
                                        required
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-3 md:space-y-4 mt-6 md:mt-8">
                            <button 
                                onClick={handleSubmit}
                                disabled={!orderData.paymentProof || status === 'loading'}
                                className="w-full bg-brand-dark text-brand-gold py-4 md:py-5 rounded-2xl md:rounded-3xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-brand-dark/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 text-sm"
                            >
                                {status === 'loading' ? 'Menyimpan...' : <>Selesaikan Pesanan <Package size={18} /></>}
                            </button>
                            <button 
                                onClick={() => setCurrentStep('payment-instruction')}
                                className="w-full py-2 text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest hover:text-brand-dark"
                            >
                                Lihat Ulang Instruksi Bayar
                            </button>
                        </div>
                    </motion.div>
                  )}

                  {currentStep === 'success' && (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center text-center py-10"
                    >
                        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[32px] flex items-center justify-center mb-8">
                            <CheckCircle2 size={48} />
                        </div>
                        <h3 className="text-3xl font-serif font-bold text-slate-800 mb-2">Pre-Order Berhasil!</h3>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm">
                            Pesanan Anda telah diterima. Harap <span className="font-bold text-brand-dark underline decoration-brand-gold decoration-2">SCREENSHOT / SIMPAN HALAMAN INI</span> sebagai bukti pengambilan produk.
                        </p>

                        <div className="w-full bg-brand-dark text-brand-gold p-8 rounded-[32px] mb-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-gold/60 block mb-2">Kode PO Unik Anda</span>
                            <div className="text-4xl font-mono font-bold tracking-tighter mb-4">{orderCode}</div>
                            <div className="h-px bg-brand-gold/20 w-full mb-4" />
                            <div className="flex justify-between items-center text-left">
                                <div>
                                    <span className="text-[8px] uppercase tracking-widest text-brand-gold/40 block">Pemesan</span>
                                    <span className="text-xs font-bold">{orderData.customerName}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[8px] uppercase tracking-widest text-brand-gold/40 block">Status</span>
                                    <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-full">Selesai Submit</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={resetForm}
                            className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                        >
                            Tutup & Selesai
                        </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
