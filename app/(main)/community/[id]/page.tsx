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
  Dumbbell, Gamepad2, BadgeCheck, Crown, Plus, Send,
  Heart, ArrowRight, Globe, Pin, Megaphone, MessageSquare,
  MoreHorizontal, Trash2, Lock,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
  id: string; founder_id: string; name: string; slug: string | null;
  bio: string | null; category: string | null; city: string | null;
  avatar_url: string | null; cover_url: string | null;
  is_verified: boolean; member_count: number; event_count: number;
}

interface Member {
  user_id: string; role: string;
  profiles: { display_name: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null; };
}

interface Post {
  id: string; community_id: string; author_id: string; post_type: string;
  content: string; is_pinned: boolean; like_count: number; created_at: string;
  profiles: { display_name: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null; };
}

interface EventItem {
  id: string; title: string; category: string; location: string;
  is_paid: boolean; price: number; start_at: string; cover_image_url: string | null;
  total_capacity: number; attendees_count: number;
}

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const CAT_META: Record<string, { label: string; icon: any; gradient: string }> = {
  music:    { label: 'Müzik',     icon: Music2,      gradient: 'from-pink-400 to-rose-500' },
  tech:     { label: 'Teknoloji', icon: Cpu,         gradient: 'from-blue-400 to-blue-600' },
  art:      { label: 'Sanat',     icon: Palette,     gradient: 'from-violet-400 to-purple-600' },
  business: { label: 'İş',        icon: Briefcase,   gradient: 'from-amber-400 to-orange-500' },
  social:   { label: 'Sosyal',    icon: PartyPopper, gradient: 'from-emerald-400 to-teal-500' },
  sport:    { label: 'Spor',      icon: Dumbbell,    gradient: 'from-orange-400 to-red-500' },
  game:     { label: 'Oyun',      icon: Gamepad2,    gradient: 'from-indigo-400 to-blue-600' },
};

const GRADIENTS = ['from-blue-400 to-blue-600','from-violet-400 to-purple-600','from-pink-400 to-rose-500','from-emerald-400 to-teal-500','from-amber-400 to-orange-500'];

function getInitials(p: { display_name?: string | null; first_name?: string | null; last_name?: string | null }) {
  const name = p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function Avatar({ p, size = 'sm' }: { p: any; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  const idx = (p?.user_id || p?.id || '').charCodeAt(0) % GRADIENTS.length;
  if (p?.profiles?.avatar_url || p?.avatar_url) {
    return <img src={p.profiles?.avatar_url || p.avatar_url} alt="" className={`${dim} rounded-full object-cover`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center text-white font-black shrink-0`}>
      {getInitials(p.profiles || p)}
    </div>
  );
}

// ─── Tab: Etkinlikler ─────────────────────────────────────────────────────────

function EventsTab({ communityId, isAdmin }: { communityId: string; isAdmin: boolean }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('events')
      .select('id,title,category,location,is_paid,price,start_at,cover_image_url,total_capacity,event_attendees(count)')
      .eq('community_id', communityId)
      .eq('status', 'published')
      .gte('end_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .then(({ data }) => {
        setEvents((data || []).map((e: any) => ({ ...e, attendees_count: e.event_attendees?.[0]?.count ?? 0 })));
        setLoading(false);
      });
  }, [communityId]);

  if (loading) return <div className="py-12 flex justify-center"><Loader2 size={20} className="animate-spin text-slate-400" /></div>;

  if (events.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Calendar size={20} className="text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-600">Henüz etkinlik yok.</p>
      {isAdmin && (
        <Link href={`/create-event`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white mt-1"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
          <Plus size={13} /> Etkinlik Oluştur
        </Link>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {events.map(ev => {
        const meta = ev.category ? CAT_META[ev.category] : null;
        const pct = ev.total_capacity > 0 ? Math.min(Math.round((ev.attendees_count / ev.total_capacity) * 100), 100) : 0;
        const fmtDate = new Date(ev.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        return (
          <Link key={ev.id} href={`/event-detail/${ev.id}`}
            className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
            <div className="relative h-36 bg-slate-100">
              {ev.cover_image_url
                ? <Image src={ev.cover_image_url} alt={ev.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                : <div className="absolute inset-0" style={{ background: meta ? `linear-gradient(135deg,#1e293b,#334155)` : '#334155' }}>
                    {meta && <meta.icon size={36} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10" />}
                  </div>
              }
              <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-white/95 rounded-lg">
                <p className="text-[10px] font-bold text-slate-800">{fmtDate}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                {meta && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${meta.gradient}`}>
                    <meta.icon size={9} /> {meta.label}
                  </span>
                )}
                <span className={`text-[10px] font-bold ${ev.is_paid ? 'text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full' : 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full'}`}>
                  {ev.is_paid ? `₺${ev.price}` : 'Ücretsiz'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{ev.title}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate"><MapPin size={10} />{ev.location}</p>
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>{ev.attendees_count} katılımcı</span><span>{pct}%</span></div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Tab: Gönderi Akışı ───────────────────────────────────────────────────────

function PostsTab({ communityId, currentUserId, isAdmin }: { communityId: string; currentUserId: string | null; isAdmin: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'discussion' | 'announcement'>('discussion');
  const [submitting, setSubmitting] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.from('community_posts')
      .select('*, profiles(display_name, first_name, last_name, avatar_url)')
      .eq('community_id', communityId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)
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
    if (error) { toast.error('Gönderi paylaşılamadı.'); return; }
    setPosts(prev => [data, ...prev]);
    setContent('');
  };

  const handleDelete = async (postId: string) => {
    await supabase.from('community_posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success('Gönderi silindi.');
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 size={20} className="animate-spin text-slate-400" /></div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Gönderi formu */}
      {currentUserId && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-3">
          {isAdmin && (
            <div className="flex gap-2">
              {(['discussion', 'announcement'] as const).map(t => (
                <button key={t} type="button" onClick={() => setPostType(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    postType === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  {t === 'announcement' ? <Megaphone size={11} /> : <MessageSquare size={11} />}
                  {t === 'announcement' ? 'Duyuru' : 'Tartışma'}
                </button>
              ))}
            </div>
          )}
          <textarea ref={textRef} value={content} onChange={e => setContent(e.target.value)}
            placeholder={postType === 'announcement' ? 'Topluluğa duyuru yapın...' : 'Bir şeyler yazın...'}
            rows={3} style={{ resize: 'none' }}
            className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
          <div className="flex justify-end">
            <button onClick={handlePost} disabled={submitting || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Paylaş
            </button>
          </div>
        </div>
      )}

      {/* Gönderiler */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <MessageSquare size={20} className="text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Henüz gönderi yok.</p>
          <p className="text-xs text-slate-400">İlk gönderiyi sen yap!</p>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className={`bg-white rounded-2xl border p-5 ${post.is_pinned ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}>
            <div className="flex items-start gap-3">
              <Avatar p={{ ...post, profiles: post.profiles }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">
                    {post.profiles?.display_name || `${post.profiles?.first_name || ''} ${post.profiles?.last_name || ''}`.trim() || 'Üye'}
                  </span>
                  {post.post_type === 'announcement' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Megaphone size={9} /> Duyuru
                    </span>
                  )}
                  {post.is_pinned && <Pin size={12} className="text-blue-500" />}
                  <span className="text-[11px] text-slate-400 ml-auto">
                    {new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">{post.content}</p>
              </div>
              {(currentUserId === post.author_id || isAdmin) && (
                <button onClick={() => handleDelete(post.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Tab: Üyeler ──────────────────────────────────────────────────────────────

function MembersTab({ communityId, isAdmin, currentUserId }: { communityId: string; isAdmin: boolean; currentUserId: string | null }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('community_members')
      .select('user_id, role, profiles:profiles!user_id(display_name, first_name, last_name, avatar_url)')
      .eq('community_id', communityId)
      .order('joined_at', { ascending: true })
      .then(({ data }) => { 
  const mapped: Member[] = (data || []).map((m: any) => ({
    user_id: m.user_id,
    role: m.role,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }));
  setMembers(mapped); 
  setLoading(false); 
});
  }, [communityId]);

  const roleLabel = (role: string) => {
    if (role === 'founder') return { label: 'Kurucu', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (role === 'admin')   return { label: 'Yönetici', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return null;
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 size={20} className="animate-spin text-slate-400" /></div>;

  return (
    <div className="flex flex-col gap-2">
      {members.map(m => {
        const badge = roleLabel(m.role);
        const name = m.profiles?.display_name || `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim() || 'Üye';
        return (
          <div key={m.user_id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
            <Avatar p={{ user_id: m.user_id, profiles: m.profiles }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 truncate">{name}</span>
                {badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>{badge.label}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'posts' | 'members'>('events');

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

      if (commRes.error || !commRes.data) { router.push('/live-stream'); return; }
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
      <Loader2 size={22} className="animate-spin text-slate-400" />
    </div>
  );

  if (!community) return null;

  const meta = community.category ? CAT_META[community.category] : null;
  const initials = community.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const TABS = [
    { key: 'events',  label: 'Etkinlikler', icon: Calendar },
    { key: 'posts',   label: 'Gönderiler',  icon: MessageSquare },
    { key: 'members', label: 'Üyeler',      icon: Users },
  ] as const;

  return (
    <div className="flex flex-col gap-0">

      {/* Cover */}
      <div className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden bg-slate-100 mb-0">
        {community.cover_url
          ? <Image src={community.cover_url} alt={community.name} fill className="object-cover" unoptimized />
          : <div className="absolute inset-0" style={{ background: meta ? `linear-gradient(135deg,#0f172a,#1e3a5f)` : 'linear-gradient(135deg,#1e293b,#334155)' }}>
              {meta && <meta.icon size={120} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5" />}
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {/* Geri */}
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-xs font-semibold hover:bg-black/50 transition-colors">
          ← Geri
        </button>
        {isAdmin && (
          <Link href={`/community/${id}/manage`}
            className="absolute top-4 right-4 w-8 h-8 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors">
            <Settings size={15} />
          </Link>
        )}
      </div>

      {/* Profil bilgisi */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-6 pt-0 pb-5 -mt-6 mx-0 relative z-10">
        <div className="flex items-end justify-between gap-4 -mt-8 mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden shrink-0 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            {community.avatar_url
              ? <Image src={community.avatar_url} alt={community.name} fill className="object-cover" unoptimized />
              : <span className="text-white font-black text-xl">{initials}</span>
            }
          </div>
          {/* Aksiyon butonları */}
          <div className="flex items-center gap-2 pb-1">
            {isAdmin && (
              <Link href={`/create-event?community_id=${id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors">
                <Plus size={13} /> Etkinlik Ekle
              </Link>
            )}
            {!isFounder && (
              <button onClick={toggleMember} disabled={joining}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isMember
                    ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200'
                    : 'text-white hover:opacity-90'
                }`}
                style={isMember ? {} : { background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                {joining ? <Loader2 size={14} className="animate-spin" /> : isMember ? <><UserCheck size={14} />Ayrıl</> : <><UserPlus size={14} />Katıl</>}
              </button>
            )}
          </div>
        </div>

        {/* İsim + meta */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{community.name}</h1>
            {community.is_verified && <BadgeCheck size={18} className="text-blue-500" />}
            {meta && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${meta.gradient}`}>
                <meta.icon size={11} /> {meta.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Users size={12} className="text-slate-400" /><strong className="text-slate-700">{community.member_count.toLocaleString('tr-TR')}</strong> üye</span>
            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /><strong className="text-slate-700">{community.event_count}</strong> etkinlik</span>
            {community.city && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" />{community.city}</span>}
          </div>

          {community.bio && <p className="text-sm text-slate-500 leading-relaxed mt-1">{community.bio}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-slate-100 rounded-2xl shadow-sm mt-4">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Tab içeriği */}
      <div className="mt-4">
        {!isMember && activeTab === 'posts' ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Lock size={24} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Gönderileri görmek için topluluğa katıl.</p>
            <button onClick={toggleMember} disabled={joining}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
              <UserPlus size={14} /> Katıl
            </button>
          </div>
        ) : activeTab === 'events'  ? <EventsTab  communityId={community.id} isAdmin={isAdmin} />
          : activeTab === 'posts'   ? <PostsTab   communityId={community.id} currentUserId={currentUserId} isAdmin={isAdmin} />
          : <MembersTab communityId={community.id} isAdmin={isAdmin} currentUserId={currentUserId} />
        }
      </div>
    </div>
  );
}