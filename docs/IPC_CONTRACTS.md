# IPC Contracts — V2 Shell Bridge Proof (Narrowed to health.check Only)

## Scope

This document defines the **sole IPC contract** for the V2 shell bridge proof (Milestone 2). It covers only:

- **Single method**: `health.check` — proves sidecar starts, communicates over stdio, reports simulator mode
- **No session, capture, beauty, print, or payment methods** — deferred until hardware POC passes
- **No events/notifications** — no async streaming in this phase

Full production IPC is **deferred** until Gate 2 (Hardware POC) validates Canon SDK + DNP printer paths.

---

## 1. Transport (Private Inherited Stdio)

| Property | Specification |
|----------|---------------|
| **Channel** | StdIn/StdOut pipes inherited from Tauri sidecar spawn (private, not network-exposed) |
| **Framing** | Length-prefixed: 4-byte big-endian unsigned int (message byte length) followed by UTF-8 JSON |
| **Max Frame** | 1 MiB (1,048,576 bytes) — oversize frames rejected with `-32600` |
| **Direction** | StdIn: Requests (Shell → Backend); StdOut: Responses (Backend → Shell) |
| **StdErr** | Diagnostics only (logging, stack traces) — **never** protocol messages |
| **Encoding** | UTF-8 only; no BOM |
| **Newlines** | Not used for framing; JSON may be minified |

### 1.1 Frame Format

```
[4 bytes: length N (big-endian)][N bytes: UTF-8 JSON]
```

Example (hex for `{"jsonrpc":"2.0","id":"1","method":"health.check","params":{},"protocolVersion":1}`):
```
00 00 00 5A 7B 22 6A 73 6F 6E 72 70 63 22 3A 22 32 2E 30 22 2C 22 69 64 22 3A 22 31 22 2C 22 6D 65 74 68 6F 64 22 3A 22 68 65 61 6C 74 68 2E 63 68 65 63 6B 22 2C 22 70 61 72 61 6D 73 22 3A 7B 7D 2C 22 70 72 6F 74 6F 63 6F 6C 56 65 72 73 69 6F 6E 22 3A 31 7D
```

---

## 2. Authentication — None (Private Pipe Threat Model)

**No HMAC, no shared secret, no auth envelope fields.**

### Rationale
- StdIn/StdOut pipes are **private to the parent-child process relationship** (Tauri spawns sidecar)
- No other process can inject into these pipes on Windows (inherited handles, no named pipe squatting)
- Threat model: local user with debug access already controls the machine; IPC auth adds no security boundary
- **Secret never enters frontend** — eliminates credential leakage risk

### Future (Production)
When production IPC adds named pipes / network exposure, HMAC-SHA256 with canonicalization will be specified in a separate ADR.

---

## 3. Protocol — JSON-RPC 2.0 (Subset)

### 3.1 Request (Shell → Backend)

```typescript
interface HealthCheckRequest {
  jsonrpc: "2.0";
  id: string;                    // Any string (echoed back); UUID v4 recommended
  method: "health.check";
  params: {};                    // Empty object
  protocolVersion: 1;            // Required
}
```

**Forbidden fields**: `auth`, `timestamp`, `nonce`, any other keys.

### 3.2 Response (Backend → Shell)

```typescript
interface HealthCheckResponse {
  jsonrpc: "2.0";
  id: string;                    // Echoed from request
  result: HealthCheckResult;     // Present on success
  error?: never;                 // Absent on success
  protocolVersion: 1;
}

interface HealthCheckResult {
  status: "ok";                  // Literal string
  protocolVersion: 1;            // Echoed
  simulator: true;               // Boolean; MUST be true for bridge proof
  backendPid: number;            // OS process ID
  uptimeMs: number;              // Milliseconds since JVM start
  jvmVersion: string;            // e.g., "21.0.2"
  availableMethods: ["health.check"]; // Array with exactly this one method
}
```

### 3.3 Error Response

```typescript
interface HealthCheckErrorResponse {
  jsonrpc: "2.0";
  id: string;
  result?: never;
  error: {
    code: -32600 | -32601 | -32602 | -32603;
    message: string;
    data?: unknown;
  };
  protocolVersion: 1;
}
```

| Code | Condition |
|------|-----------|
| -32600 | Invalid JSON, missing required fields, frame > 1 MiB |
| -32601 | `method` not `"health.check"` |
| -32602 | `params` not empty object, `protocolVersion` not `1` |
| -32603 | Internal error (JVM crash, OOM) |

---

## 4. Method: `health.check`

### 4.1 Purpose
Verify sidecar is alive, protocol version matches, simulator mode confirmed.

### 4.2 Request
```json
{"jsonrpc":"2.0","id":"1","method":"health.check","params":{},"protocolVersion":1}
```

### 4.3 Success Response
```json
{"jsonrpc":"2.0","id":"1","result":{"status":"ok","protocolVersion":1,"simulator":true,"backendPid":12345,"uptimeMs":1234,"jvmVersion":"21.0.2","availableMethods":["health.check"]},"protocolVersion":1}
```

### 4.4 Error Example
```json
{"jsonrpc":"2.0","id":"1","error":{"code":-32601,"message":"Method not found: session.create","data":null},"protocolVersion":1}
```

---

## 5. Backend Implementation Requirements (Minimal)

### 5.1 Entry Point

```kotlin
// backend/src/main/kotlin/com/lesouvenir/photobooth/v2/ipc/IpcMain.kt
package com.lesouvenir.photobooth.v2.ipc

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream
import java.lang.management.ManagementFactory

fun main(args: Array<String>) {
    require(args.contains("--simulator")) { "Bridge proof requires --simulator flag" }
    
    val startTime = System.currentTimeMillis()
    val pid = ManagementFactory.getRuntimeMXBean().name.split("@")[0].toIntOrNull() ?: -1
    val jvmVersion = System.getProperty("java.version")
    val gson = Gson()
    
    val stdin = DataInputStream(BufferedInputStream(System.`in`))
    val stdout = DataOutputStream(BufferedOutputStream(System.out))
    
    while (true) {
        // Read 4-byte length
        val lenBytes = ByteArray(4)
        val read = stdin.read(lenBytes)
        if (read != 4) break // EOF
        val length = ((lenBytes[0].toInt() and 0xFF) shl 24) or
                     ((lenBytes[1].toInt() and 0xFF) shl 16) or
                     ((lenBytes[2].toInt() and 0xFF) shl 8) or
                     (lenBytes[3].toInt() and 0xFF)
        
        if (length > 1_048_576) {
            sendError(stdout, gson, "1", -32600, "Frame exceeds 1 MiB")
            continue
        }
        
        val payload = ByteArray(length)
        stdin.readFully(payload)
        val requestJson = String(payload, "UTF-8")
        
        val responseJson = try {
            val req = JsonParser.parseString(requestJson).asJsonObject
            validateRequest(req)
            buildHealthResponse(gson, req.get("id").asString, startTime, pid, jvmVersion)
        } catch (e: Exception) {
            buildErrorResponse(gson, extractId(requestJson), -32600, e.message ?: "Invalid request")
        }
        
        sendResponse(stdout, responseJson)
    }
}

private fun validateRequest(req: JsonObject) {
    require(req.get("jsonrpc").asString == "2.0") { "jsonrpc must be 2.0" }
    require(req.get("method").asString == "health.check") { "Only health.check supported" }
    require(req.get("protocolVersion").asInt == 1) { "protocolVersion must be 1" }
    require(req.get("params").asJsonObject.size == 0) { "params must be empty" }
    // No auth field allowed
    require(!req.has("auth")) { "auth field not supported in bridge proof" }
}

private fun buildHealthResponse(gson: Gson, id: String, startTime: Long, pid: Int, jvmVersion: String): String {
    val result = JsonObject().apply {
        addProperty("status", "ok")
        addProperty("protocolVersion", 1)
        addProperty("simulator", true)
        addProperty("backendPid", pid)
        addProperty("uptimeMs", System.currentTimeMillis() - startTime)
        addProperty("jvmVersion", jvmVersion)
        add("availableMethods", gson.toJsonTree(listOf("health.check")))
    }
    val resp = JsonObject().apply {
        addProperty("jsonrpc", "2.0")
        addProperty("id", id)
        add("result", result)
        addProperty("protocolVersion", 1)
    }
    return gson.toJson(resp)
}

private fun buildErrorResponse(gson: Gson, id: String, code: Int, msg: String): String {
    val err = JsonObject().apply {
        addProperty("code", code)
        addProperty("message", msg)
    }
    val resp = JsonObject().apply {
        addProperty("jsonrpc", "2.0")
        addProperty("id", id)
        add("error", err)
        addProperty("protocolVersion", 1)
    }
    return gson.toJson(resp)
}

private fun extractId(json: String): String = try {
    JsonParser.parseString(json).asJsonObject.get("id").asString
} catch (e: Exception) { "1" }

private fun sendResponse(stdout: DataOutputStream, json: String) {
    val bytes = json.toByteArray(charset("UTF-8"))
    stdout.writeInt(bytes.size)
    stdout.write(bytes)
    stdout.flush()
}

private fun sendError(stdout: DataOutputStream, gson: Gson, id: String, code: Int, msg: String) {
    sendResponse(stdout, buildErrorResponse(gson, id, code, msg))
}
```

### 5.2 Dependencies (Exact)

```kotlin
// backend/build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.24"
    application
}

group = "com.lesouvenir.photobooth.v2"
version = "0.1.0-bridge-proof"

repositories { mavenCentral() }

dependencies {
    implementation("com.google.code.gson:gson:2.10.1")
    implementation("org.slf4j:slf4j-simple:2.0.12")
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
}

application {
    mainClass.set("com.lesouvenir.photobooth.v2.ipc.IpcMainKt")
}

tasks.withType<Test> { useJUnitPlatform() }
```

### 5.3 Packaging

```bash
cd E:\HK1_2026_2027\PhotoboothDesktop_v2\backend
./gradlew installDist
# Output: build/install/backend/bin/backend.bat (Windows)
```

---

## 6. Tauri Sidecar Integration (Feasibility)

### 6.1 `src-tauri/tauri.conf.json` (Excerpt)

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

### 6.2 `src-tauri/src/main.rs` (Minimal Spawn)

```rust
use tauri::{Manager, Runtime};

#[tauri::command]
async fn health_check(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let sidecar = app.shell().sidecar("backend")
        .map_err(|e| format!("Sidecar config error: {}", e))?;
    
    let (mut rx, _child) = sidecar.args(["--simulator"]).spawn()
        .map_err(|e| format!("Spawn failed: {}", e))?;
    
    // Send health.check request (length-prefixed)
    let request = r#"{"jsonrpc":"2.0","id":"1","method":"health.check","params":{},"protocolVersion":1}"#;
    let len = (request.len() as u32).to_be_bytes();
    use std::io::Write;
    rx.stdin.write_all(&len).map_err(|e| format!("Write len failed: {}", e))?;
    rx.stdin.write_all(request.as_bytes()).map_err(|e| format!("Write body failed: {}", e))?;
    rx.stdin.flush().map_err(|e| format!("Flush failed: {}", e))?;
    
    // Read 4-byte length
    let mut len_bytes = [0u8; 4];
    rx.stdout.read_exact(&mut len_bytes).map_err(|e| format!("Read len failed: {}", e))?;
    let length = u32::from_be_bytes(len_bytes) as usize;
    
    if length > 1_048_576 {
        return Err("Response exceeds 1 MiB".into());
    }
    
    let mut body = vec![0u8; length];
    rx.stdout.read_exact(&mut body).map_err(|e| format!("Read body failed: {}", e))?;
    let response = String::from_utf8(body).map_err(|e| format!("UTF-8 error: {}", e))?;
    
    serde_json::from_str(&response).map_err(|e| format!("JSON parse: {}", e))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![health_check])
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
```

### 6.3 Feasibility Criteria (Must Pass Before Any Other Work)

| Test | Command | Pass Condition |
|------|---------|----------------|
| Backend builds | `./gradlew installDist` | Exit 0, `backend.bat` exists |
| Backend runs manually | `./build/install/backend/bin/backend.bat --simulator` | Blocks on stdio, no crash |
| Manual health.check | Echo framed request to stdin | Valid framed response on stdout |
| Tauri spawns sidecar | `cargo tauri dev` | Sidecar process appears in Task Manager |
| Tauri ↔ sidecar stdio | Invoke `health_check` command | Returns `simulator: true`, `protocolVersion: 1` |
| Clean shutdown | Close Tauri window | Sidecar process exits (no orphan) |
| Stderr isolation | Check Tauri console | Only diagnostics on stderr, never JSON |

---

## 7. Explicit Non-Goals (This Contract)

- ❌ No `session.*`, `capture.*`, `beauty.*`, `print.*`, `payment.*` methods
- ❌ No events/notifications (no async JSON lines on stdout)
- ❌ No HMAC/auth
- ❌ No named pipes
- ❌ No Live View streaming
- ❌ No Canon EDSDK, ONNX, Print, Firebase, Neon, PayOS, ffmpeg
- ❌ No Compose Desktop, no React frontend

---

## 8. V1 Canon EOS Utility / CLI / HotFolder — UNVERIFIED

The following V1 camera adapters are **imported but not audited**; behavior and licensing are **UNVERIFIED**:

| Adapter | V1 File | Status |
|---------|---------|--------|
| `CliCaptureService` | `CliCaptureService.kt` | UNVERIFIED — external binary contract unknown |
| `EosUtilityCaptureService` | `EosUtilityCaptureService.kt` | UNVERIFIED — Canon EOS Utility license/redistribution unknown |
| `HotFolderCaptureService` | `HotFolderCaptureService.kt` | Observed (code read) — 15s poll timeout, no software trigger |

**No claims** about CLI/Utility/HotFolder reliability or licensing until specialist audit completes.

---

## 9. File Ownership (Bridge Proof Only)

| File | Owner | Status |
|------|-------|--------|
| `backend/src/main/kotlin/.../ipc/IpcMain.kt` | Backend Engineer | **PLANNED** |
| `backend/build.gradle.kts` | Backend Engineer | **PLANNED** |
| `src-tauri/tauri.conf.json` | Frontend Lead | **PLANNED** |
| `src-tauri/src/main.rs` | Frontend Lead | **PLANNED** |
| `scripts/bridge-proof/test_health.ps1` | Architect | **PLANNED** |

---

## 10. Acceptance Criteria (Bridge Proof Complete)

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | Backend builds with `./gradlew installDist` | Build log, exit 0 |
| 2 | Backend `--simulator` starts, blocks on stdio | Process stays alive, no stdout/stderr noise |
| 3 | Framed `health.check` request → valid framed response | Hex dump of stdin/stdout exchange |
| 4 | Tauri sidecar spawns backend | `cargo tauri dev` shows child process |
| 5 | Tauri `health_check` command returns `simulator: true` | Console log of invoke result |
| 6 | StdErr contains only diagnostics (no JSON) | Visual inspection of Tauri console |
| 7 | Closing Tauri kills sidecar (no orphan) | Task Manager verification |
| 8 | Frame > 1 MiB rejected with `-32600` | Test with oversized payload |

---

## 11. Status

**REVIEWED CONTRACT** — Ready for implementation by Backend Engineer (backend) and Frontend Lead (Tauri sidecar).

**No further approval needed** — User approved V2 builds. Proceed to implementation.

**Next deliverable**: Executable shell feasibility report (separate document) after criteria 1–8 pass.