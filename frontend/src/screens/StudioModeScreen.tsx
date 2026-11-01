import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {ActionBar,Heading,KioskPrimaryButton,type ScreenProps} from './KioskUI';
import {formatLayoutSubtitle,formatLayoutTitle,LayoutArtwork} from './LayoutArtwork';

export function StudioModeScreen({layout,layouts,busy,action}:ScreenProps){
 const initial=Math.max(0,layouts.findIndex(l=>l.id===layout?.id));
 const [center,setCenter]=useState(initial);
 const track=useRef<HTMLDivElement>(null);
 const settle=useRef<ReturnType<typeof setTimeout>|null>(null);
 const pending=useRef<string|null>(null);
 const selected=useRef(layout?.id);
 selected.current=layout?.id;
 const active=layouts[center]??layout;
 const move=(index:number)=>{
  const next=layouts[index];if(!next||busy)return;
  if(index===center){action('session.confirmSetup');return}
   pending.current=next.id;
   setCenter(index);if(selected.current!==next.id){selected.current=next.id;action('session.setLayout',{layoutId:next.id})}
  track.current?.querySelectorAll<HTMLElement>('.v1-carousel-card')[index]?.scrollIntoView?.({behavior:'smooth',block:'nearest',inline:'center'});
 };
 useLayoutEffect(()=>{
  const index=Math.max(0,layouts.findIndex(l=>l.id===layout?.id));
  setCenter(index);
  const el=track.current;
  if(el){
   // CSS smooth scrolling must not defer initial placement until after first paint.
   el.style.scrollBehavior='auto';
   el.querySelectorAll<HTMLElement>('.v1-carousel-card')[index]?.scrollIntoView?.({behavior:'auto',block:'nearest',inline:'center'});
   el.style.scrollBehavior='';
  }
 },[layout?.id,layouts]);
 useEffect(()=>()=>{if(settle.current)clearTimeout(settle.current)},[]);
 const onScroll=()=>{
  if(settle.current)clearTimeout(settle.current);
  settle.current=setTimeout(()=>{
   const el=track.current;if(!el||busy)return;
   const middle=el.getBoundingClientRect().left+el.clientWidth/2;
   const cards=[...el.querySelectorAll<HTMLElement>('.v1-carousel-card')];
    if(!cards.length)return;
    const index=cards.reduce((best,card,i)=>Math.abs(card.getBoundingClientRect().left+card.offsetWidth/2-middle)<Math.abs(cards[best].getBoundingClientRect().left+cards[best].offsetWidth/2-middle)?i:best,0);
    const next=layouts[index];if(!next)return;
    // Intermediate cards passed by a smooth arrow scroll are not guest selections.
    if(pending.current&&pending.current!==next.id)return;
    pending.current=null;
    setCenter(index);
    if(selected.current!==next.id){selected.current=next.id;action('session.setLayout',{layoutId:next.id})}
  },160);
 };
  return <><Heading title="Bố cục" eyebrow="LE SOUVENIR · BỐ CỤC" subtitle="Chọn kiểu ảnh yêu thích" back={()=>action('session.back')}/>
  <section className="v1-layout-stage" aria-label="Chọn bố cục ảnh">
   {layouts.length?<><div className="v1-carousel-wrap">
      <button type="button" className="v1-carousel-arrow v1-carousel-prev" aria-label="Bố cục trước" disabled={busy||center===0} onClick={()=>move(center-1)}><ChevronLeft size={24} strokeWidth={2.4} aria-hidden="true"/></button>
     <div className="v1-layout-carousel" ref={track} onScroll={onScroll} onPointerDown={()=>{pending.current=null}}>
     {layouts.map((l,i)=><button type="button" key={l.id} className="v1-layout-card v1-carousel-card" aria-pressed={center===i} aria-label={`${formatLayoutTitle(l)} · ${l.id}`} disabled={busy} onClick={()=>move(i)}>
      <div className="v1-carousel-art"><LayoutArtwork layout={l}/></div>
      <strong>{formatLayoutTitle(l)}</strong><span className="v1-carousel-subtitle">{formatLayoutSubtitle(l)}</span>
      <span className="v1-layout-tag" style={{opacity:0.7,fontSize:'11px',letterSpacing:'0.05em'}}>{l.id}</span>
     </button>)}
    </div>
      <button type="button" className="v1-carousel-arrow v1-carousel-next" aria-label="Bố cục tiếp theo" disabled={busy||center===layouts.length-1} onClick={()=>move(center+1)}><ChevronRight size={24} strokeWidth={2.4} aria-hidden="true"/></button>
   </div><div className="v1-carousel-indicator" aria-live="polite"><span>{String(center+1).padStart(2,'0')} / {String(layouts.length).padStart(2,'0')}</span><strong>{active&&formatLayoutTitle(active)}</strong><p>{active&&formatLayoutSubtitle(active)} · {active?.shotCount} lượt chụp</p></div></>:<div className="v1-panel v1-center" role="status">Chưa có bố cục khả dụng. Vui lòng liên hệ nhân viên.</div>}
  </section><ActionBar><span>Chạm vào bố cục ở giữa hoặc bấm Tiếp tục để chọn</span><KioskPrimaryButton disabled={busy||!layout} onClick={()=>action('session.confirmSetup')}>Tiếp tục →</KioskPrimaryButton></ActionBar></>;
}
