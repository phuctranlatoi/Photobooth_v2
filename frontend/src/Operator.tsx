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
type Status={state:string;canEditLayouts:boolean;layouts:LayoutMode[];accessMode:string;productionAdminAcl:false;pricingEditable?:boolean};
const tabs=['Frames','Layouts','Settings','Tools','Colors','Revenue'] as const;
type Tab=typeof tabs[number];
export function Operator({onClose}:{onClose:()=>void}){
 const [tab,setTab]=useState<Tab>('Frames'),[status,setStatus]=useState<Status>(),[error,setError]=useState('');const alive=useRef(true),settingsExit=useRef<(()=>Promise<boolean>)|undefined>(undefined);
 async function load(){setError('');try{const result=await invoke<Status>('simulator_request',{method:'operator.getStatus',params:{}});if(alive.current)setStatus(result);}catch(ex){if(alive.current)setError(String(ex));}}
 useEffect(()=>{alive.current=true;void load();return()=>{alive.current=false;};},[]);
  const exitPending=useRef(false);
  async function exit(){if(exitPending.current)return;exitPending.current=true;try{if(tab==='Settings'&&settingsExit.current&&!await settingsExit.current())return;onClose();}finally{exitPending.current=false;}}
   return <section className="operator-workspace" data-testid="operator-workspace"><header><div className="v1-admin-heading"><button type="button" className="v1-admin-back" aria-label="Thoát" onClick={()=>void exit()} data-testid="operator-close"><ArrowLeft size={22} strokeWidth={2.4} aria-hidden="true"/></button><div><p className="eyebrow">LE SOUVENIR · ATELIER</p><h1>Quản trị hệ thống</h1><p>Cấu hình vận hành thiết bị, khung mẫu &amp; doanh thu kiosk</p></div></div><div className="v1-admin-pills" aria-label="Trạng thái kết nối chưa xác minh"><span><i aria-hidden="true" className="v1-dot camera"/><b>Camera</b><em>{status?.accessMode ? 'Chưa xác minh kết nối' : 'Chưa cung cấp'}</em></span><span><i aria-hidden="true" className="v1-dot print"/><b>Print</b><em>Chưa xác minh</em></span><span><i aria-hidden="true" className="v1-dot cloud"/><b>Cloud Sync</b><em>Chưa xác minh</em></span></div></header><div className="v1-admin-banner"><span>Hệ thống Kiosk V2 · Cấu hình vận hành</span><small>Phiên bản Atelier 2.0 · Trạng thái thiết bị cần xác minh với backend</small></div><nav aria-label="Operator sections">{tabs.map(t=><button type="button" key={t} data-testid={`operator-tab-${t.toLowerCase()}`} aria-pressed={tab===t} onClick={()=>setTab(t)}>{{Frames:'Khung',Layouts:'Bố cục',Settings:'Cài đặt',Tools:'Công cụ',Colors:'Màu ảnh',Revenue:'Doanh thu'}[t]}</button>)}</nav>{error&&<div role="alert"><p>{error}</p><p>Operator access defaults to denied. Explicit external developer startup with V2_LOCAL_OPERATOR_ENABLED=true is required. The kiosk does not enable it.</p><button type="button" onClick={()=>void load()}>Reload operator status</button></div>}<div className="op-scroll" hidden={tab!=='Frames'}><FramesTab layouts={status?.layouts??[]}/></div><div className="op-scroll" hidden={tab!=='Layouts'}><LayoutsTab status={status} reload={load}/></div><div className="op-scroll" hidden={tab!=='Settings'}><V1Settings registerExit={fn=>{settingsExit.current=fn;}}/></div><div className="op-scroll" hidden={tab!=='Tools'}><ToolsCalculatorTab/></div><div className="op-scroll" hidden={tab!=='Colors'}><FiltersTab/></div><div className="op-scroll" hidden={tab!=='Revenue'}><RevenueTab/></div></section>;
}
