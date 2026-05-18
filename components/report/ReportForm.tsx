"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReport, type ReportType } from "@/app/(main)/report/actions";
import {
  AlertTriangle,
  ChevronLeft,
  Send,
  CalendarDays,
  Users,
  Building2,
  MessageSquare,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  ReportType,
  {
    label: string;
    icon: React.ElementType;
    description: string;
    color: string;
    lightBg: string;
  }
> = {
  event: {
    label: "Etkinlik",
    icon: CalendarDays,
    description: "Bu etkinliğin uygunsuz veya yanıltıcı içerik barındırdığını düşünüyorsunuz.",
    color: "text-blue-600",
    lightBg: "bg-blue-50",
  },
  user: {
    label: "Kullanıcı",
    icon: Users,
    description: "Bu kullanıcının topluluk kurallarını ihlal ettiğini düşünüyorsunuz.",
    color: "text-violet-600",
    lightBg: "bg-violet-50",
  },
  community: {
    label: "Topluluk",
    icon: Building2,
    description: "Bu topluluğun uygunsuz içerik veya davranış sergilediğini düşünüyorsunuz.",
    color: "text-amber-600",
    lightBg: "bg-amber-50",
  },
  comment: {
    label: "Yorum",
    icon: MessageSquare,
    description: "Bu yorumun rahatsız edici, iftira niteliğinde veya zararlı olduğunu düşünüyorsunuz.",
    color: "text-rose-600",
    lightBg: "bg-rose-50",
  },
};

const REASON_PRESETS = [
  "Yanıltıcı veya sahte içerik",
  "Uygunsuz veya zararlı içerik",
  "Spam veya reklam",
  "Taciz veya zorbalık",
  "Nefret söylemi",
  "Telif hakkı ihlali",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type SubjectPreview = {
  title: string;
  subtitle?: string;
  avatar?: string | null;
} | null;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportForm({
  reportedType,
  reportedId,
  preview,
}: {
  reportedType: ReportType;
  reportedId: string;
  preview: SubjectPreview;
}) {
  const router = useRouter();
  const [reason, setReason]         = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [submitted, setSubmitted]   = useState(false);
  const [isPending, startTransition] = useTransition();

  const cfg = TYPE_CONFIG[reportedType];
  const Icon = cfg.icon;
  const charCount = reason.length;
  const isValid = charCount >= 10;

  function handlePreset(preset: string) {
    setReason((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n${preset}` : preset;
    });
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitReport({
        reported_type: reportedType,
        reported_id: reportedId,
        reason,
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Bir hata oluştu, lütfen tekrar deneyin.");
      }
    });
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Şikayetiniz Alındı</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              Ekibimiz en kısa sürede inceleyecek ve gerekli işlemleri yapacaktır. Katkınız için teşekkür ederiz.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full pt-2">
            <button
              onClick={() => router.back()}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Geri Dön
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full rounded-xl border border-slate-200 bg-white/70 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-white"
            >
              Ana Sayfaya Git
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${cfg.lightBg}`}>
          <ShieldAlert className={`h-5 w-5 ${cfg.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-black tracking-tight text-slate-900">
            Şikayet Bildir
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 leading-relaxed">
            {cfg.description}
          </p>
        </div>
      </div>

      {/* Subject preview card */}
      <div className={`flex items-center gap-3 rounded-2xl border border-slate-200/70 ${cfg.lightBg} p-3.5`}>
        {preview?.avatar ? (
          <img
            src={preview.avatar}
            alt={preview.title}
            className="h-10 w-10 flex-shrink-0 rounded-xl object-cover ring-1 ring-white"
          />
        ) : (
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-white shadow-sm`}>
            <Icon className={`h-5 w-5 ${cfg.color}`} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.lightBg} ${cfg.color} ring-1 ring-current/20`}>
              {cfg.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
            {preview?.title ?? "İçerik"}
          </p>
          {preview?.subtitle && (
            <p className="truncate text-xs text-slate-500">{preview.subtitle}</p>
          )}
        </div>
      </div>

      {/* Preset reason chips */}
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Hızlı Sebep Seç
        </p>
        <div className="flex flex-wrap gap-2">
          {REASON_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              type="button"
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.97]"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Reason textarea */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Şikayet Sebebiniz <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Bu içeriği neden şikayet ettiğinizi açıklayın. Ne kadar detaylı olursa ekibimiz o kadar hızlı değerlendirebilir."
            rows={5}
            maxLength={500}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <span
            className={`absolute bottom-3 right-3.5 text-[11px] font-medium tabular-nums transition-colors ${
              charCount > 450
                ? "text-rose-400"
                : charCount > 200
                ? "text-amber-400"
                : "text-slate-300"
            }`}
          >
            {charCount}/500
          </span>
        </div>
        {!isValid && charCount > 0 && (
          <p className="mt-1.5 text-xs text-rose-500">
            En az 10 karakter girmelisiniz ({10 - charCount} karakter daha).
          </p>
        )}
      </div>

      {/* Server error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2.5 pt-1">
        <button
          onClick={handleSubmit}
          disabled={!isValid || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-200/60 transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isPending ? "Gönderiliyor..." : "Şikayeti Gönder"}
        </button>

        <button
          onClick={() => router.back()}
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Geri Dön
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        Şikayetler yalnızca moderasyon ekibine iletilir.
        Gerçek dışı veya kötü niyetli şikayetler hesap kısıtlamasına yol açabilir.
      </p>
    </PageShell>
  );
}

// ─── Page layout shell ────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-300/15 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Glass card */}
          <div className="flex flex-col gap-6 rounded-3xl border border-white/70 bg-white/75 p-7 shadow-2xl shadow-blue-200/30 backdrop-blur-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}