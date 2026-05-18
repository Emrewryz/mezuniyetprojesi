'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getRecommendedEvents, getPopularEvents, type RecommendedEvent, type MatchType } from '@/lib/recommendation';
import {
  Heart, ArrowRight, Users, Globe, MapPin, Clock,
  X, Loader2, Search, Calendar,
  Music2, Cpu, Palette, Briefcase, PartyPopper, Dumbbell, Gamepad2,
  Sparkles, Star, ChevronLeft, ChevronRight, Users2,
} from 'lucide-react';

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: any; gradient: string; mesh: string }> = {
  music:    { label: 'Müzik',     icon: Music2,      gradient: 'from-pink-500 to-rose-600',    mesh: 'radial-gradient(ellipse at 20% 50%,#f43f5e33 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#ec489933 0%,transparent 60%),linear-gradient(135deg,#1e1b4b,#312e81)' },
  tech:     { label: 'Teknoloji', icon: Cpu,         gradient: 'from-blue-500 to-cyan-600',    mesh: 'radial-gradient(ellipse at 20% 50%,#3b82f633 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#06b6d433 0%,transparent 60%),linear-gradient(135deg,#0f172a,#1e3a5f)' },
  art:      { label: 'Sanat',     icon: Palette,     gradient: 'from-violet-500 to-purple-600',mesh: 'radial-gradient(ellipse at 20% 50%,#8b5cf633 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#a855f733 0%,transparent 60%),linear-gradient(135deg,#1a0533,#2d1b69)' },
  business: { label: 'İş',        icon: Briefcase,   gradient: 'from-amber-500 to-orange-500', mesh: 'radial-gradient(ellipse at 20% 50%,#f59e0b33 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#ea580c33 0%,transparent 60%),linear-gradient(135deg,#1c1107,#431407)' },
  social:   { label: 'Sosyal',    icon: PartyPopper, gradient: 'from-emerald-500 to-teal-600', mesh: 'radial-gradient(ellipse at 20% 50%,#10b98133 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#0d948133 0%,transparent 60%),linear-gradient(135deg,#022c22,#134e4a)' },
  sport:    { label: 'Spor',      icon: Dumbbell,    gradient: 'from-orange-500 to-red-600',   mesh: 'radial-gradient(ellipse at 20% 50%,#f9731633 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#dc262633 0%,transparent 60%),linear-gradient(135deg,#1c0a00,#450a0a)' },
  game:     { label: 'Oyun',      icon: Gamepad2,    gradient: 'from-indigo-500 to-blue-600',  mesh: 'radial-gradient(ellipse at 20% 50%,#6366f133 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#1d4ed833 0%,transparent 60%),linear-gradient(135deg,#0f0c29,#1e1b4b)' },
};

const BASE_FILTERS = [
  { value: 'all',      label: 'Tümü' },
  { value: 'music',    label: 'Müzik' },
  { value: 'tech',     label: 'Teknoloji' },
  { value: 'art',      label: 'Sanat' },
  { value: 'business', label: 'İş' },
  { value: 'social',   label: 'Sosyal' },
  { value: 'sport',    label: 'Spor' },
  { value: 'game',     label: 'Oyun' },
];

const SUB_TO_MAIN: Record<string, string> = {
  'yazılım':'tech','girişimcilik':'business','pazarlama':'business','finans':'business',
  'veri bilimi':'tech','yapay zeka':'tech','tiyatro':'art','fotoğrafçılık':'art',
  'resim':'art','sinema':'art','edebiyat':'art','heykel':'art',
  'konser':'music','caz':'music','rock':'music','elektronik':'music',
  'festival':'music','klasik müzik':'music','doğa yürüyüşü':'sport',
  'kampçılık':'sport','yoga':'sport','bisiklet':'sport','tırmanış':'sport',
  'yemek atölyesi':'social','kahve':'social','gastronomi':'social',
  'topluluk':'social','şarap tadımı':'social',
  'music':'music','tech':'tech','art':'art','business':'business',
  'social':'social','sport':'sport','game':'game',
};

function prefsToCategories(prefs: string[]): string[] {
  const s = new Set<string>();
  prefs.forEach(p => { const c = SUB_TO_MAIN[p.toLowerCase()]; if (c) s.add(c); });
  return Array.from(s);
}

// ─── EventItem type ───────────────────────────────────────────────────────────

type EventItem = RecommendedEvent & { attendeeSeeds: string[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarColor = (id: string) =>
  ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4','#84cc16'][id.charCodeAt(0) % 8];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

function AvatarStack({ count, seeds }: { count: number; seeds: string[] }) {
  const show = seeds.slice(0, 3);
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1.5">
        {show.map((s, i) => (
          <div key={i} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
            style={{ background: avatarColor(s), zIndex: show.length - i }}>
            {s.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
      <span className="text-[11px] text-slate-500 font-medium">{count} katılıyor</span>
    </div>
  );
}

// ─── MatchBadge ───────────────────────────────────────────────────────────────

function MatchBadge({ matchType }: { matchType: MatchType }) {
  if (matchType === 'followed_community') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white">
      <Users2 size={9} /> Takip Ettiğin
    </span>
  );
  if (matchType === 'full') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white">
      <Sparkles size={9} /> Sana Özel
    </span>
  );
  if (matchType === 'city') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
      <MapPin size={9} /> Şehrinde
    </span>
  );
  if (matchType === 'interest') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
      <Star size={9} /> İlgi Alanın
    </span>
  );
  return null;
}

// ─── Carousel Hero ────────────────────────────────────────────────────────────

function CarouselHero({ events }: { events: EventItem[] }) {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (events.length > 1) {
      intervalRef.current = setInterval(() => setActive((i) => (i + 1) % events.length), 5000);
    }
  };

  useEffect(() => { reset(); return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, [events.length]);

  const go = (dir: number) => { setActive((i) => (i + dir + events.length) % events.length); reset(); };

  if (events.length === 0) return <Skeleton className="w-full h-[320px] rounded-[32px]" />;

  const ev = events[active];
  const meta = CATEGORY_META[ev.category];
  const fmtDate = new Date(ev.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="relative h-[320px] rounded-[32px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 select-none">
        <AnimatePresence initial={false}>
          <motion.div key={ev.id + '-img'} className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}>
            {ev.cover_image_url ? (
              <Image src={ev.cover_image_url} alt={ev.title} fill className="object-cover pointer-events-none" unoptimized priority />
            ) : (
              <div className="absolute inset-0" style={{ background: meta?.mesh || 'linear-gradient(135deg,#1e293b,#334155)' }}>
                {meta && <meta.icon size={160} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.04]" />}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <div className="flex items-end justify-between gap-6">
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {meta && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${meta.gradient}`}>
                    <meta.icon size={11} /> {meta.label}
                  </span>
                )}
                <MatchBadge matchType={ev.matchType} />
              </div>
              <motion.h2 key={ev.id + '-title'} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="text-2xl font-black text-white leading-tight line-clamp-2 tracking-tight">
                {ev.title}
              </motion.h2>
              <motion.div key={ev.id + '-meta'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.22, delay: 0.05 }}
                className="flex flex-wrap gap-3 text-white/60 text-xs font-medium">
                <span className="flex items-center gap-1"><Clock size={11} />{fmtDate}</span>
                <span className="flex items-center gap-1">{ev.is_online ? <Globe size={11} /> : <MapPin size={11} />}{ev.location}</span>
                <span className="flex items-center gap-1"><Users size={11} />{ev.attendeesCount} katılımcı</span>
                <span className={`font-bold ${ev.is_paid ? 'text-white' : 'text-emerald-400'}`}>{ev.is_paid ? `₺${ev.price}` : 'Ücretsiz'}</span>
              </motion.div>
            </div>
            <Link href={`/event-detail/${ev.id}`}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold hover:bg-blue-50 transition-colors shadow-lg">
              İncele <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {events.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/25 text-white items-center justify-center hover:bg-black/40 transition-colors z-10"><ChevronLeft size={16} /></button>
            <button onClick={() => go(1)}  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/25 text-white items-center justify-center hover:bg-black/40 transition-colors z-10"><ChevronRight size={16} /></button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {events.map((_, i) => (
                <button key={i} onClick={() => { setActive(i); reset(); }}
                  className={`rounded-full transition-all duration-300 ${i === active ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({ event, isFavorited, onToggleFavorite }: {
  event: EventItem; isFavorited: boolean; onToggleFavorite: (id: string, cur: boolean) => void;
}) {
  const meta = CATEGORY_META[event.category];
  const capacityPct = event.total_capacity > 0 ? Math.min(Math.round((event.attendeesCount / event.total_capacity) * 100), 100) : 0;
  const fmtDate = new Date(event.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const fmtTime = new Date(event.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}
      className="group bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] transition-all duration-300 overflow-hidden flex flex-col">
      <Link href={`/event-detail/${event.id}`} className="block relative h-40 overflow-hidden shrink-0">
        {event.cover_image_url ? (
          <Image src={event.cover_image_url} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
        ) : (
          <div className="absolute inset-0" style={{ background: meta?.mesh || '#1e293b' }}>
            {meta && <meta.icon size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button onClick={(e) => { e.preventDefault(); onToggleFavorite(event.id, isFavorited); }}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 ${isFavorited ? 'bg-red-500 text-white' : 'bg-white/30 text-white hover:bg-white/50'}`}>
          <Heart size={12} className={isFavorited ? 'fill-current' : ''} />
        </button>
        <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm">
          <p className="text-[10px] font-bold text-slate-800 leading-none">{fmtDate} · {fmtTime}</p>
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {meta && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${meta.gradient}`}>
                <meta.icon size={9} /> {meta.label}
              </span>
            )}
            <MatchBadge matchType={event.matchType} />
          </div>
          {event.is_paid
            ? <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">₺{event.price}</span>
            : <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">Ücretsiz</span>
          }
        </div>
        <Link href={`/event-detail/${event.id}`}>
          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">{event.title}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
            {event.is_online ? <Globe size={10} /> : <MapPin size={10} />}{event.location}
          </p>
        </Link>
        <div className="mt-auto">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>{event.attendeesCount} katılımcı</span><span>{capacityPct}%</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${capacityPct}%` }} />
          </div>
        </div>
        <AvatarStack count={event.attendeesCount} seeds={event.attendeeSeeds} />
      </div>
    </motion.div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const [rawEvents, favRes, profileRes] = await Promise.all([
        user ? getRecommendedEvents(user.id) : getPopularEvents(),
        user
          ? supabase.from('event_favorites').select('event_id').eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
        user
          ? supabase.from('profiles').select('preferences').eq('id', user.id).single()
          : Promise.resolve({ data: null }),
      ]);

      // preferences'i filtre sıralaması için sakla
      const prefs = (profileRes.data as any)?.preferences || [];
      setUserPreferences(prefs);

      const events: EventItem[] = rawEvents.map(ev => ({
        ...ev,
        attendeeSeeds: [ev.id.slice(0,4), ev.id.slice(4,8), ev.id.slice(8,12)],
      }));

      setAllEvents(events);
      setFavorites(new Set((favRes.data || []).map((f: any) => f.event_id)));
      setLoading(false);
    })();
  }, []);

  // Kullanıcının ilgi kategorileri (filtre sıralaması için)
  const userMainCategories = useMemo(() => prefsToCategories(userPreferences), [userPreferences]);

  // Filtre butonlarını kullanıcı tercihlerine göre sırala
  const sortedFilters = useMemo(() => {
    if (!userMainCategories.length) return BASE_FILTERS;
    const preferred = BASE_FILTERS.filter(f => f.value !== 'all' && userMainCategories.includes(f.value));
    const rest      = BASE_FILTERS.filter(f => f.value !== 'all' && !userMainCategories.includes(f.value));
    return [BASE_FILTERS[0], ...preferred, ...rest];
  }, [userMainCategories]);

  const featuredEvents = allEvents.slice(0, 4);
  const gridEvents     = allEvents.slice(4);

  const filteredEvents = useMemo(() =>
    gridEvents.filter(ev => {
      const matchCat    = activeFilter === 'all' || ev.category === activeFilter;
      const matchSearch = !searchQuery ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    }),
    [gridEvents, activeFilter, searchQuery]
  );

  const handleToggleFavorite = useCallback(async (eventId: string, current: boolean) => {
    if (!currentUser) { toast.error('Favorilere eklemek için giriş yapmalısınız.'); return; }
    setFavorites(prev => { const n = new Set(prev); current ? n.delete(eventId) : n.add(eventId); return n; });
    try {
      if (current) {
        await supabase.from('event_favorites').delete().eq('event_id', eventId).eq('user_id', currentUser.id);
        toast.success('Favorilerden çıkarıldı.');
      } else {
        await supabase.from('event_favorites').insert([{ event_id: eventId, user_id: currentUser.id }]);
        toast.success('Favorilere eklendi!');
      }
    } catch {
      setFavorites(prev => { const n = new Set(prev); current ? n.add(eventId) : n.delete(eventId); return n; });
      toast.error('Bir hata oluştu.');
    }
  }, [currentUser]);

  return (
    <div className="flex flex-col gap-6">

      {/* Carousel */}
      {!mounted || loading
        ? <div className="max-w-5xl mx-auto w-full"><div className="w-full h-[320px] rounded-[32px] bg-slate-200 animate-pulse" /></div>
        : <CarouselHero events={featuredEvents} />
      }

      {/* Filtreler + Arama */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 pb-1">
          {sortedFilters.map(f => {
            const isPref = userMainCategories.includes(f.value);
            return (
              <button key={f.value} onClick={() => setActiveFilter(f.value)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === f.value ? 'bg-slate-900 text-white shadow-sm'
                    : isPref ? 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}>
                {isPref && f.value !== 'all' && <Sparkles size={8} />}
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AnimatePresence>
            {searchOpen && (
              <motion.input ref={searchRef}
                initial={{ width: 0, opacity: 0 }} animate={{ width: 160, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                type="text" placeholder="Etkinlik ara..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm" />
            )}
          </AnimatePresence>
          <button onClick={() => { setSearchOpen(v => !v); if (searchOpen) setSearchQuery(''); }}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            {searchOpen ? <X size={14} /> : <Search size={14} />}
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <Skeleton className="h-40 rounded-none" />
              <div className="p-4 flex flex-col gap-2.5">
                <Skeleton className="h-3.5 w-20 rounded-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-1 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Calendar size={32} className="text-slate-300" />
          <p className="text-slate-600 font-semibold text-sm">Etkinlik bulunamadı</p>
          <p className="text-xs text-slate-400">Farklı filtre deneyin.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map(ev => (
              <EventCard key={ev.id} event={ev} isFavorited={favorites.has(ev.id)} onToggleFavorite={handleToggleFavorite} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}