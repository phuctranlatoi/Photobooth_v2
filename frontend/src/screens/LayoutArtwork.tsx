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
 const width=300*ratio,height=300;
 const left=(layout?.paddingLeftRatio??.04)*width,right=(layout?.paddingRightRatio??.04)*width;
 const top=(layout?.paddingTopRatio??.04)*height,gapX=(layout?.gapHorizontalRatio??.04)*width,gapY=(layout?.gapVerticalRatio??.04)*height;
 const slotWidth=(width-left-right-gapX*(columns-1))/columns;
 const slotHeight=slotWidth/(layout?.photoAspectRatio&&layout.photoAspectRatio>0?layout.photoAspectRatio:1.5);
 const slots=layout?.absoluteSlots?.length?layout.absoluteSlots.slice(0,count).map(slot=>({...slot,x:slot.x*width,y:slot.y*height,width:slot.width*width,height:slot.height*height})):Array.from({length:count},(_,index)=>({index,x:left+(slotWidth+gapX)*(index%columns),y:top+(slotHeight+gapY)*Math.floor(index/columns),width:slotWidth,height:slotHeight}));
 const hasSample=Boolean(samplePhotos?.length);
 return <svg className="v1-layout-artwork" role="img" aria-label={`Minh họa ${layout?formatLayoutTitle(layout):'bố cục ảnh'}`} viewBox={`0 0 ${width} ${height}`} style={{aspectRatio:ratio}}>
   <rect width={width} height={height} rx="6" fill="#fff" stroke="#D1C7BD" strokeWidth="1"/>
   <rect x="3" y="3" width={Math.max(0,width-6)} height={Math.max(0,height-6)} rx="4" fill="none" stroke="#EDE6DF" strokeWidth="0.6"/>
   {slots.map((slot,i)=>{
     const x=slot.x,y=slot.y,w=slot.width,h=slot.height;
     const badgeW=Math.max(0,Math.min(w-4,22));
     const sw=Math.max(1,w),sh=Math.max(1,h);
     const minDim=Math.min(sw,sh);
     const pad=minDim*0.04;
     const tick=minDim*0.08;
     const mat=minDim*0.11;
     return <g key={`${slot.index}-${i}`}>
       {selectedPhotos!==undefined?(selectedPhotos[i]?<>
         <image href={selectedPhotos[i]!} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice"/>
         <rect x={x} y={y} width={w} height={h} fill="none" stroke="#D1C7BD" strokeWidth="0.8"/>
         <g>
           <rect x={x+2} y={y+2} width={badgeW} height="9" rx="2.5" fill="#fff" opacity="0.88"/>
           <text x={x+2+badgeW/2} y={y+6.5} textAnchor="middle" dominantBaseline="central" fontSize="4.5" fontFamily="sans-serif" fontWeight="700" fill="#705F53">{String(i+1).padStart(2,'0')}</text>
         </g>
       </>:<>
         <rect x={x} y={y} width={w} height={h} fill="#F9F6F0" stroke="#C8B8A9" strokeWidth="1" strokeDasharray="3 3"/>
         <text x={x+w/2} y={y+h/2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(10,w/4)} fill="#9B8A80">Ảnh {i+1}</text>
       </>):<>
         <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${sw} ${sh}`} preserveAspectRatio="xMidYMid meet" overflow="hidden">
           <rect width={sw} height={sh} fill={i%2?'#ded1c5':'#e9e1d8'}/>
           {hasSample
             ? <image href={samplePhotos![i%samplePhotos!.length]} x={0} y={0} width={sw} height={sh} preserveAspectRatio="xMidYMid slice"/>
             : <>
                 <rect x={mat} y={mat} width={Math.max(1,sw-mat*2)} height={Math.max(1,sh-mat*2)} fill={i%2?'#e9ddd0':'#f2ebe2'} stroke="#b7a695" strokeWidth={Math.max(0.4,minDim*0.006)}/>
                 <text x={sw/2} y={sh*0.48} textAnchor="middle" fontSize={Math.max(3,minDim*0.06)} fontFamily="Georgia,serif" letterSpacing={Math.max(0.3,minDim*0.01)} fill="#65584f">MOMENTS</text>
                 <text x={sw/2} y={sh*0.59} textAnchor="middle" fontSize={Math.max(2.2,minDim*0.035)} fontFamily="sans-serif" letterSpacing={Math.max(0.2,minDim*0.006)} fill="#80746a">SEOUL × SAIGON</text>
               </>}
           <path
             d={`M${pad} ${pad+tick}V${pad}H${pad+tick} M${sw-pad-tick} ${pad}H${sw-pad}V${pad+tick} M${pad} ${sh-pad-tick}V${sh-pad}H${pad+tick} M${sw-pad-tick} ${sh-pad}H${sw-pad}V${sh-pad-tick}`}
             stroke={hasSample?'rgba(255,252,247,0.72)':'#705f53'}
             strokeWidth={Math.max(0.4,minDim*0.006)}
             fill="none"
           />
           {!hasSample&&<>
             <text x={pad*1.75} y={sh-pad*1.75} fontSize={Math.max(2.2,minDim*0.035)} fontFamily="sans-serif" fill="#67594c">{String(i+1).padStart(2,'0')}</text>
             <text x={sw-pad*1.75} y={sh-pad*1.75} textAnchor="end" fontSize={Math.max(2,minDim*0.03)} fontFamily="sans-serif" fill="#67594c">ATELIER 400 · 35mm</text>
           </>}
         </svg>
         <rect x={x} y={y} width={w} height={h} rx="1" fill="none" stroke="#c8b8a9" strokeWidth=".6"/>
         {!compact&&!hasSample&&<text x={x+3} y={y+Math.min(7,h/6)} fontSize={Math.min(5,w/12)} fontFamily="sans-serif" fill="#67594c">{String(i+1).padStart(2,'0')}</text>}
       </>}
     </g>;
   })}
   <text x={width/2} y={height-8} textAnchor="middle" fontFamily="Georgia,serif" fontSize={Math.min(8,width/16)} letterSpacing=".1" fill="#8E442D">LE SOUVENIR · ATELIER</text>
   <text x={width/2} y={height-3} textAnchor="middle" fontFamily="sans-serif" fontSize={Math.min(4,width/32)} letterSpacing=".05" fill="#A8988B">SEOUL × SAIGON · 2026</text>
   {frameOverlayUrl?<image href={frameOverlayUrl} x={0} y={0} width={width} height={height} preserveAspectRatio="xMidYMid meet" style={{pointerEvents:'none'}}/>:selectedPhotos!==undefined&&<g pointerEvents="none">
     <rect x="6" y="6" width={Math.max(0,width-12)} height={Math.max(0,height-12)} rx="4" fill="none" stroke="#8E442D" strokeWidth="1.2" strokeOpacity="0.85"/>
     <rect x="8.5" y="8.5" width={Math.max(0,width-17)} height={Math.max(0,height-17)} rx="2" fill="none" stroke="#D8C7B5" strokeWidth="0.6"/>
     <path d={`M4 14V4H14 M${width-14} 4H${width-4}V14 M4 ${height-14}V${height-4}H14 M${width-14} ${height-4}H${width-4}V${height-14}`} stroke="#8E442D" strokeWidth="0.8" fill="none"/>
   </g>}
 </svg>;
}
