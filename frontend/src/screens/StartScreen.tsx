import {useRef,useState} from 'react';
import {safeImage} from '../shared/connected-simulator';
import type {CatalogGetResult} from '../shared/simulator-contract';
import {KioskPrimaryButton} from './KioskUI';
import {LayoutArtwork} from './LayoutArtwork';

export function StartScreen({layouts,bundles=[],defaultLayoutId,catalogSource,onStart,onAdmin,busy}:{layouts:CatalogGetResult['layouts'];bundles?:NonNullable<CatalogGetResult['bundles']>;defaultLayoutId?:string;catalogSource?:string;lastSyncError?:string|null;onStart:(layoutId:string)=>void;onAdmin:()=>void;busy:boolean}){
 const taps=useRef(0),pressed=useRef(false);
 const [selected,setSelected]=useState<string|null>(null);
 const start=(id:string)=>{if(pressed.current||busy)return;pressed.current=true;onStart(id)};
 const layoutId=selected??(layouts.some(l=>l.id===defaultLayoutId)?defaultLayoutId:layouts[0]?.id);
  const unavailable=catalogSource==='UNAVAILABLE'||!layouts.length;
   const eventBundles=bundles.filter(b=>layouts.some(l=>l.id===b.layoutId)&&safeImage(b.coverDataUrl));
    const portrait=layouts.find(l=>l.printAspectRatio>=.5)??layouts[0];
    const strip=layouts.find(l=>l.printAspectRatio<.5)??layouts.find(l=>l.id!==portrait?.id);
   return <div className="v1-start atelier-welcome"><section className="atelier-welcome__copy">
     <button type="button" className="v1-brand" data-admin-trigger="true" aria-label="LE SOUVENIR" onClick={()=>{if(++taps.current>=5){taps.current=0;onAdmin()}}}>LE SOUVENIR</button>
     <div className="atelier-welcome__message"><h1>Lưu giữ khoảnh khắc<br/> thanh xuân<span className="v1-editorial-accent">Yours forever.</span></h1><p className="v1-start-desc">Chụp ảnh lấy ngay · Đậm chất nghệ thuật Hàn Quốc</p></div>
   {unavailable&&<p role="status">Chưa có bố cục khả dụng. Vui lòng liên hệ nhân viên.</p>}
    <KioskPrimaryButton disabled={busy||!layoutId||unavailable} onClick={()=>layoutId&&start(layoutId)}>CHẠM ĐỂ BẮT ĐẦU →</KioskPrimaryButton>
         </section><aside className="v1-start-art" aria-label="Mẫu bản in LE SOUVENIR"><div className="atelier-welcome__gallery"><span className="atelier-welcome__halo" aria-hidden="true"/>{portrait&&<figure className="atelier-print atelier-print--portrait" style={{aspectRatio:portrait.printAspectRatio}}><LayoutArtwork compact layout={portrait}/></figure>}{strip&&<figure className="atelier-print atelier-print--strip" style={{aspectRatio:strip.printAspectRatio}}><LayoutArtwork compact layout={strip}/></figure>}{!portrait&&<p className="atelier-welcome__empty">LE SOUVENIR<br/>ATELIER</p>}<p className="atelier-art-caption">LE SOUVENIR · PHOTO ATELIER {portrait&&<span>· MẪU MINH HỌA</span>}</p></div>{eventBundles.length>0&&<div className="atelier-event-showcase" aria-label="Bộ sưu tập sự kiện">{eventBundles.map(bundle=><button type="button" key={bundle.id} disabled={busy||unavailable} aria-pressed={selected===bundle.layoutId} onClick={()=>{setSelected(bundle.layoutId);start(bundle.layoutId)}}><img src={safeImage(bundle.coverDataUrl)} alt=""/><span>{bundle.name}</span></button>)}</div>}</aside></div>;
}
