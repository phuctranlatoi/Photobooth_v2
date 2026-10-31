# LE SOUVENIR Photobooth V2 - Project Guardrails

## Absolute paths and isolation
- LEGACY V1 (READ ONLY): `E:\HK1_2026_2027\PhotoboothDesktop`
- NEW V2 (ONLY WRITE WORKSPACE): `E:\HK1_2026_2027\PhotoboothDesktop_v2`
- V1 is a reference, not a workspace. NEVER write, format, build, run, commit, switch branches, clean, reset, rename, move, or delete anything in V1.
- Do not run shell commands with a working directory in V1. Use read/grep/glob for V1 inspection.
- Do not modify V1's `.env`, `.git`, build directory, camera SDK installation, runtime configuration, or customer photos.
- Do not copy production secrets or customer images to V2. Never read `.env` credentials. Never expose secrets in tool outputs or reports.
- All implementation, tests, generated files, and documentation belong under V2 only.
- Commands running in shell require explicit approval. NEVER approve V1-mutating commands. Tool permission rules alone are not an OS-level sandbox.

## Product goal
Create a NEW independent Windows touchscreen-first photobooth application, NOT a refactor of V1.
- UI: React + TypeScript + Vite + Tailwind CSS and restrained Motion animations. Primary display 16:10 landscape touchscreen. No mouse/keyboard requirement for customer sessions.
- Desktop: Tauri v2 candidate, but only after proving a reliable packaged Kotlin/JVM sidecar and IPC. Evaluate Electron fallback if evidence requires it.
- Backend: reuse accepted stable Kotlin/JVM photography, camera SDK, printer, composition, LUT, and Beauty implementations by COPYING the required code into V2, preserving behavior.
- Canon SDK: DSLR discovery, Live View, capture, file transfer, reconnect; webcam and Hot Folder alternatives.
- DNP RX1HS: existing Windows print driver, accurate 5x15 cm and 10x15 cm layouts, current supported cut flow, printer queue/error states. Never submit a real print without approval.
- Beauty: preserve existing accepted YuNet/BiSeNet/Beauty algorithm, models, thresholds, presets, and fallback. No new algorithm research.
- Business: reuse existing Neon architecture and APIs, PayOS, Cloudinary, QR, pricing and session IDs. Revenue only after successful Confirm & Print. No live writes in tests.
- Layout-specific photo counts and countdowns are configurable. NEVER hardcode example values. Preserve state machine and cancellation rules.
- Use separate app identity, installer, config, test Hot Folder, output paths, and logging to avoid collisions with V1.
- Verify exact redistribution rights for Canon SDK, ONNX weights, and dependencies before commercial packaging.

## Milestone gates
1. Legacy audit: inventory ALL V1 features/source entry points and write docs to V2. No V2 app implementation yet.
2. Hardware bridge proof: reliable React-to-Kotlin communication, Canon SDK startup feasibility, DNP printer discovery in safe read-only mode, shutdown and packaging feasibility.
3. Touchscreen design system and full mock-state UI.
4. Feature integration, preserving all real backend functionality.
5. Regression, kiosk hardware verification, installer, release readiness.
- Each milestone requires evidence, changed files, tests, known gaps, and confirmation that V1 was untouched.
- Do not claim hardware support complete based on mock data.
- If functionality or technology is uncertain, inspect V1 and document facts; never invent implementation details.

## Agent workflow
- Orchestrator manages plan and delegates to specialist subagents. Specialists may write only into V2.
- Auditor first; Architect establishes contracts; Camera/Printer prove hardware; UI Designer sets design system; Frontend/Backend implement; Tester-Reviewer validates.
- Do not launch all specialists to edit the same files simultaneously. Assign non-overlapping file ownership.
- Keep small, testable changes. Do not merge, push, publish, or perform real payments/prints without explicit user approval.
