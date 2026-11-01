import {safeImage} from '../shared/connected-simulator';
import {useRef} from 'react';
import {ActionBar,Heading,KioskPrimaryButton,PrintPreview,Vnd,type ScreenProps} from './KioskUI';
import {formatLayoutTitle} from './LayoutArtwork';
export function ConfirmScreen({layout,pricing,busy,action,preview,snapshot,simulator}:ScreenProps){
  const sent=useRef(false);
  const real=snapshot?.captureMode!=='DEMO'&&(snapshot?.captureMode==='REAL'||snapshot?.runtimeMode==='REAL'||simulator===false);
  const composed=safeImage(snapshot?.compositionDataUrl)||safeImage(snapshot?.printImageDataUrl)||safeImage(preview);
  return (
    <div className="v1-confirm-screen">
      <Heading title="Kiểm tra lần cuối" subtitle="Kiểm tra bản ghép trước khi xác nhận" back={()=>action('session.back')}/>
      <div className="v1-split">
        <PrintPreview src={composed} ratio={layout?.printAspectRatio} layout={layout} label="Bản ghép hoàn thiện"/>
        <section className="v1-panel v1-summary">
          <h2>Đơn hàng của bạn</h2>
          <p>Bố cục <strong>{layout?formatLayoutTitle(layout):'Bố cục'}</strong></p>
          <p>Số lượng <strong>{pricing?.quantity??'—'}</strong></p>
          {pricing?.basePrice!=null&&<p>Giá gốc <Vnd amount={pricing.basePrice}/></p>}
          {!!pricing?.extraQuantity&&<p>In thêm <Vnd amount={pricing.extraAmount}/></p>}
          <hr/>
          <h2>Tổng cộng {pricing?.totalAmount!=null?<Vnd amount={pricing.totalAmount}/>: '—'}</h2>
          <small>{real?'Xác nhận để gửi bản in đến máy in':'Chế độ mô phỏng · Không gửi lệnh in thật'}</small>
        </section>
      </div>
      <ActionBar>
        <span>Xác nhận một lần, không gửi lại nếu mạng gián đoạn</span>
        <KioskPrimaryButton
          disabled={busy||!safeImage(composed)}
          onClick={()=>{if(sent.current||busy||!safeImage(composed))return;sent.current=true;action(real?'print.confirmReal':'print.confirmDryRun')}}
        >
          {real ? 'Xác nhận & in →' : 'Xác nhận bản mô phỏng →'}
        </KioskPrimaryButton>
      </ActionBar>
    </div>
  );
}
