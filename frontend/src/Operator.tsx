import {useEffect,useRef,useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {invoke} from '@tauri-apps/api/core';
import type {LayoutMode} from './shared/simulator-contract';
import {V1Settings} from './V1Settings';
import {FramesTab} from './operator/FramesTab';
import {LayoutsTab} from './operator/LayoutsTab';
import {ToolsCalculatorTab} from './operator/ToolsCalculatorTab';
import {FiltersTab} from './operator/FiltersTab';
import {RevenueTab} from './operator/RevenueTab';
export type BackendFrame={id:string;title:string;targetPrintSize?:string;targetLayoutId?:string;isSpecial?:boolean;specialEventName?:string;thumbDataUrl?:string};
type Status={state:string;canEditLayouts:boolean;layouts:LayoutMode[];frames?:BackendFrame[];accessMode:string;productionAdminAcl:false;pricingEditable?:boolean;cloud?:{canUploadAlbum?:boolean;cloudSyncReady?:boolean;webAlbumConfigured?:boolean;cloudinaryConfigured?:boolean;databaseConfigured?:boolean;catalogSource?:string;payOsConfigured?:boolean;payOsStatus?:string;simulator?:boolean};camera?:{connected?:boolean;name?:string;liveViewActive?:boolean};printer?:{name?:string;detected?:boolean;systemPrintEnabled?:boolean};capabilities?:Record<string,boolean>};
const tabs=['Frames','Layouts','Settings','Tools','Colors','Revenue'] as const;
type Tab=typeof tabs[number];
export function Operator({onClose}:{onClose:()=>void}){
 const [tab,setTab]=useState<Tab>('Frames'),[status,setStatus]=useState<Status>(),[error,setError]=useState('');const alive=useRef(true),settingsExit=useRef<(()=>Promise<boolean>)|undefined>(undefined);
 async function load(){setError('');try{const result=await invoke<Status>('simulator_request',{method:'operator.getStatus',params:{}});if(alive.current)setStatus(result);}catch(ex){if(alive.current)setError(String(ex));}}
 useEffect(()=>{alive.current=true;void load();return()=>{alive.current=false;};},[]);
  const exitPending=useRef(false);
  async function exit(){if(exitPending.current)return;exitPending.current=true;try{if(tab==='Settings'&&settingsExit.current&&!await settingsExit.current())return;onClose();}finally{exitPending.current=false;}}
   const cameraConnected=Boolean(status?.camera?.connected ?? status?.capabilities?.nativeCamera);
   const cameraLabel=status?.camera?.name || (cameraConnected?'Sẵn sàng':'Ngoại tuyến');
   const printReady=Boolean(status?.printer?.detected || status?.printer?.systemPrintEnabled || status?.capabilities?.nativePrint);
   const printLabel=printReady?'Đang bật':'Đang tắt';
   const cloudReady=!status?.cloud?.simulator&&Boolean(status?.cloud?.cloudSyncReady ?? (status?.cloud?.canUploadAlbum || status?.cloud?.databaseConfigured || status?.cloud?.webAlbumConfigured));
   const cloudLabel=status?.cloud?.simulator?'Mô phỏng':cloudReady?(status?.cloud?.databaseConfigured&&status?.cloud?.canUploadAlbum?'Sẵn sàng · Đầy đủ':'Sẵn sàng'):'Ngoại tuyến';
   return <section className="operator-workspace" data-testid="operator-workspace"><header><div className="v1-admin-heading"><button type="button" className="v1-admin-back" aria-label="Thoát" onClick={()=>void exit()} data-testid="operator-close"><ArrowLeft size={22} strokeWidth={2.4} aria-hidden="true"/></button><div><p className="eyebrow">LE SOUVENIR · ATELIER</p><h1>Quản trị hệ thống</h1><p>Cấu hình vận hành thiết bị, khung mẫu &amp; doanh thu kiosk</p></div></div><div className="v1-admin-pills" aria-label="Trạng thái kết nối"><span className={cameraConnected?'v1-pill-ok':'v1-pill-off'}><i aria-hidden="true" className={`v1-dot ${cameraConnected?'ok':'camera'}`}/><b>Camera</b><em>{cameraLabel}</em></span><span className={printReady?'v1-pill-ok':'v1-pill-off'}><i aria-hidden="true" className={`v1-dot ${printReady?'ok':'print'}`}/><b>Print</b><em>{printLabel}</em></span><span className={cloudReady?'v1-pill-ok':'v1-pill-off'}><i aria-hidden="true" className={`v1-dot ${cloudReady?'ok':'cloud'}`}/><b>Cloud Sync</b><em>{cloudLabel}</em></span></div></header><div className="v1-admin-banner"><span>Hệ thống Kiosk V2 · Cấu hình vận hành</span><small>Phiên bản Atelier 2.0 · Trạng thái kết nối do backend cung cấp</small></div><nav aria-label="Operator sections">{tabs.map(t=><button type="button" key={t} data-testid={`operator-tab-${t.toLowerCase()}`} aria-pressed={tab===t} onClick={()=>setTab(t)}>{{Frames:'Khung',Layouts:'Bố cục',Settings:'Cài đặt',Tools:'Công cụ',Colors:'Màu ảnh',Revenue:'Doanh thu'}[t]}</button>)}</nav>{error&&<div role="alert"><p>{error}</p><p>Operator access defaults to denied. Explicit external developer startup with V2_LOCAL_OPERATOR_ENABLED=true is required. The kiosk does not enable it.</p><button type="button" onClick={()=>void load()}>Reload operator status</button></div>}<div className="op-scroll" hidden={tab!=='Frames'}><FramesTab layouts={status?.layouts??[]} frames={status?.frames??[]} reload={load}/></div><div className="op-scroll" hidden={tab!=='Layouts'}><LayoutsTab status={status} reload={load}/></div><div className="op-scroll" hidden={tab!=='Settings'}><V1Settings registerExit={fn=>{settingsExit.current=fn;}} cloudStatus={status?.cloud}/></div><div className="op-scroll" hidden={tab!=='Tools'}><ToolsCalculatorTab/></div><div className="op-scroll" hidden={tab!=='Colors'}><FiltersTab/></div><div className="op-scroll" hidden={tab!=='Revenue'}><RevenueTab/></div></section>;
}
