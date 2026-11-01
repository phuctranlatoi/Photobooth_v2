import {useRef,useState} from 'react';
import {Check, QrCode, Zap} from 'lucide-react';
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
 return <div className="v1-start"><section>
  <button className="v1-brand" onClick={()=>{if(++taps.current>=5){taps.current=0;onAdmin()}}}>LE SOUVENIR</button>
    <p className="v1-kicker"><span className="v1-kicker-dot" aria-hidden="true"/>PHOTO ATELIER · SEOUL × SAIGON</p>
    <h1>Chụp ảnh<br/>lấy ngay<span className="v1-editorial-accent">Yours forever.</span></h1><p className="v1-start-desc">Giữ lại những khoảnh khắc đẹp bên người thân và bạn bè.</p>
      <div className="v1-value-pills"><span><Zap size={15}/> In lấy ngay 15s</span><span><QrCode size={15}/> Tải ảnh &amp; video bằng QR</span></div>
   {unavailable&&<p role="status">Chưa có bố cục khả dụng. Vui lòng liên hệ nhân viên.</p>}
    <KioskPrimaryButton disabled={busy||!layoutId||unavailable} onClick={()=>layoutId&&start(layoutId)}>CHẠM ĐỂ BẮT ĐẦU →</KioskPrimaryButton>
    <div className="v1-start-catalog-info" style={{opacity:0.55,fontSize:'11px',marginTop:'12px',display:'flex',gap:'8px',alignItems:'center',color:'var(--v-muted)'}}>
       <span>{catalogSource==='FIREBASE_LIVE'?<><Check size={15}/> Firebase Live</>:'Bộ nhớ tạm'}</span>
      <span style={{opacity:0.8}}>({layouts.map(l=>l.id).filter(id=>id.includes('515_')||id.includes('1015_')).slice(0,3).join(', ')})</span>
    </div>
      </section><aside className="v1-start-art"><div className="v1-start-card"><p>PHOTO ATELIER</p><div className="v1-strip-art" aria-label="Minh họa dải ảnh LE SOUVENIR"><div className="v1-strip v1-strip-back"><LayoutArtwork compact layout={layouts[1]??layouts[0]}/></div><div className="v1-strip v1-strip-front"><LayoutArtwork compact layout={layouts[0]}/></div></div><p className="atelier-art-caption">Những khoảnh khắc của riêng bạn.</p></div>{eventBundles.length>0&&<div className="atelier-event-showcase" aria-label="Bộ sưu tập sự kiện">{eventBundles.map(bundle=><button type="button" key={bundle.id} disabled={busy} aria-pressed={selected===bundle.layoutId} onClick={()=>{setSelected(bundle.layoutId);start(bundle.layoutId)}}><img src={safeImage(bundle.coverDataUrl)} alt=""/><span>{bundle.name}</span></button>)}</div>}</aside></div>;
}
