'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  LayoutGrid, MapPin, TrendingUp, Radio, Calendar,
  Bookmark, X, Ticket, Zap, Plus, Settings, LogOut,
  ChevronUp, User,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutGrid, label: 'Keşfet',        path: '/dashboard' },
  { icon: MapPin,     label: 'Yakınımda',      path: '/nearby' },
  { icon: TrendingUp, label: 'Trendler',       path: '/trends' },
  { icon: Radio,      label: 'Topluluk',       path: '/live-stream' },
  { icon: Calendar,   label: 'Takvim',         path: '/calendar' },
  { icon: Ticket,     label: 'Etkinliklerim',  path: '/my-events' },
  { icon: Bookmark,   label: 'Kaydettiklerim', path: '/saved' },
];

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (v: boolean) => void;
}

function NavContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Çıkış yapıldı.');
    router.push('/login');
    onClose();
  };

  const displayName = user?.email?.split('@')[0] || '';
  const initials = displayName.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5 px-3 mb-7">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
          <Zap size={15} className="text-white" />
        </div>
        <span className="text-base font-black tracking-tight text-slate-900">EtkinRota</span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          return (
            <Link key={path} href={path} prefetch onClick={onClose}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
                isActive ? 'text-slate-900' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
              }`}>
              {isActive && (
                <motion.span layoutId="active-pill"
                  className="absolute inset-0 rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2}
                className={`shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className={isActive ? 'font-semibold' : 'font-medium'}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Alt kısım */}
      <div className="flex flex-col gap-2 pt-4 border-t border-slate-200/60 mt-4">
        {/* Etkinlik Oluştur */}
        <Link href="/create-event" onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
          <Plus size={15} className="shrink-0" />
          Etkinlik Oluştur
        </Link>

        {/* Profil */}
        {user && (
          <div ref={profileRef} className="relative">
            <button onClick={() => setProfileOpen((v) => !v)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/70 transition-colors group">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
              <ChevronUp size={14} className={`text-slate-400 transition-transform shrink-0 ${profileOpen ? '' : 'rotate-180'}`} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50"
                >
                  <Link href="/settings" onClick={() => { setProfileOpen(false); onClose(); }}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <Settings size={14} className="text-slate-400" /> Ayarlar
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100">
                    <LogOut size={14} className="text-red-400" /> Çıkış Yap
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!user && (
          <Link href="/login" onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-white/70 hover:text-slate-800 transition-colors">
            <User size={15} className="shrink-0 text-slate-400" /> Giriş Yap
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen = false, setIsOpen }: SidebarProps) {
  return (
    <>
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-[210px] bg-slate-50 border-r border-slate-200/60 pt-5 px-3 pb-4 z-30">
        <NavContent onClose={() => {}} />
      </aside>
      <div className="hidden lg:block w-[210px] shrink-0" aria-hidden />

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div key="bd"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="lg:hidden fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
              onClick={() => setIsOpen?.(false)} />
            <motion.aside key="drawer"
              initial={{ x: -230 }} animate={{ x: 0 }} exit={{ x: -230 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-[210px] bg-slate-50 border-r border-slate-200/60 pt-5 px-3 pb-4 flex flex-col z-50 shadow-xl">
              <button onClick={() => setIsOpen?.(false)}
                className="absolute top-4 right-3 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                <X size={14} />
              </button>
              <NavContent onClose={() => setIsOpen?.(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}