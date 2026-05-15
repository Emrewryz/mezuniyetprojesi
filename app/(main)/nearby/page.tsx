'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, ChevronRight, MapPin, Calendar,
  Users, Ticket, ArrowUpRight, Loader2,
} from 'lucide-react';

const NearbyMapClient = dynamic(() => import('@/components/ui/NearbyMapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-slate-400" />
    </div>
  ),
});

// ── Fallback dummy data (DB'de koordinatlı etkinlik yoksa) ───────────────────
const DUMMY: any[] = [
  {
    id: 'd1', title: 'Kaleiçi Caz Gecesi', category: 'music',
    location: 'Kaleiçi, Antalya', is_paid: true, price: 150,
    start_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    total_capacity: 200, attendeesCount: 142, cover_image_url: null,
    lat: 36.8841, lng: 30.7056,
  },
  {
    id: 'd2', title: 'Açık Hava Sanat Sergisi', category: 'art',
    location: 'Atatürk Parkı, Antalya', is_paid: false, price: 0,
    start_at: new Date(Date.now() + 86400000 * 4).toISOString(),
    total_capacity: 300, attendeesCount: 88, cover_image_url: null,
    lat: 36.8860, lng: 30.7020,
  },
  {
    id: 'd3', title: 'Konyaaltı Tech Summit', category: 'tech',
    location: 'Konyaaltı, Antalya', is_paid: true, price: 250,
    start_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    total_capacity: 500, attendeesCount: 310, cover_image_url: null,
    lat: 36.8770, lng: 30.6480,
  },
  {
    id: 'd4', title: 'Lara Beach Sosyal Buluşma', category: 'social',
    location: 'Lara, Antalya', is_paid: false, price: 0,
    start_at: new Date(Date.now() + 86400000 * 10).toISOString(),
    total_capacity: 150, attendeesCount: 54, cover_image_url: null,
    lat: 36.8520, lng: 30.7550,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  music: 'Müzik', tech: 'Teknoloji', art: 'Sanat',
  business: 'İş', social: 'Sosyal', sport: 'Spor', game: 'Oyun',
};

const CATEGORY_GRADIENT: Record<string, string> = {
  music: 'from-pink-500 to-rose-600',
  tech: 'from-blue-500 to-cyan-600',
  art: 'from-violet-500 to-purple-600',
  business: 'from-amber-500 to-orange-500',
  social: 'from-emerald-500 to-teal-600',
  sport: 'from-orange-500 to-red-500',
  game: 'from-indigo-500 to-blue-700',
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

export default function NearbyPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('*, event_attendees(count)')
        .eq('status', 'published')
        .gte('end_at', new Date().toISOString())
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('start_at', { ascending: true })
        .limit(20);

      if (data && data.length > 0) {
        setEvents(data.map((ev: any) => ({
          ...ev,
          lat: parseFloat(ev.latitude),
          lng: parseFloat(ev.longitude),
          attendeesCount: ev.event_attendees?.[0]?.count ?? 0,
        })));
      } else {
        setEvents(DUMMY);
      }
      setLoading(false);
    })();
  }, []);

  const go = (delta: number) => {
    setDirection(delta);
    setCurrentIndex((i) => (i + delta + events.length) % events.length);
  };

  const handleMarkerClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const ev = events[currentIndex];
  const capacityPct = ev ? Math.min(Math.round((ev.attendeesCount / ev.total_capacity) * 100), 100) : 0;
  const fmtDate = ev
    ? new Date(ev.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0, scale: 0.96 }),
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">

      {/* ── Tam Ekran Harita ── */}
      <div className="absolute inset-0 z-0">
        {!loading && events.length > 0 && (
          <NearbyMapClient
            events={events}
            activeIndex={currentIndex}
            onMarkerClick={handleMarkerClick}
          />
        )}
        {loading && (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {/* ── Top Badge ── */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/60">
          <MapPin size={13} className="text-blue-500" />
          <span className="text-xs font-bold text-slate-700">{loading ? '...' : `${events.length} Etkinlik Yakında`}</span>
        </div>
      </div>

      {/* ── Dot Indicators ── */}
      {!loading && events.length > 1 && (
        <div className="absolute bottom-56 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
              className={`rounded-full transition-all duration-300 ${i === currentIndex ? 'w-5 h-2 bg-blue-500' : 'w-2 h-2 bg-white/70 hover:bg-white'}`}
            />
          ))}
        </div>
      )}

      {/* ── Floating Carousel Card ── */}
      {!loading && ev && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4">
          <div className="relative flex items-center gap-2">

            {/* Prev */}
            <button
              onClick={() => go(-1)}
              disabled={events.length <= 1}
              className="shrink-0 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/60 flex items-center justify-center text-slate-600 hover:bg-white hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Card */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={ev.id}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/15 border border-white/70 overflow-hidden"
                >
                  {/* Card cover strip */}
                  <div
                    className={`h-1.5 w-full bg-gradient-to-r ${CATEGORY_GRADIENT[ev.category] || 'from-blue-500 to-blue-600'}`}
                  />

                  <div className="p-4 flex gap-3">
                    {/* Visual */}
                    <div
                      className="w-16 h-16 rounded-2xl shrink-0 overflow-hidden"
                      style={{ background: ev.cover_image_url ? undefined : MESH_BG[ev.category] || '#1e293b' }}
                    >
                      {ev.cover_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ev.cover_image_url} alt={ev.title} className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${CATEGORY_GRADIENT[ev.category]} text-white`}>
                          {CATEGORY_LABELS[ev.category] || ev.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.is_paid ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {ev.is_paid ? `₺${ev.price}` : 'Ücretsiz'}
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-900 leading-snug line-clamp-1">{ev.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin size={9} className="shrink-0" />{ev.location}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 flex flex-col gap-3">
                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={10} />{fmtDate}</span>
                      <span className="flex items-center gap-1"><Users size={10} />{ev.attendeesCount} katılımcı</span>
                    </div>

                    {/* Capacity bar */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Doluluk</span>
                        <span className={capacityPct >= 90 ? 'text-red-500 font-bold' : ''}>{capacityPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : `bg-gradient-to-r ${CATEGORY_GRADIENT[ev.category]}`}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${capacityPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/event-detail/${ev.id}`}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] bg-gradient-to-r ${CATEGORY_GRADIENT[ev.category]}`}
                    >
                      Etkinliği İncele <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Next */}
            <button
              onClick={() => go(1)}
              disabled={events.length <= 1}
              className="shrink-0 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/60 flex items-center justify-center text-slate-600 hover:bg-white hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}