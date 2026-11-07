# BÁO CÁO AUDIT TOÀN DIỆN V1 -> V2: QUY TRÌNH CAMERA, IN DNP VÀ ĐĂNG WEB

> **Mục tiêu audit:** Điều tra chi tiết tại sao V2 hiện tại bị rơi vào chế độ "thử nghiệm/mô phỏng" (DEMO/SIMULATOR), không chụp bằng Canon thật, không in ra máy in DNP thật và không tải ảnh lên Web/Cloudinary thật; đối chiếu toàn diện mã nguồn V1 (`PhotoboothDesktop`) và V2 (`PhotoboothDesktop_v2`); lập danh mục chính xác các class/service của V1 cần đưa nguyên bản sang V2.
>
> **Quy tắc tuyệt đối:** V1 strictly READ-ONLY. Không chỉnh sửa V1. Toàn bộ tài liệu ghi tại V2.

---

## 1. NGUYÊN NHÂN GỐC RỄ: TẠI SAO NGƯỜI DÙNG THẤY V2 CHỈ ĐANG "MÔ PHỎNG / THỬ NGHIỆM"?

Khi người dùng chạy `run-app.bat`, mặc dù file bat đã thiết lập `set "V2_RUNTIME_MODE=real"`, toàn bộ ứng dụng vẫn chạy ở chế độ **Mô phỏng (DEMO / SIMULATOR)** vì **4 điểm nghẽn nghiêm trọng (catch-22 & mock abstractions)** trong backend V2:

### Điểm nghẽn 1: Vòng lặp Catch-22 khiến `captureMode` luôn bị ép về `"DEMO"`
1. Trong Frontend `KioskSimulator.tsx:80`, khi người dùng bấm Start, frontend gửi lệnh `session.start` với `{ layoutId }` mà **không truyền `captureMode`**.
2. Trong `RealSessionEngine.kt:356`:
   ```kotlin
   captureMode = p["captureMode"]?.asString ?: cameraManager.resolveCaptureMode()
   ```
3. Trong `CameraConnectionManager.kt:61`:
   ```kotlin
   fun resolveCaptureMode(): String = if (isHardwareConnected()) "REAL" else "DEMO"
   ```
4. Khi `RealSessionEngine` khởi tạo (`RealSessionEngine.kt:669-676`), `camera` được tạo qua `CameraManager`, nhưng biến `device` bên trong `CameraManager` ban đầu là `null` (chưa gọi `setMode`). Do đó `isHardwareConnected()` **luôn trả về `false`** tại thời điểm boot!
5. Vì `isHardwareConnected()` trả về `false`, `cameraManager.resolveCaptureMode()` **luôn trả về `"DEMO"`**!
6. Chế độ chụp thật chỉ được kích hoạt nếu gọi `hardwareCamera()`, nhưng `hardwareCamera()` chỉ được gọi khi `captureMode == "REAL"`.
7. **Hậu quả:** 100% phiên chụp bắt đầu từ giao diện đều bị ép thành `"DEMO"`, chụp ảnh giả lập từ `DemoCameraAdapter` thay vì máy ảnh thật!

### Điểm nghẽn 2: Đường dẫn DLL của Canon EDSDK bị gãy trong V2
1. Trong `src-tauri/src/bridge.rs:25-26`, Tauri spawn tiến trình Java tại thư mục làm việc của launcher: `backend/build/install/backend/bin`.
2. Trong `CanonCameraAdapter.kt:151`:
   ```kotlin
   val base = Path.of(System.getProperty("user.dir"), "EDSDK_64");
   System.setProperty("jna.library.path", base.toAbsolutePath().toString() + ";" + System.getProperty("jna.library.path", ""));
   ```
3. `System.getProperty("user.dir")` lúc này trỏ đến `backend/build/install/backend/bin`. Thư mục này **hoàn toàn không có thư mục `EDSDK_64`** (thư mục này nằm ở `PhotoboothDesktop_v2/backend/EDSDK_64`).
4. Lệnh load `EDSDK.dll` qua JNA luôn ném ngoại lệ `UnsatisfiedLinkError` và bị catch âm thầm (`catch (_: Throwable) { connected = false; false }`), khiến Canon DSLR không thể kết nối.

### Điểm nghẽn 3: Máy in bị chặn bởi UI Mock và điều kiện xác thực kích thước thừa
1. Trong `frontend/src/screens/ConfirmScreen.tsx:7 & 32`:
   ```typescript
   const real = snapshot?.captureMode !== 'DEMO' && ...
   ```
   Vì `captureMode` bị ép thành `"DEMO"`, biến `real` thành `false`.
   Màn hình hiện rõ: **"Chế độ mô phỏng · Không gửi lệnh in thật"** và nút bấm là **"Xác nhận bản mô phỏng →"**.
2. Khi người dùng bấm nút, nó gửi lệnh `print.confirmDryRun`. Trong `RealSessionEngine.kt:613-621`, hệ thống trả về:
   - `printStatus: "Đã tạo bản in thử nghiệm & phát tín hiệu in (Chế độ mô phỏng)"`
   - `targetPrinter: "Mô phỏng máy in DNP DS-RX1HS"`
   - Hoàn toàn không gọi Windows Print Spooler!
3. Thậm chí nếu ép vào nhánh in thật:
   - Trong `backend/src/main/kotlin/com/lesouvenir/v2/printing/legacy/PrinterManager.kt:41`:
     ```kotlin
     if (image.width != request.layout.width || image.height != request.layout.height)
         return ManagedPrintOutcome(PrintResult.Rejected("Expected ${request.layout.width}x${request.layout.height} image; got ${image.width}x${image.height}"), false)
     ```
     `PHOTO_10X15` bị hardcode là `1829 x 1226` (khổ ngang), nhưng bố cục 10x15 dạng đứng lại render ra `1226 x 1829`, dẫn đến việc `PrinterManager` từ chối in với lỗi kích thước!
   - Trong `LegacyPrinter.kt:55`, `AwtPrintFacade` dùng so khớp tên máy in tuyệt đối `equals` (`if (matches.size != 1) return Rejected`), trong khi V1 dùng so khớp mềm `.contains(printerName, ignoreCase = true)`.

### Điểm nghẽn 4: Toàn bộ quy trình Upload Web / Cloudinary bị "cắt đứt"
1. Trong `RealSessionEngine.kt`, biến `cloudinary: CloudinaryClient?` được truyền vào constructor, nhưng **trong suốt toàn bộ class không có bất kỳ dòng code nào gọi `cloudinary.uploadAsset(...)`!**
2. V2 hoàn toàn thiếu class `DesktopAlbumUploader` - nơi trong V1 phụ trách gom ảnh chụp, nén JPEG, upload song song lên Cloudinary, và gọi API Web Album tuần tự.
3. Class `SafeTransport.kt:27-29` trong V2 được viết với chế độ mặc định `IntegrationMode.DENY`, tự động ném ngoại lệ `Failure.DENIED` cho bất kỳ request nào ra ngoài localhost!
4. Cuộc gọi `syncPendingSales` lên Neon PostgreSQL trong V2 bị comment lại với lý do "chờ cấu hình".

---

## 2. ĐỐI CHIẾU CHI TIẾT 4 TRỤ CỘT GIỮA V1 VÀ V2

### Trụ cột A: Chụp ảnh & Live View (Camera Capture & EVF)

| Tiêu chí | V1 (`PhotoboothDesktop`) | V2 (`PhotoboothDesktop_v2`) | Đánh giá & Khoảng cách |
| :--- | :--- | :--- | :--- |
| **Class chính** | `NativeEosCaptureService.kt` | `CanonCameraAdapter.kt` bọc trong `CameraManager.kt` & `CameraConnectionManager.kt` | V2 tạo quá nhiều lớp trừu tượng lồng nhau khiến mất trạng thái kết nối trực tiếp. |
| **Thư viện EDSDK** | `com.bitplan:edsdk4j:0.0.1` + `net.java.dev.jna:4.5.2` | Tương tự (qua reflection trong `CanonCameraAdapter`) | V1 gọi trực tiếp type-safe; V2 dùng reflection `Class.forName` gây khó debug. |
| **Vị trí DLL EDSDK** | `PhotoboothDesktop/EDSDK_64/EDSDK.dll` | `backend/EDSDK_64/EDSDK.dll` | V2 cấu hình sai `jna.library.path` khi chạy từ `bin/backend.bat`. |
| **Khởi động session** | `CanonCamera().openSession()` ngay khi app boot, có coroutine auto-reconnect mỗi 2s (`NativeEosCaptureService.kt:51-81`) | Khởi tạo trễ (lazy), không kết nối sẵn lúc boot, dẫn đến `isHardwareConnected() == false`. | V1 luôn sẵn sàng; V2 bị rớt về Demo trước khi camera kịp kết nối. |
| **Lấy nét & Live View** | `camera.beginLiveView()`, bật Face Tracking AF (`kEdsPropID_Evf_AFMode = 2L`), vòng lặp 30 FPS (`downloadLiveView()`). | Thread riêng tải ảnh 30 FPS, không có lệnh Face Tracking AF. | Cần lấy nguyên code Live View của V1 sang. |
| **Lệnh chụp thật** | `camera.execute(SafeShootCommand(EdsSaveTo.kEdsSaveTo_Host, 3)).get()` | Dùng reflection gọi `SafeShootCommand(EdsSaveTo.kEdsSaveTo_Host, 3)` | Cơ chế giống nhau nhưng V1 xử lý khôi phục Live View sau khi chụp tốt hơn nhiều. |
| **Xử lý ảnh chụp** | `imageProcessor.saveBoothCapture(...)`: crop tỉ lệ `photoAspectRatio`, lật ngang (mirror) để ảnh chụp giống hệt gương Live View, áp LUT filter. | Tự mirror thủ công trong adapter, crop tỉ lệ, nhưng thiếu pipeline áp dụng LUT hoàn chỉnh như V1. | Cần mang `saveBoothCapture` của V1 sang. |
| **Dự phòng Webcam/HotFolder** | Có sẵn `WebcamStillCaptureService` (tự động nhận diện DroidCam) và `HotFolderCaptureService`. | Có `WebcamCameraAdapter` và `HotFolderCameraAdapter` nhưng bị bọc trong enum. | V1 chọn chế độ linh hoạt từ cấu hình `.env` (`USE_NATIVE_SDK`, `USE_HOT_FOLDER`). |

---

### Trụ cột B: In ấn ra máy in DNP DS-RX1HS (Print Spooler & 5x15 Cut)

| Tiêu chí | V1 (`PhotoboothDesktop`) | V2 (`PhotoboothDesktop_v2`) | Đánh giá & Khoảng cách |
| :--- | :--- | :--- | :--- |
| **Service in** | `SystemPrinterService.kt` (`DesktopIoServices.kt:36-92`) | `PrinterManager.kt` + `LegacyPrinter.kt` + `AwtPrintFacade` | V1 cực kỳ ngắn gọn (55 dòng), ổn định tuyệt đối; V2 tạo ra 4 class và kiểm tra quá gắt gao. |
| **Giao tiếp Spooler** | Java AWT `PrinterJob` tiêu chuẩn, gọi thẳng Windows Print Spooler. | Java AWT `PrinterJob` nhưng bị bọc bởi `PrintAuthorization` và `PrinterDiscovery`. | V1 chạy thực tế tại booth hàng nghìn lượt in không lỗi. |
| **Khổ in 5x15 (2-inch cut)** | In **2-UP** (ghép 2 dải 5x15 cạnh nhau trên 1 tờ 10x15 cm 4x6 inch). Máy in DNP tự cắt đôi thành 2 dải strip. Số tờ gửi spooler: `(requestedCopies / 2).coerceAtLeast(1)`. | Có logic tính `CUT_5X15_2UP` nhưng bị chặn bởi validation kích thước ảnh pixel cứng. | V1 tính toán chuẩn xác số tờ in (`actualSheets = requestedCopies / 2`). |
| **Khổ in 10x15** | In 1 tờ đơn (`actualSheets = requestedCopies`). | Enum `PHOTO_10X15(1829, 1226)` chỉ chấp nhận khổ ngang, reject khổ đứng `1226 x 1829`. | V2 bị lỗi bug kích thước nghiêm trọng. |
| **Xoay ảnh tự động** | Trong `Printable.print()`: nếu chiều ảnh khác chiều giấy (`isImageLandscape != isPaperLandscape`), tự xoay 90 độ (`g2d.rotate(Math.PI / 2)`). | Port lại logic xoay nhưng hiếm khi chạm tới được vì bị từ chối ở tầng ngoài. | V1 xử lý triệt để mọi trường hợp lệch khổ giấy. |
| **Nhận diện máy in DNP** | Tìm linh hoạt: `services.find { it.name.contains(printerName, ignoreCase = true) }`. Nếu không thấy, in ra máy in mặc định. | So khớp chính xác: `filter { it.name.equals(request.printerName, ignoreCase = true) }`. Nếu `matches.size != 1` thì từ chối in. | V2 quá cứng nhắc, chỉ cần tên máy in sai một ký tự khoảng trắng là ngưng in. |
| **Tràn lề (Borderless)** | Xóa lề 1 inch mặc định của Java: `paper.setImageableArea(0.0, 0.0, paper.width, paper.height)`. | Có port logic này vào `AwtPrintFacade`. | Hoàn toàn tương đồng ở tầng AWT, nhưng V2 không cho lệnh in chạy tới đây. |

---

### Trụ cột C: Đăng lên Web (Cloudinary, QR Album, Neon DB)

| Tiêu chí | V1 (`PhotoboothDesktop`) | V2 (`PhotoboothDesktop_v2`) | Đánh giá & Khoảng cách |
| :--- | :--- | :--- | :--- |
| **Quản lý quy trình upload** | `DesktopAlbumUploader.kt` (`services/DesktopAlbumUploader.kt:22-146`) | **HOÀN TOÀN KHÔNG CÓ** | Lỗ hổng lớn nhất của V2: không có orchestrator điều phối upload ảnh. |
| **Tải ảnh lên Cloudinary** | `DesktopCloudinaryClient.kt`: Multipart POST trực tiếp lên `https://api.cloudinary.com/v1_1/<cloud>/image/upload` bằng `java.net.http.HttpClient`. | `CloudinaryClient.kt` nhưng bị ép đi qua `SafeTransport` (vốn ném lỗi `Failure.DENIED`). | V1 upload mượt mà; V2 bị cô lập không gửi được byte nào ra ngoài. |
| **Upload song song** | Toàn bộ ảnh gốc (`ORIGINAL`) và ảnh in hoàn thiện (`FINAL`) được nén JPEG và upload song song qua `coroutineScope` / `async`. | Không có. | Cần đem nguyên vẹn cơ chế upload song song của V1 sang. |
| **Finalize Metadata lên Web Album** | `DesktopWebAlbumClient.kt`: Gọi tuần tự từng ảnh tới `/api/v1/albums/<albumId>/assets` để tránh deadlock/race condition trên Neon DB. | Có `WebAlbumClient.finalizeAsset` nhưng không bao giờ được gọi. | V1 bảo đảm thứ tự và tính toàn vẹn của album web. |
| **Tạo mã QR trước** | `webAlbumClient.createAlbum` được gọi sớm để lấy `albumUrl`. `albumUrl` được đưa vào `DesktopCompositor` để **vẽ trực tiếp mã QR lên bản in** trước khi in ra giấy! | `prefetchAlbum()` trong V2 có cố gắng gọi nhưng bị `SafeTransport` chặn, trả về `null`. Mã QR không in được. | V1 bảo đảm khách nhận ảnh in là có ngay mã QR quét được album web. |
| **Lưu doanh thu Neon PostgreSQL** | `NeonDirectRevenueClient.kt`: Kết nối JDBC trực tiếp tới Postgres, tự migrate bảng `revenue_transactions`, lưu giao dịch khi in thành công. | Có `NeonDirectRevenueClient.kt` tương đương nhưng không được kích hoạt trong luồng Confirm & Print. | V1 ghi nhận doanh thu an toàn, chống trùng lặp qua `external_session_id`. |
| **Cổng thanh toán PayOS** | `PaymentService.kt`: Tích hợp chính thức `vn.payos:payos-java:2.0.1`. Tạo link thanh toán VietQR và poll trạng thái `PAID`. | Có `PayOsOfficialAdapter.kt` và `PayOsClient.kt`. | Cần nối trực tiếp PayOS chính thức như V1. |

---

### Trụ cột D: Ghép khung (Compositor) & Xử lý Beauty (YuNet/BiSeNet)

| Tiêu chí | V1 (`PhotoboothDesktop`) | V2 (`PhotoboothDesktop_v2`) | Đánh giá & Khoảng cách |
| :--- | :--- | :--- | :--- |
| **Engine ghép ảnh** | `DesktopCompositor.kt` (`renderScale = 2`, độ phân giải 600 DPI siêu nét). | `DesktopCompositor.kt` (`renderScale = 1`, 300 DPI). | V1 in ảnh nét gấp đôi V2 nhờ `renderScale = 2` và bù mép tràn viền (bleedPx). |
| **Vẽ mã QR lên ảnh in** | Có hàm `drawQRCode(...)` vẽ ZXing QR trực tiếp vào góc khung theo cấu hình `qrCodeX`, `qrCodeY`, `qrCodeSize` của Frame. | Có mã nguồn tương tự nhưng không nhận được QR URL từ web album. | Đưa nguyên logic render và đặt vị trí QR của V1 sang. |
| **Khử mép khung tùy chỉnh** | Tự động đọc khung PNG tùy chỉnh (`customImagePath`) đè lên các slot ảnh đã center-crop. | Đã copy logic này vào V2. | Cần bảo đảm tương thích tuyệt đối. |
| **Trí tuệ nhân tạo Beauty** | `DesktopBeautyService.kt`: YuNet phát hiện mặt -> CustomerFaceSelector lọc mặt khách ở tiền cảnh -> BiSeNet phân đoạn khuôn mặt -> Guided Filter làm mịn da, sáng da, trắng răng. | Đã copy toàn bộ file code `imaging/beauty` và `imaging/facemask`. | Thuật toán đã có sẵn trong V2 nhưng cần đường dẫn mô hình ONNX tuyệt đối chính xác. |
| **Khả năng chịu lỗi (Fallback)** | Nếu Beauty timeout (>15s) hoặc lỗi phân đoạn, V1 tự động lấy ảnh gốc mà không làm crash hay dừng phiên chụp. | `queueBeauty` trong `RealSessionEngine.kt` có fallback về ảnh gốc. | Cần giữ nguyên cơ chế fallback này. |

---

## 3. DANH MỤC CÁC FILE NGUỒN V1 CẦN CHUYỂN NGUYÊN BẢN SANG V2

Để chấm dứt hoàn toàn tình trạng thử nghiệm và bảo đảm V2 chạy ổn định 100% như V1, toàn bộ các file sau đây cần được port nguyên vẹn vào `backend/src/main/kotlin/com/lesouvenir/v2/`:

### Nhóm 1: Camera & Xử lý ảnh chụp
1. `src/main/kotlin/com/phuctran/photobooth/desktop/services/NativeEosCaptureService.kt`
   -> Port thành `backend/.../camera/NativeEosCaptureService.kt`
   - Loại bỏ reflection rườm rà, gọi trực tiếp `edsdk4j` như V1.
   - Giữ nguyên vòng lặp Auto-reconnect và Face Tracking AF.
   - Sửa đường dẫn nạp DLL: Trỏ trực tiếp vào thư mục gốc `workspace.resolve("backend/EDSDK_64")`.
2. `src/main/kotlin/com/phuctran/photobooth/desktop/imaging/DesktopImageProcessor.kt`
   -> Port thành `backend/.../imaging/DesktopImageProcessor.kt`
   - Giữ nguyên hàm `saveBoothCapture` với logic lật ngang (horizontal mirror) và áp LUT 3D.
3. `src/main/kotlin/com/phuctran/photobooth/desktop/services/WebcamStillCaptureService.kt`
   -> Port thành `backend/.../camera/WebcamStillCaptureService.kt` (dự phòng khi không cắm Canon).

### Nhóm 2: In ấn Windows & DNP DS-RX1HS
1. `src/main/kotlin/com/phuctran/photobooth/desktop/services/DesktopIoServices.kt` (class `SystemPrinterService`)
   -> Port thành `backend/.../printing/SystemPrinterService.kt`
   - Sử dụng trực tiếp Java `PrinterJob` tiêu chuẩn.
   - Loại bỏ toàn bộ các điều kiện cấm đoán trong `PrinterManager.kt` và `PrintAuthorization`.
   - Tìm máy in linh hoạt theo `.contains(printerName, ignoreCase = true)` hoặc máy in mặc định.
   - Loại bỏ lề 1 inch borderless và tự động xoay 90 độ khi lệch chiều.
2. Logic tính số bản in và kích thước:
   - Với bố cục 5x15: Ghép 2-up trên 1 sheet 10x15, số bản gửi lệnh in = `(requestedCopies / 2).coerceAtLeast(1)`.
   - Với bố cục 10x15: Số bản = `requestedCopies`.

### Nhóm 3: Đăng ảnh Web, Cloudinary & Doanh thu
1. `src/main/kotlin/com/phuctran/photobooth/desktop/services/DesktopAlbumUploader.kt`
   -> Port thành `backend/.../integrations/DesktopAlbumUploader.kt`
   - Điều phối upload: Nén JPEG song song -> Upload Cloudinary song song -> Finalize từng ảnh tuần tự -> Tạo video và upload.
2. `src/main/kotlin/com/phuctran/photobooth/desktop/remote/DesktopCloudinaryClient.kt`
   -> Port thành `backend/.../integrations/DesktopCloudinaryClient.kt`
   - Sử dụng trực tiếp `java.net.http.HttpClient` chuẩn, loại bỏ hoàn toàn `SafeTransport` (vốn chặn đứng kết nối mạng).
3. `src/main/kotlin/com/phuctran/photobooth/desktop/remote/DesktopWebAlbumClient.kt`
   -> Port thành `backend/.../integrations/DesktopWebAlbumClient.kt`
   - Gọi thẳng endpoint Web Album (`https://web-photobooth-pink.vercel.app/api/v1/albums`).
4. `src/main/kotlin/com/phuctran/photobooth/desktop/remote/NeonDirectRevenueClient.kt`
   -> Kích hoạt trực tiếp ghi nhận doanh thu vào PostgreSQL sau khi lệnh in gửi thành công.

### Nhóm 4: Ghép khung in chuẩn 600 DPI
1. `src/main/kotlin/com/phuctran/photobooth/desktop/imaging/DesktopCompositor.kt`
   -> Cập nhật `backend/.../imaging/DesktopCompositor.kt`
   - Đặt lại `renderScale = 2` để bản in đạt độ nét 600 DPI như V1.
   - Nhúng mã QR trực tiếp vào bản in từ `albumUrl`.

---

## 4. KẾ HOẠCH HÀNH ĐỘNG DỨT ĐIỂM (MIGRATION ROADMAP)

Để đáp ứng chính xác yêu cầu của người dùng ("lấy của v1 qua đi k có thử nghiệm nữa"):

1. **Bước 1 - Dọn dẹp Mock & Trừu tượng thừa trong V2 Backend:**
   - Thay thế toàn bộ cụm `CameraManager` / `CameraConnectionManager` / `DemoCameraAdapter` bằng class `NativeEosCaptureService` (chính là code V1).
   - Thay thế `PrinterManager` / `LegacyPrinter` bằng `SystemPrinterService` (chính là code V1).
   - Thay thế `SafeTransport` bằng `HttpClient` chuẩn trong `DesktopCloudinaryClient` và `DesktopWebAlbumClient`.
   - Đưa `DesktopAlbumUploader` từ V1 vào V2.

2. **Bước 2 - Sửa lỗi nạp DLL EDSDK và Model ONNX:**
   - Trong khởi tạo `NativeEosCaptureService`, trỏ đường dẫn JNA đến đúng thư mục `EDSDK_64` của project.
   - Trong `ModelPathResolver`, trỏ đúng thư mục `app-resources/models` theo thư mục gốc của project.

3. **Bước 3 - Cập nhật `RealSessionEngine.kt`:**
   - Mặc định `captureMode = "REAL"`, kết nối máy ảnh thật ngay khi app khởi động.
   - Khi vào `SELECTING_PHOTOS`, gọi `albumUploader` chạy ngầm để lấy `albumUrl` và nhúng QR vào `compositor`.
   - Khi khách bấm Confirm & Print, gọi trực tiếp `printerService.printImage(...)`, đồng thời chạy ngầm `albumUploader.uploadSessionPhotos(...)`.
   - Khi máy in chấp nhận lệnh, ghi ngay vào SQLite và đồng bộ lên Neon PostgreSQL.

4. **Bước 4 - Cập nhật Frontend UI (`ConfirmScreen.tsx` & `KioskSimulator.tsx`):**
   - Loại bỏ nhãn "Chế độ mô phỏng", luôn hiển thị nút in thật **"Xác nhận & in →"** và gửi lệnh in thật.
   - Truyền rõ ràng `captureMode: 'REAL'` khi gọi `session.start`.

Bằng cách đưa nguyên bản toàn bộ 4 trụ cột từ V1 sang, V2 sẽ sở hữu giao diện React/Tauri hiện đại, mượt mà nhưng thừa hưởng 100% độ tin cậy và sự ổn định về phần cứng của V1.
