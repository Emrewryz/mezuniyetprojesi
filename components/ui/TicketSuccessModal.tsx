'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Clock, Globe, X, Navigation,
  QrCode, CheckCircle2,
} from 'lucide-react';

interface TicketEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  location: string;
  is_online: boolean;
  cover_image_url?: string | null;
  category?: string;
  ticket_id?: string;
}

interface TicketSuccessModalProps {
  isOpen: boolean;
  event: TicketEvent;
  onClose: () => void;
}

const MESH: Record<string, string> = {
  music:    'linear-gradient(135deg,#1e1b4b,#be185d)',
  tech:     'linear-gradient(135deg,#0f172a,#1d4ed8)',
  art:      'linear-gradient(135deg,#1a0533,#7c3aed)',
  business: 'linear-gradient(135deg,#1c0a00,#d97706)',
  social:   'linear-gradient(135deg,#022c22,#059669)',
  sport:    'linear-gradient(135deg,#1c0a00,#ea580c)',
  game:     'linear-gradient(135deg,#0f0c29,#4338ca)',
};

function QRPattern() {
  const pattern = [
    [1,1,1,1,1,1,1, 0, 1,0,1,0,1, 0, 1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1, 0, 0,1,0,1,0, 0, 1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1, 0, 1,0,1,0,1, 0, 1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1, 0, 0,1,0,1,0, 0, 1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1, 0, 1,0,1,0,1, 0, 1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1, 0, 0,1,0,1,0, 0, 1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1, 0, 1,0,1,0,1, 0, 1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0, 0, 0,1,0,1,0, 0, 0,0,0,0,0,0,0],
    [1,0,1,1,0,1,0, 1, 0,1,1,0,1, 1, 0,1,0,1,1,0,1],
    [0,1,0,1,1,0,1, 0, 1,0,0,1,0, 0, 1,0,1,0,0,1,0],
    [1,0,1,0,1,0,1, 1, 0,1,0,1,1, 0, 1,1,0,1,0,1,1],
    [0,1,0,1,0,1,0, 0, 1,0,1,0,0, 1, 0,0,1,0,1,0,0],
    [1,0,1,0,1,0,1, 1, 0,1,1,0,1, 0, 1,0,1,1,0,1,0],
    [0,0,0,0,0,0,0, 0, 1,0,0,1,0, 0, 0,1,0,0,1,0,1],
    [1,1,1,1,1,1,1, 0, 0,1,0,1,1, 0, 0,1,0,1,1,0,1],
    [1,0,0,0,0,0,1, 0, 1,0,1,0,0, 1, 0,0,1,0,0,1,0],
    [1,0,1,1,1,0,1, 0, 0,1,0,1,0, 0, 1,0,1,0,1,0,1],
    [1,0,1,1,1,0,1, 0, 1,0,1,0,1, 0, 0,1,0,1,0,1,0],
    [1,0,0,0,0,0,1, 0, 0,1,0,1,0, 1, 1,0,1,0,1,0,1],
    [1,1,1,1,1,1,1, 0, 1,0,1,0,1, 0, 0,1,0,0,1,0,0],
    [0,0,0,0,0,0,0, 0, 0,0,0,0,0, 0, 0,0,0,0,0,0,0],
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(21, 1fr)`, gap: 1.5, padding: 4 }}>
      {pattern.flat().map((cell, i) => (
        <div
          key={i}
          style={{
            width: 8, height: 8,
            background: cell ? '#0f172a' : 'transparent',
            borderRadius: cell ? 1.5 : 0,
          }}
        />
      ))}
    </div>
  );
}
  


export default function TicketSuccessModal({ isOpen, event, onClose }: TicketSuccessModalProps) {
  const fmtDate = new Date(event.start_at).toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const fmtStartTime = new Date(event.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const fmtEndTime   = new Date(event.end_at).toLocaleTimeString('tr-TR',   { hour: '2-digit', minute: '2-digit' });
  const ticketId = event.ticket_id || `ER-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const mapsUrl  = event.is_online ? null : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
  const bgMesh   = MESH[event.category || ''] || 'linear-gradient(135deg,#0f172a,#1e293b)';

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          // 1. DEĞİŞİKLİK: overflow-y-auto eklendi, items-end yerine min-h-full yapıldı
          className="fixed inset-0 z-[9999] overflow-y-auto p-4 sm:p-6"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          {/* Scroll edilebilen alanın içindeki merkezleyici kapsayıcı */}
          <div className="min-h-full flex flex-col items-center justify-center py-10 relative">
            
            {/* Close pill */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              onClick={onClose}
              className="absolute top-0 right-0 sm:fixed sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <X size={16} />
            </motion.button>

            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 60, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              // 2. DEĞİŞİKLİK: gap-3 yapıldı ve shrink-0 eklendi (sıkışmayı önler)
              className="w-full max-w-sm flex flex-col items-center gap-3 shrink-0"
            >

              {/* ── Success badge ── */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.15 }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30 shrink-0"
              >
                <CheckCircle2 size={14} className="text-white" />
                <span className="text-xs font-black text-white uppercase tracking-wide">Kayıt Onaylandı</span>
              </motion.div>

              {/* ── Ticket card ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="w-full bg-white rounded-[32px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.35)] shrink-0"
              >

                {/* Header cover - 3. DEĞİŞİKLİK: h-36'dan h-28'e düşürüldü daha kompakt oldu */}
                <div className="relative h-28 overflow-hidden">
                  {event.cover_image_url ? (
                    <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0" style={{ background: bgMesh }} />
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Title area */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">
                      Etkinliğe Kaydın Onaylandı 🎉
                    </p>
                    <h2 className="text-base font-black text-white leading-snug line-clamp-2 tracking-tight">
                      {event.title}
                    </h2>
                  </div>
                </div>

                {/* Details */}
                <div className="px-5 pt-4 pb-3 flex flex-col gap-3">
                  {[
                    { Icon: Calendar, label: 'Tarih',  value: fmtDate },
                    { Icon: Clock,    label: 'Saat',   value: `${fmtStartTime} – ${fmtEndTime}` },
                    {
                      Icon: event.is_online ? Globe : MapPin,
                      label: event.is_online ? 'Yer' : 'Konum',
                      value: event.is_online ? 'Online Etkinlik' : event.location,
                    },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={14} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
                        <p className="text-xs font-semibold text-slate-800 leading-snug">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ticket stub separator */}
                <div className="relative mx-0 flex items-center py-1">
                  <div className="absolute -left-3 w-6 h-6 rounded-full bg-slate-900/60 shrink-0" style={{ backdropFilter: 'blur(4px)' }} />
                  <div className="flex-1 mx-3 border-t-2 border-dashed border-slate-200" />
                  <div className="absolute -right-3 w-6 h-6 rounded-full bg-slate-900/60" style={{ backdropFilter: 'blur(4px)' }} />
                </div>

                {/* QR section */}
                <div className="px-5 pt-3 pb-5 flex flex-col items-center gap-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Giriş QR Kodu</p>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/5 blur-lg" />
                    <div className="relative bg-white border border-slate-100 rounded-2xl p-2 shadow-sm">
                      <QRPattern />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bilet No</p>
                    <p className="text-sm font-black text-slate-900 tracking-widest"># {ticketId}</p>
                  </div>
                </div>
              </motion.div>

              {/* ── Action buttons ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.4 }}
                // 4. DEĞİŞİKLİK: shrink-0 eklendi, artık asla ezilmeyecek
                className="w-full flex gap-3 shrink-0"
              >
                <Link
                  href="/calendar"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-slate-700 bg-white/90 border border-white/60 hover:bg-white hover:shadow-md transition-all backdrop-blur-sm shadow-sm"
                >
                  <Calendar size={13} className="text-blue-500" />
                  Takvimde Gör
                </Link>

                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-slate-700 bg-white/90 border border-white/60 hover:bg-white hover:shadow-md transition-all backdrop-blur-sm shadow-sm"
                  >
                    <Navigation size={13} className="text-blue-500" />
                    Yol Tarifi
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-slate-400 bg-white/40 border border-white/30 cursor-not-allowed backdrop-blur-sm">
                    <Globe size={13} />
                    Online Etkinlik
                  </div>
                )}
              </motion.div>

              {/* ── Close / Back ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.5 }}
                // 5. DEĞİŞİKLİK: shrink-0 eklendi
                className="flex gap-3 shrink-0 pt-2"
              >
                <Link
                  href={`/event-detail/${event.id}`}
                  className="text-xs font-semibold text-white/70 hover:text-white transition-colors px-4 py-2"
                  onClick={onClose}
                >
                  Etkinliğe Dön →
                </Link>
                <button
                  onClick={onClose}
                  className="text-xs font-semibold text-white/50 hover:text-white/80 transition-colors px-4 py-2"
                >
                  Kapat
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}