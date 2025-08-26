'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { X } from 'lucide-react';

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar automatically when route changes
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <AuthWrapper requiredRole="platform_admin">
      <div className="main-layout">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="sidebar">
            <Sidebar role="platform_admin" />
          </aside>
        )}
        
        {/* Mobile Sidebar Drawer */}
        {isMobile && (
          <>
            {/* Backdrop */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={handleCloseSidebar}
                style={{ touchAction: 'none' }}
              />
            )}
            
            {/* Sidebar */}
            <div 
              className={`fixed inset-y-0 left-0 z-[10000] h-full w-60 bg-sidebar text-sidebar-foreground shadow-2xl transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              style={{ touchAction: 'pan-y' }}
            >
              {/* Close button */}
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={handleCloseSidebar}
                  className="p-2 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors duration-200"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4 text-sidebar-foreground" />
                </button>
              </div>
              
              {/* Sidebar content */}
              <div className="h-full overflow-y-auto">
                <Sidebar role="platform_admin" onClose={handleCloseSidebar} />
              </div>
            </div>
          </>
        )}
        
        <header style={{ gridArea: 'header' }}>
          <Header 
            showSidebarToggle={isMobile} 
            onSidebarToggle={handleSidebarToggle} 
          />
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
}
