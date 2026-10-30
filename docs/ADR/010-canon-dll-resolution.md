# ADR-010: Canon EDSDK — Dynamic DLL Resolution (No Bundling)

**Date**: 2026-10-30  
**Status**: Accepted

## Context
Canon EDSDK redistribution requires ISV license (unlikely for small vendor).

## Decision
**Do not bundle EDSDK DLLs**. Resolve at runtime:
1. Bundled (if licensed) — `resources/EDSDK_64/`
2. System PATH (user installed EOS Utility)
3. Canon default install paths

**Error if not found**: Clear message to install Canon EOS Utility.

## Rationale
- Legal compliance
- EOS Utility commonly installed by photographers
- HotFolder/Webcam fallbacks documented