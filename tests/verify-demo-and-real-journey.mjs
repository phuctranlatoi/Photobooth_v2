/** Live Tauri/WebView acceptance test. No real payment, capture, upload, or print is authorized. */
import {spawn,execFileSync} from 'node:child_process';import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {setTimeout as delay} from 'node:timers/promises';
const root=resolve(import.meta.dirname,'..'),frontend=resolve(root,'frontend'),exe=resolve(root,'src-tauri/target/debug/le-souvenir-v2.exe'),out=resolve(import.meta.dirname,'journey-evidence',new Date().toISOString().replaceAll(':','-'));mkdirSync(out,{recursive:true});
const result={status:'PASS-SIMULATED',scope:'Live Tauri executable; DEMO journey plus REAL-mode payment display only',evidence:out,checks:[],failures:[],screenshots:[]};let vite,app,ws,seq=0;const pending=new Map();
const check=(ok,name,detail='')=>{result.checks.push({name,ok,detail});if(!ok){result.failures.push({name,detail});console.error('FAIL',name,detail)}else console.log('PASS',name)};
const endpoint=async(url,ms=45000)=>{const end=Date.now()+ms;while(Date.now()<end){try{const r=await fetch(url);if(r.ok)return r}catch{}await delay(200)}throw Error(`Timeout ${url}`)};const kill=c=>{if(c?.pid)try{execFileSync('taskkill',['/PID',`${c.pid}`,'/T','/F'],{stdio:'ignore'})}catch{}};
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
 await js("void (document.querySelector('[data-layout-id=\"515_4_anh\"], .v1-layout-card')?.click())");await delay(400); // Wait for carousel smooth-scroll animation to finish before snapping screenshot!
 await shot(view, `${modeTag}-layout`);await js("if (document.querySelector('.v1-layout-stage')) document.querySelector('.v1-layout-card[aria-pressed=\"true\"], .v1-layout-card')?.click()");await wait("Boolean(document.querySelector('.v1-stepper'))",'quantity screen');let q=await js("document.querySelector('.v1-stepper strong')?.textContent.trim()");for(let i=0;q!==undefined&&q!=='2'&&i<10;i++){await js("void (document.querySelector('.v1-stepper button:last-child')?.click())");await delay(200);q=await js("document.querySelector('.v1-stepper strong')?.textContent.trim()")}check(q==='2',`${view} quantity set to 2`);await shot(view, `${modeTag}-quantity-2`);await click(/Tiếp tục/i);await wait("Boolean(document.querySelector('.v1-payment-screen') || document.body.innerText.includes('Thanh toán'))",'payment screen')}
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
await click(/Nhân viên xác nhận tiền mặt/i);await wait("Boolean(document.querySelector('.v1-capture-screen') || document.body.innerText.includes('Bắt đầu chụp'))",'live demo');await shot(view,'demo-live');await click(/Bắt đầu chụp/);await wait("Boolean(document.querySelector('[aria-label=\"Chọn ảnh 1\"]:not(:disabled)'))",'mock captures',180000);await shot(view,'demo-select');const required = await js("Number((document.body.innerText.match(new RegExp('Đã chọn \\\\d+/(\\\\d+)'))||[])[1]) || 4");
// Test press-and-hold zoom gesture on photo 1
await js(`(() => {
  const p1 = document.querySelector('[aria-label="Chọn ảnh 1"]');
  if (p1) p1.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 150, clientY: 150 }));
})()`);
await delay(600);
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
 await js(`void (${btnExp}?.click())`);
await wait(`Boolean(document.body.innerText.includes('Đã chọn ${i}/') || document.querySelector('[aria-label="Chọn ảnh ${i}"][aria-pressed="true"]'))`, `photo ${i} selected`, 15000);
if (i === 1) {
const hasPreviewImage = await js("Boolean(document.querySelector('.v1-preview svg image'))");
check(hasPreviewImage, `${view} live frame preview renders chosen photos in real-time`);
}
await delay(300);
}
 await click(/Tiếp tục/i);await wait("Boolean(document.querySelector('.v1-frame-grid button'))",'frame buttons loaded');await js("void (document.querySelector('.v1-frame-grid button')?.click())");await wait("Boolean(!document.querySelector('button[aria-label*=\"Tiếp tục\"]')?.disabled || Array.from(document.querySelectorAll('button')).some(b => (b.textContent?.trim().startsWith('Tiếp tục') || b.textContent?.trim().includes('Xem bản in')) && !b.disabled))",'frame preview ready',60000);await shot(view,'demo-frame');await click(/Xem bản in|Tiếp tục/i);await wait("Boolean(document.querySelector('.v1-confirm-screen') || document.body.innerText.includes('Kiểm tra lần cuối'))",'confirm');await wait("Boolean(document.querySelector('.v1-preview img, img[alt*=\"Bản ghép\"], img[alt*=\"600 DPI\"]')?.naturalWidth)", 'composed preview loaded', 35000);check(Boolean(await js("Boolean(document.querySelector('.v1-preview img, img[alt*=\"Bản ghép\"], img[alt*=\"600 DPI\"]')?.naturalWidth)")), `${view} composed preview`);await shot(view,'demo-confirm');await click(/Xác nhận bản mô phỏng|Xác nhận & in|In và tạo QR|Hoàn thành trải nghiệm|Xác nhận/i);await wait("Boolean(document.querySelector('.v1-delivery-screen') || document.body.innerText.includes('Hoàn tất'))",'delivery',60000);await shot(view,'demo-delivery');await click(/Hoàn thành|Về trang đầu|Chụp lượt mới/i);await wait("document.body.innerText.includes('CHẠM ĐỂ BẮT ĐẦU') || document.body.innerText.includes('Chụp ảnh')",'start screen restored',15000)}
async function realPayment(view){await setupToPayment(view,false);const t=await js('document.body.innerText');check(/70\.000|90\.000|110\.000/.test(t),`${view} real calculated price displayed`);check(/bước\s*3/i.test(t) && t.includes('Thanh toán'),`${view} real payment: Bước 3 Thanh toán`);const hasQr=await js("Boolean(document.querySelector('.v1-payment-qr-card img, img[alt*=\"VietQR\"]'))");if(hasQr){const qrSrc=await js("document.querySelector('.v1-payment-qr-card img, img[alt*=\"VietQR\"]')?.src || ''");check(qrSrc.length>50,`${view} real VietQR image rendered (length=${qrSrc.length})`)}check(!t.includes('TRẢI NGHIỆM CHỤP ẢNH MIỄN PHÍ'),`${view} no free trial advertising in real payment`);await shot(view,'real-payment')}
try{if(!existsSync(exe))throw Error(`Missing ${exe}`);try{await endpoint('http://127.0.0.1:1420',1000)}catch{vite=spawn('npm.cmd',['run','dev','--','--port','1420','--strictPort'],{cwd:frontend,shell:true,stdio:['ignore','pipe','pipe']});await endpoint('http://127.0.0.1:1420')}await start('real');for(const [w,h] of [[1280,800],[1920,1200]]){await call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await demoJourney(`${w}x${h}`)}await reset();await start('real');for(const [w,h] of [[1280,800],[1920,1200]]){await call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await realPayment(`${w}x${h}`);if(`${w}x${h}` !== '1920x1200'){await reset();await start('real')}}try{const db=resolve(root,'data/sales.db'),output=execFileSync('sqlite3',[db,"select count(*) from sales where upper(coalesce(capture_mode,''))='DEMO';"],{encoding:'utf8'}).trim();check(output==='0','SQLite has zero sales records for DEMO sessions',output)}catch(e){const report=resolve(root,'backend/build/test-results/test/TEST-com.lesouvenir.v2.ipc.RealSessionEngineDemoModeTest.xml');if(existsSync(report)){const suite=readFileSync(report,'utf8').match(/<testsuite\b[^>]*>/)?.[0]||'';check(/tests="([1-9]\d*)"/.test(suite)&&/failures="0"/.test(suite)&&/errors="0"/.test(suite),'RealSessionEngineDemoModeTest proves DEMO revenue guard',suite)}else check(false,'SQLite/read-only DEMO revenue verification unavailable',String(e.message||e))}}catch(e){check(false,'runner aborted',e.stack||String(e))}finally{await reset();kill(vite);result.status=result.failures.length?'FAIL':'PASS-SIMULATED';writeFileSync(resolve(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))}if(result.failures.length)process.exitCode=1;
