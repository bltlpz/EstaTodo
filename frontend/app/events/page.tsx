'use client';
import React, { useEffect, useState } from 'react';
import { fetchEvents } from '@/lib/api';
import { SGEvent } from '@/lib/types';
import { useStore } from '@/lib/store';

/* ─── Helpers ─────────────────────────────────────────────────── */

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'hace un momento';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://5695-200-80-213-210.ngrok-free.app';

function getVideoSrc(cameraId: string | null): string {
  if (!cameraId) return `${API_URL}/api/media/video_robo.mp4`;
  if (cameraId.includes('TRK-01')) return `${API_URL}/api/media/video_robo.mp4`;
  if (cameraId.includes('TRK-02')) return `${API_URL}/api/media/video_normal.mp4`;
  if (cameraId.includes('TRK-03')) return `${API_URL}/api/media/video_inconcluso.mp4`;
  return `${API_URL}/api/media/video_robo.mp4`;
}

interface VerdictMeta {
  color: string;
  bg: string;
  borderColor: string;
  text: string;
  pill: string;
  icon: string;
}

function getVerdictMeta(verdict: string | null): VerdictMeta {
  if (verdict === 'CONFIRMADO' || verdict === 'ROBO_CONFIRMADO') return {
    color: '#EF4444', bg: '#450a0a', borderColor: '#EF4444',
    text: 'CONFIRMADO', pill: '⚠ Incidente confirmado', icon: '⚠'
  };
  if (verdict === 'FALSA_ALARMA') return {
    color: '#10B981', bg: '#052e16', borderColor: '#10B981',
    text: 'FALSA_ALARMA', pill: '✓ Sin incidentes', icon: '✓'
  };
  return {
    color: '#F59E0B', bg: '#1c1917', borderColor: '#F59E0B',
    text: 'EN ANÁLISIS', pill: '⏳ En análisis', icon: '⏳'
  };
}

/* ─── CopyButton ───────────────────────────────────────────────── */
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10B981' : '#64748B', fontSize: 13, padding: '0 4px' }}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}

/* ─── CheckItem ────────────────────────────────────────────────── */
function CheckItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <div
      onClick={() => setChecked(!checked)}
      style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, cursor: 'pointer' }}
    >
      <div style={{
        width: 14, height: 14, border: '1.5px solid ' + (checked ? '#10B981' : '#334155'),
        borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? '#052e16' : 'transparent', flexShrink: 0,
        transition: 'all 0.2s'
      }}>
        {checked && <span style={{ color: '#10B981', fontSize: 9, fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontSize: 12, color: checked ? '#64748B' : '#94A3B8', textDecoration: checked ? 'line-through' : 'none' }}>
        {label}
      </span>
    </div>
  );
}

/* ─── TimelineStep ─────────────────────────────────────────────── */
function TimelineStep({ icon, title, subtitle, value, active, link }: {
  icon: React.ReactNode; title: string; subtitle: string; value: string;
  active: boolean; link?: string | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100, zIndex: 1 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: active ? '#052e16' : '#0F172A',
        border: `2px solid ${active ? '#10B981' : '#334155'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s'
      }}>
        <span style={{ fontSize: 17, color: active ? '#10B981' : '#64748B' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', marginTop: 8, textAlign: 'center' }}>{title}</div>
      <div style={{ fontSize: 10, color: '#64748B', textAlign: 'center', marginTop: 2 }}>{subtitle}</div>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#06B6D4', fontFamily: 'monospace', marginTop: 4, textAlign: 'center', textDecoration: 'underline' }}>
          {value}
        </a>
      ) : (
        <div style={{ fontSize: 10, color: active ? '#06B6D4' : '#64748B', fontFamily: 'monospace', marginTop: 4, textAlign: 'center' }}>{value}</div>
      )}
    </div>
  );
}

/* ─── ExpandedEvent ────────────────────────────────────────────── */
function ExpandedEvent({ event, onClose }: { event: SGEvent; onClose: () => void }) {
  const [localEvent, setLocalEvent] = useState(event);
  const [analyzing, setAnalyzing] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [custodyOpen, setCustodyOpen] = useState(false);

  const verdict = localEvent.vision_verdict ?? localEvent.genlayer_verdict ?? null;
  const v = getVerdictMeta(verdict);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${localEvent.id}/dispute`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const newVerdict = data.vision_verdict || data.genlayer_verdict;
        setLocalEvent(prev => ({ ...prev, vision_verdict: newVerdict, genlayer_verdict: newVerdict, incident_description: data.incident_description || prev.incident_description, blockchain_tx: data.blockchain_tx || prev.blockchain_tx }));
      }
    } catch { /* ignore */ } finally {
      setAnalyzing(false);
    }
  };

  const getBullets = () => {
    if (verdict === 'CONFIRMADO' || verdict === 'ROBO_CONFIRMADO') return [
      'Movimiento en zona restringida del trailer',
      'Operario sin autorización de despacho',
      'Comportamiento evasivo hacia salida trasera',
    ];
    if (verdict === 'FALSA_ALARMA') return [
      'Revisión de inventario autorizada',
      'Operario dentro de su rol habitual',
      'Sin anomalías en ningún frame',
    ];
    return [
      'Movimiento detectado por YOLOv8',
      'Análisis de IA pendiente',
      'Evidencia preservada en blockchain',
    ];
  };

  const steps = [
    { icon: '📷', title: 'Detectado', subtitle: 'YOLOv8 · Edge AI', value: localEvent.timestamp ? new Date(localEvent.timestamp).toLocaleTimeString('es-AR') : '—', active: true, link: null },
    { icon: '🔒', title: 'Sellado', subtitle: 'SHA-256 calculado', value: localEvent.hash_sha256 ? localEvent.hash_sha256.slice(0, 10) + '...' : 'Pendiente', active: !!localEvent.hash_sha256, link: null },
    { icon: '🔗', title: 'On-chain', subtitle: 'Avalanche L1 · PoA', value: localEvent.blockchain_tx ? localEvent.blockchain_tx.slice(0, 10) + '...' : 'Pendiente', active: !!localEvent.blockchain_tx, link: null },
    { icon: '⚖️', title: 'Análisis IA', subtitle: 'Claude Vision', value: verdict ? verdict.replace('_', ' ') : 'Pendiente', active: !!verdict, link: null },
  ];

  return (
    <div style={{ background: '#080e1a', border: '0.5px solid #334155', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

      {/* HEADER — simplified */}
      <div style={{ background: '#1E293B', borderBottom: '0.5px solid #334155', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}>Incidente en {localEvent.camera_id}</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{relativeTime(localEvent.timestamp)}</div>
        </div>
        <button onClick={onClose} style={{ fontSize: 12, color: '#64748B', background: 'transparent', border: '0.5px solid #334155', borderRadius: 6, padding: '7px 14px', cursor: 'pointer' }}>
          Ocultar análisis
        </button>
      </div>

      {/* BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 0 }}>

        {/* LEFT — Video */}
        <div style={{ padding: 20, borderRight: '0.5px solid #334155' }}>
          <div style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>GRABACIÓN DEL INCIDENTE</div>
          <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden', border: '0.5px solid #334155' }}>
            <style>{`
              @keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
            `}</style>
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 3, animation: 'recPulse 1.5s infinite' }}>
              REC
            </div>
            <video controls style={{ width: '100%', display: 'block', borderRadius: 8 }}>
              {localEvent.ipfs_url && <source src={localEvent.ipfs_url} type="video/mp4" />}
              <source src={getVideoSrc(localEvent.camera_id)} type="video/mp4" />
            </video>
          </div>
        </div>

        {/* RIGHT — 4 Cards */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 480 }}>

          {/* Card 1 — Veredicto IA */}
          <div style={{ background: '#1E293B', borderRadius: 10, padding: '14px 16px', border: '0.5px solid #334155', borderLeft: `3px solid ${v.borderColor}` }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748B', marginBottom: 10 }}>VEREDICTO</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 22, color: v.color }}>{v.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: v.color }}>
                {v.text === 'ROBO_CONFIRMADO' ? 'Robo confirmado' : v.text === 'FALSA_ALARMA' ? 'Sin irregularidades' : 'En análisis...'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
              {(verdict === 'CONFIRMADO' || verdict === 'ROBO_CONFIRMADO') ? 'Incidente confirmado por Claude Vision · Evidencia sellada' : verdict === 'FALSA_ALARMA' ? 'Actividad normal verificada por Claude Vision' : 'Esperando análisis de IA...'}
            </div>
            {verdict ? (
              <span style={{ background: '#0c1a35', color: '#06B6D4', fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '0.5px solid #06B6D430' }}>
                Claude Vision · IA
              </span>
            ) : (
              <button onClick={handleAnalyze} disabled={analyzing} style={{ background: '#06B6D4', color: '#0F172A', fontWeight: 600, border: 'none', padding: '9px 14px', borderRadius: 6, cursor: 'pointer', width: '100%', marginTop: 8, fontSize: 13 }}>
                {analyzing ? '⏳ Analizando frames con Claude...' : 'Analizar con IA →'}
              </button>
            )}
          </div>

          {/* Card 2 — Qué pasó */}
          <div style={{ background: '#1E293B', borderRadius: 10, padding: '14px 16px', border: '0.5px solid #334155' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748B', marginBottom: 8 }}>QUÉ PASÓ</div>
            {localEvent.incident_description && (
              <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.4 }}>
                "{localEvent.incident_description}"
              </div>
            )}
            {getBullets().map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: v.color, flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.4 }}>{b}</span>
              </div>
            ))}
          </div>

          {/* Card 3 — Qué hacer (solo ROBO) */}
          {(verdict === 'CONFIRMADO' || verdict === 'ROBO_CONFIRMADO') && (
            <div style={{ background: '#1E293B', borderRadius: 10, padding: '14px 16px', border: '0.5px solid #334155', borderLeft: '3px solid #F59E0B' }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748B', marginBottom: 10 }}>QUÉ HACER</div>
              <CheckItem label="Notificar a la aseguradora" />
              <CheckItem label="Contactar al supervisor de flota" />
              <CheckItem label="Preservar la evidencia digital" />
              <CheckItem label="Iniciar reclamo formal" />
            </div>
          )}

          {/* Card 4 — Datos técnicos (acordeón) */}
          <div style={{ background: '#1E293B', borderRadius: 10, border: '0.5px solid #334155', overflow: 'hidden' }}>
            <button
              onClick={() => setTechOpen(!techOpen)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 11, color: techOpen ? '#F1F5F9' : '#64748B' }}>🔧 Datos para auditores</span>
              <span style={{ color: '#64748B', fontSize: 14, transition: 'transform 0.2s', transform: techOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▾</span>
            </button>
            {techOpen && (
              <div style={{ borderTop: '0.5px solid #334155', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'SHA-256', val: localEvent.hash_sha256 },
                  { label: 'TX Avalanche', val: localEvent.blockchain_tx },
                  { label: 'IPFS CID', val: localEvent.ipfs_cid, link: localEvent.ipfs_url },
                  { label: 'Contrato', val: '0x4Ac1d98D9cEF99EC6546dEd4Bd550b0b287aaD6D' },
                  { label: 'Chain ID', val: '99372 (Avalanche L1 · SGT)' },
                ].map(({ label, val, link }: { label: string; val: string | null | undefined; link?: string | null }) => val && (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', flexShrink: 0 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                      {link ? (
                        <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#06B6D4', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, textDecoration: 'underline' }}>
                          {val.slice(0, 20)}...
                        </a>
                      ) : (
                        <span style={{ fontSize: 10, color: '#06B6D4', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{val}</span>
                      )}
                      <CopyButton value={val} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* CUSTODY CHAIN — collapsible accordion card */}
      <div style={{ margin: '0 16px 16px', background: '#1E293B', border: '0.5px solid #334155', borderRadius: 10, overflow: 'hidden' }}>
        <button
          onClick={() => setCustodyOpen(!custodyOpen)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: custodyOpen ? '#263548' : 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
        >
          <span style={{ fontSize: 11, color: custodyOpen ? '#F1F5F9' : '#64748B' }}>🔗 Cadena de custodia</span>
          <span style={{ color: '#64748B', fontSize: 14, transition: 'transform 0.2s', transform: custodyOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▾</span>
        </button>
        {custodyOpen && (
          <div style={{ borderTop: '0.5px solid #334155', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              {steps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <TimelineStep {...step} />
                  {idx < steps.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: step.active && steps[idx + 1]?.active ? '#10B981' : '#334155', marginTop: 19, transition: 'background 0.3s' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

/* ─── EventListCard ────────────────────────────────────────────── */
function EventListCard({ event, onExpand }: { event: SGEvent; onExpand: (e: SGEvent) => void }) {
  const v = getVerdictMeta(event.vision_verdict ?? event.genlayer_verdict ?? null);
  const [hovered, setHovered] = useState(false);

  const leftColor = v.borderColor;

  return (
    <div
      onClick={() => onExpand(event)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#263548' : '#1E293B',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 10,
        borderLeft: `4px solid ${leftColor}`,
        border: `0.5px solid #334155`,
        borderLeftWidth: 4,
        borderLeftColor: leftColor,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.15s',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>Incidente · {event.camera_id}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{relativeTime(event.timestamp)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: v.bg, color: v.color, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 4, border: `0.5px solid ${v.borderColor}30` }}>
            {v.text}
          </span>
          {event.blockchain_tx && (
            <span style={{ background: '#0c1a35', color: '#06B6D4', fontSize: 10, padding: '3px 9px', borderRadius: 4, border: '0.5px solid #06B6D430' }}>
              On-chain ✓
            </span>
          )}
        </div>
      </div>
      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: '#94A3B8', flexGrow: 1, paddingRight: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
          {(event.incident_description || 'Incidente detectado en cámara ' + event.camera_id).slice(0, 80)}
        </div>
        <button
          style={{
            background: 'transparent', border: '0.5px solid ' + (hovered ? '#2563EB' : '#334155'),
            color: hovered ? '#F1F5F9' : '#94A3B8', fontSize: 12, padding: '6px 12px',
            borderRadius: 6, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', whiteSpace: 'nowrap'
          }}
        >
          Ver análisis →
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────── */
export default function EventsPage() {
  const { incidents } = useStore();
  const [events, setEvents] = useState<SGEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'incidents' | 'fraude' | 'sin_veredicto'>('all');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<SGEvent | null>(null);

  const loadEvents = () => {
    setLoading(true);
    fetchEvents()
      .then((data) => Array.isArray(data) && setEvents(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEvents(); }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API_URL}/api/events/demo/seed`, { method: 'POST' });
      if (res.ok) setTimeout(loadEvents, 500);
    } catch { /* ignore */ } finally {
      setSeeding(false);
    }
  };

  const wsEvents = incidents.map((i) => i.event);
  const allIds = new Set(events.map((e) => e.id));
  const merged = [...events, ...wsEvents.filter((e) => !allIds.has(e.id))];

  const filtered = merged.filter((ev) => {
    if (filter === 'incidents') return ev.type !== 'normal';
    if (filter === 'fraude') return ev.vision_verdict?.includes('CONFIRMADO') || ev.genlayer_verdict?.includes('FRAUDE') || ev.genlayer_verdict?.includes('ROBO');
    if (filter === 'sin_veredicto') return !ev.vision_verdict && !ev.genlayer_verdict;
    return true;
  });

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Page Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Historial de Eventos e Incidentes</h1>
          <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Registro inmutable y análisis de IA desde L1 Avalanche</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { key: 'all', label: 'Todos' },
            { key: 'incidents', label: 'Solo incidentes' },
            { key: 'fraude', label: 'FRAUDE / ROBO' },
            { key: 'sin_veredicto', label: 'Sin veredicto' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontSize: 13, padding: '8px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                background: filter === f.key ? '#2563EB' : 'transparent',
                color: filter === f.key ? '#FFF' : '#94A3B8',
                border: filter === f.key ? '0.5px solid #2563EB' : '0.5px solid #334155'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Event Detail */}
      {expandedEvent && (
        <div style={{ marginBottom: 24 }}>
          <ExpandedEvent event={expandedEvent} onClose={() => setExpandedEvent(null)} />
        </div>
      )}

      {/* Event Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {loading && events.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748B', border: '0.5px solid #334155', borderRadius: 12, background: '#1E293B' }}>
            Sincronizando con base de datos descentralizada...
          </div>
        ) : merged.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px dashed #334155', borderRadius: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>No hay eventos registrados</div>
            <div style={{ color: '#94A3B8', marginBottom: 24 }}>La base de datos está vacía y no hay incidentes activos en la flota en este momento.</div>
            <button onClick={handleSeed} disabled={seeding} style={{ background: '#2563EB', color: 'white', padding: '12px 24px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {seeding ? 'Generando y cargando...' : 'Cargar datos de demo (Hackathon)'}
            </button>
          </div>
        ) : (
          <>
            {filtered.map(ev => (
              <EventListCard
                key={ev.id}
                event={ev}
                onExpand={(e) => setExpandedEvent(expandedEvent?.id === e.id ? null : e)}
              />
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748B', border: '0.5px solid #334155', borderRadius: 12, background: '#1E293B' }}>
                No hay eventos que coincidan con el filtro seleccionado.
              </div>
            )}
            <button onClick={handleSeed} disabled={seeding} style={{ marginTop: 24, alignSelf: 'center', background: 'transparent', color: '#64748B', padding: '10px 20px', borderRadius: 6, fontWeight: 500, border: '0.5px solid #334155', cursor: 'pointer' }}>
              {seeding ? 'Reiniciando DB...' : 'Resetear DB / Recargar Demo'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
