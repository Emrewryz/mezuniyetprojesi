'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { supabase } from '@/lib/supabase';
import ErrorBoundary from '@/components/ErrorBoundary';


export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isNearby = pathname.startsWith('/nearby');

  useEffect(() => {
    // Onboarding kontrolü — city ve preferences boşsa yönlendir
    // Sadece dashboard'da çalıştır, diğer sayfalarda döngü oluşmasın
    if (pathname !== '/dashboard') return;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('city, preferences, onboarding_completed')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Onboarding tamamlanmamış ve city/preferences boşsa yönlendir
      const hasOnboarded = profile.onboarding_completed ||
        (profile.city && profile.preferences?.length > 0);

      if (!hasOnboarded) {
        router.push('/onboarding');
      }
    })();
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7f9]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className={`flex-1 overflow-y-auto ${isNearby ? '' : 'px-4 md:px-8 py-6 pb-8'}`}>
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
</main>
      </div>
    </div>
  );
}