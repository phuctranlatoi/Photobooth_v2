/**
 * Safe optional launcher for the independent mounted CDP runner.
 * Use only after frontend final notification and only when no shared CDP host exists.
 * It does not build, install, edit app source, or enable production services.
 */
import { spawn, execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(import.meta.dirname, '..', '..');
const exe = resolve(root, 'src-tauri/target/debug/le-souvenir-v2.exe');
const temp = resolve(root, 'tests/ui-transformation/.tmp');
const config = resolve(root, 'backend/config/local-operator-layouts.json');
const backup = resolve(temp, 'local-operator-layouts.before.json');
const runner = resolve(import.meta.dirname, 'mounted-tauri-cdp.mjs');
const port = 9223;
const optIn = process.argv.includes('--local-operator');
const confirmed = process.argv.includes('--nonproduction-isolated');
const hash = path => existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : null;
const ps = script => execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8' }).trim();
const portOwner = () => ps(`$c=Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue; if($c){($c|Select-Object -First 1 -ExpandProperty OwningProcess)}else{''}`);
const descendants = pid => ps(`$all=Get-CimInstance Win32_Process; $ids=@(${pid}); do{$old=$ids.Count;$ids+=@($all|Where-Object{$ids -contains $_.ParentProcessId}|Select-Object -ExpandProperty ProcessId);$ids=@($ids|Select-Object -Unique)}while($ids.Count -gt $old); ($ids -join ',')`);
const alive = pid => ps(`if(Get-Process -Id ${pid} -ErrorAction SilentlyContinue){'yes'}else{'no'}`) === 'yes';

if (!existsSync(exe)) throw Error(`Existing native executable absent: ${exe}. This wrapper does not build it.`);
if (portOwner()) throw Error(`Port ${port} already has a listener. Attach directly; refusing a competing CDP host.`);
if (optIn && !confirmed) throw Error('Operator opt-in requires both --local-operator and --nonproduction-isolated. It is not authentication or a production ACL.');
mkdirSync(temp, { recursive: true });
rmSync(backup, { force: true });
const beforeExists = existsSync(config), beforeHash = hash(config);
if (beforeExists) copyFileSync(config, backup);

const env = {
  ...process.env,
  TEMP: temp,
  TMP: temp,
  WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port} --remote-debugging-address=127.0.0.1`,
  V2_JAVA_HOME: process.env.V2_JAVA_HOME || 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.8-hotspot',
  // Exact inherited backend developer opt-in. Never set in default mode.
  ...(optIn ? { V2_LOCAL_OPERATOR_ENABLED: 'true' } : { V2_LOCAL_OPERATOR_ENABLED: 'false' })
};
const host = spawn(exe, [], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
const log = [];
host.stdout.on('data', value => log.push(`OUT ${value}`));
host.stderr.on('data', value => log.push(`ERR ${value}`));
let hostTree = '';
try {
  for (let i = 0; i < 80 && !portOwner(); i++) {
    if (host.exitCode !== null) throw Error(`Host exited before CDP: ${host.exitCode}`);
    await delay(250);
  }
  if (!portOwner()) throw Error('Existing native host did not expose loopback CDP');
  hostTree = descendants(host.pid);
  const test = spawn(process.execPath, [runner], {
    cwd: root,
    env: { ...env, V2_EXISTING_CDP_URL: `http://127.0.0.1:${port}` },
    stdio: 'inherit'
  });
  const code = await new Promise((ok, bad) => { test.once('exit', ok); test.once('error', bad); });
  if (code !== 0) process.exitCode = Number(code ?? 1);
} finally {
  try { if (alive(host.pid)) ps(`(Get-Process -Id ${host.pid}).CloseMainWindow() | Out-Null`); } catch {}
  for (let i = 0; i < 40 && alive(host.pid); i++) await delay(250);
  // Test-owned process only; force termination is a final cleanup guard after graceful close.
  if (alive(host.pid)) try { ps(`Stop-Process -Id ${host.pid} -Force`); } catch {}
  await delay(500);
  const ids = (hostTree || String(host.pid)).split(',').filter(Boolean).map(Number);
  const orphans = ids.filter(id => alive(id));
  if (orphans.length) {
    for (const id of orphans) try { ps(`Stop-Process -Id ${id} -Force`); } catch {}
    process.exitCode = 1;
  }
  // Dedicated opt-in run must leave the pre-run V2-local override byte-identical.
  if (beforeExists) copyFileSync(backup, config); else rmSync(config, { force: true });
  const afterHash = hash(config);
  const cleanup = { hostPid: host.pid, capturedTree: ids, forcedOrphans: orphans, portOwnerAfter: portOwner(), operatorOptIn: optIn, configBefore: beforeHash, configAfter: afterHash, configRestored: beforeHash === afterHash, log };
  writeFileSync(resolve(temp, 'last-launch-cleanup.json'), JSON.stringify(cleanup, null, 2));
  if (cleanup.portOwnerAfter || !cleanup.configRestored) process.exitCode = 1;
}
