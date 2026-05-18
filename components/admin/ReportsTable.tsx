"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import type { ReportRow } from "@/app/(admin)/admin/reports/page";
import {
  resolveReport,
  markReviewed,
  deleteReport,
} from "@/app/(admin)/admin/reports/actions";
import {
  Search,
  X,
  SlidersHorizontal,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowUpDown,
  Clock,
  Eye,
  CalendarDays,
  Users,
  Building2,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "pending" | "reviewed" | "resolved";
type FilterType   = "all" | "event" | "user" | "community" | "comment";
type SortKey      = "created_at" | "status" | "reported_type";
type SortDir      = "asc" | "desc";
type ToastItem    = { id: string; type: "success" | "error"; message: string };

// ─── Config maps ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; badge: string; dot: string }
> = {
  pending: {
    label: "Bekliyor",
    icon: Clock,
    badge: "bg-rose-500/15 text-rose-400 ring-rose-500/25",
    dot: "bg-rose-400 animate-pulse",
  },
  reviewed: {
    label: "İncelendi",
    icon: Eye,
    badge: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
    dot: "bg-amber-400",
  },
  resolved: {
    label: "Çözüldü",
    icon: CheckCircle2,
    badge: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
    dot: "bg-emerald-400",
  },
};

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; badge: string }
> = {
  event: {
    label: "Etkinlik",
    icon: CalendarDays,
    badge: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
  },
  user: {
    label: "Kullanıcı",
    icon: Users,
    badge: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
  },
  community: {
    label: "Topluluk",
    icon: Building2,
    badge: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  },
  comment: {
    label: "Yorum",
    icon: MessageSquare,
    badge: "bg-slate-500/10 text-slate-400 ring-slate-500/15",
  },
};

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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["pending"];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        cfg.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Type Badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG["comment"];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        cfg.badge
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────

function ActionDropdown({
  report,
  onAction,
}: {
  report: ReportRow;
  onAction: (action: "reviewed" | "resolved" | "delete") => void;
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

  const isResolved = report.status === "resolved";
  const isReviewed = report.status === "reviewed";

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
            {/* Mark reviewed (only if pending) */}
            {!isReviewed && !isResolved && (
              <button
                onClick={() => { onAction("reviewed"); setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-amber-500/10 hover:text-amber-300"
              >
                <Eye className="h-3.5 w-3.5 flex-shrink-0" />
                İncelendi İşaretle
              </button>
            )}

            {/* Mark resolved */}
            {!isResolved && (
              <button
                onClick={() => { onAction("resolved"); setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                Çözüldü İşaretle
              </button>
            )}

            {/* Delete */}
            <div className="border-t border-white/[0.05] pt-0.5 mt-0.5">
              <button
                onClick={() => { onAction("delete"); setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-500/70 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                Şikayeti Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsTable({
  initialReports,
}: {
  initialReports: ReportRow[];
}) {
  const [reports, setReports]       = useState<ReportRow[]>(initialReports);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortKey, setSortKey]       = useState<SortKey>("created_at");
  const [sortDir, setSortDir]       = useState<SortDir>("desc");
  const [toasts, setToasts]         = useState<ToastItem[]>([]);
  const [, startTransition]         = useTransition();
  const [loadingId, setLoadingId]   = useState<string | null>(null);

  // ── derived list ──────────────────────────────────────────────────────────
  const filtered = reports
    .filter((r: ReportRow) => {
      const reporterName =
        r.reporter?.display_name ||
        [r.reporter?.first_name, r.reporter?.last_name].filter(Boolean).join(" ") || "";
      const matchSearch =
        reporterName.toLowerCase().includes(search.toLowerCase()) ||
        r.reason.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      const matchType   = filterType   === "all" || r.reported_type === filterType;
      return matchSearch && matchStatus && matchType;
    })
    .sort((a: ReportRow, b: ReportRow) => {
      const aVal =
        sortKey === "status"        ? a.status :
        sortKey === "reported_type" ? a.reported_type :
        a.created_at;
      const bVal =
        sortKey === "status"        ? b.status :
        sortKey === "reported_type" ? b.reported_type :
        b.created_at;
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
  function handleAction(report: ReportRow, action: "reviewed" | "resolved" | "delete") {
    if (action === "delete") {
      if (!confirm("Bu şikayet kaydı silinsin mi?")) return;
      setLoadingId(report.id);
      startTransition(async () => {
        const result = await deleteReport(report.id);
        setLoadingId(null);
        if (result.success) {
          setReports((prev: ReportRow[]) => prev.filter((r: ReportRow) => r.id !== report.id));
          addToast("success", "Şikayet silindi");
        } else {
          addToast("error", result.error ?? "Bir hata oluştu");
        }
      });
      return;
    }

    if (action === "resolved") {
      setLoadingId(report.id);
      startTransition(async () => {
        const result = await resolveReport(report.id);
        setLoadingId(null);
        if (result.success) {
          setReports((prev: ReportRow[]) =>
            prev.map((r: ReportRow) =>
              r.id === report.id ? { ...r, status: "resolved" } : r
            )
          );
          addToast("success", "Şikayet çözüldü olarak işaretlendi");
        } else {
          addToast("error", result.error ?? "Bir hata oluştu");
        }
      });
      return;
    }

    if (action === "reviewed") {
      setLoadingId(report.id);
      startTransition(async () => {
        const result = await markReviewed(report.id);
        setLoadingId(null);
        if (result.success) {
          setReports((prev: ReportRow[]) =>
            prev.map((r: ReportRow) =>
              r.id === report.id ? { ...r, status: "reviewed" } : r
            )
          );
          addToast("success", "Şikayet incelendi olarak işaretlendi");
        } else {
          addToast("error", result.error ?? "Bir hata oluştu");
        }
      });
    }
  }

  // ── sort toggle ───────────────────────────────────────────────────────────
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d: SortDir) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortTh({ col, children }: { col: SortKey; children: React.ReactNode }) {
    const active = sortKey === col;
    return (
      <th
        className="cursor-pointer select-none px-4 pb-3 pt-1 text-left"
        onClick={() => toggleSort(col)}
      >
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700 transition-colors hover:text-slate-500">
          {children}
          <ArrowUpDown className={cn("h-3 w-3 transition-colors", active ? "text-indigo-400" : "text-slate-800")} />
        </span>
      </th>
    );
  }

  const STATUS_TABS: { value: FilterStatus; label: string }[] = [
    { value: "all",      label: "Tümü" },
    { value: "pending",  label: "Bekleyenler" },
    { value: "reviewed", label: "İncelenenler" },
    { value: "resolved", label: "Çözülenler" },
  ];

  const TYPE_TABS: { value: FilterType; label: string }[] = [
    { value: "all",       label: "Tür: Tümü" },
    { value: "event",     label: "Etkinlik" },
    { value: "user",      label: "Kullanıcı" },
    { value: "community", label: "Topluluk" },
    { value: "comment",   label: "Yorum" },
  ];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5">
          {/* Search */}
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-700" />
            <input
              type="text"
              placeholder="Kullanıcı adı veya sebep..."
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

          <div className="flex items-center gap-2">
            {/* Status filter */}
            <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-1">
              <SlidersHorizontal className="mx-1.5 h-3 w-3 flex-shrink-0 text-slate-700" />
              {STATUS_TABS.map((tab: { value: FilterStatus; label: string }) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                    filterStatus === tab.value
                      ? "bg-white/[0.09] text-slate-200 shadow-sm"
                      : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-1">
              {TYPE_TABS.map((tab: { value: FilterType; label: string }) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterType(tab.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                    filterType === tab.value
                      ? "bg-white/[0.09] text-slate-200 shadow-sm"
                      : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
                <th className="px-4 pb-3 pt-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  Şikayet Eden
                </th>
                <SortTh col="reported_type">Şikayet Türü</SortTh>
                <th className="px-4 pb-3 pt-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  Sebep
                </th>
                <SortTh col="created_at">Tarih</SortTh>
                <SortTh col="status">Durum</SortTh>
                <th className="px-4 pb-3 pt-1 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  İşlem
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-700">
                    Sonuç bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((report: ReportRow) => {
                  const isLoading = loadingId === report.id;
                  const reporterName =
                    report.reporter?.display_name ||
                    [report.reporter?.first_name, report.reporter?.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    "Anonim";
                  const reporterInitials = reporterName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={report.id}
                      className={cn(
                        "group transition-colors hover:bg-white/[0.025]",
                        isLoading && "pointer-events-none opacity-40",
                        report.status === "pending" && "border-l-2 border-l-rose-500/30"
                      )}
                    >
                      {/* Reporter */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {report.reporter?.avatar_url ? (
                            <img
                              src={report.reporter.avatar_url}
                              alt={reporterName}
                              className="h-7 w-7 flex-shrink-0 rounded-full object-cover ring-1 ring-white/[0.08]"
                            />
                          ) : (
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-[10px] font-bold text-indigo-400 ring-1 ring-indigo-500/20">
                              {reporterInitials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="max-w-[150px] truncate text-sm font-medium text-slate-300">
                              {reporterName}
                            </p>
                            <p className="font-mono text-[10px] text-slate-700">
                              {report.reporter ? "" : "Hesap silinmiş"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <TypeBadge type={report.reported_type} />
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3.5 max-w-[280px]">
                        <p className="line-clamp-2 text-xs text-slate-400 leading-relaxed">
                          {report.reason}
                        </p>
                        {report.admin_note && (
                          <p className="mt-1 line-clamp-1 text-[11px] text-emerald-600 italic">
                            Not: {report.admin_note}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400">
                            {new Date(report.created_at).toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] text-slate-700">
                            {formatDistanceToNow(new Date(report.created_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={report.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <ActionDropdown
                          report={report}
                          onAction={(action) => handleAction(report, action)}
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
              {filtered.length} / {reports.length} şikayet gösteriliyor
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