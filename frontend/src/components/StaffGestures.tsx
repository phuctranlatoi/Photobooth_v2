import {useEffect,useRef,useState,type ReactNode} from 'react';

export function WelcomeBrand({enabled,onOpen}:{enabled:boolean;onOpen:()=>void}){
 const taps=useRef(0);
 useEffect(()=>{taps.current=0;},[enabled]);
 return <button type="button" className="wordmark gesture-brand" aria-label="LE SOUVENIR" onClick={()=>{if(enabled&&++taps.current===5){taps.current=0;onOpen();}}}>LE SOUVENIR<span className="brand-caption">THE PHOTO STUDIO</span></button>;
}

/** Hold reveals controls only. Never confirms payment or changes backend state. */
export function StaffPaymentPanel({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const origin=useRef<{x:number;y:number}|undefined>(undefined);
 const cancel=()=>{clearTimeout(timer.current);timer.current=undefined;origin.current=undefined;};
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 return <section className="staff-payment">
  <button className="staff-payment-title" onPointerDown={e=>{cancel();origin.current={x:e.clientX,y:e.clientY};timer.current=setTimeout(()=>{setOpen(true);cancel();},700);}} onPointerMove={e=>{if(origin.current&&Math.hypot(e.clientX-origin.current.x,e.clientY-origin.current.y)>12)cancel();}} onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel} onContextMenu={e=>e.preventDefault()}>Simulator payment · staff header</button>
  {open&&<aside className="unavailable-card" aria-label="Simulator staff payment panel"><h3>SIMULATOR · staff controls</h3><p>Source title-hold gesture. Obscurity is not authentication. This test approval is not cash received, PayOS verification or a production payment bypass.</p>{children}<button className="check secondary" onClick={()=>setOpen(false)}>Close staff panel</button></aside>}
 </section>;
}
