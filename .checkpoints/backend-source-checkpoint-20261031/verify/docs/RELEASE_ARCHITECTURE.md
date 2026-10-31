# Release Architecture — V2 Distribution Strategy

## Overview

Defines the packaging, installation, update, and rollback strategy for V2. Based on V1 Compose Desktop packaging but adapted for Tauri v2 + JVM sidecar architecture.

---

## 1. Application Identity

| Attribute | V1 | V2 |
|-----------|-----|-----|
| **App ID** | `com.phuctran.photobooth.desktop` | `com.lesouvenir.photobooth.v2` |
| **Display Name** | "Le Souvenir Kiosk" | "LE SOUVENIR Photobooth" |
| **Package Name** | `PrettyBoothDesktop` | `LeSouvenirPhotoboothV2` |
| **Upgrade UUID** | `ce637e69-93f0-41d6-8092-8e4635c729ad` | **NEW UUID** (generate) |
| **Publisher** | (V1 cert) | **New certificate** |

---

## 2. Directory Structure (Installed)

```
%LOCALAPPDATA%\LeSouvenirPhotoboothV2\           ← App root (per-user install)
├── app\                                          ← Tauri + Frontend assets
│   ├── index.html
│   ├── assets\                                   ← JS/CSS (hashed)
│   └── ...
├── sidecar\                                      ← JVM backend
│   └── backend\                                  ← installDist output
│       ├── bin\backend.bat
│       └── lib\*.jar
├── resources\                                    ← Bundled resources
│   ├── models\                                   ← ONNX models
│   │   ├── face_detection_yunet_2023mar.onnx
│   │   ├── bisenet_face_parsing.onnx
│   │   └── scrfd_500m.onnx
│   ├── EDSDK_64\                                 ← **IF LICENSED**
│   │   ├── EDSDK.dll
│   │   └── EdsImage.dll
│   └── ffmpeg.exe                                ← Static build
├── data\                                         ← Runtime data (writable)
│   ├── sessions\                                 ← Per-session files
│   ├── output\                                   ← Final prints
│   ├── config\                                   ← filters.json, layouts
│   ├── filters\luts\                             ← .cube files
│   └── HotFolder\                                ← Test hot folder
├── logs\                                         ← Rotating logs
├── .env                                          ← Runtime config
└── uninstall.exe                                 ← Uninstaller
```

---

## 3. Build Pipeline

### 3.1 Backend (Kotlin/JVM)

```bash
# In backend/
./gradlew clean installDist
# Output: build/install/backend/
```

### 3.2 Frontend (React + Vite)

```bash
# In src/
npm run build
# Output: dist/
```

### 3.3 Tauri Bundle

```bash
# In src-tauri/
cargo tauri build --target x86_64-pc-windows-msvc
# Output: src-tauri/target/release/bundle/msi/LeSouvenirPhotoboothV2_<version>_x64.msi
```

### 3.4 Combined Installer (MSIX/MSI)

Tauri v2 produces MSI by default. For MSIX (Store-ready):

```json
// tauri.conf.json
{
  "bundle": {
    "targets": ["msi", "msix"],
    "windows": {
      "certificateThumbprint": "<CERT_THUMBPRINT>",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

---

## 4. JRE Bundling Strategy

| Approach | Tool | Pros | Cons |
|----------|------|------|------|
| **jpackage** | JDK 21 | Native installer, auto JRE | Separate from Tauri |
| **Compose Desktop** | Gradle plugin | Used in V1 | Tied to Compose UI |
| **Tauri sidecar + custom JRE** | Manual | Full control | More work |

**Decision**: Use **Compose Desktop's `nativeDistributions`** for backend-only JVM packaging, then integrate with Tauri sidecar. This reuses V1's working JRE bundling.

```kotlin
// backend/build.gradle.kts
compose.desktop {
    application {
        mainClass = "com.lesouvenir.photobooth.v2.ipc.IpcMainKt"
        nativeDistributions {
            targetFormats(TargetFormat.Msi)
            packageName = "LeSouvenirPhotoboothV2-Backend"
            packageVersion = project.version.toString()
            jpackageOptions {
                jvmArgs("--enable-preview") // if needed
            }
            windows {
                menu = false
                shortcut = false
                perUserInstall = true
            }
        }
    }
}
```

**Output**: `backend/build/compose/binaries/main/msi/LeSouvenirPhotoboothV2-Backend-<version>.msi`

Then Tauri sidecar points to the installed backend location.

---

## 5. Canon EDSDK Distribution

### 5.1 Current Blocker

**Cannot bundle EDSDK.dll / EdsImage.dll without Canon ISV redistribution license.**

### 5.2 Mitigation Strategies

| Strategy | Description | Effort |
|----------|-------------|--------|
| **User installs Canon EOS Utility** | App searches known install paths | Low |
| **Canon ISV Agreement** | Apply for redistribution rights | High (legal) |
| **Alternative: HotFolder only** | Sony/other cameras via folder watch | Medium |
| **Alternative: Webcam only** | DroidCam / USB webcam | Low |

### 5.3 Runtime DLL Resolution (Implemented in Backend)

```kotlin
object CanonDllResolver {
    fun resolve(): Path {
        return listOf(
            // 1. Bundled (if licensed)
            Path.of(System.getProperty("compose.application.resources.dir", ""), "EDSDK_64"),
            // 2. System PATH
            System.getenv("PATH")?.split(";")?.firstOrNull { 
                Files.isRegularFile(Path.of(it, "EDSDK.dll")) 
            }?.let { Path.of(it) },
            // 3. Canon default install
            Path.of("C:/Program Files/Canon/EDSDK/EDSDK_64"),
            Path.of("C:/Program Files (x86)/Canon/EDSDK/EDSDK_64")
        ).firstOrNull { Files.isRegularFile(it.resolve("EDSDK.dll")) }
            ?: error("Canon EDSDK not found. Install Canon EOS Utility or contact vendor.")
    }
}
```

---

## 6. Configuration & Secrets

### 6.1 Config File Locations (Priority Order)

1. `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\.env` (runtime, writable)
2. `<install-dir>\resources\.env` (bundled defaults, read-only)
3. System environment variables

### 6.2 Secret Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| `BOOTH_API_KEY` | `.env` (file, user-only ACL) | Manual |
| `NEON_DATABASE_URL` | `.env` | Manual |
| `CLOUDINARY_*` | `.env` | Manual |
| `PAYOS_*` | `.env` | Manual |
| `PHOTOBOOTH_IPC_SECRET` | Generated at install, stored in `.env` | Per-install |

**Never** commit `.env` to git. Installer generates `PHOTOBOOTH_IPC_SECRET` on first run.

---

## 7. Update Strategy

### 7.1 Tauri Updater (Frontend + Shell)

```json
// tauri.conf.json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://releases.lesouvenir.vn/v2/{{target}}/{{current_version}}"],
      "dialog": true,
      "pubkey": "<PUBLIC_KEY>"
    }
  }
}
```

- Checks on startup (background)
- Downloads delta or full MSI
- Silent install on next launch

### 7.2 Backend Updates

- Backend version pinned in `tauri.conf.json` → `bundle.externalBin`
- Full app update required for backend changes
- **No hot-patching** of JVM sidecar

---

## 8. Rollback Strategy

| Scenario | Rollback Mechanism |
|----------|-------------------|
| **Frontend/Shell broken** | Tauri updater: previous version MSI cached in `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\updates\` |
| **Backend broken** | Previous backend MSI cached; reinstall via "Repair" in Windows Apps |
| **Config corrupted** | Delete `.env` → app recreates defaults on launch |
| **Data migration failed** | `data/` untouched by uninstall; manual recovery |

### 8.1 Uninstall Behavior

```xml
<!-- WiX/MSI: Preserve user data on uninstall -->
<ComponentGroup Id="UserData">
  <Component Directory="APPDATA_DIR" Guid="*">
    <CreateFolder />
    <RemoveFolder Id="PurgeData" On="uninstall" Property="PURGE_DATA" />
    <Condition><![CDATA[PURGE_DATA = "1"]]></Condition>
  </Component>
</ComponentGroup>
```

- Default uninstall **keeps** `data/`, `logs/`, `.env`
- Full purge: `msiexec /x {GUID} PURGE_DATA=1`

---

## 9. Installer Smoke Tests (Automated)

```powershell
# scripts/smoke_test.ps1
# Run after installer build

$installer = "src-tauri/target/release/bundle/msi/LeSouvenirPhotoboothV2_1.0.0_x64.msi"
$installDir = "$env:LOCALAPPDATA\LeSouvenirPhotoboothV2"

Write-Host "1. Install..." -ForegroundColor Cyan
msiexec /i $installer /qn /l*v install.log
if ($LASTEXITCODE -ne 0) { throw "Install failed" }

Write-Host "2. Verify structure..." -ForegroundColor Cyan
$required = @(
    "app\index.html",
    "sidecar\backend\bin\backend.bat",
    "resources\models\face_detection_yunet_2023mar.onnx",
    "resources\ffmpeg.exe"
)
$required | ForEach-Object {
    if (-not (Test-Path "$installDir\$_")) { throw "Missing: $_" }
}

Write-Host "3. Launch health check..." -ForegroundColor Cyan
$proc = Start-Process "$installDir\sidecar\backend\bin\backend.bat" -ArgumentList "--simulator" -PassThru
Start-Sleep 3
# Send health.check via stdin, verify response
$proc.Kill()

Write-Host "4. Uninstall (keep data)..." -ForegroundColor Cyan
msiexec /x $installer /qn
if ($LASTEXITCODE -ne 0) { throw "Uninstall failed" }

Write-Host "5. Verify data preserved..." -ForegroundColor Cyan
if (-not (Test-Path "$installDir\data")) { throw "Data deleted!" }
if (-not (Test-Path "$installDir\.env")) { throw "Config deleted!" }

Write-Host "=== SMOKE TEST PASSED ===" -ForegroundColor Green
```

---

## 10. Code Signing

| Artifact | Certificate | Timestamp |
|----------|-------------|-----------|
| `backend MSI` | EV Code Signing Cert | DigiCert |
| `Tauri MSI/MSIX` | EV Code Signing Cert | DigiCert |
| `backend.bat` | N/A (batch) | N/A |
| `ffmpeg.exe` | Verify upstream signature | N/A |

**SmartScreen reputation**: Build via CI with consistent cert; avoid "unknown publisher" warnings.

---

## 11. System Requirements (Documented for Users)

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS** | Windows 10 1909+ (64-bit) | Windows 11 22H2+ |
| **CPU** | x64, 2 cores | x64, 4+ cores |
| **RAM** | 4 GB | 8 GB+ |
| **GPU** | DirectX 11 (for WebView2) | DirectX 12 |
| **Disk** | 2 GB free | 5 GB+ (session storage) |
| **Display** | 1366×768 | 1920×1200 (16:10 touchscreen) |
| **Camera** | Canon EOS + EOS Utility **OR** Webcam | Canon EOS R series |
| **Printer** | DNP RX1HS driver installed | DNP RX1HS + dedicated USB |
| **Network** | Internet (PayOS, Cloudinary, Neon) | Stable broadband |

---

## 12. Kiosk Mode Deployment

### 12.1 Assigned Access (Windows Kiosk)

```powershell
# Run as Admin
$app = "LeSouvenirPhotoboothV2"
$kioskUser = "photobooth_kiosk"
New-LocalUser -Name $kioskUser -NoPassword
Set-AssignedAccess -AppUserModelId "${app}!App" -UserName $kioskUser
```

### 12.2 Auto-Start

- Installer creates `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` entry
- Or: Place shortcut in `shell:Startup` for kiosk user

### 12.3 Touch Optimization

- Disable touch keyboard auto-show: `TabTip.exe` suppression
- Set DPI awareness: `PerMonitorV2` in Tauri config
- Disable Windows gestures: `Edge UI` swipe disable via GPO

---

## 13. Release Checklist

| Item | Status | Owner |
|------|--------|-------|
| Canon EDSDK license secured | ❌ | Legal |
| BiSeNet/SCRFD licenses verified | ❌ | Legal |
| EV code signing cert obtained | 🔲 | Release |
| Tauri updater endpoint deployed | 🔲 | DevOps |
| MSI builds in CI (GitHub Actions) | 🔲 | DevOps |
| Smoke test automated in CI | 🔲 | QA |
| Kiosk deployment guide written | 🔲 | Docs |
| Rollback procedure tested | 🔲 | QA |
| Installer size < 500 MB | 🔲 | Release |

---

## 14. Versioning Scheme

```
MAJOR.MINOR.PATCH[-PRERELEASE]

Examples:
1.0.0           — First production release
1.0.1           — Bug fix (backend + frontend)
1.1.0           — New layout, config change
2.0.0           — Breaking IPC protocol, schema change
```

- Backend and Frontend **share version** (single release)
- IPC `protocolVersion` increments on MAJOR

---

*Document Version: 1.0*  
*Status: **DRAFT** — Depends on Canon EDSDK licensing resolution*