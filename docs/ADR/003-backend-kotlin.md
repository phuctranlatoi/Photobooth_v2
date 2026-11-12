# ADR-003: Backend — Kotlin/JVM Sidecar with Manifest-Gated V1 Reuse

**Date**: 2026-11-12  
**Status**: Accepted architecture; hardware and reuse/license gates remain open

## Context
The V1 audit observed substantial Kotlin camera, generic Windows printing, image,
Beauty, composition, pricing and integration behavior. Rewriting designated stable
logic risks regression, but source inspection did not prove hardware reliability,
production hardening, DNP-specific behavior, or redistribution rights.

## Decision
Use one supervised Kotlin/JVM authority in V2. Copy only source/resources named in
an approved source/model/native manifest and permitted by license; first
characterize behavior, then adapt lifecycle/ports without retuning algorithms.
Candidate reuse includes:
- `DesktopBoothController` orchestration
- `NativeEosCaptureService` / `HotFolderCaptureService` / `WebcamStillCaptureService`
- `SystemPrinterService` behavior (generic Java Print Service, not proven DNP code)
- designated `DesktopBeautyService` + exact manifest-approved ONNX models
- `DesktopCompositor` + `DesktopVideoCompositor`
- observed session outcomes/orchestration (with intent-specific guard enforcement)
- `PricingCalculator`, `SalesRepository`, `NeonDirectRevenueClient`

## Rationale
- Minimize behavior change for audited logic and preserve characterization fixtures
- Faster delivery
- JVM hardware/native crashes are isolated from the shell process and supervised

## Consequences
- A pinned x64 JVM runtime image is bundled; packaging mechanism is proven in POC
- JNA for Canon EDSDK
- Pinned ONNX Runtime/weights after provenance and compatibility review
- ffmpeg subprocess for video
- Backend is the sole session/hardware/payment/revenue/file authority
- Canon and installed DNP/spooler paths must pass actual Windows hardware gates;
  mocks or copied code do not prove them
