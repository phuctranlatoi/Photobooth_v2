import {useRef,useState} from 'react';
import {safeImage} from '../shared/connected-simulator';
import {type ScreenProps} from './KioskUI';

export function CaptureScreen({layout,busy,action,live='',snapshot,count=0,countdown,state}:ScreenProps&{live?:string;count?:number;countdown?:number;state:string}){
  const image=safeImage(snapshot?.livePreviewDataUrl??live);
  const [imageRatio,setImageRatio]=useState(3/2);
  const starting=useRef(false);
  const targetRatio=layout?.photoAspectRatio && layout.photoAspectRatio>0 ? layout.photoAspectRatio : 3/2;
  const cropWidth=Math.min(1,targetRatio/imageRatio);
  const cropHeight=Math.min(1,imageRatio/targetRatio);
  return <div className="v1-capture-screen v1-capture">
    <div className="v1-camera-viewport">
      <div className="v1-live" style={{'--image-ratio':String(imageRatio)} as React.CSSProperties}>
        {image?<img className="v1-live-mirrored" src={image} alt="Live View máy ảnh" onLoad={event=>{
          const {naturalWidth,naturalHeight}=event.currentTarget;
          if(naturalWidth>0&&naturalHeight>0){const ratio=naturalWidth/naturalHeight;setImageRatio(current=>current===ratio?current:ratio)}
        }}/>:<p role="status">Đang chờ hình ảnh từ máy ảnh…</p>}
        {image&&<div className="v1-crop" style={{aspectRatio:targetRatio,'--crop-width':String(cropWidth),'--crop-height':String(cropHeight)} as React.CSSProperties}/>}
      </div>
    </div>
    {state==='COUNTDOWN'&&<strong className="v1-countdown" role="timer" aria-label={`Còn ${countdown??0} giây`}>{countdown??''}</strong>}
    <div className="v1-capture-top" aria-label={`Ảnh ${count+1} trên ${layout?.shotCount??1}`}>Ảnh {count+1}/{layout?.shotCount??1}</div>
    {state==='LIVE_VIEW'&&count===0&&<div className="v1-shutter-control"><button type="button" className="v1-shutter" aria-label="Bắt đầu chụp" disabled={busy} onClick={()=>{if(starting.current)return;starting.current=true;try{void Promise.resolve(action('capture.startSequence')).then(result=>{if(result===false)starting.current=false}).catch(()=>{starting.current=false})}catch{starting.current=false}}}><span/></button><span>Chạm để chụp</span></div>}
    {state==='CAPTURING'&&<div className="v1-flash v1-shutter-flash" aria-hidden="true"/>}
  </div>;
}
