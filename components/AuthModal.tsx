'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { X, Mail, Lock, Eye, EyeOff, Loader2, Zap, User } from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalCtx { open: () => void; close: () => void; }
const Ctx = createContext<AuthModalCtx>({ open: () => {}, close: () => {} });
export function useAuthModal() { return useContext(Ctx); }

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all";

type Mode = 'login' | 'register';

function ModalContent({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setEmail(''); setPassword(''); setFirstName(''); setLastName(''); setError(null); };

  const handleLogin = async () => {
    setLoading(true); setError(null);
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (e) { setError('E-posta veya şifre hatalı.'); return; }
    toast.success('Giriş başarılı!');
    onClose();
    window.location.reload();
  };

  const handleRegister = async () => {
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    setLoading(true); setError(null);
    const { data, error: e } = await supabase.auth.signUp({
      email, password,
      options: { data: { first_name: firstName.trim(), last_name: lastName.trim(), role: 'participant' } },
    });
    if (e) {
      setLoading(false);
      setError(e.message.includes('already registered') ? 'Bu e-posta zaten kayıtlı.' : e.message);
      return;
    }
    if (data.user) {
      await supabase.from('profiles').upsert([{
        id: data.user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        role: 'participant',
      }], { onConflict: 'id' });
    }
    setLoading(false);
    toast.success('Hesap oluşturuldu!');
    onClose();
    window.location.reload();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mode === 'login' ? handleLogin() : handleRegister();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900">EtkinRota</p>
            <p className="text-xs text-slate-400">{mode === 'login' ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Tab */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        {(['login', 'register'] as Mode[]).map((m) => (
          <button key={m} type="button"
            onClick={() => { setMode(m); reset(); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <AnimatePresence>
          {mode === 'register' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 pb-1">
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="text" required placeholder="Ad" value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
                </div>
                <input type="text" required placeholder="Soyad" value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="email" required placeholder="E-posta" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            className={inputCls} />
        </div>

        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type={showPw ? 'text' : 'password'} required
            placeholder={mode === 'register' ? 'Şifre (min. 6 karakter)' : 'Şifre'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            className={`${inputCls} pr-11`} />
          <button type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-full text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 mt-1"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
        </button>
      </form>

      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        Devam ederek{' '}
        <span className="text-slate-600 font-medium">Kullanım Koşulları</span>'nı kabul etmiş olursunuz.
      </p>
    </div>
  );
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[999]"
              onClick={close}
            />
            <motion.div key="modal"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 border border-slate-100 w-full max-w-sm p-6 pointer-events-auto">
                <ModalContent onClose={close} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}