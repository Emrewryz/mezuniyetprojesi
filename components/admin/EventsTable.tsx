"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import type { EventRow } from "@/app/(admin)/admin/events/page";
import {
  toggleEventStatus,
  deleteEvent,
} from "@/app/(admin)/admin/events/actions";
import {
  Search,
  X,
  SlidersHorizontal,
  MoreHorizontal,
  Radio,
  FileEdit,
  Trash2,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Wifi,
  Ticket,
  Tag,
  EyeOff,
  Eye,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "published" | "draft" | "cancelled";
type SortKey = "created_at" | "start_at" | "title" | "price";
type SortDir = "asc" | "desc";
type ToastItem = { id: string; type: "success" | "error"; message: string };

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  items,
  onRemove,
}: {
  items: ToastItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {items.map((t: ToastItem) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md",
            t.type === "success"
              ? "border-emerald-500/30 bg-[#0d1a12] text-emerald-300"
              : "border-rose-500/30 bg-[#1a0d0d] text-rose-300"
          )}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="ml-1 rounded p-0.5 opacity-50 transition-opacity hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; badge: string; dot: string }
> = {
  published: {
    label: "Yayında",
    icon: Radio,
    badge: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
    dot: "bg-emerald-400",
  },
  draft: {
    label: "Taslak",
    icon: FileEdit,
    badge: "bg-slate-500/15 text-slate-500 ring-slate-500/20",
    dot: "bg-slate-600",
  },
  cancelled: {
    label: "İptal",
    icon: X,
    badge: "bg-rose-500/15 text-rose-400 ring-rose-500/25",
    dot: "bg-rose-400",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["draft"];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        cfg.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────

function ActionDropdown({
  event,
  onAction,
}: {
  event: EventRow;
  onAction: (action: "toggle_status" | "delete") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isPublished = event.status === "published";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-slate-500 transition-all hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-slate-300",
          open && "border-white/[0.14] bg-white/[0.07] text-slate-300"
        )}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-white/[0.10] bg-[#13131a] shadow-2xl shadow-black/60">
          <div className="p-1 space-y-0.5">
            {/* Toggle publish status */}
            <button
              onClick={() => { onAction("toggle_status"); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                isPublished
                  ? "text-slate-400 hover:bg-amber-500/10 hover:text-amber-300"
                  : "text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              )}
            >
              {isPublished ? (
                <EyeOff className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <Eye className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              {isPublished ? "Yayından Kaldır" : "Yayına Al"}
            </button>

            {/* Delete */}
            <div className="border-t border-white/[0.05] pt-0.5 mt-0.5">
              <button
                onClick={() => { onAction("delete"); setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-500/70 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                Etkinliği Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EventsTable({
  initialEvents,
}: {
  initialEvents: EventRow[];
}) {
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ── filtered + sorted list ────────────────────────────────────────────────
  const filtered = events
    .filter((e: EventRow) => {
      const matchSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "all" || e.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a: EventRow, b: EventRow) => {
      if (sortKey === "price") {
        return sortDir === "asc" ? a.price - b.price : b.price - a.price;
      }
      const aVal =
        sortKey === "title"
          ? a.title
          : sortKey === "start_at"
          ? a.start_at
          : a.created_at;
      const bVal =
        sortKey === "title"
          ? b.title
          : sortKey === "start_at"
          ? b.start_at
          : b.created_at;
      return sortDir === "asc"
        ? aVal.localeCompare(bVal, "tr")
        : bVal.localeCompare(aVal, "tr");
    });

  // ── toasts ────────────────────────────────────────────────────────────────
  function addToast(type: "success" | "error", message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev: ToastItem[]) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev: ToastItem[]) => prev.filter((t: ToastItem) => t.id !== id)),
      4000
    );
  }
  function removeToast(id: string) {
    setToasts((prev: ToastItem[]) => prev.filter((t: ToastItem) => t.id !== id));
  }

  // ── actions ───────────────────────────────────────────────────────────────
  function handleAction(event: EventRow, action: "toggle_status" | "delete") {
    if (action === "delete") {
      if (!confirm(`"${event.title}" etkinliği silinsin mi? Bu işlem geri alınamaz.`)) return;
      setLoadingId(event.id);
      startTransition(async () => {
        const result = await deleteEvent(event.id);
        setLoadingId(null);
        if (result.success) {
          setEvents((prev: EventRow[]) => prev.filter((e: EventRow) => e.id !== event.id));
          addToast("success", `"${event.title}" silindi`);
        } else {
          addToast("error", result.error ?? "Bir hata oluştu");
        }
      });
      return;
    }

    if (action === "toggle_status") {
      setLoadingId(event.id);
      startTransition(async () => {
        const result = await toggleEventStatus(event.id, event.status);
        setLoadingId(null);
        if (result.success && result.newStatus) {
          setEvents((prev: EventRow[]) =>
            prev.map((e: EventRow) =>
              e.id === event.id ? { ...e, status: result.newStatus as string } : e
            )
          );
          const msg =
            result.newStatus === "published"
              ? `"${event.title}" yayına alındı`
              : `"${event.title}" yayından kaldırıldı`;
          addToast("success", msg);
        } else {
          addToast("error", (result as any).error ?? "Bir hata oluştu");
        }
      });
    }
  }

  // ── sort toggle ───────────────────────────────────────────────────────────
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d: SortDir) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortTh({
    col,
    children,
  }: {
    col: SortKey;
    children: React.ReactNode;
  }) {
    const active = sortKey === col;
    return (
      <th
        className="cursor-pointer select-none px-4 pb-3 pt-1 text-left"
        onClick={() => toggleSort(col)}
      >
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700 transition-colors hover:text-slate-500">
          {children}
          <ArrowUpDown
            className={cn(
              "h-3 w-3 transition-colors",
              active ? "text-indigo-400" : "text-slate-800"
            )}
          />
        </span>
      </th>
    );
  }

  const FILTER_TABS: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "Tümü" },
    { value: "published", label: "Yayında" },
    { value: "draft", label: "Taslak" },
    { value: "cancelled", label: "İptal" },
  ];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-700" />
            <input
              type="text"
              placeholder="Başlık, kategori veya konum..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 pl-8 pr-3 text-xs text-slate-300 placeholder:text-slate-700 outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-indigo-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700 transition-colors hover:text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-1">
            <SlidersHorizontal className="mx-2 h-3 w-3 flex-shrink-0 text-slate-700" />
            {FILTER_TABS.map((tab: { value: FilterStatus; label: string }) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  filterStatus === tab.value
                    ? "bg-white/[0.09] text-slate-200 shadow-sm"
                    : "text-slate-600 hover:text-slate-400"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="flex-shrink-0 text-[11px] tabular-nums text-slate-700">
            {filtered.length} sonuç
          </span>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <SortTh col="title">Etkinlik</SortTh>
                <th className="px-4 pb-3 pt-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  Organizatör
                </th>
                <SortTh col="start_at">Tarih & Saat</SortTh>
                <th className="px-4 pb-3 pt-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  Konum
                </th>
                <SortTh col="price">Bilet</SortTh>
                <th className="px-4 pb-3 pt-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  Durum
                </th>
                <th className="px-4 pb-3 pt-1 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  İşlem
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-700">
                    Sonuç bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((event: EventRow) => {
                  const isLoading = loadingId === event.id;
                  const organizerName =
                    event.organizer?.display_name ||
                    [event.organizer?.first_name, event.organizer?.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    "—";
                  const organizerInitials = organizerName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  const eventInitials = event.title
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  const startDate = new Date(event.start_at);
                  const isUpcoming = startDate > new Date();

                  return (
                    <tr
                      key={event.id}
                      className={cn(
                        "group transition-colors hover:bg-white/[0.025]",
                        isLoading && "pointer-events-none opacity-40"
                      )}
                    >
                      {/* Event title + cover */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {event.cover_image_url ? (
                            <img
                              src={event.cover_image_url}
                              alt={event.title}
                              className="h-9 w-14 flex-shrink-0 rounded-md object-cover ring-1 ring-white/[0.08]"
                            />
                          ) : (
                            <div className="flex h-9 w-14 flex-shrink-0 items-center justify-center rounded-md bg-indigo-500/15 text-base ring-1 ring-indigo-500/20">
                              {event.emoji_icon ?? (
                                <span className="text-[11px] font-bold text-indigo-400">
                                  {eventInitials}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="max-w-[200px] truncate text-sm font-medium text-slate-200">
                              {event.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="rounded-sm bg-white/[0.05] px-1.5 py-px text-[10px] text-slate-600">
                                {event.category}
                              </span>
                              {Array.isArray(event.tags) && event.tags.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-700">
                                  <Tag className="h-2.5 w-2.5" />
                                  {event.tags.slice(0, 2).join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Organizer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {event.organizer?.avatar_url ? (
                            <img
                              src={event.organizer.avatar_url}
                              alt={organizerName}
                              className="h-6 w-6 flex-shrink-0 rounded-full object-cover ring-1 ring-white/[0.07]"
                            />
                          ) : (
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-700/50 text-[9px] font-bold text-slate-500 ring-1 ring-white/[0.06]">
                              {organizerInitials}
                            </div>
                          )}
                          <span className="max-w-[130px] truncate text-xs text-slate-400">
                            {organizerName}
                          </span>
                        </div>
                      </td>

                      {/* Date & time */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-300">
                            {format(startDate, "d MMM yyyy", { locale: tr })}
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {format(startDate, "HH:mm", { locale: tr })}
                            {" · "}
                            <span
                              className={cn(
                                isUpcoming ? "text-emerald-600" : "text-slate-700"
                              )}
                            >
                              {formatDistanceToNow(startDate, {
                                addSuffix: true,
                                locale: tr,
                              })}
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
                            event.is_online
                              ? "bg-sky-500/10 text-sky-400 ring-sky-500/20"
                              : "bg-slate-500/10 text-slate-500 ring-slate-500/15"
                          )}
                        >
                          {event.is_online ? (
                            <Wifi className="h-3 w-3" />
                          ) : (
                            <MapPin className="h-3 w-3" />
                          )}
                          <span className="max-w-[100px] truncate">
                            {event.is_online ? "Online" : event.location}
                          </span>
                        </span>
                      </td>

                      {/* Ticket */}
                      <td className="px-4 py-3.5">
                        {event.is_paid ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 ring-1 ring-amber-500/20">
                            <Ticket className="h-3 w-3" />
                            ₺{Number(event.price).toLocaleString("tr-TR")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500 ring-1 ring-emerald-500/15">
                            <Ticket className="h-3 w-3" />
                            Ücretsiz
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={event.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <ActionDropdown
                          event={event}
                          onAction={(action) => handleAction(event, action)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        {filtered.length > 0 && (
          <div className="border-t border-white/[0.05] px-4 py-3 text-right">
            <span className="text-[11px] text-slate-800">
              {filtered.length} / {events.length} etkinlik gösteriliyor
            </span>
          </div>
        )}
      </div>

      <Toast items={toasts} onRemove={removeToast} />
    </>
  );
}

// ─── Local cn utility (no external import) ───────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}