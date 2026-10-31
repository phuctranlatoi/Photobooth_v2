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
  revenueRecorded: false;
  printAccepted: false;
}
export function safeImage(value:unknown):string {
  return typeof value==='string' && value.length<=1_000_000 && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : '';
}
