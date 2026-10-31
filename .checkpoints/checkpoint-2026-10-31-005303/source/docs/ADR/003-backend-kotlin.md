# ADR-003: Backend — Kotlin/JVM Sidecar (Reuse V1)

**Date**: 2026-10-30  
**Status**: Accepted

## Context
V1 has stable, production-hardened Kotlin code for: Canon SDK, DNP printing, Beauty (ONNX), composition, pricing, Neon sync. Rewriting risks regression.

## Decision
**Copy V1 backend code into V2** as a separate JVM module (`backend/`), exposed via IPC. No algorithm changes. Preserve:
- `DesktopBoothController` orchestration
- `NativeEosCaptureService` / `HotFolderCaptureService` / `WebcamStillCaptureService`
- `SystemPrinterService` (javax.print)
- `DesktopBeautyService` + ONNX models
- `DesktopCompositor` + `DesktopVideoCompositor`
- `SessionStateMachine` (with guard enforcement added)
- `PricingCalculator`, `SalesRepository`, `NeonDirectRevenueClient`

## Rationale
- Zero behavior change for proven logic
- Faster delivery
- Isolated in sidecar process (crash isolation)

## Consequences
- JVM 21 bundled (via Compose Desktop `nativeDistributions` or jpackage)
- JNA for Canon EDSDK
- ONNX Runtime 1.18.0 for Beauty
- ffmpeg subprocess for video