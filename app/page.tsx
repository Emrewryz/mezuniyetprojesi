'use client';

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Basit Header */}
      <header className="absolute top-0 w-full px-6 py-6 md:px-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            ETKİNLİK <span className="text-blue-600">HUB</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
            Giriş Yap
          </Link>
          <Link href="/register" className="text-sm font-bold bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Kayıt Ol
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
        {/* Arka Plan Efektleri */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-6 border border-blue-100 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Şehrin Nabzını Tut
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            En İyi Etkinlikleri <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Keşfet & Katıl
            </span>
          </h1>
          
          <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Konserler, teknoloji zirveleri, sanat sergileri ve daha fazlası. İlgi alanlarına göre özelleştirilmiş etkinlikleri bul ve topluluğa katıl.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-200 transition-all duration-300">
              Hemen Başla
              <ArrowRight size={18} />
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full font-bold hover:bg-slate-50 transition-all">
              Etkinliklere Göz At
            </Link>
          </div>
        </div>

        {/* Özellikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-20 relative z-10">
          {[
            { icon: MapPin, title: "Yakınındaki Etkinlikler", desc: "Konumuna en yakın sosyal ağları bul." },
            { icon: CalendarDays, title: "Dinamik Takvim", desc: "Planlarını kolayca organize et." },
            { icon: Zap, title: "Trendler & Canlı Akış", desc: "Toplulukta neler oluyor anında gör." },
          ].map((feature, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm border border-slate-200/60 p-6 rounded-3xl text-left shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <feature.icon size={20} />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}