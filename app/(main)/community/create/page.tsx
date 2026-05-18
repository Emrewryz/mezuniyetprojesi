'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  CloudUpload, X, ChevronLeft, Loader2, Zap, Check,
  Music2, Cpu, Palette, Briefcase, PartyPopper, Dumbbell, Gamepad2,
  MapPin, Users, Lock, AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'music',    label: 'Müzik',      icon: Music2,      gradient: 'from-pink-400 to-rose-500' },
  { value: 'tech',     label: 'Teknoloji',  icon: Cpu,         gradient: 'from-blue-400 to-blue-600' },
  { value: 'art',      label: 'Sanat',      icon: Palette,     gradient: 'from-violet-400 to-purple-600' },
  { value: 'business', label: 'İş',         icon: Briefcase,   gradient: 'from-amber-400 to-orange-500' },
  { value: 'social',   label: 'Sosyal',     icon: PartyPopper, gradient: 'from-emerald-400 to-teal-500' },
  { value: 'sport',    label: 'Spor',       icon: Dumbbell,    gradient: 'from-orange-400 to-red-500' },
  { value: 'game',     label: 'Oyun',       icon: Gamepad2,    gradient: 'from-indigo-400 to-blue-600' },
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

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inputCls(hasError?: boolean) {
  return `w-full bg-white border rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
    hasError
      ? 'border-red-300 focus:ring-red-300/40'
      : 'border-slate-200 focus:ring-blue-500/40 focus:border-blue-400'
  }`;
}

export default function CommunityCreatePage() {
  const router = useRouter();
  const [loading, setLoading]         = useState(false);
  const [checking, setChecking]       = useState(true);
  const [canCreate, setCanCreate]     = useState(true);
  const [isPro, setIsPro]             = useState(false);

  const [name, setName]               = useState('');
  const [slug, setSlug]               = useState('');
  const [slugManual, setSlugManual]   = useState(false);
  const [bio, setBio]                 = useState('');
  const [category, setCategory]       = useState('');
  const [city, setCity]               = useState('');
  const [avatarFile, setAvatarFile]   = useState<File | null>(null);
  const [coverFile, setCoverFile]     = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview]   = useState<string | null>(null);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  // Kullanıcı kontrolü
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();

      const pro = profile?.is_pro || false;
      setIsPro(pro);

      if (!pro) {
        const { count } = await supabase
          .from('communities')
          .select('id', { count: 'exact', head: true })
          .eq('founder_id', user.id);
        setCanCreate((count ?? 0) < 1);
      }
      setChecking(false);
    })();
  }, []);

  // Name → slug otomatik
  useEffect(() => {
    if (!slugManual) setSlug(slugify(name));
  }, [name, slugManual]);

  const handleAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Avatar maks. 2MB'); return; }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(f));
    setAvatarFile(f);
  };

  const handleCover = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Kapak maks. 5MB'); return; }
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(f));
    setCoverFile(f);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim())     errs.name     = 'Topluluk adı zorunludur.';
    if (name.length > 80) errs.name     = 'En fazla 80 karakter.';
    if (!slug.trim())     errs.slug     = 'Slug zorunludur.';
    if (!/^[a-z0-9-]+$/.test(slug)) errs.slug = 'Sadece küçük harf, rakam ve tire.';
    if (!category)        errs.category = 'Kategori seçiniz.';
    if (bio.length > 500) errs.bio      = 'En fazla 500 karakter.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const uploadFile = async (file: File, bucket: string, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Giriş yapmalısınız.');

      // Slug benzersizlik kontrolü
      const { data: existing } = await supabase
        .from('communities').select('id').eq('slug', slug).single();
      if (existing) { setErrors(e => ({ ...e, slug: 'Bu slug zaten kullanılıyor.' })); setLoading(false); return; }

      let avatarUrl: string | null = null;
      let coverUrl:  string | null = null;
      if (avatarFile) avatarUrl = await uploadFile(avatarFile, 'community_avatars', user.id);
      if (coverFile)  coverUrl  = await uploadFile(coverFile,  'community_covers',  user.id);

      const { data: community, error } = await supabase
        .from('communities')
        .insert([{
          founder_id:  user.id,
          name:        name.trim(),
          slug:        slug.trim(),
          bio:         bio.trim() || null,
          category,
          city:        city || null,
          avatar_url:  avatarUrl,
          cover_url:   coverUrl,
        }])
        .select('id, slug')
        .single();

      if (error) {
        if (error.code === '23505') {
          setErrors(e => ({ ...e, slug: 'Bu slug zaten kullanılıyor.' }));
        } else if (error.message.includes('violates row-level')) {
          toast.error('Topluluk oluşturma limitine ulaştınız.');
        } else {
          throw error;
        }
        setLoading(false); return;
      }

      toast.success('Topluluk oluşturuldu! 🎉');
      router.push(`/community/${community.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Bir hata oluştu.');
      setLoading(false);
    }
  };

  if (checking) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={22} className="animate-spin text-slate-400" />
    </div>
  );

  if (!canCreate) return (
    <div className="max-w-lg mx-auto py-20 flex flex-col items-center gap-5 text-center px-4">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center">
        <Lock size={26} className="text-amber-500" />
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900">Limit Doldu</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Ücretsiz hesaplar yalnızca 1 topluluk kurabilir.
          Pro'ya geçerek sınırsız topluluk oluşturabilirsiniz.
        </p>
      </div>
      <button onClick={() => router.back()}
        className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
        Geri Dön
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm shrink-0">
          <ChevronLeft size={17} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Topluluk Kur</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {isPro ? 'Pro hesap — sınırsız topluluk.' : 'Ücretsiz hesap — 1 topluluk hakkın var.'}
          </p>
        </div>
      </div>

      {/* Kapak */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Cover görseli */}
        <label className="block relative h-36 cursor-pointer group overflow-hidden bg-slate-50">
          {coverPreview ? (
            <>
              <Image src={coverPreview} alt="Kapak" fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-xs font-bold">Değiştir</p>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 group-hover:bg-slate-100 transition-colors">
              <CloudUpload size={20} className="text-slate-400" />
              <p className="text-xs text-slate-400 font-medium">Kapak Fotoğrafı Ekle</p>
              <p className="text-[10px] text-slate-300">16:9 · Maks 5MB</p>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleCover} className="hidden" />
        </label>

        {/* Avatar */}
        <div className="px-6 pb-6 pt-3 flex items-end gap-4">
          <label className="relative cursor-pointer shrink-0 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 ring-4 ring-white shadow-lg overflow-hidden flex items-center justify-center">
              {avatarPreview
                ? <Image src={avatarPreview} alt="Avatar" fill className="object-cover" unoptimized />
                : <Zap size={28} className="text-white" />
              }
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <CloudUpload size={16} className="text-white" />
            </div>
            <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </label>
          <p className="text-xs text-slate-400 pb-1">Avatar ve kapak görselini değiştirmek için tıkla.</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-5">

        {/* Ad */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
            Topluluk Adı <span className="text-red-400">*</span>
          </label>
          <input type="text" value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Örn: Antalya Tech Meetup"
            className={inputCls(!!errors.name)} />
          {errors.name && <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5"><AlertCircle size={11} />{errors.name}</p>}
          <p className="text-[10px] text-slate-400 mt-1">{name.length}/80 karakter</p>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
            Topluluk URL'i <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 shrink-0">etkinrota.com/community/</span>
            <input type="text" value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
              placeholder="antalya-tech-meetup"
              className={`flex-1 ${inputCls(!!errors.slug)}`} />
          </div>
          {errors.slug && <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5"><AlertCircle size={11} />{errors.slug}</p>}
        </div>

        {/* Biyografi */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Kısa Açıklama</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            placeholder="Topluluğunuz hakkında kısa bir açıklama yazın..."
            style={{ resize: 'none' }}
            className={inputCls(!!errors.bio)} />
          {errors.bio && <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5"><AlertCircle size={11} />{errors.bio}</p>}
          <p className="text-[10px] text-slate-400 mt-1">{bio.length}/500 karakter</p>
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
            Kategori <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, label, icon: Icon, gradient }) => {
              const active = category === value;
              return (
                <button key={value} type="button" onClick={() => setCategory(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all hover:scale-[1.02] active:scale-[0.97] ${
                    active
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  style={active ? { background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` } : {}}
                >
                  <div className={`flex items-center gap-2 ${active ? `bg-gradient-to-r ${gradient} bg-clip-text` : ''}`}>
                    <Icon size={14} className={active ? 'text-white' : 'text-slate-400'} />
                    {active && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={active ? 'text-white' : ''}>{label}</span>
                </button>
              );
            })}
          </div>
          {errors.category && <p className="text-xs text-red-500 flex items-center gap-1 mt-2"><AlertCircle size={11} />{errors.category}</p>}
        </div>

        {/* Şehir */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><MapPin size={11} /> Şehir (Opsiyonel)</span>
          </label>
          <select value={city} onChange={e => setCity(e.target.value)}
            className={`${inputCls()} appearance-none`}>
            <option value="">Şehir seçin (opsiyonel)</option>
            {TR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="px-5 py-3 rounded-full text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">
          İptal
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
          {loading ? 'Oluşturuluyor...' : 'Topluluğu Kur'}
        </button>
      </div>
    </div>
  );
}