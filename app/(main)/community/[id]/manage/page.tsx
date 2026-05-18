'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  ChevronLeft, Loader2, CloudUpload, X, Check, AlertTriangle,
  Users, Settings, Trash2, Shield, ShieldOff, UserMinus,
  Music2, Cpu, Palette, Briefcase, PartyPopper, Dumbbell, Gamepad2,
  Crown, BadgeCheck, Save, AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'music',    label: 'Müzik',      icon: Music2 },
  { value: 'tech',     label: 'Teknoloji',  icon: Cpu },
  { value: 'art',      label: 'Sanat',      icon: Palette },
  { value: 'business', label: 'İş',         icon: Briefcase },
  { value: 'social',   label: 'Sosyal',     icon: PartyPopper },
  { value: 'sport',    label: 'Spor',       icon: Dumbbell },
  { value: 'game',     label: 'Oyun',       icon: Gamepad2 },
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

interface Community {
  id: string; founder_id: string; name: string; slug: string | null;
  bio: string | null; category: string | null; city: string | null;
  avatar_url: string | null; cover_url: string | null;
  is_verified: boolean; member_count: number; event_count: number;
}

interface Member {
  user_id: string; role: string;
  profiles: {
    display_name: string | null; first_name: string | null;
    last_name: string | null; avatar_url: string | null;
  } | null;
}

const GRADIENTS = [
  'from-blue-400 to-blue-600','from-violet-400 to-purple-600',
  'from-pink-400 to-rose-500','from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500','from-indigo-400 to-blue-700',
];

function getDisplayName(m: Member) {
  return m.profiles?.display_name ||
    `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim() ||
    'Üye';
}

function MemberAvatar({ m }: { m: Member }) {
  const idx = m.user_id.charCodeAt(0) % GRADIENTS.length;
  const name = getDisplayName(m);
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (m.profiles?.avatar_url) {
    return <img src={m.profiles.avatar_url} alt={name} className="w-10 h-10 rounded-xl object-cover" />;
  }
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center text-white font-black text-sm shrink-0`}>
      {initials}
    </div>
  );
}

function inputCls(err?: boolean) {
  return `w-full bg-white border rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
    err ? 'border-red-300 focus:ring-red-300/40' : 'border-slate-200 focus:ring-blue-500/40 focus:border-blue-400'
  }`;
}

function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onClose, loading }: {
  name: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  const [typed, setTyped] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.94, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-900">Topluluğu Sil</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tüm üyeler, gönderiler ve etkinlik bağlantıları kaldırılır. Bu işlem geri alınamaz.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X size={15} />
          </button>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-2">
            Onaylamak için <span className="font-bold text-slate-800">{name}</span> yazın:
          </p>
          <input value={typed} onChange={e => setTyped(e.target.value)}
            placeholder={name}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/40 focus:border-red-300" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            İptal
          </button>
          <button onClick={onConfirm} disabled={typed !== name || loading}
            className="flex-1 py-2.5 rounded-full text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Sil
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function CommunityManagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'members'>('info');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUserId(user.id);

      const [commRes, memberRes] = await Promise.all([
        supabase.from('communities').select('*').eq('id', id).single(),
        supabase.from('community_members')
          .select('user_id, role, profiles(display_name, first_name, last_name, avatar_url)')
          .eq('community_id', id)
          .order('joined_at', { ascending: true }),
      ]);

      if (commRes.error || !commRes.data) { router.push('/community'); return; }
      const c = commRes.data;

      // Sadece founder veya admin erişebilir
      const myMember = (memberRes.data || []).find((m: any) => m.user_id === user.id);
      if (!myMember || !['founder', 'admin'].includes(myMember.role)) {
        toast.error('Bu sayfaya erişim yetkiniz yok.'); router.push(`/community/${id}`); return;
      }

      setCommunity(c);
      setName(c.name); setBio(c.bio || ''); setCategory(c.category || ''); setCity(c.city || '');

      const mapped: Member[] = (memberRes.data || []).map((m: any) => ({
        user_id: m.user_id, role: m.role,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
      }));
      setMembers(mapped);
      setLoading(false);
    })();
  }, [id]);

  const uploadFile = async (file: File, bucket: string, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Ad zorunludur.';
    if (name.length > 80) errs.name = 'En fazla 80 karakter.';
    if (bio.length > 500) errs.bio = 'En fazla 500 karakter.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı.');

      let avatarUrl = community?.avatar_url || null;
      let coverUrl  = community?.cover_url  || null;
      if (avatarFile) avatarUrl = await uploadFile(avatarFile, 'community_avatars', user.id);
      if (coverFile)  coverUrl  = await uploadFile(coverFile,  'community_covers',  user.id);

      const { error } = await supabase.from('communities').update({
        name: name.trim(),
        bio: bio.trim() || null,
        category: category || null,
        city: city || null,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      }).eq('id', id);

      if (error) throw error;
      setCommunity(c => c ? { ...c, name: name.trim(), bio: bio.trim() || null, category, city, avatar_url: avatarUrl, cover_url: coverUrl } : c);
      toast.success('Topluluk güncellendi!');
    } catch (err: any) {
      toast.error(err?.message || 'Güncelleme başarısız.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    const { error } = await supabase.from('communities').delete().eq('id', id);
    if (error) { toast.error('Silinemedi.'); setDeleteLoading(false); return; }
    toast.success('Topluluk silindi.');
    router.push('/community');
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    if (userId === currentUserId) return;
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const { error } = await supabase.from('community_members')
      .update({ role: newRole }).eq('community_id', id).eq('user_id', userId);
    if (error) { toast.error('Güncelleme başarısız.'); return; }
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
    toast.success(newRole === 'admin' ? 'Admin yapıldı.' : 'Admin yetkisi alındı.');
  };

  const removeMember = async (userId: string) => {
    if (userId === currentUserId) { toast.error('Kendinizi çıkaramazsınız.'); return; }
    const { error } = await supabase.from('community_members')
      .delete().eq('community_id', id).eq('user_id', userId);
    if (error) { toast.error('İşlem başarısız.'); return; }
    setMembers(prev => prev.filter(m => m.user_id !== userId));
    toast.success('Üye çıkarıldı.');
  };

  const isFounder = currentUserId === community?.founder_id;

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={22} className="animate-spin text-slate-400" />
    </div>
  );

  if (!community) return null;

  const displayCover  = coverPreview  || community.cover_url;
  const displayAvatar = avatarPreview || community.avatar_url;
  const initials = community.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const TABS = [
    { key: 'info',    label: 'Topluluk Bilgileri', icon: Settings },
    { key: 'members', label: `Üyeler (${members.length})`, icon: Users },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/community/${id}`)}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm shrink-0">
          <ChevronLeft size={17} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Topluluk Yönetimi</h1>
          <p className="text-sm text-slate-400 mt-0.5 truncate">{community.name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isFounder ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {isFounder ? 'Kurucu' : 'Yönetici'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-slate-100 rounded-2xl shadow-sm">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'info' ? (
          <motion.div key="info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-5">

            {/* Görsel */}
            <SectionCard title="Görsel" description="Kapak ve avatar görselleri.">
              <div className="flex flex-col gap-4">
                {/* Cover */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Kapak Fotoğrafı</p>
                  <label className="block relative h-32 cursor-pointer rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    {displayCover
                      ? <><Image src={displayCover} alt="Kapak" fill className="object-cover" unoptimized />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white text-xs font-bold">Değiştir</p>
                          </div></>
                      : <div className="w-full h-full flex items-center justify-center gap-2">
                          <CloudUpload size={18} className="text-slate-400" />
                          <p className="text-xs text-slate-400">Kapak ekle</p>
                        </div>
                    }
                    <input type="file" accept="image/*" onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      if (f.size > 5*1024*1024) { toast.error('Maks 5MB'); return; }
                      if (coverPreview) URL.revokeObjectURL(coverPreview);
                      setCoverPreview(URL.createObjectURL(f)); setCoverFile(f);
                    }} className="hidden" />
                  </label>
                </div>

                {/* Avatar */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Avatar</p>
                  <div className="flex items-center gap-4">
                    <label className="relative cursor-pointer shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden flex items-center justify-center ring-2 ring-white shadow-md">
                        {displayAvatar
                          ? <Image src={displayAvatar} alt="Avatar" fill className="object-cover" unoptimized />
                          : <span className="text-white font-black text-lg">{initials}</span>
                        }
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <CloudUpload size={14} className="text-white" />
                      </div>
                      <input type="file" accept="image/*" onChange={e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        if (f.size > 2*1024*1024) { toast.error('Maks 2MB'); return; }
                        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                        setAvatarPreview(URL.createObjectURL(f)); setAvatarFile(f);
                      }} className="hidden" />
                    </label>
                    <p className="text-xs text-slate-400">Kare format önerilir. Maks 2MB.</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Temel Bilgiler */}
            <SectionCard title="Temel Bilgiler">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Ad <span className="text-red-400">*</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} className={inputCls(!!errors.name)} />
                  {errors.name && <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5"><AlertCircle size={11} />{errors.name}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">{name.length}/80</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Açıklama</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    style={{ resize: 'none' }} className={inputCls(!!errors.bio)} />
                  {errors.bio && <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5"><AlertCircle size={11} />{errors.bio}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">{bio.length}/500</p>
                </div>
              </div>
            </SectionCard>

            {/* Kategori & Şehir */}
            <SectionCard title="Kategori & Şehir">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Kategori</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(({ value, label, icon: Icon }) => {
                      const active = category === value;
                      return (
                        <button key={value} type="button" onClick={() => setCategory(active ? '' : value)}
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
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Şehir</label>
                  <select value={city} onChange={e => setCity(e.target.value)}
                    className={`${inputCls()} appearance-none`}>
                    <option value="">Şehir seçin (opsiyonel)</option>
                    {TR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </SectionCard>

            {/* Kaydet */}
            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>

            {/* Tehlikeli bölge */}
            {isFounder && (
              <SectionCard title="Tehlikeli Bölge" description="Bu işlemler geri alınamaz.">
                <button onClick={() => setDeleteModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
                  <Trash2 size={15} /> Topluluğu Sil
                </button>
              </SectionCard>
            )}
          </motion.div>
        ) : (
          <motion.div key="members" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-3">

            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Üye Yönetimi</p>
                  <p className="text-xs text-slate-400 mt-0.5">Toplam {members.length} üye</p>
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {members.map(m => {
                  const name = getDisplayName(m);
                  const isMe = m.user_id === currentUserId;
                  const isThisFounder = m.role === 'founder';

                  return (
                    <div key={m.user_id} className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                      <MemberAvatar m={m} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                          {isMe && <span className="text-[10px] text-slate-400 font-medium">(sen)</span>}
                          {isThisFounder && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Crown size={9} /> Kurucu
                            </span>
                          )}
                          {m.role === 'admin' && !isThisFounder && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Shield size={9} /> Yönetici
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Aksiyon butonları — founder değilse ve kendisi değilse */}
                      {!isThisFounder && !isMe && isFounder && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleAdmin(m.user_id, m.role)}
                            title={m.role === 'admin' ? 'Admin yetkisini al' : 'Admin yap'}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                              m.role === 'admin'
                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}>
                            {m.role === 'admin' ? <ShieldOff size={14} /> : <Shield size={14} />}
                          </button>
                          <button
                            onClick={() => removeMember(m.user_id)}
                            title="Üyeyi çıkar"
                            className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                            <UserMinus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <DeleteModal
            name={community.name}
            onConfirm={handleDelete}
            onClose={() => setDeleteModal(false)}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}