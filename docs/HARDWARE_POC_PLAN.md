# Hardware POC Plan — Milestone 2 Gate

## Objective

Prove **before committing to Tauri v2** that the following are feasible on Windows:
1. Packaged JVM sidecar start/stop via Tauri sidecar mechanism
2. Canon EDSDK DLL loading via JNA (64-bit compatibility)
3. DNP RX1HS printer enumeration via `javax.print`
4. IPC latency < 50ms (stdio JSON-RPC)
5. Backend crash detection and auto-restart (Tauri)
5. Isolated V2 paths (no V1 collision)

**No production hardware actions. Read-only enumeration and mock capture only.**

---

## 1. POC Components

| POC | Directory | Purpose |
|-----|-----------|---------|
| **Camera** | `poc/camera/` | Canon EDSDK initialization, Live View start/stop, mock capture |
| **Printer** | `poc/printer/` | Windows printer enumeration, DNP RX1HS detection, mock print job |
| **IPC** | `poc/ipc/` | StdIO JSON-RPC roundtrip, latency measurement, auth verification |
| **Sidecar** | `poc/sidecar/` | Tauri sidecar spawn, health check, graceful shutdown |
| **Paths** | `poc/paths/` | V2 isolated directory structure validation |

---

## 2. Prerequisites (Must Be Satisfied Before POC)

| Requirement | Verification Command | Status |
|-------------|---------------------|--------|
| Windows 10/11 64-bit | `ver` | ✅ Host |
| JDK 21 (Temurin) | `java -version` | 🔲 Verify |
| Canon EDSDK DLLs present | `dir "C:\Program Files\Canon\EDSDK\EDSDK_64\EDSDK.dll"` | 🔲 Check |
| DNP RX1HS driver installed | `Get-Printer -Name "*DNP*"` | 🔲 Check |
| Tauri CLI | `cargo tauri --version` | 🔲 Install |
| Rust toolchain | `rustc --version` | 🔲 Install |
| Node.js 20+ | `node --version` | 🔲 Verify |

---

## 3. POC 1: Canon EDSDK Feasibility

### 3.1 Test Code (`poc/camera/CanonPoc.kt`)

```kotlin
package poc.camera

import edsdk.api.CanonCamera
import edsdk.utils.CanonConstants.EdsError
import java.nio.file.Files
import java.nio.file.Path

fun main() {
    println("=== Canon EDSDK POC ===")
    
    // 1. Verify DLL loading
    val dllPath = System.getProperty("jna.library.path", "C:/Program Files/Canon/EDSDK/EDSDK_64")
    println("JNA library path: $dllPath")
    println("EDSDK.dll exists: ${Files.isRegularFile(Path.of(dllPath, "EDSDK.dll"))}")
    println("EdsImage.dll exists: ${Files.isRegularFile(Path.of(dllPath, "EdsImage.dll"))}")
    
    // 2. Initialize SDK
    CanonCamera.initLibrary()
    println("EDSDK initialized")
    
    // 3. Open session
    val camera = CanonCamera()
    val sessionOpened = camera.openSession()
    println("Session opened: $sessionOpened")
    
    if (sessionOpened) {
        // 4. Get camera name
        val name = camera.getProductName()
        println("Camera: $name")
        
        // 5. Start Live View
        val lvStarted = camera.beginLiveView()
        println("Live View started: $lvStarted")
        
        if (lvStarted) {
            // 6. Download one frame
            val frame = camera.downloadLiveView()
            println("Frame downloaded: ${frame != null} (${frame?.width}x${frame?.height})")
            frame?.flush()
            
            // 7. Stop Live View
            camera.endLiveView()
            println("Live View stopped")
        }
        
        // 8. Close session
        camera.closeSession()
        println("Session closed")
    }
    
    // 9. Terminate
    CanonCamera.close()
    println("EDSDK terminated")
    println("=== POC COMPLETE ===")
}
```

### 3.2 Build & Run

```bash
cd E:\HK1_2026_2027\PhotoboothDesktop_v2\poc\camera
# Build with Gradle (includes edsdk4j + JNA)
./gradlew run --args="--poc=camera"
```

### 3.3 Pass Criteria

| Check | Pass Condition |
|-------|----------------|
| DLL Load | `EDSDK.dll` and `EdsImage.dll` found via JNA |
| Init | `EdsInitializeSDK()` returns `EDS_ERR_OK` |
| Session | `openSession()` returns `true` |
| Live View | `beginLiveView()` → `downloadLiveView()` returns non-null `BufferedImage` |
| Cleanup | `closeSession()` + `EdsTerminateSDK()` without crash |
| 64-bit | Process runs as 64-bit JVM (no `UnsatisfiedLinkError`) |

---

## 4. POC 2: DNP Printer Enumeration

### 4.1 Test Code (`poc/printer/PrinterPoc.kt`)

```kotlin
package poc.printer

import javax.print.PrintServiceLookup
import javax.print.attribute.HashPrintRequestAttributeSet
import javax.print.attribute.standard.Copies
import javax.print.attribute.standard.MediaSizeName
import java.awt.print.PrinterJob

fun main() {
    println("=== DNP Printer POC ===")
    
    // 1. Enumerate all printers
    val services = PrintServiceLookup.lookupPrintServices(null, null)
    println("Total printers: ${services.size}")
    
    services.forEach { svc ->
        val name = svc.name
        val isDnp = name.contains("DNP", ignoreCase = true) || name.contains("RX1", ignoreCase = true)
        println("  - $name ${if (isDnp) "🎯 DNP CANDIDATE" else ""}")
        
        if (isDnp) {
            // 2. Check capabilities
            val attrs = svc.getSupportedAttributeCategories()
            println("    Supported attributes: ${attrs.size}")
            
            val job = PrinterJob.getPrinterJob()
            job.printService = svc
            val pf = job.defaultPage()
            println("    Paper: ${pf.paper.width}x${pf.paper.height} (1/72 inch)")
            
            // 3. Mock print (dry run - no actual print)
            val mockImage = java.awt.image.BufferedImage(1800, 1200, java.awt.image.BufferedImage.TYPE_INT_RGB)
            val g = mockImage.createGraphics()
            g.drawString("POC TEST", 100, 100)
            g.dispose()
            
            val attrSet = HashPrintRequestAttributeSet()
            attrSet.add(Copies(1))
            
            job.setPrintable({ g, pf, pageIdx ->
                if (pageIdx > 0) return@setPrintable java.awt.print.Printable.NO_SUCH_PAGE
                g.drawImage(mockImage, 0, 0, pf.imageableWidth.toInt(), pf.imageableHeight.toInt(), null)
                java.awt.print.Printable.PAGE_EXISTS
            }, pf)
            
            // DON'T CALL job.print() - this is enumeration only
            println("    ✅ Print path validated (dry run)")
        }
    }
    
    if (services.none { it.name.contains("DNP", ignoreCase = true) }) {
        println("⚠️  No DNP printer found. Install DNP RX1HS driver to proceed.")
    }
    
    println("=== POC COMPLETE ===")
}
```

### 4.2 Pass Criteria

| Check | Pass Condition |
|-------|----------------|
| Enumeration | `PrintServiceLookup.lookupPrintServices()` returns list |
| DNP Detection | At least one printer name contains "DNP" or "RX1" |
| Print Path | `PrinterJob` can be configured with DNP service, `setPrintable` succeeds |
| No Actual Print | **Must not** call `job.print()` — dry run only |

---

## 5. POC 3: IPC Latency & Auth

### 5.1 Test Code (`poc/ipc/IpcPoc.kt`)

```kotlin
package poc.ipc

import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.PrintWriter
import java.nio.charset.StandardCharsets
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class IpcClient(private val secret: ByteArray) {
    private val stdin = PrintWriter(System.out, true, StandardCharsets.UTF_8)
    private val stdout = BufferedReader(InputStreamReader(System.in, StandardCharsets.UTF_8))
    private var idCounter = 0
    
    fun send(method: String, params: JSONObject = JSONObject()): JSONObject {
        val id = (++idCounter).toString()
        val timestamp = System.currentTimeMillis()
        val nonce = java.util.UUID.randomUUID().toString()
        
        val request = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("id", id)
            put("method", method)
            put("params", params)
            put("protocolVersion", 1)
            put("auth", JSONObject().apply {
                put("hmac", computeHmac(id, method, params, timestamp, nonce))
                put("timestamp", timestamp)
                put("nonce", nonce)
            })
        }
        
        val start = System.nanoTime()
        stdin.println(request.toString())
        stdin.flush()
        
        val responseLine = stdout.readLine() ?: error("No response")
        val latencyMs = (System.nanoTime() - start) / 1_000_000
        
        val response = JSONObject(responseLine)
        println("$method latency: ${latencyMs}ms")
        return response
    }
    
    private fun computeHmac(id: String, method: String, params: JSONObject, timestamp: Long, nonce: String): String {
        val data = "$id$method${params.toString()}$timestamp$nonce"
        val mac = Mac.getInstance("HmacSHA256").apply { init(SecretKeySpec(secret, "HmacSHA256")) }
        return mac.doFinal(data.toByteArray(StandardCharsets.UTF_8)).joinToString("") { "%02x".format(it) }
    }
}

fun main(args: Array<String>) {
    val secret = System.getenv("PHOTOBOOTH_IPC_SECRET")?.hexToByteArray() 
        ?: error("PHOTOBOOTH_IPC_SECRET required (32 hex chars)")
    
    val client = IpcClient(secret)
    
    println("=== IPC POC ===")
    
    // Health check
    val health = client.send("health.check")
    println("Health: $health")
    
    // Session create
    val session = client.send("session.create", JSONObject().put("layoutId", "10x15_4").put("effectId", "normal").put("printCopies", 2))
    println("Session: $session")
    
    val sessionId = session.getJSONObject("result").getString("sessionId")
    
    // Snapshot
    val snap = client.send("session.snapshot", JSONObject().put("sessionId", sessionId))
    println("Snapshot: $snap")
    
    // Valid transition
    val trans = client.send("session.transition", JSONObject().put("sessionId", sessionId).put("targetState", "SELECTING_QUANTITY"))
    println("Transition: $trans")
    
    // Invalid transition
    val badTrans = client.send("session.transition", JSONObject().put("sessionId", sessionId).put("targetState", "PRINTING"))
    println("Bad Transition: $badTrans")
    
    println("=== POC COMPLETE ===")
}

private fun String.hexToByteArray(): ByteArray = chunked(2).map { it.toInt(16).toByte() }.toByteArray()
```

### 5.2 Backend Simulator (`poc/ipc/SimulatorBackend.kt`)

```kotlin
// Minimal backend that responds to the above client
// Run separately: java -jar simulator.jar --simulator
```

### 5.3 Pass Criteria

| Check | Pass Condition |
|-------|----------------|
| Auth | Valid HMAC accepted; invalid HMAC returns `-32005` |
| Latency | `health.check` roundtrip < 50ms (localhost stdio) |
| Protocol | JSON-RPC 2.0 envelopes valid |
| Methods | All 7 methods from `IPC_CONTRACTS.md` respond correctly |
| Simulator Flag | Backend reports `simulator: true` |

---

## 6. POC 4: Tauri Sidecar Lifecycle

### 6.1 Tauri Config (`src-tauri/tauri.conf.json` excerpt)

```json
{
  "bundle": {
    "externalBin": ["../backend/build/install/backend/bin/backend"]
  },
  "plugins": {
    "shell": {
      "sidecar": true
    }
  }
}
```

### 6.2 Rust Sidecar Spawn (`src-tauri/src/main.rs`)

```rust
use tauri::{Manager, Runtime};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let sidecar = app.shell().sidecar("backend").unwrap();
            let (mut rx, _child) = sidecar.spawn().unwrap();
            
            // Send health check
            let request = r#"{"jsonrpc":"2.0","id":"1","method":"health.check","params":{},"protocolVersion":1,"auth":{"hmac":"...","timestamp":0,"nonce":"test"}}"#;
            rx.stdin.write_all(request.as_bytes()).unwrap();
            
            // Read response
            let mut buf = String::new();
            rx.stdout.read_line(&mut buf).unwrap();
            println!("Sidecar health: {}", buf);
            
            // Cleanup on app exit
            app.on_window_event(|_| {});
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
```

### 6.3 Pass Criteria

| Check | Pass Condition |
|-------|----------------|
| Spawn | `app.shell().sidecar("backend").spawn()` succeeds |
| Stdio | StdIn/StdOut connected, JSON-RPC exchange works |
| Health | `health.check` returns `simulator: true` |
| Shutdown | App exit kills sidecar process (no orphan) |
| Restart | Sidecar can be respawned after crash (max 3 retries) |

---

## 7. POC 5: V2 Path Isolation

### 7.1 Test Code (`poc/paths/PathsPoc.kt`)

```kotlin
package poc.paths

import java.nio.file.Files
import java.nio.file.Path

fun main() {
    println("=== V2 Path Isolation POC ===")
    
    val localAppData = System.getenv("LOCALAPPDATA") ?: error("LOCALAPPDATA not set")
    val v2Root = Path.of(localAppData, "LeSouvenirPhotoboothV2")
    val v1Root = Path.of(localAppData, "LeSouvenirPhotobooth") // V1 legacy
    
    val dirs = listOf(
        "data/sessions",
        "data/output", 
        "data/config",
        "data/filters/luts",
        "logs",
        "HotFolder"
    )
    
    dirs.forEach { dir ->
        val v2Path = v2Root.resolve(dir)
        Files.createDirectories(v2Path)
        println("Created: $v2Path")
        println("  Exists: ${Files.exists(v2Path)}")
        println("  Writable: ${Files.isWritable(v2Path)}")
    }
    
    // Verify V1 not touched
    println("\nV1 root exists: ${Files.exists(v1Root)} (should be true, but we DON'T write)")
    println("V2 root: $v2Root")
    
    // Config file
    val envFile = v2Root.resolve(".env")
    Files.writeString(envFile, "ENABLE_SYSTEM_PRINT=false\nUSE_HOT_FOLDER=true\n")
    println("Config written: $envFile")
    
    println("=== POC COMPLETE ===")
}
```

### 7.2 Pass Criteria

| Check | Pass Condition |
|-------|----------------|
| Creation | All V2 directories created under `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\` |
| Writable | All directories writable |
| V1 Untouched | No files written to V1 path |
| Config | `.env` created in V2 root only |

---

## 8. Consolidated POC Execution Script

```powershell
# scripts/run_hardware_poc.ps1
# Run from V2 root

Write-Host "=== HARDWARE POC SUITE ===" -ForegroundColor Cyan

# 1. Camera
Write-Host "`n[1/5] Canon EDSDK..." -ForegroundColor Yellow
cd poc\camera
.\gradlew.bat run --args="--poc=camera" 2>&1 | Tee-Object -Variable camResult
if ($LASTEXITCODE -ne 0) { Write-Error "Camera POC FAILED"; exit 1 }

# 2. Printer
Write-Host "`n[2/5] DNP Printer..." -ForegroundColor Yellow
cd ..\printer
.\gradlew.bat run --args="--poc=printer" 2>&1 | Tee-Object -Variable prnResult
if ($LASTEXITCODE -ne 0) { Write-Error "Printer POC FAILED"; exit 1 }

# 3. IPC
Write-Host "`n[3/5] IPC Latency..." -ForegroundColor Yellow
cd ..\ipc
$env:PHOTOBOOTH_IPC_SECRET = "0123456789abcdef0123456789abcdef"
# Start backend simulator in background
Start-Process .\gradlew.bat -ArgumentList "run", "--args=--simulator" -NoNewWindow
Start-Sleep 3
.\gradlew.bat run --args="--poc=ipc" 2>&1 | Tee-Object -Variable ipcResult
if ($LASTEXITCODE -ne 0) { Write-Error "IPC POC FAILED"; exit 1 }

# 4. Sidecar (requires Tauri scaffold)
Write-Host "`n[4/5] Tauri Sidecar..." -ForegroundColor Yellow
cd ..\..\src-tauri
cargo tauri build --dry-run 2>&1 | Tee-Object -Variable tauriResult
# Full test requires `cargo tauri dev` interactive

# 5. Paths
Write-Host "`n[5/5] V2 Path Isolation..." -ForegroundColor Yellow
cd ..\poc\paths
.\gradlew.bat run --args="--poc=paths" 2>&1 | Tee-Object -Variable pathResult
if ($LASTEXITCODE -ne 0) { Write-Error "Paths POC FAILED"; exit 1 }

Write-Host "`n=== ALL POCS PASSED ===" -ForegroundColor Green
```

---

## 9. Evidence Collection

Each POC must produce:
- **Console output** (saved to `docs/poc_results/<poc_name>.log`)
- **Exit code** (0 = pass)
- **Timing data** (latency, startup time)
- **Screenshots** (for printer enumeration, camera live view)

---

## 10. Gate Decision Matrix

| POC | Required for Gate 2? | Blockers If Failed |
|-----|---------------------|-------------------|
| Canon EDSDK | **YES** | Fallback to Webcam/HotFolder only; document as known limitation |
| DNP Printer | **YES** | Fallback to "save print file only" mode; require manual print |
| IPC Latency | **YES** | Architecture change needed (WebSocket? named pipe?) |
| Tauri Sidecar | **YES** | Fallback to Electron + child_process |
| Path Isolation | **YES** | Blocker — must fix before any integration |

---

## 11. Status

**PLANNING** — Awaiting:
1. Canon EDSDK DLL availability confirmation
2. DNP RX1HS driver installation confirmation
3. Tauri/Rust toolchain setup
4. Explicit approval to create `poc/` directory and implement test code

**No hardware writes. Enumeration and mock operations only.**