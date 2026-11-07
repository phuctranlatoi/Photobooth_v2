import {Heading,PrintPreview,type ScreenProps} from './KioskUI';
export function PrepareScreen({layout}:ScreenProps){return <div className="v1-prepare-screen">
  <Heading title="Chuẩn bị" subtitle="Khoảnh khắc của bạn sắp bắt đầu"/>
  <div className="v1-prepare-stage">
    <div className="v1-prepare-copy"><div className="v1-prepare-indicator" aria-hidden="true"><span/></div><p className="v1-prepare-kicker">CHUẨN BỊ CHỤP ẢNH</p><h2>Hãy nhìn vào ống kính</h2><p>Đứng gần nhau, tạo dáng thoải mái và mỉm cười nhé!</p><div className="v1-pills">{layout?.title&&<span>{layout.title}</span>}{layout?.shotCount!=null&&<span>{layout.shotCount} lượt chụp</span>}{layout?.countdownSeconds!=null&&<span>Đếm ngược {layout.countdownSeconds}s</span>}</div><p className="v1-prepare-status" role="status">Đang chuẩn bị máy ảnh…</p></div>
    <div className="v1-prepare-preview"><PrintPreview ratio={layout?.printAspectRatio} layout={layout} label="Bố cục bản in đã chọn"/></div>
  </div>
</div>}
