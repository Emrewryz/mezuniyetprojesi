'use client';

import React, { useState, FormEvent, ChangeEvent } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // <-- Supabase Bağlantısı

export default function Login() {
  const router = useRouter();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Supabase Email & Password ile giriş
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error("E-posta veya şifre hatalı.");
      }

      // Başarılı olursa Dashboard'a yönlendir
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || "Giriş yapılırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Sol Kolon: Görsel */}
        <div className="hidden md:block md:w-1/2 relative bg-slate-100">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-90 mix-blend-multiply z-10" />
          <img
            src="/images/girisSayfasi.png" // Kendi resim yolunu kontrol et
            alt="Etkinlik Hub"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 text-white">
            <h2 className="text-3xl font-black mb-4">Maceraya<br/>Kaldığın Yerden<br/>Devam Et.</h2>
            <p className="text-white/80">Seni bekleyen yüzlerce etkinlik var.</p>
          </div>
        </div>

        {/* Sağ Kolon: Form */}
        <div className="w-full md:w-1/2 px-8 py-12 md:px-14 md:py-16 flex flex-col justify-center">
          <div className="mb-8">
            <Link href="/" className="text-blue-600 text-lg font-extrabold tracking-tight block mb-2 hover:opacity-80">
              Etkinlik Hub
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">Hoş Geldiniz</h1>
            <p className="text-slate-500 text-sm">Hesabınıza giriş yaparak etkinlikleri keşfedin.</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-posta Adresi</label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  disabled={loading}
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Şifre</label>
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Şifremi Unuttum</a>
              </div>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl py-3.5 px-6 font-bold text-white text-sm flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Giriş Yap"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}