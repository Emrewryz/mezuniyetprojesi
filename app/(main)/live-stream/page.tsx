'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Users, Heart, MessageCircle, Share2, Star, Megaphone,
  HelpCircle, Camera, Calendar, Ticket, UserPlus, Check,
  Loader2, Send, ChevronRight, MapPin, Clock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type PostType = 'question' | 'announcement' | 'review';

interface Post {
  id: string;
  type: PostType;
  author: { name: string; avatar: string | null; role: string };
  content: string;
  eventTitle?: string;
  eventId?: string;
  imageUrl?: string | null;
  rating?: number;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

// ─── Sabitler & Yardımcılar ───────────────────────────────────────────────────

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4'];
const avatarColor = (s: string) => AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length];
const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
  return `${Math.floor(diff / 86400)}g önce`;
};

const DUMMY_POSTS: Post[] = [
  {
    id: 'p1', type: 'announcement',
    author: { name: 'Kaleiçi Fest', avatar: null, role: 'Organizatör' },
    content: '🎺 Önemli Duyuru: Bu yılki Kaleiçi Caz Festivali programı yayınlandı! Sahne saatleri ve detaylar için etkinlik sayfamızı ziyaret edin. Erken kayıt indirimi 72 saat daha devam ediyor.',
    eventTitle: 'Kaleiçi Caz Festivali', eventId: undefined,
    likes: 84, comments: 12, isLiked: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'p2', type: 'question',
    author: { name: 'Mert A.', avatar: null, role: 'Katılımcı' },
    content: 'Konyaaltı Tech Summit\'e gidecek olan var mı? Antalya dışından geliyorum, konaklama konusunda öneriniz olursa çok sevinirim. Ayrıca networking alanı var mı?',
    eventTitle: 'Konyaaltı Tech Summit', eventId: undefined,
    likes: 23, comments: 7, isLiked: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'p3', type: 'review',
    author: { name: 'Selin K.', avatar: null, role: 'Katılımcı' },
    content: 'Geçen hafta katıldım, inanılmaz bir organizasyondu. Sahne ses düzeni mükemmeldi, venue çok şıktı. Kesinlikle tavsiye ederim!',
    eventTitle: 'Açık Hava Sanat Sergisi', eventId: undefined,
    imageUrl: null, rating: 5,
    likes: 56, comments: 9, isLiked: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'p4', type: 'question',
    author: { name: 'Zeynep T.', avatar: null, role: 'Katılımcı' },
    content: 'Lara Beach buluşmasında park yeri sıkıntı var mı? İlk kez katılacağım, biraz endişeliyim 😅',
    eventTitle: 'Lara Beach Sosyal Buluşma', eventId: undefined,
    likes: 8, comments: 4, isLiked: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, url, size = 9 }: { name: string; url?: string | null; size?: number }) {
  const px = size * 4;
  if (url) return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden shrink-0`} style={{ width: px, height: px }}>
      <Image src={url} alt={name} width={px} height={px} className="object-cover" unoptimized />
    </div>
  );
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-black shrink-0"
      style={{ width: px, height: px, background: avatarColor(name), fontSize: px * 0.38 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Post Type Meta ───────────────────────────────────────────────────────────

const POST_META: Record<PostType, { icon: any; label: string; border: string; bg: string; iconColor: string }> = {
  announcement: { icon: Megaphone, label: 'Duyuru', border: 'border-l-4 border-l-amber-400', bg: 'bg-amber-50/50', iconColor: 'text-amber-500' },
  question:     { icon: HelpCircle, label: 'Soru',   border: 'border-l-4 border-l-blue-400',  bg: '',               iconColor: 'text-blue-500' },
  review:       { icon: Camera,     label: 'İnceleme', border: 'border-l-4 border-l-violet-400', bg: '',            iconColor: 'text-violet-500' },
};

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const meta = POST_META[post.type];
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden ${meta.border} ${meta.bg}`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Avatar name={post.author.name} url={post.author.avatar} size={9} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">{post.author.name}</p>
                {post.author.role === 'Organizatör' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">Organizatör</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100`}>
            <Icon size={11} className={meta.iconColor} />
            <span className="text-[10px] font-bold text-slate-500">{meta.label}</span>
          </div>
        </div>

        {/* Event badge */}
        {post.eventTitle && (
          <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-slate-50 rounded-xl w-fit border border-slate-100">
            <Calendar size={11} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-600">{post.eventTitle}</span>
          </div>
        )}

        {/* Content */}
        <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>

        {/* Rating */}
        {post.type === 'review' && post.rating && (
          <div className="flex items-center gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} className={i < post.rating! ? 'text-amber-400 fill-current' : 'text-slate-200'} />
            ))}
            <span className="text-xs text-slate-500 ml-1 font-medium">{post.rating}/5</span>
          </div>
        )}

        {/* Image */}
        {post.imageUrl && (
          <div className="relative w-full h-48 rounded-2xl overflow-hidden mt-3 border border-slate-100">
            <Image src={post.imageUrl} alt="post" fill className="object-cover" unoptimized />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-50 flex items-center gap-4">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${post.isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
        >
          <Heart size={14} className={post.isLiked ? 'fill-current' : ''} />
          {post.likes}
        </button>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors">
          <MessageCircle size={14} />
          {post.comments}
        </button>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors ml-auto">
          <Share2 size={14} />
          Paylaş
        </button>
      </div>
    </motion.div>
  );
}

// ─── Create Post ──────────────────────────────────────────────────────────────

function CreatePost({ user, onPost }: { user: any; onPost: (text: string) => void }) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    if (!text.trim()) return;
    onPost(text.trim());
    setText('');
    setFocused(false);
  };

  const name = user?.email?.split('@')[0] || 'Misafir';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
      <div className="flex gap-3">
        <Avatar name={name} size={9} />
        <div className="flex-1 flex flex-col gap-3">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Topluluğa bir şeyler sor veya paylaş..."
            rows={focused ? 3 : 1}
            style={{ resize: 'none' }}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all leading-relaxed"
          />
          <AnimatePresence>
            {focused && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-end gap-2"
              >
                <button
                  onClick={() => { setFocused(false); setText(''); }}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={submit}
                  disabled={!text.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
                >
                  <Send size={12} /> Paylaş
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Suggested Organizers ─────────────────────────────────────────────────────

function SuggestedOrganizers({ organizers }: { organizers: any[] }) {
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={15} className="text-blue-500" />
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Önerilen Organizatörler</h3>
      </div>
      <div className="flex flex-col gap-3">
        {organizers.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 bg-slate-200 rounded animate-pulse w-24" />
                  <div className="h-2.5 bg-slate-100 rounded animate-pulse w-16" />
                </div>
                <div className="h-7 w-16 bg-slate-100 rounded-full animate-pulse" />
              </div>
            ))
          : organizers.map((org) => {
              const name = [org.first_name, org.last_name].filter(Boolean).join(' ') || org.id.slice(0, 8);
              const isFollowed = followed.has(org.id);
              return (
                <div key={org.id} className="flex items-center gap-3">
                  <Avatar name={name} url={org.avatar_url} size={9} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{name}</p>
                    <p className="text-[10px] text-slate-400">Organizatör</p>
                  </div>
                  <button
                    onClick={() => {
                      setFollowed((prev) => {
                        const next = new Set(prev);
                        isFollowed ? next.delete(org.id) : next.add(org.id);
                        return next;
                      });
                      toast.success(isFollowed ? 'Takip bırakıldı.' : 'Takip edildi!');
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                      isFollowed
                        ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    {isFollowed ? <><Check size={10} /> Takipte</> : <><UserPlus size={10} /> Takip Et</>}
                  </button>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

// ─── Upcoming Ticket Card ─────────────────────────────────────────────────────

function UpcomingTicket({ event }: { event: any }) {
  if (!event) return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Ticket size={15} className="text-violet-500" />
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Yaklaşan Etkinliğim</h3>
      </div>
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <Calendar size={24} className="text-slate-300" />
        <p className="text-xs text-slate-400 font-medium">Kayıtlı etkinliğin yok.</p>
      </div>
    </div>
  );

  const ev = event.events;
  const d = new Date(ev.start_at);
  const fmtDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });
  const fmtTime = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <Ticket size={15} className="text-violet-500" />
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Yaklaşan Etkinliğim</h3>
      </div>
      <div className="mx-5 mb-5 rounded-2xl overflow-hidden border-2 border-dashed border-violet-200 bg-violet-50/50">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex flex-col items-center justify-center shrink-0 shadow-md shadow-violet-200">
              <span className="text-sm font-black text-white leading-none">{d.getDate()}</span>
              <span className="text-[9px] text-violet-200 font-bold uppercase">{d.toLocaleDateString('tr-TR', { month: 'short' })}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 line-clamp-2 leading-snug">{ev.title}</p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Clock size={9} /> {fmtDate} · {fmtTime}
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
                <MapPin size={9} /> {ev.location}
              </p>
            </div>
          </div>
          <Link
            href={`/event-detail/${ev.id}`}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-violet-600 bg-violet-100 hover:bg-violet-200 transition-colors"
          >
            Etkinliğe Git <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(DUMMY_POSTS);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [upcomingEvent, setUpcomingEvent] = useState<any>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const orgQuery = supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('role', 'organizer')
        .limit(3);

      const upcomingQuery = user
        ? supabase
            .from('event_attendees')
            .select('id, event_id, events!inner(id, title, start_at, location, category)')
            .eq('user_id', user.id)
            .gte('events.start_at', new Date().toISOString())
            .order('events.start_at', { ascending: true })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null });

      const [{ data: orgs }, { data: upcoming }] = await Promise.all([orgQuery, upcomingQuery]);
      setOrganizers(orgs || []);
      setUpcomingEvent(upcoming || null);
      setSidebarLoading(false);
    })();
  }, []);

  const handleLike = (id: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id !== id ? p : { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
    ));
  };

  const handlePost = (text: string) => {
    if (!currentUser) { toast.error('Paylaşmak için giriş yapmalısınız.'); return; }
    const newPost: Post = {
      id: `new-${Date.now()}`,
      type: 'question',
      author: { name: currentUser.email.split('@')[0], avatar: null, role: 'Katılımcı' },
      content: text,
      likes: 0, comments: 0, isLiked: false,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
    toast.success('Gönderin paylaşıldı!');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7f9]">
      <div className="px-5 md:px-10 py-8 max-w-5xl mx-auto w-full flex flex-col gap-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
              <Users size={14} className="text-white" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">EtkinRota</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Topluluk</h1>
          <p className="text-sm text-slate-400 mt-0.5">Sor, paylaş, keşfet.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Feed ── */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <CreatePost user={currentUser} onPost={handlePost} />
            <AnimatePresence mode="popLayout">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onLike={handleLike} />
              ))}
            </AnimatePresence>
          </div>

          {/* ── Sağ Sidebar ── */}
          <div className="lg:col-span-4 flex flex-col gap-4 sticky top-8 h-fit">
            {sidebarLoading ? (
              <>
                <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-20" />
                        <div className="h-2.5 bg-slate-100 rounded animate-pulse w-14" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 p-5 h-36 animate-pulse" />
              </>
            ) : (
              <>
                <SuggestedOrganizers organizers={organizers} />
                <UpcomingTicket event={upcomingEvent} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}