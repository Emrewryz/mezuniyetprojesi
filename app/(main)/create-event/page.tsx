'use client';

import React, { useState, useEffect, useRef, ChangeEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CloudUpload, X, MapPin, Globe, Calendar, Clock,
  Users, Loader2, Zap, ChevronLeft, Check, Pencil,
  Music2, Cpu, Palette, Briefcase, PartyPopper,
  Dumbbell, Gamepad2, AlertCircle, TicketIcon,
  User, Users2,
} from 'lucide-react';

const LocationPickerInline = dynamic(() => import('@/components/ui/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-2xl bg-slate-100 flex items-center justify-center">
      <Loader2 size={18} className="animate-spin text-slate-400" />
    </div>
  ),
});

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'music',    label: 'Müzik',      icon: Music2 },
  { value: 'tech',     label: 'Teknoloji',  icon: Cpu },
  { value: 'art',      label: 'Sanat',      icon: Palette },
  { value: 'business', label: 'İş',         icon: Briefcase },
  { value: 'social',   label: 'Sosyal',     icon: PartyPopper },
  { value: 'sport',    label: 'Spor',       icon: Dumbbell },
  { value: 'game',     label: 'Oyun',       icon: Gamepad2 },
];

function toDateLocal(d: Date) { return d.toISOString().slice(0, 10); }
function toTimeLocal(d: Date) { return d.toTimeString().slice(0, 5); }

// ─── AutoTextarea ─────────────────────────────────────────────────────────────

function AutoTextarea({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 80)}px`;
  }, [value]);
  return (
    <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} style={{ resize: 'none', overflow: 'hidden' }}
      className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none leading-relaxed min-h-[80px]" />
  );
}

// ─── Location Modal ───────────────────────────────────────────────────────────

function LocationModal({ onConfirm, onClose, initial }: {
  onConfirm: (address: string, lat: number, lng: number) => void;
  onClose: () => void;
  initial?: { address: string; lat: number; lng: number } | null;
}) {
  const [pending, setPending] = useState<{ address: string; lat: number; lng: number } | null>(initial || null);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">Konum Seç</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><X size={15} /></button>
        </div>
        <div className="p-4">
          <LocationPickerInline onLocationSelect={(a, lat, lng) => setPending({ address: a, lat, lng })} initialAddress={initial?.address} />
        </div>
        {pending && (
          <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <MapPin size={12} className="text-blue-500 shrink-0" />
            <span className="text-xs font-medium text-blue-700 flex-1 truncate">{pending.address}</span>
          </div>
        )}
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">İptal</button>
          <button onClick={() => { if (pending) { onConfirm(pending.address, pending.lat, pending.lng); onClose(); }}}
            disabled={!pending}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            <Check size={14} /> Onayla
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Topluluk Seçim Ekranı ────────────────────────────────────────────────────

interface UserCommunity {
  id: string;
  name: string;
  avatar_url: string | null;
  category: string | null;
  member_count: number;
}

function CommunitySelector({ communities, onSelect }: {
  communities: UserCommunity[];
  onSelect: (communityId: string | null) => void;
}) {
  const CAT_GRADIENTS: Record<string, string> = {
    music: 'from-pink-400 to-rose-500', tech: 'from-blue-400 to-blue-600',
    art: 'from-violet-400 to-purple-600', business: 'from-amber-400 to-orange-500',
    social: 'from-emerald-400 to-teal-500', sport: 'from-orange-400 to-red-500',
    game: 'from-indigo-400 to-blue-600',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#f5f7f9] flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 mx-auto mb-4">
            <Zap size={22} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bu etkinlik kim için?</h2>
          <p className="text-sm text-slate-400 mt-2">Kişisel bir etkinlik mi oluşturuyorsunuz, yoksa topluluğunuz için mi?</p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Kişisel */}
          <button onClick={() => onSelect(null)}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all group text-left">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <User size={22} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Kişisel Etkinlik</p>
              <p className="text-xs text-slate-400 mt-0.5">Sadece senin adına yayınlanır.</p>
            </div>
            <ChevronLeft size={16} className="text-slate-300 rotate-180 group-hover:text-blue-400 transition-colors" />
          </button>

          {/* Topluluklar */}
          {communities.map(c => {
            const grad = c.category ? CAT_GRADIENTS[c.category] : 'from-blue-400 to-blue-600';
            const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
            return (
              <button key={c.id} onClick={() => onSelect(c.id)}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all group text-left">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm overflow-hidden`}>
                  {c.avatar_url
                    ? <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Users size={10} />{c.member_count} üye</p>
                </div>
                <ChevronLeft size={16} className="text-slate-300 rotate-180 group-hover:text-blue-400 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Asıl İçerik Bileşeni (Suspense İçine Alınan Kısım) ─────────────────────
// Önceden burası 'export default function CreateEventPage' idi.
function CreateEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const presetCommunityId = searchParams.get('community_id');
  const isEdit = !!editId;

  const [step, setStep] = useState<'select' | 'form'>('form');
  const [userCommunities, setUserCommunities] = useState<UserCommunity[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(presetCommunityId || null);
  const [selectedCommunityName, setSelectedCommunityName] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'physical' | 'online'>('physical');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [locationData, setLocationData] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [dateError, setDateError] = useState('');

  const [showPriceEdit, setShowPriceEdit] = useState(false);
  const [showCapEdit, setShowCapEdit] = useState(false);

  const now = new Date();
  const plus1h = new Date(now.getTime() + 3600000);
  const [startDate, setStartDate] = useState(toDateLocal(now));
  const [startTime, setStartTime] = useState(toTimeLocal(now));
  const [endDate, setEndDate] = useState(toDateLocal(plus1h));
  const [endTime, setEndTime] = useState(toTimeLocal(plus1h));
  const todayDate = toDateLocal(new Date());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // Kullanıcının kurduğu toplulukları çek
      const { data: comms } = await supabase
        .from('community_members')
        .select('communities(id, name, avatar_url, category, member_count)')
        .eq('user_id', user.id)
        .eq('role', 'founder');

      const communities = (comms || [])
        .map((c: any) => c.communities)
        .filter(Boolean) as UserCommunity[];

      setUserCommunities(communities);

      // Eğer edit değilse ve topluluk varsa seçim ekranı göster
      if (!isEdit && !presetCommunityId && communities.length > 0) {
        setStep('select');
      }

      // Edit modu
      if (isEdit && editId) {
        const { data, error } = await supabase.from('events').select('*').eq('id', editId).single();
        if (error || !data) { toast.error('Etkinlik bulunamadı.'); router.push('/my-events'); return; }
        setTitle(data.title || '');
        setCapacity(String(data.total_capacity || ''));
        setPrice(String(data.price || ''));
        setDescription(data.long_description || '');
        setSelectedCategory(data.category || '');
        setSelectedFormat(data.is_online ? 'online' : 'physical');
        setIsPaid(data.is_paid || false);
        setExistingCoverUrl(data.cover_image_url || null);
        setSelectedCommunityId(data.community_id || null);
        const s = new Date(data.start_at), e = new Date(data.end_at);
        setStartDate(toDateLocal(s)); setStartTime(toTimeLocal(s));
        setEndDate(toDateLocal(e)); setEndTime(toTimeLocal(e));
        if (data.latitude && data.longitude) {
          setLocationData({ address: data.location, lat: data.latitude, lng: data.longitude });
        }
      }

      // Preset community_id varsa ismini bul
      if (presetCommunityId && communities.length > 0) {
        const found = communities.find(c => c.id === presetCommunityId);
        if (found) setSelectedCommunityName(found.name);
      }

      setPageLoading(false);
    })();
  }, [editId, presetCommunityId, isEdit]);

  const handleCommunitySelect = (communityId: string | null) => {
    setSelectedCommunityId(communityId);
    if (communityId) {
      const found = userCommunities.find(c => c.id === communityId);
      setSelectedCommunityName(found?.name || '');
    } else {
      setSelectedCommunityName('');
    }
    setStep('form');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Maks. 5MB'); e.target.value = ''; return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setCoverFile(file);
  };
  
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const validateDates = () => {
    const s = new Date(`${startDate}T${startTime}`), e = new Date(`${endDate}T${endTime}`);
    if (e <= s) { setDateError('Bitiş başlangıçtan sonra olmalı.'); return false; }
    setDateError(''); return true;
  };

  const submit = async (status: 'draft' | 'published') => {
    if (!title.trim()) { toast.error('Etkinlik adı zorunludur.'); return; }
    if (!selectedCategory) { toast.error('Kategori seçiniz.'); return; }
    if (!capacity || Number(capacity) <= 0) { toast.error('Kontenjan giriniz.'); return; }
    if (!validateDates()) return;
    if (isPaid && (!price || Number(price) <= 0)) { toast.error('Fiyat giriniz.'); return; }

    setLoading(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Giriş yapmalısınız.');

      let coverUrl: string | null = existingCoverUrl;
      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const fn = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('event_covers').upload(fn, coverFile);
        if (upErr) throw new Error(upErr.message);
        coverUrl = supabase.storage.from('event_covers').getPublicUrl(fn).data.publicUrl;
      }

      const payload: any = {
        title: title.trim(),
        category: selectedCategory,
        total_capacity: Number(capacity),
        long_description: description.trim() || null,
        start_at: new Date(`${startDate}T${startTime}`).toISOString(),
        end_at: new Date(`${endDate}T${endTime}`).toISOString(),
        location: locationData?.address || 'Belirtilmedi',
        latitude: locationData?.lat ?? null,
        longitude: locationData?.lng ?? null,
        is_online: selectedFormat === 'online',
        is_paid: isPaid,
        price: isPaid ? Number(price) : 0,
        status,
        cover_image_url: coverUrl,
        community_id: selectedCommunityId || null,
      };

      if (isEdit && editId) {
        const { error: e } = await supabase.from('events').update(payload).eq('id', editId);
        if (e) throw e;
      } else {
        const { data: ev, error: e } = await supabase.from('events')
          .insert([{ ...payload, organizer_id: user.id }]).select('id').single();
        if (e) throw e;
        if (status === 'published' && ev) {
          supabase.from('activity_feed').insert([{
            activity_type: 'event_created', user_id: user.id, event_id: ev.id,
            metadata: { category: payload.category },
          }]).then(({ error }: { error: { message: string } | null }) => {
            if (error) console.error(error.message);
          });
        }
      }

      toast.success(status === 'published'
        ? (isEdit ? 'Güncellendi!' : selectedCommunityId ? 'Topluluk etkinliği yayınlandı! 🎉' : 'Etkinlik yayınlandı! 🎉')
        : 'Taslak kaydedildi.');
      router.push(selectedCommunityId ? `/community/${selectedCommunityId}` : '/my-events');
    } catch (err: any) {
      toast.error(err?.message || 'Bir hata oluştu.');
    } finally { setLoading(false); }
  };

  const displayCover = previewUrl || existingCoverUrl;

  if (pageLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={22} className="animate-spin text-slate-400" />
    </div>
  );

  // Topluluk seçim ekranı
  if (step === 'select') {
    return <CommunitySelector communities={userCommunities} onSelect={handleCommunitySelect} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f7f9] py-8 px-4">
      {/* Back */}
      <div className="max-w-4xl mx-auto mb-5 flex items-center gap-3">
        <button onClick={() => userCommunities.length > 0 && !isEdit ? setStep('select') : router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors group">
          <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Geri
        </button>
        {selectedCommunityId && selectedCommunityName && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
            <Users2 size={13} className="text-blue-500" />
            <span className="text-xs font-semibold text-blue-700">{selectedCommunityName} için etkinlik</span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-[28px] shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden">
        <div className="flex flex-col md:flex-row">

          {/* SOL — Kapak */}
          <div className="md:w-72 shrink-0 bg-slate-50 flex flex-col items-center justify-start p-5 gap-4 border-r border-slate-100">
            {!displayCover ? (
              <label className="w-full aspect-square flex flex-col items-center justify-center gap-3 cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:scale-110 transition-all">
                  <CloudUpload size={20} className="text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-600">Kapak Fotoğrafı</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG · JPG · Maks 5MB</p>
                </div>
              </label>
            ) : (
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden group">
                <Image src={displayCover} alt="Kapak" fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button"
                    onClick={() => { setPreviewUrl(null); setCoverFile(null); setExistingCoverUrl(null); }}
                    className="px-4 py-2 bg-white text-slate-800 rounded-full text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-1.5">
                    <X size={12} /> Kaldır
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SAĞ — Form */}
          <div className="flex-1 flex flex-col p-6 md:p-8 gap-0">

            {/* Başlık */}
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Etkinlik Adı"
              className="w-full text-3xl md:text-4xl font-black text-slate-900 placeholder:text-slate-200 focus:outline-none bg-transparent mb-6 leading-tight" />

            {/* Format */}
            <div className="flex p-0.5 bg-slate-100 rounded-xl w-fit mb-5">
              {(['physical', 'online'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setSelectedFormat(f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedFormat === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {f === 'physical' ? <><MapPin size={12} />Fiziksel</> : <><Globe size={12} />Online</>}
                </button>
              ))}
            </div>

            {/* Tarih & Saat */}
            <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-5 border border-slate-100">
              {[
                { label: 'Başla', dateVal: startDate, timeVal: startTime, onDate: setStartDate, onTime: setStartTime, min: todayDate },
                { label: 'Bitiş', dateVal: endDate,   timeVal: endTime,   onDate: setEndDate,   onTime: setEndTime,   min: startDate },
              ].map(({ label, dateVal, timeVal, onDate, onTime, min }, i) => (
                <div key={label} className={`flex items-center gap-3 py-2.5 ${i === 0 ? 'border-b border-slate-200' : ''}`}>
                  <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0 ml-1" />
                  <span className="text-sm text-slate-500 w-10 shrink-0">{label}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <input type="date" value={dateVal} min={min} onChange={(e) => onDate(e.target.value)}
                      className="text-sm font-semibold text-slate-800 bg-transparent focus:outline-none [color-scheme:light] cursor-pointer" />
                    <input type="time" value={timeVal} onChange={(e) => onTime(e.target.value)}
                      className="text-sm font-semibold text-slate-800 bg-transparent focus:outline-none [color-scheme:light] cursor-pointer w-20" />
                  </div>
                </div>
              ))}
              {dateError && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5 pb-1">
                  <AlertCircle size={10} /> {dateError}
                </p>
              )}
            </div>

            {/* Konum */}
            <button type="button" onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-3 w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 mb-5 text-left hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-blue-200 transition-colors">
                <MapPin size={14} className={locationData ? 'text-blue-500' : 'text-slate-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${locationData ? 'text-slate-800' : 'text-slate-500'}`}>
                  {locationData ? locationData.address.split(',')[0] : 'Etkinlik Konumu Ekle'}
                </p>
                {!locationData && <p className="text-[11px] text-slate-400 mt-0.5">Çevrimdışı konum veya sanal bağlantı</p>}
              </div>
              {locationData
                ? <Check size={14} className="text-blue-500 shrink-0" strokeWidth={3} />
                : <ChevronLeft size={14} className="text-slate-300 rotate-180 shrink-0" />
              }
            </button>

            {/* Açıklama */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 mb-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Etkinlik Açıklaması</p>
              <AutoTextarea value={description} onChange={setDescription} placeholder="Etkinliğiniz hakkında bilgi verin..." />
            </div>

            {/* Etkinlik Seçenekleri */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 mb-1">Etkinlik Seçenekleri</p>

              {/* Bilet */}
              <button type="button" onClick={() => setShowPriceEdit(!showPriceEdit)}
                className="w-full flex items-center gap-3 py-3 border-b border-slate-200 hover:bg-white rounded-lg px-1 -mx-1 transition-colors group text-left">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <TicketIcon size={13} className="text-slate-500" />
                </div>
                <span className="flex-1 text-sm font-medium text-slate-700">Bilet Fiyatı</span>
                <span className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                  {isPaid ? `₺${price || '0'}` : 'Ücretsiz'}
                  <Pencil size={11} className="text-slate-300 group-hover:text-slate-400" />
                </span>
              </button>
              <AnimatePresence>
                {showPriceEdit && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16 }} className="overflow-hidden">
                    <div className="py-3 px-1 flex items-center gap-3 border-b border-slate-200">
                      <div className="flex p-0.5 bg-slate-200 rounded-xl">
                        {(['free', 'paid'] as const).map(t => (
                          <button key={t} type="button" onClick={() => setIsPaid(t === 'paid')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${(!isPaid && t === 'free') || (isPaid && t === 'paid') ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                            {t === 'free' ? 'Ücretsiz' : 'Ücretli'}
                          </button>
                        ))}
                      </div>
                      {isPaid && (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">₺</span>
                          <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}
                            placeholder="0.00" className="bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-28" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Kontenjan */}
              <button type="button" onClick={() => setShowCapEdit(!showCapEdit)}
                className="w-full flex items-center gap-3 py-3 hover:bg-white rounded-lg px-1 -mx-1 transition-colors group text-left">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Users size={13} className="text-slate-500" />
                </div>
                <span className="flex-1 text-sm font-medium text-slate-700">Kontenjan</span>
                <span className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                  {capacity || 'Sınırsız'}
                  <Pencil size={11} className="text-slate-300 group-hover:text-slate-400" />
                </span>
              </button>
              <AnimatePresence>
                {showCapEdit && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16 }} className="overflow-hidden">
                    <div className="py-3 px-1">
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)}
                          placeholder="Örn: 150"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-32" />
                        <span className="text-xs text-slate-400">kişi</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Kategori */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Kategori <span className="text-red-400">*</span></p>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(({ value, label, icon: Icon }) => {
                  const active = selectedCategory === value;
                  return (
                    <button key={value} type="button" onClick={() => setSelectedCategory(value)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}>
                      <Icon size={11} className={active ? 'text-white' : 'text-slate-400'} />
                      {label}
                      {active && <Check size={10} className="text-white" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => submit('draft')} disabled={loading}
                className="px-5 py-3 rounded-full text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50">
                Taslak
              </button>
              <button type="button" onClick={() => submit('published')} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Etkinlik Oluştur'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {locationModalOpen && (
          <LocationModal onConfirm={(a, lat, lng) => setLocationData({ address: a, lat, lng })}
            onClose={() => setLocationModalOpen(false)} initial={locationData} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Asıl Sayfa Bileşeni (Next.js'in Build Sırasında Okuyacağı Yer) ─────────
export default function CreateEventPage() {
  return (
    // URL'den parametre okuyan component, Next.js kızmasın diye Suspense (Bekleme) içine alındı.
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    }>
      <CreateEventContent />
    </Suspense>
  );
}