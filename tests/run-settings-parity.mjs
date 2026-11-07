/** Owns a Vite + mounted Tauri test run for the attach-only settings parity check. */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(import.meta.dirname, '..');
const frontend = resolve(root, 'frontend');
const exe = resolve(root, 'src-tauri/target/debug/le-souvenir-v2.exe');
const parity = resolve(root, 'tests/v1-settings-parity/mounted-settings-parity.mjs');
const evidence = resolve(root, 'tests/v1-settings-parity/runner-evidence');
const log = [];
let vite;
let host;

const capture = (name, child) => {
  child.stdout?.on('data', chunk => log.push(`${name} OUT ${chunk}`));
  child.stderr?.on('data', chunk => log.push(`${name} ERR ${chunk}`));
};
const reachable = async url => {
  try { const response = await fetch(url, { signal: AbortSignal.timeout(500) }); return response.ok; }
  catch { return false; }
};
const waitFor = async (url, child, label, attempts = 120) => {
  for (let i = 0; i < attempts; i++) {
    if (await reachable(url)) return;
    if (child?.exitCode !== null) throw Error(`${label} process exited early (${child.exitCode})`);
    await delay(250);
  }
  throw Error(`Timed out waiting for ${label}: ${url}`);
};
const stopTree = child => {
  if (!child || child.exitCode !== null) return;
  try { execFileSync('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' }); } catch {}
};

if (!existsSync(exe)) throw Error(`Debug executable is missing: ${exe}`);
mkdirSync(evidence, { recursive: true });

try {
  if (!(await reachable('http://127.0.0.1:1420'))) {
    vite = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm run dev'], { cwd: frontend, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    capture('VITE', vite);
    await waitFor('http://127.0.0.1:1420', vite, 'Vite');
  } else {
    log.push('VITE reused existing listener at http://127.0.0.1:1420');
  }

  if (await reachable('http://127.0.0.1:9223/json/version')) {
    throw Error('CDP port 9223 is already occupied; refusing to interfere with an unowned process');
  }
  const env = {
    ...process.env,
    V2_RUNTIME_MODE: 'real',
    V2_LOCAL_OPERATOR_ENABLED: 'true',
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9223 --remote-debugging-address=127.0.0.1'
  };
  host = spawn(exe, [], { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  capture('HOST', host);
  await waitFor('http://127.0.0.1:9223/json/version', host, 'WebView2 CDP');

  const test = spawn(process.execPath, [parity], {
    cwd: root,
    env: { ...env, V2_EXISTING_CDP_URL: 'http://127.0.0.1:9223' },
    stdio: 'inherit'
  });
  const code = await new Promise((resolveCode, reject) => {
    test.once('error', reject);
    test.once('exit', value => resolveCode(value ?? 1));
  });
  if (code !== 0) process.exitCode = code;
} finally {
  stopTree(host);
  stopTree(vite); // Only the Vite process created by this runner is stopped.
  await delay(500);
  const cleanup = {
    hostStopped: !host || host.exitCode !== null || !(await reachable('http://127.0.0.1:9223/json/version')),
    ownedViteStopped: !vite || vite.exitCode !== null || !(await reachable('http://127.0.0.1:1420')),
    reusedVite: !vite,
    log
  };
  writeFileSync(resolve(evidence, 'last-run.json'), JSON.stringify(cleanup, null, 2));
  if (!cleanup.hostStopped || (!cleanup.reusedVite && !cleanup.ownedViteStopped)) process.exitCode = 1;
}
