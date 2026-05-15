'use client';

import React, { useState, FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // <-- Supabase Bağlantısı

export default function Register() {
  const router = useRouter();
  
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Supabase'e kayıt isteği at (Metadata içine ad/soyad ekleyerek)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'participant', // Varsayılan rol
          }
        }
      });

      if (signUpError) throw signUpError;

      // Kayıt başarılı
      setSuccess("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Kayıt olurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row-reverse">
        
        {/* Sağ Kolon: Görsel */}
        <div className="hidden md:block md:w-1/2 relative bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-800 opacity-90 mix-blend-multiply z-10" />
          {/* Buraya uygun bir görsel koyabilirsin */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540039155732-d68a919385d8?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 text-white">
            <h2 className="text-3xl font-black mb-4">Topluluğa<br/>Katıl.</h2>
            <p className="text-white/80">Binlerce kişi yeni etkinlikler keşfetmek için burada.</p>
          </div>
        </div>

        {/* Sol Kolon: Form */}
        <div className="w-full md:w-1/2 px-8 py-12 md:px-14 md:py-16 flex flex-col justify-center">
          <div className="mb-8">
            <Link href="/" className="text-blue-600 text-lg font-extrabold tracking-tight block mb-2 hover:opacity-80">
              Etkinlik Hub
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">Hesap Oluştur</h1>
            <p className="text-slate-500 text-sm">Ücretsiz kayıt ol ve etkinlik dünyasına adım at.</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-semibold text-emerald-600">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ad</label>
                <div className="relative">
                  <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    disabled={loading}
                    placeholder="Adınız"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Soyad</label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  placeholder="Soyadınız"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                />
              </div>
            </div>

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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  minLength={6}
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              className="w-full mt-4 rounded-xl py-3.5 px-6 font-bold text-white text-sm flex items-center justify-center gap-2 transition-all bg-slate-900 hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Kayıt Ol"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}