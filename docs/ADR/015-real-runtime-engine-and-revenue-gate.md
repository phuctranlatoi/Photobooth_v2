# ADR-015: Dual Runtime Engine Architecture and Real-Mode Revenue Gate

**Date:** 2026-11-01  
**Status:** Accepted  
**Authors:** Specialist Solutions Architect (V2)  
**Supersedes/Extends:** Extends ADR-012 (Simulator Mode) for Milestone 5 Real-Mode Production Execution

---

## Context
In Milestones 1–4, V2 developed and verified:
1. Pure simulator mode (`SimulatorSessionEngine`) for headless test suites and offline UI iteration.
2. Real hardware adapters: Canon EDSDK JNA, Webcam, Hot Folder, ONNX Beauty/Face parsing, 600 DPI composition, DNP RX1HS print manager, and PayOS/Cloudinary/WebAlbum API clients.

For Milestone 5 and release packaging, the application must run on physical Windows kiosks with real hardware while maintaining the ability to run fast simulator tests. Crucially, **Real Mode must never secretly substitute synthetic captures, mock payments, or fake print confirmations** if hardware is missing, unpowered, or failing.

## Decision
1. **Dual Runtime Modes via CLI Argument:**
   - `--simulator`: Launches `SimulatorSessionEngine` with synthetic cameras, dry-run printer, and mock payments. Zero real revenue or paper printing.
   - `--real`: Launches `RealSessionEngine` wired directly to `CameraManager`, `PrinterManager`, `DesktopBeautyService`, `DesktopCompositor`, `PayOsClient`, and local SQLite `data/sales.db`.
2. **Fail-Closed Hardware Policy:**
   - If a Canon camera, webcam, or DNP printer is disconnected in `--real`, the operation fails immediately with JSON-RPC error `-32000` (Hardware Unavailable) and transitions to `RECOVERY`. No dummy frames or synthetic captures are ever substituted.
3. **The Golden Revenue Gate (`print.confirmReal`):**
   - Revenue is recognized **only and strictly after** `PrinterManager` (`LegacyPrinter`) confirms that the print job was accepted into the Windows Print Spooler (`PrintResult.Submitted`).
   - Upon `PrintResult.Submitted`:
     1. Insert sale record synchronously into local SQLite `data/sales.db` with `sync_status = 'PENDING'`.
     2. Asynchronously sync sale to Neon / REST API via `RevenueClient`.
     3. Asynchronously upload assets to Cloudinary and register in `WebAlbumClient`.
     4. Transition to `DELIVERY` with `printAccepted: true, revenueRecorded: true`.
   - If the printer rejects or fails:
     - No record is written to `data/sales.db`.
     - `revenueRecorded` remains `false`.
     - The IPC returns `-32002` (Hardware Error) and the session remains in `PRINT_PENDING` (or `RECOVERY`) to allow retry or cancellation.
4. **Real Mode IPC Contract Additions:**
   - `print.confirmReal`: Authoritative physical print submission.
   - `payment.createLink`: Generates PayOS VietQR payment link.
   - `payment.checkStatus`: Polls PayOS for real payment completion.
   - `device.getStatus`: Reports live hardware detection, runtime mode, and pending sync count.
   - Backwards compatibility: `payment.mockComplete` and `print.confirmDryRun` are preserved for simulator mode, and strictly gated in real mode.

## Consequences & Safety Guarantees
- **No False Positives:** Kiosk owners will never experience discrepancies where customers see "Payment/Print Complete" while no money was received or no photo was printed.
- **Offline Resilience:** Local SQLite sales ledger guarantees sales are persisted even if venue Wi-Fi drops.
- **Fast Developer Iteration:** Developers without Canon cameras or DNP printers can continue running complete test suites in `--simulator` without code changes.
