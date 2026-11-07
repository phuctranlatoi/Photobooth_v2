import {Heading,type ScreenProps} from './KioskUI';

const stages = ['Ghép ảnh', 'In ảnh', 'Album & QR', 'Hoàn tất'];

export function PrintingScreen({snapshot}:Partial<ScreenProps>){
 const demo = snapshot?.captureMode === 'DEMO' || snapshot?.runtimeMode === 'SIMULATOR';
 const failure = snapshot?.failure;
 return <div className="v1-printing-screen">
  <Heading title="In và tạo QR" subtitle="Vui lòng chờ trong giây lát"/>
  <section className="v1-print-stage v1-pipeline" aria-label="Tiến độ tạo ảnh" aria-busy={!failure}>
   <div className="v1-print-stage__intro">
    <span className="v1-print-stage__eyebrow">LE SOUVENIR · ATELIER</span>
    <h2>{failure ? 'Cần nhân viên hỗ trợ' : 'Đang xử lý khoảnh khắc của bạn'}</h2>
    <p role={failure ? 'alert' : 'status'}>{failure ?? snapshot?.printStatus ?? (demo ? 'Đang tạo bản thử · Không in giấy thật' : 'Đang chờ xác nhận tiến độ từ hệ thống in')}</p>
   </div>
   <ol className="v1-print-stage__steps" aria-label="Các bước xử lý">
    {stages.map((label,index)=><li key={label} className="v1-print-stage__step">
     <span className="v1-print-stage__number">{String(index+1).padStart(2,'0')}</span>
     <strong>{label}</strong>
    </li>)}
   </ol>
   {!failure && <div className="v1-print-stage__pending" role="status"><span className="v1-print-stage__pulse" aria-hidden="true"/>Đang xử lý · Chưa có xác nhận từng bước</div>}
  </section>
 </div>;
}
