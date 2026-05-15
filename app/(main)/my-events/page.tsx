'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Users, Zap, FileText, Plus, Pencil, Trash2,
  Calendar, MapPin, Globe, ChevronRight, Loader2,
  LayoutGrid, Clock, AlertTriangle, X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type EventStatus = 'published' | 'draft' | 'past';

interface OrgEvent {
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
  status: string;
  attendeesCount: number;
}

// ─── Sabitler ────────────────────────────────────────────────────────────────

const TABS: { key: EventStatus; label: string; icon: any }[] = [
  { key: 'published', label: 'Yayındakiler', icon: Zap },
  { key: 'draft',     label: 'Taslaklar',    icon: FileText },
  { key: 'past',      label: 'Geçmiş',       icon: Clock },
];

const CATEGORY_LABELS: Record<string, string> = {
  music: 'Müzik', tech: 'Teknoloji', art: 'Sanat',
  business: 'İş', social: 'Sosyal', sport: 'Spor', game: 'Oyun',
};

const CATEGORY_COLORS: Record<string, string> = {
  music: 'bg-pink-100 text-pink-700', tech: 'bg-blue-100 text-blue-700',
  art: 'bg-violet-100 text-violet-700', business: 'bg-amber-100 text-amber-700',
  social: 'bg-emerald-100 text-emerald-700', sport: 'bg-orange-100 text-orange-700',
  game: 'bg-indigo-100 text-indigo-700',
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`} />;
}

function categorise(ev: OrgEvent): EventStatus {
  if (new Date(ev.end_at) < new Date()) return 'past';
  return ev.status === 'published' ? 'published' : 'draft';
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, gradient, shadow }: {
  icon: any; label: string; value: number | string;
  gradient: string; shadow: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)]`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${gradient} shadow-lg ${shadow}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-tight">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ title, onConfirm, onCancel, loading }: {
  title: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Etkinliği Sil</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              <span className="font-semibold text-slate-700">"{title}"</span> etkinliğini silmek istediğinden emin misin? Bu işlem geri alınamaz.
            </p>
          </div>
          <button onClick={onCancel} className="ml-auto text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Sil
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Event Row Card ───────────────────────────────────────────────────────────

function EventCard({ event, onDelete }: { event: OrgEvent; onDelete: (id: string) => void }) {
  const capacityPct = event.total_capacity > 0
    ? Math.min(Math.round((event.attendeesCount / event.total_capacity) * 100), 100)
    : 0;
  const fmtDate = new Date(event.start_at).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const isPast = new Date(event.end_at) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition-all flex gap-4 p-4 items-center group"
    >
      {/* Cover */}
      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
        {event.cover_image_url
          ? <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" unoptimized />
          : <div className="absolute inset-0" style={{ background: MESH_BG[event.category] || '#1e293b' }} />
        }
        {isPast && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Clock size={14} className="text-white/80" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[event.category] || 'bg-blue-100 text-blue-700'}`}>
            {CATEGORY_LABELS[event.category] || event.category}
          </span>
          {event.is_paid
            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">₺{event.price}</span>
            : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Ücretsiz</span>
          }
        </div>
        <p className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{event.title}</p>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Calendar size={10} />{fmtDate}</span>
          <span className="flex items-center gap-1">
            {event.is_online ? <Globe size={10} /> : <MapPin size={10} />}
            <span className="truncate max-w-[120px]">{event.location}</span>
          </span>
        </div>

        {/* Capacity bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 60 ? 'bg-amber-400' : 'bg-blue-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${capacityPct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0">
            {event.attendeesCount} / {event.total_capacity}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/event-detail/${event.id}`}
          className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          title="Detay"
        >
          <ChevronRight size={14} />
        </Link>
        <Link
          href={`/create-event?edit=${event.id}`}
          className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
          title="Düzenle"
        >
          <Pencil size={13} />
        </Link>
        <button
          onClick={() => onDelete(event.id)}
          className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
          title="Sil"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: EventStatus }) {
  const msgs: Record<EventStatus, { title: string; desc: string }> = {
    published: { title: 'Yayında etkinliğin yok.', desc: 'Oluşturduğun etkinlikleri yayınla.' },
    draft:     { title: 'Kayıtlı taslağın yok.',  desc: 'Yarım bıraktığın etkinlikler burada görünür.' },
    past:      { title: 'Geçmiş etkinliğin yok.', desc: 'Tamamlanan etkinliklerin burada arşivlenir.' },
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
        <LayoutGrid size={28} className="text-slate-300" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-600">{msgs[tab].title}</p>
        <p className="text-xs text-slate-400 mt-1">{msgs[tab].desc}</p>
      </div>
      <Link
        href="/create-event"
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200"
        style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
      >
        <Plus size={15} /> Hemen Başla
      </Link>
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function MyEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EventStatus>('published');
  const [deleteTarget, setDeleteTarget] = useState<OrgEvent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('events')
        .select('*, event_attendees(count)')
        .eq('organizer_id', user.id)
        .order('start_at', { ascending: false });

      if (!error && data) {
        setEvents(data.map((ev: any) => ({
          ...ev,
          attendeesCount: ev.event_attendees?.[0]?.count ?? 0,
        })));
      }
      setLoading(false);
    })();
  }, []);

  const tabEvents = useMemo(
    () => events.filter((ev) => categorise(ev) === activeTab),
    [events, activeTab]
  );

  const stats = useMemo(() => ({
    totalAttendees: events.reduce((s, e) => s + e.attendeesCount, 0),
    published: events.filter((e) => categorise(e) === 'published').length,
    drafts: events.filter((e) => categorise(e) === 'draft').length,
  }), [events]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabase.from('events').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Silme işlemi başarısız: ' + error.message);
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success('Etkinlik silindi.');
    }
    setDeleteLoading(false);
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7f9]">
      <div className="px-5 md:px-10 py-8 max-w-5xl mx-auto w-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200">
                <Zap size={14} className="text-white" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">EtkinRota</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Etkinliklerim</h1>
            <p className="text-sm text-slate-400 mt-0.5">Oluşturduğun etkinlikleri yönet.</p>
          </div>
          <Link
            href="/create-event"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
          >
            <Plus size={15} /> Yeni Etkinlik
          </Link>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={Users}    label="Toplam Katılımcı"    value={stats.totalAttendees} gradient="from-blue-500 to-cyan-500"     shadow="shadow-blue-200" />
            <StatCard icon={Zap}      label="Yayında"             value={stats.published}      gradient="from-emerald-500 to-teal-500"  shadow="shadow-emerald-200" />
            <StatCard icon={FileText} label="Taslak"              value={stats.drafts}         gradient="from-amber-400 to-orange-500"  shadow="shadow-amber-200" />
          </div>
        )}

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
              {!loading && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {events.filter((e) => categorise(e) === key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 flex gap-4 p-4 items-center">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2.5 w-full" />
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="w-8 h-8 rounded-xl" />)}
                </div>
              </div>
            ))
          ) : tabEvents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
              <EmptyState tab={activeTab} />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {tabEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} onDelete={(id) => setDeleteTarget(events.find((e) => e.id === id)!)} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            title={deleteTarget.title}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}