'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  LayoutGrid, Calendar, MapPin, TrendingUp, Users, Settings,
  Bell, Search, Heart, ArrowRight, Flame, Clock, Globe,
  ChevronRight, Plus, Ticket, SlidersHorizontal, X, Loader2,
  Music2, Cpu, Palette, Briefcase, PartyPopper, Dumbbell, Gamepad2,
} from 'lucide-react';

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutGrid, label: 'Keşfet',       href: '/dashboard' },
  { icon: Calendar,   label: 'Takvim',        href: '/calendar' },
  { icon: MapPin,     label: 'Yakınımda',     href: '/nearby' },
  { icon: TrendingUp, label: 'Trendler',      href: '/trends' },
  { icon: Ticket,     label: 'Etkinliklerim', href: '/my-events' },
];

const CATEGORY_META: Record<string, { label: string; icon: any; gradient: string; mesh: string }> = {
  music:    { label: 'Müzik',      icon: Music2,      gradient: 'from-pink-500 to-rose-600',   mesh: 'radial-gradient(ellipse at 20% 50%, #f43f5e33 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #ec489933 0%, transparent 60%), linear-gradient(135deg, #1e1b4b, #312e81)' },
  tech:     { label: 'Teknoloji',  icon: Cpu,         gradient: 'from-blue-500 to-cyan-600',   mesh: 'radial-gradient(ellipse at 20% 50%, #3b82f633 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #06b6d433 0%, transparent 60%), linear-gradient(135deg, #0f172a, #1e3a5f)' },
  art:      { label: 'Sanat',      icon: Palette,     gradient: 'from-violet-500 to-purple-600', mesh: 'radial-gradient(ellipse at 20% 50%, #8b5cf633 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #a855f733 0%, transparent 60%), linear-gradient(135deg, #1a0533, #2d1b69)' },
  business: { label: 'İş',         icon: Briefcase,   gradient: 'from-amber-500 to-orange-600', mesh: 'radial-gradient(ellipse at 20% 50%, #f59e0b33 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #ea580c33 0%, transparent 60%), linear-gradient(135deg, #1c1107, #431407)' },
  social:   { label: 'Sosyal',     icon: PartyPopper, gradient: 'from-emerald-500 to-teal-600', mesh: 'radial-gradient(ellipse at 20% 50%, #10b98133 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #0d948133 0%, transparent 60%), linear-gradient(135deg, #022c22, #134e4a)' },
  sport:    { label: 'Spor',       icon: Dumbbell,    gradient: 'from-orange-500 to-red-600',  mesh: 'radial-gradient(ellipse at 20% 50%, #f9731633 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #dc262633 0%, transparent 60%), linear-gradient(135deg, #1c0a00, #450a0a)' },
  game:     { label: 'Oyun',       icon: Gamepad2,    gradient: 'from-indigo-500 to-blue-700', mesh: 'radial-gradient(ellipse at 20% 50%, #6366f133 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #1d4ed833 0%, transparent 60%), linear-gradient(135deg, #0f0c29, #1e1b4b)' },
};

const ALL_FILTERS = [
  { value: 'all',      label: 'Tümü' },
  { value: 'music',    label: 'Müzik' },
  { value: 'tech',     label: 'Teknoloji' },
  { value: 'art',      label: 'Sanat' },
  { value: 'business', label: 'İş' },
  { value: 'social',   label: 'Sosyal' },
  { value: 'sport',    label: 'Spor' },
  { value: 'game',     label: 'Oyun' },
];

// Deterministik avatar renk paleti
const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4','#84cc16'];
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
const avatarInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : '?';

// ─── Küçük Bileşenler ─────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

function AvatarStack({ count, seeds }: { count: number; seeds: string[] }) {
  const show = seeds.slice(0, 3);
  const extra = Math.max(0, count - show.length);
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2">
        {show.map((seed, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-black/5"
            style={{ background: avatarColor(seed), zIndex: show.length - i }}
          >
            {avatarInitial(seed)}
          </div>
        ))}
      </div>
      <span className="text-xs text-slate-500 font-medium">
        {extra > 0 ? `+${extra} kişi` : `${count} kişi`} katılıyor
      </span>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${meta.gradient} shadow-sm`}>
      <Icon size={10} /> {meta.label}
    </span>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({
  event,
  isFavorited,
  onToggleFavorite,
}: {
  event: any;
  isFavorited: boolean;
  onToggleFavorite: (id: string, current: boolean) => void;
}) {
  const meta = CATEGORY_META[event.category];
  const capacityPct = event.total_capacity > 0
    ? Math.min(Math.round((event.attendeesCount / event.total_capacity) * 100), 100)
    : 0;
  const startDate = new Date(event.start_at);
  const fmtDate = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const fmtTime = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="group bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Cover */}
      <Link href={`/event-detail/${event.id}`} className="block relative h-44 overflow-hidden shrink-0">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: meta?.mesh || 'linear-gradient(135deg, #1e293b, #334155)' }}
          >
            {meta && <meta.icon size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Heart */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(event.id, isFavorited); }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${isFavorited ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-white/30 text-white hover:bg-white/50'}`}
        >
          <Heart size={14} className={isFavorited ? 'fill-current' : ''} />
        </button>

        {/* Date chip */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm">
          <p className="text-[11px] font-bold text-slate-800 leading-none">{fmtDate}</p>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">{fmtTime}</p>
        </div>
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <CategoryBadge category={event.category} />
          {event.is_paid
            ? <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">₺{event.price}</span>
            : <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Ücretsiz</span>
          }
        </div>

        <Link href={`/event-detail/${event.id}`} className="block">
          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
            {event.is_online ? <Globe size={11} /> : <MapPin size={11} />}
            {event.location}
          </p>
        </Link>

        {/* Capacity */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>{event.attendeesCount} katılımcı</span>
            <span>%{capacityPct}</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-blue-500'}`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </div>

        <AvatarStack count={event.attendeesCount} seeds={event.attendeeSeeds || []} />
      </div>
    </motion.div>
  );
}

// ─── HeroBanner ───────────────────────────────────────────────────────────────

function HeroBanner({ event }: { event: any }) {
  if (!event) return null;
  const meta = CATEGORY_META[event.category];
  const startDate = new Date(event.start_at);
  const fmtDate = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative w-full h-52 md:h-64 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
    >
      {event.cover_image_url ? (
        <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" unoptimized priority />
      ) : (
        <div className="absolute inset-0" style={{ background: meta?.mesh || 'linear-gradient(135deg,#1e293b,#334155)' }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Öne Çıkan</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span className="text-[10px] font-bold text-white/60">{fmtDate}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white leading-tight line-clamp-2 tracking-tight">
              {event.title}
            </h2>
            <div className="flex items-center gap-3">
              <CategoryBadge category={event.category} />
              <span className="text-xs text-white/70 flex items-center gap-1">
                <Users size={11} /> {event.attendeesCount} katılımcı
              </span>
            </div>
          </div>
          <Link
            href={`/event-detail/${event.id}`}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold hover:bg-blue-50 transition-colors shadow-lg"
          >
            İncele <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── HeroBanner Skeleton ──────────────────────────────────────────────────────

function HeroBannerSkeleton() {
  return <Skeleton className="w-full h-52 md:h-64 rounded-3xl" />;
}

// ─── Right Sidebar ─────────────────────────────────────────────────────────────

function TrendingModule({ events }: { events: any[] }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={15} className="text-orange-500" />
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Şu An Trend</h3>
      </div>
      <div className="flex flex-col gap-3">
        {events.length === 0 && [1,2,3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
        {events.map((ev, i) => (
          <Link key={ev.id} href={`/event-detail/${ev.id}`} className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
              {ev.cover_image_url
                ? <Image src={ev.cover_image_url} alt={ev.title} fill className="object-cover" unoptimized />
                : <div className="absolute inset-0" style={{ background: CATEGORY_META[ev.category]?.mesh || '#334155' }} />
              }
              <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-[9px] font-black">
                {i + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                {ev.title}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Users size={9} /> {ev.attendeesCount} katılımcı
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function UpcomingModule({ events }: { events: any[] }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={15} className="text-blue-500" />
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Yaklaşan Etkinliklerim</h3>
      </div>
      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Calendar size={24} className="text-slate-300" />
          <p className="text-xs text-slate-400">Kayıtlı etkinliğin yok.</p>
          <p className="text-[10px] text-slate-400">Etkinliklere katılarak burada görüntüle.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((ev) => {
            const d = new Date(ev.events.start_at);
            const day = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            return (
              <Link key={ev.id} href={`/event-detail/${ev.event_id}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[11px] font-black text-blue-700 leading-none">{d.getDate()}</span>
                  <span className="text-[9px] text-blue-500 font-semibold uppercase">{d.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {ev.events.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{day} · {time}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Veri Çekme ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const now = new Date().toISOString();

      // 1. Ana etkinlikler + attendee count
      const eventsQuery = supabase
        .from('events')
        .select('*, event_attendees(count)')
        .eq('status', 'published')
        .gte('end_at', now)
        .order('start_at', { ascending: true })
        .limit(24);

      // 2. Trending: en çok katılımcılı 3
      const trendingQuery = supabase
        .from('events')
        .select('id, title, category, cover_image_url, event_attendees(count)')
        .eq('status', 'published')
        .gte('end_at', now)
        .order('created_at', { ascending: false })
        .limit(20);

      // 3. Favori IDs
      const favQuery = user
        ? supabase.from('event_favorites').select('event_id').eq('user_id', user.id)
        : Promise.resolve({ data: [] });

      // 4. Upcoming user events
      const upcomingQuery = user
        ? supabase
            .from('event_attendees')
            .select('id, event_id, events!inner(id, title, start_at, category)')
            .eq('user_id', user.id)
            .gte('events.start_at', now)
            .order('events.start_at', { ascending: true })
            .limit(2)
        : Promise.resolve({ data: [] });

      const [
        { data: evData },
        { data: trData },
        { data: favData },
        { data: upData },
      ] = await Promise.all([eventsQuery, trendingQuery, favQuery, upcomingQuery]);

      // Process events
      const processedEvents = (evData || []).map((ev: any) => ({
        ...ev,
        attendeesCount: ev.event_attendees?.[0]?.count ?? 0,
        attendeeSeeds: [ev.id.slice(0,4), ev.id.slice(4,8), ev.id.slice(8,12)],
      }));

      // Process trending (sort by attendees client-side)
      const processedTrending = (trData || [])
        .map((ev: any) => ({ ...ev, attendeesCount: ev.event_attendees?.[0]?.count ?? 0 }))
        .sort((a: any, b: any) => b.attendeesCount - a.attendeesCount)
        .slice(0, 3);

      // Featured = most attendees or first upcoming
      const featuredEvent = processedEvents.length > 0
        ? [...processedEvents].sort((a, b) => b.attendeesCount - a.attendeesCount)[0]
        : null;

      setEvents(processedEvents);
      setFeatured(featuredEvent);
      setTrending(processedTrending);
      setUpcoming(upData || []);
      setFavorites(new Set((favData || []).map((f: any) => f.event_id)));
      setLoading(false);
    };

    init();
  }, []);

  // ── Filtreleme ───────────────────────────────────────────────────────────────

  const filteredEvents = events.filter((ev) => {
    const matchesCategory = activeFilter === 'all' || ev.category === activeFilter;
    const matchesSearch = !searchQuery || ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || ev.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ── Favori Toggle (Optimistic) ───────────────────────────────────────────────

  const handleToggleFavorite = useCallback(async (eventId: string, current: boolean) => {
    if (!currentUser) { toast.error('Favorilere eklemek için giriş yapmalısınız.'); return; }

    setFavorites((prev) => {
      const next = new Set(prev);
      current ? next.delete(eventId) : next.add(eventId);
      return next;
    });

    try {
      if (current) {
        const { error } = await supabase.from('event_favorites').delete().eq('event_id', eventId).eq('user_id', currentUser.id);
        if (error) throw error;
        toast.success('Favorilerden çıkarıldı.');
      } else {
        const { error } = await supabase.from('event_favorites').insert([{ event_id: eventId, user_id: currentUser.id }]);
        if (error) throw error;
        toast.success('Favorilere eklendi!');
      }
    } catch {
      // Rollback
      setFavorites((prev) => {
        const next = new Set(prev);
        current ? next.add(eventId) : next.delete(eventId);
        return next;
      });
      toast.error('Bir hata oluştu.');
    }
  }, [currentUser]);

  // ── Search toggle ────────────────────────────────────────────────────────────

  

  const pathname = '/dashboard';

  return (
    <div className="flex min-h-screen bg-[#f5f7f9]">

      
      {/* ── Ana İçerik ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-14 flex items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <LayoutGrid size={13} className="text-white" />
            </div>
            <span className="text-sm font-black text-slate-900">CuratedPulse</span>
          </div>
          <p className="hidden lg:block text-sm font-semibold text-slate-500">
            Merhaba, {currentUser?.email?.split('@')[0] || 'Gezgin'} 👋
          </p>

          <div className="flex items-center gap-1">
            
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors relative">
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <button onClick={() => router.push('/settings')} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Scroll area */}
        <div className="flex-1 flex gap-6 px-5 md:px-8 py-6">
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Hero */}
            {loading ? <HeroBannerSkeleton /> : <HeroBanner event={featured} />}

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 pb-1">
                {ALL_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setActiveFilter(f.value)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      activeFilter === f.value
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button className="shrink-0 w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                <SlidersHorizontal size={15} />
              </button>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                    <Skeleton className="h-44 rounded-none" />
                    <div className="p-4 flex flex-col gap-3">
                      <Skeleton className="h-4 w-24 rounded-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <LayoutGrid size={36} className="text-slate-300" />
                <p className="text-slate-600 font-semibold">Etkinlik bulunamadı</p>
                <p className="text-sm text-slate-400">Farklı bir kategori veya arama terimi deneyin.</p>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredEvents.map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      isFavorited={favorites.has(ev.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* ── Sağ Sidebar ── */}
          <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4">
            <TrendingModule events={trending} />
            <UpcomingModule events={upcoming} />

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Plus size={18} className="text-white" />
              </div>
              <p className="text-sm font-bold text-white">Etkinliğini oluştur</p>
              <p className="text-xs text-blue-200 leading-relaxed">Topluluğuna özel bir etkinlik düzenle.</p>
              <Link
                href="/create-event"
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-blue-200 transition-colors"
              >
                Hemen başla <ChevronRight size={13} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}