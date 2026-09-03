'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Zap, ArrowRight, MapPin, Clock, Users, Globe,
  Music2, Cpu, Palette, Star, ChevronRight, Ticket,
} from 'lucide-react';

// ─── Mock card data ───────────────────────────────────────────────────────────

const FLOAT_CARDS = [
  {
    id: 1,
    title: 'Frontend Summit 2025',
    category: 'Teknoloji',
    icon: Cpu,
    date: '14 Haz · 19:00',
    location: 'Antalya, TR',
    attendees: 284,
    price: '₺120',
    accent: 'from-blue-500 to-cyan-400',
    mesh: 'radial-gradient(ellipse at 20% 50%,#3b82f620 0%,transparent 60%),linear-gradient(135deg,#0f172a,#1e3a5f)',
    delay: 0,
  },
  {
    id: 2,
    title: 'Caz & Akustik Geceleri',
    category: 'Müzik',
    icon: Music2,
    date: '21 Haz · 21:00',
    location: 'İstanbul, TR',
    attendees: 512,
    price: 'Ücretsiz',
    accent: 'from-pink-500 to-rose-400',
    mesh: 'radial-gradient(ellipse at 20% 50%,#f43f5e20 0%,transparent 60%),linear-gradient(135deg,#1e1b4b,#312e81)',
    delay: 0.15,
  },
  {
    id: 3,
    title: 'Dijital Sanat Atölyesi',
    category: 'Sanat',
    icon: Palette,
    date: '28 Haz · 14:00',
    location: 'Ankara, TR',
    attendees: 96,
    price: '₺60',
    accent: 'from-violet-500 to-purple-400',
    mesh: 'radial-gradient(ellipse at 20% 50%,#8b5cf620 0%,transparent 60%),linear-gradient(135deg,#1a0533,#2d1b69)',
    delay: 0.3,
  },
];

const FEATURES = [
  {
    title: 'Kişiselleştirilmiş Keşif',
    desc: 'Şehrin ve ilgi alanlarına göre sıralanmış etkinlikler. Sana uygun ne varsa öne çıkar.',
    icon: Star,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: 'Gerçek Zamanlı Trendler',
    desc: 'Hızla tükenen biletleri, popüler toplulukları ve yükselen etkinlikleri anlık görün.',
    icon: Zap,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
  {
    title: 'Topluluklar & Ağ',
    desc: 'İlgi alanına göre topluluklar kur veya katıl. Etkinlik organizatörü olarak öne çık.',
    icon: Users,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    title: 'Takvim & Hatırlatıcı',
    desc: 'Tüm etkinliklerini tek takviminle yönet. Kaçırma, geç kalma, unutma.',
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
];

const STATS = [
  { value: '12K+', label: 'Aktif Kullanıcı' },
  { value: '3.4K+', label: 'Etkinlik' },
  { value: '81', label: 'Şehir' },
  { value: '98%', label: 'Memnuniyet' },
];

// ─── Float Card ───────────────────────────────────────────────────────────────

function FloatCard({ card, style }: { card: typeof FLOAT_CARDS[0]; style: React.CSSProperties }) {
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: card.delay + 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={style}
      className="absolute w-56 sm:w-64 select-none"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5 + card.delay * 2, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
        className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.6)] overflow-hidden"
      >
        {/* Cover strip */}
        <div className="h-16 relative overflow-hidden" style={{ background: card.mesh }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-white bg-gradient-to-r ${card.accent}`}>
              <Icon size={8} /> {card.category}
            </span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-xs font-black text-slate-900 line-clamp-1 mb-2">{card.title}</p>
          <div className="flex flex-col gap-1 mb-2.5">
            <p className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={9} />{card.date}</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin size={9} />{card.location}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400 flex items-center gap-1"><Users size={9} />{card.attendees}</p>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${card.price === 'Ücretsiz' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
              {card.price}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard');
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50">
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900">Etkinlik Hub</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Link href="/login"
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Giriş Yap
            </Link>
            <Link href="/register"
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-blue-600 transition-all shadow-sm">
              Kayıt Ol
            </Link>
          </motion.div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-32 px-5 overflow-hidden"
      >
        {/* BG blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-sky-200/40 rounded-full blur-[60px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-100/50 rounded-full blur-[80px]" />
          {/* Subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-4 py-1.5 bg-white border border-blue-100 rounded-full shadow-sm mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Türkiye'nin Etkinlik Platformu</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-6"
          >
            Şehrindeki
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600">
              Her Anı
            </span>
            <br />
            Yaşa.
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-slate-500 max-w-lg leading-relaxed mb-10"
          >
            Konserler, zirveler, atölyeler ve topluluklar — ilgi alanlarına göre kişiselleştirilmiş etkinlikleri keşfet, katıl, oluştur.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <Link href="/register"
              className="group relative flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-bold text-white overflow-hidden shadow-[0_4px_24px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_32px_rgba(37,99,235,0.5)] transition-all duration-300"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              Toplulukları Keşfet
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/dashboard"
              className="flex items-center gap-2 px-7 py-4 rounded-full text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              Etkinliklere Göz At
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center gap-6 mt-14 pt-10 border-t border-slate-200/60"
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-black text-slate-900">{s.value}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating cards */}
        <FloatCard card={FLOAT_CARDS[0]} style={{ top: '18%', left: '3%', zIndex: 20 }} />
        <FloatCard card={FLOAT_CARDS[1]} style={{ top: '22%', right: '2%', zIndex: 20 }} />
        <FloatCard card={FLOAT_CARDS[2]} style={{ bottom: '10%', left: '5%', zIndex: 20 }} />
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-6xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-3">Neden Etkinlik Hub?</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Etkinlik deneyimini<br />yeniden tanımlıyoruz
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6 flex gap-4 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-2xl ${f.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={18} className={f.color} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1.5">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-4xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-3">Nasıl Çalışır?</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              3 adımda<br />toplulukla buluş
            </h2>
          </motion.div>

          <div className="flex flex-col gap-4">
            {[
              { step: '01', title: 'Hesabını Oluştur', desc: 'Şehrini ve ilgi alanlarını seç. 30 saniyede profilini tamamla.' },
              { step: '02', title: 'Etkinlik Keşfet', desc: 'Sana özel sıralanmış etkinlikler, topluluklar ve trendler seni bekliyor.' },
              { step: '03', title: 'Katıl & Bağlan', desc: 'Etkinliklere kaydol, topluluk kur, kendi etkinliğini oluştur.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-start gap-6 p-6 rounded-3xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all"
              >
                <span className="text-4xl font-black text-slate-100 shrink-0 leading-none mt-0.5">{item.step}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-[32px] bg-slate-900 p-12 md:p-16 text-center"
          >
            {/* BG effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/20 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-sky-500/10 rounded-full blur-[60px]" />
            </div>

            <div className="relative z-10">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-4">Seni Bekliyoruz</p>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-6">
                Şehrindeki bir sonraki<br />etkinliğe hazır mısın?
              </h2>
              <p className="text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
                Binlerce kullanıcı zaten topluluk içinde. Sen de katıl, etkinlik oluştur, bağlan.
              </p>
              <Link href="/register"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-bold text-slate-900 bg-white hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
              >
                Hemen Ücretsiz Kaydol
                <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-sm">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm font-black text-slate-700">Etkinlik Hub</span>
          </div>
          <p className="text-xs text-slate-400">© 2025 Etkinlik Hub. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-5">
            {['Gizlilik', 'Kullanım Koşulları', 'İletişim'].map((l) => (
              <span key={l} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}