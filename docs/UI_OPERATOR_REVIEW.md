# Narrow Operator API Review — Go/Block Decision

**Date:** 2026-10-30  
**Scope:** `UI_BACKEND_RESULTS.md` operator increment only. No app edits, no architecture changes.

---

## Verdict: **GO** for narrow developer UI testing (simulator only)

### Conditions Met — SOURCE REVIEW ONLY ✅

| Requirement | Status | Evidence (Source Review) |
|---|---|---|
| **No misleading auth** | ✅ | `accessMode:"LOCAL_DEVELOPMENT_ONLY"`, `productionAdminAcl:false` explicit in response spec |
| **No secret credentials** | ✅ | No password, token, HMAC, or secret in protocol; only `V2_LOCAL_OPERATOR_ENABLED=true` env opt-in |
| **Inherited env explicit** | ✅ | Backend process must be launched with `V2_LOCAL_OPERATOR_ENABLED=true`; default disabled (-32010) |
| **Not auto-enabled globally** | ✅ | Tauri bridge does not inject this env; developer must set in shell before launch |
| **Production features disabled** | ✅ | 9/10 capabilities `false`; `pricingEditable:false`; dryrun keeps `printAccepted:false`, `revenueRecorded:false` |
| **No session backend authority change** | ✅ | Customer flow unchanged; `operator.*` only works at `IDLE`; returns `-32001` otherwise |
| **Atomic V2-local persistence** | ✅ | `backend/config/local-operator-layouts.json` atomic replace; no V1 paths; corrupt fails closed |

**Note:** `UI_BACKEND_RESULTS.md:22-24` states validation is "Pending authorized V2-only full suite and installed simulator regression." No test results exist yet. This review covers **source contract only**.

---

## Minimal Frontend Test Boundary (Current)

### Tauri Allowlist Addition (one-line change to `main.rs:24`)

```rust
// ADD these two to existing matches! macro:
"operator.getStatus" | "operator.updateLayout"
```

**No other Rust/frontend changes required.**

### Frontend Test Harness (simulator only)

```tsx
// Developer-only component — never ships in customer build
function DevLayoutEditor() {
  const [status, setStatus] = useState<OperatorStatus>();
  const [layouts, setLayouts] = useState<LayoutMode[]>([]);
  const [editing, setEditing] = useState<Partial<LayoutMode>>({});

  async function load() {
    const s = await invoke('simulator_request', { method: 'operator.getStatus', params: {} });
    setStatus(s);
    setLayouts(s.layouts);
  }

  async function save(id: string) {
    const patch = editing[id];
    await invoke('simulator_request', {
      method: 'operator.updateLayout',
      params: { layoutId: id, ...patch }
    });
    await load();
  }

  if (!status?.canEditLayouts) return <div className="p-4 text-amber-700 bg-amber-50 border">
    Operator API disabled. Launch backend with <code>V2_LOCAL_OPERATOR_ENABLED=true</code>.
  </div>;

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-mono text-sm">LOCAL DEVELOPMENT ONLY — NOT PRODUCTION ADMIN</h3>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <dt>accessMode</dt><dd>{status.accessMode}</dd>
        <dt>productionAdminAcl</dt><dd>{String(status.productionAdminAcl)}</dd>
        <dt>state</dt><dd>{status.state}</dd>
        <dt>simulator</dt><dd>{String(status.simulator)}</dd>
      </dl>
      {layouts.map(l => (
        <fieldset key={l.id} className="border p-2 rounded space-y-1">
          <legend className="font-medium">{l.title} ({l.id})</legend>
          <label>shotCount <input type="number" min="1" max="12" value={editing[l.id]?.shotCount ?? l.shotCount} onChange={e => setEditing({...editing, [l.id]: {...editing[l.id], shotCount: +e.target.value}})} /></label>
          <label>selectCount <input type="number" min="1" max={editing[l.id]?.shotCount ?? l.shotCount} value={editing[l.id]?.selectCount ?? l.selectCount} onChange={e => setEditing({...editing, [l.id]: {...editing[l.id], selectCount: +e.target.value}})} /></label>
          <label>countdownSeconds <input type="number" min="0" max="30" value={editing[l.id]?.countdownSeconds ?? l.countdownSeconds} onChange={e => setEditing({...editing, [l.id]: {...editing[l.id], countdownSeconds: +e.target.value}})} /></label>
          <button className="check" onClick={() => save(l.id)}>Save → NEXT_SESSION</button>
        </fieldset>
      ))}
    </div>
  );
}
```

### Launch Command (Developer Shell Only)

```powershell
# In V2 root — separate from customer launch
$env:V2_LOCAL_OPERATOR_ENABLED = 'true'
$env:V2_JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot'
cd src-tauri
cargo run --target x86_64-pc-windows-msvc
```

**Customer launch never sets this env.** Production kiosk uses standard `le-souvenir-v2.exe` without the flag.

---

## What This Does NOT Enable (Blockers Remain)

| Feature | Status | Blocker |
|---|---|---|
| Production Admin ACL | ❌ BLOCKED | Requires `operator.*` auth design (PIN/JWT/HMAC), operator audit log, session isolation |
| Native camera/print/beauty editing | ❌ BLOCKED | Capabilities `false`; simulator only |
| Pricing/base-price edit | ❌ BLOCKED | `pricingEditable:false`; algorithm preserved |
| Frame/color/LUT management | ❌ BLOCKED | Not implemented |
| Revenue/payment settings | ❌ BLOCKED | Not implemented |
| Cloud album QR synthesis | ❌ BLOCKED | `cloudAlbumQr:false` |
| Persistent operator sessions | ❌ BLOCKED | No operator session concept; stateless per-request |

---

## Integration with Existing Customer UI Reconstruction

| Customer Flow | Impact |
|---|---|
| `session.start` → layout selection | Reads `catalog.get` (unchanged); operator edits apply to **next** session only |
| In-progress session | `operator.updateLayout` returns `-32001` if state ≠ `IDLE` |
| Simulator regression tests | Unaffected — operator methods not in allowlist for customer test suite |
| CDP harness (`verify-webview.mjs`) | Unaffected — add optional `operator.getStatus` check behind `V2_CDP_ENABLED=1` |

---

## Safe Persistence Confirmation

- **File:** `backend/config/local-operator-layouts.json` (V2 backend directory only)
- **Atomic write:** temp file → rename (Windows `MoveFileEx` via `std::fs::rename`)
- **Restart validation:** JSON parse + schema check before publishing to in-memory config
- **Corrupt file:** Fails closed (logs error, keeps last valid config)
- **Symlink rejection:** `std::fs::metadata` checks `file_type.is_symlink()`
- **No V1 pollution:** Path resolved relative to installed JAR, not caller CWD

---

## Test Checklist (Simulator Only) — PENDING BACKEND DELIVERY

```bash
# 1. Disabled by default
cargo run  # no V2_LOCAL_OPERATOR_ENABLED
# → operator.getStatus returns -32010

# 2. Enabled via env
$env:V2_LOCAL_OPERATOR_ENABLED='true'; cargo run
# → operator.getStatus returns canEditLayouts=true, accessMode="LOCAL_DEVELOPMENT_ONLY"

# 3. Edit at IDLE
operator.updateLayout {layoutId:"strip-2", shotCount:4, selectCount:3, countdownSeconds:2}
# → {saved:true, appliesTo:"NEXT_SESSION", layouts:[...]}

# 4. Edit during session (blocked)
session.start → operator.updateLayout → -32001

# 5. Bounds validation
shotCount:0 → -32602; shotCount:13 → -32602; selectCount > shotCount → -32602; countdown:31 → -32602

# 6. Extra fields rejected
operator.updateLayout {layoutId:"strip-2", shotCount:3, extraField:true} → -32602

# 7. Persistence survive restart
Kill JVM → relaunch with env → operator.getStatus reflects saved values

# 8. Corrupt config
Write invalid JSON to local-operator-layouts.json → restart → logs error, falls back to fixture catalog
```

**Status:** All 8 cases **NOT RUN**. Awaiting backend engineer delivery of installed simulator regression with operator tests. No self-invented PASS.

---

## Go/Block Summary

| Layer | Decision |
|---|---|
| **Tauri allowlist** | **GO** — add two methods to `matches!` macro |
| **Frontend dev component** | **GO** — conditional render behind `canEditLayouts` |
| **Customer UI reconstruction** | **GO** — zero changes; operator API invisible to customer |
| **Simulator regression** | **PENDING** — backend delivery required; no test results yet |
| **Production Admin ACL** | **BLOCK (unresolved)** — explicit integration blocker per `UI_BACKEND_RESULTS.md:24`; does not forbid future security work, requires architect ADR |
| **Any auth/HMAC/token** | **BLOCK (unresolved)** — not in this increment; future work requires architect ADR |

---

**Next Action:** Frontend coder adds `DevLayoutEditor` behind a dev-only route (e.g., `?dev=operator` query param) and updates `main.rs` allowlist. Tester adds 8 simulator test cases above to regression suite. No other changes.