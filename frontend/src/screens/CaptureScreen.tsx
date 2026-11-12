import {useEffect,useRef,useState} from 'react';
import {safeImage} from '../shared/connected-simulator';
import {type ScreenProps} from './KioskUI';

export function CaptureScreen({layout,busy,action,live='',snapshot,count=0,countdown,state}:ScreenProps&{live?:string;count?:number;countdown?:number;state:string}){
  const image=safeImage(snapshot?.livePreviewDataUrl??live);
  const [imageRatio,setImageRatio]=useState(3/2);
  const starting=useRef(false);
  const [displayCount,setDisplayCount]=useState<number|null>(countdown??null);
  const targetEndTimeRef=useRef<number>(0);
  const lastCountdownPropRef=useRef<number|undefined>(countdown);
  useEffect(()=>{
    if(state!=='COUNTDOWN'){
      targetEndTimeRef.current=0;
      lastCountdownPropRef.current=undefined;
      setDisplayCount(null);
      return;
    }
    if(countdown===undefined){
      targetEndTimeRef.current=0;
      setDisplayCount(null);
      return;
    }
    // Re-anchor only on a new backend countdown; other renders must not restart the clock.
    if(targetEndTimeRef.current===0||lastCountdownPropRef.current!==countdown){
      lastCountdownPropRef.current=countdown;
      targetEndTimeRef.current=performance.now()+countdown*1000;
      setDisplayCount(countdown);
    }
    const interval=setInterval(()=>{
      const msLeft=targetEndTimeRef.current-performance.now();
      const sec=Math.max(1,Math.ceil(msLeft/1000));
      setDisplayCount(current=>current===sec?current:sec);
    },50);
    return ()=>clearInterval(interval);
  },[state,countdown]);
  const targetRatio=layout?.photoAspectRatio && layout.photoAspectRatio>0 ? layout.photoAspectRatio : 3/2;
  const cropWidth=Math.min(1,targetRatio/imageRatio);
  const cropHeight=Math.min(1,imageRatio/targetRatio);
  const [flashActive,setFlashActive]=useState(false);
  const flashTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const lastFlashedShotRef=useRef<number>(-1);
  const prevCountRef=useRef<number>(count);

  useEffect(()=>{
    const triggerFlash=(shotIndex:number)=>{
      if(lastFlashedShotRef.current===shotIndex)return;
      lastFlashedShotRef.current=shotIndex;
      setFlashActive(true);
      if(flashTimerRef.current){
        clearTimeout(flashTimerRef.current);
      }
      flashTimerRef.current=setTimeout(()=>{
        setFlashActive(false);
        flashTimerRef.current=null;
      },450);
    };

    if(state==='CAPTURING'){
      triggerFlash(count);
    }else if(count>prevCountRef.current){
      triggerFlash(count-1);
    }else if(state==='LIVE_VIEW'&&count===0){
      lastFlashedShotRef.current=-1;
      if(flashTimerRef.current){
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current=null;
        setFlashActive(false);
      }
    }
    prevCountRef.current=count;
  },[state,count]);

  useEffect(()=>{
    return ()=>{
      if(flashTimerRef.current){
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current=null;
      }
    };
  },[]);

  return <div className="v1-capture-screen v1-capture">
    <div className="v1-camera-viewport">
      <div className="v1-live" aria-label="Khung ngắm máy ảnh" style={{'--image-ratio':String(imageRatio)} as React.CSSProperties}>
         {image?<img className="v1-live-mirrored" src={image} alt="Live View máy ảnh" onLoad={event=>{
           const {naturalWidth,naturalHeight}=event.currentTarget;
           if(naturalWidth>0&&naturalHeight>0){const ratio=naturalWidth/naturalHeight;setImageRatio(current=>current===ratio?current:ratio)}
         }}/>:<p role="status">Đang chờ hình ảnh từ máy ảnh…</p>}
        {image&&<div className="v1-crop" style={{aspectRatio:targetRatio,'--crop-width':String(cropWidth),'--crop-height':String(cropHeight)} as React.CSSProperties}/>}
      </div>
    </div>
    {state==='COUNTDOWN'&&displayCount!==null&&<div className="v1-countdown-layer" role="timer" aria-label={`Còn ${displayCount} giây`}><strong key={displayCount} className="lg-countdown-pop">{displayCount}</strong></div>}
    <div className="v1-capture-top" aria-label={`Ảnh ${count+1} trên ${layout?.shotCount??1}`}>Ảnh {count+1}/{layout?.shotCount??1}</div>
     {state==='LIVE_VIEW'&&count===0&&<div className="v1-shutter-control"><button type="button" className="glass-shutter" aria-label="Bắt đầu chụp" disabled={busy} onClick={()=>{if(starting.current)return;starting.current=true;try{void Promise.resolve(action('capture.startSequence')).then(result=>{if(result===false)starting.current=false}).catch(()=>{starting.current=false})}catch{starting.current=false}}} data-state={busy ? 'capturing' : undefined}><span className="glass-shutter__ring" aria-hidden="true"><span className="glass-shutter__core"/></span></button><span className="v1-shutter-caption">Chạm để chụp</span></div>}
    {(state==='CAPTURING'||flashActive)&&<div className="lg-capture-flash" aria-hidden="true"/>}
  </div>;
}