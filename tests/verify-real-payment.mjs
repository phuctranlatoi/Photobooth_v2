/** Mounted REAL-mode payment acceptance test. Does not approve payment or staff override. */
import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const root=resolve(import.meta.dirname,'..');
const frontend=resolve(root,'frontend');
const exe=resolve(root,'src-tauri/target/debug/le-souvenir-v2.exe');
const out=resolve(import.meta.dirname,'real-payment-evidence',new Date().toISOString().replaceAll(':','-'));
mkdirSync(out,{recursive:true});
const results={status:'PASS-REAL-MODE-DESKTOP',scope:'REAL runtime desktop/WebView; no payment completion, hardware capture, print, upload, or staff override executed',evidence:out,views:[],failures:[],observations:[]};
let vite,app,ws,id=0;const pending=new Map();
const fail=(view,message,detail='')=>{results.failures.push({view,message,detail});console.error('FAIL',view,message,detail)};
const note=(view,message,detail='')=>{results.observations.push({view,message,detail});console.log('NOTE',view,message,detail)};
async function endpoint(url,ms=30000){const end=Date.now()+ms;while(Date.now()<end){try{const r=await fetch(url);if(r.ok)return r}catch{}await delay(200)}throw Error(`Timeout waiting for ${url}`)}
async function connect(){const pages=await (await endpoint('http://127.0.0.1:9223/json/list',45000)).json();const p=pages.find(x=>x.type==='page'&&!String(x.url).startsWith('devtools:'));if(!p)throw Error('No Tauri WebView page target');ws=new WebSocket(p.webSocketDebuggerUrl);await new Promise((ok,bad)=>{ws.onopen=ok;ws.onerror=bad});ws.onmessage=e=>{const m=JSON.parse(e.data),fn=pending.get(m.id);if(fn){pending.delete(m.id);fn(m)}}}
function call(method,params={}){return new Promise((ok,bad)=>{const n=++id,t=setTimeout(()=>{pending.delete(n);bad(Error(`CDP timeout ${method}`))},20000);pending.set(n,m=>{clearTimeout(t);m.error?bad(Error(JSON.stringify(m.error))):ok(m.result)});ws.send(JSON.stringify({id:n,method,params}))})}
async function run(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function wait(expression,label,ms=45000){const end=Date.now()+ms;while(Date.now()<end){if(await run(expression))return;await delay(150)}throw Error(`Timeout waiting for ${label}; body=${(await run('document.body.innerText')).slice(0,2000)}`)}
async function clickText(pattern){const source=pattern.source,flags=pattern.flags;const exp=`Array.from(document.querySelectorAll('button')).find(e=>e.offsetParent!==null&&new RegExp(${JSON.stringify(source)},${JSON.stringify(flags)}).test([e.innerText,e.getAttribute('aria-label')].filter(Boolean).join(' ')))`;await wait(`${exp}&&!${exp}.disabled`,`button ${pattern}`);await run(`${exp}.click()`);await delay(350)}
async function shot(view,name){const p=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const path=resolve(out,`${view}-${name}.png`);writeFileSync(path,Buffer.from(p.data,'base64'));return path}
function killTree(child){if(!child?.pid)return;try{execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'})}catch{}}

try{
  try{await endpoint('http://127.0.0.1:1420',1000);note('all','Used existing Vite server','http://127.0.0.1:1420')}catch{
    vite=spawn('npm.cmd',['run','dev','--','--port','1420','--strictPort'],{cwd:frontend,stdio:['ignore','pipe','pipe'],windowsHide:true});
    await endpoint('http://127.0.0.1:1420',30000);
  }
  app=spawn(exe,[],{cwd:root,env:{...process.env,V2_RUNTIME_MODE:'real',V2_JAVA_HOME:'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.8-hotspot',WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:'--remote-debugging-port=9223 --remote-debugging-address=127.0.0.1'},stdio:['ignore','pipe','pipe'],windowsHide:false});
  let hostLog='',hostErr='';app.stdout.on('data',d=>hostLog+=d);app.stderr.on('data',d=>hostErr+=d);
  await connect();await call('Page.enable');await call('Runtime.enable');
  const consoleEvents=[];await call('Log.enable');ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Log.entryAdded')consoleEvents.push(m.params.entry)});
  for(const [w,h] of [[1280,800],[1920,1200]]){
    const view=`${w}x${h}`;await call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});
    await wait("document.body.innerText.includes('KIOSK TRỰC TIẾP') && document.body.innerText.includes('Dải ảnh 5x15 cm')", 'real start screen ready');
    const catalog=await run('document.body.innerText');
    for(const title of ['Dải ảnh 5x15 cm','Khung ảnh 10x15 cm'])if(!catalog.includes(title))fail(view,`Missing real catalog title: ${title}`,catalog);
    if(catalog.includes('Synthetic strip fixture'))fail(view,'Synthetic strip fixture exposed in REAL mode',catalog);
    await shot(view,'catalog');await clickText(/CHẠM ĐỂ BẮT ĐẦU/);
    await wait(`document.body.innerText.includes('Bố cục')&&document.body.innerText.includes('Tiếp tục')`,'layout selection');
    await clickText(/^Tiếp tục/);await wait(`document.body.innerText.includes('Chọn số lượng')`,'quantity');
    // Required case uses two copies; adjust through the visible customer stepper if necessary.
    let quantity=await run(`document.querySelector('.v1-stepper strong')?.textContent.trim()`);
    while(quantity!=='2'){await clickText(quantity<'2'?/Tăng số lượng/:/Giảm số lượng/);quantity=await run(`document.querySelector('.v1-stepper strong')?.textContent.trim()`)}
    await clickText(/^Tiếp tục/);await wait(`document.body.innerText.includes('Bước 3')&&document.body.innerText.includes('Thanh toán')`,'payment screen',60000);await delay(1500);
    const text=await run('document.body.innerText');
    const exact=['Bước 3','Thanh toán','Quét QR bằng ứng dụng ngân hàng hoặc nhờ nhân viên xác nhận tiền mặt.','Số tiền cần thanh toán','70.000 đ','Bố cục','Dải ảnh 5x15 cm','Bản in','2 bản','Thanh toán QR'];
    for(const expected of exact)if(!text.includes(expected))fail(view,`Missing payment content: ${expected}`,text);
    if(text.includes('Synthetic strip fixture'))fail(view,'Synthetic fixture leaked onto payment screen',text);
    if(/Xác nhận thanh toán\s*\(Tiền mặt\s*\/\s*Tiếp tục\)/i.test(text))fail(view,'Customer-facing payment bypass is present',text);
    const qrState=await run(`(()=>{const p=document.querySelector('[aria-label="Mã thanh toán"]');return {present:!!p,text:p?.innerText||'',image:!!p?.querySelector('img[alt="Mã VietQR"]')}})()`);
    if(!qrState.present||!qrState.text.trim())fail(view,'QR configuration panel absent or empty',JSON.stringify(qrState));else note(view,'QR panel state',JSON.stringify(qrState));
    // Hold the heading for >=700 ms; only visibility is asserted, the override is never clicked.
    await run(`document.querySelector('.v1-payment-heading h1').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1}))`);await delay(800);
    const staff=await run(`Array.from(document.querySelectorAll('button')).some(b=>b.offsetParent!==null&&b.innerText.trim()==='Nhân viên xác nhận tiền mặt')`);
    if(!staff)fail(view,'Staff cash override not revealed by >=700ms heading hold');
    const png=await shot(view,'payment-staff-override-visible');
    const badLogs=consoleEvents.filter(e=>/-32001|Create payment link first/i.test(`${e.text||''} ${e.url||''}`));
    if(badLogs.length)fail(view,'Forbidden payment rejection in WebView logs',JSON.stringify(badLogs));
    results.views.push({view,catalogScreenshot:resolve(out,`${view}-catalog.png`),paymentScreenshot:png,qrState,staffOverrideVisible:staff});
    // Return to idle solely through visible Back controls for the next viewport.
    for(let n=0;n<4&&!await run(`document.body.innerText.includes('CHẠM ĐỂ BẮT ĐẦU')`);n++)await clickText(/Quay lại/);
    await wait(`document.body.innerText.includes('CHẠM ĐỂ BẮT ĐẦU')`,'idle after back');
  }
  writeFileSync(resolve(out,'webview-log.json'),JSON.stringify(consoleEvents,null,2));
  writeFileSync(resolve(out,'host-stdout.log'),hostLog);writeFileSync(resolve(out,'host-stderr.log'),hostErr);
}catch(e){fail('runner','Runner aborted',e?.stack||String(e))}
finally{results.status=results.failures.length?'FAIL':'PASS-REAL-MODE-DESKTOP';writeFileSync(resolve(out,'results.json'),JSON.stringify(results,null,2));try{ws?.close()}catch{}killTree(app);killTree(vite)}
console.log(JSON.stringify(results,null,2));if(results.failures.length)process.exitCode=1;
