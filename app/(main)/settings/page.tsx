'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  User, Mail, Lock, Bell, Shield, Trash2, LogOut, ChevronDown,
  ChevronRight, Check, Loader2, Eye, EyeOff, X, AlertTriangle,
  Smartphone, Globe, MapPin, Search, GraduationCap, Briefcase,
  PartyPopper, Dumbbell, Music2, Palette, Cpu, Leaf, UtensilsCrossed,
  Sparkles,
} from 'lucide-react';

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const TR_CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin',
  'Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale',
  'Çankırı','Çorum','Denizli','Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum',
  'Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Isparta','Mersin',
  'İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir','Kocaeli',
  'Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas',
  'Tekirdağ','Tokat','Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak',
  'Aksaray','Bayburt','Karaman','Kırıkkale','Batman','Şırnak','Bartın','Ardahan',
  'Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce',
];

const GOALS_META = [
  { value: 'learn',   label: 'Yeni Şeyler Öğrenmek',    icon: GraduationCap },
  { value: 'network', label: 'İş & Networking',           icon: Briefcase },
  { value: 'fun',     label: 'Eğlenmek & Sosyalleşmek',  icon: PartyPopper },
  { value: 'active',  label: 'Aktif & Sağlıklı Kalmak',  icon: Dumbbell },
];

const INTEREST_CATS = [
  { id: 'tech',    label: 'Teknoloji & Kariyer',  icon: Cpu,             subs: ['Yazılım','Girişimcilik','Pazarlama','Finans','Veri Bilimi','Yapay Zeka'] },
  { id: 'culture', label: 'Kültür & Sanat',       icon: Palette,         subs: ['Tiyatro','Fotoğrafçılık','Resim','Sinema','Edebiyat','Heykel'] },
  { id: 'music',   label: 'Müzik & Eğlence',      icon: Music2,          subs: ['Konser','Caz','Rock','Elektronik','Festival','Klasik Müzik'] },
  { id: 'nature',  label: 'Sağlık & Doğa',        icon: Leaf,            subs: ['Doğa Yürüyüşü','Kampçılık','Yoga','Meditasyon','Bisiklet','Tırmanış'] },
  { id: 'social',  label: 'Sosyal & Gastronomi',  icon: UtensilsCrossed, subs: ['Yemek Atölyesi','Kahve','Şarap Tadımı','Topluluk','Gastronomi'] },
];

type Tab = 'profile' | 'preferences' | 'notifications' | 'account';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'profile',       label: 'Profil',          icon: User },
  { key: 'preferences',   label: 'Tercihlerim',      icon: Sparkles },
  { key: 'notifications', label: 'Bildirimler',      icon: Bell },
  { key: 'account',       label: 'Hesap & Güvenlik', icon: Shield },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${value ? 'bg-blue-500' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// ─── City Combobox ────────────────────────────────────────────────────────────

function CityCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() =>
    query.trim() ? TR_CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())) : TR_CITIES,
    [query]
  );

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  return (
    <div ref={ref} className="relative">
      <div
  role="button"
  tabIndex={0}
  onClick={() => setOpen((v) => !v)}
  onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm text-left transition-all cursor-pointer ${
    open ? 'border-blue-400 bg-white' : value ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
  }`}
>
  <MapPin size={15} className={value ? 'text-blue-500' : 'text-slate-400'} />
  <span className={`flex-1 font-medium ${value ? 'text-blue-700' : 'text-slate-400'}`}>
    {value || 'Şehir seçin...'}
  </span>
  {value && (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(''); }}
      className="text-slate-400 hover:text-red-400 mr-1"
    >
      <X size={13} />
    </button>
  )}
  <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
</div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="İl ara..." className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0
                ? <p className="text-xs text-slate-400 text-center py-4">Sonuç bulunamadı.</p>
                : filtered.map((city) => (
                  <button key={city} type="button" onClick={() => { onChange(city); setQuery(''); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-left transition-colors hover:bg-blue-50 hover:text-blue-700 ${value === city ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>
                    {value === city && <Check size={12} className="text-blue-500 shrink-0" />}
                    {city}
                  </button>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab: Tercihlerim ─────────────────────────────────────────────────────────

function PreferencesTab({ userId }: { userId: string }) {
  const [city, setCity] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('city, goals, preferences').eq('id', userId).single();
      if (data) {
        setCity(data.city || '');
        setGoals(data.goals || []);
        setPreferences(data.preferences || []);
      }
      setLoading(false);
    })();
  }, [userId]);

  const toggleGoal = (v: string) => setGoals((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const togglePref = (v: string) => setPreferences((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ city: city.trim() || null, goals, preferences }).eq('id', userId);
    setSaving(false);
    if (error) { toast.error('Kayıt başarısız.'); return; }
    toast.success('Tercihler güncellendi!');
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={22} className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="flex flex-col gap-5">

      {/* Şehir */}
      <SectionCard>
        <div className="px-6 py-4 border-b border-slate-50">
          <p className="text-sm font-bold text-slate-900">Konum</p>
          <p className="text-xs text-slate-400 mt-0.5">Yakınındaki etkinlikler için kullanılır.</p>
        </div>
        <div className="px-6 py-4">
          <CityCombobox value={city} onChange={setCity} />
        </div>
      </SectionCard>

      {/* Hedefler */}
      <SectionCard>
        <div className="px-6 py-4 border-b border-slate-50">
          <p className="text-sm font-bold text-slate-900">Hedeflerim</p>
          <p className="text-xs text-slate-400 mt-0.5">Platformu nasıl kullanmak istiyorsun?</p>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {GOALS_META.map(({ value, label, icon: Icon }) => {
            const active = goals.includes(value);
            return (
              <button key={value} type="button" onClick={() => toggleGoal(value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all hover:scale-[1.01] ${
                  active ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                }`}>
                <Icon size={16} className={active ? 'text-blue-600' : 'text-slate-400'} />
                <span className={`text-sm font-semibold flex-1 ${active ? 'text-blue-700' : 'text-slate-600'}`}>{label}</span>
                {active && <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0"><Check size={11} className="text-white" strokeWidth={3} /></div>}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* İlgi Alanları */}
      <SectionCard>
        <div className="px-6 py-4 border-b border-slate-50">
          <p className="text-sm font-bold text-slate-900">İlgi Alanlarım</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Seçili: <span className="text-blue-600 font-bold">{preferences.length}</span> konu
          </p>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2">
          {INTEREST_CATS.map(({ id, label, icon: Icon, subs }) => {
            const isOpen = openCat === id;
            const selCount = subs.filter((s) => preferences.includes(s)).length;
            return (
              <div key={id} className={`rounded-2xl border-2 overflow-hidden transition-colors ${isOpen ? 'border-blue-300' : 'border-slate-100'}`}>
                <button type="button" onClick={() => setOpenCat(isOpen ? null : id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isOpen ? 'bg-blue-50/40' : 'bg-slate-50/50 hover:bg-slate-50'}`}>
                  <Icon size={16} className="text-slate-400 shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-slate-800">{label}</span>
                  {selCount > 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black mr-1">{selCount}</span>}
                  {isOpen ? <ChevronDown size={14} className="text-slate-400 rotate-180 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-2 flex flex-wrap gap-2 border-t border-slate-100 bg-white">
                        {subs.map((sub) => {
                          const sel = preferences.includes(sub);
                          return (
                            <button key={sub} type="button" onClick={() => togglePref(sub)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-[1.04] ${
                                sel ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-300' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                              }`}>
                              {sel && <Check size={10} className="inline mr-1 text-blue-500" strokeWidth={3} />}
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Kaydet */}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Tercihleri Kaydet
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Profil ──────────────────────────────────────────────────────────────

function ProfileTab({ profile, userId }: { profile: any; userId: string }) {
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName]   = useState(profile?.last_name || '');
  const [bio, setBio]             = useState(profile?.bio || '');
  const [saving, setSaving]       = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      bio: bio.trim() || null,
    }).eq('id', userId);
    setSaving(false);
    if (error) { toast.error('Kayıt başarısız.'); return; }
    toast.success('Profil güncellendi.');
  };

  return (
    <SectionCard>
      <div className="px-6 py-4 border-b border-slate-50">
        <p className="text-sm font-bold text-slate-900">Profil Bilgileri</p>
      </div>
      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
            <span className="text-base font-black text-white">
              {(firstName.charAt(0) || profile?.id?.charAt(0) || '?').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{[firstName, lastName].filter(Boolean).join(' ') || 'İsimsiz'}</p>
            <p className="text-xs text-slate-400 capitalize">{profile?.role === 'organizer' ? 'Organizatör' : 'Katılımcı'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Ad', value: firstName, set: setFirstName, placeholder: 'Adınız' },
            { label: 'Soyad', value: lastName, set: setLastName, placeholder: 'Soyadınız' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
              <input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Biyografi</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            placeholder="Kendinizden kısaca bahsedin..."
            style={{ resize: 'none' }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
        </div>
        <div className="flex justify-end">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Kaydet
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Tab: Bildirimler ─────────────────────────────────────────────────────────

function NotificationsTab({ profile, userId }: { profile: any; userId: string }) {
  const [emailNotif, setEmailNotif] = useState(profile?.email_notifications ?? true);
  const [pushNotif,  setPushNotif]  = useState(profile?.push_notifications  ?? false);

  const save = async (key: string, val: boolean) => {
    await supabase.from('profiles').update({ [key]: val }).eq('id', userId);
    toast.success('Güncellendi.');
  };

  return (
    <SectionCard>
      <div className="px-6 py-4 border-b border-slate-50"><p className="text-sm font-bold text-slate-900">Bildirim Tercihleri</p></div>
      <div className="divide-y divide-slate-50">
        {[
          { icon: Mail, label: 'E-posta Bildirimleri', desc: 'Etkinlik hatırlatmaları', value: emailNotif, key: 'email_notifications', set: setEmailNotif },
          { icon: Smartphone, label: 'Push Bildirimleri', desc: 'Anlık uygulama bildirimleri', value: pushNotif, key: 'push_notifications', set: setPushNotif },
        ].map(({ icon: Icon, label, desc, value, key, set }) => (
          <div key={key} className="flex items-center gap-4 px-6 py-4">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
            <Toggle value={value} onChange={(v) => { set(v); save(key, v); }} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Tab: Hesap & Güvenlik ────────────────────────────────────────────────────

function AccountTab({ email }: { email: string }) {
  const router = useRouter();
  const [showPw, setShowPw]         = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPwForm, setShowPwForm]  = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  const changePw = async () => {
    if (newPassword.length < 6) { toast.error('En az 6 karakter.'); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Şifre güncellendi.'); setNewPassword(''); setShowPwForm(false);
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const deleteAccount = async () => {
    setDelLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionCard>
        <div className="px-6 py-4 border-b border-slate-50"><p className="text-sm font-bold text-slate-900">Hesap Bilgileri</p></div>
        <div className="divide-y divide-slate-50">
          <div className="flex items-center gap-4 px-6 py-4">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0"><Mail size={15} className="text-slate-400" /></div>
            <div className="flex-1"><p className="text-sm font-semibold text-slate-800">E-posta</p><p className="text-xs text-slate-400 mt-0.5">{email}</p></div>
            <span className="text-xs text-slate-400 font-medium">Değiştirilemez</span>
          </div>
          <div>
            <button onClick={() => setShowPwForm((v) => !v)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0"><Lock size={15} className="text-slate-400" /></div>
              <div className="flex-1 text-left"><p className="text-sm font-semibold text-slate-800">Şifre</p><p className="text-xs text-slate-400 mt-0.5">Hesap şifreni değiştir</p></div>
              <ChevronRight size={15} className={`text-slate-300 transition-transform ${showPwForm ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showPwForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                  <div className="px-6 pb-4 flex flex-col gap-3">
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Yeni şifre (min. 6 karakter)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
                      <button onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <button onClick={changePw} disabled={pwLoading || !newPassword}
                      className="self-end flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all"
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

      <SectionCard>
        <div className="divide-y divide-slate-50">
          <button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0"><LogOut size={15} className="text-slate-400" /></div>
            <div className="flex-1 text-left"><p className="text-sm font-semibold text-slate-800">Çıkış Yap</p><p className="text-xs text-slate-400 mt-0.5">Tüm cihazlarda oturumu kapat</p></div>
            <ChevronRight size={15} className="text-slate-300" />
          </button>
          <button onClick={() => setShowDelete(true)} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0"><Trash2 size={15} className="text-red-500" /></div>
            <div className="flex-1 text-left"><p className="text-sm font-semibold text-red-600">Hesabı Sil</p><p className="text-xs text-slate-400 mt-0.5">Tüm veriler kalıcı olarak silinir</p></div>
            <ChevronRight size={15} className="text-red-200" />
          </button>
        </div>
      </SectionCard>

      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDelete(false)}>
            <motion.div initial={{ scale: 0.93, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0"><AlertTriangle size={18} className="text-red-500" /></div>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-900">Hesabı Sil</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Tüm etkinlikler ve veriler kalıcı olarak silinir. Geri alınamaz.</p>
                </div>
                <button onClick={() => setShowDelete(false)} className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">İptal</button>
                <button onClick={deleteAccount} disabled={delLoading}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {delLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setEmail(user.email || '');
      setUserId(user.id);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    })();
  }, []);

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
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm w-fit max-w-full">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Tab İçeriği */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            {activeTab === 'profile'       && <ProfileTab profile={profile} userId={userId} />}
            {activeTab === 'preferences'   && <PreferencesTab userId={userId} />}
            {activeTab === 'notifications' && <NotificationsTab profile={profile} userId={userId} />}
            {activeTab === 'account'       && <AccountTab email={email} />}
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-[11px] text-slate-300 font-medium pb-4">EtkinRota v1.0.0 — MVP</p>
      </div>
    </div>
  );
}