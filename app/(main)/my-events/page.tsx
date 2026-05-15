'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Plus, Search, ArrowRight, QrCode, MapPin, Globe,
  Clock, Users, Tag, X, Loader2, CalendarDays,
  Pencil, ChevronDown, Trash2, AlertTriangle,
} from 'lucide-react';

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
  tags: string[];
  attendeesCount: number;
}

const MESH: Record<string, string> = {
  music: 'linear-gradient(135deg,#1e1b4b,#be185d)',
  tech: 'linear-gradient(135deg,#0f172a,#1d4ed8)',
  art: 'linear-gradient(135deg,#1a0533,#7c3aed)',
  business: 'linear-gradient(135deg,#1c0a00,#d97706)',
  social: 'linear-gradient(135deg,#022c22,#059669)',
  sport: 'linear-gradient(135deg,#1c0a00,#ea580c)',
  game: 'linear-gradient(135deg,#0f0c29,#4338ca)',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const isPast = (iso: string) => new Date(iso) < new Date();

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`} />;
}

function QRModal({ event, onClose }: { event: OrgEvent; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 w-full max-w-xs flex flex-col items-center gap-5"
      >
        <div className="flex items-center justify-between w-full">
          <p className="text-sm font-bold text-slate-900">Katılımı İşaretle</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="w-40 h-40 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center">
          <QrCode size={88} className="text-slate-800" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900 line-clamp-1">{event.title}</p>
          <p className="text-xs text-slate-400 mt-1">{event.attendeesCount} kayıtlı katılımcı</p>
        </div>
        <p className="text-[11px] text-slate-400 text-center">Katılımcı bu kodu okutarak check-in yapabilir.</p>
      </motion.div>
    </motion.div>
  );
}

function DeleteModal({ title, onConfirm, onCancel, loading }: {
  title: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.93, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-900">Etkinliği Sil</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              <span className="font-semibold text-slate-700">"{title}"</span> silinsin mi? Bu işlem geri alınamaz.
            </p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Sil
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TagBadge({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-semibold border border-blue-100">
      #{tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5">
          <X size={9} />
        </button>
      )}
    </span>
  );
}

function EventCard({ event, onQR, onDelete }: {
  event: OrgEvent;
  onQR: (ev: OrgEvent) => void;
  onDelete: (ev: OrgEvent) => void;
}) {
  const [tags, setTags] = useState<string[]>(event.tags || []);
  const [addingTag, setAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const past = isPast(event.end_at);
  const capacityPct = event.total_capacity > 0
    ? Math.min(Math.round((event.attendeesCount / event.total_capacity) * 100), 100)
    : 0;

  const addTag = async () => {
    const val = tagInput.trim().toLowerCase();
    if (!val || tags.includes(val) || tags.length >= 5) return;
    const next = [...tags, val];
    const { error } = await supabase.from('events').update({ tags: next }).eq('id', event.id);
    if (!error) { setTags(next); toast.success(`#${val} eklendi`); }
    setTagInput(''); setAddingTag(false);
  };

  const removeTag = async (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    const { error } = await supabase.from('events').update({ tags: next }).eq('id', event.id);
    if (!error) setTags(next);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={`bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition-all overflow-hidden ${past ? 'opacity-60' : ''}`}
    >
      <div className="flex gap-4 p-4">
        {/* Cover */}
        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
          {event.cover_image_url
            ? <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" unoptimized />
            : <div className="absolute inset-0" style={{ background: MESH[event.category] || '#1e293b' }} />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <p className="text-sm font-bold text-slate-900 line-clamp-1 flex-1">{event.title}</p>
            {event.status === 'draft' && (
              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Taslak</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mb-2">
            <span className="flex items-center gap-1"><Clock size={10} />{fmtDate(event.start_at)} · {fmtTime(event.start_at)}</span>
            <span className="flex items-center gap-1">
              {event.is_online ? <Globe size={10} /> : <MapPin size={10} />}
              <span className="truncate max-w-[140px]">{event.location}</span>
            </span>
          </div>
          {/* Capacity */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 60 ? 'bg-amber-400' : 'bg-blue-400'}`}
                initial={{ width: 0 }}
                animate={{ width: `${capacityPct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Users size={9} /> {event.attendeesCount}/{event.total_capacity}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onQR(event)}
              disabled={past}
              title="Katılımı İşaretle"
              className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all disabled:opacity-30"
            >
              <QrCode size={14} />
            </button>
            <button
              onClick={() => onDelete(event)}
              title="Sil"
              className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
            >
              <Trash2 size={13} />
            </button>
            <Link
              href={`/my-events/${event.id}`}
              className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Yönet <ArrowRight size={12} />
            </Link>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Tag size={10} /> Etiketler
            <ChevronDown size={10} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tags */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <TagBadge key={tag} tag={tag} onRemove={() => removeTag(tag)} />
              ))}
              {addingTag ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setAddingTag(false); }}
                    placeholder="etiket..."
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-400 w-24"
                  />
                  <button onClick={addTag} className="text-[10px] text-blue-500 font-bold hover:text-blue-700">Ekle</button>
                  <button onClick={() => setAddingTag(false)} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
                </div>
              ) : tags.length < 5 && (
                <button
                  onClick={() => setAddingTag(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-[10px] text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors"
                >
                  <Plus size={10} /> Etiket Ekle
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TimelineSection({ title, events, accent, onQR, onDelete }: {
  title: string; events: OrgEvent[]; accent: string;
  onQR: (ev: OrgEvent) => void; onDelete: (ev: OrgEvent) => void;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center pt-1">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${accent}`} />
        <div className="w-px flex-1 bg-slate-200 mt-2" />
      </div>
      <div className="flex-1 min-w-0 pb-10">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{title}</p>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
            <CalendarDays size={24} className="text-slate-300" />
            <p className="text-xs text-slate-400 font-medium">Henüz etkinlik yok.</p>
            <Link href="/create-event" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              <Plus size={12} /> Oluştur
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} onQR={onQR} onDelete={onDelete} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [qrTarget, setQrTarget] = useState<OrgEvent | null>(null);
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
        .order('start_at', { ascending: true });
      if (!error && data) {
        setEvents(data.map((ev: any) => ({ ...ev, attendeesCount: ev.event_attendees?.[0]?.count ?? 0 })));
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() =>
    events.filter((ev) => !search || ev.title.toLowerCase().includes(search.toLowerCase()) || ev.location?.toLowerCase().includes(search.toLowerCase())),
    [events, search]
  );

  const upcoming = filtered.filter((ev) => !isPast(ev.end_at));
  const past = filtered.filter((ev) => isPast(ev.end_at));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabase.from('events').delete().eq('id', deleteTarget.id);
    if (error) { toast.error('Silme başarısız: ' + error.message); }
    else { setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id)); toast.success('Etkinlik silindi.'); }
    setDeleteLoading(false);
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7f9]">
      <div className="px-5 md:px-10 py-8 max-w-3xl mx-auto w-full flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">EtkinRota</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Etkinliklerim</h1>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {searchOpen && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 160, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara..."
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm"
                />
              )}
            </AnimatePresence>
            <button
              onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setSearch(''); }}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
            >
              {searchOpen ? <X size={15} /> : <Search size={15} />}
            </button>
            <Link
              href="/create-event"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-sm"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
            >
              <Plus size={15} /> Yeni
            </Link>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 flex gap-4 p-4">
                <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <TimelineSection title="Yaklaşan" events={upcoming} accent="bg-blue-500" onQR={setQrTarget} onDelete={setDeleteTarget} />
            <TimelineSection title="Geçmiş"   events={past}     accent="bg-slate-300" onQR={setQrTarget} onDelete={setDeleteTarget} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {qrTarget && <QRModal event={qrTarget} onClose={() => setQrTarget(null)} />}
        {deleteTarget && <DeleteModal title={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
      </AnimatePresence>
    </div>
  );
}