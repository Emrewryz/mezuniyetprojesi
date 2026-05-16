'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  MapPin, Calendar, Loader2, ChevronLeft, ChevronRight,
  Music2, Cpu, Palette, Briefcase, PartyPopper, Dumbbell, Gamepad2, ArrowUpRight,
} from 'lucide-react';

const NearbyMapClient = dynamic(() => import('@/components/ui/NearbyMapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-slate-400" />
    </div>
  ),
});

const DUMMY: any[] = [
  { id: 'd1', title: 'Kaleiçi Caz Gecesi', category: 'music', location: 'Kaleiçi, Antalya', is_paid: true, price: 150, start_at: new Date(Date.now() + 86400000 * 2).toISOString(), cover_image_url: null, lat: 36.8841, lng: 30.7056 },
  { id: 'd2', title: 'Açık Hava Sanat Sergisi', category: 'art', location: 'Atatürk Parkı, Antalya', is_paid: false, price: 0, start_at: new Date(Date.now() + 86400000 * 4).toISOString(), cover_image_url: null, lat: 36.8860, lng: 30.7020 },
  { id: 'd3', title: 'Konyaaltı Tech Summit', category: 'tech', location: 'Konyaaltı, Antalya', is_paid: true, price: 250, start_at: new Date(Date.now() + 86400000 * 7).toISOString(), cover_image_url: null, lat: 36.8770, lng: 30.6480 },
  { id: 'd4', title: 'Lara Beach Sosyal Buluşma', category: 'social', location: 'Lara, Antalya', is_paid: false, price: 0, start_at: new Date(Date.now() + 86400000 * 10).toISOString(), cover_image_url: null, lat: 36.8520, lng: 30.7550 },
];

const CATEGORY_META: Record<string, { label: string; icon: any; mesh: string }> = {
  music:    { label: 'Müzik',     icon: Music2,      mesh: 'linear-gradient(135deg,#1e1b4b,#be185d)' },
  tech:     { label: 'Teknoloji', icon: Cpu,         mesh: 'linear-gradient(135deg,#0f172a,#1d4ed8)' },
  art:      { label: 'Sanat',     icon: Palette,     mesh: 'linear-gradient(135deg,#1a0533,#7c3aed)' },
  business: { label: 'İş',        icon: Briefcase,   mesh: 'linear-gradient(135deg,#1c0a00,#d97706)' },
  social:   { label: 'Sosyal',    icon: PartyPopper, mesh: 'linear-gradient(135deg,#022c22,#059669)' },
  sport:    { label: 'Spor',      icon: Dumbbell,    mesh: 'linear-gradient(135deg,#1c0a00,#ea580c)' },
  game:     { label: 'Oyun',      icon: Gamepad2,    mesh: 'linear-gradient(135deg,#0f0c29,#4338ca)' },
};

export default function NearbyPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

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

      setEvents(
        data && data.length > 0
          ? data.map((ev: any) => ({
              ...ev,
              lat: parseFloat(ev.latitude),
              lng: parseFloat(ev.longitude),
              attendeesCount: ev.event_attendees?.[0]?.count ?? 0,
            }))
          : DUMMY
      );
      setLoading(false);
    })();
  }, []);

  const go = useCallback((dir: number) => {
    setCurrentIndex((i) => (i + dir + events.length) % events.length);
  }, [events.length]);

  const ev = events[currentIndex];
  const meta = ev ? CATEGORY_META[ev.category] : null;
  const fmtDate = ev
    ? new Date(ev.start_at).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', weekday: 'short',
      })
    : '';

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* Harita */}
      <div className="absolute inset-0 z-0">
        {!loading && events.length > 0 ? (
          <NearbyMapClient
            events={events}
            activeIndex={currentIndex}
            onMarkerClick={setCurrentIndex}
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {/* Yüzen Kart */}
      {!loading && ev && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-8 z-[1000] w-[calc(100%-2rem)] md:w-96">

          {/* Dots */}
          {events.length > 1 && (
            <div className="flex justify-center gap-1.5 mb-3">
              {events.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? 'w-5 h-1.5 bg-white shadow-sm'
                      : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="bg-white rounded-[24px] shadow-2xl overflow-hidden w-full">

            {/* Görsel */}
            <div className="relative h-44 overflow-hidden">
              <motion.div
                key={ev.id + '-img'}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {ev.cover_image_url ? (
                  <Image
                    src={ev.cover_image_url}
                    alt={ev.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0" style={{ background: meta?.mesh || '#1e293b' }}>
                    {meta && (
                      <meta.icon
                        size={72}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10"
                      />
                    )}
                  </div>
                )}
              </motion.div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Oklar */}
              {events.length > 1 && (
                <>
                  <button
                    onClick={() => go(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40 transition-colors z-10"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => go(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40 transition-colors z-10"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* Rozetler */}
              <div className="absolute top-3 left-3 z-10">
                {meta && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 text-white text-[11px] font-bold">
                    <meta.icon size={11} /> {meta.label}
                  </span>
                )}
              </div>
              <div className="absolute top-3 right-3 z-10">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  ev.is_paid ? 'bg-black/50 text-white' : 'bg-emerald-500/90 text-white'
                }`}>
                  {ev.is_paid ? `₺${ev.price}` : 'Ücretsiz'}
                </span>
              </div>

              {/* Mavi accent çizgi */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] z-10 bg-blue-500" />
            </div>

            {/* Alt bilgi */}
            <div className="px-5 py-4">
              <motion.div
                key={ev.id + '-info'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <h3 className="text-[15px] font-black text-slate-900 leading-snug line-clamp-2 mb-3">
                  {ev.title}
                </h3>
                <div className="flex flex-col gap-1.5 mb-4">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400 shrink-0" /> {fmtDate}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                    <MapPin size={12} className="text-slate-400 shrink-0" /> {ev.location}
                  </p>
                </div>
                <Link
                  href={`/event-detail/${ev.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
                >
                  Etkinliğe Git <ArrowUpRight size={14} />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}