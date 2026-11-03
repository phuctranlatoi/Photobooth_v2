import {useRef,useState} from 'react';
import {ActionBar,Heading,KioskPrimaryButton,PrintPreview,Vnd,type ScreenProps} from './KioskUI';
import {formatLayoutTitle} from './LayoutArtwork';

export function QuantityScreen({layout,pricing,busy,action,preview,allowed=[]}:ScreenProps & {allowed?:number[]}){
 const [choice,setChoice]=useState<number>();
 const sent=useRef(false);
 const options=[...allowed].sort((a,b)=>a-b);
 const q=choice??(options.includes(pricing?.quantity??-1)?pricing!.quantity:options[0]);
 const index=options.indexOf(q);
 const verified=q===pricing?.quantity;
 return <><Heading step="Bước 2" title="Chọn số lượng bản in" subtitle="Chọn số bản in bạn muốn" back={()=>action('session.back')}/>
  <div className="v1-split"><section className="v1-quantity"><p>Số bản in</p><div className="v1-stepper"><button type="button" aria-label="Giảm số lượng" disabled={busy||index<=0} onClick={()=>setChoice(options[index-1])}>−</button><strong aria-live="polite">{q??'—'}</strong><button type="button" aria-label="Tăng số lượng" disabled={busy||index<0||index===options.length-1} onClick={()=>setChoice(options[index+1])}>+</button></div><div className="v1-panel v1-quantity-pricing"><p><span>Giá gốc</span><strong>{pricing?.basePrice!=null?<Vnd amount={pricing.basePrice}/>: '—'}</strong></p>{!!pricing?.extraQuantity&&<p><span>In thêm {pricing.extraQuantity} bản</span><strong><Vnd amount={pricing.extraAmount}/></strong></p>}<div className="v1-quantity-total" aria-live="polite">{verified&&pricing?.totalAmount!=null?<><span>Tổng cộng</span><strong><Vnd amount={pricing.totalAmount}/></strong></>:'Tổng giá được backend xác nhận ở bước tiếp theo'}</div></div></section><PrintPreview src={preview} ratio={layout?.printAspectRatio} layout={layout}/></div>
 <ActionBar><span>{layout&&formatLayoutTitle(layout)}</span><KioskPrimaryButton disabled={busy||q===undefined} onClick={()=>{if(sent.current||busy||q===undefined)return;sent.current=true;action('session.setQuantity',{quantity:q})}}>Tiếp tục · {verified&&pricing?.totalAmount!=null?<Vnd amount={pricing.totalAmount}/>: 'Xác nhận giá'} →</KioskPrimaryButton></ActionBar></>;
}
