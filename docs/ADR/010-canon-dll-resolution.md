# ADR-010: Canon EDSDK — Deterministic Approved Runtime Resolution

**Date**: 2026-11-12  
**Status**: Proposed; Canon Terms and Packaged Device POC Pending

## Context
The audit found x64 EDSDK DLLs in V1 but did not establish Canon redistribution
terms, whether EOS Utility supplies a legally/technically usable runtime, native
dependency closure, or packaged DLL lookup. These are blockers, not assumptions.

## Decision
- Do not copy or ship V1 DLLs until authoritative terms/legal review permit it.
- Release configuration points to one approved x64 runtime arrangement: bundled
  install resource if redistribution is authorized, or a documented vendor-
  approved external installation if established.
- Resolve and validate the explicit directory before edsdk4j/JNA initialization;
  record architecture/version/hash metadata. Set child-only DLL/JNA search paths.
- Do not search arbitrary current directories, rely on ambient machine `PATH`,
  mutate global `PATH`, or copy into System32.
- Missing dependency, wrong architecture, duplicate version and load failure are
  structured startup/device errors.
- An EOS Utility prerequisite is not claimed unless vendor/legal and packaged POC
  evidence establish it.

## Rationale
- Deterministic load order prevents accidental V1/system DLL collisions.
- Keeps deployment policy aligned with the actual license disposition.
- Enables reproducible x64 package/device tests and actionable diagnostics.

## Gate

The architecture remains blocked until a bundled x64 JVM loads the approved
runtime and an actual supported camera passes discovery, Live View,
capture/transfer, reconnect and cleanup. A DLL-existence check or mock is not
hardware validation. See `docs/TAURI_FEASIBILITY.md`.
