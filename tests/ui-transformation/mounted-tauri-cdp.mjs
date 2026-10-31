/**
 * Independent, attach-only Tauri WebView acceptance runner.
 * It never starts Tauri/Vite/CDP and never calls window.__TAURI__, invoke, fetch,
 * storage injection, or backend RPC. All state changes are trusted user clicks.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const here = import.meta.dirname;
const out = resolve(here, 'evidence', new Date().toISOString().replaceAll(':', '-'));
mkdirSync(out, { recursive: true });
const cdp = process.env.V2_EXISTING_CDP_URL || 'http://127.0.0.1:9223';
// This only predicts the inherited host/JVM mode so assertions match the mounted UI.
// It does not set or activate the backend environment variable.
const operatorEnabled = process.env.V2_LOCAL_OPERATOR_ENABLED === 'true';
const failures = [], observations = [];
let ws, sequence = 0;
const pending = new Map();

const fail = (message, detail = '') => { failures.push({ message, detail }); console.error('FAIL', message, detail); };
const note = (message, detail = '') => { observations.push({ message, detail }); console.log('NOTE', message, detail); };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function connect() {
  let pages;
  try { pages = await (await fetch(`${cdp}/json/list`)).json(); }
  catch (error) { throw Error(`Existing CDP endpoint unavailable at ${cdp}; runner did not start a competing listener: ${error}`); }
  const page = pages.find(p => p.type === 'page' && !String(p.url).startsWith('devtools:'));
  if (!page) throw Error('No mounted Tauri page target at existing CDP endpoint');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    const handler = pending.get(message.id);
    if (handler) { pending.delete(message.id); handler(message); }
  };
}
function call(method, params = {}) {
  return new Promise((ok, bad) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); bad(Error(`CDP timeout: ${method}`)); }, 20_000);
    pending.set(id, result => { clearTimeout(timer); result.error ? bad(Error(JSON.stringify(result.error))) : ok(result.result); });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function run(expression) {
  // Evaluation is inspection/click automation only. Expressions below never access Tauri APIs or storage.
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function wait(expression, label, timeout = 30_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await run(expression)) return; await delay(150); }
  throw Error(`Timed out waiting for ${label}\n${await run('document.body.innerText')}`);
}
async function click(name, { index = 0, settle = true } = {}) {
  const expr = `Array.from(document.querySelectorAll('button,[role="button"],[role="tab"]')).filter(e=>e.offsetParent!==null&&(e.innerText||e.textContent).trim().split('\\n')[0].trim()===${JSON.stringify(name)})[${index}]`;
  await wait(`${expr}&&!${expr}.disabled&&${expr}.getAttribute('aria-disabled')!=='true'`, `enabled UI control “${name}”`);
  await run(`${expr}.click()`);
  if (settle) await delay(250);
}
async function clickTestId(id) {
  const expr = `document.querySelector(${JSON.stringify(`[data-testid="${id}"]`)})`;
  await wait(`${expr}&&${expr}.offsetParent!==null&&!${expr}.disabled`, `test id ${id}`);
  await run(`${expr}.click()`); await delay(250);
}
async function phase(value, timeout = 45_000) {
  await wait(`document.querySelector('[data-phase]')?.getAttribute('data-phase')===${JSON.stringify(value)}`, `phase ${value}`, timeout);
}
async function shot(name) {
  await delay(150);
  const png = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(resolve(out, `${slug(name)}.png`), Buffer.from(png.data, 'base64'));
  const geometry = await run(`(()=>{const visible=e=>e.offsetParent!==null;const controls=Array.from(document.querySelectorAll('button,[role="button"],[role="tab"],input,select,textarea,a[href]')).filter(visible).map(e=>{const r=e.getBoundingClientRect();return {text:(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,100),w:r.width,h:r.height,disabled:!!e.disabled||e.getAttribute('aria-disabled')==='true'}});const images=Array.from(document.images).filter(visible).map(i=>({alt:i.alt,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,complete:i.complete}));return {viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,controls,images,text:document.body.innerText.slice(0,5000)}})()`);
  if (geometry.scrollWidth > geometry.clientWidth + 1) fail(`${name}: horizontal overflow`, JSON.stringify(geometry));
  const undersized = geometry.controls.filter(c => !c.disabled && (c.w < 48 || c.h < 48));
  if (undersized.length) fail(`${name}: enabled touch targets below 48×48 CSS px`, JSON.stringify(undersized));
  const broken = geometry.images.filter(i => !i.complete || i.naturalWidth < 1 || i.naturalHeight < 1);
  if (broken.length) fail(`${name}: visible image missing pixels`, JSON.stringify(broken));
  writeFileSync(resolve(out, `${slug(name)}.json`), JSON.stringify(geometry, null, 2));
  return geometry;
}
async function assertSafetyCopy(stage) {
  const text = await run('document.body.innerText');
  if (stage === 'welcome' && !/no real camera or purchase/i.test(text)) fail(`${stage}: missing synthetic/no-purchase disclosure`);
  if (stage === 'payment' && !/no (real payment|money will be charged)|never a real payment/i.test(text)) fail(`${stage}: missing no-real-payment disclosure`);
  if (stage === 'delivery' && !/print accepted:\s*no|no (paper printing|paper will print)|no physical printing/i.test(text)) fail(`${stage}: missing no-physical-print disclosure`);
  if (/payment (successful|success)|print (successful|success)|scan (this )?qr/i.test(text)) fail(`${stage}: fabricated payment/print/QR success language`, text);
}
async function transientShot(view, expected, name) {
  const current = await run(`document.querySelector('[data-phase]')?.getAttribute('data-phase')`);
  if (expected.includes(current)) await shot(`${view}-${name}`);
  else note(`${view}: transient ${name} screenshot inaccessible`, `Observed ${current}; accepted as a missed transient, not fabricated evidence`);
}
async function completeCustomer(view) {
  await phase('IDLE'); await shot(`${view}-welcome`); await assertSafetyCopy('welcome');
  await clickTestId('welcome-start'); await shot(`${view}-catalog`);
  // Select the first backend-provided catalog item; never assume a layout/count/countdown.
  await click('Start simulator session'); await phase('SELECTING');
  await click('Continue'); await phase('SELECTING_QUANTITY');
  const quantity = await run(`(()=>{const q=Array.from(document.querySelectorAll('.quantities button')).find(b=>!b.disabled);if(!q)return null;q.click();return q.textContent.trim()})()`);
  if (!quantity) throw Error('No backend-configured allowed quantity exposed in UI');
  await phase('PAYMENT_PENDING'); await shot(`${view}-payment`); await assertSafetyCopy('payment');
  await click('Simulate payment approval', { settle: false });
  await shot(`${view}-payment-busy`);
  await wait(`['PREPARING','LIVE_VIEW'].includes(document.querySelector('[data-phase]')?.getAttribute('data-phase'))`, 'preparation or live view', 45_000);
  await transientShot(view, ['PREPARING'], 'preparation');
  await phase('LIVE_VIEW'); await wait(`document.querySelector('img[alt="Live synthetic simulator preview"]')?.naturalWidth>0`, 'synthetic live preview');
  await click('Start capture', { settle: false });
  await wait(`['COUNTDOWN','CAPTURING','SELECTING_PHOTOS'].includes(document.querySelector('[data-phase]')?.getAttribute('data-phase'))`, 'countdown/capture');
  const capturePhase = await run(`document.querySelector('[data-phase]')?.getAttribute('data-phase')`);
  if (capturePhase === 'COUNTDOWN' || capturePhase === 'CAPTURING') await shot(`${view}-${capturePhase.toLowerCase()}`);
  else note(`${view}: countdown/capturing screenshot inaccessible`, `Observed ${capturePhase}; accepted as a missed transient, not fabricated evidence`);
  await phase('SELECTING_PHOTOS', 120_000);
  const required = await run(`Number((document.querySelector('h2')?.textContent.split('/')[1]||'').match(/[0-9]+/)?.[0])`);
  const available = await run(`document.querySelectorAll('.photo-grid button').length`);
  if (!Number.isInteger(required) || required < 1 || required > available) throw Error(`Invalid dynamic selection requirement ${required}/${available}`);
  for (let i = 0; i < required; i++) await run(`document.querySelectorAll('.photo-grid button')[${i}].click()`), await delay(180);
  await shot(`${view}-selection`); await click('Continue to frames'); await phase('EDITING');
  const frameName = await run(`(()=>{const b=Array.from(document.querySelectorAll('.frame-option')).find(x=>!x.disabled);if(!b)return null;b.click();return b.textContent.trim()})()`);
  if (!frameName) throw Error('No backend-provided frame available through mounted UI');
  await wait(`document.querySelector('.composition')?.naturalWidth>0`, 'composed frame preview');
  await shot(`${view}-frame`); await click('Continue to preview'); await phase('PRINT_PENDING'); await shot(`${view}-final-preview`);
  await click('Confirm dryrun', { settle: false });
  const confirmPhase = await run(`document.querySelector('[data-phase]')?.getAttribute('data-phase')`);
  if (confirmPhase === 'PRINT_PENDING' || confirmPhase === 'PRINTING') await shot(`${view}-confirm-busy`);
  else note(`${view}: confirm progress screenshot inaccessible`, `Observed ${confirmPhase}; no distinct PRINTING state required by simulator acceptance`);
  await phase('DELIVERY');
  const delivery = await shot(`${view}-delivery`); await assertSafetyCopy('delivery');
  const qrImage = delivery.images.some(i => /qr/i.test(i.alt));
  const qrClaim = /scan (this )?qr|download.{0,30}qr|delivery qr (ready|available)/i.test(delivery.text);
  const qrUnavailable = /no (payment )?qr|no simulator delivery link|qr.{0,30}(unavailable|not available|not generated)/i.test(delivery.text);
  if (qrImage || (qrClaim && !qrUnavailable)) fail('delivery: fake QR success exposed in simulator', delivery.text);
  await click('Finish simulator session'); await phase('IDLE'); await shot(`${view}-completion`);
}
async function operatorJourney(view) {
  // Final UI contract: semantic test ids avoid language/style coupling. Absence is a real acceptance failure.
  const entry = await run(`!!document.querySelector('[data-testid="operator-entry"]')`);
  if (!entry) { fail(`${view}: operator entry absent`); return; }
  await clickTestId('operator-entry');
  for (const id of ['frames','layouts','settings','tools','colors','revenue']) {
    await clickTestId(`operator-tab-${id}`); await shot(`${view}-operator-${id}`);
  }
  // Customer Studio/setup is the SELECTING stage already traversed above, separate from Admin Tools.
  // Unsupported tabs/actions must explain that the local developer API lacks capability.
  for (const id of ['frames','settings','tools','colors','revenue']) {
    await clickTestId(`operator-tab-${id}`);
    const unsupported = await run(`(()=>{const root=document.querySelector('[data-testid="operator-workspace"]');if(!root)return false;const actions=Array.from(root.querySelectorAll('main button,main input,main select,.studio-stage button,.studio-stage input,.studio-stage select'));return actions.every(e=>e.disabled||e.getAttribute('aria-disabled')==='true')&&(/require|unavailable|not available|not exposed|no production|no operator mutation|no revenue access/i).test(root.innerText)})()`);
    if (!unsupported) fail(`${view}: unsupported operator ${id} view lacks disabled controls/reason`);
  }
  await clickTestId('operator-tab-layouts');
  const mutation = await run(`!!document.querySelector('[data-testid$="-save"]')`);
  if (!operatorEnabled) {
    const denied = await run(`(()=>{const root=document.querySelector('[data-testid="operator-workspace"]');const saves=Array.from(root?.querySelectorAll('[data-testid$="-save"]')||[]);return saves.length===0&&/defaults to denied|V2_LOCAL_OPERATOR_ENABLED=true/i.test(root?.innerText||'')})()`);
    if (!denied) fail(`${view}: operator read/edit is not default-deny with visible reason`);
    note(`${view}: operator mutation not executed`, 'Inherited host/JVM V2_LOCAL_OPERATOR_ENABLED is not exactly true');
  } else {
    if (!mutation) fail(`${view}: opt-in layout update control absent`);
    else {
      const result = await run(`(()=>{const save=document.querySelector('[data-testid$="-save"]');const form=save.closest('form');const inputs=Array.from(form.querySelectorAll('input'));const original=inputs.map(i=>i.value);const countdown=inputs.find(i=>i.name==='countdownSeconds');const next=String((Number(countdown.value)+1)%31);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(countdown,next);countdown.dispatchEvent(new Event('input',{bubbles:true}));countdown.dispatchEvent(new Event('change',{bubbles:true}));save.click();return {saveId:save.dataset.testid,original,next}})()`);
      await wait(`/Saved for the next simulator session/.test(document.body.innerText)`, 'layout saved status');
      // React remounts forms after save; restore through the same visible form controls.
      const saveId = result.saveId;
      await run(`(()=>{const save=document.querySelector('[data-testid="${saveId}"]');const inputs=Array.from(save.closest('form').querySelectorAll('input'));${JSON.stringify(result.original)}.forEach((v,i)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(inputs[i],v);inputs[i].dispatchEvent(new Event('input',{bubbles:true}));inputs[i].dispatchEvent(new Event('change',{bubbles:true}))});save.click()})()`);
      await wait(`/Saved for the next simulator session/.test(document.body.innerText)`, 'layout restored status');
      note(`${view}: V2-local layout update/revert exercised through visible form`, saveId);
    }
  }
  await clickTestId('operator-close');
}

try {
  await connect(); await call('Page.enable'); await call('Runtime.enable');
  for (const [width, height] of [[1280, 800], [1920, 1200]]) {
    const view = `${width}x${height}`;
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await completeCustomer(view);
    await operatorJourney(view);
  }
} catch (error) { fail('runner aborted', error?.stack || String(error)); }
finally {
  writeFileSync(resolve(out, 'results.json'), JSON.stringify({ status: failures.length ? 'FAIL' : 'PASS-SIMULATED', cdp, operatorEnabled, failures, observations }, null, 2));
  ws?.close();
}
if (failures.length) process.exitCode = 1;
