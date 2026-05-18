"use client";

// YERİNE YAZILACAK:
import { supabase } from '@/lib/supabase';
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import Image from "next/image";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  role: string;
  avatar_url: string | null;
};

export default function AdminHeader({ profile }: { profile: Profile }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const displayName =
    profile.display_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Admin";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f] px-6">
      {/* Left: breadcrumb hint */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600">admin</span>
        <span className="text-slate-700">/</span>
        <span className="text-xs font-medium text-slate-400">dashboard</span>
      </div>

      {/* Right: profile + logout */}
      <div className="flex items-center gap-3">
        {/* Profile chip */}
        <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 transition-colors hover:bg-white/[0.06]">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              width={22}
              height={22}
              className="h-[22px] w-[22px] rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-indigo-500/30 text-[10px] font-bold text-indigo-300 ring-1 ring-indigo-500/30">
              {initials}
            </div>
          )}
          <span className="text-xs font-medium text-slate-300">
            {displayName}
          </span>
          <ChevronDown className="h-3 w-3 text-slate-600" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          Çıkış Yap
        </button>
      </div>
    </header>
  );
}
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}