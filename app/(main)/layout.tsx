'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isNearby = pathname.startsWith('/nearby');

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7f9]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className={`flex-1 overflow-y-auto ${isNearby ? '' : 'px-4 md:px-8 py-6 pb-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}