import { supabase } from "@/lib/supabase";
import EventsTable from "@/components/admin/EventsTable";
import { CalendarDays, Radio, FileEdit, Ticket } from "lucide-react";

export const metadata = {
  title: "Etkinlikler — EtkinRota Admin",
};

export type EventRow = {
  id: string;
  title: string;
  category: string;
  total_capacity: number;
  start_at: string;
  end_at: string;
  location: string;
  cover_image_url: string | null;
  emoji_icon: string | null;
  is_paid: boolean;
  price: number;
  status: string;
  is_online: boolean;
  tags: string[];
  created_at: string;
  organizer: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default async function AdminEventsPage() {
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      id, title, category, total_capacity,
      start_at, end_at, location,
      cover_image_url, emoji_icon,
      is_paid, price, status, is_online,
      tags, created_at,
      organizer:profiles!organizer_id (
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

  const events = (data ?? []) as unknown as EventRow[];

  const totalCount     = events.length;
  const publishedCount = events.filter((e: EventRow) => e.status === "published").length;
  const draftCount     = events.filter((e: EventRow) => e.status === "draft").length;
  const paidCount      = events.filter((e: EventRow) => e.is_paid).length;

  const summaryCards = [
    {
      label: "Toplam Etkinlik",
      value: totalCount,
      icon: CalendarDays,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      ring: "ring-slate-500/20",
    },
    {
      label: "Yayında",
      value: publishedCount,
      icon: Radio,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      ring: "ring-emerald-500/20",
    },
    {
      label: "Taslak",
      value: draftCount,
      icon: FileEdit,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
      ring: "ring-slate-500/15",
    },
    {
      label: "Ücretli",
      value: paidCount,
      icon: Ticket,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      ring: "ring-amber-500/20",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Etkinlikler</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Platformdaki tüm etkinlikleri yönet ve moderasyon yap
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
      <EventsTable initialEvents={events} />
    </div>
  );
}