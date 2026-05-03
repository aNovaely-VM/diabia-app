// DIABIA — Layout principal modernisé
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/carbs', label: 'Repas', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/report', label: 'Rapport', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function Layout({ children, title }) {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#08090d' }}>
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,9,13,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1a1f2e',
        padding: '0 20px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
          }}>
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: '#f1f5f9' }}>DIABIA</span>
        </div>
        {title && <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>{title}</span>}
        <div style={{ width: 32 }} />
      </header>

      {/* Contenu principal */}
      <main style={{ flex: 1, padding: '24px 16px 100px', maxWidth: 520, width: '100%', margin: '0 auto' }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(8,9,13,0.9)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid #1a1f2e',
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 0 max(12px, env(safe-area-inset-bottom))',
      }}>
        {NAV_ITEMS.map((item) => {
          const active = router.pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 16,
              color: active ? '#3b82f6' : '#4b5563',
              transition: 'all 0.2s ease',
              minWidth: 80, textAlign: 'center',
              textDecoration: 'none',
            }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
                <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, letterSpacing: '0.2px' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
