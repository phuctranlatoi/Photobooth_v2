# ADR-002: Desktop Shell — Tauri v2 Candidate with Evidence-Based Fallback

**Date**: 2026-11-12  
**Status**: Pending Packaged Windows and Hardware POC Validation

## Context
Need a Windows kiosk host that can supervise a bundled Kotlin/JVM authority and
move Live View bytes without taking over camera, printing, payment or session
business logic. A small host is desirable, but reliability with Canon native
libraries, the Windows spooler and packaged process cleanup is the gate.

## Decision
**Tauri v2 remains the first candidate, not a committed production shell.** It is
selected only after the release MSI proves all mandatory criteria in
`docs/TAURI_FEASIBILITY.md`, including:

1. bundled x64 JVM start/stop without ambient Java and without orphan processes;
2. framed typed IPC correctness/latency under Live View load;
3. bounded latest-frame binary transport, unsubscribe and reconnect;
4. backend crash detection, bounded restart and no mutation replay;
5. approved Canon native DLL lookup plus actual supported-camera lifecycle;
6. exact installed DNP queue/spooler feasibility;
7. clean install/upgrade/rollback, V2 identity/path isolation and measured size.

**Fallback:** Electron main process + context-isolated preload + Kotlin child if a
mandatory failure is demonstrated to be caused by Tauri's process, transport, or
packaging model after one bounded remediation. React, schemas, Kotlin authority,
hardware adapters and writable roots remain unchanged.

## Rationale
- Keeps the shell narrow while retaining audited Kotlin implementation value.
- Typically smaller distribution and runtime than bundling Chromium.
- Tauri capabilities can expose a minimal renderer allowlist.
- The choice is reversible at the host boundary because business logic is not in
  Rust/Tauri commands.

Electron offers more mature Node child streams and transferable `ArrayBuffer`s
plus a deterministic bundled browser, but costs installer/RAM size, Chromium
patching and a larger main/preload security surface.

## Risks
- Tauri v2 sidecar + JNA/EDSDK lifecycle is an untested combination
- Named pipe permissions on Windows
- Updater + sidecar version sync
- WebView2 presence/bootstrap and binary-copy overhead on target kiosks
- A Canon or DNP failure may be backend/driver-specific rather than shell-specific;
  standalone packaged JVM comparison is required before switching shells

## POC Criteria (Gate 2)
See `docs/TAURI_FEASIBILITY.md`. A dev health bridge or simulator does not satisfy
this ADR, and mocks cannot validate Canon or DNP hardware.
