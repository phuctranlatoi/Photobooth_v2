import {useEffect,useRef,useState} from 'react';
import {safeImage} from '../shared/connected-simulator';
import {ActionBar,Heading,KioskPrimaryButton,PrintPreview,type ScreenProps} from './KioskUI';

export function SelectPhotosScreen({layout,busy,action,preview,shots=[],selected=[]}:ScreenProps&{shots?:{shotId:string;preview:string}[];selected?:number[]}){
  const [lightbox,setLightbox]=useState<number|null>(null);
  const holdTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const wasHeld=useRef(false);

  const clearHold=()=>{
    if(holdTimer.current!==null){clearTimeout(holdTimer.current);holdTimer.current=null;}
  };

  useEffect(()=>()=>{clearHold();},[]);

  const selectedPhotos=selected.map(index=>shots[index]?.preview);

  return (
    <>
      <Heading title="Chọn ảnh" subtitle={`Đã chọn ${selected.length}/${layout?.selectCount??0} ảnh`}/>
      <div className="v1-selection">
        <div className="v1-photo-grid">
          {shots.map((shot,i)=>{
            const order=selected.indexOf(i);
            return (
              <div className="v1-photo-tile" key={shot.shotId}>
                <button
                  type="button"
                  disabled={busy||!safeImage(shot.preview)}
                  aria-label={`Chọn ảnh ${i+1}`}
                  aria-pressed={order>=0}
                  className={order<0&&selected.length>=(layout?.selectCount??Infinity)?'v1-photo-dimmed':''}
                  onPointerDown={event=>{
                    if(event.pointerType==='mouse'&&event.button!==0)return;
                    clearHold();
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
                      setTimeout(()=>{wasHeld.current=false;},50);
                    }
                  }}
                  onPointerCancel={()=>{
                    clearHold();
                    if(wasHeld.current){
                      setLightbox(null);
                    }
                    wasHeld.current=false;
                  }}
                  onPointerLeave={()=>{
                    clearHold();
                    if(wasHeld.current){
                      setLightbox(null);
                    }
                    wasHeld.current=false;
                  }}
                  onClick={()=>{
                    if(wasHeld.current){
                      wasHeld.current=false;
                      return;
                    }
                    if(!busy)action('selection.toggle',{shotIndex:i});
                  }}
                >
                  {safeImage(shot.preview)&&<img src={safeImage(shot.preview)} alt={`Ảnh gốc hoàn chỉnh ${i+1}`} style={{aspectRatio:layout?.photoAspectRatio??1.5}}/>}
                  <span className={order>=0?'v1-photo-order':''} aria-hidden="true">{order>=0?order+1:i+1}</span>
                </button>
              </div>
            );
          })}
        </div>
        <PrintPreview src={preview} ratio={layout?.printAspectRatio} layout={layout} selectedPhotos={selectedPhotos} label="Ảnh đã chọn"/>
      </div>
      {lightbox!==null&&safeImage(shots[lightbox]?.preview)&&(
        <div
          className="v1-lightbox v1-hold-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Xem lớn ảnh ${lightbox+1}`}
          onPointerUp={()=>{clearHold();setLightbox(null);wasHeld.current=false;}}
          onPointerCancel={()=>{clearHold();setLightbox(null);wasHeld.current=false;}}
        >
          <img src={safeImage(shots[lightbox].preview)} alt={`Ảnh ${lightbox+1}`}/>
        </div>
      )}
      <ActionBar>
        <span>Chạm vào ảnh theo thứ tự muốn in · Giữ để xem lớn</span>
        <KioskPrimaryButton disabled={busy||selected.length!==layout?.selectCount} onClick={()=>action('selection.confirm')}>
          Tiếp tục →
        </KioskPrimaryButton>
      </ActionBar>
    </>
  );
}
