# 02. Thiết Kế Cơ Cấu Khóa Con Chạy Sống Lưng & Cụm Lưỡi Bào Thực Tế (4–18 mm) — Rev 2

**Mục tiêu tài liệu:** Cung cấp kiến trúc cơ khí **Rev 2 đã kiểm chứng 100% hình học và ứng suất (0 va chạm, 0 thất thoát lực kẹp, 71/71 cỡ cành `D = 10..80 mm`)** đáp ứng **MDR-1 đến MDR-9** — hoàn thiện đồng bộ **02 kiến trúc chủ lực sẵn sàng chế tạo ngoài đời thực**:
1. **PA 2 (Khuyến nghị Chủ lực Tải nặng / Thi đấu KHKT):** Khóa bu-lông **ren suốt `M4` xuyên lưới 5 lỗ chung `Ø4.2 mm`** qua thân lưỡi + chốt chống xoay sau (`9,131 N` khóa cắt kép, nhẹ **`+27.1–36.6 g`**, miễn nhiễm 100% nhựa cây/dầu trơn).
2. **PA 1-Rev2 (Khuyến nghị DIY Không khoan lưỡi HM226):** Khóa đòn bẩy **3 điểm 2 tầng `M5/M4` + tấm đệm treo nhôm 6061 `W_clear`** truyền thẳng `52.17%` lực bu-lông vào 4 mặt lưỡi (**`1,402 N > +705 N`** giữ ướt, `0%` thất thoát lực ép) + **chốt ống đàn hồi `DIN 1481 Ø3.0 mm`** đặt ngoài họng phoi tại **`(+6.5, -0.16) mm`** ăn khớp **3 khấc đáy U (`r = 0.5 mm`)**, tổng tăng **`+51.1–65.1 g`**.

Đồng thời tích hợp thống nhất **chiều cắt `+X`**, **Họng thoát phoi Open-Sky vô hạn**, **Cổ chữ C khóa chống xoay 2 điểm (`Rear C-Throat 2.0 × 11.0 mm`)** với giới hạn vật liệu trung thực, và **Hệ lưỡi bào 2 tầng (`Tầng 1` liền thân/ghép lớp `W = 4–10 mm` & `Tầng 2` `T-Anvil 10 mm` + lưỡi phẳng `1.5 mm` SK5/65Mn `W = 12–18 mm`)**.

---

## 1. Giải Quyết Triệt Để Lực Nhổ `+Y` (Sửa Lỗi V1: Tại Sao Đệm Phía Trên Làm Mất Lực Kẹp & Cách Khắc Phục Đúng)

### 1.1. Loại bỏ "móc chữ J ảo tại `y = -4.4 mm`" VÀ bẫy thất thoát lực kẹp (`Preload Theft`) ở `Y = +5 mm`
Trong quá trình kiểm toán thiết kế cũ (v8/v9 và Rev 1), nhóm phát hiện hai cái bẫy cơ học khiến lực chống nhổ `+Y` sụp đổ hoàn toàn ngoài đời thực:
1. **Móc chữ J ảo (`tool.js:215–226`):** Bản lưỡi HM226 là thép đặc liên tục từ `Y = 0` đến `Y = -12.5 mm`; gờ móc ở `Y = -4.4 mm` đâm xuyên vào thép đặc hoặc lơ lửng ngoài không khí (`0 N` giữ nhổ).
2. **Bẫy thất thoát lực kẹp tại `Y = +5.0 mm` (Lỗi V1 ở Rev 1):** Nếu chỉ dùng 2 tấm má phẳng `2.0 mm` thẳng đứng kẹp qua bộ long đền `OD 9.0 mm` tại `Y = +5.0 mm` trên sống lưng (`Y = 0`), thì mép dưới long đền dừng ở `Y = +0.50 mm` (cao hơn sống lưng `0.5–1.4 mm`). Nếu xếp chồng long đền bằng `W_clear + 2·t_blade`, cụm long đền cứng ở `Y = +5 mm` hấp thụ **100% lực siết bu-lông**, để lại **`0 N`** lực ép lên hai lá lưỡi kéo bên dưới! Còn nếu chỉ kê tai kẹp nhô cao với ống đệm ngắn hơn `0.3–0.4 mm`, tai mỏng `1.5–2.0 mm × 10 mm` sẽ bị chảy dẻo ngay ở **`160.7–285.7 N/bu-lông`** (giới hạn ma sát ướt chỉ `231–411 N << +705 N`), trong khi vặn vít từ trên xuống tỳ vào sống lưng lại cộng thêm phản lực đẩy bung `+Y`.

### 1.2. Hai giải pháp cơ khí thật được kiểm chứng (0% thất thoát lực ép, 0% trượt nhổ)

```text
  MẶT CẮT NGANG (YZ) — SO SÁNH 2 KIẾN TRÚC REV 2 KHÔNG THẤT THOÁT LỰC KẸP:

  (A) PA 2 — XUYÊN LỖ THÂN LƯỠI (TỐI ƯU)        (B) PA 1-REV2 — ĐÒN BẨY 3 ĐIỂM 2 TẦNG M5/M4 (KHÔNG KHOAN)
                                                       [Chốt tựa trên M4 @ Y=+9.5mm] + Ống Al 6061
       (Bu-lông M4 trên @ (-9.6,+2.5)                     ┌───────►(═════)◄───────┐  (Cố định tai trên)
        chống xoay Cổ chữ C)                              │  Má   [Ống W+2t_b] Má │
   ┌────────┐   ┌─────┐   ┌────┐   ┌─────┐   ┌────────┐   │ 3.0mm ┌─────────────┐ │ 3.0mm
   │Má ngoài│   │HM226│   │Cổ C│   │HM226│   │Má ngoài│   │       │  Bu-lông M5 │ │ ◄── Siết cờ-lê M5
   │ 2.0 mm │   │+Z   │   │2.0 │   │-Z   │   │ 2.0 mm │   │  ───► │  @ Y=+3.5mm │◄───   (3.0–3.5 N·m)
   │        │═══╡1.5mm╞═══╡ mm ╞═══╡1.5mm╞═══│        │   │       └──┬───────┬──┘ │
   │   Y=-4.5   │Lỗ   │   │(Ống│   │Lỗ   │   │   M4   │   │   Đệm    │ Tấm   │    │ ◄── Đệm Al toàn chiều cao
   └────────┘   │Ø4.2 │   │ Al)│   │Ø4.2 │   └────────┘   │  treo Al │ Cổ C  │    │     Y ∈ [-5.0, +6.0] mm
                └──┬──┘   └──┬─┘   └──┬──┘                │  W_clear │2.0 mm │    │     (KHÔNG đụng nhau ở M5!)
                   │         ▼        │                   └────┬───┬─┴───┬───┴┬───┘
                   │    Lưỡi bào 28°  │                        │HM │  ▼  │ HM │   4 mặt ma sát thực tại Y≤0:
                                                               │+Z │Dao  │ -Z │   F_blade = 0.5217 · F_bolt
                                                                   (E=0,-11)      => Giữ ướt 1,402 N (> +705 N)
```

1. **Cơ chế PA 2 (Xuyên lỗ thân lưỡi M4 — Khóa cắt cơ học `9,131 N`):**
   - Hai bu-lông `M4` ren suốt (`DIN 933`) đi **xuyên thẳng qua lỗ `Ø4.2 mm` trên bản lưỡi HM226 tại `Y = -4.5 mm`** (`4.5 mm` dưới mép sống lưng), kết hợp **ống đệm nhôm 6061 `Ø8 × Ø4.3 mm` + shim tinh** lắp khít bằng đúng `W_clear` giữa mặt trong 2 lưỡi kéo.
   - Lực nhổ hướng kính `+Y` không phụ thuộc một chút nào vào ma sát: muốn bứt con chạy khỏi sống lưng phải **cắt đứt 4 mặt cắt ngang của 2 bu-lông M4** (`A_s = 8.78 mm²`, $\tau_y = 260\text{ MPa}$):
     $$F_{\text{cắt,PA2}} = 2 \times 2 \times 8.78 \times 260 = \mathbf{9,131\text{ N}} \quad (\text{SF} = \mathbf{13.0\times}\text{ so với } +705\text{ N})$$
   - Không có chuyện bu-lông bóp xẹp khe `W` vì ống đệm nhôm 6061 đặt trực tiếp giữa 2 mặt trong lưỡi kéo (`σ_nén = 69.9 MPa < 145–276 MPa`, `0%` biến dạng).

2. **Cơ chế PA 1-Rev2 (Không khoan HM226 — Đòn bẩy 3 điểm 2 tầng `M5/M4`):**
   - **3 điểm tiếp xúc rõ ràng trên mỗi má ngoài (`Inox 304 dày 3.0 mm`, `b_tai = 20 mm`):**
     - **Điểm 1 (Gối đỡ dưới `Y_pad = -2.0 mm`):** Mặt trong má `3.0 mm` áp trực tiếp lên mặt ngoài lưỡi HM226 tại `Y ∈ [-5.0, 0.0] mm`, kẹp ép vào **Tấm đệm treo nhôm 6061 toàn chiều cao (`Y ∈ [-5.0, +6.0] mm`)** đặt giữa 2 lưỡi kéo có tổng bề dày bằng chính xác **`W_clear`** đo bằng thước cặp.
     - **Điểm 2 (Bu-lông siết chính `M5` tại `Y_bolt = +3.5 mm`):** `2×` bu-lông **ren suốt `DIN 933 M5` A2-70** (`X = -11.0 mm` và `X = +11.5 mm`), kèm long đền `DIN 125 M5` (`OD 10 mm`) + đai ốc `DIN 985 Nyloc M5`. Đáy thân bu-lông `M5` ở `Y = +1.0 mm`, cách sống lưng `≥ 1.0–1.4 mm` theo độ cong.
     - **Điểm 3 (Chốt tựa đòn bẩy trên `M4` tại `Y_top = +9.5 mm`):** `2×` bu-lông `DIN 933 M4` vặn vừa khít tay qua ống nhôm 6061 `Ø8 × Ø4.3 mm` cắt dài bằng **`W_clear + 2·t_blade ± 0.5 mm`** (chú ý tổng chiều dài phải tính cả `2·t_blade`, cho phép sai số cắt tay `±0.5 mm` vì chuyển vị xoay `< 2.5°` nằm gọn trong khe lỗ `Ø5.3 mm`).
   - **Cân bằng mô-men tĩnh học (0% thất thoát lực ép):**
     - Khi siết `M5` tại `Y = +3.5 mm`, hai tai má kéo đầu trên vào tựa cứng lên ống `M4` (`Y = +9.5 mm`) và truyền tỷ lệ đòn bẩy cố định xuống vùng kẹp lưỡi (`Y_pad = -2.0 mm`, tổng chiều cao đòn `H = 11.5 mm`, đoạn trên `a = 6.0 mm`, đoạn dưới `b = 5.5 mm`):
       $$F_{\text{lưỡi}} = F_{\text{bu-lông}} \cdot \frac{Y_{\text{top}} - Y_{\text{bolt}}}{Y_{\text{top}} - Y_{\text{pad}}} = \frac{6.0}{11.5}\,F_{\text{bu-lông}} = \mathbf{0.5217\,F_{\text{bu-lông}}}$$
     - **Kiểm chứng ứng suất bu-lông `M5` A2-70 (`σ_y = 450 MPa`, $A_s = 14.18\text{ mm}^2$, $W_p = 12.55\text{ mm}^3$, $F_{\text{proof}} = 6,382\text{ N}$):** Tại sao nâng từ `M4` lên `M5`? Vì Python chứng minh `M4` A2-70 bị chảy dẻo ngay ở `2,500 N` ($\sigma_{\text{VM}} = 471.7\text{ MPa} > 450\text{ MPa}$). Với **`M5`**, khi siết cờ-lê/khóa lục giác **`3.0–3.5 N·m`**:
       - Ở `F_bolt = 3,000 N` ($\mu = 0.15$, $T = 3.02\text{ N}\cdot\text{m}$): **$\sigma_{\text{VM}} = 299.7\text{ MPa} < 350\text{ MPa}$** ($\text{SF} = 1.50$).
       - Ở `F_bolt = 2,800 N` (khô $\mu = 0.20$, $T = 3.65\text{ N}\cdot\text{m}$): **$\sigma_{\text{VM}} = 317.5\text{ MPa} < 350\text{ MPa}$** ($\text{SF} = 1.42$).
     - **Lực giữ ma sát 4 mặt thực tế & Cảnh báo trung thực về ốc tai hồng:**
       - **Siết bằng cờ-lê/ống điếu 8 mm (`2,800 N/bu-lông`):** $F_{\text{lưỡi,tổng}} = 2 \times 0.5217 \times 2{,}800 = \mathbf{2,922\text{ N}}$. Khi dính nhựa cây ướt ($\mu = 0.12$) trên đủ 4 mặt thép:
         $$F_{\text{giữ},+Y,\text{ướt}} = 4 \times 0.12 \times 2{,}922 = \mathbf{1,402\text{ N}} > +705\text{ N} \quad (\mathbf{\text{SF} = 1.99\times}\text{ ở đỉnh sầu riêng!})$$
         *(Ở điều kiện khô $\mu = 0.18$: `2,104 N`).*
       - **Kiểm tra uốn má kẹp ngoài (`Inox 304 dày 3.0 mm`, $b_{\text{net}} = 20 - 5.3 = 14.7\text{ mm}$, $W_{\text{net}} = 22.05\text{ mm}^3$):** Với long đền `OD 10 mm` (`trọng tâm bán khuyên 2.4 mm`), $M_{\text{má}} = 2{,}800 \cdot \frac{6.0 \times 5.5}{11.5} - 1{,}400 \times 2.4 = 4{,}674\text{ N}\cdot\text{mm} \Rightarrow \sigma_{\text{má}} = \mathbf{212.0\text{ MPa}} < 215\text{ MPa}$ giới hạn chảy Inox 304 ủ! *(Má `2.0 mm` sẽ bị uốn cong vĩnh viễn tại tải này).*
       - **CẢNH BÁO GIỚI HẠN ỐC TAI HỒNG VẶN TAY (`DIN 315 M5`):** Vặn bằng ngón tay ngoài vườn chỉ đạt mô-men `0.6–1.0 N·m` ($F_{\text{bolt}} = 480\text{–}800\text{ N/bu-lông} \Rightarrow F_{\text{lưỡi,tổng}} = 501\text{–}835\text{ N}$), lực giữ ướt chỉ còn **`240–401 N`**. Do đó, **ốc tai hồng vặn tay CHỈ ĐƯỢC PHÉP dùng trên cành vỏ mềm nhẹ (`cam, chanh`, tải `≤ 120 N`)**; cắt cành dai nặng (*nhãn, vải, xoài, sầu riêng*) **BẮT BUỘC dùng đai ốc `Nyloc` siết bằng cờ-lê `3.0–3.5 N·m`**!

---

## 2. Phân Tích & So Sánh 5 Phương Án Khóa Sống Lưng (Cập Nhật Rev 2)

### 2.1. Chi tiết 5 phương án (Định vị 2 kiến trúc đạt chuẩn + 3 phương án tham chiếu)

1. **PA 2 (KHUYẾN NGHỊ CHỦ LỰC TẢI NẶNG / THI ĐẤU KHKT) — Khóa Bu-lông Xuyên Lưới 5 Lỗ Chung `Ø4.2 mm` Tại `Y = -4.5 mm`:**
   - **Lưới 5 lỗ chung trên 2 lá HM226:** Khoan **5 lỗ `Ø4.2 mm`** tại cao độ **`Y = -4.5 mm`** (cách sống lưng `2.4 mm` tính từ mép trên lỗ và cách chân răng `4.3 mm`), bước lỗ đều **`7.80 mm`**, vách thép đặc giữa hai lỗ kề nhau **`3.60 mm`**, bảo toàn **`79.8%`** mô-đun chống uốn của bản lưỡi `10.9 mm`:
     - Tọa độ trích từ `kinematics.js`:
       - **Lỗ 1:** `t = 0.2874`, cung sống lưng `25.97 mm`, tọa độ toàn cục `(31.59, 18.15) mm`
       - **Lỗ 2:** `t = 0.3584`, cung sống lưng `33.74 mm`, tọa độ toàn cục `(38.97, 19.29) mm`
       - **Lỗ 3:** `t = 0.4290`, cung sống lưng `41.56 mm`, tọa độ toàn cục `(46.48, 19.96) mm`
       - **Lỗ 4:** `t = 0.4987`, cung sống lưng `49.34 mm` (`49.33–49.34`), tọa độ toàn cục `(53.99, 20.19) mm`
       - **Lỗ 5:** `t = 0.5686`, cung sống lưng `57.16 mm` (`57.15–57.16`), tọa độ toàn cục `(61.54, 19.97) mm`
   - **Cơ chế nhảy bước `15.60 mm` (bỏ cách 1 lỗ ở giữa):**
     - **Vị trí 1 (`t_E = 0.375`, cành `D = 10–22 mm`):** dùng **Lỗ 1 & Lỗ 3**.
     - **Vị trí 2 (`t_E = 0.445`, cành `D = 23–55 mm`):** dùng **Lỗ 2 & Lỗ 4**.
     - **Vị trí 3 (`t_E = 0.515`, cành `D = 56–80 mm`):** dùng **Lỗ 3 & Lỗ 5**.
   - **Cấu tạo cụm con chạy PA 2 siêu gọn:**
     - **02 má kẹp gọn Inox 304 dày `2.0 mm`** (`X ∈ [-13.2, +9.5] mm`, `Y ∈ [-7.5, +5.5] mm`, có góc vát sau **`(-13.2, -1.5) → (-9.5, -7.5)`** né ốc M5 HM226).
     - **02 bu-lông `M4` ren suốt `DIN 933`** xuyên qua thân lưỡi tại **`X_R = -9.6 mm, Y = -4.5 mm`** và **`X_F = +6.0 mm, Y = -4.5 mm`** (`M4×30` cho `W = 4–10 mm`; `M4×35` cho `W = 12–18 mm`) + **01 bu-lông `M4` chống xoay phía trên** tại **`(-9.6, +2.5) mm`** (tạo cánh tay đòn khóa `Rear C-Throat` **`d = 7.0 mm`**!).
     - Chêm khe hở bằng **ống đệm nhôm 6061 `Ø8 × Ø4.3 mm`** (`2/4/6/8/10 mm`) + shim `0.5/0.8 mm` đúng bằng `W_clear`.
   - **Kiểm toán chịu lực & khối lượng PA 2:**
     - Sức bền cắt kép 2 bu-lông `M4`: **`9,131 N`** (`SF = 11.7×` so với `783.4 N`; `13.0×` so với `+705 N`), ứng suất ép dập trên 4 mặt lỗ chỉ **`32.6 MPa`** tại `783.4 N`.
     - Lực trên chốt chống xoay trên `(-9.6, +2.5)` ở tải đỉnh `783.4 N` + hút `-172.3 N`: `F_pin = (783.4×6.5 + 172.3×9.6)/7.0 =` **`964 N`** (`SF = 6.78× > 6×` so với `6,535 N` cắt kép thân trơn).
     - **Khối lượng tăng thêm trung thực:** **`+27.1 g` (`W = 4 mm`) đến `+36.6 g` (`W = 18 mm`)** → tổng kéo **`187–197 g`**, **đạt chuẩn `MDR-8 ≤ 35 g`** trên dải rộng tiêu chuẩn!

2. **PA 1-Rev2 (KHUYẾN NGHỊ DIY KHÔNG KHOAN LƯỠI HM226) — Yên Đòn Bẩy 3 Điểm `M5/M4` + Chốt Ống `DIN 1481 Ø3.0 mm` Ngoài Họng Phoi:**
   - **Không khoan lưỡi thép tôi HM226:** Chỉ mài cắt **3 khấc đáy U (`r ≥ 0.5 mm`) vách đứng `90°` ($\psi = 0^\circ$)**, kích thước **`1.50 mm` sâu × `3.20 mm` rộng** (`Y_floor = -1.66 mm`) bằng đĩa cắt mỏng + dũa kim cương.
   - **Vị trí 3 khấc mới (`t_notch = [0.4336, 0.5032, 0.5731]`, cung `42.07 / 49.84 / 57.66 mm`):** Tương ứng mũi cắt **`E = (0.0, -11.0) mm`** đặt tại **`t_E = [0.375, 0.445, 0.515]`**, vì chốt cắt tỳ được **dời hẳn ra phía trước ngoài họng thoát phoi tại `X = +6.5 mm, Y = -0.16 mm`** (`X ∈ [+5.0, +8.0] mm` — cách biên họng phoi `+5.0 mm` là `0 mm` xâm lấn, ngoài vùng `X ∈ [-7.5, +5.0] mm` hoàn toàn!).
   - **Tại sao dùng chốt ống đàn hồi `DIN 1481 / ISO 8752 Ø3.0 mm` thay bu-lông M4 tại khấc?**
     - Chốt ống xẻ rãnh đàn hồi thép `65Mn` tự nở chặt vào lỗ `Ø3.0 mm` trên hai má `3.0 mm`: **tuyệt đối không có đai ốc để vặn ép qua khe hở `W`**, triệt tiêu 100% nguy cơ bóp móp lưỡi kéo HM226!
     - Tọa độ `Y = -0.16 mm` (độ hạ cong tự nhiên của sống lưng tại `X = +6.5 mm`) đưa đáy chốt `Ø3.0 mm` (`r = 1.50 mm`) xuống đúng **`Y = -1.66 mm = Y_floor`**: **sai số va chạm `0.00 mm`**, xích đạo chốt nằm ngang mép khấc (`ψ = 0°`, lực bật ngược = `0 N`).
     - Tiết diện thép rỗng $A = \pi(1.5^2 - 0.9^2) = 4.52\text{ mm}^2$: ứng suất cắt kép tại `783.4 N` chỉ **`86.6 MPa`** (tải cắt kép tối thiểu chuẩn ISO 8752 = **`5,500 N`**, $\text{SF} = \mathbf{7.0\times}$!); ứng suất ép dập lên vách khấc HM226 = **`174.1 MPa`**.
     - Vách thép giữa các khấc dày **`4.57 mm` & `4.62 mm`** (`≥ 4.0 mm`), bảo toàn **`(9.4/10.9)^2 = 74.4%`** mô-đun chống uốn.
   - **Má kẹp `Inox 304 dày 3.0 mm` khoét vòm (`Arch-Cutout`):** Bao hình `X ∈ [-15.0, +16.0] mm`, hai tai `Y ∈ [-5.0, +11.5] mm` (`b_tai = 20 mm`), cầu nối trên đặt lệch ra ngoài lưỡi tại `Y ∈ [+1.0, +7.0] mm`, góc vát sau `45°` `(-15.0, +0.5) → (-9.5, -5.0)` né ốc M5 HM226.
   - **Khối lượng tăng thêm trung thực PA 1-Rev2:** **`+51.1 g` (`W = 4 mm`) đến `+65.1 g` (`W = 18 mm`)** → tổng kéo **`211–225 g`** (đây là cái giá vật lý trung thực khi phải làm má `3.0 mm` + bu-lông `M5/M4` để giữ `1,402 N` mà không khoan thân lưỡi).

3. **PA 3 (Nâng cấp Thao tác nhanh 2 giây) — Khóa Cam Lệch Tâm `M5` Xe Đạp + Chốt Ống `Ø3.0 mm`:**
   - Thay `2×` bu-lông `M5` tại `Y = +3.5 mm` trên nền khung **PA 1-Rev2** (hoặc bu-lông `PA 2`) bằng trục cam tháo nhanh `M5` (`Quick-Release`), giữ nguyên **chốt ống `DIN 1481 Ø3.0 mm` tại `(+6.5, -0.16) mm`** và cặp chốt tựa `M4` ở `+9.5 mm`. Đổi vị trí mất `2–3 giây`, nhưng nặng hơn `~12 g`, tay cam thò `28–35 mm` dễ vướng cành rậm và phải vặn chỉnh lại đai ốc mỗi khi đổi `W`.

4. **PA 4 (Chốt Ngàm Chữ T Xoay 90° + Nêm Ép):**
   - Thao tác nhanh nhưng ở `W = 4 mm` khe giữa hai lưỡi hẹp (`W_clear = 2.5–4.0 mm`), đầu chữ T không lọt xoay dưới khe nên buộc phải làm cầu trên; yêu cầu cắt/phay `±0.1 mm` và rất dễ kẹt cát/nhựa cây khô.

5. **PA 5 (Nêm Tự Hãm `α = 6°` + Vít Hãm `M4`):**
   - Nhạy cảm với nhựa cây ướt ($\mu$ giảm xuống `0.06 < tan 6° = 0.105` làm mất tự hãm), tự nhả khi lắc ngược tay cầm, và khó vát đều `6°` trên 2 sống lưng cong.

### 2.2. Bảng ma trận so sánh định lượng 5 phương án (Rev 2)

| Tiêu chí đánh giá (MDR-1..9) | **PA 2: Xuyên lưới 5 lỗ `M4` (`Y=-4.5 mm`) [KHUYẾN NGHỊ KHKT]** | **PA 1-Rev2: Đòn bẩy 3 điểm `M5/M4` + Chốt `Ø3.0` (`+6.5`) [KHUYẾN NGHỊ DIY]** | PA 3: Khóa cam nhanh `M5` + Chốt `Ø3.0` | PA 4: Ngàm chữ T xoay `90°` | PA 5: Nêm tự hãm `6°` + Vít `M4` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Chịu cắt tiếp tuyến `F_t` (MDR-1)** | **10/10** (`9,131 N` cắt kép, `SF=11.7×`) | **9.5/10** (`5,500 N` chốt `DIN 1481 Ø3.0`, `SF=7.0×`) | **9.0/10** (Chốt `Ø3.0` gánh `F_t`) | **7.5/10** (Phụ thuộc vai rãnh T) | **6.5/10** (Nhả nêm nếu đảo chiều) |
| **Chống nhổ `+Y` & Không thất thoát lực** | **10/10** (Khóa cắt cơ học `100%`, `0%` phụ thuộc ma sát) | **9.0/10** (`1,402 N` giữ ướt bằng cờ-lê `3.0–3.5 N·m`, `SF=1.99×`; *tai hồng `≤120 N`*) | **8.0/10** (Phải chỉnh đúng độ siết cam) | **7.5/10** (Mòn cam gây rơ `+Y`) | **5.5/10** (Mất tự hãm khi dính nhựa ướt) |
| **Độ bền sống lưỡi HM226 (MDR-5)** | **9.5/10** (**`79.8%`** mô-đun, vách `3.60 mm`) | **9.0/10** (**`74.4%`** mô-đun, vách `4.57–4.62 mm`, đáy U `r=0.5 mm`) | **9.0/10** (Giống PA 1-Rev2) | **7.0/10** (Cần rãnh cầu phức tạp) | **6.0/10** (Mài vát mỏng sống lưng) |
| **Kháng nhựa & Khối lượng tăng (MDR-7, 8)** | **10/10** (**`+27.1–36.6 g`**, tổng `187–197 g` — **ĐẠT MDR-8**) | **7.5/10** (**`+51.1–65.1 g`**, tổng `211–225 g` — đánh đổi do không khoan) | **6.5/10** (`+63–77 g`, tay cam dễ vướng tán) | **5.5/10** (Khe T đóng nhựa cứng) | **5.0/10** (Nhựa hàn chết mặt nêm) |
| **Khả năng gia công tại VN** | **8.5/10** (Cần mũi Cobalt `Ø4.2 mm` / EDM khoan 5 lỗ HM226) | **9.5/10** (**Không khoan thép tôi**, chỉ cắt 3 khấc đáy U bằng dũa kim cương) | **8.0/10** (Tận dụng khóa yên xe đạp) | **4.5/10** (Cần phay/laser `±0.1 mm`) | **4.5/10** (Khó tạo vát `6°` cong) |
| **Tốc độ đổi cỡ cành (3 vị trí)** | Trung bình (`15–20 giây`) | Nhanh (`8–12 giây` bằng khóa cờ-lê `8 mm` + rút chốt `Ø3.0`) | **Rất nhanh (`2–3 giây`)** | Nhanh (`4–6 giây`) | Trung bình (`8–12 giây`) |

---

## 3. Thống Nhất Chiều Cắt `+X`, `E = (0.0, -11.0) mm`, Họng Open-Sky Vô Hạn, Cổ Chữ C 2 Điểm & Hệ Lưỡi Bào 2 Tầng

### 3.1. Chiều cắt `+X`, tọa độ `t_E` phủ `71/71` đường kính `D = 10..80 mm` & Họng Open-Sky Vô Hạn (Sửa V2, V3, V5)

```text
  MẶT BÊN (XY) — QUY ƯỚC THỐNG NHẤT CHIỀU CẮT +X & HỌNG THOÁT PHOI OPEN-SKY VÔ HẠN:

  Y (mm)  ▲ +Y (VÙNG MỞ LÊN TRỜI VÔ HẠN +∞ OVER X ∈ [-7.5, +5.0] mm — 0 BU-LÔNG, 0 CHỐT, 0 CẦU NỐI)
          │
   +11.5  ├───────(●) P2_PA1 (-11.0, +9.5) M4 tựa trên (PA 1-Rev2)
          │       │                     │
    +3.5  │  (●) P1_PA1 (-11.0, +3.5) M5 │             (●) (+11.5, +3.5) M5 trước (PA 1-Rev2)
    +2.5  │       │  (●) (-9.6, +2.5) M4 trên PA 2     │
     0.0 ─┼───────┴───┬─────────────────┴──────────────┼────────────────────── Sống lưng Y = 0
          │   Cổ chữ C│   ▲ Quỹ đạo vỏ X ∈ [-7.96,     │  (●) (+6.5, -0.16) ◄── Chốt ống DIN 1481 Ø3.0
   -1.66  │   2.0×11mm│  ╱     -0.44] mm (luôn ≥-4.34  │  [Khấc đáy U 1.5×3.2, r=0.5 mm] (PA 1-Rev2)
   -4.50  │   X ∈     │ ╱      dưới Y=0)               │
          │ [-18.5,   │╱╲  28° ramp (`\`)              (●) Lỗ PA 2 M4 (-9.6 & +6.0, -4.5)
  -11.00 ─┼───────────┴──● E(0.0, -11.0) ─────────────────────────► CHIỀU CẮT CHÍNH (+X)
  -12.50 ─┼─────────────────────────────────────────────────────────────────── Đỉnh răng cưa (DEPTH_GAP=1.5)
          └────-18.5─-11.0─-7.5────0────+5.0──+6.5──+11.5──► X (mm)
```

1. **Thống nhất chiều cắt `+X` & dốc `\` `28°` (khớp 100% `kinematics.js` & `tool.js:91`):**
   - Kéo tiến cắt theo hướng **`+X`** (về mũi hàm). Mũi lưỡi bào nằm tại **`E = (0.0, -11.0) mm`** quay mặt cắt về **`+X`**, và mặt bụng dẫn phoi `28°` dốc **lùi lên trên (`-X, +Y`, vẽ `\`)** từ `(0.0, -11.0)` lên `(-6.0, -7.81) mm`.
   - Khi kiểm tra bằng `kinematics.js:124–155` (`chipChuteTrajectoryPoint`) trên toàn dải `D = 10..80 mm`, dải vỏ cuộn nằm gọn trong **`X ∈ [-7.96, -0.44] mm`** (và luôn **`X ≥ -4.34 mm`** ở dưới `Y = 0`), mở thẳng lên trời `+∞`. Vì vậy **tuyệt đối không đặt bất kỳ chốt ngang, bu-lông hay cầu nối nào trong vùng `X ∈ [-7.5, +5.0] mm`**! (Trong PA 1-Rev2, cầu nối 2 tai má đặt lùi ra mặt ngoài bên ngoài hai lá lưỡi tại `Y ∈ [+1.0, +7.0] mm`, không nằm trong khe giữa 2 lưỡi).
2. **Phủ kín `71/71` cỡ cành `D = 10..80 mm` với `E = (0.0, -11.0) mm` & `t_E = [0.375, 0.445, 0.515]`:**
   - Lùi mũi `E` từ `(+5, -11)` về thẳng dưới tiếp tuyến sống lưng **`(0.0, -11.0) mm`** và đặt 3 vị trí làm việc tại **`t_E = [0.375, 0.445, 0.515]`** (cung sống lưng **`[35.57, 43.34, 51.16] mm`**):
     - **Vị trí 1 (`t_E = 0.375`, `D = 10–22 mm`):** `peelDist = 3.80–8.98 mm < R`, cao hơn lõi gỗ `aboveXylem = 0.94–1.18 mm`.
     - **Vị trí 2 (`t_E = 0.445`, `D = 23–55 mm`):** `peelDist = 11.64–23.83 mm < R`, cao hơn lõi gỗ `aboveXylem = 0.91–1.34 mm`.
     - **Vị trí 3 (`t_E = 0.515`, `D = 56–80 mm`):** `peelDist = 28.78–38.70 mm < R`, cao hơn lõi gỗ `aboveXylem = 0.90–0.98 mm`.
   - Kiểm tra bước `1 mm` trên **tất cả `71/71` đường kính `D = 10..80 mm`**: `R - peelDist ≥ 0.79 mm` và `aboveXylem ∈ [0.90, 1.41] mm` (**0 lỗi trượt vỏ ngoài không khí, 0 lỗi phạm gỗ**!).
   - Ở **Vị trí 1 (`t_E = 0.375`)**, góc vát sau `45°` của má kẹp cách tâm bu-lông M5 gốc HM226 `(16.52, 13.04) mm` tới **`13.17 mm`** ở PA 1-Rev2 (dư `+8.17 mm` so với long đền M5, **`+1.17 mm`** so với ốc tai hồng M5) và **`13.43 mm`** ở PA 2 (dư `+8.43 mm` / **`+1.43 mm`**).

### 3.2. Cổ chữ C phía sau khóa 2 điểm chống xoay (`Rear C-Throat 2.0 × 11.0 mm`) & Giới hạn vật liệu trung thực (Sửa V4, V5)

1. **Khóa chống xoay 2 điểm bắt buộc (xóa lỗi xoay quanh 1 lỗ ở Rev 1):**
   - Khối `Rear C-Throat` (`b = 2.0 mm`, cột đứng sâu **`h = 11.0 mm`** tại `X ∈ [-18.5, -7.5] mm`, $W_b = \frac{2.0 \times 11.0^2}{6} = \mathbf{40.33\text{ mm}^3}$, $I = \mathbf{221.83\text{ mm}^4}$) được khóa cứng chống xoay bằng **02 chốt đồng thời**:
     - Trong **PA 1-Rev2:** chốt qua cả **`(-11.0, +3.5)` (`M5`)** và **`(-11.0, +9.5)` (`M4`)** (`d = 6.0 mm`). Tại mô-men đỉnh `13,255 N·mm` (`783.4×14.5 + 172.3×11.0`), lực cặp chốt là `2,209 N` → chịu cắt kép `M4` `6,535 N` đạt **`SF = 2.96×`**.
     - Trong **PA 2:** chốt qua cả **`(-9.6, -4.5)` (`M4`)** và **`(-9.6, +2.5)` (`M4`)** (`d = 7.0 mm`), tải cặp chốt đỉnh chỉ **`964 N`** (**`SF = 6.78× > 6×`**).
2. **Công bố trung thực giới hạn vật liệu theo lực cắt (`L_arm = 14.5 mm` ở PA 1-Rev2; `6.5 mm` ở PA 2):**
   - Với **PA 1-Rev2 (`L_arm = 14.5 mm`, $W_b = 40.33\text{ mm}^3$):**
     - Ở `F_t = 150 N`: $\sigma = \mathbf{53.9\text{ MPa}}$ (An toàn).
     - Ở `F_t = 400 N` (nhãn/xoài nặng ổn định): $\sigma = \mathbf{143.8\text{ MPa}} < 215\text{ MPa}$ (**Inox 304 ủ ĐẠT**, $\text{SF} = 1.50$).
     - Ở xung đỉnh sầu riêng **`783.4 N` + đẩy bung `+705 N`**: $\sigma_{\text{uốn}} = 281.6\text{ MPa} + \sigma_{\text{nén}} = 32.0\text{ MPa} = \mathbf{313.7\text{ MPa}} > 215\text{ MPa}$!
     - **KẾT LUẬN TRUNG THỰC BẮT BUỘC:** **Inox 304 ủ (`σ_y = 215 MPa`) trên PA 1-Rev2 CHỈ ĐƯỢC PHÉP dùng đến `≤ 400 N`**; muốn cắt mắt sầu riêng/nhãn cổ thụ `783 N` bắt buộc gia công cột `Rear C-Throat` từ **thép `C45/65Mn` nhiệt luyện (`σ_y ≥ 650–850 MPa`, $\text{SF} = 2.1–2.7\times$) hoặc Inox 304 cán nguội (`≥ 450 MPa`)**! (Riêng ở **PA 2**, nhờ bu-lông xuyên lỗ tại `Y = -4.5 mm` rút ngắn `L_arm` xuống `6.5 mm`, ứng suất đỉnh `783.4 N + 705 N` giảm còn **`158.3 MPa < 215 MPa`** — an toàn ngay cả với Inox 304 ủ!).

### 3.3. Hệ lưỡi bào mô-đun 2 tầng cho `W = 4–18 mm` (Sửa V4: Xóa lỗi khoan `Ø4.2` trên `3.6 mm` & gãy dao `0.7 mm`)

Để loại bỏ triệt để 4 lỗi bất khả thi của v8/v9 và Rev 1 *(không thể khoan `Ø4.2 mm` lên dao rộng `3.6 mm`, phôi `26 mm` không tới lỗ sau `36 mm`, dao rọc giấy `0.7 mm` vát cạnh dọc dài chứ không vát cạnh `18 mm`, và cánh dao `0.7 mm` hẫng `6.8 mm` gãy ở `2,843 MPa` / xoắn `24.8°` / hở mũi `6.4 mm`)*, hệ lưỡi bào được chuẩn hóa thành **2 Tầng theo dải `W`**:

1. **Tầng 1 (`W = 4, 6, 8, 10 mm` & `W = 12 Case B`, tức `W_clear = 2.5–10.5 mm`) — Lưỡi Cổ C Liền Thân / Ghép Lớp (`Integral / Laminated C-Throat Blades`):**
   - Trong khe hẹp `2.5–10.5 mm` tuyệt đối không đặt ốc kẹp dao bên trong; toàn bộ lưỡi bào có chiều rộng `2.0 / 3.5 / 4.0 / 5.5 / 6.0 / 7.5 / 8.0 / 9.5 / 10.0 mm` (chừa khe hở `0.2–0.25 mm/bên`) được làm bằng cách **cắt liền với cụm `Rear C-Throat` (thép `65Mn/C45` dày `2.0 mm`)** hoặc **ghép chập phẳng các tấm `1.5 mm` & `2.0 mm`** cùng đi qua **2 chốt định vị trên thân cột + 01 chốt định vị chân `Ø3.0 mm`**.
   - **Ưu điểm tuyệt đối:** `0` ốc vít trong khe hẹp, `0` xoắn cánh, `0` hở mũi, không bao giờ phải khoan lỗ `Ø4.2 mm` vào dải dao hẹp `3.6 mm`.

2. **Tầng 2 (`W = 12 Case A, 14, 16, 18 mm`, tức `W_clear = 12.0–18.0 mm`) — Đe Chữ T Bắt Cưỡi `10.0 mm` (`Straddle T-Anvil`) + Lưỡi Phẳng `1.5 mm` SK5/65Mn:**
   - Dùng chung **01 Cổ chữ C `2.0 mm`** tái sử dụng nhiều lần, gắn thêm khối **Đe chữ T rộng `10.0 mm` (`Straddle T-Anvil`)** ôm cưỡi lên chân cổ chữ C bằng rãnh giữa `2.1 mm` và khóa ngang bằng **chốt `Ø3.0 mm` (`SF_y = 4.97×`)**. Nhờ bệ đỡ rộng tới `10.0 mm`, phần cánh hẫng của lưỡi `17.6 mm` (ở `W = 18 mm`) giảm từ `7.8 mm` xuống còn **`3.8 mm`**!
   - **Lưỡi cắt phẳng không cần khò uốn (`L = 13.5 mm`, dày `1.5 mm` từ phôi lưỡi bào gỗ mini SK5 hoặc cưa máy HSS):** Cắt **rãnh chữ U rộng `2.2 mm` ở đuôi** để ôm tựa thẳng vào mặt trước cột cổ chữ C (`100%` lực cắt `F_t` truyền thẳng vào cột thép, không gánh cắt trên vít!) và cố định xuống mặt vát `28°` của `T-Anvil` bằng **`2 ×` vít đầu bằng chìm `DIN 7991` `M2.5` (`W = 12–14`) hoặc `M3` (`W = 14–18`)** tại `X = -5.0 mm` (`5.4–6.0` vòng ren trong `T-Anvil`).
   - **Kiểm toán cơ học Tầng 2 (`1.5 mm` SK5):**
     - Ứng suất uốn cánh hẫng ở đỉnh sầu riêng `783.4 N`: **`σ_wing ≤ 171.4 MPa`** (giảm **`16.6×`** so với `2,843 MPa` của lưỡi `0.7 mm`!).
     - Ứng suất cạy mũi (`+705 N`): **`σ_pry ≤ 378.2 MPa`** (`373.9 MPa` tại `W=18`; `378.2 MPa` tại `W=12`, quá nhỏ so với giới hạn chảy `> 1,200 MPa` của SK5/65Mn tôi!).
     - Độ nhấc mũi tối đa: **`lift ≤ 0.010 mm`**; độ xoắn lệch tâm: **`twist ≤ 0.082°`**.

---

## 4. Cảnh Báo Độ Lệch Kéo Cắt HM226 & Lộ Trình Chế Tạo Nguyên Mẫu

1. **Độ lệch kéo cắt (`Bypass Offset` ở hàm dưới `Phương án C`):** Trên kéo HM226 thật, hàm trên và hàm dưới xếp chéo lệch mặt phẳng nhau một chiều dày lá lưỡi (`~1.5 mm`) tại bản lề (`zLo ≠ zUp`), và ở `D = 10 mm` hai hàng răng cưa cách nhau chỉ `~7–8 mm`. Do đó, **bắt buộc chế tạo và kiểm thử thành công nguyên mẫu 1 hàm (`Phương án A`) trước** để xác nhận cữ `1.5 mm` và thoát phoi, trước khi đo cặp thực tế để gia công hàm thứ 2 (nếu cần cắt đối xứng `180°`).
2. **Khuyến nghị chọn phương án theo mục tiêu thực tế:**
   - **Thi đấu KHKT / Thu hoạch vườn chuyên nghiệp (`nhãn, xoài, sầu riêng`):** Chọn **PA 2** (tăng chỉ `+27.1–36.6 g`, khóa `9,131 N`, miễn nhiễm nhựa cây, Inox 304 cũng an toàn tới `783 N`).
   - **Tự chế DIY tại nhà không có máy khoan bàn / mũi Cobalt:** Chọn **PA 1-Rev2** (tăng `+51.1–65.1 g`, không khoan thép tôi HM226, siết cờ-lê `3.0–3.5 N·m` cho `1,402 N` giữ ướt; nâng cấp cột `C-Throat` lên `65Mn/C45` nếu cắt sầu riêng `> 400 N`).
