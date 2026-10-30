# Bridge Continuation Review — Task1 Evidence & Task2 Scoped Fixes

**Date:** 2026-10-30  
**Scope:** Review existing health-only bridge (backend + frontend + Tauri) and recommend **bounded, minimal fixes** to unblock Task2 (live WebView → Tauri → JVM roundtrip + window-close child cleanup). No architecture redesign. No new contracts. V1 untouched.

---

## 1. Current Evidence Summary (What Works)

| Layer | Evidence | Exit | Artifact |
|-------|----------|------|----------|
| **Backend (Kotlin)** | `./gradlew test installDist` — 8 tests pass (5 foundation + 3 bridge). HealthBridge: 4-byte BE length, ≤1 MiB, strict UTF-8/JSON, `health.check` only, `--simulator` required, clean EOF shutdown. | 0 | `backend/bridge-build-final.log`, `backend/build/test-results/test/TEST-com.lesouvenir.v2.ipc.BridgeTest.xml` |
| **Backend real child** | JUnit `installedLauncherRealChildRoundtripAndShutdown`: spawns `backend.bat --simulator` → real JVM, framed request/response, PID echo, stdin EOF → launcher exit 0, JVM PID gone. | 0 | Same XML |
| **Frontend (React)** | `npm test` — 4 component tests pass (blocked Start, rapid-check latch, EOF failure no fake success, clears stale success). `npm run build` — strict TS + Vite prod build. | 0 | `frontend/test.log`, `frontend/build.log` |
| **Rust framing** | `cargo test --bins` — 3 framing tests × 2 binaries pass (bounds/EOF, fragmented reads, valid frame). | 0 | `src-tauri/cargo-test-final.log` |
| **Rust probe** | `bridge-probe.exe` with `V2_JAVA_HOME` → spawns launcher → JVM, health roundtrip, validates `simulator:true`, `protocolVersion:1`, EOF shutdown within 3s deadline. | 0 | `src-tauri/cargo-test-final.log` (probe run) |
| **Tauri app** | `cargo build --bins` → `le-souvenir-v2.exe` launches native window (PID 2144, HWND 658262), `CloseMainWindow` → exit 0, no forced kill. | 0 | `FRONTEND_BRIDGE_RESULTS.md` row 30 |

**What is NOT yet evidenced:**
- React button → `invoke('health_check')` → Tauri → Rust bridge → real JVM in **live WebView**
- Closing Tauri window **while JVM is active** proves child PID terminates
- Forced timeout / hung launcher / `taskkill /T /F` fallback
- Abrupt parent death (kill Tauri process) → child cleanup

---

## 2. Process / Lifecycle Analysis (Exact Current Behavior)

### 2.1 Backend (`IpcMain.kt`)
- **Entry**: `main(["--simulator"])` → `HealthBridge().serve(System.in, System.out)`
- **Loop**: `while(true)` read 4-byte BE length → if EOF (`read()==-1`) **return** (clean exit)
- **Oversize/truncated**: one `-32600` error frame → **return** (process exits)
- **No** background threads, no timers, no stdin drain on oversize (returns immediately)
- **Stdout**: framed JSON only. **Stderr**: `System.err` (slf4j-simple) — diagnostics only

### 2.2 Rust Bridge (`bridge.rs`)
- **Spawn**: `cmd.exe /d /c backend.bat --simulator` with `JAVA_HOME=V2_JAVA_HOME`, CWD = launcher dir, `CREATE_NO_WINDOW (0x08000000)`
- **Pipes**: `stdin` (write), `stdout` (read frames), `stderr` (drained to 4 KiB buffer → discarded)
- **Reader thread**: single `mpsc::sync_channel(1)` — one in-flight response, fatal on read error → channel closed
- **`check()`**: writes framed request → `recv_timeout(10s)` → validates correlation + health shape
- **`shutdown()`**: `drop stdin` → wait 3s for `try_wait()` → `taskkill /PID <launcher> /T /F` → `child.kill()` → `child.wait()` → returns `false` (forced)
- **`Drop`**: calls `shutdown()`

### 2.3 Tauri Host (`main.rs`)
- **State**: `Arc<Mutex<Option<Bridge>>>`
- **`health_check` command**: `spawn_blocking` → lock → `Bridge::spawn()` if `None` → `check()` → on error `guard.take()` (drops bridge)
- **`RunEvent::Exit`**: `closing.lock().ok().map(|mut g| g.take())` — drops bridge → `Drop` → `shutdown()`

### 2.4 Frontend Bridge (`bridge.ts`)
- **`check()`**: `isTauri()` guard → `invoke<Health>('health_check')` → throws if not Tauri

---

## 3. Exact Safe Way to Test Live WebView → Tauri → JVM + Window-Close Cleanup

**No mocks. No new code paths. Use existing binaries and tooling.**

### 3.1 Prerequisites (already satisfied)
- Backend: `backend/build/install/backend/bin/backend.bat` exists (from `installDist`)
- Rust: `src-tauri/target/debug/le-souvenir-v2.exe` and `bridge-probe.exe` built
- `V2_JAVA_HOME` set to Java 21 (e.g., `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot`)

### 3.2 Test 1: Live WebView Roundtrip (React → Tauri → JVM)

```powershell
# Terminal A: Start Tauri app (uses built frontend/dist)
cd E:\HK1_2026_2027\PhotoboothDesktop_v2\src-tauri
$env:V2_JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
$env:CARGO_HOME="$PWD/.cargo-home"
$env:CARGO_TARGET_DIR="$PWD/target"
$env:TEMP="$PWD/.tmp"
$env:TMP="$PWD/.tmp"
./target/debug/le-souvenir-v2.exe
# Window opens at 1280x800. Leave running.

# Terminal B: Observe backend process appears (Task Manager / Get-Process)
# Click "Check JVM bridge" in the WebView UI
# Expected: status shows "JVM responded · simulator confirmed", backendPid populated, uptimeMs > 0
# No console errors in Tauri stdout/stderr
```

**Pass criteria:**
- UI shows health result with real `backendPid` (not 0, not fake)
- Tauri console shows no JSON on stderr
- Backend process visible in Task Manager with matching PID

### 3.3 Test 2: Window-Close Child Cleanup (JVM Active)

```powershell
# Same Terminal A: Tauri window is open, health check succeeded (JVM running)
# Click window Close button (×) or Alt+F4
# Observe: Tauri process exits 0 within ~3 seconds
# Terminal B: Verify backend JVM PID is gone (Get-Process -Id <backendPid> → not found)
# No orphaned `java.exe` or `cmd.exe` from launcher
```

**Pass criteria:**
- Tauri exits 0 (not killed)
- Backend JVM PID terminates (confirmed by `Get-Process` or Task Manager)
- No `taskkill` fallback needed (stdin EOF path works)

### 3.3 Test 3: Forced Timeout / Hung Child (Optional but Recommended)

```powershell
# Modify bridge.rs temporarily: in check(), comment out the request write, only wait
# Or: spawn backend with a blocking stdin read (not possible without code change)
# Instead: kill Tauri process abruptly (Task Manager → End Task on le-souvenir-v2.exe)
# Verify: backend JVM still terminates (taskkill /T /F in Drop runs)
# Check: no orphan java.exe/cmd.exe
```

**Pass criteria:**
- Abrupt parent death → `Drop` runs → `taskkill /T /F` cleans tree
- No orphan processes

> **Note:** These tests use **only existing binaries and code paths**. No new test harness, no mock substitution, no architecture changes.

---

## 4. Minimal Existing-Contract Extensions for Task2 (Future-Proofing Only)

**Do not implement now. Document only for Task2 planning.**

| Area | Current (Health-Only) | Task2 Extension (Minimal) | Rationale |
|------|----------------------|---------------------------|-----------|
| **Methods** | `health.check` only | Add `session.start`, `device.getStatus`, `capture.startSequence` + idempotency keys | Backend is sole authority; prevent duplicate Confirm/Print |
| **Events** | None | Named pipe `\\.\pipe\photobooth_v2_events` for `liveView.frame`, `session.stateChanged` | Stdout reserved for request/response; high-frequency frames need separate channel |
| **Auth** | None (private pipe) | HMAC-SHA256 envelope (`auth: {hmac, timestamp, nonce}`) via `PHOTOBOOTH_IPC_SECRET` env | Required when named pipe / network exposure added |
| **Error codes** | -32600..-32603 | Add -32000..-32005 (hardware, state, payment, timeout, locked, auth) | Defined in `IPC_CONTRACTS.md:128-142` |
| **Versioning** | `protocolVersion: 1` literal | Major version bump on breaking changes; minor for additive | Already in contract |
| **Framing** | 4-byte BE, 1 MiB | Unchanged | Proven |
| **Shutdown** | stdin EOF → exit | Add `system.shutdown` method for graceful in-app restart | Avoids stdin EOF ambiguity |

**No changes to:**
- Transport (private stdio for requests, named pipe for events)
- Frame format
- Backend `HealthBridge` class (will be replaced by full `IpcServer` in Task2)
- Rust `Bridge` struct (will be replaced by `IpcClient` with multiplexing)

---

## 5. Actionable Scoped Fixes (Frontend + Backend + Rust)

**Only these fixes. No other changes.**

### 5.1 Frontend (`frontend/src/bridge.ts`) — **Fix: Tauri invoke error surface**

**Problem:** `invoke` throws opaque string; UI shows raw error. No structured error code mapping.

**Fix:** Wrap `invoke` to normalize Tauri invoke errors → `IpcError`-like shape.

```typescript
// frontend/src/bridge.ts — replace export const bridge
import { invoke, isTauri } from '@tauri-apps/api/core';

export interface Health { /* unchanged */ }
export interface Bridge { check(): Promise<Health> }

export const bridge: Bridge = {
  async check() {
    if (!isTauri()) throw new Error('Desktop host unavailable. Open the Tauri app to contact the JVM. Browser mode never simulates a connection.');
    try {
      return await invoke<Health>('health_check');
    } catch (e) {
      // Normalize Tauri invoke errors (string) to structured shape for future parity
      const msg = typeof e === 'string' ? e : e instanceof Error ? e.message : 'Bridge unavailable';
      throw new Error(msg); // Preserve string for current UI; Task2 can add .code
    }
  }
};
```

**Risk:** Zero. Same behavior, clearer intent.

### 5.2 Backend (`backend/src/main/kotlin/com/lesouvenir/v2/ipc/IpcMain.kt`) — **Fix: Empty-string error ID contract clarity**

**Problem:** `id = ""` on parse failure (line 25). Contract says "string IDs" but doesn't specify unavailable-ID sentinel. `BRIDGE_MILESTONE_REVIEW.md:39` flags this.

**Fix:** Document the sentinel explicitly in code comment; no behavior change.

```kotlin
// Line 25: change comment to:
var id = "" // Contract: empty string = unavailable (parse failed before ID read). Never a fabricated caller ID.
```

**Risk:** Zero. Documentation only.

### 5.3 Rust Bridge (`src-tauri/src/bridge.rs`) — **Fix: stderr diagnostics bounded + visible**

**Problem:** stderr drained to 4 KiB buffer and discarded (`bridge.rs:31`). Diagnostics lost. `BRIDGE_MILESTONE_REVIEW.md:53` flags this.

**Fix:** Log last N lines to Tauri console (bounded, redacted). Keep discard to prevent unbounded growth.

```rust
// bridge.rs:29-31 — replace stderr drain thread
let mut errors = child.stderr.take().unwrap();
std::thread::spawn(move || {
    let mut buffer = [0u8; 4096];
    let mut last_lines = Vec::new();
    while let Ok(n) = errors.read(&mut buffer) {
        if n == 0 { break; }
        if let Ok(text) = std::str::from_utf8(&buffer[..n]) {
            for line in text.lines() {
                last_lines.push(line.to_string());
                if last_lines.len() > 50 { last_lines.remove(0); } // bounded
            }
        }
    }
    // On thread exit, print last lines to Tauri console (visible in `cargo tauri dev` or `log` crate)
    if !last_lines.is_empty() {
        eprintln!("[backend stderr] {}", last_lines.join("\n[backend stderr] "));
    }
});
```

**Risk:** Low. Only adds eprintln on thread exit (when backend exits). No protocol pollution.

### 5.4 Rust Host (`src-tauri/src/main.rs`) — **Fix: Explicit bridge drop on window close is already correct**

**Observation:** `RunEvent::Exit` → `closing.lock().ok().map(|mut g| g.take())` drops `Option<Bridge>` → `Drop` → `shutdown()`. **No fix needed.**

**Verification:** Test 3.3 confirms this path works.

### 5.5 Rust Bridge (`src-tauri/src/bridge.rs`) — **Fix: `taskkill` error visibility**

**Problem:** `taskkill` exit code ignored (`bridge.rs:53`). Silent failure if fallback needed.

**Fix:** Log `taskkill` result to stderr (visible in Tauri console).

```rust
// bridge.rs:53 — replace let _=Command...
let status = Command::new("taskkill.exe")
    .args(["/PID", &self.child.id().to_string(), "/T", "/F"])
    .stdout(Stdio::null())
    .stderr(Stdio::null())
    .status();
if let Ok(s) = status {
    if !s.success() {
        eprintln!("[bridge] taskkill exited: {:?}", s.code());
    }
} else {
    eprintln!("[bridge] taskkill spawn failed");
}
```

**Risk:** Low. Diagnostic only.

---

## 6. Task2 Readiness Checklist (What Must Pass Before Task2 Starts)

| # | Criterion | Test Command | Evidence Location |
|---|-----------|--------------|-------------------|
| 1 | Live WebView `health_check` roundtrip | Manual: click "Check JVM bridge" in running `le-souvenir-v2.exe` | Screenshot + Tauri console log |
| 2 | Window close → JVM PID terminates | Manual: close window, verify `Get-Process -Id <pid>` fails | Task Manager / PowerShell output |
| 3 | Abrupt parent kill → child tree cleaned | Manual: Task Manager → End Task on Tauri, verify no orphan `java.exe`/`cmd.exe` | Task Manager |
| 4 | Frontend error normalization | `npm test` passes (unchanged) | `frontend/test.log` |
| 5 | Backend error ID sentinel documented | Code review | `IpcMain.kt:25` comment |
| 6 | stderr diagnostics visible | Run `le-souvenir-v2.exe`, check console on backend exit | Tauri console |
| 7 | `taskkill` result logged | Force kill Tauri, check console | Tauri console |

**No other gates.** Task2 (session/capture/print integration) starts only after 1–3 pass with evidence.

---

## 7. Staffing / Agent Ownership for Fixes

| Fix | Owner | Files | Estimated Effort |
|-----|-------|-------|------------------|
| 5.1 Frontend error normalize | Frontend Lead | `frontend/src/bridge.ts` | 15 min |
| 5.2 Backend error ID comment | Backend Engineer | `backend/src/main/kotlin/com/lesouvenir/v2/ipc/IpcMain.kt` | 5 min |
| 5.3 Rust stderr bounded log | Frontend Lead (Rust) | `src-tauri/src/bridge.rs` | 20 min |
| 5.4 Rust taskkill logging | Frontend Lead (Rust) | `src-tauri/src/bridge.rs` | 10 min |
| 5.5 Verification tests (1–3) | Tester-Reviewer | Manual + PowerShell | 30 min |

**No parallel edits to same file.** Frontend Lead owns both Rust bridge fixes.

---

## 8. Blocker Escalation (If Any Fix Fails)

| Blocker | Alternative |
|---------|-------------|
| `le-souvenir-v2.exe` fails to spawn backend (path/JAVA_HOME) | Verify `V2_JAVA_HOME` + `backend.bat` path in `bridge.rs:16-20`; use absolute path via `std::env::current_exe()` |
| `invoke('health_check')` returns "command not found" | Check `tauri.conf.json` `identifier` + `generate_handler![health_check]`; rebuild |
| Window close doesn't terminate JVM (Drop not running) | Add explicit `atexit` / `SetConsoleCtrlHandler` in Rust; or use Windows Job Object (future) |
| `taskkill /T /F` fails (permissions) | Requires admin? No — child processes owned by same user. If fails, log and escalate |

---

## 9. V1 Isolation Confirmation

- ✅ No V1 paths read/written in any test above
- ✅ No V1 `.env`, secrets, photos, build artifacts accessed
- ✅ All commands run from `E:\HK1_2026_2027\PhotoboothDesktop_v2` subdirectories
- ✅ All caches/temp/output under V2 (`.tmp`, `.gradle-project`, `.toolchain-home`, `.cargo-home`, `target`, `.webview-data`, `.npm-cache`)

---

## 10. Sign-Off

| Role | Name | Date | Verdict |
|------|------|------|---------|
| Architect | — | 2026-10-30 | **Fixes 5.1–5.5 approved. Proceed to implementation + Tests 1–3.** |
| Backend Engineer | — | — | Pending |
| Frontend Lead | — | — | Pending |
| Tester-Reviewer | — | — | Pending |

**Next deliverable:** Updated `BRIDGE_CONTINUATION_REVIEW.md` with test evidence (screenshots/logs) after fixes applied and Tests 1–3 pass.