# ADR-011: Path Isolation — Separate V2 Identity

**Date**: 2026-10-30  
**Status**: Accepted

## Context
V1 and V2 must run independently (or at least not corrupt each other's data).

## Decision
| V1 | V2 |
|----|-----|
| `%LOCALAPPDATA%\LeSouvenirPhotobooth\` | `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\` |
| `.env` in V1 root | `.env` in V2 root |
| `data/sessions/` | `data/sessions/` |
| `HotFolder` at `E:\Photobooth\HotFolder` | `HotFolder` at V2 root |
| Compose MSI `PrettyBoothDesktop` | Tauri MSI `LeSouvenirPhotoboothV2` |
| Upgrade UUID `ce637e69...` | **New UUID** |

## Rationale
- Zero collision risk
- Parallel testing possible
- Clean uninstall separation