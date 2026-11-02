import type {PointerEventHandler,ReactNode} from 'react';
import {ArrowLeft} from 'lucide-react';
import type {LayoutMode, PricingSnapshot} from '../shared/simulator-contract';
import {safeImage} from '../shared/connected-simulator';
import {LayoutArtwork} from './LayoutArtwork';

export type Action = (method: import('../shared/simulator-contract').SimulatorMethod, params?:object)=>void | Promise<boolean>;
export interface ScreenProps { layout?:LayoutMode; layouts:LayoutMode[]; pricing?:PricingSnapshot; busy:boolean; action:Action; preview:string; snapshot?:import('../shared/connected-simulator').Snapshot; simulator?:boolean; children?:ReactNode }
export function AppShell({children,camera=false}:{children:ReactNode;camera?:boolean}){return <main className={`v1-shell${camera?' v1-camera':''}`}>{children}</main>}
export function KioskPrimaryButton({children,onClick,disabled=false}:{children:ReactNode;onClick:()=>void;disabled?:boolean}){return <button className="v1-primary" onClick={onClick} disabled={disabled}>{children}</button>}
export function KioskSecondaryButton({children,onClick,disabled=false}:{children:ReactNode;onClick:()=>void;disabled?:boolean}){return <button className="v1-secondary" onClick={onClick} disabled={disabled}>{children}</button>}
export function KioskBackButton({onClick,disabled=false,ariaLabel='Quay lại'}:{onClick:()=>void;disabled?:boolean;ariaLabel?:string}){return <button type="button" className="v1-back backButton" aria-label={ariaLabel} onClick={onClick} disabled={disabled}><ArrowLeft size={24} strokeWidth={2.4} aria-hidden="true"/></button>}
export interface AppHeaderProps {
 title:string; subtitle?:string; eyebrow?:string; step?:string; back?:()=>void;
 right?:ReactNode; menu?:ReactNode; className?:string;
 onTitlePointerDown?:PointerEventHandler<HTMLDivElement>;
 onTitlePointerMove?:PointerEventHandler<HTMLDivElement>;
 onTitlePointerUp?:PointerEventHandler<HTMLDivElement>;
 onTitlePointerCancel?:PointerEventHandler<HTMLDivElement>;
 onTitlePointerLeave?:PointerEventHandler<HTMLDivElement>;
 onTitleDoubleClick?:()=>void;
}
export function AppHeader({title,subtitle,eyebrow,step,back,right,menu,className,onTitlePointerDown,onTitlePointerMove,onTitlePointerUp,onTitlePointerCancel,onTitlePointerLeave,onTitleDoubleClick}:AppHeaderProps){
 const stepText=step||eyebrow;
 return <header className={`v1-heading appHeader ${className??''}`}>
  <div className="appHeader__backSlot">{back?<KioskBackButton onClick={back}/>:<span className="appHeader__backPlaceholder" aria-hidden="true"/>}</div>
  <div className="v1-heading-title appHeader__copy" data-staff-trigger="true" onPointerDown={onTitlePointerDown} onPointerMove={onTitlePointerMove} onPointerUp={onTitlePointerUp} onPointerCancel={onTitlePointerCancel} onPointerLeave={onTitlePointerLeave} onDoubleClick={onTitleDoubleClick}>
   {stepText&&<span className="v1-heading-eyebrow appHeader__eyebrow">{stepText}</span>}
   <div className="appHeader__titleLine"><h1>{title}</h1></div>
   {subtitle&&<p className="appHeader__subtitle">{subtitle}</p>}
  </div>
  {(right||menu)&&<div className="appHeader__right">{right}{menu}</div>}
 </header>;
}
export function Heading(props:AppHeaderProps){return <AppHeader {...props}/>}
export function PrintPreview({src,label='Bản xem trước',ratio,layout,selectedPhotos,frameOverlayUrl}:{src?:string;label?:string;ratio?:number;layout?:LayoutMode;selectedPhotos?:(string|null|undefined)[];frameOverlayUrl?:string}){
  const photos = selectedPhotos?.map(photo => safeImage(photo) || null);
  return <div className="v1-preview" aria-label={label} style={ratio ? {'--print-ratio': String(ratio)} as React.CSSProperties : undefined}>
    {photos === undefined && safeImage(src)
      ? <img src={safeImage(src)} alt={label}/>
      : <div className="v1-preview-empty">
          <LayoutArtwork layout={layout ?? (ratio ? {printAspectRatio: ratio} as LayoutMode : undefined)}
            selectedPhotos={photos} frameOverlayUrl={safeImage(frameOverlayUrl)}/>
          {photos === undefined && <small>Minh họa bố cục · Bản ghép sẽ hiển thị sau khi chụp</small>}
        </div>}
  </div>;
}
export function ActionBar({children}:{children:ReactNode}){return <footer className="v1-actionbar">{children}</footer>}
export function DecisionTimerBadge({seconds}:{seconds?:number|null}){if(seconds===undefined||seconds===null||seconds<=0)return null;return <span className={`v1-timer${seconds<=15?' urgent':''}`}>Còn lại {String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</span>}
export function Vnd({amount}:{amount?:number}){return <>{(amount??0).toLocaleString('vi-VN')} đ</>}
