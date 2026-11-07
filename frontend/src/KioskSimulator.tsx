import {useEffect,useRef,useState} from 'react';
import {invoke,isTauri} from '@tauri-apps/api/core';
import type {CatalogGetResult,FrameOption,SimulatorMethod} from './shared/simulator-contract';
import {safeImage,type Snapshot} from './shared/connected-simulator';
import {enqueueCommand} from './shared/command-queue';
import {AppShell,DecisionTimerBadge,KioskPrimaryButton,KioskSecondaryButton} from './screens/KioskUI';
import {StartScreen} from './screens/StartScreen';
import {StudioModeScreen} from './screens/StudioModeScreen';
import {QuantityScreen} from './screens/QuantityScreen';
import {PaymentScreen} from './screens/PaymentScreen';
import {PrepareScreen} from './screens/PrepareScreen';
import {CaptureScreen} from './screens/CaptureScreen';
import {SelectPhotosScreen} from './screens/SelectPhotosScreen';
import {FrameScreen} from './screens/FrameScreen';
import {ConfirmScreen} from './screens/ConfirmScreen';
import {PrintingScreen} from './screens/PrintingScreen';
import {DeliveryScreen} from './screens/DeliveryScreen';
import {AdminScreen} from './screens/AdminScreen';

async function rpc<T>(method:SimulatorMethod|'operator.getStatus',params:object={}):Promise<T>{if(!isTauri())throw Error('Không kết nối được với backend simulator. Mở ứng dụng desktop để tiếp tục.');return invoke<T>('simulator_request',{method,params})}
// Polls commonly return new objects with the same image data. Compare the visible
// backend fields without serializing multi-megabyte base64 captures each cycle.
function sameVisibleSnapshot(a:Snapshot,b:Snapshot){
 const sameList=(left:readonly number[],right:readonly number[])=>left===right||left.length===right.length&&left.every((value,index)=>value===right[index]);
 return a.state===b.state&&a.sessionId===b.sessionId&&a.generationId===b.generationId&&a.frameId===b.frameId&&a.secondsRemaining===b.secondsRemaining&&a.compositionDataUrl===b.compositionDataUrl&&a.printImageDataUrl===b.printImageDataUrl&&a.previewDataUrl===b.previewDataUrl&&a.livePreviewDataUrl===b.livePreviewDataUrl&&a.capturedCount===b.capturedCount&&sameList(a.selectedIndices??[],b.selectedIndices??[])&&a.shots.length===b.shots.length&&a.shots.every((shot,index)=>shot.shotId===b.shots[index].shotId&&shot.preview===b.shots[index].preview)&&a.failure===b.failure&&a.paymentQr===b.paymentQr&&a.orderCode===b.orderCode&&a.lastPaymentError===b.lastPaymentError&&a.payOsStatus===b.payOsStatus&&a.payOsConfigured===b.payOsConfigured&&a.printStatus===b.printStatus&&a.qrCodeUrl===b.qrCodeUrl&&a.albumUrl===b.albumUrl&&a.runtimeMode===b.runtimeMode&&a.captureMode===b.captureMode&&a.layout?.id===b.layout?.id&&a.pricing?.quantity===b.pricing?.quantity&&a.pricing?.totalAmount===b.pricing?.totalAmount&&a.pricing?.basePrice===b.pricing?.basePrice&&a.pricing?.extraQuantity===b.pricing?.extraQuantity&&a.pricing?.extraAmount===b.pricing?.extraAmount;
}
export function KioskSimulator(){
 const [catalog,setCatalog]=useState<CatalogGetResult>(),[snapshot,setSnapshot]=useState<Snapshot>(),[frames,setFrames]=useState<FrameOption[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[admin,setAdmin]=useState(false),[cancel,setCancel]=useState(false),[cameraConnected,setCameraConnected]=useState<boolean>();
 const session=useRef(sessionStorage.getItem('v2-simulator-session')??''),generation=useRef(sessionStorage.getItem('v2-simulator-generation')??'');
    const alive=useRef(true),lock=useRef(false),polling=useRef(false),revision=useRef(0),snapshotRef=useRef<Snapshot|undefined>(undefined),framesRef=useRef<FrameOption[]>([]),frameRequest=useRef(false),queue=useRef<Promise<void>>(Promise.resolve()),queuedCount=useRef(0),busyCount=useRef(0),epoch=useRef(0),loaded=useRef(false);
   function loadFrames(sid:string,gen:string){
     if(frameRequest.current||framesRef.current.length)return;
     frameRequest.current=true;
     const token=epoch.current;
     void rpc<{frames:FrameOption[]}>('frame.list',{sessionId:sid,generationId:gen}).then(result=>{
       if(alive.current&&token===epoch.current&&session.current===sid&&generation.current===gen&&snapshotRef.current?.state==='EDITING'){
         framesRef.current=result.frames;setFrames(result.frames);
       }
     }).catch(()=>{/* Poll reconciliation retries when the backend becomes available. */}).finally(()=>{frameRequest.current=false});
   }
   function publishSnapshot(next:Snapshot){
     const previous=snapshotRef.current;
     if(!previous||!sameVisibleSnapshot(previous,next)){snapshotRef.current=next;setSnapshot(next)}
     if(next.state==='EDITING')loadFrames(next.sessionId,next.generationId);
     else if(framesRef.current.length){framesRef.current=[];setFrames([])}
   }
   async function refresh(fromPoll=false){if(!session.current||fromPoll&&(lock.current||queuedCount.current>0))return;const token=epoch.current,sid=session.current,gen=generation.current,requestRevision=revision.current;const next=await rpc<Snapshot>('session.getState',{sessionId:sid,generationId:gen});if(!alive.current||token!==epoch.current||next.sessionId!==sid||next.generationId!==gen||fromPoll&&(lock.current||queuedCount.current>0||requestRevision!==revision.current))return;
     publishSnapshot(next);
  }
   useEffect(()=>{alive.current=true;const token=++epoch.current;let timer:ReturnType<typeof setTimeout>;let deviceChecked=0;async function poll(){if(!lock.current&&queuedCount.current===0&&!polling.current){polling.current=true;const requestRevision=revision.current;try{if(!loaded.current){const c=await rpc<CatalogGetResult>('catalog.get');if(alive.current&&token===epoch.current){setCatalog(c);setError('');loaded.current=true}}if(!session.current&&Date.now()-deviceChecked>3000&&!lock.current){deviceChecked=Date.now();try{const status=await rpc<{camera?:{connected?:boolean}}>('device.getStatus');if(alive.current&&token===epoch.current)setCameraConnected(status.camera?.connected)}catch{/* Device discovery must not block the catalog or session recovery. */}}await refresh(true);if(alive.current&&token===epoch.current&&requestRevision===revision.current&&!lock.current)setError('')}catch(e){if(alive.current&&token===epoch.current&&requestRevision===revision.current&&!lock.current)setError(String(e))}finally{polling.current=false}}if(alive.current&&token===epoch.current)timer=setTimeout(poll,500)}void poll();return()=>{alive.current=false;++epoch.current;clearTimeout(timer)}},[]);
  function command(method:SimulatorMethod,extra:object={}):Promise<boolean>{
    // Serialize every mutation, including rapid photo taps followed immediately by Continue.
    // Do not replay queued mutations after an uncertain backend failure.
     const lightweight=method==='selection.toggle'||method==='frame.select';
     queuedCount.current++;if(!lightweight){busyCount.current++;setBusy(true)}
    const run=async():Promise<boolean>=>{
      if(!alive.current||error)return false;
       if(!alive.current)return false;
       lock.current=true;++revision.current;
      try{
         if(method==='session.start'){session.current=crypto.randomUUID();generation.current=crypto.randomUUID();sessionStorage.setItem('v2-simulator-session',session.current);sessionStorage.setItem('v2-simulator-generation',generation.current);snapshotRef.current=undefined;framesRef.current=[];setSnapshot(undefined);setFrames([])}
        const params={sessionId:session.current,generationId:generation.current,commandId:crypto.randomUUID(),...extra};
        sessionStorage.setItem('v2-simulator-uncertain',JSON.stringify({method,params}));
         const result=await rpc<Snapshot & {cancelled?:boolean}>(method,params);
        sessionStorage.removeItem('v2-simulator-uncertain');
        if(!alive.current)return false;
          if((method==='session.finish'||method==='session.cancel'||method==='session.back')&&(result.state==='IDLE'||result.cancelled)){session.current='';generation.current='';sessionStorage.removeItem('v2-simulator-session');sessionStorage.removeItem('v2-simulator-generation');snapshotRef.current=undefined;framesRef.current=[];setSnapshot(undefined);setFrames([])}
          else if(result.sessionId===session.current&&result.generationId===generation.current&&result.state)publishSnapshot(result);
        setCancel(false);return true;
      }catch(e){if(alive.current)setError(String(e));return false}
      finally{lock.current=false}
    };
     const next=enqueueCommand(queue,run);
     void next.finally(()=>{queuedCount.current--;if(!lightweight){busyCount.current--;if(alive.current&&busyCount.current===0)setBusy(false)}});
    return next;
  }
   const state=snapshot?.state??(session.current?'CONNECTING':'IDLE');const layout=snapshot?.layout,pricing=snapshot?.pricing,preview=safeImage(snapshot?.previewDataUrl);const isStripLayout=layout?.printSizeLabel ? layout.printSizeLabel.replace(/\s/g,'').toLowerCase().includes('5x15') : false;const common={layout,layouts:catalog?.layouts??[],pricing,busy:busy||!!error,preview,snapshot,simulator:catalog?.simulator??(snapshot?.runtimeMode!=='REAL'),action:(method:SimulatorMethod,params?:object)=>command(method,params)};
 if(admin)return <AdminScreen onClose={()=>setAdmin(false)}/>;
      return <AppShell camera={['LIVE_VIEW','COUNTDOWN','CAPTURING'].includes(state)} className={`atelier-customer${state==='PAYMENT_PENDING'?' v1-shell-payment':''}`}>{error&&<div className="v1-error" role="alert"><p>{error}</p><KioskSecondaryButton onClick={()=>{if(lock.current)return;lock.current=true;void (async()=>{try{const c=await rpc<CatalogGetResult>('catalog.get');if(!alive.current)return;setCatalog(c);loaded.current=true;setError('');await refresh();if(alive.current)setError('')}catch(e){if(alive.current)setError(String(e))}finally{lock.current=false}})()}}>Kiểm tra lại trạng thái · Không gửi lại lệnh</KioskSecondaryButton></div>}
   {state==='IDLE'&&<StartScreen layouts={catalog?.layouts??[]} defaultLayoutId={catalog?.defaultLayoutId} bundles={catalog?.bundles} catalogSource={catalog?.catalogSource} lastSyncError={catalog?.lastSyncError} busy={busy||!!error} onStart={(layoutId)=>void command('session.start',{layoutId})} onAdmin={()=>setAdmin(true)}/>}
 {state==='SELECTING'&&<StudioModeScreen {...common}/>}
  {state==='SELECTING_QUANTITY'&&<QuantityScreen {...common} allowed={isStripLayout?catalog?.pricing.stripAllowedQuantities:catalog?.pricing.printAllowedQuantities}/>}
 {state==='PAYMENT_PENDING'&&<PaymentScreen {...common}/>}
 {state==='PREPARING'&&<PrepareScreen {...common}/>}
 {['LIVE_VIEW','COUNTDOWN','CAPTURING'].includes(state)&&<CaptureScreen {...common} live={snapshot?.livePreviewDataUrl??''} count={snapshot?.capturedCount} countdown={snapshot?.secondsRemaining} state={state}/>}
 {state==='SELECTING_PHOTOS'&&<SelectPhotosScreen {...common} shots={snapshot?.shots} selected={snapshot?.selectedIndices}/>}
 {state==='EDITING'&&<FrameScreen {...common} frames={frames} frameId={snapshot?.frameId}/>}
 {state==='PRINT_PENDING'&&<ConfirmScreen {...common}/>}
  {state==='PRINTING'&&<PrintingScreen snapshot={snapshot}/>}
 {state==='DELIVERY'&&<DeliveryScreen {...common}/>}
 {(state==='CONNECTING'||state==='RECOVERY'||snapshot?.failure)&&<div className="v1-center v1-panel" role="status"><h2>{state==='CONNECTING'?'Đang kết nối…':'Cần nhân viên hỗ trợ'}</h2><p>{snapshot?.failure??'Đang kiểm tra trạng thái với backend'}</p></div>}
 {['SELECTING_PHOTOS','EDITING'].includes(state)&&<><button className="v1-menu" aria-label="Tùy chọn phiên chụp" onClick={()=>setCancel(true)}>⋮</button><DecisionTimerBadge seconds={snapshot?.secondsRemaining}/></>}
  {cancel&&<div className="v1-overlay"><div role="dialog" aria-modal="true" aria-label="Hủy phiên chụp?" className="v1-modal"><h2>Hủy phiên chụp?</h2><p>Phiên chụp sẽ kết thúc. Bạn có chắc chắn?</p><KioskSecondaryButton onClick={()=>setCancel(false)}>Tiếp tục chụp</KioskSecondaryButton><KioskPrimaryButton disabled={busy||!!error} onClick={()=>void command('session.cancel')}>Xác nhận hủy</KioskPrimaryButton></div></div>}</AppShell>
}
