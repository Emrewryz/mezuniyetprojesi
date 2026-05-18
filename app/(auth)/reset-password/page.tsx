'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, Loader2, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase email linkinden gelen hash token'ı otomatik işler
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true);
    });
    // Zaten session varsa direkt göster
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return; }
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Zap size={22} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Yeni Şifre</h1>
            <p className="text-sm text-slate-400 mt-0.5">Hesabın için güçlü bir şifre belirle.</p>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Şifre güncellendi!</p>
              <p className="text-xs text-slate-400 mt-1">Dashboard'a yönlendiriliyorsun...</p>
            </div>
          </div>
        ) : (
          <>
            {!sessionReady && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Geçersiz veya süresi dolmuş link. Lütfen şifremi unuttum sayfasından tekrar talepte bulun.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Yeni Şifre</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="En az 6 karakter"
                    disabled={!sessionReady}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all disabled:opacity-50"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Şifreyi Tekrarla</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                    placeholder="Şifreyi tekrar gir"
                    disabled={!sessionReady}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all disabled:opacity-50"
                  />
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5">
                    <AlertCircle size={11} /> Şifreler eşleşmiyor
                  </p>
                )}
                {confirm && password === confirm && confirm.length >= 6 && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1.5">
                    <CheckCircle2 size={11} /> Şifreler eşleşiyor
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !sessionReady || password !== confirm || password.length < 6}
                className="w-full py-3 rounded-full text-sm font-bold text-white flex items-center justify-center gap-2 mt-1 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : 'Şifreyi Güncelle'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}