import {useEffect,useRef,useState} from 'react';
import {formatLayoutTitle} from './LayoutArtwork';
import {Heading,Vnd,type ScreenProps} from './KioskUI';
import './payment.css';

export function PaymentScreen({layout,pricing,busy,action,snapshot,simulator}:ScreenProps){
  const [staffPanelVisible,setStaffPanelVisible]=useState(false);
  const hold=useRef<ReturnType<typeof setTimeout>|null>(null);
  const origin=useRef<{x:number;y:number}|null>(null);
  const requested=useRef<string|null>(null);
  const cashRequested=useRef(false);
  const currentAction=useRef(action);
  const busyRef=useRef(busy);
  currentAction.current=action;
  busyRef.current=busy;
   const real=snapshot?.captureMode!=='DEMO'&&(snapshot?.captureMode==='REAL'||snapshot?.runtimeMode==='REAL'||simulator===false);
  const qr=snapshot?.paymentQr;
  const orderCode=snapshot?.orderCode;
  const unconfigured=snapshot?.payOsStatus==='CONFIG_MISSING'||snapshot?.payOsConfigured===false;
  const configurationError=snapshot?.payOsStatus==='CONFIG_INVALID'||snapshot?.payOsStatus==='SDK_INIT_FAILED';
  const sessionId=snapshot?.sessionId;
  const stopHold=()=>{if(hold.current!==null){clearTimeout(hold.current);hold.current=null}origin.current=null};

  useEffect(()=>()=>{if(hold.current!==null)clearTimeout(hold.current)},[]);
  useEffect(()=>{
    if(!real||!sessionId||unconfigured||configurationError||qr||orderCode!=null||requested.current===sessionId)return;
    requested.current=sessionId;
    currentAction.current('payment.createLink');
  },[real,sessionId,unconfigured,configurationError,qr,orderCode]);
  useEffect(()=>{
    if(!real||!sessionId||unconfigured||configurationError||qr==='ERROR'||(orderCode==null&&!qr))return;
    const interval=setInterval(()=>{if(!busyRef.current)currentAction.current('payment.checkStatus',orderCode!=null?{orderCode}:{})},3000);
    return()=>clearInterval(interval);
  },[real,sessionId,unconfigured,configurationError,qr,orderCode]);

  const qrReady=!!qr&&qr!=='ERROR';
  const qrSrc=qrReady?(qr.startsWith('data:image/')||qr.startsWith('https://')||qr.startsWith('http://')?qr:`data:image/png;base64,${qr}`):'';
  const warning=unconfigured||configurationError||qr==='ERROR'||!!snapshot?.lastPaymentError;
   const status=warning?'Cần nhân viên hỗ trợ':qrReady?'Đang chờ xác nhận':'Đang tạo mã';
  const size=layout?.printSizeLabel?.replace(/\s/g,'').match(/5[x×]15|10[x×]15/i)?.[0]?.replace(/[xX]/,'×');
  const staffVisible=staffPanelVisible||warning;
  return <div className="v1-payment-screen">
      <Heading step="Bước 3" title="Thanh toán" subtitle="Quét mã QR để tiếp tục phiên chụp." className="v1-payment-heading" back={()=>{if(!busy)action('session.back')}} onTitlePointerDown={event=>{if(event.pointerType==='mouse'&&event.button!==0)return;stopHold();origin.current={x:event.clientX,y:event.clientY};hold.current=setTimeout(()=>{setStaffPanelVisible(true);hold.current=null;origin.current=null},700)}} onTitlePointerMove={event=>{if(origin.current&&Math.hypot(event.clientX-origin.current.x,event.clientY-origin.current.y)>12)stopHold()}} onTitlePointerUp={stopHold} onTitlePointerCancel={stopHold} onTitlePointerLeave={stopHold} onTitleDoubleClick={()=>{stopHold();setStaffPanelVisible(true)}}/>
    <div className="v1-payment-columns">
      <section className="v1-payment-summary v1-panel" aria-label="Chi tiết thanh toán">
         <p className="v1-payment-label">Số tiền thanh toán</p>
         <strong className="v1-payment-price">{pricing?.totalAmount!=null?<Vnd amount={pricing.totalAmount}/>: '—'}</strong>
        <dl className="v1-payment-details">
          <div><dt>Bố cục</dt><dd>{layout?formatLayoutTitle(layout):'—'}</dd></div>
          <div><dt>Khổ in</dt><dd>{size?`${size.startsWith('5')?'Dải':'Khổ'} ${size} cm`:'—'}</dd></div>
           <div><dt>Số lượng</dt><dd>{pricing?.quantity!=null?`${pricing.quantity} bản in`:'—'}</dd></div>
           {pricing?.basePrice!=null&&<div><dt>Giá cơ bản</dt><dd><Vnd amount={pricing.basePrice}/></dd></div>}
           {!!pricing?.extraQuantity&&<div><dt>In thêm {pricing.extraQuantity} bản</dt><dd><Vnd amount={pricing.extraAmount}/></dd></div>}
        </dl>
         <div className="v1-payment-status"><span>Trạng thái</span><span className="v1-payment-chip v1-payment-chip-amber" role="status"><span aria-hidden="true" className="v1-payment-dot"/>{warning?'Cần nhân viên hỗ trợ':'Chờ thanh toán QR'}</span></div>
      </section>
      <section className="v1-payment-qr-panel v1-panel" aria-label="Mã thanh toán">
         {warning?<><span className="v1-payment-warning" aria-hidden="true">!</span><h2>Thanh toán tiền mặt tại quầy</h2><p>Vui lòng gửi tiền mặt cho nhân viên để kích hoạt phiên chụp.</p></>
          :!qrReady?<><span className="v1-payment-spinner" aria-hidden="true"/><p role="status">Đang tạo mã thanh toán...</p></>
           :<><div className="v1-payment-qr-card"><img src={qrSrc} alt="Mã VietQR"/></div><h2>Quét mã bằng ứng dụng ngân hàng</h2><p>Hệ thống sẽ tự động chuyển sang bước chụp ngay khi nhận được thanh toán.</p><span className="v1-payment-poll" role="status"><span className="v1-payment-dot" aria-hidden="true"/>{status}</span></>}
      </section>
    </div>
      {staffVisible&&<div className="v1-payment-staff"><button type="button" className="v1-staff-cash-btn" data-testid="staff-cash-btn" disabled={busy||cashRequested.current} onClick={()=>{if(cashRequested.current||busy)return;cashRequested.current=true;action('payment.mockComplete',{staffOverride:true})}}><span className="v1-payment-dot" aria-hidden="true"/>Nhân viên xác nhận tiền mặt</button></div>}
  </div>;
}
