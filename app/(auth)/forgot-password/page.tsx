'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Mail, Loader2, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col gap-6">

        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Zap size={22} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Şifremi Unuttum</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {sent ? 'E-postanı kontrol et' : 'Sıfırlama bağlantısı gönderelim'}
            </p>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Bağlantı gönderildi!</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                <span className="font-medium text-slate-600">{email}</span> adresine şifre sıfırlama bağlantısı gönderdik. Spam klasörünü de kontrol et.
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition-colors"
            >
              Farklı e-posta dene
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">E-posta Adresi</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="ornek@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 rounded-full text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 mt-1"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </form>
          </>
        )}

        <Link href="/login" className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={12} /> Giriş sayfasına dön
        </Link>
      </div>
    </div>
  );
}