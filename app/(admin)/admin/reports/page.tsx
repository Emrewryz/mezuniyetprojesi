// ESKİ SATIRI SİL: import { supabase } from "@/lib/supabase";

// YERİNE BUNLARI EKLE:
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import ReportsTable from "@/components/admin/ReportsTable";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  Eye,
} from "lucide-react";

export const metadata = {
  title: "Şikayetler — EtkinRota Admin",
};

export type ReportRow = {
  id: string;
  reported_type: "event" | "user" | "community" | "comment";
  reported_id: string;
  reason: string;
  status: "pending" | "reviewed" | "resolved";
  admin_note: string | null;
  created_at: string;
  reporter: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default async function AdminReportsPage() {
    const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id, reported_type, reported_id,
      reason, status, admin_note, created_at,
      reporter:profiles!reporter_id (
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

  const reports = (data ?? []) as unknown as ReportRow[];

  const totalCount    = reports.length;
  const pendingCount  = reports.filter((r: ReportRow) => r.status === "pending").length;
  const reviewedCount = reports.filter((r: ReportRow) => r.status === "reviewed").length;
  const resolvedCount = reports.filter((r: ReportRow) => r.status === "resolved").length;

  const summaryCards = [
    {
      label: "Toplam Şikayet",
      value: totalCount,
      icon: ShieldAlert,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      ring: "ring-slate-500/20",
    },
    {
      label: "Bekleyenler",
      value: pendingCount,
      icon: Clock,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      ring: "ring-rose-500/20",
    },
    {
      label: "İncelenenler",
      value: reviewedCount,
      icon: Eye,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      ring: "ring-amber-500/20",
    },
    {
      label: "Çözülenler",
      value: resolvedCount,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      ring: "ring-emerald-500/20",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Şikayetler</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Kullanıcıların ilettiği şikayetleri incele ve yönet
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
              {pendingCount} bekleyen şikayet
            </span>
          )}
          <span className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs font-medium tabular-nums text-slate-500">
            {totalCount.toLocaleString("tr-TR")} kayıt
          </span>
        </div>
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

      {/* Table */}
      <ReportsTable initialReports={reports} />
    </div>
  );
}