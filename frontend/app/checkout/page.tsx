'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function CheckoutContent() {
  const params = useSearchParams()
  const router = useRouter()
  const plan = params.get('plan') || 'pro'
  const [loading, setLoading] = useState(false)
  const [mpUrl, setMpUrl] = useState<string | null>(null)

  const PLANES: Record<string, any> = {
    starter: { nombre: 'Starter', precio: 299, features: ['3 cámaras', 'Detección básica', 'Avalanche L1', '30 días historial'] },
    pro: { nombre: 'Pro', precio: 799, features: ['10 cámaras', 'Detección avanzada', 'Genlayer ilimitado', 'IPFS incluido', 'Soporte 24/7'] },
    enterprise: { nombre: 'Enterprise', precio: 1999, features: ['Ilimitado', 'L1 privada', 'API completa', 'SLA garantizado'] },
  }

  const planInfo = PLANES[plan] || PLANES.pro
  
  const [tenant, setTenant] = useState<any>({});
  useEffect(() => {
    setTenant(JSON.parse(localStorage.getItem('estatodo_tenant') || '{}'));
  }, []);

  const handlePay = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://5695-200-80-213-210.ngrok-free.app'}/api/payments/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          email: tenant.email || 'demo@estatodo.com',
          empresa: tenant.empresa || 'EstaTodo',
        })
      })
      const data = await res.json()
      if (data.subscription_id) {
        localStorage.setItem('estatodo_subscription_id', data.subscription_id);
      }
      window.location.href = data.init_point
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080e1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        maxWidth: '900px',
        width: '100%'
      }}>
        
        {/* IZQUIERDA — Resumen */}
        <div style={{
          background: '#0d1829',
          border: '0.5px solid #1e3a5f',
          borderRadius: '16px',
          padding: '40px 32px',
        }}>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#F1F5F9', marginBottom: '4px' }}>
            Esta<span style={{ color: '#2563EB' }}>Todo</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '32px' }}>
            {tenant.empresa || 'Esta Todo'} · Auditoría Antifraude
          </div>
          
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>
            Plan seleccionado
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#F1F5F9' }}>
            {planInfo.nombre}
          </div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: '#2563EB', margin: '8px 0' }}>
            ${planInfo.precio} <span style={{ fontSize: '14px', color: '#64748B' }}>USD/mes</span>
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginBottom: '24px' }}>
            ✓ Primer mes gratis
          </div>
          
          <div style={{ borderTop: '0.5px solid #1e3a5f', paddingTop: '20px' }}>
            {planInfo.features.map((f: string) => (
              <div key={f} style={{ 
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '13px', color: '#94A3B8', marginBottom: '10px'
              }}>
                <span style={{ color: '#06B6D4' }}>✓</span> {f}
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '24px',
            background: '#0c1a35',
            border: '0.5px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '11px',
            color: '#06B6D4',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔒 Pago procesado por Mercado Pago
            <br/>
            <span style={{ color: '#64748B' }}>Encriptación 256-bit · PCI DSS</span>
          </div>
        </div>

        {/* DERECHA — Botón de pago */}
        <div style={{
          background: '#0F172A',
          border: '0.5px solid #334155',
          borderRadius: '16px',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '24px'
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#F1F5F9', marginBottom: '8px' }}>
              Completar pago
            </div>
            <div style={{ fontSize: '13px', color: '#64748B' }}>
              Serás redirigido a Mercado Pago para completar el pago de forma segura.
            </div>
          </div>

          {/* Métodos de pago */}
          <div style={{
            background: '#1E293B',
            border: '0.5px solid #334155',
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Métodos aceptados
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['💳 Tarjeta crédito', '🏦 Tarjeta débito', '💙 Mercado Pago', '🏪 Rapipago', '💵 Pago Fácil'].map(m => (
                <span key={m} style={{
                  background: '#0F172A',
                  border: '0.5px solid #334155',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  color: '#94A3B8'
                }}>{m}</span>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div style={{
            background: '#1E293B',
            border: '0.5px solid #334155',
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Plan {planInfo.nombre}</span>
              <span style={{ fontSize: '13px', color: '#F1F5F9' }}>${planInfo.precio} USD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Primer mes</span>
              <span style={{ fontSize: '13px', color: '#10B981' }}>GRATIS</span>
            </div>
            <div style={{ borderTop: '0.5px solid #334155', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#F1F5F9' }}>Total hoy</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#10B981' }}>$0 USD</span>
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              background: loading ? '#1D4ED8' : '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '16px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Conectando con Mercado Pago...' : 'Pagar con Mercado Pago →'}
          </button>

          <div style={{ fontSize: '11px', color: '#475569', textAlign: 'center' }}>
            Al continuar aceptás los Términos de Servicio.
            Esta Todo nunca almacena datos de pago.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080e1a' }}></div>}>
      <CheckoutContent />
    </Suspense>
  )
}
