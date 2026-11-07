import {useRef,useState} from 'react';
import {ActionBar,Heading,KioskPrimaryButton,PrintPreview,Vnd,type ScreenProps} from './KioskUI';
import {formatLayoutTitle} from './LayoutArtwork';

export function QuantityScreen({layout,pricing,busy,action,preview,allowed=[]}:ScreenProps & {allowed?:number[]}){
  const [choice,setChoice]=useState<number>();
  const sent=useRef(false);
  const isStrip=layout?.printSizeLabel?.replace(/\s/g,'').toLowerCase().includes('5x15')??false;
  // The supplied options are authoritative; these defaults are only for the offline simulator.
  const fallback=isStrip?[2,4,6,8,10,12,14,16,18,20]:[2,3,4,5,6,7,8,9,10];
  const options=(allowed.length?[...allowed]:fallback).sort((a,b)=>a-b);
  const q=choice??(options.includes(pricing?.quantity??-1)?pricing!.quantity:options[0]);
  const index=options.indexOf(q);
  const verified=q===pricing?.quantity;
  return <>
    <Heading step="Bước 2" title="Chọn số lượng bản in" subtitle="Mỗi bản in là một kỷ niệm để mang về." back={()=>action('session.back')}/>
    <div className="v1-split v1-quantity-workspace">
      <section className="v1-quantity" aria-label="Chọn số bản in">
        <div className="v1-quantity-picker">
          <p className="v1-quantity-eyebrow">SỐ BẢN IN</p>
          <div className="v1-stepper">
            <button type="button" aria-label="Giảm số lượng" disabled={busy||index<=0} onClick={()=>setChoice(options[index-1])}>−</button>
            <strong aria-live="polite">{q??'—'}</strong>
            <button type="button" aria-label="Tăng số lượng" disabled={busy||index<0||index===options.length-1} onClick={()=>setChoice(options[index+1])}>+</button>
          </div>
          <p className="v1-quantity-hint">{isStrip?'Bản in dải được chọn theo cặp':'Chọn số bản in phù hợp với bạn'}</p>
        </div>
        <div className="v1-quantity-pricing">
          <p><span>Giá cơ bản</span><strong>{pricing?.basePrice!=null?<Vnd amount={pricing.basePrice}/>:'—'}</strong></p>
          {!!pricing?.extraQuantity&&<p><span>In thêm {pricing.extraQuantity} bản</span><strong><Vnd amount={pricing.extraAmount}/></strong></p>}
          <div className="v1-quantity-total" aria-live="polite">{verified&&pricing?.totalAmount!=null?<><span>Tổng cộng</span><strong><Vnd amount={pricing.totalAmount}/></strong></>:<span>Tổng giá được backend xác nhận ở bước tiếp theo</span>}</div>
        </div>
      </section>
      <div className="v1-quantity-preview"><PrintPreview src={preview} ratio={layout?.printAspectRatio} layout={layout}/></div>
    </div>
    <ActionBar><span>{layout&&formatLayoutTitle(layout)}</span><KioskPrimaryButton disabled={busy||q===undefined} onClick={()=>{if(sent.current||busy||q===undefined)return;sent.current=true;action('session.setQuantity',{quantity:q})}}>Tiếp tục · {verified&&pricing?.totalAmount!=null?<Vnd amount={pricing.totalAmount}/>: 'Xác nhận giá'} →</KioskPrimaryButton></ActionBar>
  </>;
}
