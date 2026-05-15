import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { AuthModalProvider } from '@/components/AuthModal';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EtkinRota",
  description: "Şehrindeki en iyi etkinlikleri keşfet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-slate-900 bg-slate-50">
        <AuthModalProvider>
          {children}
          <Toaster position="top-center" richColors />
        </AuthModalProvider>
      </body>
    </html>
  );
}