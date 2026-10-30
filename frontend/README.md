# V2 health bridge UI

This is the architecture diagnostic, not a customer session implementation. Start is intentionally disabled. No camera preview or session simulation exists.

Use the pinned npm lockfile. Keep `TEMP`, `TMP`, and `npm_config_cache` inside this directory before install/build/test. Scripts: `npm run test`, `npm run build`, `npm run dev` (loopback only). Browser mode never fabricates backend health.

The Rust host lives in `../src-tauri`; set `V2_JAVA_HOME` explicitly to installed Java 21 and use V2-local Cargo/temp/target paths. Build `frontend/dist` first, then run the host from `src-tauri` using `cargo run --bin le-souvenir-v2`. The actual backend installDist launcher must already exist. `cargo run --bin bridge-probe` exercises the same private stdio bridge without WebView.

See `../docs/FRONTEND_BRIDGE_RESULTS.md` for exact evidence, limitations and reviewer requests. No packaged/runtime/native support is asserted.
