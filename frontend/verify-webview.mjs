// Development-only CDP harness. Executes the mounted React button, never invokes IPC directly.
import { spawn, execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const host = spawn(resolve(root, 'src-tauri/target/debug/le-souvenir-v2.exe'), [], {
  cwd: root,
  env: { ...process.env, V2_JAVA_HOME: 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.8-hotspot',
    TEMP: resolve(root, 'src-tauri/.tmp'), TMP: resolve(root, 'src-tauri/.tmp'),
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9223 --remote-debugging-address=127.0.0.1' },
  stdio: 'ignore',
});
console.log('HOST PID', host.pid);
let socket;
try {
  let page;
  for (let i = 0; i < 60; i++) {
    try { page = (await (await fetch('http://127.0.0.1:9223/json/list')).json()).find(p => p.type === 'page'); } catch {}
    if (page) break;
    await delay(500);
  }
  if (!page) throw Error('Real WebView CDP unavailable');
  console.log('WEBVIEW', page.url, page.title);
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((yes, no) => { socket.onopen = yes; socket.onerror = no; });
  let sequence = 0;
  const pending = new Map();
  socket.onmessage = event => { const data = JSON.parse(event.data); const p = pending.get(data.id); if (p) { pending.delete(data.id); data.error ? p.reject(data.error) : p.resolve(data.result); } };
  const call = (method, params) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  for (let i = 0; i < 40; i++) {
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Bridge diagnostics')?.click()`);
    if (await evaluate(`!!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Check JVM bridge'))`)) break;
    await delay(250);
  }
  console.log('INITIAL DOCUMENT', await evaluate('JSON.stringify({url:location.href,text:document.body.innerText})'));
  console.log('CLICK', await evaluate(`(()=>{const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Check JVM bridge'));if(!b)throw Error('React button missing');b.click();b.click();return b.textContent})()`));
  let text;
  for (let i = 0; i < 60; i++) {
    text = await evaluate('document.body.innerText');
    if (text.includes('JVM responded · simulator confirmed') || text.includes('Bridge unavailable')) break;
    await delay(250);
  }
  console.log('RENDERED UI\n' + text);
  if (!text.includes('JVM responded · simulator confirmed')) throw Error('Real UI health failed');
  const pid = await evaluate(`Number(document.querySelector('dd').textContent)`);
  const ps = script => execFileSync('powershell.exe', ['-NoProfile', '-Command', script], { encoding: 'utf8' }).trim();
  const process = JSON.parse(ps(`Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}' | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress`));
  const parent = JSON.parse(ps(`Get-CimInstance Win32_Process -Filter 'ProcessId=${process.ParentProcessId}' | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress`));
  console.log('ACTUAL JVM', process, 'LAUNCHER', parent);
  if (process.Name !== 'java.exe' || parent.ParentProcessId !== host.pid) throw Error('UI backend PID not owned by host');
  console.log('WINDOW CLOSE', ps(`$p=Get-Process -Id ${host.pid}; $p.CloseMainWindow()`));
  await Promise.race([new Promise(resolve => host.once('exit', (code) => { console.log('HOST EXIT', code); resolve(); })), delay(15000).then(() => { throw Error('Close timed out'); })]);
  await delay(500);
  const alive = ps(`if(Get-Process -Id ${pid} -ErrorAction SilentlyContinue){'alive'}else{'terminated'}`);
  console.log('JVM PID', pid, alive);
  if (alive !== 'terminated') throw Error('JVM orphaned');
} finally {
  socket?.close();
  if (host.exitCode === null) execFileSync('powershell.exe', ['-NoProfile', '-Command', `(Get-Process -Id ${host.pid}).CloseMainWindow()`]);
}
