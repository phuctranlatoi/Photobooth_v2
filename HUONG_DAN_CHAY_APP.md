# HƯỚNG DẪN KHỞI CHẠY VÀ SỬ DỤNG PHOTOBOOTH V2
### LE SOUVENIR · Studio Chụp Ảnh Kỷ Niệm

Tài liệu này hướng dẫn chi tiết cách khởi chạy và vận hành ứng dụng photobooth thế hệ mới (V2) trên hệ điều hành Windows.

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

Trước khi chạy, máy tính Windows của trạm Kiosk cần đảm bảo:
1. **Java 21 (Adoptium Temurin)** đã cài đặt tại:
   `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot`
2. **Node.js** (khuyến nghị phiên bản 18 trở lên) và **npm** trong `PATH`.
3. **Thư viện Backend & Desktop** đã được biên dịch sẵn trong thư mục V2:
   - Backend launcher: `backend/build/install/backend/bin/backend.bat`
   - File thực thi desktop: `src-tauri/target/debug/le-souvenir-v2.exe`

> **Lưu ý quan trọng về tính độc lập:**
> Phiên bản V2 hoạt động hoàn toàn độc lập trong thư mục `E:\HK1_2026_2027\PhotoboothDesktop_v2`. Mọi thao tác, cấu hình, file log, ảnh tạm và cơ sở dữ liệu đều tách biệt 100% với phiên bản cũ V1 (`PhotoboothDesktop`), tuyệt đối không gây xung đột hay ảnh hưởng đến V1.

---

## 2. Cách Khởi Chạy Ứng Dụng

Bạn có thể lựa chọn 1 trong 2 phương pháp dưới đây:

### Phương Pháp 1: Khởi Chạy Nhanh 1-Click (Khuyên dùng)

Hệ thống đã chuẩn bị sẵn 2 script 1-click tự động hóa mọi bước (cấu hình biến môi trường Java 21, kiểm tra và chạy ngầm Vite dev server cổng 1420, khởi động app desktop và tự dọn dẹp khi tắt):

#### Cách 1.1: Sử dụng File Batch (`run-app.bat`)
- Nhấp đúp chuột (Double-click) trực tiếp vào file **`run-app.bat`** trong thư mục gốc V2.
- Hoặc mở Command Prompt / PowerShell và gõ:
  ```cmd
  cd E:\HK1_2026_2027\PhotoboothDesktop_v2
  run-app.bat
  ```

#### Cách 1.2: Sử dụng File PowerShell (`run-app.ps1`)
- Mở PowerShell và chạy:
  ```powershell
  cd E:\HK1_2026_2027\PhotoboothDesktop_v2
  .\run-app.ps1
  ```
  *(Nếu Windows báo lỗi chính sách ExecutionPolicy, hãy chạy: `powershell -ExecutionPolicy Bypass -File .\run-app.ps1`)*

**Cơ chế tự động của script 1-click:**
1. Tự thiết lập `V2_JAVA_HOME` và `JAVA_HOME` trỏ tới Eclipse Adoptium JDK 21.
2. Thiết lập biến môi trường `V2_RUNTIME_MODE=real`.
3. Kiểm tra cổng `1420`. Nếu Vite dev server chưa chạy, script sẽ tự khởi chạy ngầm (`npm run dev -- --port 1420 --strictPort`) và chờ cho đến khi máy chủ phản hồi mã HTTP 200.
4. Mở cửa sổ ứng dụng desktop `le-souvenir-v2.exe`.
5. Khi bạn đóng cửa sổ ứng dụng, script sẽ tự động quét và dừng tiến trình Vite/Node chạy ngầm để giải phóng tài nguyên máy tính.

---

### Phương Pháp 2: Khởi Chạy Thủ Công Bằng Terminal (Dành Cho Kỹ Thuật Viên / Lập Trình Viên)

Nếu bạn muốn theo dõi log trực tiếp của cả Frontend và Backend trong quá trình phát triển:

#### Bước 1: Mở Terminal 1 để chạy Vite Dev Server
```cmd
cd E:\HK1_2026_2027\PhotoboothDesktop_v2\frontend
npm run dev -- --port 1420 --strictPort
```
*Đợi cho đến khi terminal báo `Local: http://127.0.0.1:1420/` sẵn sàng.*

#### Bước 2: Mở Terminal 2 để chạy Desktop App
```cmd
set "V2_JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
set "JAVA_HOME=%V2_JAVA_HOME%"
set "V2_RUNTIME_MODE=real"
cd E:\HK1_2026_2027\PhotoboothDesktop_v2
.\src-tauri\target\debug\le-souvenir-v2.exe
```

---

## 3. Hướng Dẫn Trải Nghiệm & Vận Hành Kiosk

Ứng dụng V2 được trang bị bộ điều hướng phần cứng thông minh với 2 chế độ:

### A. Khi KHÔNG Có Máy Ảnh Cắm Vào Máy Tính (Chế Độ Thử Nghiệm)
- Kiosk sẽ tự động phát hiện thiết bị và hiển thị thông báo:
  > **Máy ảnh chưa kết nối** · *Vẫn có thể khám phá studio mà không cần máy ảnh, thanh toán hay máy in thật.*
- Huy hiệu chế độ chuyển thành: **"CHẾ ĐỘ THỬ NGHIỆM · Demo Studio (Không cần máy ảnh)"**.
- **Cách trải nghiệm:**
  1. Nhấn nút lớn màu xanh **"CHẠM ĐỂ BẮT ĐẦU →"**.
  2. **Chọn bố cục ảnh (Layout):** Chọn dải ảnh đôi `5x15 cm` hoặc khung ảnh bưu thiếp `10x15 cm`, sau đó bấm **"Tiếp tục"**.
  3. **Chọn số lượng (Quantity):** Điều chỉnh số lượng bản in (mặc định 2 dải cho 5x15), bấm **"Tiếp tục"**.
  4. **Thanh toán mô phỏng (Demo Payment):** Màn hình hiển thị rõ biển báo *CHẾ ĐỘ CHỤP THỬ NGHIỆM*. Bấm nút **"BẮT ĐẦU CHỤP THỬ NGHIỆM →"** (Hoàn toàn không trừ tiền, không gọi cổng thanh toán ngân hàng).
  5. **Chụp ảnh studio mô phỏng:** Ứng dụng tự động kích hoạt chu trình đếm ngược thời gian thực (3..2..1) và cung cấp các bức ảnh mẫu chất lượng cao để trải nghiệm đầy đủ cảm giác tại photobooth thật.
  6. **Chọn ảnh đẹp nhất (Select Photos):** Chạm vào các bức ảnh ưng ý để điền đủ số lượng theo bố cục, bấm **"Tiếp tục"**.
  7. **Chọn khung ảnh nghệ thuật (Frame):** Chọn khung trang trí theo phong cách kỷ niệm, bấm **"Tiếp tục"**.
  8. **Kiểm tra lần cuối (Confirm & 600 DPI Preview):** Xem ảnh kết xuất chất lượng cao `600 DPI` do engine Kotlin kết hợp ảnh thật và khung viền.
  9. **In ảnh & Nhận QR:** Bấm **"In và tạo QR →"**. Ở chế độ Demo, hệ thống thực hiện in thử nghiệm khô (*Dry-run print* - không hao giấy và mực của máy in DNP) và hiển thị mã QR trên màn hình hoàn tất (*Delivery*).

---

### B. Khi CÓ Máy Ảnh Canon DSLR Kết Nối (Kiosk Trực Tiếp)
- Kiosk nhận diện máy ảnh Canon EOS qua Canon EDSDK 64-bit và hiển thị huy hiệu:
  > **"KIOSK TRỰC TIẾP · Chế độ phần cứng"**
- **Chu trình vận hành:**
  1. Live View truyền hình ảnh trực tiếp từ cảm biến ống kính máy ảnh Canon.
  2. Thanh toán quét mã QR PayOS bằng ứng dụng ngân hàng hoặc nhân viên xác nhận thanh toán tiền mặt.
  3. Chụp ảnh với cơ chế kích hoạt màn trập và lấy nét thật từ máy ảnh Canon.
  4. Lệnh in gửi trực tiếp tới máy in nhiệt chuyên dụng **DNP DS-RX1HS** thông qua Windows Spooler Driver và thực hiện cắt giấy tự động đúng chuẩn kích thước (5x15 cm hoặc 10x15 cm).

---

## 4. Cách Truy Cập Bảng Quản Trị (Admin / Operator Panel)

Dành cho quản lý và nhân viên vận hành kỹ thuật tại cửa hàng:
1. Tại màn hình chờ (**StartScreen**), hãy **chạm hoặc nhấp chuột 5 lần liên tiếp** vào logo chữ **`LE SOUVENIR`** ở góc trên bên trái.
2. Bảng điều khiển quản trị **Admin Panel** sẽ mở ra với các tính năng:
   - **Trạng thái thiết bị:** Kiểm tra kết nối Máy ảnh Canon, Máy in DNP RX1HS, trạng thái khay giấy/mực.
   - **Quản lý khung ảnh (Frames):** Xem danh sách khung, tải lại hoặc cập nhật khung mới.
   - **Quản lý bố cục (Layouts):** Tùy chỉnh giá tiền, số ảnh chụp tối đa, thời gian đếm ngược.
   - **Sổ cái doanh thu (Revenue Ledger):** Kiểm tra các phiên giao dịch thành công.
   - **Công cụ kỹ thuật (Tools):** Kiểm tra kết nối backend, chẩn đoán lỗi.
3. Để quay lại màn hình Kiosk chụp ảnh: Bấm nút **"Đóng / Quay lại Kiosk"** ở góc trên cùng.

---

## 5. Nguyên Tắc An Toàn Tài Chính & Bảo Vệ Thiết Bị

- **Tuyệt đối không tính phí sai:** Trong chế độ **DEMO**, hệ thống khóa hoàn toàn cổng thanh toán và giao dịch tài chính.
- **Không ghi nhận doanh thu ảo:** Cơ sở dữ liệu SQLite bán hàng (`sales.db`) được bảo vệ nghiêm ngặt bằng cơ chế kiểm định độc lập. Mọi phiên DEMO đều được gắn nhãn `capture_mode = 'DEMO'` và không bao giờ được ghi vào cột doanh thu thực tế (`revenue_recorded = 0`).
- **Bảo vệ máy in:** Lệnh in trong chế độ DEMO là lệnh giả lập an toàn, tuyệt đối không gửi dữ liệu tới khay in làm hao phí giấy ảnh và ruy băng mực đắt tiền của máy DNP RX1HS.
- **Bảo toàn di sản V1:** V2 không thực hiện bất kỳ lệnh ghi, xóa, cài đè nào lên không gian làm việc của V1.
