'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, Loader2, Zap } from 'lucide-react';

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError('E-posta veya şifre hatalı.'); return; }
    router.push(redirectTo);
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Etkinlik Hub</h1>
            <p className="text-sm text-slate-400 mt-0.5">Hesabına giriş yap</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="email" required placeholder="E-posta" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className={inputCls} />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type={showPw ? 'text' : 'password'} required placeholder="Şifre" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className={`${inputCls} pr-11`} />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
              Şifremi unuttum
            </Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-full text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : 'Giriş Yap'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Hesabın yok mu?{' '}
          <Link href="/register" className="font-bold text-blue-500 hover:text-blue-700 transition-colors">Kayıt Ol</Link>
        </p>

        <Link href="/" className="text-center text-xs text-slate-300 hover:text-slate-500 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}

// useSearchParams() Next.js 16'da Suspense sınırı içinde olmalı
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}