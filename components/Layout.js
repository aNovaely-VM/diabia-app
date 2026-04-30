// DIABIA — Layout principal avec navigation
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV_ITEMS = [
  { href: '/', label: 'Tableau de bord', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/carbs', label: 'Glucides', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/report', label: 'Rapport', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function Layout({ children, title }) {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#08090d' }}>
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,9,13,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1a1f2e',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', color: '#f1f5f9' }}>DIABIA</span>
        </div>
        {title && <span style={{ color: '#64748b', fontSize: 13 }}>{title}</span>}
        <div style={{ width: 28 }} />
      </header>

      {/* Contenu principal */}
      <main style={{ flex: 1, padding: '20px 16px 90px', maxWidth: 520, width: '100%', margin: '0 auto' }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(8,9,13,0.95)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid #1a1f2e',
        display: 'flex', justifyContent: 'space-around',
        padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
      }}>
        {NAV_ITEMS.map((item) => {
          const active = router.pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 20px', borderRadius: 12,
              color: active ? '#60a5fa' : '#4b5563',
              transition: 'color 0.15s',
              minWidth: 80, textAlign: 'center',
            }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.2px' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
