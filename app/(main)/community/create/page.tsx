'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  ChevronLeft, Loader2, Check, Lock, AlertCircle,
  Music2, Cpu, Palette, Briefcase, PartyPopper, Dumbbell, Gamepad2,
  CloudUpload, Users, MapPin,
} from 'lucide-react';

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'music',    label: 'Müzik',     icon: Music2,      from: '#f472b6', to: '#f43f5e' },
  { value: 'tech',     label: 'Teknoloji', icon: Cpu,         from: '#60a5fa', to: '#2563eb' },
  { value: 'art',      label: 'Sanat',     icon: Palette,     from: '#a78bfa', to: '#7c3aed' },
  { value: 'business', label: 'İş',        icon: Briefcase,   from: '#fbbf24', to: '#f97316' },
  { value: 'social',   label: 'Sosyal',    icon: PartyPopper, from: '#34d399', to: '#0d9488' },
  { value: 'sport',    label: 'Spor',      icon: Dumbbell,    from: '#fb923c', to: '#ef4444' },
  { value: 'game',     label: 'Oyun',      icon: Gamepad2,    from: '#818cf8', to: '#2563eb' },
];

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

const AVATAR_GRADIENTS = [
  ['#60a5fa','#2563eb'],['#a78bfa','#7c3aed'],['#f472b6','#f43f5e'],
  ['#34d399','#0d9488'],['#fbbf24','#f97316'],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(t: string) {
  return t.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function uniqueSlug(name: string) {
  return `${slugify(name) || 'topluluk'}-${Date.now().toString(36)}`;
}

function avatarGrad(name: string): [string, string] {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length] || AVATAR_GRADIENTS[0];
}

function initials(name: string) {
  return name.trim()
    ? name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
}

// ─── Küçük bileşenler ──────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wider">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </p>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5">
      <AlertCircle size={11} />{msg}
    </p>
  );
}

function inputCls(err?: boolean) {
  return `w-full bg-white border rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
    err
      ? 'border-red-300 focus:ring-red-300/30'
      : 'border-slate-200 focus:ring-blue-500/30 focus:border-blue-400'
  }`;
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function CommunityCreatePage() {
  const router = useRouter();

  const [checking,  setChecking]  = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [isPro,     setIsPro]     = useState(false);
  const [userId,    setUserId]    = useState('');

  const [name,          setName]          = useState('');
  const [bio,           setBio]           = useState('');
  const [category,      setCategory]      = useState('');
  const [city,          setCity]          = useState('');
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [submitting,    setSubmitting]    = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles').select('is_pro').eq('id', user.id).single();
      const pro = profile?.is_pro || false;
      setIsPro(pro);

      if (pro) {
        setCanCreate(true);
      } else {
        const { count } = await supabase
          .from('communities')
          .select('id', { count: 'exact', head: true })
          .eq('founder_id', user.id);
        setCanCreate((count ?? 0) < 1);
      }
      setChecking(false);
    })();
  }, []);

  // ── Avatar upload ─────────────────────────────────────────────────────────

  const handleAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Avatar maks. 2MB.'); return; }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(f));
    setAvatarFile(f);
  };

  // ── Validate ─────────────────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())     e.name     = 'Topluluk adı zorunludur.';
    if (name.length > 80) e.name     = 'En fazla 80 karakter.';
    if (!category)        e.category = 'Bir kategori seçin.';
    if (!city)            e.city     = 'Şehir seçimi zorunludur.';
    if (bio.length > 500) e.bio      = 'En fazla 500 karakter.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext  = avatarFile.name.split('.').pop();
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('community_avatars').upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        avatarUrl = supabase.storage.from('community_avatars').getPublicUrl(path).data.publicUrl;
      }

      const { data: comm, error } = await supabase
        .from('communities')
        .insert([{
          founder_id: userId,
          name:       name.trim(),
          slug:       uniqueSlug(name),
          bio:        bio.trim() || null,
          category, city,
          avatar_url: avatarUrl,
        }])
        .select('id').single();

      if (error) {
        if (error.message.includes('row-level')) {
          toast.error('Topluluk oluşturma limitine ulaştınız.');
        } else throw error;
        setSubmitting(false); return;
      }

      toast.success('Topluluk oluşturuldu! 🎉');
      router.push(`/community/${comm.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Bir hata oluştu.');
      setSubmitting(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────

  if (checking) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={22} className="animate-spin text-slate-300" />
    </div>
  );

  if (!canCreate) return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-sm mx-auto py-20 flex flex-col items-center gap-5 text-center px-4"
    >
      <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center">
        <Lock size={24} className="text-amber-500" />
      </div>
      <div>
        <p className="text-base font-black text-slate-900">Limit Doldu</p>
        <p className="text-sm text-slate-400 mt-1.5 leading-relaxed max-w-xs">
          Ücretsiz hesapla en fazla 1 topluluk kurabilirsin. Pro'ya geçerek sınırsız topluluk oluşturabilirsin.
        </p>
      </div>
      <button onClick={() => router.back()}
        className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm">
        Geri Dön
      </button>
    </motion.div>
  );

  // ── Derived ───────────────────────────────────────────────────────────────

  const [g1, g2]     = avatarGrad(name || 'A');
  const activeCat    = CATEGORIES.find(c => c.value === category);
  const isComplete   = !!(name.trim() && category && city);
  const hasErrors    = Object.keys(errors).length > 0;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 flex flex-col gap-5 pb-12">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm shrink-0">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Topluluk Kur</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isPro ? 'Pro hesap — sınırsız topluluk' : 'Ücretsiz hesap — 1 topluluk hakkın var'}
          </p>
        </div>
      </div>

      {/* ── Canlı önizleme ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3.5">Önizleme</p>
        <div className="flex items-center gap-4">

          {/* Avatar */}
          <label className="relative cursor-pointer shrink-0 group">
            <div
              className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white overflow-hidden"
              style={{ background: `linear-gradient(135deg,${g1},${g2})` }}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-black text-2xl select-none">{initials(name)}</span>
              }
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <CloudUpload size={15} className="text-white" />
            </div>
            <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </label>

          <div className="flex-1 min-w-0">
            {name.trim() ? (
              <>
                <p className="font-black text-slate-900 leading-tight truncate">{name}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {activeCat && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: `linear-gradient(135deg,${activeCat.from},${activeCat.to})` }}
                    >
                      {activeCat.label}
                    </span>
                  )}
                  {city && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin size={9} />{city}
                    </span>
                  )}
                </div>
                {bio.trim() && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{bio}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Ad girince önizleme burada görünür</p>
            )}
            <p className="text-[10px] text-slate-400 mt-2">Avatar için görsele tıkla · maks 2MB</p>
          </div>
        </div>
      </div>

      {/* ── Form alanları ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-5">

        {/* Ad */}
        <div>
          <Label required>Topluluk Adı</Label>
          <input
            type="text" value={name} maxLength={80}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
            placeholder="Örn: Antalya Tech Meetup"
            className={inputCls(!!errors.name)}
          />
          <div className="flex justify-between mt-1.5">
            <Err msg={errors.name} />
            <p className={`text-[10px] ml-auto tabular-nums ${name.length > 70 ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
              {name.length}/80
            </p>
          </div>
        </div>

        {/* Kategori */}
        <div>
          <Label required>Kategori</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, label, icon: Icon, from, to }) => {
              const active = category === value;
              return (
                <button
                  key={value} type="button"
                  onClick={() => { setCategory(active ? '' : value); setErrors(p => ({ ...p, category: '' })); }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                    active
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  style={active ? { background: `linear-gradient(135deg,${from},${to})` } : {}}
                >
                  <Icon size={12} className={active ? 'text-white' : 'text-slate-400'} />
                  {label}
                  {active && <Check size={10} className="text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
          <Err msg={errors.category} />
        </div>

        {/* Şehir */}
        <div>
          <Label required>Şehir</Label>
          <div className="relative">
            <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={city}
              onChange={e => { setCity(e.target.value); setErrors(p => ({ ...p, city: '' })); }}
              className={`${inputCls(!!errors.city)} pl-9 appearance-none`}
            >
              <option value="">Şehir seçin</option>
              {TR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Err msg={errors.city} />
        </div>

        {/* Biyografi */}
        <div>
          <Label>Kısa Açıklama</Label>
          <textarea
            value={bio} maxLength={500} rows={3} style={{ resize: 'none' }}
            onChange={e => { setBio(e.target.value); setErrors(p => ({ ...p, bio: '' })); }}
            placeholder="Topluluk neyi hedefliyor? Kimler için kuruldu? Kısa ve net anlat..."
            className={inputCls(!!errors.bio)}
          />
          <div className="flex justify-between mt-1.5">
            <Err msg={errors.bio} />
            <p className={`text-[10px] ml-auto tabular-nums ${bio.length > 450 ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
              {bio.length}/500
            </p>
          </div>
        </div>
      </div>

      {/* ── URL bilgi notu ───────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
        <div className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-black text-blue-600">i</span>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed">
          Topluluk URL'i sistem tarafından otomatik oluşturulur. Benzersizliği garanti altındadır, aynı URL'e sahip iki topluluk oluşturulamaz.
        </p>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="px-5 py-3 rounded-2xl text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm shrink-0"
        >
          İptal
        </button>

        <motion.button
          onClick={handleSubmit} disabled={submitting}
          whileTap={!submitting ? { scale: 0.97 } : {}}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60"
          style={{
            background: isComplete
              ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
              : 'linear-gradient(135deg,#94a3b8,#64748b)',
            boxShadow: isComplete ? '0 4px 16px rgba(37,99,235,0.3)' : 'none',
          }}
        >
          {submitting
            ? <><Loader2 size={15} className="animate-spin" />Oluşturuluyor...</>
            : <><Users size={15} />Topluluğu Kur</>
          }
        </motion.button>
      </div>

      {/* Hata özeti */}
      <AnimatePresence>
        {hasErrors && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 -mt-2"
          >
            <AlertCircle size={13} className="text-red-500" />
            <p className="text-xs text-red-500 font-semibold">Zorunlu alanları doldurun.</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}