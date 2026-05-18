'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Bookmark, Heart, MapPin, Globe, Calendar, Clock,
  Loader2, Search, X, Music2, Cpu, Palette, Briefcase,
  PartyPopper, Dumbbell, Gamepad2, Trash2,
} from 'lucide-react';

const CATEGORY_META: Record<string, { label: string; icon: any; gradient: string; mesh: string }> = {
  music:    { label: 'Müzik',     icon: Music2,      gradient: 'from-pink-500 to-rose-600',    mesh: 'linear-gradient(135deg,#1e1b4b,#be185d)' },
  tech:     { label: 'Teknoloji', icon: Cpu,         gradient: 'from-blue-500 to-cyan-600',    mesh: 'linear-gradient(135deg,#0f172a,#1e3a5f)' },
  art:      { label: 'Sanat',     icon: Palette,     gradient: 'from-violet-500 to-purple-600',mesh: 'linear-gradient(135deg,#1a0533,#2d1b69)' },
  business: { label: 'İş',        icon: Briefcase,   gradient: 'from-amber-500 to-orange-500', mesh: 'linear-gradient(135deg,#1c1107,#431407)' },
  social:   { label: 'Sosyal',    icon: PartyPopper, gradient: 'from-emerald-500 to-teal-600', mesh: 'linear-gradient(135deg,#022c22,#134e4a)' },
  sport:    { label: 'Spor',      icon: Dumbbell,    gradient: 'from-orange-500 to-red-600',   mesh: 'linear-gradient(135deg,#1c0a00,#450a0a)' },
  game:     { label: 'Oyun',      icon: Gamepad2,    gradient: 'from-indigo-500 to-blue-600',  mesh: 'linear-gradient(135deg,#0f0c29,#1e1b4b)' },
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

interface SavedEvent {
  favoriteId: string;
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
  total_capacity: number;
  attendeesCount: number;
}

function EventCard({ event, onRemove }: { event: SavedEvent; onRemove: (favId: string) => void }) {
  const meta = CATEGORY_META[event.category];
  const isPast = new Date(event.end_at) < new Date();
  const fmtDate = new Date(event.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = new Date(event.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const capacityPct = event.total_capacity > 0
    ? Math.min(Math.round((event.attendeesCount / event.total_capacity) * 100), 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className={`group bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] transition-all overflow-hidden flex flex-col ${isPast ? 'opacity-60' : ''}`}
    >
      <Link href={`/event-detail/${event.id}`} className="block relative h-40 overflow-hidden shrink-0">
        {event.cover_image_url ? (
          <Image src={event.cover_image_url} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0" style={{ background: meta?.mesh || '#1e293b' }}>
            {meta && <meta.icon size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {isPast && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded-full text-white text-[10px] font-bold flex items-center gap-1">
            <Clock size={9} /> Sona Erdi
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onRemove(event.favoriteId); }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-md"
          title="Kaydedilenlerden çıkar"
        >
          <Trash2 size={12} />
        </button>
        <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-white/95 rounded-lg shadow-sm">
          <p className="text-[10px] font-bold text-slate-800 leading-none">{fmtDate} · {fmtTime}</p>
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          {meta && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${meta.gradient}`}>
              <meta.icon size={9} /> {meta.label}
            </span>
          )}
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
            <span>{event.attendeesCount} katılımcı</span>
            <span>{capacityPct}%</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-blue-500'}`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function SavedPage() {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('event_favorites')
        .select(`
          id,
          events (
            id, title, category, location, is_online, is_paid, price,
            start_at, end_at, cover_image_url, total_capacity,
            event_attendees(count)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEvents(
          data
            .filter((f: any) => f.events)
            .map((f: any) => ({
              favoriteId: f.id,
              ...f.events,
              attendeesCount: f.events.event_attendees?.[0]?.count ?? 0,
            }))
        );
      }
      setLoading(false);
    })();
  }, []);

  const handleRemove = async (favoriteId: string) => {
    const { error } = await supabase.from('event_favorites').delete().eq('id', favoriteId);
    if (error) { toast.error('Kaldırılamadı.'); return; }
    setEvents((prev) => prev.filter((e) => e.favoriteId !== favoriteId));
    toast.success('Kaydedilenlerden çıkarıldı.');
  };

  const filtered = events.filter((ev) =>
    !search ||
    ev.title.toLowerCase().includes(search.toLowerCase()) ||
    ev.location?.toLowerCase().includes(search.toLowerCase())
  );

  const upcoming = filtered.filter((ev) => new Date(ev.end_at) >= new Date());
  const past     = filtered.filter((ev) => new Date(ev.end_at) <  new Date());

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center shadow-md shadow-pink-200">
              <Heart size={13} className="text-white" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">EtkinRota</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Kaydettiklerim</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? '...' : `${events.length} kayıtlı etkinlik`}
          </p>
        </div>

        {/* Arama */}
        {!loading && events.length > 0 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara..."
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm w-48"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
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
      )}

      {/* Empty */}
      {!loading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
            <Bookmark size={28} className="text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Henüz kaydettiğin etkinlik yok.</p>
            <p className="text-xs text-slate-400 mt-1">Etkinliklerdeki ❤️ butonuna tıklayarak buraya ekleyebilirsin.</p>
          </div>
          <Link href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            Etkinlikleri Keşfet
          </Link>
        </div>
      )}

      {/* Grid */}
      {!loading && events.length > 0 && (
        <div className="flex flex-col gap-8">
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Yaklaşan — {upcoming.length} etkinlik
              </p>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {upcoming.map((ev) => (
                    <EventCard key={ev.id} event={ev} onRemove={handleRemove} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Geçmiş — {past.length} etkinlik
              </p>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {past.map((ev) => (
                    <EventCard key={ev.id} event={ev} onRemove={handleRemove} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}