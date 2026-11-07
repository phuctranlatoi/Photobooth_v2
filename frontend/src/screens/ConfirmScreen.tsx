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
       <div className="v1-split v1-confirm-workspace">
        <PrintPreview src={composed} ratio={layout?.printAspectRatio} layout={layout} label="Bản ghép hoàn thiện"/>
        <section className="v1-panel v1-summary">
          <h2>Đơn hàng của bạn</h2>
           <p><span>Bố cục</span><strong>{layout?formatLayoutTitle(layout):'Bố cục'}</strong></p>
           <p><span>Khổ in</span><strong>{layout?.printSizeLabel??'—'}</strong></p>
           <p><span>Số lượng</span><strong>{pricing?.quantity??'—'}</strong></p>
            <p><span>Giá gốc</span><strong>{pricing?.basePrice!=null?<Vnd amount={pricing.basePrice}/>: '—'}</strong></p>
            <p><span>In thêm</span><strong>{pricing?.extraAmount!=null?<Vnd amount={pricing.extraAmount}/>: '—'}</strong></p>
           <hr/>
           <h2 className="v1-summary-total"><span>Tổng cộng</span><strong>{pricing?.totalAmount!=null?<Vnd amount={pricing.totalAmount}/>: '—'}</strong></h2>
          <small>{real?'Xác nhận để gửi bản in đến máy in':'Chế độ mô phỏng · Không gửi lệnh in thật'}</small>
        </section>
      </div>
      <ActionBar>
        <span>Xác nhận một lần, không gửi lại nếu mạng gián đoạn</span>
        <KioskPrimaryButton
           disabled={busy||!composed}
           onClick={()=>{if(sent.current||busy||!composed)return;sent.current=true;void action(real?'print.confirmReal':'print.confirmDryRun')}}
        >
          {real ? 'Xác nhận & in →' : 'Xác nhận bản mô phỏng →'}
        </KioskPrimaryButton>
      </ActionBar>
    </div>
  );
}
