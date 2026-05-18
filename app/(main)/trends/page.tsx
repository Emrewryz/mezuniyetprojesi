'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Flame, Zap, Crown, Users, MapPin, Globe, Clock,
  TrendingUp, ChevronRight, Loader2, Timer, Sparkles,
  Music2, Cpu, Palette, Briefcase, PartyPopper, Dumbbell, Gamepad2,
} from 'lucide-react';

interface TrendEvent {
  id: string; title: string; category: string; location: string;
  is_online: boolean; is_paid: boolean; price: number;
  start_at: string; end_at: string;
  cover_image_url: string | null;
  total_capacity: number; attendees_count: number; fill_pct: number;
  trend_score: number;
}

const CAT_META: Record<string, { label: string; icon: any; gradient: string; mesh: string; accent: string }> = {
  music:    { label: 'Müzik',     icon: Music2,      gradient: 'from-pink-500 to-rose-600',    accent: '#f43f5e', mesh: 'radial-gradient(ellipse at 10% 60%,#f43f5e40 0%,transparent 55%),radial-gradient(ellipse at 90% 20%,#be185d30 0%,transparent 55%),linear-gradient(160deg,#12082a 0%,#2d0a38 100%)' },
  tech:     { label: 'Teknoloji', icon: Cpu,         gradient: 'from-blue-500 to-cyan-500',    accent: '#3b82f6', mesh: 'radial-gradient(ellipse at 10% 60%,#3b82f640 0%,transparent 55%),radial-gradient(ellipse at 90% 20%,#06b6d430 0%,transparent 55%),linear-gradient(160deg,#050e1f 0%,#0a1f3d 100%)' },
  art:      { label: 'Sanat',     icon: Palette,     gradient: 'from-violet-500 to-purple-600', accent: '#8b5cf6', mesh: 'radial-gradient(ellipse at 10% 60%,#8b5cf640 0%,transparent 55%),radial-gradient(ellipse at 90% 20%,#a855f730 0%,transparent 55%),linear-gradient(160deg,#0e0520 0%,#1e0a3c 100%)' },
  business: { label: 'İş',        icon: Briefcase,   gradient: 'from-amber-500 to-orange-500', accent: '#f59e0b', mesh: 'radial-gradient(ellipse at 10% 60%,#f59e0b40 0%,transparent 55%),radial-gradient(ellipse at 90% 20%,#ea580c30 0%,transparent 55%),linear-gradient(160deg,#180d00 0%,#2d1500 100%)' },
  social:   { label: 'Sosyal',    icon: PartyPopper, gradient: 'from-emerald-500 to-teal-500', accent: '#10b981', mesh: 'radial-gradient(ellipse at 10% 60%,#10b98140 0%,transparent 55%),radial-gradient(ellipse at 90% 20%,#0d948130 0%,transparent 55%),linear-gradient(160deg,#01180e 0%,#022c1a 100%)' },
  sport:    { label: 'Spor',      icon: Dumbbell,    gradient: 'from-orange-500 to-red-600',   accent: '#f97316', mesh: 'radial-gradient(ellipse at 10% 60%,#f9731640 0%,transparent 55%),radial-gradient(ellipse at 90% 20%,#dc262630 0%,transparent 55%),linear-gradient(160deg,#180700 0%,#2d0a00 100%)' },
  game:     { label: 'Oyun',      icon: Gamepad2,    gradient: 'from-indigo-500 to-violet-600', accent: '#6366f1', mesh: 'radial-gradient(ellipse at 10% 60%,#6366f140 0%,transparent 55%),radial-gradient(ellipse at 90% 20%,#7c3aed30 0%,transparent 55%),linear-gradient(160deg,#06040f 0%,#0f0c29 100%)' },
};

const FILTERS = [
  { value: 'all', label: 'Tümü' },
  ...Object.entries(CAT_META).map(([v, { label }]) => ({ value: v, label })),
];

// ─── FOMO Logic ───────────────────────────────────────────────────────────────

function getPrimaryFomo(ev: TrendEvent, rank: number) {
  const left = ev.total_capacity > 0 ? ev.total_capacity - ev.attendees_count : null;
  if (rank === 0) return { emoji: '👑', text: 'Şehrin En Popüler Etkinliği', bg: 'from-amber-400 to-orange-500' };
  if (left !== null && left <= 5)  return { emoji: '🔥', text: `Son ${left} yer — Tükenmek üzere!`, bg: 'from-red-500 to-rose-600' };
  if (ev.fill_pct >= 85) return { emoji: '🏃', text: `%${ev.fill_pct} Dolu — Hızla tükeniyor`, bg: 'from-orange-500 to-red-500' };
  if (ev.fill_pct >= 60) return { emoji: '⚡', text: `Son ${left ?? ''} yer kaldı`, bg: 'from-amber-500 to-orange-500' };
  const sold = Math.min(ev.attendees_count, 99);
  return { emoji: '🔥', text: `Son 24 saatte ${sold} bilet satıldı`, bg: 'from-blue-500 to-blue-600' };
}

function getCardBadge(ev: TrendEvent) {
  const left = ev.total_capacity > 0 ? ev.total_capacity - ev.attendees_count : null;
  if (left !== null && left <= 3)  return { text: `🔥 Son ${left} bilet`, cls: 'bg-red-500 text-white' };
  if (left !== null && left <= 10) return { text: `⚡ Son ${left} yer`, cls: 'bg-orange-500 text-white' };
  if (ev.fill_pct >= 75) return { text: `🏃 %${ev.fill_pct} dolu`, cls: 'bg-amber-500 text-white' };
  if (ev.attendees_count >= 80) return { text: `⭐ ${ev.attendees_count} katılımcı`, cls: 'bg-violet-500 text-white' };
  return { text: `👥 ${ev.attendees_count} katılıyor`, cls: 'bg-blue-500 text-white' };
}

// ─── Live Counter (animasyonlu) ───────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
    </span>
  );
}

// ─── Bento Hero (büyük kart) ──────────────────────────────────────────────────

function BentoHero({ ev, rank }: { ev: TrendEvent; rank: number }) {
  const meta = CAT_META[ev.category];
  const fomo = getPrimaryFomo(ev, rank);
  const fmtDate = new Date(ev.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  const fmtTime = new Date(ev.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div className="relative h-full rounded-[28px] overflow-hidden group cursor-pointer"
      whileHover={{ scale: 1.012 }} transition={{ duration: 0.22 }}>
      <Link href={`/event-detail/${ev.id}`} className="absolute inset-0 z-20" />

      {/* Arkaplan */}
      {ev.cover_image_url ? (
        <Image src={ev.cover_image_url} alt={ev.title} fill
          className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
      ) : (
        <div className="absolute inset-0" style={{ background: meta?.mesh || '#1e293b' }}>
          {meta && <meta.icon size={180} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.04]" />}
        </div>
      )}

      {/* Katmanlar */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />

      {/* Rank Badge */}
      <div className="absolute top-4 left-4 z-10">
        {rank === 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
            <Crown size={12} className="text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-wide">Trend #1</span>
          </div>
        ) : (
          <div className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
            <span className="text-xs font-black text-white">#{rank + 1}</span>
          </div>
        )}
      </div>

      {/* Live indicator (yüksek dolulukta) */}
      {ev.fill_pct >= 60 && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <LiveDot />
          <span className="text-[10px] font-bold text-white">Canlı</span>
        </div>
      )}

      {/* Fiyat */}
      {!ev.fill_pct || ev.fill_pct < 60 ? (
        <div className="absolute top-4 right-4 z-10">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm backdrop-blur-md ${ev.is_paid ? 'bg-black/30 text-white border border-white/10' : 'bg-emerald-500/80 text-white'}`}>
            {ev.is_paid ? `₺${ev.price}` : 'Ücretsiz'}
          </span>
        </div>
      ) : null}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        {/* FOMO Badge */}
        <div className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black mb-3 bg-gradient-to-r ${fomo.bg} shadow-lg`}>
          <span>{fomo.emoji}</span>
          <span className="text-white">{fomo.text}</span>
        </div>

        <h3 className="text-lg font-black text-white leading-tight line-clamp-2 mb-2 drop-shadow-sm">{ev.title}</h3>

        <div className="flex items-center gap-4 text-white/60 text-[11px] mb-3">
          <span className="flex items-center gap-1.5"><Clock size={10} />{fmtDate} · {fmtTime}</span>
          <span className="flex items-center gap-1.5">{ev.is_online ? <Globe size={10} /> : <MapPin size={10} />}{ev.location.split(',')[0]}</span>
        </div>

        {/* Capacity */}
        {ev.total_capacity > 0 && (
          <div>
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-white/50 flex items-center gap-1"><Users size={9} />{ev.attendees_count} kayıtlı</span>
              <span className={`font-bold ${ev.fill_pct >= 90 ? 'text-red-400' : ev.fill_pct >= 70 ? 'text-amber-400' : 'text-white/60'}`}>%{ev.fill_pct}</span>
            </div>
            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${ev.fill_pct}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className={`h-full rounded-full ${ev.fill_pct >= 90 ? 'bg-red-400' : ev.fill_pct >= 70 ? 'bg-amber-400' : 'bg-blue-400'}`} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Bento Small ─────────────────────────────────────────────────────────────

function BentoSmall({ ev, rank }: { ev: TrendEvent; rank: number }) {
  const meta = CAT_META[ev.category];
  const fomo = getPrimaryFomo(ev, rank);
  const fmtDate = new Date(ev.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

  return (
    <motion.div className="relative h-full rounded-[22px] overflow-hidden group cursor-pointer"
      whileHover={{ scale: 1.015 }} transition={{ duration: 0.2 }}>
      <Link href={`/event-detail/${ev.id}`} className="absolute inset-0 z-20" />

      {ev.cover_image_url ? (
        <Image src={ev.cover_image_url} alt={ev.title} fill
          className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
      ) : (
        <div className="absolute inset-0" style={{ background: meta?.mesh || '#1e293b' }}>
          {meta && <meta.icon size={80} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.05]" />}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <div className="absolute top-3 left-3 z-10">
        <div className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md">
          <span className="text-[10px] font-black text-white">#{rank + 1}</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10">
        <div className={`self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black mb-2 bg-gradient-to-r ${fomo.bg}`}>
          <span>{fomo.emoji}</span><span className="text-white">{fomo.text}</span>
        </div>
        <h4 className="text-xs font-black text-white leading-tight line-clamp-2 mb-1.5">{ev.title}</h4>
        <div className="flex items-center justify-between text-[9px] text-white/50">
          <span className="flex items-center gap-1"><Clock size={8} />{fmtDate}</span>
          <span className={`font-bold ${ev.is_paid ? 'text-white/70' : 'text-emerald-400'}`}>{ev.is_paid ? `₺${ev.price}` : 'Ücretsiz'}</span>
        </div>
        {ev.total_capacity > 0 && (
          <div className="h-1 bg-white/15 rounded-full overflow-hidden mt-2">
            <motion.div initial={{ width: 0 }} animate={{ width: `${ev.fill_pct}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
              className={`h-full rounded-full ${ev.fill_pct >= 90 ? 'bg-red-400' : ev.fill_pct >= 70 ? 'bg-amber-400' : 'bg-blue-400'}`} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Showcase Card ────────────────────────────────────────────────────────────

function ShowcaseCard({ ev, badgeText, badgeCls }: { ev: TrendEvent; badgeText: string; badgeCls: string }) {
  const meta = CAT_META[ev.category];
  const fmtDate = new Date(ev.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const hoursLeft = Math.max(0, Math.round((new Date(ev.start_at).getTime() - Date.now()) / 3600000));
  const isUrgent = hoursLeft < 48;

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className="shrink-0 w-56">
      <Link href={`/event-detail/${ev.id}`}
        className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 group">
        <div className="relative h-32 overflow-hidden">
          {ev.cover_image_url
            ? <Image src={ev.cover_image_url} alt={ev.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
            : <div className="absolute inset-0" style={{ background: meta?.mesh || '#1e293b' }}>
                {meta && <meta.icon size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10" />}
              </div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-2 left-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm ${badgeCls}`}>
              {badgeText}
            </span>
          </div>
          {isUrgent && hoursLeft > 0 && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded-full">
              <span className="text-[9px] font-black text-white flex items-center gap-0.5">
                <Timer size={8} /> {hoursLeft}s
              </span>
            </div>
          )}
        </div>

        <div className="p-3 flex flex-col gap-1.5">
          {meta && (
            <span className={`self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r ${meta.gradient}`}>
              <meta.icon size={8} /> {meta.label}
            </span>
          )}
          <h4 className="text-[11px] font-black text-slate-900 line-clamp-2 leading-tight">{ev.title}</h4>
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span className="flex items-center gap-0.5"><MapPin size={8} />{ev.location.split(',')[0]}</span>
            <span className={`font-black ${ev.is_paid ? 'text-slate-600' : 'text-emerald-600'}`}>
              {ev.is_paid ? `₺${ev.price}` : 'Ücretsiz'}
            </span>
          </div>
          {ev.total_capacity > 0 && (
            <div>
              <div className="flex justify-between text-[8px] text-slate-400 mb-0.5">
                <span className="flex items-center gap-0.5"><Users size={7} /> {ev.attendees_count}</span>
                <span className={`font-bold ${ev.fill_pct >= 80 ? 'text-red-500' : 'text-slate-400'}`}>%{ev.fill_pct}</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${ev.fill_pct >= 90 ? 'bg-red-400' : ev.fill_pct >= 70 ? 'bg-amber-400' : 'bg-blue-500'}`}
                  style={{ width: `${ev.fill_pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Horizontal Showcase ──────────────────────────────────────────────────────

function Showcase({ title, subtitle, events, badgeFn, emptyText }: {
  title: string; subtitle?: string;
  events: TrendEvent[];
  badgeFn: (ev: TrendEvent) => { text: string; cls: string };
  emptyText?: string;
}) {
  if (events.length === 0) return null;
  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <Link href="/dashboard" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors shrink-0">
          Tümü <ChevronRight size={13} />
        </Link>
      </div>
      <div className="flex gap-3.5 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4">
        {events.map(ev => {
          const { text, cls } = badgeFn(ev);
          return <ShowcaseCard key={ev.id} ev={ev} badgeText={text} badgeCls={cls} />;
        })}
      </div>
    </div>
  );
}

// ─── Bento Skeleton ───────────────────────────────────────────────────────────

function BentoSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 h-[440px]">
      <div className="row-span-2 bg-slate-200 rounded-[28px] animate-pulse" />
      <div className="bg-slate-200 rounded-[22px] animate-pulse" />
      <div className="bg-slate-200 rounded-[22px] animate-pulse" />
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const [allEvents, setAllEvents] = useState<TrendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('city').eq('id', user.id).single();
        setUserCity(profile?.city || null);
      }

      const { data: events } = await supabase
        .from('events')
        .select('id,title,category,location,is_online,is_paid,price,start_at,end_at,cover_image_url,total_capacity,event_attendees(count)')
        .eq('status', 'published')
        .gte('end_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(60);

      const mapped: TrendEvent[] = (events || []).map((e: any) => {
        const cnt = Number(e.event_attendees?.[0]?.count ?? 0);
        const fill = e.total_capacity > 0 ? Math.min(Math.round((cnt / e.total_capacity) * 100), 100) : 0;
        const score = fill * 0.55 + cnt * 0.45;
        return { ...e, attendees_count: cnt, fill_pct: fill, trend_score: score };
      });

      setAllEvents(mapped);
      setLoading(false);
    })();
  }, []);

  const base = activeFilter === 'all' ? allEvents : allEvents.filter(e => e.category === activeFilter);
  const sorted = [...base].sort((a, b) => b.trend_score - a.trend_score);
  const bentoItems = sorted.slice(0, 3);
  const fastFilling = [...base].filter(e => e.fill_pct >= 40).sort((a, b) => b.fill_pct - a.fill_pct).slice(0, 12);
  const communityFaves = [...base].sort((a, b) => b.attendees_count - a.attendees_count).slice(0, 12);

  const cityLabel = userCity ? `${userCity}'da` : 'Şehrinde';

  return (
    <div className="flex flex-col gap-8 pb-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md shadow-red-200">
              <Flame size={15} className="text-white" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
              <LiveDot />
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Canlı Trendler</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {cityLabel} Ne Trend?
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">En popüler, en hızlı tükenen etkinlikleri kaçırma.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-slate-900">{base.length}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Aktif Etkinlik</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {FILTERS.map(f => {
          const meta = CAT_META[f.value as keyof typeof CAT_META];
          const Icon = meta?.icon;
          return (
            <button key={f.value} onClick={() => setActiveFilter(f.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                activeFilter === f.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}>
              {Icon && <Icon size={11} className={activeFilter === f.value ? 'text-white' : 'text-slate-400'} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Bento Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <BentoSkeleton />
        ) : bentoItems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center">
              <TrendingUp size={22} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">Bu kategoride henüz trend yok.</p>
            <button onClick={() => setActiveFilter('all')} className="text-xs font-semibold text-blue-500 hover:text-blue-700">
              Tüm trendleri gör
            </button>
          </motion.div>
        ) : (
          <motion.div key={activeFilter} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}>
            {/* Desktop: 3 kolon, Mobile: 2 kolon */}
            <div className="hidden md:grid grid-cols-3 gap-3" style={{ height: 460 }}>
              {bentoItems[0] && (
                <div className="row-span-2" style={{ gridRow: 'span 2' }}>
                  <BentoHero ev={bentoItems[0]} rank={0} />
                </div>
              )}
              {bentoItems[1] && <BentoSmall ev={bentoItems[1]} rank={1} />}
              {bentoItems[2] && <BentoSmall ev={bentoItems[2]} rank={2} />}
            </div>
            {/* Mobile: 2 kolon */}
            <div className="grid md:hidden grid-cols-2 gap-3" style={{ height: 380 }}>
              {bentoItems[0] && (
                <div className="row-span-2" style={{ gridRow: 'span 2' }}>
                  <BentoHero ev={bentoItems[0]} rank={0} />
                </div>
              )}
              {bentoItems[1] && <BentoSmall ev={bentoItems[1]} rank={1} />}
              {bentoItems[2] && <BentoSmall ev={bentoItems[2]} rank={2} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Separator */}
      {!loading && base.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={10} /> Keşif Vitrinleri
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      )}

      {/* Vitrin 1 */}
      {!loading && (
        <Showcase
          title="Hızla Tükenenler ⚡"
          subtitle="Kapasite dolmadan yerinizi alın"
          events={fastFilling}
          badgeFn={(ev) => {
            const left = ev.total_capacity > 0 ? ev.total_capacity - ev.attendees_count : null;
            if (left !== null && left <= 3)  return { text: `🔥 Son ${left} bilet`, cls: 'bg-red-500 text-white' };
            if (left !== null && left <= 8)  return { text: `⚡ Son ${left} yer`, cls: 'bg-orange-500 text-white' };
            if (ev.fill_pct >= 80) return { text: `🏃 %${ev.fill_pct} dolu`, cls: 'bg-amber-500 text-white' };
            return { text: `⚡ Dolmak üzere`, cls: 'bg-amber-400 text-white' };
          }}
        />
      )}

      {/* Vitrin 2 */}
      {!loading && (
        <Showcase
          title="Topluluğun Gözdeleri 🌟"
          subtitle="Herkesin konuştuğu etkinlikler"
          events={communityFaves}
          badgeFn={(ev) => {
            if (ev.attendees_count >= 100) return { text: `⭐ ${ev.attendees_count} katılımcı`, cls: 'bg-violet-500 text-white' };
            if (ev.attendees_count >= 50)  return { text: `🎯 ${ev.attendees_count} kişi`, cls: 'bg-blue-500 text-white' };
            if (ev.attendees_count >= 20)  return { text: `🌟 Popüler`, cls: 'bg-indigo-500 text-white' };
            return { text: `👥 ${ev.attendees_count} katılıyor`, cls: 'bg-emerald-500 text-white' };
          }}
        />
      )}

      {/* Loading carousels skeleton */}
      {loading && (
        <div className="flex flex-col gap-8">
          {[0, 1].map(i => (
            <div key={i} className="flex flex-col gap-4">
              <div className="h-5 w-44 bg-slate-200 rounded-lg animate-pulse" />
              <div className="flex gap-3.5 overflow-hidden">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="shrink-0 w-56 h-52 bg-slate-200 rounded-3xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}