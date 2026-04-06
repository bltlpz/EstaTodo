export interface Truck {
  id: string;
  plate: string;
  driver: { name: string; dni: string };
  cargo: { description: string; value: number; remito: string };
  status: 'en_ruta' | 'detenido' | 'incidente';
  route: { origin: string; destination: string };
  coords: { lat: number; lng: number };
  cameraId: string;
  incidents: number;
}

export interface SGEvent {
  id: string;
  type: string;
  camera_id: string;
  timestamp: string | null;
  clip_path: string | null;
  hash_sha256: string | null;
  blockchain_tx: string | null;
  blockchain_status: string;
  confidence: number;
  metadata: Record<string, any> | null;
  module: string;
  /** Nuevo campo: veredicto de Claude Vision */
  vision_verdict: string | null;
  /** Alias de compatibilidad — mismo valor que vision_verdict */
  genlayer_verdict: string | null;
  incident_description: string | null;
  ipfs_cid: string | null;
  ipfs_url: string | null;
}

export interface Incident {
  id: string;
  event: SGEvent;
  timeReceived: string;
}

export interface Tenant {
  id: string;
  name: string;
  cuit: string;
  plan: string;
  cameras: number;
  wallets: string[];
  l1Status: string;
  eventsThisMonth: number;
}

export const STATUS_COLOR: Record<string, [number, number, number]> = {
  en_ruta:   [16, 185, 129],
  detenido:  [245, 158, 11],
  incidente: [239, 68, 68],
}

export const STATUS_HEX: Record<string, string> = {
  en_ruta:   '#10B981',
  detenido:  '#F59E0B',
  incidente: '#EF4444',
}

export const TRUCKS: Truck[] = [
  {
    id: 'TRK-01', plate: 'AB 123 CD',
    driver: { name: 'Juan Pérez', dni: '28.456.789' },
    cargo: { description: 'Electrodomésticos Samsung', value: 850000, remito: 'R-2024-001' },
    status: 'en_ruta',
    route: { origin: 'Buenos Aires', destination: 'Córdoba' },
    coords: { lat: -34.6037, lng: -58.3816 },
    cameraId: 'CAM-TRK-01', incidents: 1,
  },
  {
    id: 'TRK-02', plate: 'EF 456 GH',
    driver: { name: 'Carlos López', dni: '31.234.567' },
    cargo: { description: 'Indumentaria deportiva', value: 420000, remito: 'R-2024-002' },
    status: 'en_ruta',
    route: { origin: 'Córdoba', destination: 'Mendoza' },
    coords: { lat: -31.4201, lng: -64.1888 },
    cameraId: 'CAM-TRK-02', incidents: 0,
  },
  {
    id: 'TRK-03', plate: 'IJ 789 KL',
    driver: { name: 'Miguel Torres', dni: '25.678.901' },
    cargo: { description: 'Electrónica importada', value: 1200000, remito: 'R-2024-003' },
    status: 'detenido',
    route: { origin: 'Mendoza', destination: 'Buenos Aires' },
    coords: { lat: -32.8908, lng: -68.8272 },
    cameraId: 'CAM-TRK-03', incidents: 2,
  },
];

export const TENANTS: Tenant[] = [
  {
    id: 'T-001', name: 'Transportes Del Sur S.A.',
    cuit: '30-71234567-8', plan: 'Pro',
    cameras: 3, wallets: ['0x8db9...', '0x1a2b...', '0x3c4d...'],
    l1Status: 'active', eventsThisMonth: 47,
  },
  {
    id: 'T-002', name: 'Logística Norte S.R.L.',
    cuit: '30-98765432-1', plan: 'Basic',
    cameras: 1, wallets: ['0x5e6f...'],
    l1Status: 'active', eventsThisMonth: 12,
  },
];

export const STOCK_ITEMS = [
  { id: 'SKU-001', name: 'Smart TV Samsung 55"', category: 'Electrónica', value: 320000, qty: 4, available: 3 },
  { id: 'SKU-002', name: 'Heladera Whirlpool 380L', category: 'Electrodomésticos', value: 185000, qty: 6, available: 6 },
  { id: 'SKU-003', name: 'Notebook Lenovo IdeaPad', category: 'Informática', value: 410000, qty: 2, available: 0 },
  { id: 'SKU-004', name: 'Aire Acond. Inverter 3000', category: 'Electrodomésticos', value: 290000, qty: 8, available: 5 },
];

export function formatARS(n: number): string {
  return '$' + n.toLocaleString('es-AR');
}

export function getStatusBadge(status: string): string {
  if (status === 'en_ruta') return 'badge badge-green';
  if (status === 'detenido') return 'badge badge-amber';
  if (status === 'incidente') return 'badge badge-red';
  return 'badge badge-gray';
}

export function getVerdictBadge(verdict: string | null): string {
  if (!verdict) return 'badge badge-gray';
  // Claude Vision veredictos nuevos
  if (verdict === 'CONFIRMADO') return 'badge badge-red';
  if (verdict === 'FALSA_ALARMA') return 'badge badge-green';
  if (verdict === 'REQUIERE_REVISION') return 'badge badge-amber';
  // Legacy (compatibilidad con datos anteriores)
  if (verdict === 'ROBO_CONFIRMADO') return 'badge badge-red';
  if (verdict.includes('FRAUDE') || verdict.includes('ROBO') || verdict.includes('CONFIRMADO')) return 'badge badge-red';
  if (verdict.includes('REAL') || verdict.includes('ALARMA')) return 'badge badge-green';
  return 'badge badge-amber';
}

export function getBlockchainBadge(status: string): string {
  if (status === 'confirmed' || status === 'verified_l1') return 'badge badge-blue';
  if (status === 'failed') return 'badge badge-red';
  return 'badge badge-amber';
}

export const ROUTE_POLYLINES: Record<string, [number, number][]> = {
  'Buenos Aires-Córdoba': [[-34.60,-58.38],[-34.5,-60.0],[-33.8,-61.5],[-32.5,-62.8],[-31.42,-64.19]],
  'Córdoba-Mendoza': [[-31.42,-64.19],[-31.8,-65.5],[-32.3,-66.8],[-32.89,-68.83]],
  'Mendoza-Buenos Aires': [[-32.89,-68.83],[-33.2,-67.0],[-33.8,-65.0],[-34.2,-62.0],[-34.60,-58.38]],
};

export const CHECKPOINTS: Record<string, string[]> = {
  'Buenos Aires-Córdoba': ['Buenos Aires (salida)', 'Luján', 'Rosario', 'Villa María', 'Córdoba (llegada)'],
  'Córdoba-Mendoza': ['Córdoba (salida)', 'Villa Dolores', 'San Luis', 'Mendoza (llegada)'],
  'Mendoza-Buenos Aires': ['Mendoza (salida)', 'San Luis', 'Villa Mercedes', 'Río Cuarto', 'Córdoba', 'Buenos Aires (llegada)'],
};
