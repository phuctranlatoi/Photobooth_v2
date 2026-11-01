import {useEffect,useRef,useState} from 'react';
import {KioskBackButton,KioskPrimaryButton,Vnd,type ScreenProps} from './KioskUI';
import './payment.css';

export function PaymentScreen({layout,pricing,busy,action,snapshot,simulator}:ScreenProps){
  const [staffPanelVisible,setStaffPanelVisible]=useState(false);
  const hold=useRef<ReturnType<typeof setTimeout>|null>(null);
  const requested=useRef<string|null>(null);
  const cashRequested=useRef(false);
  const demoRequested=useRef(false);
  const currentAction=useRef(action);
  const busyRef=useRef(busy);
  currentAction.current=action;
  busyRef.current=busy;
  const demo=snapshot?.captureMode==='DEMO';
  const real=!demo&&(snapshot?.captureMode==='REAL'||snapshot?.runtimeMode==='REAL'||simulator===false);
  const qr=snapshot?.paymentQr;
  const orderCode=snapshot?.orderCode;
  const configured=snapshot?.payOsConfigured;
  const payOsStatus=snapshot?.payOsStatus;
  const unconfigured=payOsStatus==='CONFIG_MISSING'||configured===false;
  const configurationError=payOsStatus==='CONFIG_INVALID'||payOsStatus==='SDK_INIT_FAILED';
  const sessionId=snapshot?.sessionId;
  const stopHold=()=>{if(hold.current!==null){clearTimeout(hold.current);hold.current=null}};

  useEffect(()=>()=>{if(hold.current!==null)clearTimeout(hold.current)},[]);
  useEffect(()=>{
    if(!real||!sessionId||unconfigured||configurationError||qr||orderCode!=null||requested.current===sessionId)return;
    requested.current=sessionId;
    // The backend owns order creation. A pending response is not a UI error.
    currentAction.current('payment.createLink');
  },[real,sessionId,unconfigured,configurationError,qr,orderCode]);
  useEffect(()=>{
    if(!real||!sessionId||unconfigured||configurationError||qr==='ERROR'||(orderCode==null&&!qr))return;
    const interval=setInterval(()=>{
      if(!busyRef.current)currentAction.current('payment.checkStatus',orderCode!=null?{orderCode}:{});
    },3000);
    return()=>clearInterval(interval);
  },[real,sessionId,unconfigured,configurationError,qr,orderCode]);

  const qrReady=!!qr&&qr!=='ERROR';
  const qrSrc=qrReady?(qr.startsWith('data:image/')||qr.startsWith('https://')||qr.startsWith('http://')?qr:`data:image/png;base64,${qr}`):'';
  const warning=unconfigured||configurationError||qr==='ERROR';
  const status=unconfigured?'Chưa sẵn sàng':configurationError||qr==='ERROR'?'Không thể tạo mã':qrReady?'Sẵn sàng':'Đang tạo mã';
  return <div className="v1-payment-screen">
    <header className="v1-heading v1-payment-heading">
      <KioskBackButton onClick={()=>action('session.back')}/>
       <div><span className="v1-payment-eyebrow">Bước 3</span><h1 onPointerDown={()=>{stopHold();hold.current=setTimeout(()=>{setStaffPanelVisible(true);hold.current=null},700)}} onPointerUp={stopHold} onPointerCancel={stopHold} onPointerLeave={stopHold} onContextMenu={event=>event.preventDefault()}>Thanh toán</h1><p>{demo?'Không cần thanh toán để thử quy trình chụp.':'Quét QR bằng ứng dụng ngân hàng hoặc nhờ nhân viên xác nhận tiền mặt.'}</p></div>
    </header>
    <div className="v1-payment-columns">
      <section className="v1-payment-summary v1-panel" aria-label="Chi tiết thanh toán">
        <p className="v1-payment-label">Số tiền cần thanh toán</p>
         <strong className="v1-payment-price"><Vnd amount={demo?0:pricing?.totalAmount}/></strong>
        <dl className="v1-payment-details"><div><dt>Bố cục</dt><dd>{layout?.title??'—'}</dd></div><div><dt>Màu ảnh</dt><dd>Tự nhiên</dd></div><div><dt>Bản in</dt><dd>{pricing?.quantity!=null?`${pricing.quantity} bản`:'—'}</dd></div></dl>
          <div className="v1-payment-status"><span>{demo?'Trải nghiệm Studio':'Thanh toán QR'}</span><span className={`v1-payment-chip ${warning&&!demo?'v1-payment-chip-amber':'v1-payment-chip-mint'}`} role="status"><span aria-hidden="true" className="v1-payment-dot"/>{demo?'Miễn phí':status}</span></div>
      </section>
      <section className="v1-payment-qr-panel v1-panel" aria-label="Mã thanh toán">
          {demo?<div className="v1-payment-demo" role="status"><span className="v1-payment-demo-icon" aria-hidden="true">✦</span><h2>TRẢI NGHIỆM CHỤP ẢNH MIỄN PHÍ</h2><p>Phiên trải nghiệm quy trình chụp và ghép khung ảnh. Không thu phí và không in ảnh thật.</p><KioskPrimaryButton disabled={busy||demoRequested.current} onClick={()=>{if(demoRequested.current||busy)return;demoRequested.current=true;action('payment.mockComplete',{method:'DEMO'})}}>BẮT ĐẦU CHỤP →</KioskPrimaryButton></div>
          :unconfigured?<><span className="v1-payment-warning" aria-hidden="true">!</span><h2>Chưa cấu hình cổng thanh toán PayOS</h2><p>Nhân viên có thể xác nhận tiền mặt để tiếp tục phiên chụp.</p></>
         :configurationError?<><span className="v1-payment-warning" aria-hidden="true">!</span><h2>Không thể khởi tạo cổng thanh toán PayOS</h2><p>Vui lòng liên hệ nhân viên để kiểm tra cấu hình.</p></>
        :qr==='ERROR'?<><span className="v1-payment-warning" aria-hidden="true">!</span><h2>Không tạo được mã QR</h2><p>Vui lòng kiểm tra mạng hoặc thanh toán bằng tiền mặt.</p></>
        :!qrReady?<><span className="v1-payment-spinner" aria-hidden="true"/><p role="status">Đang tạo mã thanh toán...</p>{!real&&<small>Chế độ mô phỏng · Không có giao dịch thật</small>}</>
        :<><div className="v1-payment-qr-card"><img src={qrSrc} alt="Mã VietQR"/></div><h2>Quét mã bằng ứng dụng ngân hàng</h2><p>Sau khi thanh toán thành công, hệ thống sẽ tự chuyển sang bước chụp.</p></>}
      </section>
    </div>
       {real&&staffPanelVisible&&<div className="v1-payment-staff"><button type="button" disabled={busy||cashRequested.current} onClick={()=>{if(cashRequested.current||busy)return;cashRequested.current=true;action('payment.mockComplete',{staffOverride:true})}}><span className="v1-payment-dot" aria-hidden="true"/>Nhân viên xác nhận tiền mặt</button></div>}
  </div>;
}
