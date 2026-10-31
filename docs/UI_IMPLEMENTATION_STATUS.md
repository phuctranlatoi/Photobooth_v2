# UI implementation status — exact scope

2026-10-30. Bounded current source and actual PNG review; no application edits or test execution. See the latest section of `UI_VISUAL_REVIEW.md` for exact filenames. Earlier entries are historical; premium identity and approved frame CTA/header fixes stand.

| Capability | Status | Evidence / remaining gate |
|---|---|---|
| Premium customer simulator through dryrun/delivery | UI IMPLEMENTED; inherited PASS-SIMULATED | Existing corrected inventory and visual ledger; not rerun here |
| Frame CTA protected initial viewport / operator header separation | APPROVED bounded visual correction | Existing four directly inspected PNGs documented in visual ledger; preserve |
| Normal Start→Studio ordering | IMPLEMENTED / bounded visual approval | Current Start calls existing session.start with validated catalog default; welcome/setup -0/-1 images opened. No extra Explore; behavioral regression independently owned |
| Original full-screen inspection | IMPLEMENTED / bounded visual APPROVAL | Fresh original-fullscreen-0.png and original-fullscreen-1.png directly opened: bounded dark dialog, legible title, complete image bounds, Close and caption. Prior overflow/title defect closed; keyboard behavior independently tested |
| Payment staff panel | SIMULATOR presentation APPROVED at both sizes | Fresh payment-staff-0.png and payment-staff-1.png directly opened: disclaimer, approval and Close fully visible; no implied paid status. Minor incidental horizontal panel scrollbar remains nonblocking polish |
| Setup action visibility | APPROVED at both sizes | Fresh setup-0.png and setup-1.png directly opened: complete Continue and Back above footer; earlier compact Back clipping closed |
| Special events→matching layout→special frame on Start→quantity | SOURCE VERIFIED / BLOCKED | V1 Start/controller evidence in parity doc; V2 lacks reviewed event catalog/selection contract |
| Normal Studio local layout→effect/live preview | SOURCE VERIFIED / PARTIAL | Fixture layouts implemented; enabled effects/preview unsupported, no invented choices |
| Counts/countdowns/selection order | UI IMPLEMENTED simulator | Dynamic Kotlin snapshot; exact V1 controller equivalence needs action-level regression |
| Manual confirm, dryrun, no revenue | UI IMPLEMENTED simulator | Keep explicit confirmation and pending locks; physical printing not tested |
| Payment/album QR | BLOCKED production | Explicit simulator payment/no delivery URL; no fake QR |
| Six actual Admin tabs | UI IMPLEMENTED shells only | Frames, Layouts, Settings, Tools, Colors, Revenue; shell ≠ full control parity |
| Local layout capture/select/countdown editing | UI IMPLEMENTED simulator-only | `Operator.tsx:12–14`; selectCount is extension; V1 price/save/delete parity absent |
| Other operator nested actions | NAMED UNAVAILABLE INVENTORY / BLOCKED | Settings 1280/1920 images show missing-contract reasons and denied access. Disabled field inventory is not implemented source functionality; no full six-tab functional audit |
| Errors/startup/recovery | PARTIAL / NOT VISUALLY REVIEWED | No new error PNG reviewed; V1 unmapped states need explicit decision |
| Windows DPI, physical touch/distance, native devices, production ACL | NOT TESTED / BLOCKED | No claim from CSS viewport screenshots |

## Next bounded checkpoint

1. Original-inspection overflow/title and compact setup/staff visibility corrections are visually closed by six fresh PNG reads. Preserve selection neutrality, focus behavior and previously approved frame action region. Only remaining visible polish: incidental horizontal scrollbar in both staff panels; remove overflow without clipping content/focus.
2. Backend/architect supplies or declines typed special event/effect contracts; absent capabilities stay honest and disabled. Do not expose credentials or enable live payment.
3. Corrected original-inspection, staff and setup PNGs at both sizes have now been directly reviewed and narrowly approved. Customer empty/error, language overflow, DPI and physical touch remain outside this evidence.
4. Test repeated taps, empty catalog and exact state path through existing IPC. Do not globally label all V1 screens complete from a passing simulator path.

Owned documentation this increment only: this file and `UI_VISUAL_REVIEW.md`. Reported tests/build/mounted PASS in `UI_PARITY_INCREMENT_RESULTS.md` are supplied independent evidence, not rerun. No commands, code edits, V1 modifications or production side effects. No blanket full UI parity approval.

Final correction rereview: independent final CDP/bounds PASS and 35 backend/15 frontend tests are supplied reviewer evidence, not tests executed by this designer. Visual verdict is based on the six exact fresh filenames listed above and in the latest visual ledger section; supersedes earlier blocking findings only within that scope.
