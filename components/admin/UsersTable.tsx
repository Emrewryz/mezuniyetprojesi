"use client";

"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { updateUserRole, deleteUser, type UserRole } from "@/app/(admin)/admin/users/actions";
import {
  Search,
  ChevronDown,
  Shield,
  Zap,
  UserCircle2,
  MoreHorizontal,
  UserCog,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  city: string | null;
  created_at: string;
  is_pro: boolean;
  onboarding_completed: boolean | null;
  email_notifications: boolean;
};

type FilterRole = "all" | "participant" | "organizer" | "admin";
type SortKey = "created_at" | "name" | "role";
type SortDir = "asc" | "desc";

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; badge: string; dot: string }
> = {
  admin: {
    label: "Admin",
    icon: Shield,
    badge:
      "bg-rose-500/15 text-rose-400 ring-rose-500/25 hover:bg-rose-500/20",
    dot: "bg-rose-400",
  },
  organizer: {
    label: "Organizatör",
    icon: Zap,
    badge:
      "bg-amber-500/15 text-amber-400 ring-amber-500/25 hover:bg-amber-500/20",
    dot: "bg-amber-400",
  },
  participant: {
    label: "Katılımcı",
    icon: UserCircle2,
    badge:
      "bg-slate-500/15 text-slate-400 ring-slate-500/20 hover:bg-slate-500/20",
    dot: "bg-slate-500",
  },
};

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastItem = { id: string; type: "success" | "error"; message: string };

function Toast({ items, onRemove }: { items: ToastItem[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2",
            t.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          )}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          {t.message}
          <button
            onClick={() => onRemove(t.id)}
            className="ml-1 rounded p-0.5 opacity-60 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG["participant"];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition-colors",
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
  user,
  onAction,
}: {
  user: Profile;
  onAction: (action: "role" | "delete", payload?: UserRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSubOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const roles: { value: UserRole; label: string; icon: React.ElementType }[] = [
    { value: "participant", label: "Katılımcı yap", icon: UserCircle2 },
    { value: "organizer", label: "Organizatör yap", icon: Zap },
    { value: "admin", label: "Admin yap", icon: Shield },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); setSubOpen(false); }}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-slate-500 transition-all hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-slate-300",
          open && "border-white/[0.14] bg-white/[0.07] text-slate-300"
        )}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-white/[0.10] bg-[#13131a] shadow-2xl shadow-black/60">
          {/* Role change sub-menu */}
          <div className="border-b border-white/[0.06] p-1">
            <button
              onMouseEnter={() => setSubOpen(true)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <UserCog className="h-3.5 w-3.5" />
                Rol Değiştir
              </span>
              <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
            </button>

            {subOpen && (
              <div className="mt-0.5 space-y-0.5">
                {roles
                  .filter((r) => r.value !== user.role)
                  .map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.value}
                        onClick={() => {
                          onAction("role", r.value);
                          setOpen(false);
                          setSubOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
                      >
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          ROLE_CONFIG[r.value]?.dot ?? "bg-slate-500"
                        )} />
                        <Icon className="h-3.5 w-3.5" />
                        {r.label}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="p-1">
            <button
              onClick={() => {
                onAction("delete");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-500/80 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Kullanıcıyı Sil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersTable({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ── derived list ──────────────────────────────────────────────────────────
  const filtered = users
    .filter((u) => {
      const name =
        u.display_name ||
        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
        "";
      const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
        (u.city ?? "").toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === "all" || u.role === filterRole;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortKey === "created_at") {
        aVal = a.created_at;
        bVal = b.created_at;
      } else if (sortKey === "name") {
        aVal = a.display_name || a.first_name || "";
        bVal = b.display_name || b.first_name || "";
      } else if (sortKey === "role") {
        aVal = a.role;
        bVal = b.role;
      }
      return sortDir === "asc"
        ? aVal.localeCompare(bVal, "tr")
        : bVal.localeCompare(aVal, "tr");
    });

  // ── toast helpers ─────────────────────────────────────────────────────────
  function addToast(type: "success" | "error", message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── actions ───────────────────────────────────────────────────────────────
  function handleAction(user: Profile, action: "role" | "delete", payload?: UserRole) {
    if (action === "role" && payload) {
      setLoadingId(user.id);
      startTransition(async () => {
        const result = await updateUserRole(user.id, payload);
        setLoadingId(null);
        if (result.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, role: payload } : u))
          );
          addToast("success", `Rol güncellendi → ${ROLE_CONFIG[payload]?.label}`);
        } else {
          addToast("error", result.error ?? "Bir hata oluştu");
        }
      });
    }

    if (action === "delete") {
      if (!confirm(`"${user.display_name || user.first_name || "Bu kullanıcı"}" silinsin mi?`)) return;
      setLoadingId(user.id);
      startTransition(async () => {
        const result = await deleteUser(user.id);
        setLoadingId(null);
        if (result.success) {
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          addToast("success", "Kullanıcı silindi");
        } else {
          addToast("error", result.error ?? "Bir hata oluştu");
        }
      });
    }
  }

  // ── sort toggle ───────────────────────────────────────────────────────────
  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const FILTER_TABS: { value: FilterRole; label: string }[] = [
    { value: "all", label: "Tümü" },
    { value: "participant", label: "Katılımcı" },
    { value: "organizer", label: "Organizatör" },
    { value: "admin", label: "Admin" },
  ];

  // ── SortTh helper ─────────────────────────────────────────────────────────
  function SortTh({ col, children }: { col: SortKey; children: React.ReactNode }) {
    const active = sortKey === col;
    return (
      <th
        className="cursor-pointer select-none px-4 pb-3 pt-1 text-left"
        onClick={() => toggleSort(col)}
      >
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700 hover:text-slate-500 transition-colors">
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

  return (
    <>
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3.5">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-700" />
            <input
              type="text"
              placeholder="İsim veya şehir ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 pl-8 pr-3 text-xs text-slate-300 placeholder:text-slate-700 outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-indigo-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Role filter tabs */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-1">
            <SlidersHorizontal className="mx-2 h-3 w-3 flex-shrink-0 text-slate-700" />
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterRole(tab.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  filterRole === tab.value
                    ? "bg-white/[0.09] text-slate-200 shadow-sm"
                    : "text-slate-600 hover:text-slate-400"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] tabular-nums text-slate-700">
            {filtered.length} sonuç
          </span>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <SortTh col="name">Kullanıcı</SortTh>
                <SortTh col="role">Rol</SortTh>
                <th className="px-4 pb-3 pt-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  Şehir
                </th>
                <SortTh col="created_at">Kayıt Tarihi</SortTh>
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
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-700">
                    Sonuç bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const displayName =
                    user.display_name ||
                    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
                    "İsimsiz Kullanıcı";
                  const initials = displayName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const isLoading = loadingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "group transition-colors hover:bg-white/[0.025]",
                        isLoading && "opacity-50 pointer-events-none"
                      )}
                    >
                      {/* Avatar + Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={displayName}
                              className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-white/[0.08]"
                            />
                          ) : (
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-[11px] font-bold text-indigo-400 ring-1 ring-indigo-500/20">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate text-sm font-medium text-slate-200">
                              {displayName}
                            </p>
                            <p className="flex items-center gap-1.5 text-[11px] text-slate-700">
                              {user.is_pro && (
                                <span className="rounded-sm bg-amber-500/15 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-amber-500">
                                  PRO
                                </span>
                              )}
                              <span className="font-mono text-[10px]">
                                {user.id.slice(0, 8)}…
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="px-4 py-3.5">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* City */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-500">
                          {user.city || (
                            <span className="text-slate-800">—</span>
                          )}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400">
                            {new Date(user.created_at).toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] text-slate-700">
                            {formatDistanceToNow(new Date(user.created_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status chips */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                              user.onboarding_completed
                                ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                                : "bg-slate-500/10 text-slate-600 ring-slate-500/15"
                            )}
                          >
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              user.onboarding_completed ? "bg-emerald-400" : "bg-slate-700"
                            )} />
                            {user.onboarding_completed ? "Aktif" : "Yarım"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <ActionDropdown
                          user={user}
                          onAction={(action, payload) =>
                            handleAction(user, action, payload)
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
              {filtered.length} / {users.length} kullanıcı gösteriliyor
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