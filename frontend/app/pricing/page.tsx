'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const FAQS = [
  {
    q: '¿Necesito comprar cámaras nuevas?',
    a: 'No necesariamente. SafeGuard es compatible con cámaras IP existentes vía RTSP/ONVIF. Para nuevas instalaciones recomendamos la RPi Camera Module 3 Wide con cable flat directo a la Raspberry Pi (12MP, 120° gran angular).',
  },
  {
    q: '¿Qué pasa si la IA detecta un falso positivo?',
    a: 'Cada alerta puede analizarse con Claude Vision, que revisa los frames del video y emite un veredicto (CONFIRMADO / FALSA_ALARMA / REQUIERE_REVISIÓN). La evidencia original siempre queda sellada en blockchain.',
  },
  {
    q: '¿Mis videos se suben a internet?',
    a: 'Los videos se suben a IPFS (red descentralizada) para garantizar la trazabilidad. Solo el hash SHA-256 se registra en la blockchain de Avalanche. El acceso al video requiere el CID de IPFS.',
  },
  {
    q: '¿Cómo se paga? ¿en dólares o cripto?',
    a: 'Totalmente en pesos argentinos (ARS) vía Mercado Pago. Sin conversiones, sin billeteras cripto, sin complicaciones. Tarjeta, transferencia o efectivo.',
  },
];

const COMPARATIVE = [
  { feature: 'Cámaras', demo: '1 prueba', pyme: '5', pro: '20', enterprise: 'Ilimitadas' },
  { feature: 'Avalanche L1', demo: 'Testnet', pyme: '✓', pro: '✓', enterprise: 'Nodo propio' },
  { feature: 'IPFS (video)', demo: '✓', pyme: '✓', pro: '✓', enterprise: '✓' },
  { feature: 'Análisis Claude IA', demo: '1 sim', pyme: '3/mes', pro: '20/mes', enterprise: 'Ilimitado' },
  { feature: 'Retención datos', demo: '7 días', pyme: '30 días', pro: '90 días', enterprise: '1 año' },
  { feature: 'Live Map', demo: '✓', pyme: '✓', pro: '✓', enterprise: '✓' },
  { feature: 'Módulo logístico', demo: '✗', pyme: '✗', pro: '✓', enterprise: '✓' },
  { feature: 'API propia', demo: '✗', pyme: '✗', pro: '✗', enterprise: '✓' },
  { feature: 'IA a medida', demo: '✗', pyme: '✗', pro: '✗', enterprise: '✓' },
  { feature: 'Soporte', demo: '—', pyme: 'Email', pro: 'Prioritario', enterprise: 'Dedicado' },
];

export default function PricingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const checkStyle = { color: '#10B981', fontWeight: 600 };
  const crossStyle = { color: '#EF444460' };

  return (
    <div style={{
      backgroundImage: `
        linear-gradient(
          to bottom,
          rgba(8,14,26,0.92) 0%,
          rgba(8,14,26,0.88) 50%,
          rgba(8,14,26,0.96) 100%
        ),
        url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      padding: '60px 40px',
      color: '#F1F5F9',
      fontFamily: 'var(--font-inter), system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontSize: 36,
            fontWeight: 700,
            color: '#F1F5F9',
            fontFamily: 'var(--font-space), system-ui, sans-serif',
            margin: '0 0 12px 0'
          }}>
            Elegí tu plan
          </h1>
          <p style={{
            fontSize: 14,
            color: '#64748B',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Desde $0 hasta soluciones enterprise a medida.<br/>
            Todos los planes incluyen evidencia blockchain inmutable.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          alignItems: 'stretch',
        }}>
          
          {/* CARD 1 — DEMO */}
          <div style={{
            background: '#1E293B',
            border: '0.5px solid #334155',
            borderRadius: 16,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 620,
          }}>
            <div>
              <span style={{
                background: '#052e16',
                color: '#10B981',
                fontSize: 10,
                padding: '3px 10px',
                borderRadius: 20,
                textAlign: 'center',
                display: 'inline-block',
                marginBottom: 16,
                fontWeight: 600,
              }}>GRATIS PARA SIEMPRE</span>
              
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: '0 0 8px 0', fontFamily: 'var(--font-space), system-ui' }}>Demo</h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Probá la tecnología sin riesgos.<br/>Conectá una cámara y vé cómo funciona en vivo.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: '#F1F5F9', lineHeight: 1 }}>$0</span>
                <span style={{ fontSize: 14, color: '#64748B', marginLeft: 4 }}>/mes</span>
              </div>
              
              <div style={{ borderBottom: '0.5px solid #334155', margin: '16px 0' }}></div>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                '1 cámara de prueba',
                '100 registros en Avalanche Testnet',
                '1 análisis Claude Vision de muestra',
                'Live Map con datos de prueba',
                'Sin tarjeta de crédito'
              ].map(f => (
                <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#94A3B8' }}>
                  <span style={{ color: '#10B981', flexShrink: 0 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}

              <div style={{
                background: '#0F172A',
                borderRadius: 6,
                padding: '10px 12px',
                marginTop: 12,
              }}>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>💰 Generá confianza antes de vender</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.4 }}>1 de cada 10 demos se convierte en cliente Pro. ROI enorme.</div>
              </div>
            </div>

            <button
              onClick={() => router.push('/register')}
              style={{
                marginTop: 'auto',
                background: 'transparent',
                border: '1px solid #334155',
                color: '#F1F5F9',
                width: '100%',
                padding: 12,
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.color = '#10B981'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#F1F5F9'; }}
            >
              Empezar gratis →
            </button>
          </div>

          {/* CARD 2 — PYME */}
          <div style={{
            background: '#1E293B',
            border: '0.5px solid #334155',
            borderRadius: 16,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 620,
          }}>
            <div>
              <span style={{
                background: '#0c1a35',
                color: '#2563EB',
                fontSize: 10,
                padding: '3px 10px',
                borderRadius: 20,
                textAlign: 'center',
                display: 'inline-block',
                marginBottom: 16,
                fontWeight: 600,
              }}>IDEAL PARA PYMES</span>
              
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: '0 0 8px 0', fontFamily: 'var(--font-space), system-ui' }}>PyME</h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Para flotas de 1 a 5 camiones<br/>que quieren eliminar el robo interno.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#F1F5F9', lineHeight: 1 }}>$49.900</span>
                <span style={{ fontSize: 14, color: '#64748B', marginLeft: 4 }}>ARS/mes</span>
              </div>
              
              <div style={{ borderBottom: '0.5px solid #334155', margin: '16px 0' }}></div>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Hasta 5 cámaras con Edge AI',
                'Sellado inmutable ilimitado en Avalanche L1',
                'Video sellado en IPFS automáticamente',
                '3 análisis Claude Vision por mes',
                'Retención de datos 30 días',
                'Soporte por email'
              ].map(f => (
                <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#94A3B8' }}>
                  <span style={{ color: '#10B981', flexShrink: 0 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}

              <div style={{
                background: '#0F172A',
                borderRadius: 6,
                padding: '10px 12px',
                marginTop: 12,
              }}>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>💰 Tu margen como cliente</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.4 }}>Si evitás 1 robo al mes, el plan se paga 10x solo.</div>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout?plan=pyme&precio=49900')}
              style={{
                marginTop: 'auto',
                background: '#2563EB',
                color: '#fff',
                width: '100%',
                padding: 12,
                borderRadius: 8,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
            >
              Contratar plan →
            </button>
          </div>

          {/* CARD 3 — PRO */}
          <div style={{
            background: '#1E293B',
            border: '2px solid #2563EB',
            borderRadius: 16,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 0 30px #2563EB20',
            height: '100%',
            minHeight: 620,
          }}>
            <div style={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#2563EB',
              color: 'white',
              padding: '4px 16px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              MÁS POPULAR
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: '0 0 8px 0', fontFamily: 'var(--font-space), system-ui' }}>Pro</h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Para flotas de 10 a 20 camiones.<br/>La solución más completa para medianas empresas.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#2563EB', lineHeight: 1 }}>$99.900</span>
                <span style={{ fontSize: 14, color: '#64748B', marginLeft: 4 }}>ARS/mes</span>
              </div>
              
              <div style={{ borderBottom: '0.5px solid #334155', margin: '16px 0' }}></div>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Hasta 20 cámaras con Edge AI',
                'Sellado L1 ilimitado',
                'Módulo logístico completo (remitos + stock)',
                '20 análisis Claude Vision por mes',
                'Retención 90 días',
                '3 usuarios administradores',
                'Soporte prioritario'
              ].map(f => (
                <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#94A3B8' }}>
                  <span style={{ color: '#10B981', flexShrink: 0 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}

              <div style={{
                background: '#0F172A',
                borderRadius: 6,
                padding: '10px 12px',
                marginTop: 12,
              }}>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>💰 ROI estimado</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.4 }}>Con 20 camiones y 1 robo evitado por semana: +$2.000 USD/mes protegidos.</div>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout?plan=pro&precio=99900')}
              style={{
                marginTop: 'auto',
                background: '#2563EB',
                color: 'white',
                width: '100%',
                padding: 14,
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
            >
              Contratar plan →
            </button>
          </div>

          {/* CARD 4 — ENTERPRISE */}
          <div style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0d1829 100%)',
            border: '0.5px solid #06B6D433',
            borderRadius: 16,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 620,
          }}>
            <div>
              <span style={{
                background: '#0c1a35',
                color: '#06B6D4',
                fontSize: 10,
                padding: '3px 10px',
                borderRadius: 20,
                textAlign: 'center',
                display: 'inline-block',
                marginBottom: 16,
                fontWeight: 600,
              }}>GRANDES FLOTAS</span>
              
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: '0 0 8px 0', fontFamily: 'var(--font-space), system-ui' }}>Enterprise</h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Solución corporativa a medida.<br/>Para empresas que mueven millones y necesitan trazabilidad total.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: '#06B6D4', lineHeight: 1 }}>Desde $299.900</span>
                <span style={{ fontSize: 14, color: '#64748B', marginLeft: 4 }}>ARS/mes</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>· Precio a negociar</div>
              
              <div style={{ borderBottom: '0.5px solid #334155', margin: '16px 0' }}></div>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Cámaras ilimitadas',
                'Nodo Avalanche validador propio',
                'IA entrenada a medida de tu operación',
                'Integración API con SAP / Tango',
                'Análisis Claude Vision ilimitado',
                'SLA garantizado',
                'Gerente de cuenta dedicado'
              ].map(f => (
                <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#94A3B8' }}>
                  <span style={{ color: '#10B981', flexShrink: 0 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}

              <div style={{
                background: '#0F172A',
                borderRadius: 6,
                padding: '10px 12px',
                marginTop: 12,
              }}>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>🏢 Para empresas que mueven +$1M/mes</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.4 }}>Una sola carga recuperada ya cubre 2 años del plan.</div>
              </div>
            </div>

            <button
              onClick={() => window.location.href = 'mailto:ventas@estatodo.com'}
              style={{
                marginTop: 'auto',
                background: 'transparent',
                border: '1.5px solid #06B6D4',
                color: '#06B6D4',
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#06B6D4'; e.currentTarget.style.color = '#0F172A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#06B6D4'; }}
            >
              Hablar con ventas →
            </button>
          </div>

        </div>

        {/* TABLA COMPARATIVA */}
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', textAlign: 'center', marginBottom: 24, fontFamily: 'var(--font-space), system-ui' }}>
            ¿Qué incluye cada plan?
          </h2>
          <div style={{
            background: '#1E293B',
            borderRadius: 12,
            overflow: 'hidden',
            border: '0.5px solid #334155',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', background: '#0F172A', padding: '12px 20px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
              <div>FEATURE</div>
              <div>DEMO</div>
              <div>PYME</div>
              <div>PRO</div>
              <div>ENTERPRISE</div>
            </div>
            {COMPARATIVE.map((row, idx) => (
              <div key={row.feature} style={{
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
                padding: '12px 20px',
                borderBottom: idx < COMPARATIVE.length - 1 ? '0.5px solid #33415540' : 'none',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.3)',
                fontSize: 13, color: '#94A3B8',
              }}>
                <div style={{ fontWeight: 600, color: '#CBD5E1' }}>{row.feature}</div>
                <div style={row.demo === '✓' ? checkStyle : (row.demo === '✗' ? crossStyle : {})}>{row.demo}</div>
                <div style={row.pyme === '✓' ? checkStyle : (row.pyme === '✗' ? crossStyle : {})}>{row.pyme}</div>
                <div style={row.pro === '✓' ? checkStyle : (row.pro === '✗' ? crossStyle : {})}>{row.pro}</div>
                <div style={row.enterprise === '✓' ? checkStyle : (row.enterprise === '✗' ? crossStyle : {})}>{row.enterprise}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ COLAPSABLE */}
        <div style={{ marginTop: 48, maxWidth: 800, margin: '48px auto 0' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', textAlign: 'center', marginBottom: 20, fontFamily: 'var(--font-space), system-ui' }}>
            Preguntas frecuentes
          </h2>
          <div>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} style={{
                  background: '#1E293B',
                  border: '0.5px solid',
                  borderColor: isOpen ? '#2563EB' : '#334155',
                  borderRadius: 8,
                  padding: '16px 20px',
                  marginBottom: 8,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.borderColor = '#2563EB'; }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.borderColor = '#334155'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{faq.q}</span>
                    <svg 
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', minWidth: 14 }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
