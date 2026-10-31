# Backend-agent V2 source checkpoint — actual recovery evidence

2026-10-31. This checkpoint is separate from the architect's checkpoint and captures **current working-tree source**, not historical Git HEAD. No app files were edited. Snapshot: `.checkpoints/backend-source-checkpoint-20261031/source/`; independent nondestructive restore copy: `.checkpoints/backend-source-checkpoint-20261031/verify/`; per-file SHA-256, sizes and relative paths: `.checkpoints/backend-source-checkpoint-20261031/manifest.json`; generator: `.checkpoints/backend-source-checkpoint-20261031/snapshot.ps1`. Restore requires a separately approved operation; no source was restored or overwritten during verification.

Approved V2-only shell command from workspace root: `& '.\.checkpoints\backend-source-checkpoint-20261031\snapshot.ps1'`. First invocation exited **1** before copying: installed Windows PowerShell/.NET lacks `[IO.Path]::GetRelativePath`; error `Method invocation failed because [System.IO.Path] does not contain a method named 'GetRelativePath'` at script line 19. Only the owned checkpoint script was corrected to derive a root-checked relative path via `Substring`, and the same command was retried. Second invocation exited **0** and printed:

```text
ROOT=E:\HK1_2026_2027\PhotoboothDesktop_v2
COUNT=206
MANIFEST_SHA256=2e940f04991b714efa36fcf602803096318ada985638ad313b910d51b7a20d99
TEST_SOURCE_SHA256=9fd191feff3a1eeef0f934623e4cf92ca82497d2ec91b24a9f2247ba9d2fc153
HARNESS_SHA256=6c2bc897fc7a4f2b6162d6dcfbb20bc9ae88d2e5f12be4492dc02f759a4364c1
ORIGINAL_COPY_VERIFY_SHA256=ALL_MATCH
```

The manifest records 206 unique V2-relative paths, per-file original, copied and verify-copy SHA-256 (matched for every entry), and byte sizes; source originals were hashed again after copying to catch concurrent edits. Specifically `backend/src/test/kotlin/com/lesouvenir/v2/ipc/SimulatorSessionTest.kt` and `backend/test-foundation.ps1` are in the snapshot with the printed hashes. Scope is allowlisted source trees `backend/src`, `frontend/src`, `src-tauri/src`, source scripts in `tests`, Markdown in `docs`/`agent_templates`, and selected build manifests/lockfiles/scripts/templates. Reparse-point descendants are rejected. Exclusions: V1 entirely, `.git`, dependencies, caches, build/dist output, runtime JSON config (`backend/config/operator-settings.json` and local layouts), `.env`, model binaries, customer photos, generated images and logs. No binary/runtime assets, database, printer, camera, network, provider or build was touched. This proves **scoped source recovery**, not packaged installer/full-application restoration or license clearance.

Before any separate authorized source edit, compare these two live source hashes to manifest entries again; any mismatch requires fresh checkpoint review rather than treating this snapshot as current. Restore only selected relative source paths after approval, preserving user runtime config; do not copy `verify/` over the workspace wholesale.
