import { supabase } from '@/lib/supabase';
import UsersTable from "@/components/admin/UsersTable";
import { Users, UserCheck, UserCog, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Kullanıcılar — EtkinRota Admin",
};

export default async function AdminUsersPage() {

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, display_name, avatar_url, role, city, created_at, is_pro, onboarding_completed, email_notifications"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400">
        Veriler yüklenirken bir hata oluştu: {error.message}
      </div>
    );
  }

  const allProfiles = profiles ?? [];

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalCount = allProfiles.length;
  const participantCount = allProfiles.filter(
    (p) => p.role === "participant"
  ).length;
  const organizerCount = allProfiles.filter(
    (p) => p.role === "organizer"
  ).length;
  const adminCount = allProfiles.filter((p) => p.role === "admin").length;

  const summaryCards = [
    {
      label: "Toplam Kullanıcı",
      value: totalCount,
      icon: Users,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      ring: "ring-slate-500/20",
    },
    {
      label: "Katılımcı",
      value: participantCount,
      icon: UserCheck,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      ring: "ring-sky-500/20",
    },
    {
      label: "Organizatör",
      value: organizerCount,
      icon: UserCog,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      ring: "ring-amber-500/20",
    },
    {
      label: "Admin",
      value: adminCount,
      icon: ShieldCheck,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      ring: "ring-rose-500/20",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Kullanıcılar</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Platforma kayıtlı tüm kullanıcıları yönet
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
      <UsersTable initialUsers={allProfiles} />
    </div>
  );
}