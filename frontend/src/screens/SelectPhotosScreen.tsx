import {useEffect,useRef,useState} from 'react';
import {safeImage} from '../shared/connected-simulator';
import {ActionBar,Heading,KioskPrimaryButton,PrintPreview,type ScreenProps} from './KioskUI';

export function SelectPhotosScreen({layout,busy,action,preview,shots=[],selected=[]}:ScreenProps&{shots?:{shotId:string;preview:string}[];selected?:number[]}){
   const [lightbox,setLightbox]=useState<number|null>(null);
   const confirming=useRef(false);
  const [localSelected,setLocalSelected]=useState<number[]>(selected);
  const selectedRef=useRef(selected);
  const pending=useRef<{index:number;result:number[]}[]>([]);
  const previousSelected=useRef(selected);
  useEffect(()=>{
    if(selected.join(',')===previousSelected.current.join(','))return;
    previousSelected.current=selected;
    const acknowledged=pending.current.findIndex(entry=>entry.result.join(',')===selected.join(','));
    if(acknowledged>=0)pending.current.splice(0,acknowledged+1);
    else pending.current=[];
     const reconciled=pending.current.reduce<number[]>((current,{index})=>current.includes(index)?current.filter(i=>i!==index):[...current,index],selected);
     selectedRef.current=reconciled;
     setLocalSelected(reconciled);
  },[selected]);
   const holdTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
   const suppressionResetTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
   const wasHeld=useRef(false);

   const clearHold=()=>{
     if(holdTimer.current!==null){clearTimeout(holdTimer.current);holdTimer.current=null;}
   };
   const clearSuppressionReset=()=>{
     if(suppressionResetTimer.current!==null){clearTimeout(suppressionResetTimer.current);suppressionResetTimer.current=null;}
   };

  useEffect(()=>{
      const release=()=>{clearHold();setLightbox(null)};
      const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setLightbox(null)};
     window.addEventListener('pointerup',release);
     window.addEventListener('pointercancel',release);
     window.addEventListener('keydown',escape);
      return ()=>{clearHold();clearSuppressionReset();window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('keydown',escape)};
    },[]);

  const selectedPhotos=localSelected.map(index=>shots[index]?.preview);
  const toggle=(index:number)=>{
     const current=selectedRef.current;
     if(!current.includes(index)&&current.length>=(layout?.selectCount??Infinity))return;
     const next=current.includes(index)?current.filter(i=>i!==index):[...current,index];
     selectedRef.current=next;
     pending.current.push({index,result:next});
     setLocalSelected(next);
     // The backend contract exposes ordered toggles, not session.selectPhotos.
     // Keep taps immediate while reconciling acknowledgements in arrival order.
     try {void Promise.resolve(action('selection.toggle',{shotIndex:index})).catch(()=>{/* authoritative snapshot reconciles on reconnect */})}
     catch {/* authoritative snapshot reconciles on reconnect */}
  };

  return (
    <>
       <Heading step="Bước 3" title="Chọn ảnh để in" subtitle={`Đã chọn ${localSelected.length}/${layout?.selectCount??0} ảnh · Chạm để chọn, giữ để xem lớn`} back={()=>action('session.back')}/>
       <div className="v1-selection">
         <section className="v1-selection-photos"><h2>Chọn ảnh để in</h2><p>Đã chọn {localSelected.length}/{layout?.selectCount??0} ảnh</p><div className={`v1-photo-grid ${layout?.photoAspectRatio !== undefined && layout.photoAspectRatio < 1.1 ? 'v1-photo-grid-portrait' : 'v1-photo-grid-landscape'}`}>
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
                     clearSuppressionReset();
                     wasHeld.current=false;
                     holdTimer.current=setTimeout(()=>{
                       wasHeld.current=true;
                        setLightbox(i);
                    },500);
                  }}
                   onPointerUp={()=>{
                     clearHold();
                      if(wasHeld.current){
                        setLightbox(null);
                        clearSuppressionReset();
                        suppressionResetTimer.current=setTimeout(()=>{wasHeld.current=false;suppressionResetTimer.current=null;},200);
                      }
                   }}
                  onPointerCancel={()=>{
                    clearHold();
                    if(wasHeld.current){
                      setLightbox(null);
                    }
                   }}
                   onPointerLeave={()=>{clearHold();}}
                   onClick={()=>{
                     if(wasHeld.current){
                       clearSuppressionReset();
                       wasHeld.current=false;
                      return;
                    }
                     toggle(i);
                  }}
                >
                  {safeImage(shot.preview)&&<img src={safeImage(shot.preview)} alt={`Ảnh gốc hoàn chỉnh ${i+1}`} style={{aspectRatio:layout?.photoAspectRatio??1.5}}/>}
                   {order>=0&&<span className="v1-photo-order" aria-hidden="true">{order+1}</span>}
                 </button>
              </div>
            );
          })}
         </div></section>
         <section className="v1-selection-print"><h2>Bản in đang chọn</h2><p>{localSelected.length}/{layout?.selectCount??0} ảnh</p><PrintPreview src={preview} ratio={layout?.printAspectRatio} layout={layout} selectedPhotos={selectedPhotos} label="Ảnh đã chọn"/></section>
      </div>
      {lightbox!==null&&safeImage(shots[lightbox]?.preview)&&(
        <div
            className="v1-lightbox v1-hold-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Xem lớn ảnh ${lightbox+1}`}
             onPointerUp={()=>{clearHold();setLightbox(null)}}
             onPointerCancel={()=>{clearHold();setLightbox(null)}}
         >
           <img src={safeImage(shots[lightbox].preview)} alt={`Ảnh ${lightbox+1}`}/>
        </div>
      )}
      <ActionBar>
        <span>Chạm vào ảnh theo thứ tự muốn in · Giữ để xem lớn</span>
          <KioskPrimaryButton disabled={busy||localSelected.length!==(layout?.selectCount??0)} onClick={()=>{if(confirming.current)return;confirming.current=true;try{void Promise.resolve(action('selection.confirm',{selectedIndices:localSelected})).then(result=>{if(result===false)confirming.current=false}).catch(()=>{confirming.current=false})}catch{confirming.current=false}}}>
          Tiếp tục →
        </KioskPrimaryButton>
      </ActionBar>
    </>
  );
}
