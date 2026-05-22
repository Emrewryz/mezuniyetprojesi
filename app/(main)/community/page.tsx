'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Users, Calendar, MapPin, Plus, Loader2, Search, Megaphone,
  MessageSquare, Music2, Cpu, Palette, Briefcase, PartyPopper,
  Dumbbell, Gamepad2, BadgeCheck, Clock, Building2, Zap, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
  id: string; founder_id: string; name: string; slug: string | null;
  bio: string | null; category: string | null; city: string | null;
  avatar_url: string | null; is_verified: boolean;
  member_count: number; event_count: number;
  tier_score: number; is_member: boolean;
  last_post?: { content: string; post_type: string; created_at: string } | null;
  next_event?: { title: string; start_at: string } | null;
}

interface MyComm {
  id: string; name: string; avatar_url: string | null;
  last_activity: string | null; last_activity_type: string | null;
}

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const CAT_META: Record<string, { label: string; icon: any; gradient: string; bg: string; text: string }> = {
  music:    { label: 'Müzik',     icon: Music2,      gradient: 'from-pink-400 to-rose-500',    bg: 'bg-pink-50',    text: 'text-pink-700' },
  tech:     { label: 'Teknoloji', icon: Cpu,         gradient: 'from-blue-400 to-blue-600',    bg: 'bg-blue-50',    text: 'text-blue-700' },
  art:      { label: 'Sanat',     icon: Palette,     gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-700' },
  business: { label: 'İş',        icon: Briefcase,   gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50',   text: 'text-amber-700' },
  social:   { label: 'Sosyal',    icon: PartyPopper, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  sport:    { label: 'Spor',      icon: Dumbbell,    gradient: 'from-orange-400 to-red-500',   bg: 'bg-orange-50',  text: 'text-orange-700' },
  game:     { label: 'Oyun',      icon: Gamepad2,    gradient: 'from-indigo-400 to-blue-600',  bg: 'bg-indigo-50',  text: 'text-indigo-700' },
};

const FILTERS = [
  { value: 'all', label: 'Tümü' },
  ...Object.entries(CAT_META).map(([v, { label }]) => ({ value: v, label })),
];

const GRADIENTS = ['from-blue-400 to-blue-600','from-violet-400 to-purple-600','from-pink-400 to-rose-500','from-emerald-400 to-teal-500','from-amber-400 to-orange-500'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function CommunityAvatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-16 h-16 text-xl rounded-2xl' : size === 'sm' ? 'w-8 h-8 text-xs rounded-xl' : 'w-12 h-12 text-sm rounded-2xl';
  const grad = GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${dim} object-cover shrink-0`} />;
  }
  return (
    <div className={`${dim} bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return 'Az önce';
  if (h < 24) return `${h} saat önce`;
  return `${d} gün önce`;
}

function scoreComm(c: any, userCity: string | null, userPrefs: string[]) {
  let score = 0;
  const cityMatch = userCity && c.city === userCity;
  const catMatch = c.category && userPrefs.includes(c.category);
  if (cityMatch && catMatch) score = 100;
  else if (catMatch) score = 70;
  else if (cityMatch) score = 50;
  score += Math.min(c.member_count * 0.05, 10);
  return score;
}

// ─── Community Card ───────────────────────────────────────────────────────────

function CommunityCard({ c, onJoin, joining }: {
  c: Community;
  onJoin: (id: string, isMember: boolean) => void;
  joining: string | null;
}) {
  const meta = c.category ? CAT_META[c.category] : null;
  const isJoining = joining === c.id;
  const fmtEvent = c.next_event
    ? new Date(c.next_event.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition-all overflow-hidden flex flex-col"
    >
      <Link href={`/community/${c.id}`} className="flex-1 p-5 flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-start gap-3">
          <CommunityAvatar name={c.name} avatarUrl={c.avatar_url} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight truncate">
                {c.name}
              </h3>
              {c.is_verified && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {meta && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.text}`}>
                  <meta.icon size={8} /> {meta.label}
                </span>
              )}
              {c.city && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <MapPin size={9} /> {c.city}
                </span>
              )}
            </div>
          </div>
          {c.is_member && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Üye
            </span>
          )}
        </div>

        {/* Bio */}
        {c.bio && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Users size={10} /> <strong className="text-slate-600">{c.member_count.toLocaleString('tr-TR')}</strong> üye
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={10} /> <strong className="text-slate-600">{c.event_count}</strong> etkinlik
          </span>
        </div>

        {/* Last activity or next event */}
        {(c.last_post || c.next_event) && (
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5">
            {c.next_event && (
              <div className="flex items-center gap-2 text-[11px] text-blue-600">
                <Calendar size={10} className="shrink-0" />
                <span className="truncate font-medium">{fmtEvent} · {c.next_event.title}</span>
              </div>
            )}
            {c.last_post && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                {c.last_post.post_type === 'announcement'
                  ? <Megaphone size={10} className="shrink-0 text-amber-500" />
                  : <MessageSquare size={10} className="shrink-0" />
                }
                <span className="truncate">{c.last_post.content.slice(0, 60)}{c.last_post.content.length > 60 ? '...' : ''}</span>
                <span className="shrink-0">{relativeTime(c.last_post.created_at)}</span>
              </div>
            )}
          </div>
        )}
      </Link>

      {/* Join button */}
      <div className="px-5 pb-4 pt-0">
        <button
          onClick={() => onJoin(c.id, c.is_member)}
          disabled={isJoining}
          className={`w-full py-2 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            c.is_member
              ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 border border-slate-200'
              : 'text-white hover:opacity-90'
          }`}
          style={c.is_member ? {} : { background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
        >
          {isJoining ? <Loader2 size={12} className="animate-spin" /> : c.is_member ? 'Ayrıl' : 'Katıl'}
        </button>
      </div>
    </motion.div>
  );
}

// ─── My Communities Panel ─────────────────────────────────────────────────────

function MyCommunitiesPanel({ communities }: { communities: MyComm[] }) {
  if (communities.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Topluluklarım</p>
        <span className="text-[10px] text-slate-400 font-medium">{communities.length}</span>
      </div>
      <div className="flex flex-col">
        {communities.map((c, i) => (
          <Link
            key={c.id}
            href={`/community/${c.id}`}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${i < communities.length - 1 ? 'border-b border-slate-50' : ''}`}
          >
            <CommunityAvatar name={c.name} avatarUrl={c.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
              {c.last_activity && (
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  {c.last_activity_type === 'announcement' ? <Megaphone size={8} className="text-amber-500 shrink-0" /> : <MessageSquare size={8} className="shrink-0" />}
                  {c.last_activity.slice(0, 35)}{c.last_activity.length > 35 ? '...' : ''}
                </p>
              )}
            </div>
            <ChevronRight size={12} className="text-slate-300 shrink-0" />
          </Link>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-100">
        <Link
          href="/community/create"
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <Plus size={12} /> Topluluk Kur
        </Link>
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 bg-slate-200 rounded-lg animate-pulse w-3/4" />
          <div className="h-3 bg-slate-100 rounded-lg animate-pulse w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded animate-pulse" />
      <div className="h-3 bg-slate-100 rounded animate-pulse w-4/5" />
      <div className="h-7 bg-slate-100 rounded-2xl animate-pulse mt-1" />
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myComms, setMyComms] = useState<MyComm[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      setCurrentUserId(userId);

      let userCity: string | null = null;
      let userPrefs: string[] = [];

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('city, preferences, is_pro')
          .eq('id', userId)
          .single();
        userCity = profile?.city || null;
        userPrefs = profile?.preferences || [];

        // Check if user can create community
        const { count } = await supabase
          .from('communities')
          .select('*', { count: 'exact', head: true })
          .eq('founder_id', userId);
        setCanCreate(profile?.is_pro || (count || 0) < 1);
      }

      const [commsRes, membershipsRes] = await Promise.all([
        supabase
          .from('communities')
          .select('id, founder_id, name, slug, bio, category, city, avatar_url, is_verified, member_count, event_count')
          .order('member_count', { ascending: false })
          .limit(60),
        userId
          ? supabase.from('community_members').select('community_id').eq('user_id', userId)
          : Promise.resolve({ data: [] }),
      ]);

      const comms = commsRes.data || [];
      const memberSet = new Set((membershipsRes.data || []).map((m: any) => m.community_id));
      const commIds = comms.map((c: any) => c.id);

      // Fetch last posts and next events in parallel
      const [postsRes, eventsRes] = await Promise.all(
        commIds.length > 0
          ? [
              supabase
                .from('community_posts')
                .select('community_id, content, post_type, created_at')
                .in('community_id', commIds)
                .order('created_at', { ascending: false })
                .limit(commIds.length * 2),
              supabase
                .from('events')
                .select('community_id, title, start_at')
                .in('community_id', commIds)
                .eq('status', 'published')
                .gte('start_at', new Date().toISOString())
                .order('start_at', { ascending: true })
                .limit(commIds.length),
            ]
          : [Promise.resolve({ data: [] }), Promise.resolve({ data: [] })]
      );

      const lastPostMap: Record<string, any> = {};
      (postsRes.data || []).forEach((p: any) => {
        if (!lastPostMap[p.community_id]) lastPostMap[p.community_id] = p;
      });
      const nextEventMap: Record<string, any> = {};
      (eventsRes.data || []).forEach((e: any) => {
        if (!nextEventMap[e.community_id]) nextEventMap[e.community_id] = e;
      });

      const scored: Community[] = comms.map((c: any) => ({
        ...c,
        is_member: memberSet.has(c.id),
        tier_score: scoreComm(c, userCity, userPrefs),
        last_post: lastPostMap[c.id] || null,
        next_event: nextEventMap[c.id] || null,
      }));

      scored.sort((a, b) => {
        if (a.is_member !== b.is_member) return a.is_member ? -1 : 1;
        return b.tier_score - a.tier_score;
      });

      setCommunities(scored);

      // My communities for panel
      const myList = scored
        .filter(c => c.is_member)
        .map(c => ({
          id: c.id,
          name: c.name,
          avatar_url: c.avatar_url,
          last_activity: c.last_post?.content || c.next_event?.title || null,
          last_activity_type: c.last_post?.post_type || (c.next_event ? 'event' : null),
        }));
      setMyComms(myList);
      setLoading(false);
    })();
  }, []);

  const handleJoin = async (commId: string, isMember: boolean) => {
    if (!currentUserId) { toast.error('Giriş yapmalısın.'); return; }
    setJoining(commId);
    if (isMember) {
      const comm = communities.find(c => c.id === commId);
      if (comm?.founder_id === currentUserId) { toast.error('Kurucular topluluğu terk edemez.'); setJoining(null); return; }
      await supabase.from('community_members').delete().eq('community_id', commId).eq('user_id', currentUserId);
      toast.success('Topluluktan ayrıldın.');
    } else {
      await supabase.from('community_members').insert([{ community_id: commId, user_id: currentUserId, role: 'member' }]);
      toast.success('Topluluğa katıldın!');
    }
    setCommunities(prev => prev.map(c =>
      c.id === commId
        ? { ...c, is_member: !isMember, member_count: c.member_count + (isMember ? -1 : 1) }
        : c
    ));
    setMyComms(prev => isMember ? prev.filter(c => c.id !== commId) : prev);
    setJoining(null);
  };

  const filtered = useMemo(() => {
    let list = communities;
    if (activeFilter !== 'all') list = list.filter(c => c.category === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.bio?.toLowerCase().includes(q)) ||
        (c.city?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [communities, activeFilter, search]);

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-sm">
              <Building2 size={13} className="text-white" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Etkinlik Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Topluluklar</h1>
          <p className="text-sm text-slate-400 mt-0.5">Sana yakın, ilgi alanına uygun topluluklar</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(s => !s)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${searchOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
          >
            <Search size={15} />
          </button>
          {canCreate && (
            <Link
              href="/community/create"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
            >
              <Plus size={14} /> Topluluk Kur
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Topluluk ara..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all shadow-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === f.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Communities grid */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 bg-white rounded-3xl border border-slate-100">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center">
                <Building2 size={22} className="text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600">Topluluk bulunamadı</p>
                <p className="text-xs text-slate-400 mt-1">Farklı bir kategori veya arama deneyin</p>
              </div>
              {canCreate && (
                <Link
                  href="/community/create"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
                >
                  <Plus size={14} /> Topluluğu Sen Kur
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(c => (
                <CommunityCard key={c.id} c={c} onJoin={handleJoin} joining={joining} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-6">
          <MyCommunitiesPanel communities={myComms} />

          {/* Stats */}
          {!loading && (
            <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Genel</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Topluluk', value: communities.length },
                  { label: 'Üyeliğin', value: myComms.length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-2xl p-3 text-center">
                    <p className="text-lg font-black text-slate-900">{value}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}