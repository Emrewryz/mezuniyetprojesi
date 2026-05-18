'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Calendar, Clock, MapPin, Globe, Users, Heart, Share2,
  ChevronLeft, Loader2, Check, ExternalLink, Sparkles,
  Music2, Cpu, Palette, Briefcase, PartyPopper, Dumbbell,
  Gamepad2, Crown, BadgeCheck, Megaphone, ArrowRight,
  UserPlus, UserCheck, AlertCircle,Flag
} from 'lucide-react';
import TicketSuccessModal from '@/components/ui/TicketSuccessModal';


const StaticMap = dynamic(() => import('@/components/ui/StaticMap'), { ssr: false });

const CAT_META: Record<string, { label: string; icon: any; gradient: string; mesh: string }> = {
  music:    { label: 'Müzik',     icon: Music2,      gradient: 'from-pink-500 to-rose-600',    mesh: 'radial-gradient(ellipse at 20% 50%,#f43f5e33 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#ec489933 0%,transparent 60%),linear-gradient(135deg,#1e1b4b,#312e81)' },
  tech:     { label: 'Teknoloji', icon: Cpu,         gradient: 'from-blue-500 to-cyan-600',    mesh: 'radial-gradient(ellipse at 20% 50%,#3b82f633 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#06b6d433 0%,transparent 60%),linear-gradient(135deg,#0f172a,#1e3a5f)' },
  art:      { label: 'Sanat',     icon: Palette,     gradient: 'from-violet-500 to-purple-600',mesh: 'radial-gradient(ellipse at 20% 50%,#8b5cf633 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#a855f733 0%,transparent 60%),linear-gradient(135deg,#1a0533,#2d1b69)' },
  business: { label: 'İş',        icon: Briefcase,   gradient: 'from-amber-500 to-orange-500', mesh: 'radial-gradient(ellipse at 20% 50%,#f59e0b33 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#ea580c33 0%,transparent 60%),linear-gradient(135deg,#1c1107,#431407)' },
  social:   { label: 'Sosyal',    icon: PartyPopper, gradient: 'from-emerald-500 to-teal-600', mesh: 'radial-gradient(ellipse at 20% 50%,#10b98133 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#0d948133 0%,transparent 60%),linear-gradient(135deg,#022c22,#134e4a)' },
  sport:    { label: 'Spor',      icon: Dumbbell,    gradient: 'from-orange-500 to-red-600',   mesh: 'radial-gradient(ellipse at 20% 50%,#f9731633 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#dc262633 0%,transparent 60%),linear-gradient(135deg,#1c0a00,#450a0a)' },
  game:     { label: 'Oyun',      icon: Gamepad2,    gradient: 'from-indigo-500 to-blue-600',  mesh: 'radial-gradient(ellipse at 20% 50%,#6366f133 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#1d4ed833 0%,transparent 60%),linear-gradient(135deg,#0f0c29,#1e1b4b)' },
};

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4'];

interface EventDetail {
  id: string; title: string; category: string; location: string;
  is_online: boolean; is_paid: boolean; price: number;
  start_at: string; end_at: string; long_description: string | null;
  cover_image_url: string | null; total_capacity: number;
  organizer_id: string; community_id: string | null;
  latitude: number | null; longitude: number | null;
  tags: string[];
}

interface Attendee {
  user_id: string;
  profiles: { display_name: string | null; first_name: string | null; avatar_url: string | null; };
}

interface Community {
  id: string; name: string; bio: string | null; avatar_url: string | null;
  cover_url: string | null; category: string | null; city: string | null;
  is_verified: boolean; member_count: number;
}

interface CommunityPost {
  id: string; content: string; post_type: string; created_at: string;
  profiles: { display_name: string | null; first_name: string | null; };
}

function AvatarGroup({ attendees, total }: { attendees: Attendee[]; total: number }) {
  const show = attendees.slice(0, 5);
  const extra = Math.max(0, total - show.length);
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex -space-x-2">
        {show.map((a, i) => {
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const initial = (a.profiles?.display_name || a.profiles?.first_name || '?').charAt(0).toUpperCase();
          return a.profiles?.avatar_url ? (
            <img key={a.user_id} src={a.profiles.avatar_url} alt=""
              className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
              style={{ zIndex: show.length - i }} />
          ) : (
            <div key={a.user_id} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm"
              style={{ background: color, zIndex: show.length - i }}>
              {initial}
            </div>
          );
        })}
        {extra > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm"
            style={{ zIndex: 0 }}>
            +{extra}
          </div>
        )}
      </div>
      <span className="text-sm text-slate-600 font-medium">{total.toLocaleString('tr-TR')} kişi katılıyor</span>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [community, setCommunity] = useState<Community | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [isAttending, setIsAttending] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCommunityMember, setIsCommunityMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [shared, setShared] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);


  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: ev, error } = await supabase
        .from('events').select('*').eq('id', id).single();
      if (error || !ev) { router.push('/dashboard'); return; }
      setEvent(ev);

      const [attendeesRes, favRes, communityRes] = await Promise.all([
        supabase.from('event_attendees')
          .select('user_id, profiles(display_name, first_name, avatar_url)')
          .eq('event_id', id).limit(10),
        user
          ? supabase.from('event_favorites').select('id').eq('event_id', id).eq('user_id', user.id).single()
          : Promise.resolve({ data: null }),
        ev.community_id
          ? supabase.from('communities').select('*').eq('id', ev.community_id).single()
          : Promise.resolve({ data: null }),
      ]);

      const mapped = (attendeesRes.data || []).map((a: any) => ({
        user_id: a.user_id,
        profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
      }));
      setAttendees(mapped);

      // Total count
      const { count } = await supabase.from('event_attendees')
        .select('*', { count: 'exact', head: true }).eq('event_id', id);
      setAttendeeCount(count || 0);

      if (user) {
        const { data: attending } = await supabase.from('event_attendees')
          .select('id').eq('event_id', id).eq('user_id', user.id).single();
        setIsAttending(!!attending);
      }
      setIsFavorited(!!favRes.data);

      if (communityRes.data) {
        setCommunity(communityRes.data);

        // Topluluk son 2 duyurusu
        const { data: posts } = await supabase
          .from('community_posts')
          .select('id, content, post_type, created_at, profiles(display_name, first_name)')
          .eq('community_id', ev.community_id)
          .eq('post_type', 'announcement')
          .order('created_at', { ascending: false })
          .limit(2);
        setCommunityPosts((posts || []).map((p: any) => ({
          ...p, profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
        })));

        if (user) {
          const { data: mem } = await supabase.from('community_members')
            .select('id').eq('community_id', ev.community_id).eq('user_id', user.id).single();
          setIsCommunityMember(!!mem);
        }
      }

      setLoading(false);
    })();
  }, [id]);

  const handleAttend = async () => {
    if (!currentUser) { toast.error('Katılmak için giriş yapmalısınız.'); return; }
    if (!event) return;
    
    // YENİ MANTIK: Eğer zaten katılıyorsa, iptal etmek yerine bileti göster!
    if (isAttending) {
      setTicketModal(true);
      return; 
    }

    setActionLoading(true);
    try {
      if (event.total_capacity > 0 && attendeeCount >= event.total_capacity) {
        toast.error('Kontenjan doldu.'); return;
      }
      await supabase.from('event_attendees').insert([{ event_id: id, user_id: currentUser.id }]);
      setIsAttending(true);
      setAttendeeCount(c => c + 1);
      
      // YENİ: Kayıt başarılı olunca hem toast mesajı ver hem de bilet modalını aç
      toast.success('Etkinliğe katıldınız! 🎉');
      setTicketModal(true); 
      
    } catch { toast.error('Bir hata oluştu.'); }
    finally { setActionLoading(false); }
  };

  const handleFavorite = async () => {
    if (!currentUser) { toast.error('Giriş yapmalısınız.'); return; }
    try {
      if (isFavorited) {
        await supabase.from('event_favorites').delete()
          .eq('event_id', id).eq('user_id', currentUser.id);
        setIsFavorited(false);
      } else {
        await supabase.from('event_favorites').insert([{ event_id: id, user_id: currentUser.id }]);
        setIsFavorited(true);
      }
    } catch { toast.error('Bir hata oluştu.'); }
  };

  const handleJoinCommunity = async () => {
    if (!currentUser || !community) return;
    try {
      if (isCommunityMember) {
        await supabase.from('community_members').delete()
          .eq('community_id', community.id).eq('user_id', currentUser.id);
        setIsCommunityMember(false);
        setCommunity(c => c ? { ...c, member_count: c.member_count - 1 } : c);
      } else {
        await supabase.from('community_members')
          .insert([{ community_id: community.id, user_id: currentUser.id, role: 'member' }]);
        setIsCommunityMember(true);
        setCommunity(c => c ? { ...c, member_count: c.member_count + 1 } : c);
        toast.success('Topluluğa katıldınız!');
      }
    } catch { toast.error('Bir hata oluştu.'); }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: event?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      toast.success('Link kopyalandı!');
      setTimeout(() => setShared(false), 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );

  if (!event) return null;

  const meta = CAT_META[event.category];
  const startDate = new Date(event.start_at);
  const endDate   = new Date(event.end_at);
  const isPast    = endDate < new Date();
  const capacityPct = event.total_capacity > 0
    ? Math.min(Math.round((attendeeCount / event.total_capacity) * 100), 100) : 0;
  const spotsLeft = event.total_capacity > 0 ? event.total_capacity - attendeeCount : null;
  const isFull    = spotsLeft !== null && spotsLeft <= 0;

  const fmtDate = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  const fmtStart = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const fmtEnd   = endDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const googleMapsUrl = event.latitude && event.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;

  const communityMeta = community?.category ? CAT_META[community.category] : null;
  const commInitials = community?.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '';

  // CTA Button content
  const ctaLabel = isPast ? 'Etkinlik Sona Erdi'
    : isFull ? 'Kontenjan Doldu'
    : isAttending ? 'Bileti Görüntüle' // BURAYI DEĞİŞTİRDİK
    : event.is_paid ? `Bilet Al — ₺${event.price}`
    : 'Ücretsiz Katıl';

  const ctaDisabled = isPast || (isFull && !isAttending) || actionLoading;

  // CTA Component (reused in sticky + mobile)
  const CTABox = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`bg-white ${mobile ? 'rounded-none px-4 py-4 pb-safe' : 'rounded-[28px] shadow-2xl p-6'} flex flex-col gap-5`}>
      {/* Fiyat */}
      <div className="flex items-end justify-between">
        <div>
          {event.is_paid ? (
            <>
              <p className="text-3xl font-black text-slate-900">₺{event.price}</p>
              <p className="text-xs text-slate-400 mt-0.5">kişi başı</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-black text-emerald-600">Ücretsiz</p>
              <p className="text-xs text-slate-400 mt-0.5">katılım</p>
            </>
          )}
        </div>
        {spotsLeft !== null && spotsLeft <= 10 && spotsLeft > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full">
            <AlertCircle size={12} className="text-red-500" />
            <span className="text-xs font-bold text-red-600">Son {spotsLeft} yer!</span>
          </div>
        )}
        {isFull && (
          <span className="px-3 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-500">Dolu</span>
        )}
      </div>

      {/* Kapasite barı */}
      {event.total_capacity > 0 && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{attendeeCount} kayıtlı</span>
            <span>{event.total_capacity} kapasite</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${capacityPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-blue-500'}`} />
          </div>
        </div>
      )}

      {/* Avatar group */}
      {attendeeCount > 0 && (
        <AvatarGroup attendees={attendees} total={attendeeCount} />
      )}

      {/* CTA Buton */}
      <button onClick={handleAttend} disabled={ctaDisabled}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
          isPast || isFull
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : isAttending
              ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200'
              : 'text-white hover:opacity-90 hover:shadow-lg hover:shadow-blue-200'
        }`}
        style={!isPast && !isFull && !isAttending ? { background: 'linear-gradient(135deg,#3b82f6,#2563eb)' } : {}}>
        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : isAttending ? <Check size={16} /> : null}
        {ctaLabel}
      </button>

      {/* Favori + Paylaş */}
      <div className="flex gap-2">
        <button onClick={handleFavorite}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            isFavorited ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}>
          <Heart size={14} className={isFavorited ? 'fill-current' : ''} />
          {isFavorited ? 'Favorilendi' : 'Favori'}
        </button>
        <button onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all">
          {shared ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
          {shared ? 'Kopyalandı' : 'Paylaş'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7f9] pb-24 md:pb-0">

      {/* Geri */}
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 pt-4 md:pt-6 mb-4">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors group">
          <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Geri
        </button>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 pb-8">

        {/* Hero */}
        <div className="relative w-full h-72 md:h-[420px] rounded-[28px] overflow-hidden mb-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
          {event.cover_image_url ? (
            <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" unoptimized priority />
          ) : (
            <div className="absolute inset-0" style={{ background: meta?.mesh || 'linear-gradient(135deg,#1e293b,#334155)' }}>
              {meta && <meta.icon size={180} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.04]" />}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Rozetler */}
          <div className="absolute top-5 left-5 flex items-center gap-2 flex-wrap">
            {meta && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${meta.gradient} shadow-md`}>
                <meta.icon size={12} /> {meta.label}
              </span>
            )}
            {isPast && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-black/40 text-white/80 backdrop-blur-sm">Sona Erdi</span>}
          </div>
          <div className="absolute top-5 right-5">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-md ${event.is_paid ? 'bg-black/40 text-white' : 'bg-emerald-500/80 text-white'}`}>
              {event.is_paid ? `₺${event.price}` : 'Ücretsiz'}
            </span>
          </div>

          {/* Başlık */}
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
              {event.title}
            </h1>
            {event.tags && event.tags.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {event.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium text-white">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* İki Kolon */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* SOL — Detaylar */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Tarih, Saat, Konum */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex flex-col items-center justify-center shrink-0 border border-blue-100">
                    <span className="text-[11px] font-black text-blue-700 uppercase leading-none">
                      {startDate.toLocaleDateString('tr-TR', { month: 'short' })}
                    </span>
                    <span className="text-xl font-black text-blue-700 leading-none">{startDate.getDate()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{fmtDate}</p>
                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      {fmtStart} – {fmtEnd}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                    {event.is_online
                      ? <Globe size={20} className="text-rose-500" />
                      : <MapPin size={20} className="text-rose-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{event.is_online ? 'Online Etkinlik' : 'Fiziksel Konum'}</p>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{event.location}</p>
                    {!event.is_online && (
                      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1.5 transition-colors">
                        Yol Tarifi Al <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>

                {event.total_capacity > 0 && (
                  <>
                    <div className="h-px bg-slate-100" />
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                        <Users size={20} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{event.total_capacity} Kişilik Etkinlik</p>
                        <p className="text-sm text-slate-500 mt-0.5">{attendeeCount} kayıt · {event.total_capacity - attendeeCount} yer kaldı</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Açıklama */}
            {event.long_description && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-base font-bold text-slate-900 mb-4">Etkinlik Hakkında</h2>
                <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed">
                  {event.long_description.split('\n').map((p, i) => (
                    p.trim() ? <p key={i} className="mb-3 last:mb-0">{p}</p> : null
                  ))}
                </div>
              </div>
            )}

            {/* Harita */}
            {!event.is_online && event.latitude && event.longitude && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="h-52">
                  <StaticMap lat={event.latitude} lng={event.longitude} title={event.title} />
                </div>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-xs">{event.location}</p>
                  </div>
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100">
                    <MapPin size={14} /> Yol Tarifi
                  </a>
                </div>
              </div>
            )}

            {/* Topluluk Kartı */}
{/* Topluluk Kartı */}
{community && (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
    
    {/* Cover + Avatar birlikte */}
    <div className="relative h-24 bg-slate-100 mb-10">
      {community.cover_url
        ? <Image src={community.cover_url} alt={community.name} fill className="object-cover" unoptimized />
        : <div className="absolute inset-0" style={{ background: communityMeta?.mesh || 'linear-gradient(135deg,#1e293b,#334155)' }} />
      }
      {/* Avatar cover'ın içinde absolute, alt kenardan taşıyor */}
      <div className="absolute -bottom-7 left-6 w-14 h-14 rounded-2xl ring-4 ring-white shadow-md overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center z-10">
        {community.avatar_url
          ? <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
          : <span className="text-white font-black text-lg">{commInitials}</span>
        }
      </div>
    </div>

    <div className="px-6 pb-6">
      {/* Katıl butonu — sağa hizalı */}
      <div className="flex justify-end mb-3">
        <button onClick={handleJoinCommunity}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
            isCommunityMember
              ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200'
              : 'text-white hover:opacity-90'
          }`}
          style={isCommunityMember ? {} : { background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
          {isCommunityMember ? <><UserCheck size={14} />Üyesin</> : <><UserPlus size={14} />Katıl</>}
        </button>
      </div>

      {/* İsim + rozetler */}
      <div className="flex items-center gap-2 mb-1.5">
        <p className="text-base font-black text-slate-900">{community.name}</p>
        {community.is_verified && <BadgeCheck size={16} className="text-blue-500" />}
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap">
        <span className="flex items-center gap-1"><Users size={11} className="text-slate-400" />{community.member_count.toLocaleString('tr-TR')} üye</span>
        {community.city && <span className="flex items-center gap-1"><MapPin size={11} className="text-slate-400" />{community.city}</span>}
        {communityMeta && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${communityMeta.gradient}`}>
            <communityMeta.icon size={9} /> {communityMeta.label}
          </span>
        )}
      </div>

      {community.bio && (
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">{community.bio}</p>
      )}

      {/* Topluluğu ziyaret et */}
      <Link href={`/community/${community.id}`}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors mb-4">
        <Users size={14} /> Topluluğu Ziyaret Et <ArrowRight size={13} />
      </Link>

      {/* Son duyurular */}
      {communityPosts.length > 0 && (
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Megaphone size={11} /> Son Duyurular
          </p>
          {communityPosts.map(post => (
            <div key={post.id} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{post.content}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}/ {/* Şikayet Et */}
            <div className="flex justify-center pt-2 pb-4">
              <Link
                href={`/report?type=event&id=${event.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition-colors group"
              >
                <Flag
                  size={11}
                  className="group-hover:text-rose-400 transition-colors"
                />
                Bu etkinliği şikayet et
              </Link>
            </div>
            </div>

          {/* SAĞ — Sticky CTA */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-6">
              <CTABox />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom CTA */}
      {/* Mobile sticky bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 shadow-2xl">
        <CTABox mobile />
      </div>

      {/* BURAYA EKLİYORUZ: Bilet Modalı */}
      {ticketModal && (
        <TicketSuccessModal
          isOpen={ticketModal}
          event={event}
          onClose={() => setTicketModal(false)}
        />
      )}
    </div>
  );
}