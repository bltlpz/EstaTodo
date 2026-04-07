'use client';
import React, { useState, useEffect } from 'react';

export default function BillingPage() {
  const [tenant, setTenant] = useState<any>({});
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('estatodo_tenant');
      if (stored) setTenant(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de que quieres cancelar tu suscripción mensual? Perderás acceso a futuras validaciones y sellado on-chain automático una vez culmine tu ciclo facturado.')) return;
    
    setCanceling(true);
    setMessage('');
    try {
      const storedSubId = localStorage.getItem('estatodo_subscription_id');
      // En un entorno real, `subscription_id` debería venir del backend haciendo GET /api/tenant/:id
      // Aquí estamos simulando u obteniéndolo si lo guardáramos en localStorage al crear la preapproval.
      if (!storedSubId) {
        setMessage('No se encontró una suscripción activa (ID no encontrado). Si estás en un plan Demo, no hay nada que cancelar.');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://5695-200-80-213-210.ngrok-free.app'}/api/payments/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: storedSubId })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage('Suscripción cancelada con éxito. Ya no se te cobrará automáticamente el próximo mes.');
        localStorage.removeItem('estatodo_subscription_id');
        setTenant({ ...tenant, plan: 'trial' });
        localStorage.setItem('estatodo_tenant', JSON.stringify({ ...tenant, plan: 'trial' }));
      } else {
        setMessage('Error al cancelar: ' + (data.detail || data.message || 'Error desconocido'));
      }
    } catch (error: any) {
      setMessage('Ocurrió un error al intentar cancelar.');
      console.error(error);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Facturación y Plan</h1>
      <p style={{ color: 'var(--text-2)', marginBottom: 32 }}>Administra el medio de pago y el plan recurrente de tu organización.</p>

      <div className="sg-card" style={{ maxWidth: 600, padding: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Suscripción Actual</h2>
        <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 8, border: '0.5px solid var(--border)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase' }}>Plan contratado</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-blue)', marginTop: 4 }}>
                {tenant.plan === 'pro' ? 'SafeGuard Pro' : tenant.plan === 'pyme' ? 'SafeGuard PyME' : 'Plan Demo (Trial)'}
              </div>
            </div>
            <div>
              {tenant.plan !== 'trial' && (
                <span className="badge badge-green">Activa (Recurrente)</span>
              )}
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-2)' }}>
            Empresa vinculada: <strong>{tenant.empresa || 'Desconocida'}</strong><br/>
            Email facturación: <strong>{tenant.email || 'desconocido'}</strong>
          </div>
        </div>

        {message && (
          <div style={{ padding: 12, borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', fontSize: 13, marginBottom: 24 }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="sg-btn sg-btn-primary" onClick={() => window.location.href = '/pricing'}>
            Mejorar Plan
          </button>
          
          {tenant.plan !== 'trial' && (
            <button 
              className="sg-btn" 
              style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
              onClick={handleCancelSubscription}
              disabled={canceling}
            >
              {canceling ? 'Procesando...' : 'Cancelar Suscripción'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
