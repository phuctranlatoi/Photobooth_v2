// Independent black-box test of the installed JVM framed-stdio simulator.
// It does not import backend classes, invoke Rust directly, or touch hardware/network.
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const launcher = resolve(root, 'backend/build/install/backend/bin/backend.bat');
const javaHome = process.env.V2_JAVA_HOME || 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.8-hotspot';
const child = spawn('cmd.exe', ['/d', '/c', launcher, '--simulator'], {
  cwd: resolve(root, 'backend'),
  env: { ...process.env, JAVA_HOME: javaHome, SIMULATOR_CAPTURE_ENABLED: 'true',
    TEMP: resolve(root, 'backend/.tmp'), TMP: resolve(root, 'backend/.tmp') },
  stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
});
let stderr = ''; child.stderr.on('data', b => { stderr = (stderr + b).slice(-8192); });
let bytes = Buffer.alloc(0), nextId = 0, childFailure;
const replies = [];
child.stdout.on('data', b => { bytes = Buffer.concat([bytes, b]); drain(); });
function failPending(error) { childFailure = error; while (replies.length) replies.shift().reject(error); }
child.once('error', e => failPending(Error(`backend spawn failed: ${e.message}`)));
child.once('exit', (code, signal) => { if (replies.length) failPending(Error(`backend exited during RPC: code=${code} signal=${signal}; stderr tail=${stderr}`)); });
function drain() {
  try { while (bytes.length >= 4) {
      const n = bytes.readUInt32BE(); if (n < 1 || n > 1048576) throw Error(`bad response frame ${n}`);
      if (bytes.length < n + 4) return;
      const body = bytes.subarray(4, n + 4); bytes = bytes.subarray(n + 4);
      const waiter = replies.shift(); if (!waiter) throw Error('unsolicited backend frame');
      clearTimeout(waiter.timer); waiter.resolve(JSON.parse(body.toString('utf8')));
  } } catch (e) { failPending(e); }
}
async function rpc(method, params = {}) {
  if (childFailure) throw childFailure;
  const id = `independent-${++nextId}`;
  const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', id, method, params, protocolVersion: 1 }));
  const frame = Buffer.alloc(4 + body.length); frame.writeUInt32BE(body.length); body.copy(frame, 4);
  const answer = new Promise((resolve, reject) => {
    const waiter = { resolve, reject, timer: undefined };
    waiter.timer = setTimeout(() => {
      const index = replies.indexOf(waiter); if (index >= 0) replies.splice(index, 1);
      reject(Error(`RPC timeout after 12000 ms: ${method}`));
    }, 12000);
    replies.push(waiter);
  });
  await new Promise((resolve, reject) => child.stdin.write(frame, e => e ? reject(e) : resolve()));
  const response = await answer;
  assert(response.id === id && response.protocolVersion === 1, 'response correlation/version');
  if (response.error) throw Object.assign(Error(JSON.stringify(response.error)), { rpcError: response.error });
  return response.result;
}
const assert = (v, m) => { if (!v) throw Error(`ASSERT: ${m}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function rejected(method, params, code) {
  try { await rpc(method, params); throw Error(`expected ${method} rejection`); }
  catch (e) { assert(e.rpcError?.code === code, `${method} expected ${code}, got ${e.rpcError?.code}`); }
}
const mutation = (sessionId, generationId, extra = {}) => ({ sessionId, generationId, commandId: randomUUID(), ...extra });
async function waitState(ids, wanted, timeout = 30000) {
  const end = Date.now() + timeout;
  do { const s = await rpc('session.getState', ids); if (s.state === wanted) return s; await sleep(25); } while (Date.now() < end);
  throw Error(`timeout waiting for ${wanted}`);
}
function pngDimensions(b) { assert(b.subarray(1,4).toString() === 'PNG', 'PNG decodes/signature'); return [b.readUInt32BE(16), b.readUInt32BE(20)]; }
function jpegDimensions(b) {
  assert(b[0] === 0xff && b[1] === 0xd8, 'JPEG SOI'); let p = 2;
  while (p + 9 < b.length) { if (b[p++] !== 0xff) continue; const marker=b[p++]; if (marker===0xd8 || marker===0xd9) continue;
    const n=b.readUInt16BE(p); if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) return [b.readUInt16BE(p+5),b.readUInt16BE(p+3)]; p += n; }
  throw Error('JPEG dimensions unavailable');
}
const sha = b => createHash('sha256').update(b).digest('hex');

async function enterLive(layoutId) {
  const sessionId=randomUUID(), generationId=randomUUID(), ids={sessionId,generationId};
  await rpc('session.start', mutation(sessionId,generationId,{layoutId}));
  await rejected('session.cancel', mutation(sessionId,generationId), -32001);
  await rejected('session.transition', mutation(sessionId,generationId,{targetState:'DELIVERY'}), -32601);
  await rpc('session.confirmSetup', mutation(sessionId,generationId));
  await rpc('session.setQuantity', mutation(sessionId,generationId,{quantity:3}));
  await rejected('session.cancel', mutation(sessionId,generationId), -32001);
  await rpc('payment.mockComplete', mutation(sessionId,generationId));
  await waitState(ids,'LIVE_VIEW'); return ids;
}
async function capture(ids) { await rpc('capture.startSequence',mutation(ids.sessionId,ids.generationId)); return waitState(ids,'SELECTING_PHOTOS',45000); }
async function originals(ids, catalog) {
  const dir=resolve(root,'backend/build/simulator-sessions',ids.sessionId);
  const names=(await readdir(dir)).filter(n=>n.startsWith('original-')&&n.endsWith('.jpg')).sort();
  const files=await Promise.all(names.map(async n=>({name:n,bytes:await readFile(resolve(dir,n))})));
  const configuredDimensions=`${catalog.captureWidth}x${catalog.captureHeight}`;
  files.forEach(f=>assert(jpegDimensions(f.bytes).join('x')===configuredDimensions,`${f.name} JPEG header dimensions match catalog`));
  return {dir,files,hashes:files.map(f=>sha(f.bytes))};
}
async function generatedPairs(dir) {
  const names=await readdir(dir);
  const compositions=names.filter(n=>/^composition-[0-9a-f-]{36}\.png$/i.test(n)).sort();
  const printImages=names.filter(n=>/^print-image-[0-9a-f-]{36}\.png$/i.test(n)).sort();
  return {compositions,printImages};
}
function dataUrlBytes(value, kind) {
  const match=typeof value==='string'&&value.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
  assert(match,`${kind} is bounded JPEG data URL`); return Buffer.from(match[1],'base64');
}
async function full(layout, catalog) {
  const ids=await enterLive(layout.id); const captured=await capture(ids);
  assert(captured.layout.id===layout.id && captured.layout.shotCount===layout.shotCount && captured.layout.selectCount===layout.selectCount && captured.layout.countdownSeconds===layout.countdownSeconds,'layout remains catalog-configured');
  const before=await originals(ids,catalog); assert(before.files.length===layout.shotCount,'original count equals configured shotCount');
  for(let i=0;i<layout.selectCount;i++) await rpc('selection.toggle',mutation(ids.sessionId,ids.generationId,{shotIndex:i}));
  await rpc('selection.confirm',mutation(ids.sessionId,ids.generationId));
  const frames=await rpc('frame.list',ids); assert(frames.frames.length>0,'frame list');
  const artifactsBefore=await generatedPairs(before.dir);
  await rpc('frame.select',mutation(ids.sessionId,ids.generationId,{frameId:frames.frames[0].id}));
  const artifactsAfterSelect=await generatedPairs(before.dir);
  const newCompositions=artifactsAfterSelect.compositions.filter(n=>!artifactsBefore.compositions.includes(n));
  const newPrintImages=artifactsAfterSelect.printImages.filter(n=>!artifactsBefore.printImages.includes(n));
  assert(newCompositions.length===1&&newPrintImages.length===1,'frame.select publishes exactly one new UUID composition/print pair');
  const selectedCompositionPath=resolve(before.dir,newCompositions[0]), selectedPaperPath=resolve(before.dir,newPrintImages[0]);
  const expectedComp=layout.printSizeLabel==='5x15'?'1184x3580':'2368x3580';
  assert(pngDimensions(await readFile(selectedCompositionPath)).join('x')===expectedComp,'frame-selection composition header dimensions');
  assert(pngDimensions(await readFile(selectedPaperPath)).join('x')==='2452x3658','frame-selection paper header dimensions');
  const editing=await rpc('session.getState',ids);
  const compositionPreview=dataUrlBytes(editing.compositionDataUrl,'composition preview');
  const printPreview=dataUrlBytes(editing.printImageDataUrl,'print preview');
  assert(jpegDimensions(compositionPreview).every(n=>n>0)&&jpegDimensions(printPreview).every(n=>n>0),'published previews have JPEG dimension headers');
  await rpc('frame.confirm',mutation(ids.sessionId,ids.generationId));
  const artifactsBeforeConfirm=await generatedPairs(before.dir);
  const confirm=mutation(ids.sessionId,ids.generationId); const first=await rpc('print.confirmDryRun',confirm);
  const artifactsAfterConfirm=await generatedPairs(before.dir);
  const confirmedCompositions=artifactsAfterConfirm.compositions.filter(n=>!artifactsBeforeConfirm.compositions.includes(n));
  const confirmedPrintImages=artifactsAfterConfirm.printImages.filter(n=>!artifactsBeforeConfirm.printImages.includes(n));
  assert(confirmedCompositions.length===1&&confirmedPrintImages.length===1,'first confirm publishes exactly one new UUID composition/print pair');
  const compositionPath=resolve(before.dir,confirmedCompositions[0]), paperPath=resolve(before.dir,confirmedPrintImages[0]);
  const outputHashesBeforeDuplicate={composition:sha(await readFile(compositionPath)),printImage:sha(await readFile(paperPath))};
  const artifactsBeforeDuplicate=await generatedPairs(before.dir);
  const duplicate=await rpc('print.confirmDryRun',confirm);
  const outputHashesAfterDuplicate={composition:sha(await readFile(compositionPath)),printImage:sha(await readFile(paperPath))};
  const artifactsAfterDuplicate=await generatedPairs(before.dir);
  assert(JSON.stringify(first)===JSON.stringify(duplicate),'duplicate confirm returns byte-equivalent JSON value');
  assert(JSON.stringify(outputHashesBeforeDuplicate)===JSON.stringify(outputHashesAfterDuplicate),'duplicate confirm leaves composition and print files byte-identical');
  assert(JSON.stringify(artifactsBeforeDuplicate)===JSON.stringify(artifactsAfterDuplicate),'duplicate confirm creates no additional generated artifacts');
  assert(first.state==='DELIVERY'&&first.userConfirmed===true&&first.printAccepted===false&&first.revenueRecorded===false,'manual dryrun delivery/no print/no revenue');
  const after=await originals(ids,catalog); assert(JSON.stringify(before.hashes)===JSON.stringify(after.hashes),'original hashes unchanged');
  const composition=await readFile(compositionPath), paper=await readFile(paperPath);
  assert(pngDimensions(composition).join('x')===expectedComp,'composition dimensions'); assert(pngDimensions(paper).join('x')==='2452x3658','paper dimensions');
  await rejected('print.confirmDryRun',mutation(ids.sessionId,ids.generationId),-32001);
  await rejected('session.getState',{sessionId:ids.sessionId,generationId:randomUUID()},-32004);
  await rpc('session.finish',mutation(ids.sessionId,ids.generationId)); const idle=await rpc('session.getState',ids);
  assert(idle.state==='IDLE'&&idle.selectedCount===0&&idle.selectedIndices.length===0&&idle.frameId===null&&idle.previewDataUrl===null&&idle.compositionDataUrl===null&&idle.printImageDataUrl===null,'finish resets selection/frame/images to IDLE');
  console.log('FULL',layout.id,{fixture:true,frameSelectionArtifacts:[newCompositions[0],newPrintImages[0]],confirmedAuthoritativeArtifacts:[confirmedCompositions[0],confirmedPrintImages[0]],originals:before.files.length,captureHeaderDimensions:`${catalog.captureWidth}x${catalog.captureHeight}`,compositionHeaderDimensions:expectedComp,paperHeaderDimensions:'2452x3658',previewJpegHeaders:true,originalHashesUnchanged:true,duplicateOutputHashesUnchanged:true,duplicateCreatedArtifacts:false,noRevenue:true});
}

try {
  const health=await rpc('health.check'); assert(health.simulator===true,'simulator health');
  const catalog=await rpc('catalog.get'); assert(catalog.layouts.length===2,'fixture catalog contains exactly two configured test layouts');
  assert(Number.isInteger(catalog.captureWidth)&&catalog.captureWidth>0&&Number.isInteger(catalog.captureHeight)&&catalog.captureHeight>0,'catalog capture dimensions');
  for (const layout of catalog.layouts) await full(layout,catalog);
  const cancelIds=await enterLive(catalog.layouts[0].id); await capture(cancelIds); const cancelled=await rpc('session.cancel',mutation(cancelIds.sessionId,cancelIds.generationId)); assert(cancelled.state==='IDLE','allowed cancellation resets');
  const timeoutIds=await enterLive(catalog.layouts[0].id); await capture(timeoutIds); const timed=await waitState(timeoutIds,'DELIVERY',45000);
  assert(timed.userConfirmed===false&&timed.printAccepted===false&&timed.revenueRecorded===false,'timeout delivery not user-confirmed/no print/no revenue');
  console.log('TIMEOUT',{userConfirmed:timed.userConfirmed,printAccepted:timed.printAccepted,revenueRecorded:timed.revenueRecorded});
  console.log('PASS-SIMULATED framed JVM regression');
} finally {
  child.stdin.end();
  try { await Promise.race([child.exitCode === null ? once(child,'exit') : Promise.resolve(), sleep(10000).then(()=>{throw Error('backend EOF shutdown timeout');})]); }
  catch (e) {
    try { execFileSync('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'}); } catch {}
    throw e;
  }
  if (child.exitCode !== 0) throw Error(`backend exit ${child.exitCode}; stderr tail=${stderr}`);
}
