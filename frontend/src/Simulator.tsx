import { useEffect, useRef, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import type { CatalogGetResult, FrameOption, SimulatorMethod } from './shared/simulator-contract';
import { safeImage, type Snapshot } from './shared/connected-simulator';
type Progress={state:string;countdownSecondsRemaining:number;completedShots:{shotId:string;preview:string}[]};
async function rpc<T>(method:SimulatorMethod,params:object={}):Promise<T>{
  if(!isTauri())throw Error('Simulator session connection unavailable — open desktop host.');
  return invoke<T>('simulator_request',{method,params});
}
export function Simulator(){
  const [catalog,setCatalog]=useState<CatalogGetResult>();
  const [s,setSnapshot]=useState<Snapshot>();
  const [progress,setProgress]=useState<Progress>();
  const [frames,setFrames]=useState<FrameOption[]>([]);
  const [preview,setPreview]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [cancel,setCancel]=useState(false);
  const session=useRef(sessionStorage.getItem('v2-simulator-session')??'');
  const generation=useRef(sessionStorage.getItem('v2-simulator-generation')??'');
  const epoch=useRef(0);
  const lock=useRef(false),alive=useRef(true);
  const intent=useRef(false);
  useEffect(()=>{setCancel(false);setFrames([]);},[s?.state,s?.layout.id,s?.generationId]);
  async function refresh(){
    if(!session.current)return;
    const token=epoch.current, sid=session.current,gen=generation.current;
    const next=await rpc<Snapshot>('session.getState',{sessionId:sid,generationId:gen});
    if(!alive.current||token!==epoch.current||next.sessionId!==sid||next.generationId!==gen)return;
    setSnapshot(next);
    setPreview(safeImage(next.previewDataUrl));
    setProgress({state:next.state,countdownSecondsRemaining:next.secondsRemaining,completedShots:next.shots??[]});
    if(next.state==='EDITING'){
      const f=await rpc<{frames:FrameOption[]}>('frame.list',{sessionId:sid,generationId:gen});if(alive.current&&token===epoch.current)setFrames(f.frames);
    }
  }
  useEffect(()=>{
    alive.current=true;const effectToken=++epoch.current;let timer:ReturnType<typeof setTimeout>;let loaded=false;
    async function poll(){
      if(!lock.current){lock.current=true;try{if(!loaded){const c=await rpc<CatalogGetResult>('catalog.get');if(alive.current&&effectToken===epoch.current)setCatalog(c);loaded=true;}await refresh();}catch(e){if(alive.current&&effectToken===epoch.current)setError(String(e));}finally{lock.current=false;}}
      if(alive.current&&effectToken===epoch.current)timer=setTimeout(poll,500);
    }
    void poll();return()=>{alive.current=false;++epoch.current;clearTimeout(timer);};
  },[]);
  async function command(method:SimulatorMethod,extra:object={}){
    if(intent.current)return;intent.current=true;setBusy(true);setError('');
    while(lock.current&&alive.current)await new Promise(r=>setTimeout(r,20));
    if(!alive.current){intent.current=false;return;}lock.current=true;
    try{
      if(method==='session.start'){session.current=crypto.randomUUID();generation.current=crypto.randomUUID();sessionStorage.setItem('v2-simulator-session',session.current);sessionStorage.setItem('v2-simulator-generation',generation.current);setPreview('');setProgress(undefined);}
      const commandId=crypto.randomUUID();
      const params={sessionId:session.current,generationId:generation.current,commandId,...extra};
      sessionStorage.setItem('v2-simulator-uncertain',JSON.stringify({method,params}));
      const r=await rpc<{previewDataUrl?:string;printImageDataUrl?:string;state?:string;cancelled?:boolean}>(method,params);
      sessionStorage.removeItem('v2-simulator-uncertain');
      if(!alive.current)return;
      if((method==='session.finish'||method==='session.cancel'||method==='session.back')&&(r.state==='IDLE'||r.cancelled)){
        session.current='';generation.current='';sessionStorage.removeItem('v2-simulator-session');sessionStorage.removeItem('v2-simulator-generation');setPreview('');setProgress(undefined);setFrames([]);setSnapshot(undefined);
      }else await refresh();
      setCancel(false);
    }catch(e){if(alive.current)setError(String(e));}finally{lock.current=false;intent.current=false;if(alive.current)setBusy(false);}
  }
  const state=s?.state??(session.current?'CONNECTING':'IDLE');
  const button=(label:string,method:SimulatorMethod,params:object={},disabled=false)=><button className="check" disabled={busy||!!error||disabled} onClick={()=>void command(method,params)}>{label}</button>;
  return <section className="simulator" aria-label="Connected simulator">
    <header><h2>SIMULATOR SAMPLE</h2><strong>No real payment · No paper printing · No revenue</strong></header>
    <p role="status">{busy?'Waiting for Kotlin…':state}</p>
    {error&&<div role="alert"><p>{error}</p><button className="check" disabled={busy} onClick={()=>{if(lock.current)return;lock.current=true;setBusy(true);void (async()=>{try{setCatalog(await rpc<CatalogGetResult>('catalog.get'));await refresh();setError('');}catch(e){setError(String(e));}finally{lock.current=false;setBusy(false);}})();}}>Reconcile status — do not replay</button></div>}
    {state==='IDLE'&&<><h1>A simulator memory.</h1><p>Fixture layouts only. No bundles, Beauty or real camera.</p>{catalog?.layouts.map(l=><article key={l.id}><h3>{l.title}</h3><p>{l.shotCount} captures · select {l.selectCount} · {l.countdownSeconds}s · {l.printSizeLabel}</p>{button('Start simulator session','session.start',{layoutId:l.id})}</article>)}</>}
    {state==='SELECTING'&&<><h2>Choose layout</h2>{catalog?.layouts.map(l=><button className="check" key={l.id} disabled={busy||!!error} aria-pressed={s?.layout.id===l.id} onClick={()=>void command('session.setLayout',{layoutId:l.id})}>{l.title}{s?.layout.id===l.id?' ✓':''}</button>)}{button('Continue','session.confirmSetup')}</>}
    {state==='SELECTING_QUANTITY'&&<><h2>Choose copies to continue to simulator payment</h2><p>Base {s?.pricing.basePrice.toLocaleString()} VND · included {s?.pricing.includedQuantity} · extra unit {s?.pricing.extraUnitPrice.toLocaleString()} VND</p><div className="quantities">{(s?.layout.printSizeLabel==='5x15'?catalog?.pricing.stripAllowedQuantities:catalog?.pricing.printAllowedQuantities)?.map(q=><button className="quantity" key={q} disabled={busy||!!error} onClick={()=>void command('session.setQuantity',{quantity:q})}>{q}</button>)}</div></>}
    {state==='PAYMENT_PENDING'&&<><h2>Simulator payment</h2><p>No money will be charged. Test amount: {s?.pricing.totalAmount.toLocaleString()} VND.</p>{button('Simulate payment approval','payment.mockComplete')}</>}
    {state==='PREPARING'&&<h2>Preparing simulator camera…</h2>}
    {['LIVE_VIEW','COUNTDOWN','CAPTURING'].includes(state)&&<div className="photo-stage"><div><h2>SIMULATOR CAMERA · synthetic Live View</h2>{safeImage(s?.livePreviewDataUrl)?<img alt="Live synthetic simulator preview" src={safeImage(s?.livePreviewDataUrl)}/>:<p>Preview pending while capturing.</p>}</div><aside><p>Photo {s?.capturedCount}/{s?.layout.shotCount}</p><strong className="countdown">{state==='COUNTDOWN'?progress?.countdownSecondsRemaining:''}</strong><p>{state==='CAPTURING'?'Capturing original…':state==='COUNTDOWN'?'Get ready':''}</p>{state==='LIVE_VIEW'&&s?.capturedCount===0&&button('Start capture','capture.startSequence')}</aside></div>}
    {state==='SELECTING_PHOTOS'&&<><h2>Choose moments · {s?.selectedCount}/{s?.layout.selectCount}</h2><div className="photo-grid">{progress?.completedShots.map((p,i)=><button key={p.shotId} disabled={busy||!!error} aria-pressed={s?.selectedIndices.includes(i)} onClick={()=>void command('selection.toggle',{shotIndex:i})}><img alt={`Complete simulator original ${i+1}`} src={p.preview}/><span>{s?.selectedIndices.includes(i)?'Selected ✓':'Select'} {i+1}</span></button>)}</div>{button('Continue to frames','selection.confirm',{},s?.selectedCount!==s?.layout.selectCount)}</>}
    {state==='EDITING'&&<><h2>Choose simulator frame</h2>{!frames.length&&<p>Loading frame fixtures…</p>}{frames.map(f=><button className="check frame-option" key={f.id} disabled={busy||!!error} aria-pressed={s?.frameId===f.id} onClick={()=>{setPreview('');void command('frame.select',{frameId:f.id});}}>{safeImage(f.thumbDataUrl)&&<img alt="Generated frame thumbnail" src={safeImage(f.thumbDataUrl)}/>} {f.name}{s?.frameId===f.id?' ✓':''}</button>)}{button('Continue to preview','frame.confirm',{},!preview||!s?.frameId)}</>}
    {['EDITING','PRINT_PENDING','DELIVERY'].includes(state)&&<>{preview?<img className="composition" src={preview} alt="Authoritative Kotlin composed dryrun preview"/>:<p>Composed preview unavailable.</p>}</>}
    {state==='PRINT_PENDING'&&<><h2>Preview · dryrun</h2><p>{s?.layout.title} · {s?.pricing.quantity} copies · {s?.frameId}. No paper will print. No sale will be recorded.</p>{button('Confirm dryrun','print.confirmDryRun',{},!preview||!s?.frameId)}</>}
    {state==='DELIVERY'&&<><h2>Dryrun complete</h2><p>{s?.userConfirmed?'Manually confirmed':'Automatically completed after inactivity'}. Generated files only. Print accepted: no. Revenue recorded: no. No simulator delivery link.</p>{button('Finish simulator session','session.finish')}</>}
    {['SELECTING','SELECTING_QUANTITY','PAYMENT_PENDING','EDITING','PRINT_PENDING'].includes(state)&&button('Back','session.back')}
    {['SELECTING_PHOTOS','EDITING'].includes(state)&&<><p>When inactivity expires, Kotlin selects remaining photos and runs a dryrun automatically.</p><button className="check" aria-label="Session menu" disabled={busy} onClick={()=>setCancel(true)}>•••</button></>}
    {cancel&&['SELECTING_PHOTOS','EDITING'].includes(state)&&<div className="dialog-backdrop"><div role="dialog" aria-modal="true" aria-label="End simulator session" onKeyDown={e=>{if(e.key==='Escape')setCancel(false);if(e.key==='Tab'){e.preventDefault();const buttons=e.currentTarget.querySelectorAll('button');const index=Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);buttons[(index+1)%buttons.length]?.focus();}}}><p>End this simulator session? Synthetic files are retained for test evidence.</p><button className="check" autoFocus onClick={()=>setCancel(false)}>Continue session</button>{button('End simulator session','session.cancel')}</div></div>}
  </section>;
}
