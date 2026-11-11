/** Live Tauri/WebView acceptance test. No real payment, capture, upload, or print is authorized. */
import {spawn,execFileSync} from 'node:child_process';import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {setTimeout as delay} from 'node:timers/promises';
const root=resolve(import.meta.dirname,'..'),frontend=resolve(root,'frontend'),exe=resolve(root,'src-tauri/target/debug/le-souvenir-v2.exe'),out=resolve(import.meta.dirname,'journey-evidence',new Date().toISOString().replaceAll(':','-'));mkdirSync(out,{recursive:true});
const result={status:'PASS-SIMULATED',scope:'Live Tauri executable; DEMO journey plus REAL-mode payment display only',evidence:out,checks:[],failures:[],screenshots:[]};let vite,app,ws,seq=0;const pending=new Map();
const check=(ok,name,detail='')=>{result.checks.push({name,ok,detail});if(!ok){result.failures.push({name,detail});console.error('FAIL',name,detail)}else console.log('PASS',name)};
const endpoint=async(url,ms=45000)=>{const end=Date.now()+ms;while(Date.now()<end){try{const r=await fetch(url);if(r.ok)return r}catch{}await delay(200)}throw Error(`Timeout ${url}`)};const kill=c=>{if(c?.pid)try{execFileSync('taskkill',['/PID',`${c.pid}`,'/T','/F'],{stdio:'ignore'})}catch{}};
function viteProcesses(){
  const escaped=frontend.replaceAll("'", "''");
  const script=`$dir='${escaped}'; @(Get-CimInstance Win32_Process | Where-Object { ($_.Name -match '^(node|npm|cmd)(\\.exe)?$') -and $_.CommandLine -and ($_.CommandLine -like "*$dir*") -and ($_.CommandLine -match 'vite|npm.cmd.*run.*dev') } | Select-Object -ExpandProperty ProcessId) | ConvertTo-Json -Compress`;
  const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8'}).trim();
  return output ? [JSON.parse(output)].flat().filter(Number.isInteger) : [];
}
// Both timestamps are sampled inside the WebView; CDP transport/polling is excluded.
async function measureSelection(selector, active, name){
  const measurement=await js(`new Promise((resolve,reject)=>{const button=document.querySelector(${JSON.stringify(selector)});if(!button||button.disabled||(${active})(button))return reject(Error('No unselected, enabled ${name} card'));const start=performance.now();let observer;const timeout=setTimeout(()=>{observer.disconnect();reject(Error('${name} selection did not become visible'))},2000);observer=new MutationObserver(()=>{if((${active})(button)){const ms=performance.now()-start;clearTimeout(timeout);observer.disconnect();resolve(ms)}});observer.observe(button,{attributes:true,childList:true,subtree:true,attributeFilter:['aria-pressed']});button.click();if((${active})(button)){const ms=performance.now()-start;clearTimeout(timeout);observer.disconnect();resolve(ms)}})`);
  check(measurement<100,`${name} selection latency < 100ms`,`${measurement.toFixed(2)}ms`);
  return measurement;
}
const qrRects=`(() => {const slot=document.querySelector('.v1-payment-qr-slot'),columns=document.querySelector('.v1-payment-columns');if(!slot||!columns)return null;const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return {slot:rect(slot),columns:rect(columns)}})()`;
async function measureQrStability(view,before){
  if(!before){check(false,`${view} QR layout stability`,'QR placeholder missing before rendering');return}
  await wait("Boolean(document.querySelector('.v1-payment-qr-slot img')?.complete && document.querySelector('.v1-payment-qr-slot img')?.naturalWidth)",'QR rendered',30000);
  await js('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  const after=await js(qrRects);
  const delta=(a,b)=>Math.abs(a-b);
  const shifts={slotWidth:delta(before.slot.width,after.slot.width),slotHeight:delta(before.slot.height,after.slot.height),columnsX:delta(before.columns.x,after.columns.x),columnsY:delta(before.columns.y,after.columns.y),columnsWidth:delta(before.columns.width,after.columns.width),columnsHeight:delta(before.columns.height,after.columns.height)};
  check(Object.values(shifts).every(value=>value<0.01),`${view} QR container constant and columns layout shift = 0px`,JSON.stringify({before,after,shifts}));
}
// A killed Tauri parent can leave its detached JVM sidecar or WebView2 children alive.
// Clean only processes that can be positively attributed to this V2 workspace/app identity;
// never kill unrelated node/java/WebView processes on the developer machine.
function cleanupPreviousInstance(){
  const escapedRoot=root.replaceAll("'", "''");
  const ps=`$root='${escapedRoot}'; $victims=Get-CimInstance Win32_Process | Where-Object { `+
    `($_.Name -eq 'le-souvenir-v2.exe' -and $_.ExecutablePath -like \"$root*\") -or `+
    `($_.Name -eq 'java.exe' -and $_.CommandLine -like \"*$root\\backend\\build\\install\\backend\\lib*\") -or `+
    `($_.Name -eq 'msedgewebview2.exe' -and $_.CommandLine -like '*com.lesouvenir.v2.bridge\\EBWebView*') }; `+
    `$victims | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
  try{execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',ps],{stdio:'ignore'})}catch{}
}
async function connect(){let p;const end=Date.now()+45000;while(Date.now()<end&&!p){const pages=await(await endpoint('http://127.0.0.1:9223/json/list')).json();p=pages.find(x=>x.type==='page'&&!String(x.url).startsWith('devtools:'));if(!p)await delay(250)}if(!p)throw Error('No WebView CDP page');ws=new WebSocket(p.webSocketDebuggerUrl);await new Promise((a,b)=>{ws.onopen=a;ws.onerror=b});ws.onmessage=e=>{const m=JSON.parse(e.data),f=pending.get(m.id);if(f){pending.delete(m.id);f(m)}};await call('Page.enable');await call('Runtime.enable')}
function call(method,params={}){return new Promise((ok,bad)=>{const id=++seq,t=setTimeout(()=>bad(Error(`CDP timeout ${method}`)),20000);pending.set(id,m=>{clearTimeout(t);m.error?bad(Error(JSON.stringify(m.error))):ok(m.result)});ws.send(JSON.stringify({id,method,params}))})}async function js(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}async function wait(expression,label,ms=120000){const end=Date.now()+ms;while(Date.now()<end){if(await js(`Boolean(${expression})`))return;await delay(150)}throw Error(`Timeout ${label}: ${(await js('document.body.innerText')).slice(0,2000)}`)}
async function click(re, selector = 'button') {
  const flags = re.flags.includes('i') ? re.flags : re.flags + 'i';
  const exp = `Array.from(document.querySelectorAll(${JSON.stringify(selector)})).find(x => x.offsetParent !== null && !x.disabled && new RegExp(${JSON.stringify(re.source)}, ${JSON.stringify(flags)}).test(([x.innerText, x.getAttribute('aria-label'), x.getAttribute('title')].filter(Boolean).join(' ')).trim()))`;
  await wait(exp, `button matching ${re}`);
  await js(`void (${exp}?.click())`);
  await delay(300);
}
async function shot(view,name){const p=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}),file=resolve(out,`${view}-${name}.png`);writeFileSync(file,Buffer.from(p.data,'base64'));result.screenshots.push(file)}async function start(mode){app=spawn(exe,[],{cwd:root,env:{...process.env,V2_RUNTIME_MODE:mode,V2_JAVA_HOME:process.env.V2_JAVA_HOME||'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.8-hotspot',WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:'--remote-debugging-port=9223 --remote-debugging-address=127.0.0.1'},stdio:['ignore','pipe','pipe']});await connect()}async function reset(){try{ws?.close()}catch{}kill(app);app=undefined;await delay(1200)}
async function setupToPayment(view,demo){await wait("Boolean(document.querySelector('.v1-start .v1-primary:not(:disabled)'))", 'start button ready');const text=await js('document.body.innerText');check(!text.includes('Firebase Live') && !text.includes('Bộ nhớ tạm') && !text.includes('V2 architecture proof'), `${view} no technical metadata on start screen`);check(!await js("Boolean(document.querySelector('.v1-mode-badge') || document.querySelector('.v1-offline-banner'))"), `${view} clean unified start screen (no manual mode toggles)`);const modeTag = demo ? 'demo' : 'real';await shot(view, `${modeTag}-start`);await js("void (document.querySelector('.v1-start .v1-primary, button.v1-primary')?.click())");await delay(500);await wait("Boolean(document.querySelector('.v1-layout-card'))", 'real layout list');const layoutText=await js('document.body.innerText');check(!layoutText.includes('515_4_anh') && !layoutText.includes('1015_4_base'), `${view} no raw layout IDs on customer layout cards`);check(layoutText.includes('Dải 4 ảnh cổ điển') || layoutText.includes('Khung 4 ảnh postcard') || layoutText.includes('Bố cục'), `${view} customer formatted layout names`);
 const navGeo = await js(`(() => {
  const b = document.querySelector('.v1-back, .backButton');
  const prev = document.querySelector('.v1-carousel-prev');
  const next = document.querySelector('.v1-carousel-next');
  const r = b ? b.getBoundingClientRect() : null;
  const icon = b ? b.querySelector('svg') : null;
  const ir = icon ? icon.getBoundingClientRect() : null;
  const pr = prev ? prev.getBoundingClientRect() : null;
  const nr = next ? next.getBoundingClientRect() : null;
  return {
    back: r ? { width: r.width, height: r.height, iconDx: ir ? Math.abs((ir.left + ir.width/2) - (r.left + r.width/2)) : 0, iconDy: ir ? Math.abs((ir.top + ir.height/2) - (r.top + r.height/2)) : 0 } : null,
    chevrons: (pr && nr) ? { prevWidth: pr.width, nextWidth: nr.width, yDelta: Math.abs(pr.top - nr.top) } : null
  };
})()`);
if (navGeo?.back) {
  check(navGeo.back.width >= 55 && navGeo.back.height >= 55, `${view} Back button minimum 56x56 touch target (${Math.round(navGeo.back.width)}x${Math.round(navGeo.back.height)})`);
  check(navGeo.back.iconDx <= 2.5 && navGeo.back.iconDy <= 2.5, `${view} Back button icon centered inside button (dx: ${navGeo.back.iconDx.toFixed(1)}, dy: ${navGeo.back.iconDy.toFixed(1)})`);
}
if (navGeo?.chevrons) {
  check(navGeo.chevrons.prevWidth >= 55 && navGeo.chevrons.nextWidth >= 55, `${view} Carousel chevrons 56x56 touch target`);
  check(navGeo.chevrons.yDelta <= 3, `${view} Carousel chevrons aligned on same horizontal axis`);
}
 const layoutChoice=await js(`(() => {const ids=['515_4_anh','515_4_base','strip-5x15'];const cards=[...document.querySelectorAll('[data-layout-id]')];const card=ids.map(id=>cards.find(c=>c.dataset.layoutId===id)).find(Boolean)||cards[0];if(!card)return null;card.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});return card.dataset.layoutId})()`);
 check(Boolean(layoutChoice),`${view} deterministic layout card available`,String(layoutChoice));
 await wait(`Boolean(document.querySelector('[data-layout-id="${layoutChoice}"][aria-pressed="true"]'))`,'layout selection settled',10000);
 await js(`new Promise(resolve=>{const el=document.querySelector('[data-layout-id="${layoutChoice}"]');let last=el?.getBoundingClientRect().left, stable=0;const tick=()=>{const now=el?.getBoundingClientRect().left;if(Math.abs((now??0)-(last??0))<.25)stable++;else stable=0;last=now;if(stable>=3)resolve();else requestAnimationFrame(tick)};requestAnimationFrame(tick)})`);
 await shot(view, `${modeTag}-layout`);
 await js(`void (document.querySelector('[data-layout-id="${layoutChoice}"][aria-pressed="true"]')?.click())`);await delay(150);
 await wait("Boolean(document.querySelector('.v1-stepper'))",'quantity screen');let q=await js("document.querySelector('.v1-stepper strong')?.textContent.trim()");for(let i=0;q!==undefined&&q!=='2'&&i<10;i++){await js("void (document.querySelector('.v1-stepper button:last-child')?.click())");await delay(200);q=await js("document.querySelector('.v1-stepper strong')?.textContent.trim()")}check(q==='2',`${view} quantity set to 2`);await shot(view, `${modeTag}-quantity-2`);if(!demo)await js(`(() => {window.__v2QrBefore=null;const observer=new MutationObserver(()=>{const slot=document.querySelector('.v1-payment-qr-slot');if(slot&&!slot.querySelector('img')&&!window.__v2QrBefore){window.__v2QrBefore=${qrRects};observer.disconnect()}});observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),30000)})()`);await click(/Tiếp tục/i);await wait("Boolean(document.querySelector('.v1-payment-screen') || document.body.innerText.includes('Thanh toán'))",'payment screen')}
async function demoJourney(view){await setupToPayment(view,true);const t=await js('document.body.innerText');check(!/[⚡📱✨🎉🖨️]/.test(t), `${view} zero emoji in UI`);check(/70\.000|90\.000|110\.000/.test(t),`${view} real calculated price displayed`);check(!t.includes('TRẢI NGHIỆM CHỤP ẢNH MIỄN PHÍ') && !t.includes('Không cần thanh toán'),`${view} no customer free photo bypass`);check(/bước\s*3/i.test(t) && t.includes('Thanh toán'),`${view} payment step header`);await shot(view,'demo-payment');
// Hold the payment heading long enough to open the staff PIN modal.
const staffTouch = await js(`(() => {
  const el = document.querySelector('[data-staff-trigger="true"], .v1-heading-title');
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', clientX: point.x, clientY: point.y }));
  return point;
})()`);
if (!staffTouch) throw Error('Staff payment heading not found');
await delay(1150);
await js(`(() => {
  const el = document.querySelector('[data-staff-trigger="true"], .v1-heading-title');
  el?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch', clientX: ${staffTouch.x}, clientY: ${staffTouch.y} }));
})()`);
await delay(250);
if (await js("Boolean(document.querySelector('.v1-staff-pin'))")) {
  for (const digit of ['1', '2', '3', '4']) {
    const key = `.v1-staff-pin .v1-pin-keypad button[aria-label="${digit}"]`;
    await wait(`Boolean(document.querySelector(${JSON.stringify(key)}))`, `staff PIN digit ${digit}`);
    await js(`void (document.querySelector(${JSON.stringify(key)})?.click())`);
  }
}
await wait("Boolean(document.querySelector('.v1-staff-cash-btn'))", 'staff cash confirmation button', 10000);
await click(/Nhân viên xác nhận tiền mặt/i);await wait("Boolean(document.querySelector('.v1-capture-screen') || document.body.innerText.includes('Bắt đầu chụp'))",'live demo');await shot(view,'demo-live');
const captureChrome=await js(`(()=>{const t=document.querySelector('.v1-capture-top'),s=document.querySelector('.v1-capture-screen');if(!t||!s)return null;const r=t.getBoundingClientRect(),sr=s.getBoundingClientRect(),cs=getComputedStyle(s,'::before');return {centerDx:Math.abs(r.left+r.width/2-innerWidth/2),top:r.top,screenTop:sr.top,railWidth:parseFloat(cs.width)||0,grid:getComputedStyle(s).gridTemplateColumns}})()`);
check(captureChrome&&captureChrome.centerDx<=2&&captureChrome.top<=captureChrome.screenTop+80,`${view} capture top centered near top`,JSON.stringify(captureChrome));
check(captureChrome&&captureChrome.railWidth<=0&&(!captureChrome.grid||!captureChrome.grid.includes(' ')),`${view} capture has no right rail`,JSON.stringify(captureChrome));
const shutterBottom=await js("(()=>{const r=document.querySelector('.v1-shutter')?.getBoundingClientRect();return r?{bottom:r.bottom,viewport:innerHeight}:null})()");check(shutterBottom&&shutterBottom.bottom>shutterBottom.viewport*.65,`${view} shutter in bottom portion`,JSON.stringify(shutterBottom));
const shutterGeometry = await js(`(() => {
  const button = document.querySelector('.v1-capture-screen .v1-shutter');
  const core = button?.querySelector('.v1-shutter-core');
  if (!button || !core) return null;
  const shutter = button.getBoundingClientRect(), inner = core.getBoundingClientRect();
  return {centerDx: Math.abs(shutter.left + shutter.width / 2 - window.innerWidth / 2),
    width: shutter.width, height: shutter.height, coreWidth: inner.width, coreHeight: inner.height};
})()`);
check(shutterGeometry !== null && shutterGeometry.centerDx <= 1, `${view} shutter horizontally centered <= 1px`, JSON.stringify(shutterGeometry));
check(shutterGeometry !== null && Math.abs(shutterGeometry.width - 108) <= 1 && Math.abs(shutterGeometry.height - 108) <= 1, `${view} shutter exactly 108x108px`, JSON.stringify(shutterGeometry));
check(shutterGeometry !== null && Math.abs(shutterGeometry.coreWidth - 84) <= 1 && Math.abs(shutterGeometry.coreHeight - 84) <= 1, `${view} shutter core exactly 84x84px`, JSON.stringify(shutterGeometry));
// Click without the helper's 300ms delay: the backend controls how long countdown remains visible.
await wait("Boolean(document.querySelector('.v1-shutter[aria-label=\"Bắt đầu chụp\"]:not(:disabled)'))", 'shutter ready');
await js(`void (document.querySelector('.v1-shutter[aria-label="Bắt đầu chụp"]')?.click())`);
await wait("Boolean(document.querySelector('.v1-countdown'))", 'capture countdown', 15000);
const countdownGeometry = await js(`(() => {
  const node = document.querySelector('.v1-countdown');
  if (!node) return null;
  const r = node.getBoundingClientRect();
  return {centerDx: Math.abs(r.left + r.width / 2 - window.innerWidth / 2),
    centerDy: Math.abs(r.top + r.height / 2 - window.innerHeight / 2), width: r.width, height: r.height};
})()`);
check(countdownGeometry !== null && countdownGeometry.centerDx <= 2 && countdownGeometry.centerDy <= 2, `${view} countdown dead-centered <= 2px each axis`, JSON.stringify(countdownGeometry));
await wait("Boolean(document.querySelector('[aria-label=\"Chọn ảnh 1\"]:not(:disabled)'))",'mock captures',180000);await shot(view,'demo-select');const required = await js("Number((document.body.innerText.match(new RegExp('Đã chọn \\\\d+/(\\\\d+)'))||[])[1]) || 4");
// Test press-and-hold zoom gesture on photo 1
await js(`(() => {
  const p1 = document.querySelector('[aria-label="Chọn ảnh 1"]');
  if (p1) p1.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 150, clientY: 150 }));
})()`);
await wait("Boolean(document.querySelector('.v1-hold-lightbox, .v1-lightbox'))", 'press-and-hold zoom', 3000).catch(() => {});
const zoomOpen = await js("Boolean(document.querySelector('.v1-hold-lightbox, .v1-lightbox'))");
check(zoomOpen, `${view} press-and-hold enlarges photo`);
// Release finger
await js(`(() => {
  const p1 = document.querySelector('[aria-label="Chọn ảnh 1"]');
  if (p1) {
    p1.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 150, clientY: 150 }));
    p1.dispatchEvent(new MouseEvent('click', { bubbles: true })); // Consume the hold-suppression click.
  }
})()`);
await delay(200);
const zoomClosed = await js("!document.querySelector('.v1-hold-lightbox, .v1-lightbox')");
check(zoomClosed, `${view} release finger dismisses enlarged photo`);
const timerText1 = await js("document.querySelector('.v1-timer')?.textContent || ''");
if (timerText1) {
  check(timerText1.includes('Còn lại') && !timerText1.includes('00:00'), `${view} active selection timer (${timerText1})`);
  await delay(2200);
  const timerText2 = await js("document.querySelector('.v1-timer')?.textContent || ''");
  const parseSeconds = (txt) => {
    const m = txt.match(/(\d+):(\d+)/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const s1 = parseSeconds(timerText1), s2 = parseSeconds(timerText2);
  if (s1 !== null && s2 !== null) {
    check(s2 < s1, `${view} selection timer decrements over time (${timerText1} -> ${timerText2})`);
  }
}
for (let i = 1; i <= required; i++) {
const btnExp = `document.querySelector('[aria-label="Chọn ảnh ${i}"]')`;
await wait(`${btnExp} && !${btnExp}.disabled`, `photo ${i} card`);
  if(i===1)await measureSelection(`[aria-label="Chọn ảnh ${i}"]`, `button=>button.getAttribute('aria-pressed')==='true'||!!button.querySelector('.v1-photo-order')`,`${view} photo`);
  else await js(`void (${btnExp}?.click())`);
await wait(`Boolean(document.body.innerText.includes('Đã chọn ${i}/') || document.querySelector('[aria-label="Chọn ảnh ${i}"][aria-pressed="true"]'))`, `photo ${i} selected`, 15000);
if (i === 1) {
const hasPreviewImage = await js("Boolean(document.querySelector('.v1-preview svg image'))");
check(hasPreviewImage, `${view} live frame preview renders chosen photos in real-time`);
}
await delay(300);
}
  await click(/Tiếp tục/i);await wait("Boolean(document.querySelector('.v1-frame-grid button'))",'frame buttons loaded');await measureSelection('.v1-frame-grid button:not([aria-pressed="true"])',`button=>button.getAttribute('aria-pressed')==='true'||!!button.querySelector('.v1-frame-check')`,`${view} frame`);await wait("Boolean(!document.querySelector('button[aria-label*=\"Tiếp tục\"]')?.disabled || Array.from(document.querySelectorAll('button')).some(b => (b.textContent?.trim().startsWith('Tiếp tục') || b.textContent?.trim().includes('Xem bản in')) && !b.disabled))",'frame preview ready',60000);await shot(view,'demo-frame');await click(/Xem bản in|Tiếp tục/i);await wait("Boolean(document.querySelector('.v1-confirm-screen') || document.body.innerText.includes('Kiểm tra lần cuối'))",'confirm');await wait("Boolean(document.querySelector('.v1-preview img, img[alt*=\"Bản ghép\"], img[alt*=\"600 DPI\"]')?.naturalWidth)", 'composed preview loaded', 35000);check(Boolean(await js("Boolean(document.querySelector('.v1-preview img, img[alt*=\"Bản ghép\"], img[alt*=\"600 DPI\"]')?.naturalWidth)")), `${view} composed preview`);
const frameGridGeo = await js(`(() => {
  const grid = document.querySelector('.v1-frame-grid');
  const actionbar = document.querySelector('.v1-frame-workspace ~ .v1-actionbar, .v1-actionbar');
  const cards = [...document.querySelectorAll('.v1-frame-grid button')];
  if (!grid || !actionbar || !cards.length) return null;
  const gr = grid.getBoundingClientRect(), ar = actionbar.getBoundingClientRect();
  const arts = [...document.querySelectorAll('.v1-frame-art')];
  const cardOverflows = cards.some(c => { const cr = c.getBoundingClientRect(); const media = c.querySelector('.v1-frame-art img, .v1-frame-art svg'); const mr = media?.getBoundingClientRect(); return mr && (mr.bottom > cr.bottom + 2 || mr.top < cr.top - 2); });
  return { gridBottom: Math.round(gr.bottom), actionbarTop: Math.round(ar.top), cardCount: cards.length, cardOverflows, overflowY: getComputedStyle(grid).overflowY, firstCardHeight: Math.round(cards[0].getBoundingClientRect().height), firstArtRatio: arts[0] ? (arts[0].getBoundingClientRect().width / (arts[0].getBoundingClientRect().height || 1)).toFixed(2) : null };
})()`);
if (frameGridGeo) {
  check(frameGridGeo.gridBottom <= frameGridGeo.actionbarTop + 2, `${view} frame grid stays strictly above actionbar (bottom: ${frameGridGeo.gridBottom}px, actionbar: ${frameGridGeo.actionbarTop}px)`);
  check(!frameGridGeo.cardOverflows, `${view} frame cards have no overflowing media`);
  check(['auto', 'scroll'].includes(frameGridGeo.overflowY), `${view} frame grid has bounded scroll (${frameGridGeo.overflowY})`);
}
const confirmGeo = await js(`(() => {
  const img = document.querySelector('.v1-confirm-workspace .v1-preview img, .v1-confirm-workspace .v1-preview svg, .v1-confirm-workspace .v1-layout-artwork');
  const summary = document.querySelector('.v1-confirm-workspace .v1-summary');
  const actionbar = document.querySelector('.v1-confirm-screen .v1-actionbar');
  if (!img || !summary || !actionbar) return null;
  const ir = img.getBoundingClientRect();
  const sr = summary.getBoundingClientRect();
  const ar = actionbar.getBoundingClientRect();
  return {
    imgHeight: Math.round(ir.height),
    imgWidth: Math.round(ir.width),
    clearanceBottom: Math.round(ar.top - ir.bottom),
    clearanceRight: Math.round(sr.left - ir.right)
  };
})()`);
if (confirmGeo) {
  check(confirmGeo.clearanceBottom >= 25, `${view} confirm preview bottom clearance >= 25px (actual: ${confirmGeo.clearanceBottom}px)`);
  check(confirmGeo.clearanceRight >= 15, `${view} confirm preview right clearance >= 15px (actual: ${confirmGeo.clearanceRight}px)`);
  check(confirmGeo.imgHeight <= 520, `${view} confirm preview scaled down to reasonable height <= 520px (actual: ${confirmGeo.imgHeight}px)`);
}await shot(view,'demo-confirm');await click(/Xác nhận bản mô phỏng|Xác nhận & in|In và tạo QR|Hoàn thành trải nghiệm|Xác nhận/i);await wait("Boolean(document.querySelector('.v1-delivery-screen') || document.body.innerText.includes('Hoàn tất'))",'delivery',60000);await shot(view,'demo-delivery');await click(/Hoàn thành|Về trang đầu|Chụp lượt mới/i);await wait("document.body.innerText.includes('CHẠM ĐỂ BẮT ĐẦU') || document.body.innerText.includes('Chụp ảnh')",'start screen restored',15000)}
async function realPayment(view){await setupToPayment(view,false);const t=await js('document.body.innerText');check(/70\.000|90\.000|110\.000/.test(t),`${view} real calculated price displayed`);check(/bước\s*3/i.test(t) && t.includes('Thanh toán'),`${view} real payment: Bước 3 Thanh toán`);const before=await js('window.__v2QrBefore');await measureQrStability(view,before);const qrSrc=await js("document.querySelector('.v1-payment-qr-slot img')?.src || ''");check(qrSrc.length>50,`${view} real VietQR image rendered (length=${qrSrc.length})`);check(!t.includes('TRẢI NGHIỆM CHỤP ẢNH MIỄN PHÍ'),`${view} no free trial advertising in real payment`);await shot(view,'real-payment')}
try{if(!existsSync(exe))throw Error(`Missing ${exe}`);cleanupPreviousInstance();await delay(1500);try{await endpoint('http://127.0.0.1:1420',1000)}catch{vite=spawn('cmd.exe',['/d','/s','/c','npm run dev -- --port 1420 --strictPort'],{cwd:frontend,stdio:['ignore','pipe','pipe']});await endpoint('http://127.0.0.1:1420')}await start('real');for(const [w,h] of [[1280,800],[1920,1200]]){await call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await demoJourney(`${w}x${h}`)}await reset();await start('real');for(const [w,h] of [[1280,800],[1920,1200]]){await call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await realPayment(`${w}x${h}`);if(`${w}x${h}` !== '1920x1200'){await reset();await start('real')}}try{const db=resolve(root,'data/sales.db'),output=execFileSync('sqlite3',[db,"select count(*) from sales where upper(coalesce(capture_mode,''))='DEMO';"],{encoding:'utf8'}).trim();check(output==='0','SQLite has zero sales records for DEMO sessions',output)}catch(e){const report=resolve(root,'backend/build/test-results/test/TEST-com.lesouvenir.v2.ipc.RealSessionEngineDemoModeTest.xml');if(existsSync(report)){const suite=readFileSync(report,'utf8').match(/<testsuite\b[^>]*>/)?.[0]||'';check(/tests="([1-9]\d*)"/.test(suite)&&/failures="0"/.test(suite)&&/errors="0"/.test(suite),'RealSessionEngineDemoModeTest proves DEMO revenue guard',suite)}else check(false,'SQLite/read-only DEMO revenue verification unavailable',String(e.message||e))}}catch(e){check(false,'runner aborted',e.stack||String(e))}finally{await reset();cleanupPreviousInstance();kill(vite);if(vite){await delay(800);try{const orphans=viteProcesses();check(orphans.length===0,'No orphaned V2 node/vite processes after Vite tree shutdown',orphans.length?`PIDs: ${orphans.join(', ')}`:'none')}catch(e){check(false,'V2 node/vite orphan process verification',String(e))}}result.status=result.failures.length?'FAIL':'PASS-SIMULATED';writeFileSync(resolve(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))}if(result.failures.length)process.exitCode=1;
