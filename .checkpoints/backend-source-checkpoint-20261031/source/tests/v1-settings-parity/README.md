# V1 settings parity test

`v1-source-matrix.json` is transcribed from the actual read-only V1 files named in its `authority` field. It is not based on prior audit prose.

`mounted-settings-parity.mjs` is attach-only. It is currently a discovery scaffold; selectors must be reconciled against the actual final mounted component rather than guessed in advance. After implementation owners declare final and an isolated V2 Tauri host already exposes CDP on loopback, run:

```powershell
$env:V2_EXISTING_CDP_URL='http://127.0.0.1:9223'; node tests/v1-settings-parity/mounted-settings-parity.mjs
```

The current discovery runner intentionally fails when V1 controls are merely represented by disabled placeholder text. It does not invoke hidden RPC, alter storage, touch hardware, or claim visual pixel parity. The final mutation phase must drive visible forms, verify 10-second stepping, Save and visible Reload, use a test-owned V2 settings file, keep printing/camera/provider operations denied, hash/restore the file, reload and restart the mounted app, and verify timer behavior separately. It must test stored desired hardware values only—never real hardware application.
