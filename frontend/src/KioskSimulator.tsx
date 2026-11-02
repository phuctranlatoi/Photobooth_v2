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
export function KioskSimulator(){
 const [catalog,setCatalog]=useState<CatalogGetResult>(),[snapshot,setSnapshot]=useState<Snapshot>(),[frames,setFrames]=useState<FrameOption[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[admin,setAdmin]=useState(false),[cancel,setCancel]=useState(false),[cameraConnected,setCameraConnected]=useState<boolean>();
 const session=useRef(sessionStorage.getItem('v2-simulator-session')??''),generation=useRef(sessionStorage.getItem('v2-simulator-generation')??'');
  const alive=useRef(true),lock=useRef(false),queue=useRef<Promise<void>>(Promise.resolve()),queuedCount=useRef(0),epoch=useRef(0),loaded=useRef(false);
 async function refresh(){if(!session.current)return;const token=epoch.current,sid=session.current,gen=generation.current;const next=await rpc<Snapshot>('session.getState',{sessionId:sid,generationId:gen});if(!alive.current||token!==epoch.current||next.sessionId!==sid||next.generationId!==gen)return;setSnapshot(next);if(next.state==='EDITING'){const result=await rpc<{frames:FrameOption[]}>('frame.list',{sessionId:sid,generationId:gen});if(alive.current&&token===epoch.current)setFrames(result.frames)}}
  useEffect(()=>{alive.current=true;const token=++epoch.current;let timer:ReturnType<typeof setTimeout>;let deviceChecked=0;async function poll(){if(!lock.current){lock.current=true;try{if(!loaded.current){const c=await rpc<CatalogGetResult>('catalog.get');if(alive.current&&token===epoch.current){setCatalog(c);setError('');loaded.current=true}}if(!session.current&&Date.now()-deviceChecked>3000){deviceChecked=Date.now();try{const status=await rpc<{camera?:{connected?:boolean}}>('device.getStatus');if(alive.current&&token===epoch.current)setCameraConnected(status.camera?.connected)}catch{/* Device discovery must not block the catalog or session recovery. */}}await refresh();if(alive.current&&token===epoch.current)setError('')}catch(e){if(alive.current&&token===epoch.current)setError(String(e))}finally{lock.current=false}}if(alive.current&&token===epoch.current)timer=setTimeout(poll,500)}void poll();return()=>{alive.current=false;++epoch.current;clearTimeout(timer)}},[]);
  function command(method:SimulatorMethod,extra:object={}):Promise<boolean>{
    // Serialize every mutation, including rapid photo taps followed immediately by Continue.
    // Do not replay queued mutations after an uncertain backend failure.
    queuedCount.current++;setBusy(true);
    const run=async():Promise<boolean>=>{
      if(!alive.current||error)return false;
      while(lock.current&&alive.current)await new Promise(r=>setTimeout(r,20));
      if(!alive.current)return false;
      lock.current=true;
      try{
        if(method==='session.start'){session.current=crypto.randomUUID();generation.current=crypto.randomUUID();sessionStorage.setItem('v2-simulator-session',session.current);sessionStorage.setItem('v2-simulator-generation',generation.current);setSnapshot(undefined)}
        const params={sessionId:session.current,generationId:generation.current,commandId:crypto.randomUUID(),...extra};
        sessionStorage.setItem('v2-simulator-uncertain',JSON.stringify({method,params}));
        const result=await rpc<{state?:string;cancelled?:boolean}>(method,params);
        sessionStorage.removeItem('v2-simulator-uncertain');
        if(!alive.current)return false;
        if((method==='session.finish'||method==='session.cancel'||method==='session.back')&&(result.state==='IDLE'||result.cancelled)){session.current='';generation.current='';sessionStorage.removeItem('v2-simulator-session');sessionStorage.removeItem('v2-simulator-generation');setSnapshot(undefined);setFrames([])}else await refresh();
        setCancel(false);return true;
      }catch(e){if(alive.current)setError(String(e));return false}
      finally{lock.current=false}
    };
     const next=enqueueCommand(queue,run);
    void next.finally(()=>{queuedCount.current--;if(alive.current&&queuedCount.current===0)setBusy(false)});
    return next;
  }
   const state=snapshot?.state??(session.current?'CONNECTING':'IDLE');const layout=snapshot?.layout,pricing=snapshot?.pricing,preview=safeImage(snapshot?.previewDataUrl);const common={layout,layouts:catalog?.layouts??[],pricing,busy:busy||!!error,preview,snapshot,simulator:catalog?.simulator??(snapshot?.runtimeMode!=='REAL'),action:(method:SimulatorMethod,params?:object)=>command(method,params)};
 if(admin)return <AdminScreen onClose={()=>setAdmin(false)}/>;
    return <AppShell camera={['LIVE_VIEW','COUNTDOWN','CAPTURING'].includes(state)}><div className="v1-simulator-label">LE SOUVENIR · Studio Kiosk</div>{error&&<div className="v1-error" role="alert"><p>{error}</p><KioskSecondaryButton onClick={()=>{if(lock.current)return;lock.current=true;void (async()=>{try{const c=await rpc<CatalogGetResult>('catalog.get');if(!alive.current)return;setCatalog(c);loaded.current=true;setError('');await refresh();if(alive.current)setError('')}catch(e){if(alive.current)setError(String(e))}finally{lock.current=false}})()}}>Kiểm tra lại trạng thái · Không gửi lại lệnh</KioskSecondaryButton></div>}
   {state==='IDLE'&&<StartScreen layouts={catalog?.layouts??[]} defaultLayoutId={catalog?.defaultLayoutId} bundles={catalog?.bundles} catalogSource={catalog?.catalogSource} lastSyncError={catalog?.lastSyncError} busy={busy||!!error} onStart={(layoutId)=>void command('session.start',{layoutId})} onAdmin={()=>setAdmin(true)}/>}
 {state==='SELECTING'&&<StudioModeScreen {...common}/>}
 {state==='SELECTING_QUANTITY'&&<QuantityScreen {...common} allowed={layout?.printSizeLabel==='5x15'?catalog?.pricing.stripAllowedQuantities:catalog?.pricing.printAllowedQuantities}/>}
 {state==='PAYMENT_PENDING'&&<PaymentScreen {...common}/>}
 {state==='PREPARING'&&<PrepareScreen {...common}/>}
 {['LIVE_VIEW','COUNTDOWN','CAPTURING'].includes(state)&&<CaptureScreen {...common} live={snapshot?.livePreviewDataUrl??''} count={snapshot?.capturedCount} countdown={snapshot?.secondsRemaining} state={state}/>}
 {state==='SELECTING_PHOTOS'&&<SelectPhotosScreen {...common} shots={snapshot?.shots} selected={snapshot?.selectedIndices}/>}
 {state==='EDITING'&&<FrameScreen {...common} frames={frames} frameId={snapshot?.frameId}/>}
 {state==='PRINT_PENDING'&&<ConfirmScreen {...common}/>}
 {state==='PRINTING'&&<PrintingScreen/>}
 {state==='DELIVERY'&&<DeliveryScreen {...common}/>}
 {(state==='CONNECTING'||state==='RECOVERY'||snapshot?.failure)&&<div className="v1-center v1-panel" role="status"><h2>{state==='CONNECTING'?'Đang kết nối…':'Cần nhân viên hỗ trợ'}</h2><p>{snapshot?.failure??'Đang kiểm tra trạng thái với backend'}</p></div>}
 {['SELECTING_PHOTOS','EDITING'].includes(state)&&<><button className="v1-menu" aria-label="Tùy chọn phiên chụp" onClick={()=>setCancel(true)}>⋮</button><DecisionTimerBadge seconds={snapshot?.secondsRemaining}/></>}
 {cancel&&<div className="v1-overlay"><div role="dialog" aria-modal="true" aria-label="Hủy phiên chụp?" className="v1-modal"><h2>Hủy phiên chụp?</h2><p>Phiên mô phỏng sẽ kết thúc. Bạn có chắc chắn?</p><KioskSecondaryButton onClick={()=>setCancel(false)}>Tiếp tục chụp</KioskSecondaryButton><KioskPrimaryButton disabled={busy||!!error} onClick={()=>void command('session.cancel')}>Xác nhận hủy</KioskPrimaryButton></div></div>}</AppShell>
}
