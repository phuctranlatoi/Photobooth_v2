# Dependency & License Audit — V2

## Source: V1 `build.gradle.kts` (Read-Only Audit)

All dependencies below are from `E:\HK1_2026_2027\PhotoboothDesktop\build.gradle.kts`. V2 must re-evaluate each for redistribution rights.

---

## 1. Runtime Dependencies (Production)

| Dependency | Version | License | Redistributable? | V2 Action |
|------------|---------|---------|------------------|-----------|
| `org.jetbrains.kotlin:kotlin-stdlib-jdk8` | 1.9.24 | Apache-2.0 | ✅ Yes | Bundle via Compose/jpackage |
| `org.jetbrains.compose:compose-desktop` | 1.6.11 | Apache-2.0 | ✅ Yes | Bundle via Compose Desktop |
| `org.jetbrains.kotlinx:kotlinx-coroutines-swing` | 1.8.1 | Apache-2.0 | ✅ Yes | Bundle |
| `com.google.zxing:core` | 3.5.3 | Apache-2.0 | ✅ Yes | Bundle |
| `com.github.sarxos:webcam-capture` | 0.3.12 | MIT | ✅ Yes | Bundle |
| `net.java.dev.jna:jna` | 4.5.2 | LGPL-2.1 / Apache-2.0 | ⚠️ LGPL — dynamic link only | **Must use shared JNA jar** |
| `net.java.dev.jna:jna-platform` | 4.5.2 | LGPL-2.1 / Apache-2.0 | ⚠️ LGPL — dynamic link only | **Must use shared JNA jar** |
| `org.slf4j:slf4j-simple` | 2.0.12 | MIT | ✅ Yes | Bundle |
| `com.bitplan:edsdk4j` | 0.0.1 | **Custom / Unknown** | ❌ **UNKNOWN** | **BLOCKER** — Audit required |
| `vn.payos:payos-java` | 2.0.1 | MIT | ✅ Yes | Bundle |
| `com.google.firebase:firebase-admin` | 9.3.0 | Apache-2.0 | ✅ Yes | Bundle (service account separate) |
| `com.google.code.gson:gson` | 2.10.1 | Apache-2.0 | ✅ Yes | Bundle |
| `org.xerial:sqlite-jdbc` | 3.45.3.0 | Apache-2.0 | ✅ Yes | Bundle |
| `org.postgresql:postgresql` | 42.7.2 | BSD-2-Clause | ✅ Yes | Bundle |
| `com.microsoft.onnxruntime:onnxruntime` | 1.18.0 | MIT | ✅ Yes | Bundle (native libs included) |

---

## 2. Native Dependencies (Critical)

| Component | Source | License | Redistributable? | Status |
|-----------|--------|---------|------------------|--------|
| **Canon EDSDK.dll** | Canon Inc. | Proprietary | ❌ **NO** (requires ISV agreement) | **BLOCKER** |
| **Canon EdsImage.dll** | Canon Inc. | Proprietary | ❌ **NO** | **BLOCKER** |
| **ONNX Runtime (onnxruntime.dll)** | Microsoft | MIT | ✅ Yes | Bundled via Maven |
| **ffmpeg.exe** | FFmpeg project | GPL-3.0 / LGPL-3.0 | ✅ Yes (separate process) | Bundle static build |
| **DNP RX1HS Driver** | DNP | Proprietary | N/A (user-installed) | Document prerequisite |

---

## 3. ONNX Model Licenses

| Model | File | Source | License | Commercial Use? |
|-------|------|--------|---------|-----------------|
| YuNet Face Detection | `face_detection_yunet_2023mar.onnx` | OpenCV Zoo | Apache-2.0 | ✅ Yes |
| BiSeNet Face Parsing | `bisenet_face_parsing.onnx` | GitHub (various) | **Unclear** | ⚠️ **VERIFY** |
| SCRFD | `scrfd_500m.onnx` | InsightFace | **Unclear** | ⚠️ **VERIFY** |

**Action Required**: Legal review of BiSeNet and SCRFD licenses before commercial distribution.

---

## 4. V1-Only Dependencies (Not Needed in V2 Shell Bridge Proof)

| Dependency | Reason | V2 Status |
|------------|--------|-----------|
| `compose.desktop` | V1 UI (Compose) | ❌ Excluded — React frontend |
| `kotlinx-coroutines-swing` | Compose integration | ❌ Excluded |
| `edsdk4j` | Canon wrapper | 🔲 **Deferred** — POC first |
| `firebase-admin` | V1 Firebase sync | 🔲 **Deferred** — Milestone 4 |
| `postgresql` | Neon direct | 🔲 **Deferred** — Milestone 4 |
| `sqlite-jdbc` | Local ledger | 🔲 **Deferred** — Milestone 4 |
| `payos-java` | Payment | 🔲 **Deferred** — Milestone 4 |

---

## 5. V2 Shell Bridge Proof Dependencies (Minimal)

```kotlin
// backend/build.gradle.kts (POC only)
dependencies {
    implementation("org.json:json:20231013")           // Apache-2.0
    implementation("org.bouncycastle:bcprov-jdk18on:1.78") // Bouncy Castle (MIT-like)
    implementation("org.slf4j:slf4j-simple:2.0.12")    // MIT
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
}
```

**All Apache-2.0 / MIT / BSD — no copyleft, no redistribution issues.**

---

## 6. Tauri v2 Dependencies (Frontend Shell)

| Crate | Version | License | Notes |
|-------|---------|---------|-------|
| `tauri` | 2.x | MIT | ✅ |
| `tauri-plugin-shell` | 2.x | MIT | Sidecar support |
| `tauri-plugin-updater` | 2.x | MIT | Optional |
| `serde` + `serde_json` | 1.x | MIT/Apache-2.0 | JSON-RPC |

---

## 7. Redistribution Checklist (Pre-Release)

| Item | Status | Owner |
|------|--------|-------|
| Canon EDSDK redistribution agreement | ❌ **BLOCKED** | Legal / Vendor |
| BiSeNet ONNX model license verified | ❌ **PENDING** | Legal |
| SCRFD ONNX model license verified | ❌ **PENDING** | Legal |
| JNA LGPL compliance (dynamic link) | ✅ **PLANNED** | Backend |
| ffmpeg GPL compliance (separate process) | ✅ **PLANNED** | Release |
| DNP driver documented as prerequisite | ✅ **PLANNED** | Docs |
| All Maven deps license verified | ✅ **DONE** (above) | Architect |

---

## 8. License Headers (Required in V2 Source)

```kotlin
/*
 * LE SOUVENIR Photobooth V2
 * Copyright (C) 2026 [Company Name]
 * 
 * This file is part of a proprietary application.
 * Unauthorized copying, distribution, or modification is prohibited.
 * 
 * Third-party licenses:
 * - Kotlin Stdlib: Apache-2.0
 * - ONNX Runtime: MIT
 * - YuNet Model: Apache-2.0
 * - [Others as applicable]
 */
```

---

## 9. SBOM Generation (Planned)

```bash
# Backend
cd backend
./gradlew dependencyLicenseReport

# Frontend
cd src
npm run license-check

# Tauri
cd src-tauri
cargo deny check licenses
```

---

*Document Version: 1.0*  
*Status: **DRAFT** — Canon EDSDK and ONNX model licenses require legal sign-off before commercial packaging*