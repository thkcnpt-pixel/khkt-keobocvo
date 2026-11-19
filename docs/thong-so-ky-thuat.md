# Bảng Thông Số Kích Thước Kỹ Thuật & Dựng Hình CAD
**Dự án:** Cải tiến kéo khoanh vỏ cây HM226 (Tự động bóc vỏ & Thích nghi đa kích cỡ cành 1–8 cm)

---

## 1. Thông số chuẩn hóa từ mẫu gốc HM226
| Chi tiết | Thông số kích thước | Vật liệu đề xuất | Ghi chú |
| :--- | :--- | :--- | :--- |
| Chiều dài tổng thể | `220 mm` | — | Tính từ mũi hàm đến đuôi tay cầm |
| Chiều dài hàm cắt | `100 mm` | Thép SK5 / Thép lò xo 65Mn | Độ dày mỗi lá lưỡi: `1.6 mm` |
| Bề rộng dải vỏ (khoảng cách 2 lưỡi) | `8 – 18 mm` (mặc định `13 mm`) | Long đền + Bu-lông M5 + Ốc cánh chuồn | Căn chỉnh linh hoạt bằng long đền |
| Đường kính cành làm việc | `10 – 80 mm` (`1 – 8 cm`) | — | Phủ hầu hết cành cây ăn quả |
| Trọng lượng mục tiêu | `160 g` (gốc) → `195 – 220 g` (cải tiến) | — | Cân bằng trọng tâm gần trục xoay |

---

## 2. Thông số cụm lưỡi bào ngang (Dùng chung cho Phương án A & B)
- **Góc nghiêng lưỡi bào ($\alpha$):** `28°` (nằm trong dải tối ưu `20°–35°` theo nguyên lý lưỡi bào gỗ).
- **Khe thoát phoi phía sau:** Bề rộng tối thiểu `3.5 – 4.5 mm`, có gờ vát `45°` hướng dải vỏ cuộn ra ngoài để chống kẹt nhựa cây.
- **Cữ giới hạn độ sâu:** Mép răng cưa của 2 lưỡi rạch song song nhô sâu hơn mũi lưỡi bào ngang **`1.5 mm`** (sai số cho phép `1.0 – 2.0 mm`), đảm bảo bóc sạch tầng vỏ + tầng sinh gỗ mà không cắt phạm lõi gỗ.
- **Vật liệu lưỡi bào:** Thép gió HSS hoặc thép hợp kim SK5 tôi cứng `58–60 HRC`, dễ tháo thay thế khi cùn.
- **Bố trí:** Chỉ gắn **01 cụm lưỡi bào** ở hàm trên → giảm `50%` mô-men cản xoay so với gắn cả 2 hàm.

---

## 3. Kích thước chi tiết Phương án A (Con chạy trượt sống lưng)
- **Mép sống lưng hàm trên:** Phay 4 khấc định vị bán nguyệt (bán kính `R = 2.0 mm`, sâu `2.2 mm`) dọc cung lưng ứng với 4 dải cành:
  - Khấc 1: `1 – 2 cm` (gần trục bản lề)
  - Khấc 2: `3 – 4 cm`
  - Khấc 3: `5 – 6 cm`
  - Khấc 4: `7 – 8 cm` (gần mũi hàm)
- **Con chạy chữ U (ôm ngoài sống lưng):**
  - Không khoét rãnh vào thân lưỡi thép mỏng để giữ nguyên độ cứng vững.
  - Bề rộng lòng chữ U: ôm khít 2 mặt ngoài lưỡi kép + khe hở trượt `0.2 mm`.
  - Vật liệu chế tạo mẫu thử: Nhôm 6061 CNC hoặc nhựa kỹ thuật PETG/ABS/Nylon in 3D (mẫu trình diễn).
- **Chốt nhấn lò xo gài nhanh:** Trục chốt thép `Ø4 mm`, lò xo nén lực `8–12 N`, hành trình nhấn `4 mm`.

---

## 4. Kích thước chi tiết Phương án B (Hàm chữ V con lăn + Cụm dao chữ U tự lựa)
- **Hàm đỡ chữ V (Hàm dưới):**
  - Góc mở chữ V: `95° – 100°` (tự động ép tâm mọi cành đường kính `10–80 mm` về đúng trục đối xứng `X ≈ 53.5 mm`).
  - **2 Con lăn mini:** Đường kính ngoài `Ø11 mm`, chiều dài `18 mm`, bọc bạc đạn mini `683ZZ` hoặc ống lót đồng/PTFE trên trục `Ø3 mm` → chuyển ma sát trượt thành ma sát lăn.
- **Cụm dao chữ U & Khớp xoay tự lựa (Hàm trên):**
  - Chiều dài thân cụm dao chữ U: `21 mm`, tích hợp 2 lưỡi rạch 2 bên + 1 lưỡi bào ngang nghiêng `28°`.
  - **Khớp xoay tự lựa:** Trục bản lề `Ø5 mm` có giới hạn góc lắc `±12°` và lò xo hồi vị nhẹ, đảm bảo lưỡi bào luôn nằm tiếp tuyến với bề mặt cong của vỏ cây ở mọi đường kính `1–8 cm`.
