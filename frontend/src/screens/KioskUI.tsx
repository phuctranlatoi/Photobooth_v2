import type {ReactNode} from 'react';
import type {LayoutMode, PricingSnapshot} from '../shared/simulator-contract';
import {safeImage} from '../shared/connected-simulator';
import {LayoutArtwork} from './LayoutArtwork';

export type Action = (method: import('../shared/simulator-contract').SimulatorMethod, params?:object)=>void;
export interface ScreenProps { layout?:LayoutMode; layouts:LayoutMode[]; pricing?:PricingSnapshot; busy:boolean; action:Action; preview:string; snapshot?:import('../shared/connected-simulator').Snapshot; simulator?:boolean; children?:ReactNode }
export function AppShell({children,camera=false}:{children:ReactNode;camera?:boolean}){return <main className={`v1-shell${camera?' v1-camera':''}`}>{children}</main>}
export function KioskPrimaryButton({children,onClick,disabled=false}:{children:ReactNode;onClick:()=>void;disabled?:boolean}){return <button className="v1-primary" onClick={onClick} disabled={disabled}>{children}</button>}
export function KioskSecondaryButton({children,onClick,disabled=false}:{children:ReactNode;onClick:()=>void;disabled?:boolean}){return <button className="v1-secondary" onClick={onClick} disabled={disabled}>{children}</button>}
export function KioskBackButton({onClick,disabled=false}:{onClick:()=>void;disabled?:boolean}){return <button className="v1-back" aria-label="Quay lại" onClick={onClick} disabled={disabled}>←</button>}
export function Heading({title,subtitle,back,menu}:{title:string;subtitle?:string;back?:()=>void;menu?:ReactNode}){return <header className="v1-heading">{back&&<KioskBackButton onClick={back}/>}<div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{menu}</header>}
export function PrintPreview({src,label='Bản xem trước',ratio,layout}:{src?:string;label?:string;ratio?:number;layout?:LayoutMode}){return <div className="v1-preview" aria-label={label} style={ratio?{'--print-ratio':String(ratio)} as React.CSSProperties:undefined}>{safeImage(src)?<img src={safeImage(src)} alt={label}/>:<div className="v1-preview-empty"><LayoutArtwork layout={layout??(ratio?{printAspectRatio:ratio} as LayoutMode:undefined)}/><small>Minh họa bố cục · Bản ghép sẽ hiển thị sau khi chụp</small></div>}</div>}
export function ActionBar({children}:{children:ReactNode}){return <footer className="v1-actionbar">{children}</footer>}
export function DecisionTimerBadge({seconds}:{seconds?:number}){if(seconds===undefined||seconds<0)return null;return <span className={`v1-timer${seconds<=15?' urgent':''}`}>Còn lại {String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</span>}
export function Vnd({amount}:{amount?:number}){return <>{(amount??0).toLocaleString('vi-VN')} đ</>}
