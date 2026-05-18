'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Megaphone, Share2, Copy, Check,
  Calendar, MapPin, Globe, Clock, Users,
  Settings, BarChart2, ClipboardList, Eye,
  Loader2, QrCode, ExternalLink,
  Crown, CheckCircle2, XCircle, Timer, Trash2,
  AlertTriangle, X, Send, Building2,
} from 'lucide-react';

type Tab = 'overview' | 'guests' | 'registration' | 'insights' | 'settings' | 'community';

interface EventDetail {
  id: string; title: string; category: string; location: string;
  is_online: boolean; is_paid: boolean; price: number;
  start_at: string; end_at: string; cover_image_url: string | null;
  total_capacity: number; status: string; tags: string[];
  long_description: string | null; latitude: number | null; longitude: number | null;
  attendeesCount: number; community_id: string | null;
  organizer: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

interface Guest {
  id: string; user_id: string; status: string; ticket_type: string; created_at: string;
  profiles: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

interface Community {
  id: string; name: string; avatar_url: string | null;
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

function QuickAction({ icon: Icon, label, onClick, active }: {
  icon: any; label: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all group active:scale-[0.97] ${
        active
          ? 'bg-blue-50 border-blue-200'
          : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
      }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
        active ? 'bg-blue-100' : 'bg-slate-50 border border-slate-100 group-hover:bg-white'
      }`}>
        <Icon size={17} className={active ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-800 transition-colors'} />
      </div>
      <span className={`text-[11px] font-semibold whitespace-nowrap transition-colors ${
        active ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-700'
      }`}>{label}</span>
    </button>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab({ event }: { event: EventDetail }) {
  const [copied, setCopied] = useState(false);
  const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/event-detail/${event.id}`;
  const capacityPct = event.total_capacity > 0
    ? Math.min(Math.round((event.attendeesCount / event.total_capacity) * 100), 100) : 0;

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
                  transition={{ duration: 0.8, ease: 'easeOut' }} />
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

// ─── Guests ───────────────────────────────────────────────────────────────────

function GuestsTab({ guests, loading }: { guests: Guest[]; loading: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{guests.length} Misafir</p>

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
          <div className="flex items-center px-4 py-2.5 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider gap-4">
            <span className="flex-1">Misafir</span>
            <span className="w-20 text-center">Durum</span>
            <span className="w-16 text-right hidden sm:block">Tarih</span>
          </div>
          <div className="divide-y divide-slate-50">
            {guests.map((g) => {
              const name = [g.profiles?.first_name, g.profiles?.last_name].filter(Boolean).join(' ') || 'Misafir';
              const sm = STATUS_META[g.status] || STATUS_META.registered;
              const StatusIcon = sm.icon;
              return (
                <div key={g.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ background: avatarColor(name) }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold ${sm.color} shrink-0 w-20 justify-center`}>
                    <StatusIcon size={10} /> {sm.label}
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0 w-16 text-right hidden sm:block">
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

// ─── Registration ─────────────────────────────────────────────────────────────

function RegistrationTab({ event }: { event: EventDetail }) {
  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kayıt Bilgileri</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Kayıt Türü',   value: event.is_paid ? 'Ücretli' : 'Ücretsiz' },
            { label: 'Bilet Fiyatı', value: event.is_paid ? `₺${event.price}` : '—' },
            { label: 'Kapasite',     value: event.total_capacity },
            { label: 'Mevcut Kayıt', value: event.attendeesCount },
            { label: 'Kalan Yer',    value: Math.max(0, event.total_capacity - event.attendeesCount) },
            { label: 'Doluluk',      value: `%${event.total_capacity > 0 ? Math.round((event.attendeesCount / event.total_capacity) * 100) : 0}` },
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

// ─── Insights ─────────────────────────────────────────────────────────────────

function InsightsTab({ event }: { event: EventDetail }) {
  const pct = event.total_capacity > 0
    ? Math.min(Math.round((event.attendeesCount / event.total_capacity) * 100), 100) : 0;
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Kayıt Oranı',   value: `%${pct}`,    sub: `${event.attendeesCount}/${event.total_capacity}` },
          { label: 'Kalan Yer',     value: Math.max(0, event.total_capacity - event.attendeesCount), sub: 'kontenjan' },
          { label: 'Tahmini Gelir', value: event.is_paid ? `₺${(event.price * event.attendeesCount).toLocaleString('tr-TR')}` : 'Ücretsiz', sub: '' },
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

// ─── Settings ─────────────────────────────────────────────────────────────────

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

// ─── Community Tab ────────────────────────────────────────────────────────────

function CommunityTab({ event, community, currentUserId }: {
  event: EventDetail; community: Community; currentUserId: string;
}) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sendAnnouncement = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('community_posts').insert([{
        community_id: event.community_id,
        author_id: currentUserId,
        post_type: 'announcement',
        content: content.trim(),
      }]);
      if (error) throw error;
      setContent('');
      setSent(true);
      toast.success('Duyuru topluluğa gönderildi! 📣');
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
      toast.error(err?.message || 'Duyuru gönderilemedi.');
    } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">

      {/* Topluluk info */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          {community.avatar_url
            ? <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
            : <span className="text-white font-black text-lg">{community.name.slice(0, 2).toUpperCase()}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{community.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">Bu etkinlik topluluğa bağlı</p>
        </div>
        <Link href={`/community/${community.id}/manage`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shrink-0">
          <Settings size={13} /> Yönet
        </Link>
      </div>

      {/* Duyuru gönder */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Megaphone size={11} /> Duyuru Gönder
          </p>
          <p className="text-xs text-slate-400 mt-1">Topluluk üyelerine etkinlikle ilgili duyuru iletebilirsiniz.</p>
        </div>

        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Etkinlikle ilgili bir duyuru yazın... (Örn: 'Etkinliğimiz bugün saat 19:00'da başlıyor!')"
          rows={4} style={{ resize: 'none' }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all" />

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400">{content.length}/2000</p>
          <button onClick={sendAnnouncement} disabled={sending || !content.trim() || content.length > 2000}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : sent ? <Check size={14} /> : <Send size={14} />}
            {sending ? 'Gönderiliyor...' : sent ? 'Gönderildi!' : 'Duyuru Gönder'}
          </button>
        </div>
      </div>

      {/* Topluluk linki */}
      <Link href={`/community/${community.id}`}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <Building2 size={15} /> Topluluk Sayfasına Git
      </Link>
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function EventControlPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('events')
        .select('*, event_attendees(count), organizer:profiles!organizer_id(first_name, last_name, avatar_url)')
        .eq('id', id).eq('organizer_id', user.id).single();

      if (error || !data) { router.push('/my-events'); return; }
      setEvent({ ...data, attendeesCount: data.event_attendees?.[0]?.count ?? 0 });

      if (data.community_id) {
        const { data: comm } = await supabase
          .from('communities').select('id, name, avatar_url').eq('id', data.community_id).single();
        if (comm) setCommunity(comm);
      }

      setLoading(false);

      const { data: gData } = await supabase
        .from('event_attendees')
        .select('id, user_id, status, ticket_type, created_at, profiles(first_name, last_name, avatar_url)')
        .eq('event_id', id).order('created_at', { ascending: false });

      setGuests((gData || []).map((g: any) => ({
        ...g, profiles: Array.isArray(g.profiles) ? g.profiles[0] ?? null : g.profiles,
      })));
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

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview',      label: 'Genel Bakış', icon: Eye },
    { key: 'guests',        label: 'Misafirler',  icon: Users },
    { key: 'registration',  label: 'Kayıt',       icon: ClipboardList },
    { key: 'insights',      label: 'İçgörüler',   icon: BarChart2 },
    { key: 'settings',      label: 'Ayarlar',     icon: Settings },
    ...(community ? [{ key: 'community' as Tab, label: 'Topluluk', icon: Building2 }] : []),
  ];

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
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
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                event.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}>
                {event.status === 'published' ? 'Yayında' : 'Taslak'}
              </span>
              {community && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Building2 size={9} /> {community.name}
                </span>
              )}
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
        <div className={`grid gap-3 ${community ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <QuickAction icon={Megaphone} label="Duyuru Gönder"
            active={activeTab === 'community'}
            onClick={() => community ? setActiveTab('community') : toast.info('Duyuru göndermek için etkinliği bir topluluğa bağlayın.')} />
          <QuickAction icon={Share2} label="Etkinliği Paylaş" onClick={async () => {
            try { await navigator.share({ title: event.title, url: window.location.href }); }
            catch { await navigator.clipboard.writeText(window.location.href); toast.success('Link kopyalandı!'); }
          }} />
          {community && (
            <QuickAction icon={Building2} label="Topluluk Yönet"
              onClick={() => router.push(`/community/${community.id}/manage`)} />
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide p-1 bg-white border border-slate-200 rounded-2xl shadow-sm w-fit max-w-full">
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
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {activeTab === 'overview'     && <OverviewTab event={event} />}
            {activeTab === 'guests'       && <GuestsTab guests={guests} loading={guestsLoading} />}
            {activeTab === 'registration' && <RegistrationTab event={event} />}
            {activeTab === 'insights'     && <InsightsTab event={event} />}
            {activeTab === 'settings'     && <SettingsTab event={event} onDelete={() => setShowDeleteModal(true)} />}
            {activeTab === 'community' && community && (
              <CommunityTab event={event} community={community} currentUserId={currentUserId} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Delete Modal */}
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
                <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
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