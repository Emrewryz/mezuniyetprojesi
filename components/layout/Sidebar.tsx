'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  LayoutGrid, MapPin, TrendingUp, Radio, Calendar,
  Bookmark, Plus, X, Zap, Settings, LogOut,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: 'Keşfet',
    items: [
      { icon: LayoutGrid, label: 'Keşfet',                  path: '/dashboard' },
      { icon: MapPin,     label: 'Yakınımdaki Etkinlikler',  path: '/nearby' },
    ],
  },
  {
    title: 'Topluluk',
    items: [
      { icon: TrendingUp, label: 'Trendler',       path: '/trends' },
      { icon: Radio,      label: 'Topluluk',        path: '/live-stream' },
      { icon: Calendar,   label: 'Dinamik Takvim',  path: '/calendar' },
    ],
  },
  {
    title: 'Kişisel',
    items: [
      { icon: Bookmark, label: 'Etkinliklerim', path: '/my-events' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

function NavContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Çıkış yapıldı.');
    router.push('/login');
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-sky-200 shrink-0">
          <Zap size={15} className="text-white" />
        </div>
        <span className="text-base font-black tracking-tight text-slate-900">EtkinRota</span>
      </div>

      {/* Create */}
      <Link
        href="/create-event"
        prefetch
        onClick={onClose}
        className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.97]"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
      >
        <Plus size={16} /> Etkinlik Oluştur
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-5 flex-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ icon: Icon, label, path }) => {
                const isActive = pathname === path;
                return (
                  <Link
                    key={path}
                    href={path}
                    prefetch
                    onClick={onClose}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                      isActive
                        ? 'bg-sky-50 text-sky-600'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sky-500" />
                    )}
                    <Icon size={16} className={`shrink-0 ${isActive ? 'text-sky-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom — Settings + Logout */}
      <div className="pt-4 border-t border-slate-100 flex flex-col gap-0.5">
        <Link
          href="/settings"
          prefetch
          onClick={onClose}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
            pathname === '/settings'
              ? 'bg-sky-50 text-sky-600'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          {pathname === '/settings' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sky-500" />
          )}
          <Settings size={16} className={`shrink-0 ${pathname === '/settings' ? 'text-sky-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
          Ayarlar
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group w-full text-left"
        >
          <LogOut size={16} className="shrink-0 text-slate-400 group-hover:text-red-500" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-[260px] bg-white border-r border-slate-100 py-6 px-4 z-40">
        <NavContent onClose={() => {}} />
      </aside>
      <div className="hidden lg:block w-[260px] shrink-0" aria-hidden />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-[260px] bg-white border-r border-slate-100 py-6 px-4 flex flex-col z-50 shadow-2xl"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
              <NavContent onClose={() => setIsOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}