'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Calendar, Clock, MapPin, Globe, Users, Tag,
  Ticket, CheckCircle2, XCircle, AlertCircle, Crown, Share2,
  Heart, ExternalLink, Loader2, ChevronRight,
} from 'lucide-react';

const StaticMap = dynamic(() => import('@/components/ui/StaticMap'), {
  ssr: false,
  loading: () => <div className="w-full h-44 rounded-2xl bg-slate-100 animate-pulse" />,
});

// ─── Sabitler ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  music: 'Müzik & Konser', tech: 'Teknoloji', art: 'Sanat & Sergi',
  business: 'İş & Networking', social: 'Sosyal Etkinlik', sport: 'Spor', game: 'Oyun',
};

const CATEGORY_COLORS: Record<string, string> = {
  music: 'bg-pink-100 text-pink-700', tech: 'bg-blue-100 text-blue-700',
  art: 'bg-violet-100 text-violet-700', business: 'bg-amber-100 text-amber-700',
  social: 'bg-emerald-100 text-emerald-700', sport: 'bg-orange-100 text-orange-700',
  game: 'bg-indigo-100 text-indigo-700',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

function EventDetailSkeleton() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f5f7f9]">
      <div className="w-full h-[340px] md:h-[480px] bg-slate-200 animate-pulse" />
      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 flex gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-3xl p-6 flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-3xl p-6 flex flex-col gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Yardımcı Bileşenler ──────────────────────────────────────────────────────

function InfoChip({ icon: Icon, label, value, color = 'bg-blue-50', iconColor = 'text-blue-600' }: {
  icon: any; label: string; value: string; color?: string; iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon size={17} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function CapacityBar({ percent }: { percent: number }) {
  const color = percent >= 100 ? 'from-red-500 to-red-600' : percent >= 80 ? 'from-orange-400 to-red-500' : 'from-blue-500 to-blue-600';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-slate-500">Doluluk</span>
        <span className={percent >= 80 ? 'text-red-600' : 'text-slate-600'}>{Math.min(percent, 100)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {percent >= 80 && percent < 100 && (
        <p className="text-[11px] text-orange-600 font-semibold flex items-center gap-1">
          <AlertCircle size={11} /> Son birkaç yer kaldı!
        </p>
      )}
      {percent >= 100 && (
        <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
          <XCircle size={11} /> Kapasite doldu
        </p>
      )}
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attendLoading, setAttendLoading] = useState(false);
  const [isAttending, setIsAttending] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Veri çekme
  useEffect(() => {
    if (!eventId) return;

    const fetchAll = async () => {
      try {
        const [
          { data: eventData, error: eventErr },
          { data: { user } },
        ] = await Promise.all([
          supabase
            .from('events')
            .select(`
              *,
              organizer:profiles!organizer_id (
                id, first_name, last_name, avatar_url, bio, is_pro, role
              ),
              event_attendees(count)
            `)
            .eq('id', eventId)
            .single(),
          supabase.auth.getUser(),
        ]);

        if (eventErr) throw eventErr;
        if (!eventData) throw new Error('Etkinlik bulunamadı.');

        const attendeesCount = eventData.event_attendees?.[0]?.count ?? 0;
        const capacityPercent = eventData.total_capacity > 0
          ? Math.round((attendeesCount / eventData.total_capacity) * 100)
          : 0;

        setEvent({ ...eventData, attendeesCount, capacityPercent });

        if (user) {
          setCurrentUserId(user.id);
          const [{ data: attending }, { data: fav }] = await Promise.all([
            supabase
              .from('event_attendees')
              .select('id')
              .eq('event_id', eventId)
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('event_favorites')
              .select('id')
              .eq('event_id', eventId)
              .eq('user_id', user.id)
              .maybeSingle(),
          ]);
          setIsAttending(!!attending);
          setIsFavorited(!!fav);
        }
      } catch (err: any) {
        toast.error(err.message || 'Etkinlik yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [eventId]);

  // Katılım işlemi
  const handleAttend = async () => {
    if (!currentUserId) {
      toast.error('Katılmak için giriş yapmalısınız.');
      router.push('/login');
      return;
    }
    if (event?.capacityPercent >= 100) return;

    setAttendLoading(true);
    try {
      if (isAttending) {
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', currentUserId);
        if (error) throw error;
        setIsAttending(false);
        setEvent((prev: any) => ({
          ...prev,
          attendeesCount: prev.attendeesCount - 1,
          capacityPercent: Math.round(((prev.attendeesCount - 1) / prev.total_capacity) * 100),
        }));
        toast.success('Kayıt iptal edildi.');
      } else {
        const { error } = await supabase
          .from('event_attendees')
          .insert([{ event_id: eventId, user_id: currentUserId, status: 'registered' }]);
        if (error) {
          if (error.code === '23505') { toast.error('Bu etkinliğe zaten kayıtlısınız.'); return; }
          throw error;
        }
        setIsAttending(true);
        setEvent((prev: any) => ({
          ...prev,
          attendeesCount: prev.attendeesCount + 1,
          capacityPercent: Math.round(((prev.attendeesCount + 1) / prev.total_capacity) * 100),
        }));
        toast.success('Etkinliğe başarıyla kaydoldunuz! 🎉');
      }
    } catch (err: any) {
      toast.error(err.message || 'Bir hata oluştu.');
    } finally {
      setAttendLoading(false);
    }
  };

  // Favori işlemi
  const handleFavorite = async () => {
    if (!currentUserId) { toast.error('Favorilere eklemek için giriş yapmalısınız.'); return; }
    try {
      if (isFavorited) {
        await supabase.from('event_favorites').delete().eq('event_id', eventId).eq('user_id', currentUserId);
        setIsFavorited(false);
        toast.success('Favorilerden çıkarıldı.');
      } else {
        await supabase.from('event_favorites').insert([{ event_id: eventId, user_id: currentUserId }]);
        setIsFavorited(true);
        toast.success('Favorilere eklendi!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Bir hata oluştu.');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: event?.title, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link kopyalandı!');
    }
  };

  if (loading) return <EventDetailSkeleton />;

  if (!event) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <XCircle size={48} className="text-red-400" />
        <h2 className="text-2xl font-bold text-slate-800">Etkinlik bulunamadı</h2>
        <Link href="/dashboard" className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-semibold text-sm hover:bg-blue-700 transition-colors">
          Keşfete Dön
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.start_at);
  const endDate = new Date(event.end_at);
  const fmtDate = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  const fmtStartTime = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const fmtEndTime = endDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const organizerName = [event.organizer?.first_name, event.organizer?.last_name].filter(Boolean).join(' ') || 'Organizatör';
  const isFull = event.capacityPercent >= 100;
  const isOrganizer = currentUserId === event.organizer_id;

  const AttendButton = () => (
    <button
      onClick={handleAttend}
      disabled={attendLoading || isFull}
      className={`w-full py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
        ${isAttending
          ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200'
          : isFull
            ? 'bg-slate-100 text-slate-500'
            : 'text-white hover:opacity-90 hover:shadow-lg hover:shadow-blue-200'
        }`}
      style={!isAttending && !isFull ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)' } : {}}
    >
      {attendLoading
        ? <Loader2 size={16} className="animate-spin" />
        : isAttending
          ? <><CheckCircle2 size={16} /> Kaydım Var — İptal Et</>
          : isFull
            ? <><XCircle size={16} /> Yer Kalmadı</>
            : event.is_paid
              ? <><Ticket size={16} /> Bilet Al — ₺{event.price}</>
              : <><CheckCircle2 size={16} /> Ücretsiz Katıl</>
      }
    </button>
  );

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#f5f7f9] pb-24 md:pb-0">

      {/* Hero */}
      <div className="relative w-full h-[340px] md:h-[480px] bg-slate-900 overflow-hidden">
        <Image
          src={event.cover_image_url || 'https://images.unsplash.com/photo-1540039155732-d68a919385d8?q=80&w=2000&auto=format&fit=crop'}
          alt={event.title}
          fill
          className="object-cover opacity-80"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />

        {/* Back + Actions */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 md:p-6 z-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFavorite}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${isFavorited ? 'bg-red-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'}`}
            >
              <Heart size={17} className={isFavorited ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <Share2 size={17} />
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${CATEGORY_COLORS[event.category] || 'bg-blue-100 text-blue-700'}`}>
              {CATEGORY_LABELS[event.category] || event.category}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${event.is_paid ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-emerald-100 text-emerald-700'}`}>
              {event.is_paid ? `₺${event.price}` : 'Ücretsiz'}
            </span>
            {event.is_online && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                <Globe size={11} /> Online
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {event.title}
          </h1>
          <div className="flex items-center gap-2 mt-3 text-white/70 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-xs">📍</span>
              <span className="text-xs font-medium truncate max-w-xs">{event.location}</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span className="text-xs font-medium">{event.attendeesCount} katılımcı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* SOL: İçerik */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Quick Info */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <InfoChip icon={Calendar} label="Tarih" value={fmtDate} color="bg-blue-50" iconColor="text-blue-600" />
              <div className="w-px bg-slate-100 hidden sm:block" />
              <InfoChip icon={Clock} label="Saat" value={`${fmtStartTime} – ${fmtEndTime}`} color="bg-violet-50" iconColor="text-violet-600" />
              <div className="w-px bg-slate-100 hidden sm:block" />
              <InfoChip
                icon={event.is_online ? Globe : MapPin}
                label={event.is_online ? 'Format' : 'Konum'}
                value={event.is_online ? 'Online Etkinlik' : event.location}
                color="bg-rose-50"
                iconColor="text-rose-600"
              />
            </div>
          </div>

          {/* Açıklama */}
          {event.long_description && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 md:p-8">
              <h2 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-widest text-xs text-slate-500">
                Etkinlik Hakkında
              </h2>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.long_description}
              </div>
            </div>
          )}

          {/* Etiketler */}
          {event.tags?.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5 flex items-center gap-3 flex-wrap">
              <Tag size={14} className="text-slate-400 shrink-0" />
              {event.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-default">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Harita */}
          {event.latitude && event.longitude && !event.is_online && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Konum</h2>
              <StaticMap lat={event.latitude} lng={event.longitude} label={event.location} />
              <p className="text-sm text-slate-600 mt-3 flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400 shrink-0" />
                {event.location}
              </p>
            </div>
          )}

          {/* Online link */}
          {event.is_online && event.location?.startsWith('http') && isAttending && (
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Katılım Linki</p>
                <p className="text-sm text-blue-600 font-medium truncate max-w-xs">{event.location}</p>
              </div>
              <a href={event.location} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 transition-colors">
                Katıl <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Organizatör Kartı */}
          {event.organizer && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Organizatör</h2>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-black shrink-0 overflow-hidden">
                  {event.organizer.avatar_url
                    ? <Image src={event.organizer.avatar_url} alt={organizerName} width={56} height={56} className="object-cover" unoptimized />
                    : organizerName.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm">{organizerName}</p>
                    {event.organizer.is_pro && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-200">
                        <Crown size={10} /> PRO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{event.organizer.role || 'Organizatör'}</p>
                  {event.organizer.bio && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{event.organizer.bio}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SAĞ: Bilet Kartı — masaüstü sticky */}
        <div className="lg:col-span-4 hidden md:flex flex-col gap-5 sticky top-8 h-fit">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-600" />
            <div className="p-6 flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  {event.is_paid ? 'Bilet Fiyatı' : 'Giriş'}
                </p>
                <p className="text-3xl font-black text-slate-900">
                  {event.is_paid ? `₺${event.price}` : 'Ücretsiz'}
                </p>
                {event.is_paid && <p className="text-xs text-slate-400 mt-0.5">kişi başı</p>}
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 rounded-2xl p-3">
                <Users size={15} className="text-slate-400 shrink-0" />
                <span><strong className="text-slate-800">{event.attendeesCount}</strong> / {event.total_capacity} katılımcı</span>
              </div>

              <CapacityBar percent={event.capacityPercent} />

              {!isOrganizer && <AttendButton />}

              {isOrganizer && (
                <Link
                  href={`/create-event?edit=${eventId}`}
                  className="w-full py-3.5 rounded-full text-sm font-bold text-slate-700 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                  Etkinliği Düzenle <ChevronRight size={15} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBİL: Fixed bottom CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 pb-safe">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-medium">
              {event.is_paid ? 'Bilet Fiyatı' : 'Giriş'}
            </p>
            <p className="text-lg font-black text-slate-900">
              {event.is_paid ? `₺${event.price}` : 'Ücretsiz'}
            </p>
          </div>
          {!isOrganizer && (
            <div className="flex-1">
              <AttendButton />
            </div>
          )}
          {isOrganizer && (
            <Link
              href={`/create-event?edit=${eventId}`}
              className="flex-1 py-3.5 rounded-full text-sm font-bold text-slate-700 border border-slate-200 bg-slate-50 flex items-center justify-center"
            >
              Düzenle
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}