import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  variant = 'danger'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl z-20"
          >
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                variant === 'danger' ? 'bg-red-50 text-red-500' : 
                variant === 'warning' ? 'bg-orange-50 text-orange-500' : 
                'bg-blue-50 text-blue-500'
              }`}>
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="font-serif font-bold text-2xl text-slate-800 mb-3">{title}</h3>
              <p className="text-slate-500 leading-relaxed mb-8">{message}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors uppercase tracking-widest text-[10px]"
                >
                  {cancelLabel}
                </button>
                <button 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold text-white transition-all uppercase tracking-widest text-[10px] shadow-lg ${
                    variant === 'danger' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 
                    variant === 'warning' ? 'bg-orange-500 shadow-orange-500/20 hover:bg-orange-600' : 
                    'bg-brand-dark shadow-brand-dark/20 hover:bg-slate-800'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
