'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Users, Calendar, MapPin, Settings, UserPlus, UserCheck,
  Loader2, Music2, Cpu, Palette, Briefcase, PartyPopper,
  Dumbbell, Gamepad2, BadgeCheck, Plus, Send,
  Pin, Megaphone, MessageSquare, Trash2, X,
  ChevronRight, ArrowLeft,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
  id: string; founder_id: string; name: string; bio: string | null;
  category: string | null; city: string | null; avatar_url: string | null;
  is_verified: boolean; member_count: number; event_count: number;
}

interface Post {
  id: string; author_id: string; post_type: string; content: string;
  is_pinned: boolean; comment_count: number; created_at: string;
  profiles: { display_name: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null };
}

interface Comment {
  id: string; post_id: string; author_id: string; content: string; created_at: string;
  profiles: { display_name: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null };
}

interface EventItem {
  id: string; title: string; category: string; location: string;
  is_paid: boolean; price: number; start_at: string; cover_image_url: string | null;
  total_capacity: number; attendees_count: number;
}

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const CAT_META: Record<string, { label: string; icon: any; gradient: string; bg: string; text: string }> = {
  music:    { label: 'Müzik',     icon: Music2,      gradient: 'from-pink-400 to-rose-500',    bg: 'bg-pink-50',    text: 'text-pink-700' },
  tech:     { label: 'Teknoloji', icon: Cpu,         gradient: 'from-blue-400 to-blue-600',    bg: 'bg-blue-50',    text: 'text-blue-700' },
  art:      { label: 'Sanat',     icon: Palette,     gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-700' },
  business: { label: 'İş',        icon: Briefcase,   gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50',   text: 'text-amber-700' },
  social:   { label: 'Sosyal',    icon: PartyPopper, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  sport:    { label: 'Spor',      icon: Dumbbell,    gradient: 'from-orange-400 to-red-500',   bg: 'bg-orange-50',  text: 'text-orange-700' },
  game:     { label: 'Oyun',      icon: Gamepad2,    gradient: 'from-indigo-400 to-blue-600',  bg: 'bg-indigo-50',  text: 'text-indigo-700' },
};

const GRADIENTS = ['from-blue-400 to-blue-600','from-violet-400 to-purple-600','from-pink-400 to-rose-500','from-emerald-400 to-teal-500','from-amber-400 to-orange-500'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDisplayName(p: any): string {
  return p?.display_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Üye';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2) return 'Az önce';
  if (m < 60) return `${m} dk`;
  if (h < 24) return `${h} saat`;
  if (d < 7) return `${d} gün`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function UserAvatar({ p, size = 'sm' }: { p: any; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-9 h-9 text-xs rounded-xl' : 'w-7 h-7 text-[10px] rounded-lg';
  const seed = (p?.author_id || p?.user_id || p?.id || '').charCodeAt(0) % GRADIENTS.length;
  const avatar = p?.profiles?.avatar_url || p?.avatar_url;
  const name = getDisplayName(p?.profiles || p);
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  if (avatar) return <img src={avatar} alt={name} className={`${dim} object-cover shrink-0`} />;
  return (
    <div className={`${dim} bg-gradient-to-br ${GRADIENTS[seed]} flex items-center justify-center text-white font-black shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Thread Slide-over ────────────────────────────────────────────────────────

function ThreadPanel({ post, currentUserId, isAdmin, onClose, onDelete }: {
  post: Post;
  currentUserId: string | null;
  isAdmin: boolean;
  onClose: () => void;
  onDelete: (postId: string) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('post_comments')
      .select('*, profiles(display_name, first_name, last_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setComments(data || []); setLoading(false); });
  }, [post.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const send = async () => {
    if (!text.trim() || !currentUserId) return;
    setSending(true);
    const { data, error } = await supabase.from('post_comments')
      .insert([{ post_id: post.id, author_id: currentUserId, content: text.trim() }])
      .select('*, profiles(display_name, first_name, last_name, avatar_url)')
      .single();
    setSending(false);
    if (error) { toast.error('Gönderilemedi.'); return; }
    setComments(prev => [...prev, data]);
    setText('');
  };

  const deleteComment = async (id: string, authorId: string) => {
    if (currentUserId !== authorId && !isAdmin) return;
    await supabase.from('post_comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shrink-0">
            <ArrowLeft size={15} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {post.post_type === 'announcement' ? 'Duyuru' : 'Tartışma'}
            </p>
            <p className="text-[11px] text-slate-400">{comments.length} yanıt</p>
          </div>
          {(currentUserId === post.author_id || isAdmin) && (
            <button onClick={() => { onDelete(post.id); onClose(); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Original post */}
        <div className={`px-5 py-4 border-b shrink-0 ${
          post.post_type === 'announcement' ? 'bg-amber-50/60 border-amber-100' : 'bg-slate-50/60 border-slate-100'
        }`}>
          <div className="flex items-center gap-2.5 mb-2">
            <UserAvatar p={{ author_id: post.author_id, profiles: post.profiles }} size="md" />
            <div>
              <p className="text-xs font-bold text-slate-900">{getDisplayName(post.profiles)}</p>
              <p className="text-[10px] text-slate-400">{relativeTime(post.created_at)}</p>
            </div>
            {post.post_type === 'announcement' && (
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                <Megaphone size={8} /> Duyuru
              </span>
            )}
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">{post.content}</p>
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-slate-400" /></div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <MessageSquare size={22} className="text-slate-300" />
              <p className="text-xs text-slate-400 font-medium">Henüz yanıt yok. İlk yanıtı sen yaz!</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex items-start gap-2.5 group">
                <UserAvatar p={{ author_id: c.author_id, profiles: c.profiles }} />
                <div className="flex-1 min-w-0 bg-slate-50 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-800">{getDisplayName(c.profiles)}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">{relativeTime(c.created_at)}</span>
                      {(currentUserId === c.author_id || isAdmin) && (
                        <button onClick={() => deleteComment(c.id, c.author_id)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Compose */}
        {currentUserId ? (
          <div className="px-4 py-3.5 border-t border-slate-100 bg-white shrink-0">
            <div className="flex items-end gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <textarea
                value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
                placeholder="Yanıt yaz... (Enter ile gönder)"
                rows={1} style={{ resize: 'none', minHeight: 28, maxHeight: 120 }}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none leading-relaxed"
              />
              <button onClick={send} disabled={sending || !text.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all shrink-0"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">Shift+Enter ile satır atla</p>
          </div>
        ) : (
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 text-center shrink-0">
            <p className="text-xs text-slate-500 font-medium">Yanıt yazmak için topluluğa katıl.</p>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, onClick, currentUserId, isAdmin, onDelete }: {
  post: Post;
  onClick: () => void;
  currentUserId: string | null;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const isAnnouncement = post.post_type === 'announcement';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`group bg-white rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
        isAnnouncement
          ? 'border-l-4 border-l-amber-400 border-amber-200 hover:border-amber-300'
          : post.is_pinned ? 'border-blue-200 bg-blue-50/20' : 'border-slate-100 hover:border-slate-200'
      }`}
      onClick={onClick}
    >
      <div className="px-4 py-3.5">
        {/* Author row */}
        <div className="flex items-center gap-2.5 mb-2">
          <UserAvatar p={{ author_id: post.author_id, profiles: post.profiles }} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">{getDisplayName(post.profiles)}</span>
              {isAnnouncement && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200">
                  <Megaphone size={7} /> Duyuru
                </span>
              )}
              {post.is_pinned && <Pin size={10} className="text-blue-500" />}
            </div>
            <span className="text-[10px] text-slate-400">{relativeTime(post.created_at)}</span>
          </div>
          {(currentUserId === post.author_id || isAdmin) && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(post.id); }}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0">
              <Trash2 size={11} />
            </button>
          )}
        </div>

        {/* Content preview */}
        <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{post.content}</p>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <MessageSquare size={11} className="text-slate-300" />
            {post.comment_count > 0
              ? <span className="text-blue-600 font-semibold">{post.comment_count} yanıt</span>
              : 'Yanıtla'
            }
          </span>
          <ChevronRight size={12} className="text-slate-300 ml-auto" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Etkinlikler Sidebar ──────────────────────────────────────────────────────

function EventsSidebar({ communityId, isAdmin }: { communityId: string; isAdmin: boolean }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('events')
      .select('id,title,category,location,is_paid,price,start_at,cover_image_url,total_capacity,event_attendees(count)')
      .eq('community_id', communityId).eq('status', 'published')
      .gte('end_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(5)
      .then(({ data }) => {
        setEvents((data || []).map((e: any) => ({
          ...e, attendees_count: e.event_attendees?.[0]?.count ?? 0,
        })));
        setLoading(false);
      });
  }, [communityId]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Yaklaşan Etkinlikler</p>
        {isAdmin && (
          <Link href="/create-event"
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
            <Plus size={13} />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Calendar size={20} className="text-slate-300" />
          <p className="text-xs text-slate-400">Henüz etkinlik yok.</p>
          {isAdmin && (
            <Link href="/create-event"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Plus size={11} /> Oluştur
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {events.map(ev => {
            const meta = ev.category ? CAT_META[ev.category] : null;
            const pct = ev.total_capacity > 0
              ? Math.min(Math.round((ev.attendees_count / ev.total_capacity) * 100), 100) : 0;
            const d = new Date(ev.start_at);
            return (
              <Link key={ev.id} href={`/event-detail/${ev.id}`}
                className="group flex flex-col gap-2 bg-white rounded-2xl border border-slate-100 p-3.5 hover:shadow-md hover:border-slate-200 transition-all overflow-hidden">
                {/* Cover küçük */}
                {ev.cover_image_url && (
                  <div className="relative h-24 rounded-xl overflow-hidden bg-slate-100">
                    <Image src={ev.cover_image_url} alt={ev.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-lg">
                      <p className="text-[9px] font-bold text-white">
                        {d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    {meta && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                    )}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ev.is_paid ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
                      {ev.is_paid ? `₺${ev.price}` : 'Ücretsiz'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">{ev.title}</p>
                  {!ev.cover_image_url && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={8} /> {ev.location.split(',')[0]}
                  </p>
                  {ev.total_capacity > 0 && (
                    <div className="mt-1.5">
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-red-400' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">{ev.attendees_count}/{ev.total_capacity} katılımcı</p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}

          {events.length >= 5 && (
            <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5">
              Tümünü Gör <ChevronRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Gönderi Akışı ────────────────────────────────────────────────────────────

function PostsFeed({ communityId, currentUserId, isAdmin, isMember }: {
  communityId: string; currentUserId: string | null; isAdmin: boolean; isMember: boolean;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'discussion' | 'announcement'>('discussion');
  const [submitting, setSubmitting] = useState(false);
  const [activeThread, setActiveThread] = useState<Post | null>(null);

  useEffect(() => {
    supabase.from('community_posts')
      .select('*, profiles(display_name, first_name, last_name, avatar_url)')
      .eq('community_id', communityId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(40)
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, [communityId]);

  const handlePost = async () => {
    if (!content.trim() || !currentUserId) return;
    if (postType === 'announcement' && !isAdmin) { toast.error('Sadece yöneticiler duyuru yapabilir.'); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from('community_posts')
      .insert([{ community_id: communityId, author_id: currentUserId, content: content.trim(), post_type: postType }])
      .select('*, profiles(display_name, first_name, last_name, avatar_url)')
      .single();
    setSubmitting(false);
    if (error) { toast.error('Gönderilemedi.'); return; }
    const newPost = { ...data, comment_count: data.comment_count ?? 0 };
    setPosts(prev => postType === 'announcement'
      ? [newPost, ...prev]
      : [...prev.filter(p => p.is_pinned), newPost, ...prev.filter(p => !p.is_pinned)]
    );
    setContent('');
    toast.success('Paylaşıldı!');
  };

  const deletePost = async (id: string) => {
    await supabase.from('community_posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    if (activeThread?.id === id) setActiveThread(null);
    toast.success('Silindi.');
  };

  const announcements = posts.filter(p => p.post_type === 'announcement');
  const discussions = posts.filter(p => p.post_type !== 'announcement');

  if (loading) return <div className="py-16 flex justify-center"><Loader2 size={18} className="animate-spin text-slate-400" /></div>;

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* Compose */}
        {isMember && currentUserId && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            {isAdmin && (
              <div className="flex gap-2">
                {(['discussion', 'announcement'] as const).map(t => (
                  <button key={t} onClick={() => setPostType(t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      postType === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                    {t === 'announcement' ? <Megaphone size={10} /> : <MessageSquare size={10} />}
                    {t === 'announcement' ? 'Duyuru' : 'Tartışma'}
                  </button>
                ))}
              </div>
            )}
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder={postType === 'announcement' ? 'Topluluğa duyuru yap...' : 'Bir şey yaz, soru sor...'}
              rows={3} style={{ resize: 'none' }}
              className="w-full bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
            <div className="flex justify-end">
              <button onClick={handlePost} disabled={submitting || !content.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white disabled:opacity-40 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Paylaş
              </button>
            </div>
          </div>
        )}

        {/* Pinned announcements */}
        {announcements.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Pin size={9} /> Duyurular
            </p>
            {announcements.map(post => (
              <PostCard key={post.id} post={post}
                onClick={() => setActiveThread(post)}
                currentUserId={currentUserId} isAdmin={isAdmin}
                onDelete={deletePost} />
            ))}
          </div>
        )}

        {/* Discussions */}
        {discussions.length > 0 && (
          <div className="flex flex-col gap-2">
            {announcements.length > 0 && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare size={9} /> Tartışmalar
              </p>
            )}
            {discussions.map(post => (
              <PostCard key={post.id} post={post}
                onClick={() => setActiveThread(post)}
                currentUserId={currentUserId} isAdmin={isAdmin}
                onDelete={deletePost} />
            ))}
          </div>
        )}

        {posts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <MessageSquare size={24} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Henüz gönderi yok.</p>
            {isMember && <p className="text-xs text-slate-400">İlk tartışmayı sen başlat!</p>}
          </div>
        )}
      </div>

      {/* Thread slide-over */}
      <AnimatePresence>
        {activeThread && (
          <ThreadPanel
            post={activeThread}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onClose={() => setActiveThread(null)}
            onDelete={deletePost}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const isMember  = !!memberRole;
  const isAdmin   = memberRole === 'founder' || memberRole === 'admin';
  const isFounder = memberRole === 'founder';

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      const [commRes, memberRes] = await Promise.all([
        supabase.from('communities').select('*').eq('id', id).single(),
        user
          ? supabase.from('community_members').select('role').eq('community_id', id).eq('user_id', user.id).single()
          : Promise.resolve({ data: null }),
      ]);
      if (commRes.error || !commRes.data) { router.push('/community'); return; }
      setCommunity(commRes.data);
      setMemberRole(memberRes.data?.role || null);
      setLoading(false);
    })();
  }, [id]);

  const toggleMember = useCallback(async () => {
    if (!currentUserId || !community) return;
    setJoining(true);
    if (isMember && !isFounder) {
      await supabase.from('community_members').delete()
        .eq('community_id', community.id).eq('user_id', currentUserId);
      setMemberRole(null);
      setCommunity(c => c ? { ...c, member_count: c.member_count - 1 } : c);
      toast.success('Topluluktan ayrıldın.');
    } else if (!isMember) {
      await supabase.from('community_members')
        .insert([{ community_id: community.id, user_id: currentUserId, role: 'member' }]);
      setMemberRole('member');
      setCommunity(c => c ? { ...c, member_count: c.member_count + 1 } : c);
      toast.success('Topluluğa katıldın!');
    }
    setJoining(false);
  }, [currentUserId, community, isMember, isFounder]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-slate-400" />
    </div>
  );
  if (!community) return null;

  const meta = community.category ? CAT_META[community.category] : null;
  const initials = community.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const avatarGrad = GRADIENTS[community.name.charCodeAt(0) % GRADIENTS.length];

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header Card ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            ← Geri
          </button>
          {isAdmin && (
            <Link href={`/community/${id}/manage`}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
              <Settings size={14} />
            </Link>
          )}
        </div>

        <div className="flex items-start gap-4">
          {/* Avatar — sadece profil */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center shadow-md ring-4 ring-white overflow-hidden shrink-0`}>
            {community.avatar_url
              ? <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
              : <span className="text-white font-black text-xl">{initials}</span>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{community.name}</h1>
              {community.is_verified && <BadgeCheck size={17} className="text-blue-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {meta && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.text}`}>
                  <meta.icon size={10} /> {meta.label}
                </span>
              )}
              {community.city && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={10} /> {community.city}
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Users size={10} /> {community.member_count.toLocaleString('tr-TR')} üye
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar size={10} /> {community.event_count} etkinlik
              </span>
            </div>
            {community.bio && (
              <p className="text-sm text-slate-500 leading-relaxed mt-2">{community.bio}</p>
            )}
          </div>

          {/* Join/Leave */}
          {!isFounder && (
            <button onClick={toggleMember} disabled={joining}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                isMember
                  ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200'
                  : 'text-white hover:opacity-90 shadow-sm'
              }`}
              style={isMember ? {} : { background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
              {joining ? <Loader2 size={14} className="animate-spin" />
                : isMember ? <><UserCheck size={13} />Ayrıl</> : <><UserPlus size={13} />Katıl</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── 2 Kolon Layout ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Sol: Etkinlikler (4 kolon) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6">
          <EventsSidebar communityId={community.id} isAdmin={isAdmin} />
        </div>

        {/* Sağ: Gönderiler + Tartışmalar (8 kolon) */}
        <div className="lg:col-span-8">
          <PostsFeed
            communityId={community.id}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isMember={isMember}
          />
        </div>
      </div>
    </div>
  );
}