'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, User, Loader2, Zap } from 'lucide-react';

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName.trim(), last_name: lastName.trim(), role: 'participant' },
      },
    });

    if (signUpError) {
      setLoading(false);
      if (signUpError.message.includes('already registered')) {
        setError('Bu e-posta zaten kayıtlı.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    // Profil manuel oluştur (trigger yoksa)
    if (data.user) {
      await supabase.from('profiles').upsert([{
        id: data.user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        role: 'participant',
      }], { onConflict: 'id' });
    }

    setLoading(false);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Zap size={22} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">EtkinRota</h1>
            <p className="text-sm text-slate-400 mt-0.5">Hesap oluştur, etkinlikleri keşfet</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="text" required placeholder="Ad" value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <input type="text" required placeholder="Soyad" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all" />
            </div>
          </div>

          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="email" required placeholder="E-posta" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className={inputCls} />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type={showPw ? 'text' : 'password'} required placeholder="Şifre (min. 6 karakter)"
              value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className={`${inputCls} pr-11`} />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-full text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 mt-1"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : 'Hesap Oluştur'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Zaten hesabın var mı?{' '}
          <Link href="/login" className="font-bold text-blue-500 hover:text-blue-700 transition-colors">Giriş Yap</Link>
        </p>

        <Link href="/" className="text-center text-xs text-slate-300 hover:text-slate-500 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}