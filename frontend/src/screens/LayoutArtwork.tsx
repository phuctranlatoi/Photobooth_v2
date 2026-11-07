import type {LayoutMode} from '../shared/simulator-contract';

/** Decorative layout illustration only. The backend composition is always the source of truth. */
export function formatLayoutTitle(l:LayoutMode){
 if(l.id==='515_4_anh')return 'Dải 4 ảnh cổ điển';
 if(l.id==='1015_4_base')return 'Khung 4 ảnh postcard';
 if(l.id==='1015_4_ILCL')return 'Khung 4 ảnh đặc biệt';
 return l.title;
}
export function formatLayoutSubtitle(l:LayoutMode){
 const size=l.printSizeLabel.replace(/\s/g,'').match(/5[x×]15|10[x×]15/i)?.[0]??(l.printAspectRatio<.5?'5×15':'10×15');
 return `${l.selectCount} ảnh · ${size.startsWith('5')?'Dải':'Khổ'} ${size.replace(/[xX]/,'×')} cm · ${l.countdownSeconds}s đếm ngược`;
}
export function LayoutArtwork({layout,compact=false,selectedPhotos,frameOverlayUrl,samplePhotos}:{layout?:LayoutMode;compact?:boolean;selectedPhotos?:(string|null|undefined)[];frameOverlayUrl?:string;samplePhotos?:readonly string[]}){
 const count=Math.max(1,Math.min(layout?.selectCount??4,24));
 const ratio=layout?.printAspectRatio&&layout.printAspectRatio>0?layout.printAspectRatio:1/3;
 const columns=Math.max(1,Math.min(layout?.gridColumns??(ratio<.5?1:2),count));
 const rows=Math.ceil(count/columns);
  const width=300*ratio,height=300;
  const left=(layout?.paddingLeftRatio??.04)*width,right=(layout?.paddingRightRatio??.04)*width;
  const top=(layout?.paddingTopRatio??.04)*height,gapX=(layout?.gapHorizontalRatio??.04)*width,gapY=(layout?.gapVerticalRatio??.04)*height;
  const slotWidth=(width-left-right-gapX*(columns-1))/columns;
  const slotHeight=slotWidth/(layout?.photoAspectRatio&&layout.photoAspectRatio>0?layout.photoAspectRatio:1.5);
  const slots=layout?.absoluteSlots?.length?layout.absoluteSlots.slice(0,count).map(slot=>({...slot,x:slot.x*width,y:slot.y*height,width:slot.width*width,height:slot.height*height})):Array.from({length:count},(_,index)=>({index,x:left+(slotWidth+gapX)*(index%columns),y:top+(slotHeight+gapY)*Math.floor(index/columns),width:slotWidth,height:slotHeight}));
 return <svg className="v1-layout-artwork" role="img" aria-label={`Minh họa ${layout?formatLayoutTitle(layout):'bố cục ảnh'}`} viewBox={`0 0 ${width} ${height}`} style={{aspectRatio:ratio}}>
  <rect width={width} height={height} rx="7" fill="#fff"/>
    {slots.map((slot,i)=>{const x=slot.x,y=slot.y,w=slot.width,h=slot.height;return <g key={`${slot.index}-${i}`}>
     {selectedPhotos!==undefined?(selectedPhotos[i]?<image href={selectedPhotos[i]!} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice"/>:<><rect x={x} y={y} width={w} height={h} fill="#F7F5F0" stroke="#E5DCD5" strokeDasharray="3 3"/><text x={x+w/2} y={y+h/2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(10,w/4)} fill="#9B8A80">Ảnh {i+1}</text></>):<>
     <svg x={x} y={y} width={w} height={h} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" overflow="hidden">
      <rect width="100" height="100" fill={i%2?'#ded1c5':'#e9e1d8'}/>
      {samplePhotos?.length ? <image href={samplePhotos[i%samplePhotos.length]} width="100" height="100" preserveAspectRatio="xMidYMid slice" style={{filter:'grayscale(1) sepia(.16) contrast(1.07)'}}/> : <><rect x="11" y="11" width="78" height="78" fill={i%2?'#e9ddd0':'#f2ebe2'} stroke="#b7a695" strokeWidth=".6"/><text x="50" y="48" textAnchor="middle" fontSize="6" fontFamily="Georgia,serif" letterSpacing="1" fill="#65584f">MOMENTS</text><text x="50" y="59" textAnchor="middle" fontSize="3.5" fontFamily="sans-serif" letterSpacing=".6" fill="#80746a">SEOUL × SAIGON</text></>}
      <path d="M4 12V4H12 M88 4H96V12 M4 88V96H12 M88 96H96V88" stroke="#705f53" strokeWidth=".6" fill="none"/>
      <path d="M48 22h4m-2-2v4" stroke="#8f7b6c" strokeWidth=".5"/>
      <text x="7" y="93" fontSize="3.5" fontFamily="sans-serif" fill="#67594c">{String(i+1).padStart(2,'0')}</text>
      <text x="93" y="93" textAnchor="end" fontSize="3" fontFamily="sans-serif" fill="#67594c">ATELIER 400 · 35mm</text>
     </svg><rect x={x} y={y} width={w} height={h} rx="1" fill="none" stroke="#c8b8a9" strokeWidth=".6"/>
     {!compact&&<text x={x+3} y={y+Math.min(7,h/6)} fontSize={Math.min(5,w/12)} fontFamily="sans-serif" fill="#67594c">{String(i+1).padStart(2,'0')}</text>}</>}
   </g>})}
    {selectedPhotos===undefined&&<text x={width/2} y={height-8} textAnchor="middle" fontFamily="Georgia,serif" fontSize={Math.min(8,width/16)} letterSpacing=".5" fill="#776052">LE SOUVENIR · ATELIER</text>}
    {selectedPhotos!==undefined&&frameOverlayUrl&&<image href={frameOverlayUrl} x={0} y={0} width={width} height={height} preserveAspectRatio="xMidYMid meet" style={{pointerEvents:'none'}}/>}
 </svg>;
}
