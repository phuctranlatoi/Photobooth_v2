import { invoke, isTauri } from '@tauri-apps/api/core';
export interface Health { status: 'ok'; protocolVersion: 1; simulator: true; backendPid: number; uptimeMs: number; jvmVersion: string; availableMethods: ['health.check'] }
export interface Bridge { check(): Promise<Health> }
export const bridge: Bridge = { async check() {
  if (!isTauri()) throw new Error('Desktop host unavailable. Open the Tauri app to contact the JVM. Browser mode never simulates a connection.');
  return invoke<Health>('health_check');
} };
