import React from 'react';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="main-layout">
      <aside className="sidebar">
        <Sidebar role="marketing" />
      </aside>
      <header style={{ gridArea: 'header' }}>
        <Header />
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}