import {useEffect,useRef,useState} from 'react';
import {safeImage} from '../shared/connected-simulator';
import {ActionBar,Heading,KioskPrimaryButton,PrintPreview,type ScreenProps} from './KioskUI';

export function SelectPhotosScreen({layout,busy,action,preview,shots=[],selected=[]}:ScreenProps&{shots?:{shotId:string;preview:string}[];selected?:number[]}){
   const [lightbox,setLightbox]=useState<number|null>(null);
   const [zoomPinned,setZoomPinned]=useState(false);
  const [localSelected,setLocalSelected]=useState<number[]>(selected);
  const pending=useRef<{index:number;result:number[]}[]>([]);
  const previousSelected=useRef(selected);
  useEffect(()=>{
    if(selected.join(',')===previousSelected.current.join(','))return;
    previousSelected.current=selected;
    const acknowledged=pending.current.findIndex(entry=>entry.result.join(',')===selected.join(','));
    if(acknowledged>=0)pending.current.splice(0,acknowledged+1);
    else pending.current=[];
    setLocalSelected(pending.current.reduce<number[]>((current,{index})=>current.includes(index)?current.filter(i=>i!==index):[...current,index],selected));
  },[selected]);
  const holdTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const wasHeld=useRef(false);

  const clearHold=()=>{
    if(holdTimer.current!==null){clearTimeout(holdTimer.current);holdTimer.current=null;}
  };

  useEffect(()=>{
     const release=()=>{clearHold();if(!zoomPinned)setLightbox(null)};
     const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setZoomPinned(false);setLightbox(null)}};
     window.addEventListener('pointerup',release);
     window.addEventListener('pointercancel',release);
     window.addEventListener('keydown',escape);
     return ()=>{clearHold();window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('keydown',escape)};
   },[zoomPinned]);

  const selectedPhotos=localSelected.map(index=>shots[index]?.preview);
  const toggle=(index:number)=>{
    if(!localSelected.includes(index)&&localSelected.length>=(layout?.selectCount??Infinity))return;
    const next=localSelected.includes(index)?localSelected.filter(i=>i!==index):[...localSelected,index];
    pending.current.push({index,result:next});
    setLocalSelected(next);
    action('selection.toggle',{shotIndex:index});
  };

  return (
    <>
       <Heading step="Bước 3" title="Chọn ảnh để in" subtitle={`Đã chọn ${localSelected.length}/${layout?.selectCount??0} ảnh · Chạm để chọn, giữ để xem lớn`} back={()=>action('session.back')}/>
      <div className="v1-selection">
        <div className="v1-photo-grid">
          {shots.map((shot,i)=>{
             const order=localSelected.indexOf(i);
            return (
              <div className="v1-photo-tile" key={shot.shotId}>
                <button
                  type="button"
                   disabled={!safeImage(shot.preview)}
                  aria-label={`Chọn ảnh ${i+1}`}
                  aria-pressed={order>=0}
                   className={order<0&&localSelected.length>=(layout?.selectCount??Infinity)?'v1-photo-dimmed':''}
                  onPointerDown={event=>{
                    if(event.pointerType==='mouse'&&event.button!==0)return;
                    clearHold();
                    wasHeld.current=false;
                     holdTimer.current=setTimeout(()=>{
                       wasHeld.current=true;
                       setZoomPinned(false);
                       setLightbox(i);
                    },500);
                  }}
                   onPointerUp={()=>{
                     clearHold();
                     if(wasHeld.current){
                       setLightbox(null);
                     }
                   }}
                  onPointerCancel={()=>{
                    clearHold();
                    if(wasHeld.current){
                      setLightbox(null);
                    }
                   }}
                  onPointerLeave={()=>{
                    clearHold();
                    if(wasHeld.current){
                      setLightbox(null);
                    }
                   }}
                  onClick={()=>{
                    if(wasHeld.current){
                      wasHeld.current=false;
                      return;
                    }
                     toggle(i);
                  }}
                >
                  {safeImage(shot.preview)&&<img src={safeImage(shot.preview)} alt={`Ảnh gốc hoàn chỉnh ${i+1}`} style={{aspectRatio:layout?.photoAspectRatio??1.5}}/>}
                  <span className={order>=0?'v1-photo-order':''} aria-hidden="true">{order>=0?order+1:i+1}</span>
                 </button>
                 {safeImage(shot.preview)&&<button type="button" className="v1-photo-zoom" aria-label={`Xem lớn ảnh ${i+1}`} onClick={()=>{setZoomPinned(true);setLightbox(i)}}>＋</button>}
              </div>
            );
          })}
        </div>
        <PrintPreview src={preview} ratio={layout?.printAspectRatio} layout={layout} selectedPhotos={selectedPhotos} label="Ảnh đã chọn"/>
      </div>
      {lightbox!==null&&safeImage(shots[lightbox]?.preview)&&(
        <div
           className={`v1-lightbox v1-hold-lightbox${zoomPinned?' v1-zoom-pinned':''}`}
          role="dialog"
          aria-modal="true"
          aria-label={`Xem lớn ảnh ${lightbox+1}`}
            onPointerUp={()=>{if(!zoomPinned){clearHold();setLightbox(null)}}}
            onPointerCancel={()=>{if(!zoomPinned){clearHold();setLightbox(null)}}}
         >
           <img src={safeImage(shots[lightbox].preview)} alt={`Ảnh ${lightbox+1}`}/>
           {zoomPinned&&<button type="button" aria-label="Đóng ảnh phóng to" onClick={()=>{setZoomPinned(false);setLightbox(null)}}>×</button>}
        </div>
      )}
      <ActionBar>
        <span>Chạm vào ảnh theo thứ tự muốn in · Giữ để xem lớn</span>
          <KioskPrimaryButton disabled={busy||localSelected.length!==(layout?.selectCount??0)} onClick={()=>action('selection.confirm',{selectedIndices:localSelected})}>
          Tiếp tục →
        </KioskPrimaryButton>
      </ActionBar>
    </>
  );
}
