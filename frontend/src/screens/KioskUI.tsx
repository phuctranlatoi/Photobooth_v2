import type {PointerEventHandler,ReactNode} from 'react';
import {ArrowLeft} from 'lucide-react';
import type {LayoutMode, PricingSnapshot} from '../shared/simulator-contract';
import {safeImage} from '../shared/connected-simulator';
import {LayoutArtwork} from './LayoutArtwork';

export type Action = (method: import('../shared/simulator-contract').SimulatorMethod, params?:object)=>void;
export interface ScreenProps { layout?:LayoutMode; layouts:LayoutMode[]; pricing?:PricingSnapshot; busy:boolean; action:Action; preview:string; snapshot?:import('../shared/connected-simulator').Snapshot; simulator?:boolean; children?:ReactNode }
export function AppShell({children,camera=false}:{children:ReactNode;camera?:boolean}){return <main className={`v1-shell${camera?' v1-camera':''}`}>{children}</main>}
export function KioskPrimaryButton({children,onClick,disabled=false}:{children:ReactNode;onClick:()=>void;disabled?:boolean}){return <button className="v1-primary" onClick={onClick} disabled={disabled}>{children}</button>}
export function KioskSecondaryButton({children,onClick,disabled=false}:{children:ReactNode;onClick:()=>void;disabled?:boolean}){return <button className="v1-secondary" onClick={onClick} disabled={disabled}>{children}</button>}
export function KioskBackButton({onClick,disabled=false}:{onClick:()=>void;disabled?:boolean}){return <button type="button" className="v1-back" aria-label="Quay lại" onClick={onClick} disabled={disabled}><ArrowLeft size={22} strokeWidth={2.4} aria-hidden="true"/></button>}
export function Heading({title,subtitle,back,menu,eyebrow,step,className,onTitlePointerDown,onTitlePointerMove,onTitlePointerUp,onTitlePointerCancel,onTitlePointerLeave,onTitleDoubleClick}:{title:string;subtitle?:string;back?:()=>void;menu?:ReactNode;eyebrow?:string;step?:string;className?:string;onTitlePointerDown?:PointerEventHandler<HTMLDivElement>;onTitlePointerMove?:PointerEventHandler<HTMLDivElement>;onTitlePointerUp?:PointerEventHandler<HTMLDivElement>;onTitlePointerCancel?:PointerEventHandler<HTMLDivElement>;onTitlePointerLeave?:PointerEventHandler<HTMLDivElement>;onTitleDoubleClick?:()=>void}){return <header className={`v1-heading ${className ?? ''}`}>{back&&<KioskBackButton onClick={back}/>}<div className="v1-heading-title" data-staff-trigger="true" onPointerDown={onTitlePointerDown} onPointerMove={onTitlePointerMove} onPointerUp={onTitlePointerUp} onPointerCancel={onTitlePointerCancel} onPointerLeave={onTitlePointerLeave} onDoubleClick={onTitleDoubleClick}>{(step||eyebrow)&&<span className="v1-heading-eyebrow">{step||eyebrow}</span>}<h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{menu}</header>}
export function PrintPreview({src,label='Bản xem trước',ratio,layout}:{src?:string;label?:string;ratio?:number;layout?:LayoutMode}){
  const imgLabel = label.includes('600 DPI') ? label : `${label} 600 DPI`;
  return <div className="v1-preview" aria-label={label} style={ratio?{'--print-ratio':String(ratio)} as React.CSSProperties:undefined}>{safeImage(src)?<img src={safeImage(src)} alt={imgLabel} aria-label={imgLabel}/>:<div className="v1-preview-empty"><LayoutArtwork layout={layout??(ratio?{printAspectRatio:ratio} as LayoutMode:undefined)}/><small>Minh họa bố cục · Bản ghép sẽ hiển thị sau khi chụp</small></div>}</div>;
}
export function ActionBar({children}:{children:ReactNode}){return <footer className="v1-actionbar">{children}</footer>}
export function DecisionTimerBadge({seconds}:{seconds?:number}){if(seconds===undefined||seconds<0)return null;return <span className={`v1-timer${seconds<=15?' urgent':''}`}>Còn lại {String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</span>}
export function Vnd({amount}:{amount?:number}){return <>{(amount??0).toLocaleString('vi-VN')} đ</>}
