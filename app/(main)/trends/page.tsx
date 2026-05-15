'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Flame, TrendingUp, Zap, Eye, Users, MapPin,
  Calendar, ChevronRight, Globe, Music2, Cpu,
  Palette, Briefcase, PartyPopper, Dumbbell, Gamepad2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrendEvent {
  id: string;
  title: string;
  category: string;
  location: string;
  is_online: boolean;
  is_paid: boolean;
  price: number;
  start_at: string;
  cover_image_url: string | null;
  total_capacity: number;
  attendeesCount: number;
  trendScore: number;
  rank: number;
  trendVelocity: string;
  sparkline: number[];
}

// ─── Sabitler ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: any; gradient: string; mesh: string }> = {
  music:    { label: 'Müzik',     icon: Music2,      gradient: 'from-pink-500 to-rose-600',    mesh: 'linear-gradient(135deg,#1e1b4b,#be185d)' },
  tech:     { label: 'Teknoloji', icon: Cpu,         gradient: 'from-blue-500 to-cyan-500',    mesh: 'linear-gradient(135deg,#0f172a,#1d4ed8)' },
  art:      { label: 'Sanat',     icon: Palette,     gradient: 'from-violet-500 to-purple-600',mesh: 'linear-gradient(135deg,#1a0533,#7c3aed)' },
  business: { label: 'İş',        icon: Briefcase,   gradient: 'from-amber-500 to-orange-500', mesh: 'linear-gradient(135deg,#1c0a00,#d97706)' },
  social:   { label: 'Sosyal',    icon: PartyPopper, gradient: 'from-emerald-500 to-teal-500', mesh: 'linear-gradient(135deg,#022c22,#059669)' },
  sport:    { label: 'Spor',      icon: Dumbbell,    gradient: 'from-orange-500 to-red-500',   mesh: 'linear-gradient(135deg,#1c0a00,#ea580c)' },
  game:     { label: 'Oyun',      icon: Gamepad2,    gradient: 'from-indigo-500 to-blue-700',  mesh: 'linear-gradient(135deg,#0f0c29,#4338ca)' },
};

const FILTERS = [
  { value: 'all', label: 'Tümü' },
  { value: 'music', label: 'Müzik' },
  { value: 'tech', label: 'Teknoloji' },
  { value: 'art', label: 'Sanat' },
  { value: 'business', label: 'İş' },
  { value: 'social', label: 'Sosyal' },
];

const TIMEFRAMES = [
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Bu Hafta' },
];

const VELOCITIES = [
  (n: number) => `🔥 Son 24 saatte +${n} inceleme`,
  (n: number) => `⚡ Şu an ${n} kişi bakıyor`,
  (n: number) => `📈 Bu hafta +%${n} büyüme`,
  (n: number) => `🎯 ${n} yeni katılım bugün`,
];

function genSparkline(seed: number): number[] {
  let v = 20 + (seed % 30);
  return Array.from({ length: 8 }, (_, i) => {
    v = Math.max(10, Math.min(95, v + (Math.sin(seed * i) * 15 + (i * 4))));
    return Math.round(v);
  });
}

function genVelocity(id: string, score: number): string {
  const idx = id.charCodeAt(0) % VELOCITIES.length;
  const n = 20 + (score % 480);
  return VELOCITIES[idx](n);
}

function processEvents(raw: any[]): TrendEvent[] {
  return raw
    .map((ev, i) => {
      const count = ev.event_attendees?.[0]?.count ?? 0;
      const daysUntil = Math.max(1, Math.round((new Date(ev.start_at).getTime() - Date.now()) / 86400000));
      const trendScore = Math.round((count * 100) / daysUntil + (ev.price === 0 ? 200 : 0));
      return {
        ...ev,
        attendeesCount: count,
        trendScore,
        sparkline: genSparkline(trendScore + i),
        trendVelocity: genVelocity(ev.id, trendScore),
        rank: 0,
      };
    })
    .sort((a, b) => b.trendScore - a.trendScore)
    .map((ev, i) => ({ ...ev, rank: i + 1 }));
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ data, color = '#3b82f6', height = 32, width = 80 }: {
  data: number[]; color?: string; height?: number; width?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * width);
  const ys = data.map((v) => height - ((v - min) / range) * height * 0.85 - height * 0.075);
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fill = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${color.replace('#','')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3" fill={color} />
    </svg>
  );
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank, large = false }: { rank: number; large?: boolean }) {
  const colors = ['from-amber-400 to-yellow-500', 'from-slate-400 to-slate-500', 'from-orange-400 to-amber-500'];
  const gradient = colors[rank - 1] || 'from-slate-300 to-slate-400';
  return (
    <div className={`flex items-center justify-center rounded-full font-black text-white bg-gradient-to-br ${gradient} shadow-lg ${large ? 'w-10 h-10 text-base' : 'w-7 h-7 text-xs'}`}>
      #{rank}
    </div>
  );
}

// ─── Velocity Badge ───────────────────────────────────────────────────────────

function VelocityBadge({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
      dark ? 'bg-white/15 text-white backdrop-blur-sm' : 'bg-slate-100 text-slate-700'
    }`}>
      {text}
    </span>
  );
}

// ─── Cover Background ─────────────────────────────────────────────────────────

function CoverBg({ event, className = '' }: { event: TrendEvent; className?: string }) {
  const meta = CATEGORY_META[event.category];
  return (
    <>
      {event.cover_image_url ? (
        <Image src={event.cover_image_url} alt={event.title} fill className={`object-cover ${className}`} unoptimized />
      ) : (
        <div className="absolute inset-0" style={{ background: meta?.mesh || '#1e293b' }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
    </>
  );
}

// ─── Card Variants ────────────────────────────────────────────────────────────

function HeroCard({ event }: { event: TrendEvent }) {
  const meta = CATEGORY_META[event.category];
  const fmtDate = new Date(event.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.005 }}
      transition={{ duration: 0.2 }}
      className="relative col-span-2 row-span-2 rounded-3xl overflow-hidden min-h-[360px] group"
    >
      <CoverBg event={event} className="group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 p-7 flex flex-col justify-between z-10">
        <div className="flex items-start justify-between">
          <RankBadge rank={event.rank} large />
          <VelocityBadge text={event.trendVelocity} dark />
        </div>
        <div className="flex flex-col gap-3">
          {meta && (
            <span className={`self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${meta.gradient}`}>
              <meta.icon size={11} /> {meta.label}
            </span>
          )}
          <h2 className="text-2xl font-black text-white leading-tight line-clamp-2 tracking-tight">{event.title}</h2>
          <div className="flex items-center gap-4 text-white/70 text-xs font-medium">
            <span className="flex items-center gap-1"><Calendar size={11} />{fmtDate}</span>
            <span className="flex items-center gap-1"><Users size={11} />{event.attendeesCount} katılımcı</span>
            <span className="flex items-center gap-1">
              {event.is_online ? <Globe size={11} /> : <MapPin size={11} />}
              {event.location}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-black ${event.is_paid ? 'text-white' : 'text-emerald-400'}`}>
              {event.is_paid ? `₺${event.price}` : 'Ücretsiz'}
            </span>
            <Link
              href={`/event-detail/${event.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold hover:bg-blue-50 transition-colors shadow-lg"
            >
              İncele <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function WideCard({ event }: { event: TrendEvent }) {
  const meta = CATEGORY_META[event.category];
  const fmtDate = new Date(event.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="relative col-span-2 rounded-3xl overflow-hidden min-h-[160px] group"
    >
      <CoverBg event={event} className="group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 p-5 flex items-end justify-between z-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <RankBadge rank={event.rank} />
            {meta && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${meta.gradient}`}>
                <meta.icon size={9} /> {meta.label}
              </span>
            )}
            <VelocityBadge text={event.trendVelocity} dark />
          </div>
          <h3 className="text-base font-black text-white leading-snug line-clamp-1">{event.title}</h3>
          <div className="flex items-center gap-3 text-white/60 text-[11px]">
            <span className="flex items-center gap-1"><Calendar size={9} />{fmtDate}</span>
            <span className="flex items-center gap-1"><Users size={9} />{event.attendeesCount}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Sparkline data={event.sparkline} color="#60a5fa" width={72} height={28} />
          <Link href={`/event-detail/${event.id}`} className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-bold hover:bg-white/30 transition-colors">
            İncele <ChevronRight size={11} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function SquareCard({ event }: { event: TrendEvent }) {
  const meta = CATEGORY_META[event.category];
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-3xl overflow-hidden min-h-[160px] group"
    >
      <CoverBg event={event} className="group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
        <div className="flex items-start justify-between">
          <RankBadge rank={event.rank} />
          {meta && <meta.icon size={16} className="text-white/60" />}
        </div>
        <div className="flex flex-col gap-1.5">
          <VelocityBadge text={event.trendVelocity} dark />
          <h3 className="text-sm font-black text-white leading-snug line-clamp-2">{event.title}</h3>
          <span className={`self-start text-xs font-bold ${event.is_paid ? 'text-white/80' : 'text-emerald-400'}`}>
            {event.is_paid ? `₺${event.price}` : 'Ücretsiz'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function HorizontalCard({ event }: { event: TrendEvent }) {
  const meta = CATEGORY_META[event.category];
  const fmtDate = new Date(event.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const capacityPct = event.total_capacity > 0
    ? Math.min(Math.round((event.attendeesCount / event.total_capacity) * 100), 100)
    : 0;
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.18 }}
      className="col-span-2 bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-shadow flex gap-4 p-4 items-center group"
    >
      <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0">
        {event.cover_image_url
          ? <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" unoptimized />
          : <div className="absolute inset-0" style={{ background: meta?.mesh || '#1e293b' }} />
        }
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <RankBadge rank={event.rank} />
          {meta && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${meta.gradient}`}>
              <meta.icon size={9} /> {meta.label}
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-medium">{event.trendVelocity}</span>
        </div>
        <p className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{event.title}</p>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Calendar size={9} />{fmtDate}</span>
          <span className="flex items-center gap-1"><MapPin size={9} />{event.location}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${capacityPct}%` }} />
          </div>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">{event.attendeesCount} katılımcı</span>
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        <Sparkline data={event.sparkline} color="#8b5cf6" width={56} height={24} />
        <Link href={`/event-detail/${event.id}`} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-blue-500 hover:text-white transition-colors">
          <ChevronRight size={13} />
        </Link>
      </div>
    </motion.div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-3xl ${className}`} />;
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const [events, setEvents] = useState<TrendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    (async () => {
      const now = new Date();
      const cutoff = timeframe === 'today'
        ? new Date(now.getTime() + 86400000).toISOString()
        : new Date(now.getTime() + 7 * 86400000).toISOString();

      const { data } = await supabase
        .from('events')
        .select('*, event_attendees(count)')
        .eq('status', 'published')
        .gte('end_at', now.toISOString())
        .lte('start_at', cutoff)
        .limit(12);

      if (data && data.length > 0) {
        setEvents(processEvents(data));
      } else {
        // Fallback: son eklenen published etkinlikler
        const { data: fallback } = await supabase
          .from('events')
          .select('*, event_attendees(count)')
          .eq('status', 'published')
          .gte('end_at', now.toISOString())
          .order('created_at', { ascending: false })
          .limit(12);
        setEvents(processEvents(fallback || []));
      }
      setLoading(false);
    })();
  }, [timeframe]);

  const filtered = filter === 'all' ? events : events.filter((e) => e.category === filter);

  const [hero, wide, ...rest] = filtered;
  const squares = rest.filter((_, i) => i % 3 !== 2);
  const horizontals = rest.filter((_, i) => i % 3 === 2);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7f9]">
      <div className="px-5 md:px-10 py-8 max-w-7xl mx-auto w-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md shadow-orange-200">
                <Flame size={14} className="text-white" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Canlı Trendler</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ne Trend?</h1>
            <p className="text-sm text-slate-400 mt-0.5">{filtered.length} etkinlik sıralandı</p>
          </div>
          {/* Timeframe toggle */}
          <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTimeframe(t.value); setLoading(true); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  timeframe === t.value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === f.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bento Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="col-span-2 row-span-2 min-h-[360px]" />
            <Skeleton className="col-span-2 min-h-[160px]" />
            <Skeleton className="min-h-[160px]" />
            <Skeleton className="min-h-[160px]" />
            <Skeleton className="col-span-2 min-h-[88px]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <TrendingUp size={40} className="text-slate-300" />
            <p className="text-slate-600 font-semibold">Trend etkinlik bulunamadı</p>
            <p className="text-sm text-slate-400">Farklı filtre veya zaman aralığı dene.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-auto">
            {hero && <HeroCard event={hero} />}
            {wide && <WideCard event={wide} />}
            {squares.map((ev) => <SquareCard key={ev.id} event={ev} />)}
            {horizontals.map((ev) => <HorizontalCard key={ev.id} event={ev} />)}
          </div>
        )}

        {/* Leaderboard tablo */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Zap size={15} className="text-amber-500" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tam Sıralama</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {filtered.map((ev, i) => {
                const meta = CATEGORY_META[ev.category];
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 text-center">
                      <RankBadge rank={ev.rank} />
                    </div>
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative">
                      {ev.cover_image_url
                        ? <Image src={ev.cover_image_url} alt={ev.title} fill className="object-cover" unoptimized />
                        : <div className="absolute inset-0" style={{ background: meta?.mesh || '#1e293b' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{ev.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{ev.trendVelocity}</p>
                    </div>
                    <div className="hidden sm:block shrink-0">
                      <Sparkline data={ev.sparkline} color="#3b82f6" width={60} height={22} />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800">{ev.trendScore.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">puan</p>
                      </div>
                      <Link href={`/event-detail/${ev.id}`} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-blue-500 hover:text-white transition-colors">
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}