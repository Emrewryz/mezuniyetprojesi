'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, UserPlus, Megaphone, Share2, Copy, Check,
  Calendar, MapPin, Globe, Clock, Users, Ticket,
  Settings, BarChart2, ClipboardList, Eye,
  Send, Loader2, QrCode, ExternalLink,
  Crown, CheckCircle2, XCircle, Timer, Trash2,
  AlertTriangle, X,
} from 'lucide-react';

type Tab = 'overview' | 'guests' | 'registration' | 'insights' | 'settings';

interface EventDetail {
  id: string; title: string; category: string; location: string;
  is_online: boolean; is_paid: boolean; price: number;
  start_at: string; end_at: string; cover_image_url: string | null;
  total_capacity: number; status: string; tags: string[];
  long_description: string | null; latitude: number | null; longitude: number | null;
  attendeesCount: number;
  organizer: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

interface Guest {
  id: string; user_id: string; status: string; ticket_type: string; created_at: string;
  profiles: { first_name: string; last_name: string; avatar_url: string | null; email?: string } | null;
}

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'overview',     label: 'Genel Bakış', icon: Eye },
  { key: 'guests',       label: 'Misafirler',  icon: Users },
  { key: 'registration', label: 'Kayıt',        icon: ClipboardList },
  { key: 'insights',     label: 'İçgörüler',   icon: BarChart2 },
  { key: 'settings',     label: 'Ayarlar',      icon: Settings },
];

const MESH: Record<string, string> = {
  music: 'linear-gradient(135deg,#1e1b4b,#be185d)',
  tech: 'linear-gradient(135deg,#0f172a,#1d4ed8)',
  art: 'linear-gradient(135deg,#1a0533,#7c3aed)',
  business: 'linear-gradient(135deg,#1c0a00,#d97706)',
  social: 'linear-gradient(135deg,#022c22,#059669)',
  sport: 'linear-gradient(135deg,#1c0a00,#ea580c)',
  game: 'linear-gradient(135deg,#0f0c29,#4338ca)',
};

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  registered: { label: 'Kayıtlı',  color: 'text-emerald-600', icon: CheckCircle2 },
  cancelled:  { label: 'İptal',    color: 'text-red-500',     icon: XCircle },
  waitlisted: { label: 'Bekleme',  color: 'text-amber-500',   icon: Timer },
  attended:   { label: 'Katıldı',  color: 'text-blue-600',    icon: Crown },
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
function avatarColor(s: string) {
  return ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b'][s.charCodeAt(0) % 5];
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all group active:scale-[0.97]"
    >
      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:border-slate-200 transition-colors">
        <Icon size={17} className="text-slate-500 group-hover:text-slate-800 transition-colors" />
      </div>
      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-700 transition-colors whitespace-nowrap">{label}</span>
    </button>
  );
}

function OverviewTab({ event }: { event: EventDetail }) {
  const [copied, setCopied] = useState(false);
  const slug = event.id.slice(0, 8);
  const eventUrl = `https://etkinrota.com/e/${slug}`;
  const capacityPct = event.total_capacity > 0 ? Math.min(Math.round((event.attendeesCount / event.total_capacity) * 100), 100) : 0;

  const copy = async () => {
    await navigator.clipboard.writeText(eventUrl);
    setCopied(true); toast.success('Link kopyalandı!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="relative h-36 overflow-hidden">
            {event.cover_image_url
              ? <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" unoptimized />
              : <div className="absolute inset-0" style={{ background: MESH[event.category] || '#1e293b' }} />
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-sm font-black text-white leading-snug line-clamp-2">{event.title}</p>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar size={12} className="text-slate-400" /> {fmtDate(event.start_at)}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {event.is_online ? <Globe size={12} className="text-slate-400" /> : <MapPin size={12} className="text-slate-400" />}
              {event.location}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1"><Users size={9} />{event.attendeesCount} / {event.total_capacity}</span>
                <span>{capacityPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 60 ? 'bg-amber-400' : 'bg-blue-500'}`}
                  initial={{ width: 0 }} animate={{ width: `${capacityPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Etkinlik Linki</p>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            <span className="flex-1 text-xs text-slate-600 font-mono truncate">{eventUrl}</span>
            <button onClick={copy} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold transition-all shadow-sm">
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
          </div>
          <div className="flex gap-2">
            <Link href={`/event-detail/${event.id}`} target="_blank" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all">
              <ExternalLink size={12} /> Önizle
            </Link>
            <button onClick={copy} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all">
              <Share2 size={12} /> Paylaş
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ne Zaman ve Nerede</p>
          <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar size={17} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{fmtDate(event.start_at)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fmtTime(event.start_at)} – {fmtTime(event.end_at)}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              {event.is_online ? <Globe size={17} className="text-rose-500" /> : <MapPin size={17} className="text-rose-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">{event.is_online ? 'Online Etkinlik' : event.location}</p>
              {!event.is_online && event.latitude && event.longitude ? (
                <a href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700 transition-colors mt-0.5 flex items-center gap-1">
                  Haritada Gör <ExternalLink size={10} />
                </a>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{event.location}</p>
              )}
            </div>
          </div>
        </div>
        {event.long_description && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Açıklama</p>
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-5">{event.long_description}</p>
          </div>
        )}
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-[11px] text-blue-700 font-semibold">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GuestsTab({ guests, loading }: { guests: Guest[]; loading: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{guests.length} Misafir</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <UserPlus size={13} /> Davet Et
        </button>
      </div>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))
      ) : guests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Users size={28} className="text-slate-300" />
          <p className="text-xs text-slate-400 font-medium">Henüz kayıtlı misafir yok.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-12 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            {['Misafir','Durum','Bilet','Tarih'].map((h, i) => (
              <p key={h} className={`text-[10px] font-bold text-slate-400 uppercase tracking-wider ${i === 0 ? 'col-span-5' : 'col-span-7/3'}`}>{h}</p>
            ))}
          </div>
          <div className="divide-y divide-slate-50">
            {guests.map((g) => {
              const name = [g.profiles?.first_name, g.profiles?.last_name].filter(Boolean).join(' ') || 'Misafir';
              const sm = STATUS_META[g.status] || STATUS_META.registered;
              const StatusIcon = sm.icon;
              return (
                <div key={g.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ background: avatarColor(name) }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{g.profiles?.email || '—'}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold ${sm.color} shrink-0`}>
                    <StatusIcon size={10} /> {sm.label}
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0 hidden sm:block capitalize">{g.ticket_type || 'Standart'}</div>
                  <div className="text-[10px] text-slate-400 shrink-0 hidden md:block">
                    {new Date(g.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RegistrationTab({ event }: { event: EventDetail }) {
  const [inviteInput, setInviteInput] = useState('');
  const [sending, setSending] = useState(false);
  const sendInvite = async () => {
    if (!inviteInput.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success(`Davet gönderildi: ${inviteInput}`);
    setInviteInput(''); setSending(false);
  };
  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Davet Gönder</p>
        <div className="flex gap-2">
          <input type="text" value={inviteInput} onChange={(e) => setInviteInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
            placeholder="e-posta veya telefon..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors" />
          <button onClick={sendInvite} disabled={sending || !inviteInput.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Gönder
          </button>
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kayıt Bilgileri</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Kayıt Türü',   value: event.is_paid ? 'Ücretli' : 'Ücretsiz' },
            { label: 'Bilet Fiyatı', value: event.is_paid ? `₺${event.price}` : '—' },
            { label: 'Kapasite',     value: event.total_capacity },
            { label: 'Mevcut Kayıt', value: event.attendeesCount },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">QR Check-in</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
            <QrCode size={44} className="text-slate-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Kapıda Kontrol</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Misafirler etkinlik sayfasındaki QR kodu göstererek giriş yapabilir.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsTab({ event }: { event: EventDetail }) {
  const pct = event.total_capacity > 0 ? Math.min(Math.round((event.attendeesCount / event.total_capacity) * 100), 100) : 0;
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Kayıt Oranı',  value: `%${pct}`,    sub: `${event.attendeesCount}/${event.total_capacity}` },
          { label: 'Kalan Yer',    value: event.total_capacity - event.attendeesCount, sub: 'kontenjan' },
          { label: 'Tahmini Gelir',value: event.is_paid ? `₺${(event.price * event.attendeesCount).toLocaleString('tr-TR')}` : 'Ücretsiz', sub: '' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-xl font-black text-slate-900">{value}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
            {sub && <p className="text-[10px] text-slate-300 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kayıt İlerlemesi</p>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div className={`h-full rounded-full ${pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-amber-400' : 'bg-blue-500'}`}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
        </div>
        <p className="text-xs text-slate-400">Detaylı analitik yakında gelecek.</p>
      </div>
    </div>
  );
}

function SettingsTab({ event, onDelete }: { event: EventDetail; onDelete: () => void }) {
  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <div className="mt-2 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-600">Etkinliği Sil</p>
          <p className="text-xs text-slate-400 mt-0.5">Bu işlem geri alınamaz.</p>
        </div>
        <button onClick={onDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center gap-1.5">
          <Trash2 size={13} /> Sil
        </button>
      </div>
    </div>
  );
}

export default function EventControlPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data, error } = await supabase
        .from('events')
        .select('*, event_attendees(count), organizer:profiles!organizer_id(first_name, last_name, avatar_url)')
        .eq('id', id).eq('organizer_id', user.id).single();
      if (error || !data) { router.push('/my-events'); return; }
      setEvent({ ...data, attendeesCount: data.event_attendees?.[0]?.count ?? 0 });
      setLoading(false);
      const { data: gData } = await supabase
        .from('event_attendees')
        .select('id, user_id, status, ticket_type, created_at, profiles(first_name, last_name, avatar_url)')
        .eq('event_id', id).order('created_at', { ascending: false });
      setGuests((gData || []).map((g: any) => ({ ...g, profiles: Array.isArray(g.profiles) ? g.profiles[0] ?? null : g.profiles })));
      setGuestsLoading(false);
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!event) return;
    setDeleteLoading(true);
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    if (error) { toast.error('Silme başarısız.'); setDeleteLoading(false); return; }
    toast.success('Etkinlik silindi.');
    router.push('/my-events');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );
  if (!event) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7f9]">
      <div className="px-5 md:px-10 py-8 max-w-5xl mx-auto w-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start gap-4 flex-wrap">
          <button onClick={() => router.push('/my-events')}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm shrink-0 mt-0.5">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Kumanda Merkezi</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1">{event.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                event.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}>
                {event.status === 'published' ? 'Yayında' : 'Taslak'}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock size={9} />
                {new Date(event.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
          <Link href={`/create-event?edit=${event.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-sm"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            Düzenle
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <QuickAction icon={UserPlus}  label="Misafir Davet Et" onClick={() => setActiveTab('registration')} />
          <QuickAction icon={Megaphone} label="Duyuru Gönder"    onClick={() => toast.info('Yakında!')} />
          <QuickAction icon={Share2}    label="Etkinliği Paylaş" onClick={async () => {
            try { await navigator.share({ title: event.title, url: window.location.href }); }
            catch { await navigator.clipboard.writeText(window.location.href); toast.success('Link kopyalandı!'); }
          }} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide p-1 bg-white border border-slate-200 rounded-2xl shadow-sm w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {activeTab === 'overview'     && <OverviewTab event={event} />}
            {activeTab === 'guests'       && <GuestsTab guests={guests} loading={guestsLoading} />}
            {activeTab === 'registration' && <RegistrationTab event={event} />}
            {activeTab === 'insights'     && <InsightsTab event={event} />}
            {activeTab === 'settings'     && <SettingsTab event={event} onDelete={() => setShowDeleteModal(true)} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}>
            <motion.div initial={{ scale: 0.93, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-900">Etkinliği Sil</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    <span className="font-semibold">"{event.title}"</span> kalıcı olarak silinsin mi?
                  </p>
                </div>
                <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={16} /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">İptal</button>
                <button onClick={handleDelete} disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}