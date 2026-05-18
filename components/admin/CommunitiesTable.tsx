"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import type { CommunityRow } from "@/app/(admin)/admin/communities/page";
import {
  toggleVerified,
  togglePro,
  deleteCommunity,
} from "@/app/(admin)/admin/communities/actions";
import {
  Search,
  X,
  SlidersHorizontal,
  MoreHorizontal,
  BadgeCheck,
  Sparkles,
  Trash2,
  Users,
  CalendarDays,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  ShieldOff,
  StarOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "verified" | "unverified" | "pro";
type SortKey = "created_at" | "name" | "member_count" | "event_count";
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
      {items.map((t) => (
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

// ─── Status badges ────────────────────────────────────────────────────────────

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-400 ring-1 ring-sky-500/25">
      <BadgeCheck className="h-3 w-3" />
      Doğrulandı
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-500/15">
      <ShieldOff className="h-3 w-3" />
      Bekliyor
    </span>
  );
}

function ProBadge({ pro }: { pro: boolean }) {
  return pro ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-400 ring-1 ring-amber-500/20">
      <Sparkles className="h-2.5 w-2.5" />
      PRO
    </span>
  ) : null;
}

// ─── Stat chips ───────────────────────────────────────────────────────────────

function StatChip({
  icon: Icon,
  value,
  color,
}: {
  icon: React.ElementType;
  value: number;
  color: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium tabular-nums ring-1",
        color
      )}
    >
      <Icon className="h-3 w-3 opacity-70" />
      {value.toLocaleString("tr-TR")}
    </span>
  );
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────

function ActionDropdown({
  community,
  onAction,
}: {
  community: CommunityRow;
  onAction: (
    action: "verify" | "pro" | "delete"
  ) => void;
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

  type MenuItem = {
    icon: React.ElementType;
    label: string;
    action: "verify" | "pro" | "delete";
    className: string;
  };

  const items: MenuItem[] = [
    {
      icon: community.is_verified ? ShieldOff : BadgeCheck,
      label: community.is_verified ? "Doğrulamayı Kaldır" : "Doğrula (Mavi Tık)",
      action: "verify",
      className:
        "text-slate-400 hover:bg-sky-500/10 hover:text-sky-300",
    },
    {
      icon: community.is_pro ? StarOff : Sparkles,
      label: community.is_pro ? "Pro İptal Et" : "Pro Yap",
      action: "pro",
      className:
        "text-slate-400 hover:bg-amber-500/10 hover:text-amber-300",
    },
    {
      icon: Trash2,
      label: "Topluluğu Sil",
      action: "delete",
      className: "text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400",
    },
  ];

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
            {items.map((item) => {
              const Icon = item.icon;
              const isDanger = item.action === "delete";
              return (
                <button
                  key={item.action}
                  onClick={() => {
                    onAction(item.action);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    item.className,
                    isDanger && "mt-1 border-t border-white/[0.05] pt-2"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CommunitiesTable({
  initialCommunities,
}: {
  initialCommunities: CommunityRow[];
}) {
  const [communities, setCommunities] =
    useState<CommunityRow[]>(initialCommunities);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ── derived list ──────────────────────────────────────────────────────────
  const filtered = communities
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.category ?? "").toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "verified" && c.is_verified) ||
        (filterStatus === "unverified" && !c.is_verified) ||
        (filterStatus === "pro" && c.is_pro);

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortKey === "created_at") {
        const diff =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortDir === "asc" ? diff : -diff;
      }
      if (sortKey === "member_count") {
        return sortDir === "asc"
          ? a.member_count - b.member_count
          : b.member_count - a.member_count;
      }
      if (sortKey === "event_count") {
        return sortDir === "asc"
          ? a.event_count - b.event_count
          : b.event_count - a.event_count;
      }
      // name
      return sortDir === "asc"
        ? a.name.localeCompare(b.name, "tr")
        : b.name.localeCompare(a.name, "tr");
    });

  // ── toast helpers ─────────────────────────────────────────────────────────
  function addToast(type: "success" | "error", message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000
    );
  }
  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── actions ───────────────────────────────────────────────────────────────
  function handleAction(
    community: CommunityRow,
    action: "verify" | "pro" | "delete"
  ) {
    if (action === "delete") {
      if (
        !confirm(
          `"${community.name}" topluluğunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
        )
      )
        return;

      setLoadingId(community.id);
      startTransition(async () => {
        const result = await deleteCommunity(community.id);
        setLoadingId(null);
        if (result.success) {
          setCommunities((prev) => prev.filter((c) => c.id !== community.id));
          addToast("success", `"${community.name}" silindi`);
        } else {
          addToast("error", result.error ?? "Bir hata oluştu");
        }
      });
      return;
    }

    if (action === "verify") {
      setLoadingId(community.id);
      startTransition(async () => {
        const result = await toggleVerified(community.id, community.is_verified);
        setLoadingId(null);
        if (result.success) {
          setCommunities((prev) =>
            prev.map((c) =>
              c.id === community.id
                ? { ...c, is_verified: !c.is_verified }
                : c
            )
          );
          addToast(
            "success",
            community.is_verified
              ? `"${community.name}" doğrulaması kaldırıldı`
              : `"${community.name}" doğrulandı ✓`
          );
        } else {
          addToast("error", result.error ?? "Bir hata oluştu");
        }
      });
      return;
    }

    if (action === "pro") {
      setLoadingId(community.id);
      startTransition(async () => {
        const result = await togglePro(community.id, community.is_pro);
        setLoadingId(null);
        if (result.success) {
          setCommunities((prev) =>
            prev.map((c) =>
              c.id === community.id ? { ...c, is_pro: !c.is_pro } : c
            )
          );
          addToast(
            "success",
            community.is_pro
              ? `"${community.name}" Pro üyeliği iptal edildi`
              : `"${community.name}" Pro yapıldı ✦`
          );
        } else {
          addToast("error", result.error ?? "Bir hata oluştu");
        }
      });
    }
  }

  // ── sort toggle ───────────────────────────────────────────────────────────
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortTh({
    col,
    children,
    className,
  }: {
    col: SortKey;
    children: React.ReactNode;
    className?: string;
  }) {
    const active = sortKey === col;
    return (
      <th
        className={cn("cursor-pointer select-none px-4 pb-3 pt-1 text-left", className)}
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
    { value: "verified", label: "Doğrulanmış" },
    { value: "unverified", label: "Bekleyenler" },
    { value: "pro", label: "Pro" },
  ];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3.5">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-700" />
            <input
              type="text"
              placeholder="Topluluk adı, şehir veya kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 pl-8 pr-3 text-xs text-slate-300 placeholder:text-slate-700 outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-indigo-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-1">
            <SlidersHorizontal className="mx-2 h-3 w-3 flex-shrink-0 text-slate-700" />
            {FILTER_TABS.map((tab) => (
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
                <SortTh col="name">Topluluk</SortTh>
                <th className="px-4 pb-3 pt-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  Kurucu
                </th>
                <SortTh col="member_count">İstatistikler</SortTh>
                <th className="px-4 pb-3 pt-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  Durum
                </th>
                <SortTh col="created_at">Kayıt Tarihi</SortTh>
                <th className="px-4 pb-3 pt-1 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  İşlem
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-sm text-slate-700"
                  >
                    Sonuç bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((community) => {
                  const isLoading = loadingId === community.id;
                  const founderName =
                    community.founder?.display_name ||
                    [
                      community.founder?.first_name,
                      community.founder?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ") ||
                    "—";
                  const founderInitials = founderName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const communityInitials = community.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={community.id}
                      className={cn(
                        "group transition-colors hover:bg-white/[0.025]",
                        isLoading && "pointer-events-none opacity-40"
                      )}
                    >
                      {/* Community name + avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {community.avatar_url ? (
                            <img
                              src={community.avatar_url}
                              alt={community.name}
                              className="h-9 w-9 flex-shrink-0 rounded-lg object-cover ring-1 ring-white/[0.08]"
                            />
                          ) : (
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-[11px] font-bold text-indigo-400 ring-1 ring-indigo-500/20">
                              {communityInitials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="max-w-[180px] truncate text-sm font-medium text-slate-200">
                                {community.name}
                              </p>
                              {community.is_verified && (
                                <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-sky-400" />
                              )}
                            </div>
                            <p className="flex items-center gap-1.5 text-[11px] text-slate-700">
                              {community.category && (
                                <span className="rounded-sm bg-white/[0.05] px-1.5 py-px text-[10px] text-slate-600">
                                  {community.category}
                                </span>
                              )}
                              {community.city && (
                                <span>{community.city}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Founder */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {community.founder?.avatar_url ? (
                            <img
                              src={community.founder.avatar_url}
                              alt={founderName}
                              className="h-6 w-6 flex-shrink-0 rounded-full object-cover ring-1 ring-white/[0.07]"
                            />
                          ) : (
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-700/50 text-[9px] font-bold text-slate-500 ring-1 ring-white/[0.06]">
                              {founderInitials}
                            </div>
                          )}
                          <span className="max-w-[130px] truncate text-xs text-slate-400">
                            {founderName}
                          </span>
                        </div>
                      </td>

                      {/* Stats chips */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <StatChip
                            icon={Users}
                            value={community.member_count}
                            color="bg-violet-500/10 text-violet-400 ring-violet-500/20"
                          />
                          <StatChip
                            icon={CalendarDays}
                            value={community.event_count}
                            color="bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                          />
                        </div>
                      </td>

                      {/* Status badges */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <VerifiedBadge verified={community.is_verified} />
                          <ProBadge pro={community.is_pro} />
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400">
                            {new Date(community.created_at).toLocaleDateString(
                              "tr-TR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                          <span className="text-[11px] text-slate-700">
                            {formatDistanceToNow(
                              new Date(community.created_at),
                              { addSuffix: true, locale: tr }
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <ActionDropdown
                          community={community}
                          onAction={(action) =>
                            handleAction(community, action)
                          }
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
              {filtered.length} / {communities.length} topluluk gösteriliyor
            </span>
          </div>
        )}
      </div>

      <Toast items={toasts} onRemove={removeToast} />
    </>
  );
}
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}