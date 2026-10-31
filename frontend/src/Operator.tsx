import {useEffect,useRef,useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import type {LayoutMode} from './shared/simulator-contract';
import {V1Settings} from './V1Settings';
import {FramesTab} from './operator/FramesTab';
import {LayoutsTab} from './operator/LayoutsTab';
import {ToolsCalculatorTab} from './operator/ToolsCalculatorTab';
import {FiltersTab} from './operator/FiltersTab';
import {RevenueTab} from './operator/RevenueTab';
import './operator/operator-v1.css';
type Status={state:string;canEditLayouts:boolean;layouts:LayoutMode[];accessMode:string;productionAdminAcl:false;pricingEditable?:boolean};
const tabs=['Frames','Layouts','Settings','Tools','Colors','Revenue'] as const;
type Tab=typeof tabs[number];
export function Operator({onClose}:{onClose:()=>void}){
 const [tab,setTab]=useState<Tab>('Frames'),[status,setStatus]=useState<Status>(),[error,setError]=useState('');const alive=useRef(true),settingsExit=useRef<(()=>Promise<boolean>)|undefined>(undefined);
 async function load(){setError('');try{const result=await invoke<Status>('simulator_request',{method:'operator.getStatus',params:{}});if(alive.current)setStatus(result);}catch(ex){if(alive.current)setError(String(ex));}}
 useEffect(()=>{alive.current=true;void load();return()=>{alive.current=false;};},[]);
 async function exit(){if(settingsExit.current&&!await settingsExit.current())return;onClose();}
 return <section className="operator-workspace" data-testid="operator-workspace"><header><div className="v1-admin-heading"><button className="v1-admin-back" aria-label="Thoát" onClick={()=>void exit()} data-testid="operator-close">←</button><div><p className="eyebrow">LE SOUVENIR · ATELIER</p><h1>Quản trị hệ thống</h1><p>Cấu hình vận hành thiết bị, khung mẫu &amp; doanh thu kiosk</p></div></div><div className="v1-admin-pills"><span><i className="v1-dot camera"/><b>Camera</b><em>Chưa kết nối</em></span><span><i className="v1-dot print"/><b>Print</b><em>Chưa áp dụng</em></span><span><i className="v1-dot cloud"/><b>Cloud Sync</b><em>Ngoại tuyến</em></span></div></header><p className="operator-warning">SIMULATOR · Local development only. Not a production Admin ACL. No hardware or live services.</p><nav aria-label="Operator sections">{tabs.map(t=><button key={t} data-testid={`operator-tab-${t.toLowerCase()}`} aria-pressed={tab===t} onClick={()=>setTab(t)}>{{Frames:'Khung',Layouts:'Bố cục',Settings:'Cài đặt',Tools:'Công cụ',Colors:'Màu ảnh',Revenue:'Doanh thu'}[t]}</button>)}</nav>{error&&<div role="alert"><p>{error}</p><p>Operator access defaults to denied. Explicit external developer startup with V2_LOCAL_OPERATOR_ENABLED=true is required. The kiosk does not enable it.</p><button onClick={()=>void load()}>Reload operator status</button></div>}<div className="op-scroll" hidden={tab!=='Frames'}><FramesTab layouts={status?.layouts??[]}/></div><div className="op-scroll" hidden={tab!=='Layouts'}><LayoutsTab status={status} reload={load}/></div><div className="op-scroll" hidden={tab!=='Settings'}><V1Settings registerExit={fn=>{settingsExit.current=fn;}}/></div><div className="op-scroll" hidden={tab!=='Tools'}><ToolsCalculatorTab/></div><div className="op-scroll" hidden={tab!=='Colors'}><FiltersTab/></div><div className="op-scroll" hidden={tab!=='Revenue'}><RevenueTab/></div></section>;
}
