'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  {
    group: 'LOGÍSTICA',
    items: [
      { label: 'Live Map', href: '/live-map', icon: '🗺️' },
      { label: 'Flota', href: '/fleet', icon: '🚛' },
      { label: 'Despacho', href: '/dispatch', icon: '🛣️' },
      { label: 'Stock', href: '/stock', icon: '📦' },
    ],
  },
  {
    group: 'EVIDENCIA',
    items: [
      { label: 'Eventos', href: '/events', icon: '⚠' },
    ],
  },
  {
    group: 'CUENTA',
    items: [
      { label: 'Facturación / Plan', href: '/billing', icon: '💳' },
    ],
  },
];

type Tenant = { empresa: string; email: string; plan: 'trial' | 'pro' | 'enterprise' };

const PLAN_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  trial:      { label: 'Trial',      color: '#94A3B8', bg: '#1E293B', border: '#334155' },
  pro:        { label: 'Pro',        color: '#06B6D4', bg: '#0C1A1F', border: '#06B6D433' },
  enterprise: { label: 'Enterprise', color: '#2563EB', bg: '#0C1A35', border: '#2563EB33' },
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [tenant, setTenant] = useState<Tenant>({
    empresa: 'EstaTodo',
    email: 'admin@estatodo.com',
    plan: 'trial',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('estatodo_tenant');
      if (stored) setTenant(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const badge = PLAN_BADGE[tenant.plan] ?? PLAN_BADGE.trial;
  const W = collapsed ? 56 : 220;

  return (
    <div style={{
      width: W, minWidth: W, height: '100vh',
      background: 'rgba(10,15,30,0.98)', borderRight: '0.5px solid #0f2040',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* Logo + toggle button */}
      <div style={{ padding: collapsed ? '16px 0' : '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/logo-estatodo.png" alt="EstaTodo Logo" width={32} height={32} style={{ objectFit: 'contain', borderRadius: '4px' }} />
            <div>
              <div style={{ fontSize: 18, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Esta</span>
                <span style={{ color: 'var(--brand-blue)', fontWeight: 700 }}>Todo</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, letterSpacing: '0.05em' }}>
                Plataforma logística
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748B', fontSize: 16, padding: 4, borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F1F5F9'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '4px 0' : '4px 8px' }}>
        {NAV.map((group) => (
          <div key={group.group} style={{ marginBottom: collapsed ? 8 : 20 }}>
            {/* Group label — hidden when collapsed */}
            {!collapsed && (
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                color: 'var(--text-muted)', padding: '0 8px', marginBottom: 4,
              }}>
                {group.group}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? 0 : 10,
                    padding: collapsed ? '9px 0' : '7px 10px',
                    borderRadius: collapsed ? 0 : 6,
                    fontSize: 13, textDecoration: 'none', marginBottom: 1,
                    background: active ? '#2563EB20' : 'transparent',
                    color: active ? 'var(--brand-blue)' : 'var(--text-secondary)',
                    borderLeft: active ? '2px solid var(--brand-blue)' : '2px solid transparent',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <span style={{ fontSize: collapsed ? 17 : 13, opacity: active ? 1 : 0.7, flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Tenant card — hidden when collapsed */}
      {!collapsed && (
        <div style={{ padding: '8px 8px 14px' }}>
          <div style={{
            background: 'var(--bg-elevated)', border: '0.5px solid var(--border)',
            borderRadius: 8, padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120,
              }}>
                {tenant.empresa}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
                letterSpacing: '0.04em', whiteSpace: 'nowrap',
              }}>
                {badge.label}
              </span>
            </div>
            <div style={{
              fontSize: 10, color: 'var(--text-muted)', marginBottom: 8,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {tenant.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--success)' }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--success)', display: 'inline-block',
                boxShadow: '0 0 6px #10b981',
              }} />
              L1 activa · 3 cámaras
            </div>
          </div>
        </div>
      )}

      {/* Collapsed status dot */}
      {collapsed && (
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
          <span
            title="L1 activa"
            style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}
          />
        </div>
      )}

    </div>
  );
}
