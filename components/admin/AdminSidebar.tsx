"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  ShieldAlert,
  Zap,
} from "lucide-react";
// YERİNE YAZILACAK:
import { supabase } from '@/lib/supabase';
const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Kullanıcılar",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Topluluklar",
    href: "/admin/communities",
    icon: Building2,
  },
  {
    label: "Etkinlikler",
    href: "/admin/events",
    icon: CalendarDays,
  },
  {
    label: "Şikayetler",
    href: "/admin/reports",
    icon: ShieldAlert,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0a0f]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/[0.06] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/20 ring-1 ring-indigo-500/40">
          <Zap className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-100">
            EtkinRota
          </span>
          <span className="text-[9px] font-medium uppercase tracking-widest text-slate-500">
            Kumanda Merkezi
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          Genel
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white/[0.08] text-slate-100"
                  : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-indigo-400"
                    : "text-slate-600 group-hover:text-slate-400"
                )}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom env badge */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 ring-1 ring-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-400">
            Production
          </span>
        </div>
      </div>
    </aside>
  );
}
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}