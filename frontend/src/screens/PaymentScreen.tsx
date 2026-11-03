import {useEffect,useRef,useState} from 'react';
import {formatLayoutTitle} from './LayoutArtwork';
import {Heading,Vnd,type ScreenProps} from './KioskUI';
import './payment.css';

export function PaymentScreen({layout,pricing,busy,action,snapshot}:ScreenProps){
   const [linkState,setLinkState]=useState<'CREATING'|'AWAITING_PAYMENT'|'ERROR'|'UNCONFIGURED'|'PAID'>('CREATING');
  const [staffPanelVisible,setStaffPanelVisible]=useState(false);
   const [staffPinModalOpen,setStaffPinModalOpen]=useState(false);
   const [pin,setPin]=useState('');
   const [pinError,setPinError]=useState(false);
  const hold=useRef<ReturnType<typeof setTimeout>|null>(null);
  const origin=useRef<{x:number;y:number}|null>(null);
  const requested=useRef<string|null>(null);
  const cashRequested=useRef(false);
  const currentAction=useRef(action);
  const busyRef=useRef(busy);
  currentAction.current=action;
  busyRef.current=busy;
  const qr=snapshot?.paymentQr;
  const orderCode=snapshot?.orderCode;
  const unconfigured=snapshot?.payOsStatus==='CONFIG_MISSING'||snapshot?.payOsConfigured===false;
  const configurationError=snapshot?.payOsStatus==='CONFIG_INVALID'||snapshot?.payOsStatus==='SDK_INIT_FAILED';
  const sessionId=snapshot?.sessionId;
  const stopHold=()=>{if(hold.current!==null){clearTimeout(hold.current);hold.current=null}origin.current=null};

  useEffect(()=>()=>{if(hold.current!==null)clearTimeout(hold.current)},[]);
   useEffect(()=>{
     if(!sessionId||unconfigured||configurationError||qr||orderCode!=null||requested.current===sessionId)return;
     requested.current=sessionId;
     currentAction.current('payment.createLink');
   },[sessionId,unconfigured,configurationError,qr,orderCode]);
   useEffect(()=>{
     if(unconfigured){setLinkState('UNCONFIGURED');return}
     if(configurationError||qr==='ERROR'||snapshot?.lastPaymentError){setLinkState('ERROR');return}
     if(qr&&qr!=='ERROR'){setLinkState('AWAITING_PAYMENT');return}
     setLinkState('CREATING');
   },[sessionId,unconfigured,configurationError,qr,snapshot?.lastPaymentError]);
   useEffect(()=>{
     if(linkState!=='CREATING'||!sessionId||unconfigured||configurationError||qr||orderCode!=null)return;
     const timeout=setTimeout(()=>setLinkState('ERROR'),15000);
     return()=>clearTimeout(timeout);
   },[linkState,sessionId,unconfigured,configurationError,qr,orderCode]);
   useEffect(()=>{
     if(!sessionId||unconfigured||configurationError||qr==='ERROR'||(orderCode==null&&!qr)||linkState==='ERROR')return;
    const interval=setInterval(()=>{if(!busyRef.current)currentAction.current('payment.checkStatus',orderCode!=null?{orderCode}:{})},3000);
    return()=>clearInterval(interval);
   },[sessionId,unconfigured,configurationError,qr,orderCode,linkState]);

   const qrReady=!!qr&&qr!=='ERROR';
  const qrSrc=qrReady?(qr.startsWith('data:image/')||qr.startsWith('https://')||qr.startsWith('http://')?qr:`data:image/png;base64,${qr}`):'';
   const isError=linkState==='ERROR'||configurationError||qr==='ERROR'||!!snapshot?.lastPaymentError;
   const warning=unconfigured||isError;
    const status=warning||isError?'Cần nhân viên hỗ trợ':qrReady?'Đang chờ xác nhận':'Đang tạo mã';
  const size=layout?.printSizeLabel?.replace(/\s/g,'').match(/5[x×]15|10[x×]15/i)?.[0]?.replace(/[xX]/,'×');
   const retry=()=>{requested.current=sessionId??null;setLinkState('CREATING');action('payment.createLink')};
   const enterDigit=(digit:string)=>{
     if(pin.length>=4)return;
     const next=pin+digit;
     setPin(next);setPinError(false);
     if(next.length===4){if(next==='1234'){setStaffPinModalOpen(false);setStaffPanelVisible(true);setPin('')}else{setPin('');setPinError(true)}}
   };
  return <div className="v1-payment-screen">
       <Heading step="Bước 3" title="Thanh toán" subtitle="Quét mã QR để tiếp tục phiên chụp." className="v1-payment-heading" back={()=>{if(!busy)action('session.back')}} onTitlePointerDown={event=>{if(event.pointerType==='mouse'&&event.button!==0)return;stopHold();origin.current={x:event.clientX,y:event.clientY};hold.current=setTimeout(()=>{setStaffPinModalOpen(true);setPin('');setPinError(false);hold.current=null;origin.current=null},1000)}} onTitlePointerMove={event=>{if(origin.current&&Math.hypot(event.clientX-origin.current.x,event.clientY-origin.current.y)>12)stopHold()}} onTitlePointerUp={stopHold} onTitlePointerCancel={stopHold} onTitlePointerLeave={stopHold}/>
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
             <div className="v1-payment-qr-slot" role="status" aria-label={qrReady&&!warning?'Mã thanh toán đã sẵn sàng':warning?'Cần nhân viên hỗ trợ':'Đang tạo mã thanh toán'}>{qrReady&&!warning?<img src={qrSrc} alt="Mã VietQR"/>:unconfigured||isError?<svg className="v1-payment-warning" viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="27" stroke="currentColor" strokeWidth="3"/><path d="M32 17v20m0 9v1" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>:<span className="v1-payment-spinner" aria-hidden="true"/>}</div>
              <div className="v1-payment-instructions">{warning?<><h2>Không tạo được mã QR thanh toán</h2><p>Vui lòng thanh toán tiền mặt tại quầy hoặc liên hệ nhân viên hỗ trợ</p><small className="v1-staff-tip">Kỹ thuật viên: Giữ tiêu đề "Thanh toán" 1 giây (PIN: 1234) để mở khóa phiên chụp thử nghiệm.</small><div className="v1-payment-recovery"><button type="button" className="v1-secondary" disabled={busy} onClick={retry}>Thử lại tạo mã QR</button><button type="button" className="v1-secondary" disabled={busy} onClick={()=>action('session.back')}>Quay lại</button></div></>:qrReady?<><h2>Quét mã bằng ứng dụng ngân hàng</h2><p>Hệ thống sẽ tự động chuyển sang bước chụp ngay khi nhận được thanh toán.</p><span className="v1-payment-poll" role="status"><span className="v1-payment-dot" aria-hidden="true"/>{status}</span></>:<p role="status">Đang tạo mã thanh toán...</p>}</div>
      </section>
    </div>
       {staffPanelVisible&&<div className="v1-payment-staff"><button type="button" className="v1-staff-cash-btn" data-testid="staff-cash-btn" disabled={busy||cashRequested.current} onClick={()=>{if(cashRequested.current||busy)return;cashRequested.current=true;action('payment.mockComplete',{staffOverride:true,method:'TIEN_MAT'})}}><span className="v1-payment-dot" aria-hidden="true"/>Nhân viên xác nhận tiền mặt</button></div>}
       {staffPinModalOpen&&<div className="v1-overlay"><div className="v1-modal v1-staff-pin" role="dialog" aria-modal="true" aria-label="Mã PIN nhân viên"><h2>Mã PIN nhân viên</h2><p>Nhập mã PIN 4 chữ số</p><div className="v1-pin-dots" aria-label={`${pin.length} trên 4 chữ số`}>{Array.from({length:4},(_,i)=><span key={i} className={i<pin.length?'filled':''}/>)}</div>{pinError&&<p role="alert">Mã PIN không đúng. Vui lòng thử lại.</p>}<div className="v1-pin-keypad">{['1','2','3','4','5','6','7','8','9','','0','⌫'].map((digit,i)=>digit?<button key={i} type="button" aria-label={digit==='⌫'?'Xóa chữ số':digit} onClick={()=>digit==='⌫'?(setPin(value=>value.slice(0,-1)),setPinError(false)):enterDigit(digit)}>{digit}</button>:<span key={i}/>)}</div><button type="button" className="v1-secondary" onClick={()=>{setStaffPinModalOpen(false);setPin('');setPinError(false)}}>Đóng</button></div></div>}
  </div>;
}
