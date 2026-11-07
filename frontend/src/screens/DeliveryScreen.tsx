import {useRef} from 'react';
import {Check} from 'lucide-react';
import {safeImage} from '../shared/connected-simulator';
import {ActionBar,Heading,KioskPrimaryButton,type ScreenProps} from './KioskUI';
import {formatLayoutTitle} from './LayoutArtwork';

export function DeliveryScreen({busy,action,snapshot,layout,pricing}:ScreenProps){
 const sent=useRef(false);
 const demo=snapshot?.captureMode==='DEMO'||snapshot?.runtimeMode==='SIMULATOR';
 const qr=demo ? null : safeImage(snapshot?.qrCodeUrl);
 const albumUrl=!demo && snapshot?.albumUrl?.startsWith('https://') ? snapshot.albumUrl : null;
 return <div className="v1-delivery-screen">
  <Heading title="Hoàn tất" subtitle="Cảm ơn bạn đã chụp ảnh cùng LE SOUVENIR"/>
  <section className="v1-center v1-panel v1-delivery" aria-label="Khoảnh khắc của bạn">
   <div className="v1-delivery__details">
    <span className="v1-success"><Check size={30} strokeWidth={2.5} aria-hidden="true"/></span>
    <span className="v1-delivery__eyebrow">MỘT KHOẢNH KHẮC ĐÁNG NHỚ</span>
    <h2>Khoảnh khắc của bạn</h2>
    <div className="v1-pills"><span>{layout?formatLayoutTitle(layout):'Bố cục'}</span>{pricing?.quantity!=null&&<span>{pricing.quantity} bản</span>}</div>
    <div className="v1-print-transmission-card">
     <div className="v1-print-signal-badge"><span className="v1-dot print" aria-hidden="true"/><strong>{demo?'BẢN THỬ · KHÔNG IN GIẤY THẬT':snapshot?.printAccepted?'TÍN HIỆU IN: ĐÃ TRUYỀN THÀNH CÔNG':'TÍN HIỆU IN: ĐANG CHỜ XÁC NHẬN'}</strong></div>
     <p className="v1-print-signal-desc">{snapshot?.printStatus ?? (demo?'Chế độ mô phỏng · Không gửi lệnh tới máy in.':'Lệnh in đã được tiếp nhận; chưa xác nhận ảnh đã in ra giấy.')}</p>
    </div>
   </div>
   <div className="v1-delivery__album">
    {qr?<><img src={qr} alt="Mã QR tải ảnh" className="v1-delivery-qr"/><p>Quét mã QR để tải ảnh của bạn.</p>{albumUrl&&<a href={albumUrl} target="_blank" rel="noopener noreferrer">Mở album ảnh</a>}</>:
     <><div className="v1-qr-placeholder"><span>Không có QR album</span><small>{demo?'Chế độ mô phỏng · Không có mã QR tải ảnh thật':'Album chưa có mã QR. Vui lòng liên hệ nhân viên.'}</small></div></>}
   </div>
  </section>
  <ActionBar><span>Hẹn gặp lại bạn!</span><KioskPrimaryButton disabled={busy||sent.current} onClick={()=>{if(sent.current||busy)return;sent.current=true;action('session.finish');}}>Hoàn thành · Về trang đầu</KioskPrimaryButton></ActionBar>
 </div>;
}
