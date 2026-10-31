import { useEffect, useRef, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { motion, useReducedMotion } from 'motion/react';
import { Stage } from './components/StudioUI';
import { PhotoPreview } from './components/PhotoPreview';
import {WelcomeBrand,StaffPaymentPanel} from './components/StaffGestures';
import type { CatalogGetResult, FrameOption, SimulatorMethod } from './shared/simulator-contract';
import { safeImage, type Snapshot } from './shared/connected-simulator';
type Progress={state:string;countdownSecondsRemaining:number;completedShots:{shotId:string;preview:string}[]};
async function rpc<T>(method:SimulatorMethod,params:object={}):Promise<T>{
  if(!isTauri())throw Error('Simulator session connection unavailable — open desktop host.');
  return invoke<T>('simulator_request',{method,params});
}
export function Simulator({onOperator=()=>{}}:{onOperator?:()=>void}){
   
   const [expanded,setExpanded]=useState<{src:string;label:string}>();
  const reduce=useReducedMotion();
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
   useEffect(()=>{setExpanded(undefined);},[s?.state,s?.generationId]);
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
   const phaseLabel:Record<string,string>={IDLE:'Welcome',SELECTING:'Studio setup',SELECTING_QUANTITY:'Choose copies',PAYMENT_PENDING:'Simulator payment',PREPARING:'Getting ready',LIVE_VIEW:'Synthetic live view',COUNTDOWN:'Get ready',CAPTURING:'Capturing original',SELECTING_PHOTOS:'Choose moments',EDITING:'Choose a frame',PRINT_PENDING:'Review dryrun',PRINTING:'Dryrun in progress',DELIVERY:'Dryrun complete',RECOVERY:'Assistance required',CONNECTING:'Connecting'};
   const button=(label:string,method:SimulatorMethod,params:object={},disabled=false)=><button className={`check ${method==='session.back'?'secondary':'command-button'}`} data-testid={method} disabled={busy||!!error||disabled} onClick={()=>void command(method,params)}>{label}<span aria-hidden="true">{method==='session.back'?'←':'↗'}</span></button>;
   return <section className="simulator" aria-label="Connected simulator" data-testid="simulator" data-phase={state}>
     <header className="studio-header"><WelcomeBrand enabled={state==='IDLE'} onOpen={onOperator}/><div className="mode-label"><strong>SIMULATOR SAMPLE</strong><span>No real payment · No paper printing · No revenue</span></div></header>
      <div className="phase-line"><span>A LITTLE MOMENT. A LASTING MEMORY.</span><span role="status">{busy?'Waiting for Kotlin…':phaseLabel[state]??'Session status'}</span></div>
    {error&&<div role="alert"><p>{error}</p><button className="check" disabled={busy} onClick={()=>{if(lock.current)return;lock.current=true;setBusy(true);void (async()=>{try{setCatalog(await rpc<CatalogGetResult>('catalog.get'));await refresh();setError('');}catch(e){setError(String(e));}finally{lock.current=false;setBusy(false);}})();}}>Reconcile status — do not replay</button></div>}
     {state==='IDLE'&&<motion.div className="welcome-spread" initial={reduce?false:{opacity:0}} animate={{opacity:1}}><div><p className="eyebrow">PORTRAITS OF TOGETHERNESS / VOL. 02</p><h1>Here, now.<br/><em>Yours forever.</em></h1><p className="intro">Step inside. Make a little room for joy.<br/>A photo studio for moments worth keeping.</p><button className="check primary" data-testid="welcome-start" disabled={!catalog?.layouts.some(l=>l.id===catalog.defaultLayoutId)||!!error||busy} onClick={()=>void command('session.start',{layoutId:catalog?.defaultLayoutId})}>Start simulator session <span aria-hidden="true">↗</span></button><p className="caption">A connected synthetic experience. No real camera or purchase.</p></div><div className="welcome-art" aria-label="Decorative studio stationery, not a photo preview"><div className="paper-strip"><span>LE</span><span>SOU</span><span>VENIR</span><small>MEMORIES, IN THE MAKING.</small></div><p>Good company.<br/>Beautiful little memories.</p></div></motion.div>}
     {state==='SELECTING'&&<Stage eyebrow="01 / YOUR STUDIO" title="Choose layout" description="A format for your kind of together. Synthetic fixture layouts only; Beauty and effects are not available."><div className="setup-grid">{catalog?.layouts.map(l=><button className="setup-card" key={l.id} disabled={busy||!!error} aria-pressed={s?.layout.id===l.id} onClick={()=>void command('session.setLayout',{layoutId:l.id})}><div className="setup-format" aria-hidden="true"><span>{l.printSizeLabel}</span></div><strong>{l.title}{s?.layout.id===l.id?' ✓':''}</strong><span>{l.shotCount} captures · choose {l.selectCount}</span><small>{l.countdownSeconds}s countdown · {l.printSizeLabel}</small></button>)}</div><div className="action-bar"><p>Your layout sets the photo count and timing.</p>{button('Continue','session.confirmSetup')}</div></Stage>}
     {state==='SELECTING_QUANTITY'&&<Stage eyebrow="02 / ONE FOR EVERYONE" title="Choose copies to continue to simulator payment" description="Keep one. Share the rest. Choose an available quantity from the backend."><div className="quantity-spread"><div><p className="eyebrow">{s?.layout.title} / {s?.layout.printSizeLabel}</p><div className="quantities">{(s?.layout.printSizeLabel==='5x15'?catalog?.pricing.stripAllowedQuantities:catalog?.pricing.printAllowedQuantities)?.map(q=><button className="quantity" data-testid={`quantity-${q}`} key={q} disabled={busy||!!error} onClick={()=>void command('session.setQuantity',{quantity:q})}>{q}<span>copies</span></button>)}</div></div><aside className="summary-card"><p className="eyebrow">THE DETAILS</p><h3>A little keepsake.</h3><dl><div><dt>Base price</dt><dd>{s?.pricing.basePrice.toLocaleString()} VND</dd></div><div><dt>Included copies</dt><dd>{s?.pricing.includedQuantity}</dd></div><div><dt>Extra copy</dt><dd>{s?.pricing.extraUnitPrice.toLocaleString()} VND</dd></div></dl><p>Choosing a quantity continues to simulator payment. No money is charged.</p></aside></div></Stage>}
     {state==='PAYMENT_PENDING'&&<Stage eyebrow="03 / A SIMULATOR CHECKPOINT" title="Simulator payment" description="A test-only approval, never a real payment confirmation."><div className="payment-spread"><div className="payment-placeholder"><span aria-hidden="true">↗</span><h3>No payment QR</h3><p>This experience does not create a PayOS order or connect to a live payment provider.</p></div><aside className="summary-card"><p className="eyebrow">YOUR SESSION</p><h3>{s?.layout.title}</h3><dl><div><dt>Copies</dt><dd>{s?.pricing.quantity}</dd></div><div><dt>Test amount</dt><dd>{s?.pricing.totalAmount.toLocaleString()} VND</dd></div></dl><p>No money will be charged.</p>{button('Simulate payment approval','payment.mockComplete')}</aside></div></Stage>}
      {state==='PAYMENT_PENDING'&&<StaffPaymentPanel>{button('Staff simulator approval','payment.mockComplete')}</StaffPaymentPanel>}
      {state==='PREPARING'&&<div className="preparation"><p className="eyebrow">YOUR MOMENT IS ALMOST HERE</p><h1>Get close.<br/><em>Be yourself.</em></h1><div className="loading-ring"/><h2>Preparing simulator camera…</h2><p>Find your pose. The synthetic camera will be ready shortly.</p></div>}
    {['LIVE_VIEW','COUNTDOWN','CAPTURING'].includes(state)&&<div className="photo-stage"><div><h2>SIMULATOR CAMERA · synthetic Live View</h2>{safeImage(s?.livePreviewDataUrl)?<img alt="Live synthetic simulator preview" src={safeImage(s?.livePreviewDataUrl)}/>:<p>Preview pending while capturing.</p>}</div><aside><p>Photo {s?.capturedCount}/{s?.layout.shotCount}</p><strong className="countdown">{state==='COUNTDOWN'?progress?.countdownSecondsRemaining:''}</strong><p>{state==='CAPTURING'?'Capturing original…':state==='COUNTDOWN'?'Get ready':''}</p>{state==='LIVE_VIEW'&&s?.capturedCount===0&&button('Start capture','capture.startSequence')}</aside></div>}
     {state==='SELECTING_PHOTOS'&&<Stage eyebrow="04 / YOUR FAVOURITE MOMENTS" title={`Choose moments · ${s?.selectedCount}/${s?.layout.selectCount}`} description="Tap in the order you would like your photos to appear."><div className="photo-grid">{progress?.completedShots.map((p,i)=><button key={p.shotId} data-testid={`photo-${i}`} disabled={busy||!!error} aria-pressed={s?.selectedIndices.includes(i)} onClick={()=>void command('selection.toggle',{shotIndex:i})}><img alt={`Complete simulator original ${i+1}`} src={safeImage(p.preview)}/><span>{s?.selectedIndices.includes(i)?`Selected ${s.selectedIndices.indexOf(i)+1} ✓`:'Select'} · photo {i+1}</span></button>)}</div><div className="action-bar"><p>{s?.selectedCount} of {s?.layout.selectCount} selected</p>{button('Continue to frames','selection.confirm',{},s?.selectedCount!==s?.layout.selectCount)}</div></Stage>}
     {state==='EDITING'&&<Stage eyebrow="05 / THE FINISHING TOUCH" title="Choose simulator frame" description="A beautiful border for your favourite moments. The preview is composed by Kotlin, not reconstructed in the browser."><div className="frame-spread"><div className="frame-gallery">{!frames.length&&<p>Loading frame fixtures…</p>}{frames.map(f=><button className="check frame-option" key={f.id} data-testid={`frame-${f.id}`} disabled={busy||!!error} aria-pressed={s?.frameId===f.id} onClick={()=>{setPreview('');void command('frame.select',{frameId:f.id});}}>{safeImage(f.thumbDataUrl)&&<img alt="Generated frame thumbnail" src={safeImage(f.thumbDataUrl)}/>}<span>{f.name}{s?.frameId===f.id?' ✓':''}</span></button>)}</div><div className="preview-well">{preview?<img className="composition" src={preview} alt="Authoritative Kotlin composed dryrun preview"/>:<p>Composed preview unavailable.</p>}</div></div><div className="action-bar"><p>{s?.layout.title} · {s?.pricing.quantity} copies</p>{button('Continue to preview','frame.confirm',{},!preview||!s?.frameId)}</div></Stage>}
     {state==='PRINT_PENDING'&&<Stage eyebrow="06 / ONE LAST LOOK" title="Preview · dryrun" description="Your actual composed output, with its original proportions preserved."><div className="confirmation-spread"><div className="preview-well">{preview?<img className="composition" src={preview} alt="Authoritative Kotlin composed dryrun preview"/>:<p>Composed preview unavailable.</p>}</div><aside className="summary-card"><p className="eyebrow">READY TO COMPOSE YOUR KEEPSAKE</p><h3>{s?.layout.title}</h3><dl><div><dt>Copies</dt><dd>{s?.pricing.quantity}</dd></div><div><dt>Frame</dt><dd>{frames.find(f=>f.id===s?.frameId)?.name??'Generated test frame'}</dd></div></dl><p>No paper will print. No sale will be recorded.</p>{button('Confirm dryrun','print.confirmDryRun',{},!preview||!s?.frameId)}{busy&&<div role="status"><progress aria-label="Dryrun processing"/><p>Preparing dryrun output. Waiting for the backend result; no physical printing.</p></div>}</aside></div></Stage>}
     {state==='PRINTING'&&<Stage eyebrow="DRYRUN IN PROGRESS" title="Preparing your output" description="No paper is being printed. The backend owns the job and completion status."><progress aria-label="Dryrun processing"/></Stage>}
     {(state==='RECOVERY'||s?.failure)&&<Stage eyebrow="OPERATOR ASSISTANCE" title="This moment needs a little help" description="The backend reported a failure. No capture, payment or print command will be replayed automatically."><div role="alert">{s?.failure||'Recovery required. Ask the operator to inspect the backend status.'}</div></Stage>}
     {state==='DELIVERY'&&<Stage eyebrow="A LITTLE MOMENT, BEAUTIFULLY COMPOSED" title="Dryrun complete" description="Thank you for making a memory with us."><div className="confirmation-spread"><div className="preview-well">{preview?<img className="composition" src={preview} alt="Authoritative Kotlin composed dryrun preview"/>:<p>Composed preview unavailable.</p>}</div><aside className="summary-card completion-card"><span className="completion-mark" aria-hidden="true">✓</span><h3>That was lovely.</h3><p>{s?.userConfirmed?'Manually confirmed':'Automatically completed after inactivity'}. Generated files only. Print accepted: no. Revenue recorded: no.</p><p className="no-delivery">No simulator delivery link.</p>{button('Finish simulator session','session.finish')}</aside></div></Stage>}
     <div className="session-action-region">{['SELECTING','SELECTING_QUANTITY','PAYMENT_PENDING','EDITING','PRINT_PENDING'].includes(state)&&button('Back','session.back')}
     {['SELECTING_PHOTOS','EDITING'].includes(state)&&<><p>When inactivity expires, Kotlin selects remaining photos and runs a dryrun automatically.</p><button className="check" aria-label="Session menu" disabled={busy} onClick={()=>setCancel(true)}>•••</button></>}</div>
     {cancel&&['SELECTING_PHOTOS','EDITING'].includes(state)&&<div className="dialog-backdrop"><div role="dialog" aria-modal="true" aria-label="End simulator session" onKeyDown={e=>{if(e.key==='Escape'){setCancel(false);document.querySelector<HTMLButtonElement>('[aria-label="Session menu"]')?.focus();}if(e.key==='Tab'){e.preventDefault();const buttons=e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');const index=Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}}}><p>End this simulator session? Synthetic files are retained for test evidence.</p><button className="check" autoFocus onClick={()=>{setCancel(false);document.querySelector<HTMLButtonElement>('[aria-label="Session menu"]')?.focus();}}>Continue session</button>{button('End simulator session','session.cancel')}</div></div>}
      {state==='SELECTING_PHOTOS'&&<div className="original-preview-actions" aria-label="Inspect original photos">{progress?.completedShots.map((p,i)=><button className="check secondary" key={p.shotId} disabled={!safeImage(p.preview)} onClick={()=>setExpanded({src:safeImage(p.preview),label:`Complete simulator original ${i+1}`})}>Enlarge photo {i+1}</button>)}</div>}
      {['LIVE_VIEW','COUNTDOWN','CAPTURING'].includes(state)&&<aside className="unavailable-card"><h3>Capture source</h3><p>Source switching, file import and device refresh need an authorized camera IPC contract. This session uses synthetic frames only.</p><button disabled>Camera source · DSLR / webcam / Hot Folder</button><button disabled>Import photos</button><button disabled>Refresh camera</button></aside>}
      {state==='EDITING'&&<aside className="unavailable-card"><h3>Custom PNG frame</h3><p>Import requires a backend file-validation and frame-management contract; browser images cannot replace authoritative composition.</p><button disabled>Import custom PNG</button></aside>}
      {state==='DELIVERY'&&<aside className="unavailable-card"><h3>Photo delivery</h3><p>No authorized output-folder path or album URL was supplied by the backend. No cloud upload has occurred.</p><button disabled>Open output folder</button><button disabled>Open web album</button></aside>}
      {expanded&&<PhotoPreview {...expanded} onClose={()=>setExpanded(undefined)}/>}
      <footer className="studio-footer"><span>Made for moments together.</span><span>LE SOUVENIR / INDEPENDENT V2</span></footer>
   </section>;
}

