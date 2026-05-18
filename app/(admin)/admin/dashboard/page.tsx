import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  Users,
  CalendarDays,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Circle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

// ─── helpers ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon: React.ElementType;
  accent: string;
}) {
  const isPositive = delta !== undefined && delta >= 0;
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.05]">
      {/* accent glow */}
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl ${accent}`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            {label}
          </p>
          <p className="mt-2 text-[2rem] font-bold leading-none tracking-tight text-slate-100">
            {typeof value === "number" ? value.toLocaleString("tr-TR") : value}
          </p>
          {delta !== undefined && deltaLabel && (
            <p
              className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(delta)}% {deltaLabel}
            </p>
          )}
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/[0.08]`}
        >
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
}

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  event_created: { label: "Etkinlik oluşturuldu", color: "text-indigo-400" },
  event_joined: { label: "Etkinliğe katılındı", color: "text-emerald-400" },
  community_created: { label: "Topluluk kuruldu", color: "text-amber-400" },
  community_joined: { label: "Topluluğa katılındı", color: "text-sky-400" },
  user_registered: { label: "Yeni kullanıcı", color: "text-violet-400" },
};

// ─── page ────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // ── parallel data fetches ─────────────────────────────────────────────────
  const [
    { count: totalUsers },
    { count: activeEvents },
    { count: verifiedCommunities },
    { count: totalEvents },
    { data: recentActivity },
    { data: recentUsers },
    { data: recentEvents },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .gte("end_at", new Date().toISOString()),
    supabase
      .from("communities")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("activity_feed")
      .select(
        "id, activity_type, created_at, metadata, user_id, profiles(first_name, last_name, display_name, avatar_url)"
      )
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, display_name, avatar_url, role, created_at, city")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("events")
      .select("id, title, category, status, start_at, location, is_paid, price, organizer_id")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    {
      label: "Toplam Kullanıcı",
      value: totalUsers ?? 0,
      delta: 12,
      deltaLabel: "bu ay",
      icon: Users,
      accent: "bg-indigo-500",
    },
    {
      label: "Aktif Etkinlik",
      value: activeEvents ?? 0,
      delta: 8,
      deltaLabel: "bu hafta",
      icon: CalendarDays,
      accent: "bg-emerald-500",
    },
    {
      label: "Onaylı Topluluk",
      value: verifiedCommunities ?? 0,
      delta: 3,
      deltaLabel: "bu ay",
      icon: Building2,
      accent: "bg-amber-500",
    },
    {
      label: "Toplam Etkinlik",
      value: totalEvents ?? 0,
      delta: 21,
      deltaLabel: "bu ay",
      icon: TrendingUp,
      accent: "bg-violet-500",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-slate-100">
          Genel Bakış
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Platform genelindeki anlık istatistikler
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-[1fr_340px] gap-4">
        {/* ── Left: Recent activity feed ── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Son Aktiviteler
            </h2>
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Son 12
            </span>
          </div>

          {/* Activity list */}
          <div className="divide-y divide-white/[0.04]">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((item: any) => {
                const actMeta =
                  ACTIVITY_LABELS[item.activity_type] ??
                  ACTIVITY_LABELS["user_registered"];
                const profile = item.profiles as any;
                const name =
                  profile?.display_name ||
                  [profile?.first_name, profile?.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                  "Anonim Kullanıcı";
                const eventTitle = item.metadata?.event_title ?? "";

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-white/[0.03]"
                  >
                    {/* Avatar */}
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={name}
                        className="h-7 w-7 flex-shrink-0 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-slate-400 ring-1 ring-white/10">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-slate-300">
                        <span className="font-medium text-slate-200">
                          {name}
                        </span>{" "}
                        <span className={`font-medium ${actMeta.color}`}>
                          {actMeta.label}
                        </span>
                        {eventTitle && (
                          <span className="text-slate-500">
                            {" "}
                            · {eventTitle}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Time */}
                    <span className="flex-shrink-0 text-[11px] text-slate-700">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-700">
                Henüz aktivite yok
              </div>
            )}
          </div>

          {/* Recent events table below activity */}
          <div className="border-t border-white/[0.07]">
            <div className="flex items-center justify-between px-5 py-3.5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                Son Oluşturulan Etkinlikler
              </h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {["Başlık", "Kategori", "Tarih", "Durum", "Ücret"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 pb-2.5 pt-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentEvents?.map((ev: any) => (
                  <tr
                    key={ev.id}
                    className="transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="max-w-[200px] truncate px-5 py-3 font-medium text-slate-300">
                      {ev.title}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">
                        {ev.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(ev.start_at).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                          ev.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                            : ev.status === "draft"
                            ? "bg-slate-500/10 text-slate-400 ring-slate-500/20"
                            : "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                        }`}
                      >
                        <Circle className="h-1.5 w-1.5 fill-current" />
                        {ev.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {ev.is_paid
                        ? `₺${Number(ev.price).toLocaleString("tr-TR")}`
                        : "Ücretsiz"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Recent users ── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Son Kayıt Olan
            </h2>
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Son 8
            </span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {recentUsers && recentUsers.length > 0 ? (
              recentUsers.map((u: any) => {
                const name =
                  u.display_name ||
                  [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                  "İsimsiz Kullanıcı";
                const initials = name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                  >
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={name}
                        className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-bold text-indigo-300 ring-1 ring-indigo-500/20">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {name}
                      </p>
                      <p className="truncate text-[11px] text-slate-600">
                        {u.city || "Şehir belirtilmemiş"} ·{" "}
                        <span
                          className={
                            u.role === "organizer"
                              ? "text-amber-500"
                              : "text-slate-700"
                          }
                        >
                          {u.role === "organizer" ? "Organizatör" : "Katılımcı"}
                        </span>
                      </p>
                    </div>

                    <span className="flex-shrink-0 text-[11px] text-slate-700">
                      {formatDistanceToNow(new Date(u.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-700">
                Henüz kullanıcı yok
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}