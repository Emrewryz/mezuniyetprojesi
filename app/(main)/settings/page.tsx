'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import Image from "next/image";
import {
  Search,
  Bell,
  Heart,
  Save,
  Pencil,
  BellRing,
  ShieldCheck,
  Smartphone,
  Loader2
} from "lucide-react";

// Supabase import (Kendi dizinine göre ayarlarsın)
// import { supabase } from "@/lib/supabase";

// ── Top Header ────────────────────────────────
function TopHeader() {
  return (
    <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 md:px-10 py-4">
      {/* Mobile Title (Hidden on desktop) */}
      <span className="md:hidden text-lg font-black text-slate-800 tracking-tight">
        Ayarlar
      </span>

      {/* Desktop Center Title */}
      <div className="hidden md:flex flex-1 justify-center">
        <span className="text-sm font-bold text-slate-700 tracking-wide">
          Hesap Tercihleri
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Ara..."
            className="bg-white border border-slate-200 rounded-full py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-200 w-48 focus:w-64 transition-all duration-300"
          />
        </div>
        <button className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors">
          <Heart className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

// ── Mini Toggle (Switch) Component ────────────
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
  return (
    <div
      onClick={onChange}
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </div>
  );
};

export default function SettingsPage() {
  // ── State Yönetimi ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error' | null, text: string }>({ type: null, text: '' });
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [isPro, setIsPro] = useState(false);
  
  const [avatarUrl, setAvatarUrl] = useState("https://i.pravatar.cc/250?img=5");
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Veri Çekme (Simülasyon) ──
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // GERÇEK SUPABASE SORGUSU BURAYA GELECEK:
        /*
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setFirstName(profile.first_name || "");
          setLastName(profile.last_name || "");
          setEmail(user.email || "");
          setBio(profile.bio || "");
          setEmailNotif(profile.email_notifications);
          setPushNotif(profile.push_notifications);
          setIsPro(profile.is_pro);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }
        */

        // Simüle edilmiş veri
        setTimeout(() => {
          setFirstName("Belinay");
          setLastName("Özcan");
          setEmail("belinay@example.com");
          setBio("Dijital sanat ve teknoloji etkinliklerine ilgi duyuyorum. Hafta sonları atölye çalışmalarına katılmayı severim.");
          setEmailNotif(true);
          setPushNotif(false);
          setIsPro(true);
          setLoading(false);
        }, 800);

      } catch (error) {
        console.error("Profil bilgileri çekilirken hata:", error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ── Profil Fotoğrafı Seçme ──
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setNewAvatarFile(file);
      // Önizleme için URL oluşturuyoruz
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  // ── Veri Kaydetme ──
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage({ type: null, text: '' });
    
    try {
      // GERÇEK SUPABASE GÜNCELLEMESİ BURAYA GELECEK:
      /*
      const { data: { user } } = await supabase.auth.getUser();
      
      let uploadedAvatarUrl = avatarUrl;
      
      // Eğer yeni bir fotoğraf seçildiyse storage'a yükle
      if (newAvatarFile) {
        const fileExt = newAvatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, newAvatarFile);
          
        if (!uploadError) {
          uploadedAvatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          bio: bio,
          email_notifications: emailNotif,
          push_notifications: pushNotif,
          avatar_url: uploadedAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      */

      // Simülasyon gecikmesi
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setSaveMessage({ type: 'success', text: 'Değişiklikler başarıyla kaydedildi.' });
      
      // Mesajı 3 saniye sonra gizle
      setTimeout(() => setSaveMessage({ type: null, text: '' }), 3000);

    } catch (error) {
      console.error("Kaydetme hatası:", error);
      setSaveMessage({ type: 'error', text: 'Kaydedilirken bir hata oluştu.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <TopHeader />

      <main className="max-w-5xl mx-auto px-4 md:px-10 py-8 md:py-12">
        {/* Page Heading */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
              Ayarlar
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Profilinizi, bildirimlerinizi ve gizlilik tercihlerinizi yönetin.
            </p>
          </div>
          
          {/* Başarı/Hata Mesajı */}
          {saveMessage.type && (
            <div className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-2 ${
              saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {saveMessage.text}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── SOL SÜTUN (Formlar) ── */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Kişisel Bilgiler Kartı */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Kişisel Bilgiler</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ad */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Ad
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                  </div>
                  {/* Soyad */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Soyad
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>

                {/* E-posta */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    E-Posta Adresi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-500 cursor-not-allowed transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">E-posta adresi değiştirilemez.</p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Hakkımda (BİO)
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Kaydet Butonu */}
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all duration-200 disabled:opacity-70 disabled:active:scale-100"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── SAĞ SÜTUN (Widget'lar) ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Profil Görünümü Kartı */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
              {/* Hafif Arka Plan Parıltısı */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl"></div>
              
              <div className="relative mb-5 group">
                <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500">
                  <div className="w-full h-full rounded-full border-4 border-white overflow-hidden relative bg-slate-200">
                    <Image 
                      src={avatarUrl} 
                      alt="Profil Resmi" 
                      fill 
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
                {/* Düzenle İkonu & Gizli Input */}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2">{firstName} {lastName}</h3>
              {isPro && (
                <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  PRO Üye
                </div>
              )}
            </div>

            {/* Bildirim Ayarları Kartı */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-5">
                <BellRing className="w-4 h-4 text-blue-500" />
                Bildirimler
              </h3>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">E-posta Bildirimleri</p>
                    <p className="text-xs text-slate-400 mt-0.5">Haftalık bülten ve özetler.</p>
                  </div>
                  <ToggleSwitch checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Anlık Bildirimler</p>
                    <p className="text-xs text-slate-400 mt-0.5">Etkinlik hatırlatıcıları (Push).</p>
                  </div>
                  <ToggleSwitch checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} />
                </div>
              </div>
            </div>

            {/* Güvenlik & Gizlilik (Ekstra) */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Güvenlik
              </h3>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors group mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-700">İki Adımlı Doğrulama</p>
                    <p className="text-xs text-slate-400">Şu an kapalı</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600">Aç</span>
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}