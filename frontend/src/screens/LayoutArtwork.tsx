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
export function LayoutArtwork({layout,compact=false,selectedPhotos,frameOverlayUrl}:{layout?:LayoutMode;compact?:boolean;selectedPhotos?:(string|null|undefined)[];frameOverlayUrl?:string}){
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
    <rect width="100" height="100" fill={i%2?'#EDE1D9':'#F4EFEA'}/><circle cx="74" cy="23" r="19" fill="#fff7ef" opacity=".65"/>
    <path d="M-5 103 Q15 65 42 78 Q74 54 105 94 V105Z" fill={i%2?'#B8C9B8':'#DFC9B8'}/>
    <ellipse cx="50" cy="48" rx="17" ry="21" fill="#E9BEA7"/><path d="M32 49 Q29 13 49 17 Q77 14 68 52 L62 35 Q48 41 34 34Z" fill="#493A37"/>
    <path d="M18 105 Q21 72 50 70 Q79 72 83 105" fill={i%2?'#9DAF9B':'#BC8176'}/>
    <circle cx="44" cy="48" r="1" fill="#51403B"/><circle cx="57" cy="48" r="1" fill="#51403B"/><path d="M46 59 Q50 62 55 59" fill="none" stroke="#A76863" strokeWidth="1.5"/>
   </svg><rect x={x} y={y} width={w} height={h} rx="2" fill="none" stroke="#E9DED7" strokeWidth="1"/>
    {!compact&&<g><rect x={x+3} y={y+3} width={Math.min(w-6,28)} height="12" rx="6" fill="#fff" opacity=".94"/><text x={x+7} y={y+11.5} fontSize="6" fontFamily="sans-serif" fill="#5A4B45">Ảnh {i+1}</text></g>}</>}
   </g>})}
   {selectedPhotos===undefined&&<text x={width/2} y={height-8} textAnchor="middle" fontFamily="Georgia,serif" fontSize={Math.min(9,width/10)} letterSpacing="1" fill="#9B6B5E">LE SOUVENIR</text>}
    {selectedPhotos!==undefined&&frameOverlayUrl&&<image href={frameOverlayUrl} x={0} y={0} width={width} height={height} preserveAspectRatio="xMidYMid meet" style={{pointerEvents:'none'}}/>}
 </svg>;
}
