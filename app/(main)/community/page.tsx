'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Users, MapPin, Sparkles, Star, Crown, Calendar,
  Search, X, Plus, Lock, Globe, UserPlus, UserCheck,
  Music2, Cpu, Palette, Briefcase, PartyPopper,
  Dumbbell, Gamepad2, BadgeCheck,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
  id: string;
  founder_id: string;
  name: string;
  slug: string | null;
  bio: string | null;
  category: string | null;
  city: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  is_verified: boolean;
  member_count: number;
  event_count: number;
  score: number;
  tier: 'A' | 'B' | 'C' | 'D';
  isMember: boolean;
  isFounder: boolean;
}

interface UserProfile { city: string | null; preferences: string[] | null; }

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const CAT: Record<string, { label: string; icon: any; color: string; bg: string; gradient: string }> = {
  music:    { label: 'Müzik',     icon: Music2,      color: 'text-pink-600',    bg: 'bg-pink-50',    gradient: 'from-pink-400 to-rose-500' },
  tech:     { label: 'Teknoloji', icon: Cpu,         color: 'text-blue-600',    bg: 'bg-blue-50',    gradient: 'from-blue-400 to-blue-600' },
  art:      { label: 'Sanat',     icon: Palette,     color: 'text-violet-600',  bg: 'bg-violet-50',  gradient: 'from-violet-400 to-purple-600' },
  business: { label: 'İş',        icon: Briefcase,   color: 'text-amber-600',   bg: 'bg-amber-50',   gradient: 'from-amber-400 to-orange-500' },
  social:   { label: 'Sosyal',    icon: PartyPopper, color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-400 to-teal-500' },
  sport:    { label: 'Spor',      icon: Dumbbell,    color: 'text-orange-600',  bg: 'bg-orange-50',  gradient: 'from-orange-400 to-red-500' },
  game:     { label: 'Oyun',      icon: Gamepad2,    color: 'text-indigo-600',  bg: 'bg-indigo-50',  gradient: 'from-indigo-400 to-blue-600' },
};

const GRADIENTS = [
  'from-blue-400 to-blue-600','from-violet-400 to-purple-600',
  'from-pink-400 to-rose-500','from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500','from-indigo-400 to-blue-700',
];

const SUB_TO_CAT: Record<string, string> = {
  'yazılım':'tech','girişimcilik':'business','pazarlama':'business','finans':'business',
  'veri bilimi':'tech','yapay zeka':'tech','tiyatro':'art','fotoğrafçılık':'art',
  'resim':'art','sinema':'art','edebiyat':'art','konser':'music','caz':'music',
  'rock':'music','elektronik':'music','festival':'music','doğa yürüyüşü':'sport',
  'kampçılık':'sport','yoga':'sport','bisiklet':'sport','tırmanış':'sport',
  'yemek atölyesi':'social','kahve':'social','gastronomi':'social','topluluk':'social',
  'tech':'tech','music':'music','art':'art','business':'business',
  'social':'social','sport':'sport','game':'game',
};

function prefsToCategories(prefs: string[]): string[] {
  const s = new Set<string>();
  prefs.forEach(p => { const c = SUB_TO_CAT[p.toLowerCase()]; if (c) s.add(c); });
  return Array.from(s);
}

// ─── Algoritma ────────────────────────────────────────────────────────────────

function score(c: any, profile: UserProfile | null): { score: number; tier: 'A'|'B'|'C'|'D' } {
  const base = c.member_count || 0;
  if (!profile?.city && !profile?.preferences?.length) return { score: base, tier: 'D' };
  const cats = profile?.preferences ? prefsToCategories(profile.preferences) : [];
  const cityMatch = profile?.city && c.city
    ? c.city.toLowerCase().includes(profile.city.toLowerCase()) : false;
  const catMatch = cats.includes(c.category);
  if (cityMatch && catMatch) return { score: 100 + base, tier: 'A' };
  if (cityMatch)             return { score: 70  + base, tier: 'B' };
  if (catMatch)              return { score: 40  + base, tier: 'C' };
  return { score: base, tier: 'D' };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ c }: { c: Community }) {
  const meta = c.category ? CAT[c.category] : null;
  const grad = GRADIENTS[c.id.charCodeAt(0) % GRADIENTS.length];
  const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (c.avatar_url) {
    return <img src={c.avatar_url} alt={c.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-sm" />;
  }
  return (
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta?.gradient || grad} flex items-center justify-center text-white font-black text-lg ring-2 ring-white shadow-sm`}>
      {meta ? <meta.icon size={22} /> : initials}
    </div>
  );
}

// ─── TierBadge ────────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: Community['tier'] }) {
  if (tier === 'A') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white"><Sparkles size={8} />Sana Özel</span>;
  if (tier === 'B') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><MapPin size={8} />Şehrinde</span>;
  if (tier === 'C') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100"><Star size={8} />İlgi Alanın</span>;
  return null;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CommunityCard({ c, onToggle }: { c: Community; onToggle: (id: string, isMember: boolean) => void }) {
  const meta = c.category ? CAT[c.category] : null;
  return (
    <motion.div layout
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}
      className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col gap-4"
    >
      {/* Üst */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar c={c} />
          {c.is_pro && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm ring-2 ring-white">
              <Crown size={10} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 truncate">{c.name}</h3>
            {c.is_verified && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
            {c.is_pro && (
              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-black border border-amber-200 shrink-0">PRO</span>
            )}
            {c.isFounder && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black border border-blue-200 shrink-0">Kurucusu</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {meta && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.bg} ${meta.color}`}>
                <meta.icon size={9} /> {meta.label}
              </span>
            )}
            <TierBadge tier={c.tier} />
          </div>
          {c.city && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1.5">
              <MapPin size={10} className="text-slate-300" /> {c.city}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {c.bio && <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{c.bio}</p>}

      {/* Metrikler */}
      <div className="flex items-center gap-4 py-3 border-t border-b border-slate-50">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users size={12} className="text-slate-400" />
          <span className="font-semibold text-slate-700">{c.member_count.toLocaleString('tr-TR')}</span>
          <span>üye</span>
        </div>
        <div className="w-px h-3 bg-slate-200" />
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={12} className="text-slate-400" />
          <span className="font-semibold text-slate-700">{c.event_count}</span>
          <span>etkinlik</span>
        </div>
      </div>

      {/* Aksiyon */}
      {c.isFounder ? (
        <Link href={`/community/${c.id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200">
          Topluluğu Yönet
        </Link>
      ) : (
        <button onClick={() => onToggle(c.id, c.isMember)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-[0.97] ${
            c.isMember
              ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200'
              : 'text-white hover:opacity-90 hover:shadow-md hover:shadow-blue-200'
          }`}
          style={c.isMember ? {} : { background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
          {c.isMember ? <><UserCheck size={15} />Katıldın</> : <><UserPlus size={15} />Katıl</>}
        </button>
      )}
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-slate-200 rounded w-full" />
      <div className="h-3 bg-slate-200 rounded w-4/5" />
      <div className="h-10 bg-slate-200 rounded-2xl w-full mt-1" />
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [founderCount, setFounderCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const [profileRes, commRes, memberRes] = await Promise.all([
        user
          ? supabase.from('profiles').select('city, preferences').eq('id', user.id).single()
          : Promise.resolve({ data: null }),
        supabase.from('communities').select('*').order('member_count', { ascending: false }),
        user
          ? supabase.from('community_members').select('community_id').eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
      ]);

      const profile = profileRes.data as UserProfile | null;
      setUserProfile(profile);

      const memberIds = new Set((memberRes.data || []).map((m: any) => m.community_id));

      const scored: Community[] = (commRes.data || []).map((c: any) => {
        const { score: s, tier } = score(c, profile);
        return {
          ...c,
          score: s, tier,
          isMember: memberIds.has(c.id),
          isFounder: user ? c.founder_id === user.id : false,
        };
      }).sort((a: Community, b: Community) => b.score - a.score);

      const ownerCount = scored.filter((c: Community) => c.isFounder).length;
      setFounderCount(ownerCount);
      setCommunities(scored);
      setLoading(false);
    })();
  }, []);

  const toggleMember = useCallback(async (commId: string, isMember: boolean) => {
    if (!userId) return;
    setCommunities(prev => prev.map(c => c.id !== commId ? c : {
      ...c, isMember: !isMember,
      member_count: isMember ? c.member_count - 1 : c.member_count + 1,
    }));
    try {
      if (isMember) {
        await supabase.from('community_members').delete()
          .eq('community_id', commId).eq('user_id', userId);
      } else {
        await supabase.from('community_members')
          .insert([{ community_id: commId, user_id: userId, role: 'member' }]);
      }
    } catch {
      setCommunities(prev => prev.map(c => c.id !== commId ? c : {
        ...c, isMember, member_count: isMember ? c.member_count + 1 : c.member_count - 1,
      }));
    }
  }, [userId]);

  const filtered = useMemo(() => communities.filter(c => {
    const matchCat = activeFilter === 'all' || c.category === activeFilter;
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.bio?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [communities, activeFilter, search]);

  const personal = filtered.filter(c => c.tier === 'A' || c.tier === 'B');
  const others   = filtered.filter(c => c.tier === 'C' || c.tier === 'D');
  const canCreate = founderCount < 2;

  const FILTERS = [
    { value: 'all', label: 'Tümü' },
    ...Object.entries(CAT).map(([v, { label }]) => ({ value: v, label })),
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">EtkinRota</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Toplulukları Keşfet</h1>
          <p className="text-sm text-slate-400 mt-1">Sana özel seçilen topluluklarla tanış, ağını büyüt.</p>
        </div>
        {userId && (
          <div className="flex flex-col items-end gap-1">
            {!canCreate && (
              <p className="text-[10px] text-slate-400">Maks. 2 topluluk kurabilirsin</p>
            )}
            <Link
              href={canCreate ? '/community/create' : '#'}
              onClick={e => !canCreate && e.preventDefault()}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                canCreate
                  ? 'text-white hover:opacity-90 hover:shadow-md hover:shadow-blue-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              style={canCreate ? { background: 'linear-gradient(135deg,#3b82f6,#2563eb)' } : {}}
            >
              {canCreate ? <Plus size={15} /> : <Lock size={13} />}
              Topluluk Kur
            </Link>
          </div>
        )}
      </div>

      {/* Arama + Filtreler */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Topluluk, şehir veya kategori ara..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm placeholder:text-slate-400 text-slate-800" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map(f => {
            const isPref = userProfile?.preferences
              ? prefsToCategories(userProfile.preferences).includes(f.value)
              : false;
            return (
              <button key={f.value} onClick={() => setActiveFilter(f.value)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === f.value ? 'bg-slate-900 text-white shadow-sm'
                    : isPref ? 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}>
                {isPref && f.value !== 'all' && <Sparkles size={8} />}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
        </div>
      )}

      {/* İçerik */}
      {!loading && (
        <div className="flex flex-col gap-8">

          {personal.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-blue-500" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {userProfile?.city ? `${userProfile.city} & İlgi Alanların` : 'Önerilen'}
                </p>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">{personal.length}</span>
              </div>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {personal.map(c => <CommunityCard key={c.id} c={c} onToggle={toggleMember} />)}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              {personal.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={14} className="text-slate-400" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diğer Topluluklar</p>
                </div>
              )}
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {others.map(c => <CommunityCard key={c.id} c={c} onToggle={toggleMember} />)}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center">
                <Users size={24} className="text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Topluluk bulunamadı.</p>
                <p className="text-xs text-slate-400 mt-1">Farklı filtre deneyin veya ilk topluluğu kur.</p>
              </div>
              <button onClick={() => { setActiveFilter('all'); setSearch(''); }}
                className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}