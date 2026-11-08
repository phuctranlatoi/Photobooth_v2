import type {LayoutMode} from '../shared/simulator-contract';

/** Operator-only schematic, not a print composition or photo preview. */
export function LayoutSchematicSymbol({layout}:{layout:LayoutMode}){
  const ratio=Number.isFinite(layout.printAspectRatio)&&layout.printAspectRatio>0?layout.printAspectRatio:2/3;
  const height=150;
  const width=height*ratio;
  const count=Math.max(0,Math.min(50,Math.trunc(layout.selectCount)||0));
  const absolute=layout.absoluteSlots;
  const validAbsolute=absolute?.length===count&&absolute.every(slot=>
    [slot.x,slot.y,slot.width,slot.height].every(Number.isFinite)&&
    slot.x>=0&&slot.y>=0&&slot.width>0&&slot.height>0&&
    slot.x+slot.width<=1.000001&&slot.y+slot.height<=1.000001
  );
  const columns=Math.max(1,Math.min(count,layout.gridColumns??(ratio<.5?1:2)));
  const rows=Math.ceil(count/columns);
  const inset=ratio<.5?5:8;
  const gap=4;
  const top=10;
  const bottom=16;
  const slotWidth=(width-2*inset-gap*(columns-1))/columns;
  const slotHeight=rows?(height-top-bottom-gap*(rows-1))/rows:0;
  const slots=validAbsolute
    ? absolute!.map(slot=>({x:slot.x*width,y:slot.y*height,width:slot.width*width,height:slot.height*height}))
    : Array.from({length:count},(_,index)=>({
      x:inset+(index%columns)*(slotWidth+gap),
      y:top+Math.floor(index/columns)*(slotHeight+gap),
      width:slotWidth,height:slotHeight,
    }));

  return <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Sơ đồ bố cục ${layout.title}: ${columns} cột, ${count} ô ảnh`} preserveAspectRatio="xMidYMid meet">
    <rect x=".5" y=".5" width={width-1} height={height-1} rx="4" fill="#FFFDF9" stroke="#D8C7B5"/>
    {slots.map((slot,index)=><g key={index}>
      <rect x={slot.x} y={slot.y} width={slot.width} height={slot.height} rx="2" fill="#EAE4DC" stroke="#C4B4A4" strokeWidth=".8"/>
      <text x={slot.x+slot.width/2} y={slot.y+slot.height/2} textAnchor="middle" dominantBaseline="central" fontFamily="sans-serif" fontSize={Math.min(11,slot.height*.4,slot.width*.45)} fontWeight="bold" fill="#7A6B60">{index+1}</text>
    </g>)}
    <line x1={width*.28} y1="142" x2={width*.72} y2="142" stroke="#C4B4A4" strokeWidth="1" strokeLinecap="round"/>
  </svg>;
}
