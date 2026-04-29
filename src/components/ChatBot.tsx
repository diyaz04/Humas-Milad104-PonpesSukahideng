import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, Bot, ChevronRight } from 'lucide-react';
import { FAQ } from '../types';

interface ChatBotProps {
  faqs: FAQ[];
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatBot({ faqs }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Ahlan wa Sahlan! Saya Asisten Sukahideng. Ada yang bisa saya bantu seputar Milad ke-104?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleQuestionClick = (faq: FAQ) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text: faq.question,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);

    // Simulate thinking
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: faq.answer,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[60] bg-brand-dark text-brand-gold w-16 h-16 rounded-full shadow-2xl hover:scale-110 hover:bg-brand-forest transition-all border-4 border-brand-gold/20 flex items-center justify-center group"
      >
        <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-gold"></span>
        </span>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-6 right-6 md:bottom-28 md:right-10 z-[70] w-[calc(100vw-3rem)] md:w-96 h-[550px] bg-brand-cream rounded-[40px] shadow-3xl flex flex-col border border-brand-gold/20 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-dark p-6 flex justify-between items-center bg-islamic-pattern">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center text-brand-dark">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="text-brand-gold font-bold leading-none">Asisten Sukahideng</h3>
                  <p className="text-[10px] text-brand-gold/50 font-bold uppercase tracking-widest mt-1 italic">Online</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-brand-gold/50 hover:text-brand-gold transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.sender === 'bot' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'bot' 
                      ? 'bg-white text-brand-dark border border-brand-gold/5 rounded-tl-none' 
                      : 'bg-brand-gold text-brand-dark font-medium rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* FAQ Quick Links */}
            <div className="p-4 bg-slate-50 border-t border-brand-gold/10">
              <p className="text-[10px] text-brand-dark/40 font-bold uppercase tracking-widest mb-3 px-2">Pertanyaan Populer:</p>
              <div className="flex flex-col gap-2">
                {faqs.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => handleQuestionClick(faq)}
                    className="text-left text-xs bg-white border border-brand-gold/10 p-3 rounded-xl hover:bg-brand-gold/5 hover:border-brand-gold transition-all flex items-center justify-between group"
                  >
                    <span className="truncate pr-4">{faq.question}</span>
                    <ChevronRight size={14} className="text-brand-gold opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                  </button>
                ))}
                {faqs.length === 0 && (
                  <p className="text-xs text-brand-dark/30 italic text-center py-2">Belum ada pertanyaan terdaftar.</p>
                )}
              </div>
            </div>

            {/* Footer Text */}
            <div className="p-3 bg-brand-dark/5 text-center">
              <p className="text-[9px] text-brand-dark/30 font-bold uppercase tracking-tighter">Milad ke-104 Pesantren Sukahideng</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
