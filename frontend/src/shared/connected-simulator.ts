import type { SessionGetStateResult } from './simulator-contract';
// Actual SimulatorSessionEngine snapshot. Legacy generated declarations are not
// the integration authority; this extension tracks the installed engine shape.
export interface Snapshot extends SessionGetStateResult {
  generationId: string;
  secondsRemaining: number;
  shots: { shotIndex:number; shotId:string; preview:string }[];
  livePreviewDataUrl: string | null;
  previewDataUrl: string | null;
  frameId: string | null;
  failure: string | null;
  userConfirmed: boolean;
  revenueRecorded: boolean;
  printAccepted: boolean;
  printStatus?: string | null;
  qrCodeUrl?: string | null;
  albumUrl?: string | null;
  videoUploaded?: boolean;
  paymentUrl?: string | null;
  paymentQr?: string | null;
  orderCode?: number | null;
  payOsConfigured?: boolean;
  catalogSource?: 'FIREBASE_LIVE' | 'DISK_CACHE' | 'STATIC_FALLBACK' | 'MEMORY_FALLBACK' | 'UNAVAILABLE';
  lastSyncError?: string | null;
  payOsStatus?: 'CONFIG_MISSING' | 'CONFIG_INVALID' | 'SDK_INIT_FAILED' | 'READY';
  lastPaymentError?: string | null;
  paymentMethod?: string;
  effectTitle?: string;
  compositionDataUrl?: string | null;
  printImageDataUrl?: string | null;
  runtimeMode?: 'REAL' | 'SIMULATOR';
  captureMode?: 'DEMO' | 'REAL';
  bundles?: Array<{id:string;name:string;coverDataUrl?:string;layoutId:string;frameCount:number}>;
  availableFramesCount?: number;
  cameraConnected?: boolean;
}
export function safeImage(value:unknown):string {
  return typeof value==='string' && value.length<=5_000_000 && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : '';
}
