import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const root=resolve(import.meta.dirname,'..','..','..'); const out=resolve(import.meta.dirname); const exe=resolve(root,'src-tauri/target/debug/le-souvenir-v2.exe'); mkdirSync(out,{recursive:true});
const evidence={status:'RUNNING',root,out,actions:[],screenshots:[],errors:[],backendMode:null}; let app,ws,seq=0; const pending=new Map();
const ps=s=>execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',s],{encoding:'utf8'}).trim();
function ownAlive(){return app?.pid && !app.killed}
async function endpoint(url,ms=30000){let last; const until=Date.now()+ms; while(Date.now()<until){try{const r=await fetch(url);if(r.ok)return r;last=await r.text()}catch(e){last=String(e)} await delay(200)}throw Error(`Endpoint timeout ${url}: ${last}`)}
async function connect(){const list=await (await endpoint('http://127.0.0.1:9223/json/list')).json(); const page=list.find(x=>x.type==='page'&&!String(x.url).startsWith('devtools:'));if(!page)throw Error('No mounted native WebView CDP target');ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((ok,bad)=>{ws.onopen=ok;ws.onerror=bad});ws.onmessage=e=>{const m=JSON.parse(e.data);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}}}
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},30000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});ws.send(JSON.stringify({id,method,params}))})}
async function js(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function wait(expression,label,ms=60000){const end=Date.now()+ms;while(Date.now()<end){if(await js(`Boolean(${expression})`))return;await delay(150)}throw Error(`Timeout ${label}; text=${(await js('document.body.innerText')).slice(0,1200)}`)}
async function shot(name){await delay(350);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const f=resolve(out,`${String(evidence.screenshots.length+1).padStart(2,'0')}-${name}.png`);writeFileSync(f,Buffer.from(r.data,'base64'));evidence.screenshots.push(f);console.log('SHOT',f)}
async function click(label,expr){await wait(`${expr} && !(${expr}).disabled`,label);await js(`(${expr}).click()`);evidence.actions.push(label);await delay(300)}
async function phase(text,ms=60000){await wait(`document.body.innerText.includes(${JSON.stringify(text)})`,text,ms)}
try{
 if(ps("Get-NetTCPConnection -State Listen -LocalPort 9223 -ErrorAction SilentlyContinue | Out-String; exit 0"))throw Error('Port 9223 already occupied; refusing competing CDP host');
 const env={...process.env,V2_RUNTIME_MODE:'simulator',SIMULATOR_CAPTURE_ENABLED:'true',V2_LOCAL_OPERATOR_ENABLED:'false',V2_JAVA_HOME:process.env.V2_JAVA_HOME||'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.8-hotspot',WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:'--remote-debugging-port=9223 --remote-debugging-address=127.0.0.1'};
 app=spawn(exe,[],{cwd:root,env,stdio:'ignore'}); console.log('HOST_PID',app.pid); await connect(); await call('Page.enable'); await call('Runtime.enable'); await call('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
 await wait(`document.querySelector('.v1-start')`, 'current mounted start screen'); await wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('CHẠM ĐỂ BẮT ĐẦU')&&!b.disabled)`,'enabled start');
 const txt=await js('document.body.innerText'); console.log('INITIAL_UI',txt.slice(0,1200)); await shot('welcome');
 await click('start',`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('CHẠM ĐỂ BẮT ĐẦU'))`); await phase('Chọn kiểu ảnh yêu thích'); await shot('layout');
 // centered card confirms on second click
 await click('confirm default layout',`document.querySelector('.v1-layout-card[aria-pressed="true"]')`); await phase('Chọn số lượng bản in'); await shot('quantity-default');
 await click('increase quantity',`document.querySelector('button[aria-label="Tăng số lượng"]')`); await shot('quantity-increased-price');
 await click('continue quantity',`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Tiếp tục'))`); await phase('Thanh toán'); await shot('payment');
 // Demo-safe staff flow, hold title to PIN then mock cash action. This only calls payment.mockComplete in simulator.
 const heading=`document.querySelector('.v1-payment-heading .v1-heading-title, .v1-payment-heading h1, .v1-heading-title')`;
 await wait(heading,'payment heading'); await js(`(()=>{const e=${heading}; const r=e.getBoundingClientRect();e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:r.left+r.width/2,clientY:r.top+r.height/2}))})()`); await delay(1150); await js(`(${heading})?.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch'}))`); await wait(`document.querySelector('.v1-staff-pin')`,'staff PIN modal'); await shot('payment-staff-pin');
 for(const d of ['1','2','3','4'])await click('pin '+d,`document.querySelector('.v1-pin-keypad button[aria-label="${d}"]')`); await wait(`document.querySelector('.v1-staff-cash-btn')`,'simulator staff payment control'); await shot('payment-staff-approved-control');
 await click('simulator mock cash approval',`document.querySelector('.v1-staff-cash-btn')`); await wait(`document.querySelector('.v1-capture-screen')`,'prepare/live camera',60000); await shot('live-view');
 await click('start synthetic capture',`document.querySelector('button[aria-label="Bắt đầu chụp"]')`); await wait(`document.querySelector('.v1-countdown-layer')`,'countdown',15000); await shot('countdown'); await wait(`document.body.innerText.includes('Chọn ảnh để in')`,'photo selection',120000); await shot('photo-selection-empty');
 const needed=await js(`Number((document.body.innerText.match(/Đã chọn \\d+\\/(\\d+)/)||[])[1])`); if(!needed)throw Error('Cannot determine configured select count'); evidence.configuredSelectionCount=needed; evidence.configuredShotCount=await js(`Number((document.querySelector('.v1-capture-top')?.textContent.match(/\\/(\\d+)/)||[])[1])||0`);
 for(let i=1;i<=needed;i++)await click('select photo '+i,`document.querySelector('button[aria-label="Chọn ảnh ${i}"]')`); await shot('photo-selection-complete');
 await click('continue selected photos',`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Tiếp tục →')`); await phase('Chọn khung trang trí'); await wait(`document.querySelectorAll('.v1-frame-grid button').length>0`,'frame options'); await shot('frame-list');
  await click('select first frame',`document.querySelector('.v1-frame-grid button')`); await delay(800); await shot('13-frame-selected');
 await wait(`document.querySelector(".v1-confirm-screen")`,'final dry-run confirmation'); await shot('14-final-dryrun-confirmation');
 await click('confirm simulator dry-run',`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Xác nhận & in'))`); await wait(`document.querySelector(".v1-delivery-screen")`,'simulator delivery',60000); await shot('15-delivery');
 await click('finish simulator session',`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Hoàn thành · Về trang đầu'))`); await wait(`document.querySelector(".v1-start")`,'return to start');
 await js(`(()=>{const b=document.querySelector('[data-admin-trigger="true"]');for(let i=0;i<5;i++)b?.click()})()`); await wait(`document.querySelector('[data-testid="operator-workspace"]')`,'operator workspace'); await shot('16-operator-frames');
 for(const tab of ['layouts','settings','tools','colors','revenue']){await click('operator '+tab,`document.querySelector('[data-testid="operator-tab-${tab}"]')`);await shot('operator-'+tab)}
 evidence.status='PASS-SIMULATED';
}catch(e){evidence.status='BLOCKED_OR_PARTIAL';evidence.errors.push(String(e));console.error('ERROR',e.stack||e)}finally{
 try{evidence.backendMode=ps(`Get-Content -LiteralPath '${root.replaceAll("'","''")}\\src-tauri\\.tmp\\backend-stderr.log' -Tail 30 -ErrorAction SilentlyContinue`)}catch{}
 try{ws?.close()}catch{}; try{if(app?.pid)ps(`$p=Get-Process -Id ${app.pid} -ErrorAction SilentlyContinue;if($p){$p.CloseMainWindow()|Out-Null;Start-Sleep -Milliseconds 800;if(!$p.HasExited){Stop-Process -Id $p.Id -Force}}`)}catch{};
 writeFileSync(resolve(out,'evidence.json'),JSON.stringify(evidence,null,2)); console.log(JSON.stringify(evidence,null,2)); if(evidence.status!=='PASS-PARTIAL-SAFE')process.exitCode=1;
}



