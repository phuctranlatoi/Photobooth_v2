import {spawn,execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {resolve} from 'node:path';
import {writeFileSync,mkdirSync} from 'node:fs';
const root=resolve(import.meta.dirname,'..'),out=resolve(import.meta.dirname,'simulator-evidence');mkdirSync(out,{recursive:true});
const host=spawn(resolve(root,'src-tauri/target/debug/le-souvenir-v2.exe'),[],{cwd:root,env:{...process.env,V2_JAVA_HOME:'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.8-hotspot',TEMP:resolve(root,'src-tauri/.tmp'),TMP:resolve(root,'src-tauri/.tmp'),WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:'--remote-debugging-port=9223 --remote-debugging-address=127.0.0.1'},stdio:'ignore'});
console.log('HOST',host.pid);let ws;
const ps=s=>execFileSync('powershell.exe',['-NoProfile','-Command',s],{encoding:'utf8'}).trim();
try{
 let page;for(let i=0;i<60;i++){try{page=(await(await fetch('http://127.0.0.1:9223/json/list')).json()).find(p=>p.type==='page');}catch{}if(page)break;await delay(500);}if(!page)throw Error('WebView unavailable');
 ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let seq=0;const pending=new Map();ws.onmessage=e=>{const d=JSON.parse(e.data);if(pending.has(d.id)){pending.get(d.id)(d);pending.delete(d.id);}};
 const call=(method,params={})=>new Promise((r,j)=>{const id=++seq;const timer=setTimeout(()=>j(Error('CDP timeout '+method)),15000);pending.set(id,d=>{clearTimeout(timer);d.error?j(d.error):r(d.result);});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=async expression=>{for(let i=0;i<160;i++){if(await run(expression))return;await delay(250);}throw Error('Timeout '+expression+'\n'+await run('document.body.innerText'));};
 const phase=state=>wait(`document.querySelector('.simulator [role=status]')?.textContent===${JSON.stringify(state)}`);
 const click=async(label,index=0)=>{await wait(`Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()===${JSON.stringify(label)})[${index}]?.disabled===false`);await run(`Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()===${JSON.stringify(label)})[${index}].click()`);await delay(200);};
 const shot=async name=>{await delay(300);const r=await call('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(out,name+'.png'),Buffer.from(r.data,'base64'));console.log(name,await run(`JSON.stringify({viewport:[innerWidth,innerHeight],images:Array.from(document.querySelectorAll('.simulator img')).map(i=>({alt:i.alt,natural:[i.naturalWidth,i.naturalHeight],rect:[i.width,i.height]})),buttons:Array.from(document.querySelectorAll('.simulator button')).map(b=>({text:b.textContent,rect:[b.getBoundingClientRect().x,b.getBoundingClientRect().y,b.clientWidth,b.clientHeight]}))})`));};
 await wait(`!!document.querySelector('.simulator article button')`);
 for(const [index,width,height]of [[0,1280,800],[1,1920,1200]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await phase('IDLE');await shot('welcome-'+index);
  await click('Start simulator session',index);await phase('SELECTING');await click('Continue');await phase('SELECTING_QUANTITY');await click('2');await phase('PAYMENT_PENDING');
  await click('Back');await phase('SELECTING_QUANTITY');await click('2');await phase('PAYMENT_PENDING');await shot('payment-'+index);
  await click('Simulate payment approval');await phase('LIVE_VIEW');await wait(`document.querySelector('img[alt="Live synthetic simulator preview"]')?.naturalWidth>0`);await shot('live-'+index);await click('Start capture');await phase('SELECTING_PHOTOS');
  const count=index===0?2:4;for(let n=0;n<count;n++){await wait(`!document.querySelectorAll('.photo-grid button')[${n}]?.disabled`);await run(`document.querySelectorAll('.photo-grid button')[${n}].click()`);await delay(250);}await shot('selection-'+index);await click('Continue to frames');await phase('EDITING');await click('V2 generated transparent test frame');await wait(`document.querySelector('.composition')?.naturalWidth>0`);await click('Continue to preview');await phase('PRINT_PENDING');await shot('print-preview-'+index);
  await call('Page.reload');await phase('PRINT_PENDING');await wait(`document.querySelector('.composition')?.naturalWidth>0`);console.log('RELOAD PREVIEW recovered',index);
  await click('Confirm dryrun');await phase('DELIVERY');await shot('delivery-'+index);console.log('DELIVERY DOM',await run('document.body.innerText'));
  await click('Finish simulator session');await phase('IDLE');if(await run(`sessionStorage.getItem('v2-simulator-session')!==null`))throw Error('Session retained after finish');
 }
 const children=JSON.parse(ps(`$a=@(Get-CimInstance Win32_Process -Filter 'ParentProcessId=${host.pid}'|Where-Object Name -eq 'cmd.exe'); @($a|ForEach-Object{Get-CimInstance Win32_Process -Filter "ParentProcessId=$($_.ProcessId)"}|Where-Object Name -eq 'java.exe'|Select-Object ProcessId,Name)|ConvertTo-Json -Compress`));const jvm=Array.isArray(children)?children[0]:children;console.log('ACTIVE JVM',jvm);
 console.log('CLOSE',ps(`(Get-Process -Id ${host.pid}).CloseMainWindow()`));await new Promise(r=>host.once('exit',code=>{console.log('HOST EXIT',code);r();}));await delay(500);console.log('JVM',ps(`if(Get-Process -Id ${jvm.ProcessId} -ErrorAction SilentlyContinue){throw 'orphan'}else{'terminated'}`));
}finally{ws?.close();if(host.exitCode===null)ps(`(Get-Process -Id ${host.pid}).CloseMainWindow()`);}
