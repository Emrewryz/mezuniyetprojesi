'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, ChevronRight, Calendar, MapPin, Clock,
  Globe, Ticket, Star, PlusCircle, Loader2, Users, Bookmark,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type RelationType = 'attending' | 'organizing' | 'saved';

interface CalEvent {
  id: string;
  title: string;
  category: string;
  location: string;
  is_online: boolean;
  is_paid: boolean;
  price: number;
  start_at: string;
  end_at: string;
  cover_image_url: string | null;
  relationType: RelationType;
}

// ─── Sabitler ────────────────────────────────────────────────────────────────

const TABS: { key: RelationType; label: string; icon: any }[] = [
  { key: 'attending',  label: 'Katılacaklarım',  icon: Ticket },
  { key: 'organizing', label: 'Düzenlediklerim', icon: Star },
  { key: 'saved',      label: 'Kaydettiklerim',  icon: Bookmark },
];

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const CATEGORY_DOTS: Record<string, string> = {
  music: 'bg-pink-400', tech: 'bg-blue-400', art: 'bg-violet-400',
  business: 'bg-amber-400', social: 'bg-emerald-400', sport: 'bg-orange-400', game: 'bg-indigo-400',
};

const MESH_BG: Record<string, string> = {
  music: 'linear-gradient(135deg,#1e1b4b,#be185d)',
  tech: 'linear-gradient(135deg,#0f172a,#1d4ed8)',
  art: 'linear-gradient(135deg,#1a0533,#7c3aed)',
  business: 'linear-gradient(135deg,#1c0a00,#d97706)',
  social: 'linear-gradient(135deg,#022c22,#059669)',
  sport: 'linear-gradient(135deg,#1c0a00,#ea580c)',
  game: 'linear-gradient(135deg,#0f0c29,#4338ca)',
};

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const cells: (Date | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: RelationType }) {
  const msgs: Record<RelationType, string> = {
    attending:  'Bu tarihte katılacağın bir etkinlik yok.',
    organizing: 'Bu tarihte düzenlediğin bir etkinlik yok.',
    saved:      'Bu tarihte kaydettiğin bir etkinlik yok.',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 py-12 text-center"
    >
      <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
        <Calendar size={28} className="text-slate-300" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600">{msgs[tab]}</p>
        <p className="text-xs text-slate-400 mt-1">Yeni etkinlikler keşfederek takvimine ekle.</p>
      </div>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
      >
        <PlusCircle size={15} /> Yeni Etkinlik Keşfet
      </Link>
    </motion.div>
  );
}

// ─── Event Detail Card ────────────────────────────────────────────────────────

function EventDetailCard({ event }: { event: CalEvent }) {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const fmtTime = `${start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  const dot = CATEGORY_DOTS[event.category] || 'bg-blue-400';

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] transition-all overflow-hidden flex gap-0"
    >
      {/* Color strip */}
      <div className={`w-1.5 shrink-0 ${dot}`} />

      <div className="flex gap-3 p-4 flex-1 min-w-0">
        {/* Cover */}
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative">
          {event.cover_image_url
            ? <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" unoptimized />
            : <div className="absolute inset-0" style={{ background: MESH_BG[event.category] || '#1e293b' }} />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {event.title}
          </p>
          <div className="flex flex-col gap-1 mt-1.5">
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock size={10} className="shrink-0" /> {fmtTime}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
              {event.is_online ? <Globe size={10} className="shrink-0" /> : <MapPin size={10} className="shrink-0" />}
              {event.location}
            </p>
          </div>
        </div>

        {/* Price + Link */}
        <div className="flex flex-col items-end justify-between shrink-0">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${event.is_paid ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
            {event.is_paid ? `₺${event.price}` : 'Ücretsiz'}
          </span>
          <Link
            href={`/event-detail/${event.id}`}
            className="text-[11px] font-bold text-blue-500 hover:text-blue-700 transition-colors"
          >
            İncele →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState<RelationType>('attending');
  const [allEvents, setAllEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const base = 'id, title, category, location, is_online, is_paid, price, start_at, end_at, cover_image_url';

      const [
        { data: attending },
        { data: organizing },
        { data: saved },
      ] = await Promise.all([
        supabase
          .from('event_attendees')
          .select(`events!inner(${base})`)
          .eq('user_id', user.id)
          .gte('events.end_at', new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString())
          .lte('events.start_at', new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59).toISOString()),
        supabase
          .from('events')
          .select(base)
          .eq('organizer_id', user.id)
          .gte('end_at', new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString())
          .lte('start_at', new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59).toISOString()),
        supabase
          .from('event_favorites')
          .select(`events!inner(${base})`)
          .eq('user_id', user.id)
          .gte('events.end_at', new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString())
          .lte('events.start_at', new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59).toISOString()),
      ]);

      const map = (arr: any[], type: RelationType): CalEvent[] =>
        (arr || []).map((row) => ({ ...(row.events ?? row), relationType: type }));

      setAllEvents([
        ...map(attending || [], 'attending'),
        ...map(organizing || [], 'organizing'),
        ...map(saved || [], 'saved'),
      ]);
      setLoading(false);
    })();
  }, [viewDate]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const tabEvents = useMemo(
    () => allEvents.filter((e) => e.relationType === activeTab),
    [allEvents, activeTab]
  );

  const dayEvents = useMemo(
    () => tabEvents.filter((e) => isSameDay(new Date(e.start_at), selectedDate)),
    [tabEvents, selectedDate]
  );

  const grid = useMemo(
    () => getMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const dotsForDay = (day: Date) =>
    tabEvents
      .filter((e) => isSameDay(new Date(e.start_at), day))
      .slice(0, 3)
      .map((e) => CATEGORY_DOTS[e.category] || 'bg-blue-400');

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7f9]">
      <div className="px-5 md:px-10 py-8 max-w-6xl mx-auto w-full flex flex-col gap-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-md shadow-violet-200">
              <Calendar size={14} className="text-white" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">EtkinRota</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Takvim</h1>
          <p className="text-sm text-slate-400 mt-0.5">Kişisel etkinlik ajandanı yönet.</p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Takvim ── */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.05)] p-6">

            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <p className="text-sm font-black text-slate-900">
                {MONTHS_TR[viewDate.getMonth()]} {viewDate.getFullYear()}
              </p>
              <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_TR.map((d) => (
                <p key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">{d}</p>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-y-1">
              {grid.map((day, i) => {
                if (!day) return <div key={i} />;
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedDate);
                const dots = loading ? [] : dotsForDay(day);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`relative flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all group ${
                      isSelected
                        ? 'bg-blue-600 shadow-md shadow-blue-200'
                        : isToday
                          ? 'bg-blue-50 ring-2 ring-blue-200'
                          : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-bold leading-none ${
                      isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-slate-700'
                    }`}>
                      {day.getDate()}
                    </span>
                    <div className="flex gap-0.5 h-2 items-center justify-center">
                      {dots.slice(0, 3).map((color, j) => (
                        <span key={j} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : color}`} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-slate-50 flex flex-wrap gap-3">
              {Object.entries(CATEGORY_DOTS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-[10px] text-slate-400 font-medium capitalize">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Gün Detayı ── */}
          <div className="lg:col-span-7 flex flex-col gap-4">

            {/* Selected date header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {selectedDate.toLocaleDateString('tr-TR', { weekday: 'long' })}
                </p>
                <p className="text-base font-black text-slate-900">
                  {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {dayEvents.length > 0 && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                  {dayEvents.length} etkinlik
                </span>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 flex gap-3 p-4">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <div className="flex-1 flex flex-col gap-2 py-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : dayEvents.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
                <EmptyState tab={activeTab} />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="flex flex-col gap-3">
                  {dayEvents.map((ev) => (
                    <EventDetailCard key={ev.id} event={ev} />
                  ))}
                </div>
              </AnimatePresence>
            )}

            {/* Upcoming in tab (not just today) */}
            {!loading && dayEvents.length === 0 && tabEvents.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.05)] p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Bu Aydaki Diğer Etkinlikler</p>
                <div className="flex flex-col gap-2">
                  {tabEvents.slice(0, 4).map((ev) => {
                    const d = new Date(ev.start_at);
                    return (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedDate(d)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center shrink-0 ${CATEGORY_DOTS[ev.category]?.replace('bg-', 'bg-').replace('-400', '-100') || 'bg-blue-100'}`}>
                          <span className="text-[10px] font-black text-slate-700 leading-none">{d.getDate()}</span>
                          <span className="text-[8px] text-slate-500 uppercase">{MONTHS_TR[d.getMonth()].slice(0,3)}</span>
                        </div>
                        <p className="flex-1 text-xs font-semibold text-slate-700 line-clamp-1 group-hover:text-blue-600 transition-colors">{ev.title}</p>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOTS[ev.category] || 'bg-blue-400'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}