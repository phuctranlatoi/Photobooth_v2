import {useRef,useState} from 'react';
import {safeImage} from '../shared/connected-simulator';
import type {CatalogGetResult} from '../shared/simulator-contract';
import {KioskPrimaryButton} from './KioskUI';

export function StartScreen({layouts,bundles=[],defaultLayoutId,catalogSource,lastSyncError,onStart,onAdmin,busy}:{layouts:CatalogGetResult['layouts'];bundles?:NonNullable<CatalogGetResult['bundles']>;defaultLayoutId?:string;catalogSource?:string;lastSyncError?:string|null;onStart:(layoutId:string)=>void;onAdmin:()=>void;busy:boolean}){
 const taps=useRef(0),pressed=useRef(false);
 const [selected,setSelected]=useState<string|null>(null);
 const start=(id:string)=>{if(pressed.current||busy)return;pressed.current=true;onStart(id)};
 const layoutId=selected??(layouts.some(l=>l.id===defaultLayoutId)?defaultLayoutId:layouts[0]?.id);
 const catalogBadge=catalogSource==='FIREBASE_LIVE'
  ?<span className="v1-catalog-badge v1-badge-live" title="Đồng bộ trực tiếp từ Firebase Firestore">✓ Firebase Live ({layouts.length} bố cục)</span>
  :catalogSource==='DISK_CACHE'
  ?<span className="v1-catalog-badge v1-badge-cache" title="Đang sử dụng bản lưu ngoại tuyến từ Firebase">● Bộ nhớ tạm ({layouts.length} bố cục)</span>
  :catalogSource==='STATIC_FALLBACK'
  ?<span className="v1-catalog-badge v1-badge-fallback" title={lastSyncError||'Chưa đồng bộ được'}>⚠ Bố cục mặc định ({lastSyncError||'Thiếu kết nối'})</span>
  :null;
 return <div className="v1-start"><section>
  <button className="v1-brand" onClick={()=>{if(++taps.current>=5){taps.current=0;onAdmin()}}}>LE SOUVENIR</button>
   <p className="v1-kicker"><span className="v1-kicker-dot" aria-hidden="true"/>LE SOUVENIR · PHOTO ATELIER</p>
  {catalogBadge}
   <h1>Chụp ảnh<br/>lấy ngay<span className="v1-editorial-accent">Yours forever.</span></h1><p>Giữ lại những khoảnh khắc đẹp bên người thân và bạn bè.</p>
   {bundles.length>0&&<div className="v1-bundles" aria-label="Bộ sưu tập sự kiện">{bundles.filter(b=>layouts.some(l=>l.id===b.layoutId)).map(bundle=><button type="button" key={bundle.id} disabled={busy} aria-pressed={selected===bundle.layoutId} onClick={()=>{setSelected(bundle.layoutId);start(bundle.layoutId)}}>{safeImage(bundle.coverDataUrl)?<img src={safeImage(bundle.coverDataUrl)} alt=""/>:<span className="v1-bundle-art" aria-hidden="true">✦</span>}<span><strong>{bundle.name}</strong><small>{bundle.frameCount} khung ảnh · Chạm để bắt đầu</small><small className="v1-layout-tag">{bundle.layoutId}</small></span><b aria-hidden="true">↗</b></button>)}</div>}
  <KioskPrimaryButton disabled={busy||!layoutId} onClick={()=>layoutId&&start(layoutId)}>CHẠM ĐỂ BẮT ĐẦU →</KioskPrimaryButton>
   </section><aside className="v1-start-art"><div className="v1-start-card"><p>BỐ CỤC ẢNH</p><div className="v1-strip-art" aria-hidden="true"><div className="v1-strip v1-strip-back"><i/><i/><i/><em>LE SOUVENIR</em></div><div className="v1-strip v1-strip-front"><i/><i/><i/><em>Yours forever.</em></div></div><div className="v1-start-layouts">{layouts.slice(0,5).map(l=><div key={l.id} className="v1-mini-layout"><span>{l.printSizeLabel}</span><strong>{l.title}</strong><small className="v1-layout-tag">{l.id}</small></div>)}</div></div><div className="v1-event-card">LE SOUVENIR<br/><strong>Mỗi khoảnh khắc<br/>đều đáng nhớ.</strong></div></aside></div>;
}
