'use client';

import React, { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import {
  Search, Bell, Settings, UserCircle, Loader2, CloudUpload, X,
  ImageIcon, MapPin, Globe, Calendar, Link as LinkIcon, Ticket,
  Users, Bold, Italic, Hash, Music2, Cpu, Palette, Briefcase,
  PartyPopper, Dumbbell, Gamepad2, ChevronRight, Clock,
  ArrowLeft, Sparkles,
} from 'lucide-react';

// Leaflet CSS — sadece client'ta yükle
if (typeof window !== 'undefined') {
  import('leaflet/dist/leaflet.css' as any);
}

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 rounded-2xl bg-slate-100 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-slate-400" />
    </div>
  ),
});

// ─── Sabitler ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'music',    label: 'Müzik',      icon: Music2,      color: 'from-pink-500 to-rose-500',    bg: 'bg-pink-50',    ring: 'ring-pink-400',    text: 'text-pink-600' },
  { value: 'tech',     label: 'Teknoloji',  icon: Cpu,         color: 'from-blue-500 to-cyan-500',    bg: 'bg-blue-50',    ring: 'ring-blue-400',    text: 'text-blue-600' },
  { value: 'art',      label: 'Sanat',      icon: Palette,     color: 'from-violet-500 to-purple-500',bg: 'bg-violet-50',  ring: 'ring-violet-400',  text: 'text-violet-600' },
  { value: 'business', label: 'İş',         icon: Briefcase,   color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50',   ring: 'ring-amber-400',   text: 'text-amber-600' },
  { value: 'social',   label: 'Sosyal',     icon: PartyPopper, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', ring: 'ring-emerald-400', text: 'text-emerald-600' },
  { value: 'sport',    label: 'Spor',       icon: Dumbbell,    color: 'from-orange-500 to-red-500',   bg: 'bg-orange-50',  ring: 'ring-orange-400',  text: 'text-orange-600' },
  { value: 'game',     label: 'Oyun',       icon: Gamepad2,    color: 'from-indigo-500 to-blue-600',  bg: 'bg-indigo-50',  ring: 'ring-indigo-400',  text: 'text-indigo-600' },
];

const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all';

// ─── Bileşenler ─────────────────────────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.05)] p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, label, color = 'text-blue-600' }: { icon: any; label: string; color?: string }) {
  return (
    <h2 className={`flex items-center gap-2.5 text-sm font-bold text-slate-800 mb-5 uppercase tracking-widest`}>
      <Icon size={16} className={color} />
      {label}
    </h2>
  );
}

// Styled date input
function DateInput({ label, required, ...props }: any) {
  return (
    <div className="flex-1">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
        <input
          type="date"
          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer [color-scheme:light]"
          {...props}
        />
      </div>
    </div>
  );
}

function TimeInput({ label, ...props }: any) {
  return (
    <div className="w-32">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
        <input
          type="time"
          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer [color-scheme:light]"
          {...props}
        />
      </div>
    </div>
  );
}

// Auto-resize textarea
function SmartTextarea({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 140)}px`;
  }, []);

  useEffect(() => { resize(); }, [value, resize]);

  const wrap = (prefix: string, suffix: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const newVal = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="group">
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl w-fit">
        {[
          { icon: Bold,   title: 'Kalın',   action: () => wrap('**', '**') },
          { icon: Italic, title: 'İtalik',  action: () => wrap('_', '_') },
          { icon: Hash,   title: 'Başlık',  action: () => wrap('## ', '') },
          { icon: LinkIcon, title: 'Link',  action: () => wrap('[', '](url)') },
        ].map(({ icon: Icon, title, action }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={action}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all"
          >
            <Icon size={13} />
          </button>
        ))}
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <span className="text-[10px] text-slate-400 font-medium px-1 flex items-center gap-1">
          <Sparkles size={10} /> Markdown desteklenir
        </span>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => { onChange(e.target.value); resize(); }}
        placeholder={placeholder}
        rows={5}
        style={{ resize: 'none', overflow: 'hidden' }}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all leading-relaxed"
      />
    </div>
  );
}

// TopBar
function TopBar() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 md:px-10 h-16">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={17} />
        </button>
        <span className="text-base font-bold text-slate-900">Yeni Etkinlik</span>
      </div>
      <div className="flex items-center gap-1">
        {[Search, Settings].map((Icon, i) => (
          <button key={i} onClick={() => Icon === Settings ? router.push('/settings') : undefined} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <Icon size={17} />
          </button>
        ))}
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors relative">
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center ml-1">
          <UserCircle size={20} className="text-slate-500" />
        </div>
      </div>
    </header>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export default function CreateEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'physical' | 'online'>('physical');
  const [selectedTicket, setSelectedTicket] = useState<'free' | 'paid'>('paid');
  const [tags, setTags] = useState<string[]>([]);
  const [locationData, setLocationData] = useState<{ address: string; lat: number; lng: number } | null>(null);

  const { register, handleSubmit, watch, setValue, getValues } = useForm({
    defaultValues: {
      title: '', capacity: '', startDate: '', startTime: '',
      endDate: '', endTime: '', location: '', price: '',
    },
  });

  const todayDate = new Date().toISOString().split('T')[0];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Dosya 5MB\'dan küçük olmalıdır.'); e.target.value = ''; return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setCoverFile(file);
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.preventDefault();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCoverFile(null);
  };

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const val = e.currentTarget.value.trim().toLowerCase();
    if (val && !tags.includes(val) && tags.length < 5) {
      setTags([...tags, val]);
      e.currentTarget.value = '';
    }
  };

  const submitEvent = async (data: any, status: 'draft' | 'published') => {
    if (!data.title?.trim())       { setErrorMsg('Etkinlik adı zorunludur.'); return; }
    if (!selectedCategory)         { setErrorMsg('Kategori seçimi zorunludur.'); return; }
    if (!data.capacity || Number(data.capacity) <= 0) { setErrorMsg('Geçerli bir kontenjan giriniz.'); return; }
    if (!data.startDate || !data.startTime) { setErrorMsg('Başlangıç tarihi ve saati zorunludur.'); return; }
    if (!data.endDate || !data.endTime)     { setErrorMsg('Bitiş tarihi ve saati zorunludur.'); return; }

    const startAt = new Date(`${data.startDate}T${data.startTime}:00`).toISOString();
    const endAt   = new Date(`${data.endDate}T${data.endTime}:00`).toISOString();

    if (new Date(endAt) <= new Date(startAt)) { setErrorMsg('Bitiş tarihi başlangıçtan sonra olmalıdır.'); return; }
    if (selectedTicket === 'paid' && (!data.price || Number(data.price) <= 0)) {
      setErrorMsg('Ücretli etkinlikler için geçerli bir fiyat giriniz.'); return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Etkinlik oluşturmak için giriş yapmalısınız.');

      let coverUrl: string | null = null;
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('event_covers').upload(fileName, coverFile, { upsert: false });
        if (uploadErr) throw new Error(`Kapak yüklenemedi: ${uploadErr.message}`);
        coverUrl = supabase.storage.from('event_covers').getPublicUrl(fileName).data.publicUrl;
      }

      const payload = {
        title: data.title.trim(),
        category: selectedCategory,
        total_capacity: Number(data.capacity),
        long_description: description.trim() || null,
        start_at: startAt,
        end_at: endAt,
        location: locationData?.address || data.location?.trim() || 'Belirtilmedi',
        latitude: locationData?.lat ?? null,
        longitude: locationData?.lng ?? null,
        is_online: selectedFormat === 'online',
        is_paid: selectedTicket === 'paid',
        price: selectedTicket === 'paid' ? Number(data.price) : 0,
        status,
        tags,
        organizer_id: user.id,
        cover_image_url: coverUrl,
      };

      const { data: newEvent, error: dbErr } = await supabase.from('events').insert([payload]).select('id').single();
      if (dbErr) throw dbErr;

      if (status === 'published' && newEvent) {
        supabase.from('activity_feed').insert([{
          activity_type: 'event_created',
          user_id: user.id,
          event_id: newEvent.id,
          metadata: { category: payload.category },
        }]).then(({ error }: { error: { message: string } | null }) => {
          if (error) console.error('activity_feed insert failed:', error.message);
        });
      }

      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg(error?.message || 'Bilinmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f5f7f9]">
      <TopBar />

      <main className="flex-1 px-4 md:px-10 py-8 max-w-7xl mx-auto w-full">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span>Etkinliklerim</span>
            <ChevronRight size={12} />
            <span className="text-slate-600">Yeni Etkinlik</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Etkinlik Oluştur</h1>
          <p className="text-slate-400 text-sm mt-1">Topluluğunuz için unutulmaz bir deneyim tasarlayın.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)} className="hover:text-red-800 transition-colors"><X size={15} /></button>
          </div>
        )}

        <form
          onSubmit={handleSubmit((data) => submitEvent(data, 'published'))}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >

          {/* ── SOL KOLON ── */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* 1. KAPAK FOTOĞRAFI */}
            <SectionCard>
              <SectionTitle icon={ImageIcon} label="Kapak Fotoğrafı" />
              {!previewUrl ? (
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl py-14 flex flex-col items-center gap-4 cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/30 group">
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                    <CloudUpload size={24} className="text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">Görseli sürükle veya seç</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG veya WEBP — Maks. 5MB, 16:9 önerilir</p>
                  </div>
                </label>
              ) : (
                <div className="relative w-full h-64 md:h-[380px] rounded-2xl overflow-hidden group border border-slate-200">
                  <Image src={previewUrl} alt="Kapak önizleme" fill className="object-cover" />
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                    <button onClick={handleRemoveCover} className="px-5 py-2.5 bg-red-500 text-white rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-red-600 transition-all hover:scale-105 shadow-lg">
                      <X size={15} /> Değiştir
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* 2. TEMEL BİLGİLER */}
            <SectionCard>
              <SectionTitle icon={Sparkles} label="Temel Bilgiler" />

              {/* Format Toggle */}
              <div className="flex p-1 bg-slate-100 rounded-xl w-full max-w-xs mb-6">
                {(['physical', 'online'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSelectedFormat(f)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${selectedFormat === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {f === 'physical' ? <><MapPin size={13} /> Fiziksel</> : <><Globe size={13} /> Online</>}
                  </button>
                ))}
              </div>

              {/* Etkinlik Adı */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Etkinlik Adı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="Örn: Yaz Ortası Caz Festivali"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
              </div>

              {/* Kategori Kartları */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                  Kategori <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {CATEGORIES.map(({ value, label, icon: Icon, bg, ring, text, color }) => {
                    const isActive = selectedCategory === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedCategory(value)}
                        className={`flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                          isActive
                            ? `${bg} border-transparent ring-2 ${ring} shadow-sm`
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? `bg-gradient-to-br ${color}` : 'bg-slate-100'}`}>
                          <Icon size={15} className={isActive ? 'text-white' : 'text-slate-500'} />
                        </div>
                        <span className={`text-[10px] font-bold leading-none ${isActive ? text : 'text-slate-500'}`}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Etiketler */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Etiketler <span className="text-slate-400 normal-case font-normal">(maks. 5)</span>
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-blue-500/40 transition-all">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                      #{tag}
                      <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-500 transition-colors"><X size={11} /></button>
                    </span>
                  ))}
                  <input
                    type="text"
                    onKeyDown={addTag}
                    placeholder={tags.length < 5 ? "Etiket ekle, Enter'a bas..." : 'Maks. etikete ulaşıldı'}
                    disabled={tags.length >= 5}
                    className="flex-1 min-w-[140px] bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none px-2 py-1"
                  />
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Etkinlik Açıklaması
                </label>
                <SmartTextarea
                  value={description}
                  onChange={setDescription}
                  placeholder="Katılımcılara neler sunuyor? Program, konuşmacılar, özel detaylar..."
                />
              </div>
            </SectionCard>
          </div>

          {/* ── SAĞ KOLON ── */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24 h-fit">

            {/* 3. ZAMAN ÇİZELGESİ */}
            <SectionCard>
              <SectionTitle icon={Calendar} label="Tarih & Saat" color="text-violet-500" />
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Başlangıç <span className="text-red-400">*</span></p>
                  <div className="flex gap-2">
                    <DateInput min={todayDate} {...register('startDate')} />
                    <TimeInput label="Saat" {...register('startTime')} />
                  </div>
                </div>
                <div className="w-full h-px bg-slate-100" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bitiş <span className="text-red-400">*</span></p>
                  <div className="flex gap-2">
                    <DateInput min={todayDate} {...register('endDate')} />
                    <TimeInput label="Saat" {...register('endTime')} />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 4. KONUM */}
            <SectionCard>
              <SectionTitle
                icon={selectedFormat === 'physical' ? MapPin : LinkIcon}
                label={selectedFormat === 'physical' ? 'Konum' : 'Erişim Linki'}
                color={selectedFormat === 'physical' ? 'text-rose-500' : 'text-emerald-500'}
              />
              {selectedFormat === 'physical' ? (
                <LocationPicker
                  onLocationSelect={(address, lat, lng) => {
                    setLocationData({ address, lat, lng });
                    setValue('location', address);
                  }}
                  initialAddress={locationData?.address}
                />
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Toplantı Linki
                  </label>
                  <div className="relative">
                    <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      {...register('location')}
                      placeholder="https://zoom.us/j/..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    />
                  </div>
                </div>
              )}
            </SectionCard>

            {/* 5. BİLET & KAPASİTE */}
            <SectionCard>
              <SectionTitle icon={Ticket} label="Bilet & Kapasite" color="text-sky-500" />
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    <Users size={12} className="text-slate-400" />
                    Kontenjan <span className="text-red-400">*</span>
                  </label>
                  <input type="number" min="1" {...register('capacity')} placeholder="Örn: 150" className={inputCls} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Fiyatlandırma</label>
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    {(['free', 'paid'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${selectedTicket === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {t === 'free' ? 'Ücretsiz' : 'Ücretli'}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTicket === 'paid' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Bilet Fiyatı <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold select-none">₺</span>
                      <input type="number" min="0" step="0.01" placeholder="0.00" className={`${inputCls} pl-8 font-semibold`} {...register('price')} />
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* 6. BUTONLAR */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {loading ? 'Yayınlanıyor...' : 'Etkinliği Yayınla'}
              </button>
              <button
                type="button"
                onClick={() => submitEvent(getValues(), 'draft')}
                disabled={loading}
                className="w-full py-3.5 rounded-full text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
              >
                Taslak Olarak Kaydet
              </button>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}