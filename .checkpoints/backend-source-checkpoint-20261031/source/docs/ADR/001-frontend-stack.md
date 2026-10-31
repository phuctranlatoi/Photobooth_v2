# ADR-001: Frontend Technology Stack

**Date**: 2026-10-30  
**Status**: Accepted

## Context
Need a modern, touch-first UI framework for 16:10 landscape kiosk display. V1 used Compose Desktop (Kotlin). V2 requires web technology for broader talent pool and animation library ecosystem.

## Decision
Use **React 18 + TypeScript + Vite + Tailwind CSS + Motion (framer-motion)**.

## Rationale
- React: Large ecosystem, TypeScript support, touch-friendly
- Vite: Fast HMR, optimized production builds
- Tailwind: Utility-first, responsive, kiosk-friendly sizing
- Motion: Declarative animations, gesture support for touch
- WebView2 (Tauri): Hardware-accelerated, evergreen on Windows 10+

## Alternatives Considered
| Option | Rejected Reason |
|--------|-----------------|
| Compose Desktop | Kotlin-only UI talent pool; animation complexity |
| Flutter | Dart learning curve; larger binary |
| Electron + React | Heavier; Tauri v2 preferred for sidecar model |
| Svelte | Smaller ecosystem; team familiarity with React |

## Consequences
- New UI codebase (no V1 Compose reuse)
- WebView2 runtime dependency (Windows 10 1909+)
- CSS-based theming instead of Compose theming