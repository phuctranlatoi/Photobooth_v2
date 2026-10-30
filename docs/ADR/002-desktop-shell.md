# ADR-002: Desktop Shell — Tauri v2 (Candidate)

**Date**: 2026-10-30  
**Status**: Pending POC Validation

## Context
Need a lightweight desktop shell that can spawn a JVM sidecar and manage its lifecycle. Tauri v2 offers sidecar support, Rust security, and small binary size.

## Decision
**Tauri v2 as candidate**, but **only after proving**:
1. JVM sidecar starts/stops reliably
2. StdIO JSON-RPC works bidirectionally
3. Named pipe Live View streaming feasible
4. Crash detection + auto-restart works
5. Windows MSI/MSIX packaging succeeds

**Fallback**: Electron + `child_process` if Tauri sidecar fails POC.

## Rationale
- Tauri v2 sidecar API designed for this pattern
- Rust memory safety for shell
- Smaller bundle than Electron
- Active development, v2 stable

## Risks
- Tauri v2 sidecar + JNA + Windows message pump untested combination
- Named pipe permissions on Windows
- Updater + sidecar version sync

## POC Criteria (Gate 2)
See `HARDWARE_POC_PLAN.md` — Sidecar POC must pass before commitment.