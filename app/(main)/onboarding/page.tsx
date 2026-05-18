'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  MapPin, ChevronDown, ChevronUp, Check, ArrowRight,
  Loader2, Zap, Search, X, GraduationCap, Briefcase,
  PartyPopper, Dumbbell, Music2, Palette, Cpu, Leaf, UtensilsCrossed,
} from 'lucide-react';

// ─── 81 İl ───────────────────────────────────────────────────────────────────

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

const GOALS = [
  { value: 'learn',    label: 'Yeni Şeyler Öğrenmek',    icon: GraduationCap, color: 'text-blue-600',    bg: 'bg-blue-50',    ring: 'ring-blue-400' },
  { value: 'network',  label: 'İş & Networking',          icon: Briefcase,     color: 'text-amber-600',   bg: 'bg-amber-50',   ring: 'ring-amber-400' },
  { value: 'fun',      label: 'Eğlenmek & Sosyalleşmek', icon: PartyPopper,   color: 'text-pink-600',    bg: 'bg-pink-50',    ring: 'ring-pink-400' },
  { value: 'active',   label: 'Aktif & Sağlıklı Kalmak', icon: Dumbbell,      color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-400' },
];

const INTEREST_CATS = [
  { id: 'tech',    label: 'Teknoloji & Kariyer',  icon: Cpu,              color: 'text-blue-600',    bg: 'bg-blue-50',    subs: ['Yazılım','Girişimcilik','Pazarlama','Finans','Veri Bilimi','Yapay Zeka'] },
  { id: 'culture', label: 'Kültür & Sanat',       icon: Palette,          color: 'text-violet-600',  bg: 'bg-violet-50',  subs: ['Tiyatro','Fotoğrafçılık','Resim','Sinema','Edebiyat','Heykel'] },
  { id: 'music',   label: 'Müzik & Eğlence',      icon: Music2,           color: 'text-pink-600',    bg: 'bg-pink-50',    subs: ['Konser','Caz','Rock','Elektronik','Festival','Klasik Müzik'] },
  { id: 'nature',  label: 'Sağlık & Doğa',        icon: Leaf,             color: 'text-emerald-600', bg: 'bg-emerald-50', subs: ['Doğa Yürüyüşü','Kampçılık','Yoga','Meditasyon','Bisiklet','Tırmanış'] },
  { id: 'social',  label: 'Sosyal & Gastronomi',  icon: UtensilsCrossed,  color: 'text-amber-600',   bg: 'bg-amber-50',   subs: ['Yemek Atölyesi','Kahve','Şarap Tadımı','Topluluk','Gastronomi'] },
];

const TOTAL = 3;

const slide = {
  enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Searchable City Combobox ─────────────────────────────────────────────────

function CityCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() =>
    query.trim()
      ? TR_CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
      : TR_CITIES,
    [query]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const select = (city: string) => {
    onChange(city);
    setQuery('');
    setOpen(false);
  };

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
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input ref={inputRef} type="text" value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="İl ara..."
                  className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 transition-colors" />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Sonuç bulunamadı.</p>
              ) : filtered.map((city) => (
                <button key={city} type="button" onClick={() => select(city)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-left transition-colors hover:bg-blue-50 hover:text-blue-700 ${
                    value === city ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}>
                  {value === city && <Check size={13} className="text-blue-500 shrink-0" />}
                  {city}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Adım 1: Lokasyon ─────────────────────────────────────────────────────────

function StepCity({ city, setCity }: { city: string; setCity: (v: string) => void }) {
  const QUICK = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa'];
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hangi şehirdesin?</h2>
        <p className="text-sm text-slate-400 mt-1.5">Yakınındaki etkinlikleri kişiselleştirmek için.</p>
      </div>
      <CityCombobox value={city} onChange={setCity} />
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hızlı Seçim</p>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((c) => {
            const active = city === c;
            return (
              <button key={c} type="button" onClick={() => setCity(active ? '' : c)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all hover:scale-[1.03] active:scale-[0.97] ${
                  active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}>
                {active && <Check size={11} className="text-blue-500" />}
                {c}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Adım 2: Hedefler ─────────────────────────────────────────────────────────

function StepGoals({ goals, toggle }: { goals: string[]; toggle: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Neden buradasın?</h2>
        <p className="text-sm text-slate-400 mt-1.5">Birden fazla seçebilirsin.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GOALS.map(({ value, label, icon: Icon, color, bg, ring }) => {
          const active = goals.includes(value);
          return (
            <button key={value} type="button" onClick={() => toggle(value)}
              className={`flex items-center gap-3.5 px-4 py-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.97] ${
                active ? `border-blue-500 bg-blue-50 shadow-sm` : 'border-slate-200 bg-white hover:border-slate-300'
              }`}>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={active ? color : 'text-slate-400'} />
              </div>
              <span className={`text-sm font-semibold flex-1 leading-snug ${active ? 'text-blue-800' : 'text-slate-700'}`}>{label}</span>
              {active && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Adım 3: İlgi Alanları ────────────────────────────────────────────────────

function StepInterests({ preferences, toggleSub }: { preferences: string[]; toggleSub: (v: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">İlgi alanların</h2>
        <p className="text-sm text-slate-400 mt-1.5">Kategori seç ve alt konuları işaretle.</p>
      </div>
      <div className="flex flex-col gap-2">
        {INTEREST_CATS.map(({ id, label, icon: Icon, color, bg, subs }) => {
          const isOpen = open === id;
          const selCount = subs.filter((s) => preferences.includes(s)).length;
          return (
            <div key={id} className={`rounded-2xl border-2 overflow-hidden transition-colors ${isOpen ? 'border-blue-400' : 'border-slate-200'}`}>
              <button type="button" onClick={() => setOpen(isOpen ? null : id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${isOpen ? 'bg-blue-50/60' : 'bg-white hover:bg-slate-50/80'}`}>
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={17} className={color} />
                </div>
                <span className="flex-1 text-sm font-bold text-slate-800">{label}</span>
                {selCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black mr-1">{selCount}</span>
                )}
                {isOpen ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                    <div className="px-4 pb-4 pt-2.5 flex flex-wrap gap-2 border-t border-slate-100 bg-white">
                      {subs.map((sub) => {
                        const sel = preferences.includes(sub);
                        return (
                          <button key={sub} type="button" onClick={() => toggleSub(sub)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-[1.04] active:scale-[0.97] ${
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
    </div>
  );
}

// ─── Adım 4: Başarı ───────────────────────────────────────────────────────────

function StepSuccess() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
      <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-200">
        <Check size={44} className="text-white" strokeWidth={3} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hazırsın! 🎉</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
          Profilin kaydedildi. Sana özel etkinlikler yükleniyor...
        </p>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="flex items-center gap-2 text-xs text-slate-400">
        <Loader2 size={13} className="animate-spin text-blue-400" /> Yönlendiriliyorsun...
      </motion.div>
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [city, setCity] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleGoal = (v: string) => setGoals((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleSub  = (v: string) => setPreferences((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const canContinue = step === 0 ? !!city.trim() : step === 1 ? goals.length > 0 : true;

  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
       await supabase.from('profiles').upsert([{
  id: user.id,
  city: city.trim() || null,
  goals,
  preferences,
  onboarding_completed: true,  // ← ekle
}], { onConflict: 'id' });
      }
    } catch (e) { console.error(e); }
    finally {
      setSaving(false);
      setTimeout(() => router.push('/dashboard'), 1800);
    }
  };

  const next = () => {
    if (step === TOTAL - 1) {
      setDir(1); setStep(TOTAL); save(); return;
    }
    setDir(1); setStep((s) => s + 1);
  };

  const skip = () => {
    if (step === TOTAL - 1) { setDir(1); setStep(TOTAL); save(); return; }
    setDir(1); setStep((s) => s + 1);
  };

  const back = () => { setDir(-1); setStep((s) => s - 1); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 15% 25%, #dbeafe 0%, transparent 50%), radial-gradient(ellipse at 85% 75%, #ede9fe 0%, transparent 50%), #f8fafc' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
              <Zap size={15} className="text-white" />
            </div>
            <span className="text-sm font-black text-slate-700 tracking-tight">EtkinRota</span>
          </div>
          {step < TOTAL && <span className="text-xs text-slate-400 font-medium">{step + 1} / {TOTAL}</span>}
        </div>

        {/* Progress */}
        {step < TOTAL && (
          <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
              animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }} />
          </div>
        )}

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/70 shadow-[0_8px_40px_rgba(0,0,0,0.09)]">
          <div className="p-7 sm:p-8">
            <div className="min-h-[380px] flex flex-col">
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div key={step} custom={dir} variants={slide}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}>
                    {step === 0 && <StepCity city={city} setCity={setCity} />}
                    {step === 1 && <StepGoals goals={goals} toggle={toggleGoal} />}
                    {step === 2 && <StepInterests preferences={preferences} toggleSub={toggleSub} />}
                    {step === TOTAL && <StepSuccess />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {step < TOTAL && (
                <div className="flex items-center gap-3 mt-8 pt-5 border-t border-slate-100/80">
                  {step > 0 && (
                    <button onClick={back} className="px-4 py-2.5 rounded-full text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                      ← Geri
                    </button>
                  )}
                  <button onClick={skip} className="px-4 py-2.5 rounded-full text-sm font-semibold text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-all">
                    Atla
                  </button>
                  <button onClick={next} disabled={!canContinue || saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                    {saving
                      ? <Loader2 size={15} className="animate-spin" />
                      : <>{step === TOTAL - 1 ? 'Tamamla' : 'Devam Et'} <ArrowRight size={15} /></>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {step < TOTAL && (
          <button onClick={() => router.push('/dashboard')}
            className="text-center text-xs text-slate-400 hover:text-slate-600 transition-colors py-1">
            Şimdi değil, geç →
          </button>
        )}
      </div>
    </div>
  );
}