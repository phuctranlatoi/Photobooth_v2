# ADR-011: Path Isolation — Separate V2 Identity

**Date**: 2026-11-12  
**Status**: Accepted

## Context
V1 and V2 must run independently (or at least not corrupt each other's data).

## Decision
| V1 | V2 |
|----|-----|
| V1 legacy identity/storage | New package/product/upgrade IDs and explicit V2-only roots |
| V1 `.env`/working-directory merge | V2 non-secret config plus protected secret store; no V1 lookup |
| V1 `data/sessions/`, output, DB | V2 operational `captures/`, `output/`, `state/` roots |
| `E:\Photobooth\HotFolder` default | Explicit V2 `hotfolder/incoming`, never implicit shared folder |
| V1 executable/mutex/shortcuts/update | New executable, mutex, AppUserModelID, shortcuts and update channel |

## Rationale
- Zero collision risk
- Parallel testing possible
- Clean uninstall separation

Install resources are read-only. Config, secrets, ledger, logs, temp, Hot Folder,
captures, output, assets, cache, WebView data and updates each have explicit V2
roots as specified in `docs/V2_PROJECT_STRUCTURE.md`. Portable auto-discovery and
V1 migration are prohibited. Overrides are canonicalized/rejected if they point
inside V1 or outside allowed roots. Uninstall/purge/rollback policies are explicit
and must not delete customer/ledger data accidentally.
