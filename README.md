# Mô Phỏng 3D — Dự Án KHKT: Cải Tiến Kéo Khoanh Vỏ Cây HM226

Trang web mô phỏng 3D tương tác (chạy trực tiếp trên máy tính và điện thoại) trình diễn tiến trình cải tiến kỹ thuật từ **Mẫu gốc HM226** sang **Phương án A (Con chạy trượt sống lưng)** và **Phương án B (Hàm chữ V con lăn + Cụm dao chữ U tự lựa)**.

## Tính năng nổi bật
- **Chuyển đổi tức thì 3 phiên bản:** `Mẫu gốc HM226` | `Phương án A` | `Phương án B`.
- **Mô phỏng thích nghi đa kích cỡ cành (1 – 8 cm):** Kéo thanh trượt đường kính cành để xem hàm kéo tự đóng mở, con chạy Phương án A trượt qua 4 khấc sống lưng, hoặc hàm chữ V Phương án B tự định tâm và khớp tự lựa nghiêng `±12°`.
- **Mô phỏng xoay khoanh & tự động bóc vỏ (0° – 360°):** Trực quan hóa sự khác biệt giữa mẫu gốc (chỉ rạch 2 đường) và mẫu cải tiến (dải vỏ tự cuộn qua khe thoát phoi, lộ tầng sinh gỗ sạch không cắt phạm lõi).
- **Tách lớp chi tiết (Exploded View):** Kéo thanh trượt để quan sát toàn bộ cấu tạo bu-lông, ốc cánh chuồn, lưỡi bào 28°, chốt nhấn lò xo và con lăn mini.
- **Chú thích kỹ thuật 3D & Bảng so sánh A vs B:** Tối ưu cho Ban Giám Khảo xem trực tiếp khi thuyết trình hoặc quét mã QR trên báo cáo.

## Cấu trúc dự án
- `index.html` — Giao diện chính và bảng điều khiển tương tác (hỗ trợ cả Desktop & Mobile).
- `styles.css` — Hệ thống giao diện CAD Studio gọn nhẹ, đáp ứng đa màn hình.
- `app.js` — Động cơ dựng hình 3D Three.js, giải động học cơ khí và hoạt ảnh bóc vỏ.
- `docs/thong-so-ky-thuat.md` — Bảng thông số kích thước chi tiết để dựng CAD (Onshape/SolidWorks) hoặc gia công mẫu thật.

## Hướng dẫn bật GitHub Pages để tạo mã QR cho Báo cáo KHKT
1. Truy cập repository trên GitHub → chọn **Settings** → **Pages**.
2. Ở mục **Build and deployment** → chọn **Source: Deploy from a branch**, nhánh **`main`**, thư mục **`/ (root)`** → bấm **Save**.
3. Sau khoảng 1 phút, trang web sẽ hoạt động tại địa chỉ:
   `https://thkcnpt-pixel.github.io/khkt-keobocvo/`
4. Dán đường dẫn trên vào bất kỳ công cụ tạo mã QR nào để in trực tiếp lên bìa báo cáo hoặc poster dự thi KHKT.