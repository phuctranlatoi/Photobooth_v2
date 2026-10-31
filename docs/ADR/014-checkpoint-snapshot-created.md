# ADR-014: Checkpoint Source Snapshot Created

**Date**: 2026-10-31T15:20:46Z  
**Status**: Completed

## Context

Checkpoint required recoverable source snapshot with manifest and hash verification before authorizing application edits. Git commit alone insufficient for dirty worktree state preservation.

## Decision

Created source snapshot at `.checkpoints/checkpoint-2026-10-31-005303/`:
- 194 source files (1.7 MB)
- Manifest with SHA-256 hashes: `manifest.json`
- Excludes: .git, node_modules, build outputs, caches, dependencies, secrets, customer data

## Snapshot Contents

```
source/
├── backend/src/              (31 Kotlin source files)
├── backend/build.gradle.kts
├── backend/settings.gradle.kts
├── backend/gradle.properties
├── frontend/src/             (25 TypeScript/TSX/CSS files)
├── frontend/package.json
├── frontend/package-lock.json
├── frontend/tsconfig.json
├── frontend/vite.config.ts
├── src-tauri/src/            (3 Rust source files)
├── src-tauri/Cargo.toml
├── src-tauri/Cargo.lock
├── src-tauri/tauri.conf.json
├── docs/                     (115 markdown files)
├── AGENTS.md
└── .gitignore

manifest.json contains:
- checkpointId: checkpoint-2026-10-31-005303
- timestamp: 2026-10-31T15:19:25.000Z
- gitCommit: e3d25c7e89a7c8e85549787bd2134937cc8a0660
- totalFiles: 194
- totalBytes: 1777913
- files: [{Path, SHA256, Size}, ...]
```

## Verification

Sample hash verification performed on 3 files comparing original source to snapshot copy - all matched.

## Recovery Procedure

```powershell
# View snapshot
Get-ChildItem E:\HK1_2026_2027\PhotoboothDesktop_v2\.checkpoints\checkpoint-2026-10-31-005303\source -Recurse

# Verify manifest
Get-Content E:\HK1_2026_2027\PhotoboothDesktop_v2\.checkpoints\checkpoint-2026-10-31-005303\manifest.json | ConvertFrom-Json

# To restore (if current source damaged):
# 1. Backup current state
# 2. Copy from .checkpoints/checkpoint-2026-10-31-005303/source/* to workspace root
# 3. Verify hashes against manifest
# 4. Restore dependencies: npm install, gradle wrapper
```

## Consequences

- ✅ Recoverable baseline established independent of Git
- ✅ Dirty worktree state preserved (untracked docs captured)
- ✅ Manifest enables hash verification of restored files
- ✅ Application edits now authorized with rollback capability
- ⚠️ Snapshot is local only (not version controlled)
- ⚠️ Does not include dependencies (npm_modules, .gradle caches)

## Related

- Checkpoint documented in: `docs/CHECKPOINT.md`
- Architecture decisions: `docs/ARCHITECTURE_BASELINE_MIGRATION.md`
- Test fixes approved: `docs/ADR/013-tools-slice-priority.md`
