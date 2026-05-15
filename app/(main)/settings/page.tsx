'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  User, Mail, Lock, Bell, Shield, Trash2, LogOut,
  ChevronRight, Check, Loader2, Eye, EyeOff, X,
  AlertTriangle, Smartphone, Globe,
} from 'lucide-react';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  role: string;
  email_notifications: boolean;
  push_notifications: boolean;
  is_pro: boolean;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
      {children}
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="px-6 py-4 border-b border-slate-50">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
    </div>
  );
}

function SettingRow({ icon: Icon, label, desc, children, danger }: {
  icon: any; label: string; desc?: string; children?: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-50' : 'bg-slate-50'}`}>
        <Icon size={16} className={danger ? 'text-red-500' : 'text-slate-400'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? 'text-red-600' : 'text-slate-800'}`}>{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${value ? 'bg-blue-500' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function DeleteModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.93, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-900">Hesabı Sil</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tüm etkinlikler, katılımlar ve veriler kalıcı olarak silinir. Bu işlem geri alınamaz.
            </p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            İptal
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-full text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Sil
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setEmail(user.email || '');
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setBio(data.bio || '');
        setEmailNotif(data.email_notifications ?? true);
        setPushNotif(data.push_notifications ?? false);
      }
      setLoading(false);
    })();
  }, []);

  const saveProfile = async () => {
    if (!profile) return;
    setSaveLoading(true);
    const { error } = await supabase.from('profiles').update({
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      bio: bio.trim() || null,
    }).eq('id', profile.id);
    setSaveLoading(false);
    if (error) { toast.error('Kayıt başarısız.'); return; }
    toast.success('Profil güncellendi.');
  };

  const saveNotifications = async () => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({
      email_notifications: emailNotif,
      push_notifications: pushNotif,
    }).eq('id', profile.id);
    if (error) toast.error('Kaydedilemedi.');
    else toast.success('Bildirim tercihleri güncellendi.');
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error('Şifre en az 6 karakter olmalı.'); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Şifre güncellendi.');
    setNewPassword('');
    setShowPwForm(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut();
    toast.success('Hesap silindi.');
    router.push('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center">
      <Loader2 size={22} className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7f9]">
      <div className="px-5 md:px-10 py-8 max-w-2xl mx-auto w-full flex flex-col gap-6">

        {/* Header */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">EtkinRota</p>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Ayarlar</h1>
          <p className="text-sm text-slate-400 mt-0.5">Hesap ve tercih yönetimi.</p>
        </div>

        {/* Profil Bilgileri */}
        <SectionCard>
          <SectionHeader title="Profil Bilgileri" desc="Ad, soyad ve kısa biyografi." />
          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Ad</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Adınız"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Soyad</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder="Soyadınız"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Biyografi</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                placeholder="Kendinizden kısaca bahsedin..."
                style={{ resize: 'none' }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-slate-600">
                  {(firstName?.charAt(0) || profile?.id?.charAt(0) || '?').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {[firstName, lastName].filter(Boolean).join(' ') || 'İsimsiz Kullanıcı'}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">{profile?.role === 'organizer' ? 'Organizatör' : 'Katılımcı'}</p>
              </div>
              {profile?.is_pro && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-200">PRO</span>
              )}
            </div>
            <button onClick={saveProfile} disabled={saveLoading}
              className="self-end flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
              {saveLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Kaydet
            </button>
          </div>
        </SectionCard>

        {/* Hesap */}
        <SectionCard>
          <SectionHeader title="Hesap" desc="E-posta ve şifre yönetimi." />
          <div className="divide-y divide-slate-50">
            <SettingRow icon={Mail} label="E-posta" desc={email}>
              <span className="text-xs text-slate-400 font-medium shrink-0">Değiştirilemez</span>
            </SettingRow>
            <div>
              <div
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => setShowPwForm((v) => !v)}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">Şifre</p>
                  <p className="text-xs text-slate-400 mt-0.5">Hesap şifreni değiştir</p>
                </div>
                <ChevronRight size={16} className={`text-slate-300 transition-transform ${showPwForm ? 'rotate-90' : ''}`} />
              </div>
              <AnimatePresence>
                {showPwForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 flex flex-col gap-3">
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Yeni şifre (min. 6 karakter)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                        />
                        <button onClick={() => setShowNewPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <button onClick={changePassword} disabled={pwLoading || !newPassword}
                        className="self-end flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                        {pwLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Güncelle
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </SectionCard>

        {/* Bildirimler */}
        <SectionCard>
          <SectionHeader title="Bildirimler" />
          <div className="divide-y divide-slate-50">
            <SettingRow icon={Mail} label="E-posta Bildirimleri" desc="Etkinlik hatırlatmaları ve güncellemeler">
              <Toggle value={emailNotif} onChange={(v) => { setEmailNotif(v); saveNotifications(); }} />
            </SettingRow>
            <SettingRow icon={Smartphone} label="Push Bildirimleri" desc="Anlık uygulama bildirimleri">
              <Toggle value={pushNotif} onChange={(v) => { setPushNotif(v); saveNotifications(); }} />
            </SettingRow>
          </div>
        </SectionCard>

        {/* Gizlilik */}
        <SectionCard>
          <SectionHeader title="Gizlilik & Güvenlik" />
          <div className="divide-y divide-slate-50">
            <SettingRow icon={Globe} label="Profil Görünürlüğü" desc="Profilin herkese açık">
              <span className="text-xs font-semibold text-slate-400">Herkese Açık</span>
            </SettingRow>
            <SettingRow icon={Shield} label="Veri Gizliliği" desc="Kişisel veri kullanım tercihleri">
              <ChevronRight size={15} className="text-slate-300" />
            </SettingRow>
          </div>
        </SectionCard>

        {/* Oturum & Hesap */}
        <SectionCard>
          <SectionHeader title="Oturum & Hesap" />
          <div className="divide-y divide-slate-50">
            <button onClick={handleLogout} className="w-full">
              <SettingRow icon={LogOut} label="Çıkış Yap" desc="Tüm cihazlarda oturumu kapat">
                <ChevronRight size={15} className="text-slate-300" />
              </SettingRow>
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="w-full">
              <SettingRow icon={Trash2} label="Hesabı Sil" desc="Tüm verilerini kalıcı olarak sil" danger>
                <ChevronRight size={15} className="text-red-200" />
              </SettingRow>
            </button>
          </div>
        </SectionCard>

        {/* Version */}
        <p className="text-center text-[11px] text-slate-300 font-medium pb-4">
          EtkinRota v1.0.0 — MVP
        </p>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteModal onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} loading={deleteLoading} />
        )}
      </AnimatePresence>
    </div>
  );
}