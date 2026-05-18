import { supabase } from '@/lib/supabase';
import CommunitiesTable from "@/components/admin/CommunitiesTable";
import { Building2, BadgeCheck, Sparkles, LayoutGrid } from "lucide-react";

export const metadata = {
  title: "Topluluklar — EtkinRota Admin",
};

export type CommunityRow = {
  id: string;
  name: string;
  slug: string | null;
  bio: string | null;
  category: string | null;
  city: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_verified: boolean;
  is_pro: boolean;
  member_count: number;
  event_count: number;
  created_at: string;
  founder: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default async function AdminCommunitiesPage() {

  const { data, error } = await supabase
    .from("communities")
    .select(
      `
      id, name, slug, bio, category, city,
      avatar_url, cover_url,
      is_verified, is_pro,
      member_count, event_count,
      created_at,
      founder:profiles!founder_id (
        first_name, last_name, display_name, avatar_url
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400">
        Veriler yüklenirken bir hata oluştu: {error.message}
      </div>
    );
  }

  const communities = (data ?? []) as unknown as CommunityRow[];

  const totalCount      = communities.length;
  const verifiedCount   = communities.filter((c) => c.is_verified).length;
  const proCount        = communities.filter((c) => c.is_pro).length;
  const pendingCount    = communities.filter((c) => !c.is_verified).length;

  const summaryCards = [
    {
      label: "Toplam Topluluk",
      value: totalCount,
      icon: Building2,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      ring: "ring-slate-500/20",
    },
    {
      label: "Doğrulanmış",
      value: verifiedCount,
      icon: BadgeCheck,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      ring: "ring-sky-500/20",
    },
    {
      label: "Pro",
      value: proCount,
      icon: Sparkles,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      ring: "ring-amber-500/20",
    },
    {
      label: "Bekleyenler",
      value: pendingCount,
      icon: LayoutGrid,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
      ring: "ring-slate-500/15",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Topluluklar</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Platformdaki tüm toplulukları yönet ve moderasyon yap
          </p>
        </div>
        <span className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs font-medium tabular-nums text-slate-500">
          {totalCount.toLocaleString("tr-TR")} kayıt
        </span>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-white/[0.10]"
            >
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${card.bg} ring-1 ${card.ring}`}
              >
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  {card.label}
                </p>
                <p className="text-xl font-bold tabular-nums leading-none text-slate-200">
                  {card.value.toLocaleString("tr-TR")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table (client component) */}
      <CommunitiesTable initialCommunities={communities} />
    </div>
  );
}