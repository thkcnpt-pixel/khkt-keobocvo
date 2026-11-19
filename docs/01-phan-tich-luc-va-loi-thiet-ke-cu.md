# 01. Phân Tích Lực Cắt Thực Tế & Kiểm Toán Lỗi Thiết Kế Cũ (v8/v9)

**Mục tiêu tài liệu:** Trả lời trực diện câu hỏi cốt lõi về độ chắc chắn của cơ cấu chốt gài lò xo kéo lên, phân tích hệ lực thực tế khi khoanh/bóc vỏ cây ăn quả tại Việt Nam, kiểm toán đầy đủ **9 lỗi "chỉ đẹp trên 3D" (`3D-only fantasies`)** của thiết kế v8/v9, và chốt bảng **9 Yêu cầu Thiết kế Cơ khí (MDR-1 đến MDR-9)** làm chuẩn đánh giá mọi phương án chế tạo ngoài đời thực.

---

## 1. Tóm Tắt Điều Hành: Tại Sao Chốt Lò Xo Kéo Lên Không Thể Chắc Ngoài Đời Thực?

Phản biện của bạn — ***"Nếu chốt gài lò xo có thể dễ dàng kéo lên như vậy thì sao chắc được?"*** — hoàn toàn **chính xác 100% về mặt vật lý và cơ học**. Khi đưa kéo HM226 ra vườn cây ăn quả thực tế (*cam, chanh, bưởi, nhãn, vải, xoài, sầu riêng*), cụm chốt gài lò xo kéo lên trong mô hình v8/v9 chắc chắn sẽ bị **bật chốt, rung rơ phạm gỗ, hoặc kẹt cứng nhựa cây** vì 4 nguyên nhân định lượng không thể chối cãi:

1. **Lực lò xo kéo tay bị giới hạn vật lý ở `12–20 N`**, trong khi khấc bán nguyệt trên sống lưng dao biến lực cắt vỏ tiếp tuyến `F_t = 50–400 N` thành **lực đẩy trượt bật chốt lên trên (`cam-out`) đạt `29–232 N`** — lớn gấp **1.5 đến 15 lần** lực giữ của lò xo!
2. **Không có bất kỳ cơ cấu chống nhổ hướng kính (`+Y`) nào có thật:** Phản lực tại mắt cành đẩy cụm con chạy bật lên trên tới **`+705 N`**, còn "gờ móc chữ J" ở `y = -4.4 mm` trong mã 3D lại nằm xuyên vào vùng thép đặc của lưỡi kéo (`0` đến `-12.5 mm`) nên ngoài đời thực không hề móc vào đâu cả.
3. **Má sau (`backHalf`) chỉ có chốt chết giả (`rearDetent`) không kéo lên được**, còn chốt chính ở má trước (`Ø1.1 mm`) sẽ chịu ứng suất cắt lên tới **`421–824 MPa`**, cong/gãy ngay khi gặp mắt vỏ cứng.
4. **Núm giật đỏ nhô cao `11.7 mm` trên sống lưng** dễ bị cành nhánh va bật mở giữa chừng, và lò xo xoắn hở sẽ bị **nhựa cây (*xoài, mít, nhãn, bưởi*) + mùn vỏ bám bít cứng** chỉ sau vài chục nhát cắt.

> **Kết luận dứt khoát:** Muốn làm sản phẩm thật chạy được ngoài vườn, **bắt buộc loại bỏ cơ chế chốt lò xo kéo lên** để thay bằng khóa cơ khí cưỡng bức thực thụ: **PA 2 (Khuyến nghị Chủ lực Tải nặng / Thi đấu KHKT: khóa bu-lông `M4` xuyên lưới 5 lỗ `Ø4.2 mm` qua thân lưỡi, khóa cắt `9,131 N`, `+27.1–36.6 g`)** hoặc **PA 1-Rev2 (Khuyến nghị DIY Không khoan lưỡi HM226: khóa đòn bẩy 3 điểm 2 tầng `M5/M4` truyền lực kẹp thẳng vào 4 mặt lưỡi không thất thoát preload + chốt ống đàn hồi `DIN 1481 Ø3.0 mm` tại `X = +6.5 mm` ngoài họng phoi ăn khớp khấc đáy U `r = 0.5 mm`, vách `90°`, `+51.1–65.1 g`)** (chi tiết tại Tài liệu `02`).

---

## 2. Bảng Thông Số Chuẩn Kéo HM226 & Giải Mã 3 Ảnh Chụp Màn Hình v9

### 2.1. Đối chiếu thông số chuẩn gốc HM226 (`docs/thong-so-ky-thuat.md`, `kinematics.js`, `tool.js`)

Trong toàn bộ bộ hồ sơ kỹ thuật này, mọi thông số gốc của kéo HM226 được chuẩn hóa thống nhất (1 đơn vị mô phỏng Three.js = `1 cm = 10 mm`, chiều cắt chuẩn theo trục **`+X`** hướng về mũi hàm):

| Thông số kỹ thuật | Tài liệu gốc (`thong-so-ky-thuat.md`) | Mã nguồn (`kinematics.js` / `tool.js`) | Giá trị chuẩn hóa dùng thiết kế |
| :--- | :--- | :--- | :--- |
| **Chiều dài tổng thể kéo** | `220 mm` | Tay cầm `x = -122 mm` → Mũi hàm `+102.2 mm` | **`220 mm`** (CAD `224.2 mm`) |
| **Chiều dài hàm cắt cong** | `100 mm` | Cung Bezier `t ∈ [0.04, 0.98]` | Cung răng **`89.6 mm`** / Cung sống lưng **`101.9 mm`** (dây cung `86.7 mm`) |
| **Chiều rộng bản lưỡi (`BLADE_WIDTH`)** | — | `1.25 cm` ổn định trên `t ∈ [0.20, 0.80]` | **`12.5 mm`** (chiều cao răng `1.6 mm`; phần thân đặc dưới chân răng **`10.9 mm`**) |
| **Độ dày mỗi lá lưỡi răng cưa** | `1.4 – 1.6 mm` | `0.14 cm` (`1.4 mm`, thép SK5/65Mn) | **`1.5 mm`** danh định (`1.4 – 1.6 mm`) |
| **Cữ sâu an toàn (`DEPTH_GAP`)** | `1.5 mm` | `0.15 cm` (`TOOTH_SINK = 0.06 cm`, `BARK_T = 0.22 cm`) | **`1.5 mm`** (mũi bào lùi sau đỉnh răng `1.5 mm`, trên tầng gỗ `0.90–1.41 mm`) |
| **Độ rộng lớp vỏ bóc (`W`)** | `4 – 18 mm` (mặc định `13 mm`) | Slider `4..18 mm`, bu-lông `M5` + long đền tại `t = 0.13` (`x ≈ 16.5 mm`) | **`4 – 18 mm`** (phân biệt rõ `W_clear` lòng trong và `W_center` tâm-tâm) |
| **Đường kính cành làm việc (`D`)** | `10 – 80 mm` (`1 – 8 cm`) | `solveHM(D)`: `cx = 42.0–60.9 mm`, góc nửa hàm `θ = -12.73°..+24.26°` | **`10 – 80 mm`** (`R = 5 – 40 mm`) |
| **Khối lượng kéo gốc** | `160 g` | — | **`160 g`** (1 hàm PA 2: **`~187–197 g`**, tăng `+27.1–36.6 g`; 1 hàm PA 1-Rev2 không khoan: **`~211–225 g`**, tăng `+51.1–65.1 g`) |

### 2.2. Giải thích ngắn gọn 3 ảnh chụp màn hình bản v9 trên điện thoại

Cả 3 ảnh chụp màn hình (`Screenshot_2026-11-19-23-10-30-725`, `...-10-09-969`, `...-10-13-068`) đều ghi lại giao diện bản v9 ở chế độ **`Phương án A`**, **`Cỡ cành: 4.0 cm`**, **`Rộng vỏ: 13 mm`**, góc nhìn **`Cận cảnh dao`**, và đặc biệt nút **`Tách lớp` (Exploded View `75%`) đang bật sáng màu cam**:

- **Vì sao thấy ống đen tách rời khỏi ty bạc (`7.58 mm`) và cụm lưỡi bào xám rơi tụt xuống dưới?** Đó là hiệu ứng dịch chuyển tách lớp (`explode = 0.75`) trong `tool.js:427–456`: hai má vàng văng ra ngoài theo `±Z`, nhưng chiều dài ống lồng bị khống chế theo `stripW` nên hở một khoảng không khí `7.58 mm`, đồng thời `peelGroup` bị đẩy tụt xuống `-6.38 mm` còn `centerGuide` bay lên `+7.88 mm`.
- **Điểm cốt lõi cần cảnh giác:** Ngay cả khi **tắt `Tách lớp` về `0%`**, toàn bộ các lỗi hình học nghiêm trọng vẫn tồn tại y nguyên — cụ thể là: gờ dưới của má ngàm chữ J vẫn đâm xuyên qua mặt thép đặc lưỡi kéo, đai ốc tai hồng M3 vẫn bắt trên thành ống dày chỉ `0.575 mm`, 2 lá dao vẫn đâm xuyên qua nhau `0.65 mm`, và 4 khấc bán nguyệt trên sống lưng vẫn nằm sít nhau không thể khoan cắt thật.

---

## 3. Nguyên Lý Hoạt Động 2 Pha & Tỷ Số Truyền Tay Quay ($\text{MA}_{\text{orbit}}$)

Kéo HM226 gắn con chạy không hoạt động như dao gọt thông thường mà vận hành theo **chu trình cơ học 2 pha liên hoàn** (chiều cắt chính **`+X`** hướng về mũi hàm):

```text
  PHA 1: ÉP RẠCH HƯỚNG KÍNH (Chưa xoay)          PHA 2: XOAY QUỸ ĐẠO 360° (1 hàm) / 180° (2 hàm)
  (Bóp tay cầm định cữ sâu xuống tầng sinh gỗ)     (Duy trì lực bóp nhẹ + quay tay cầm quanh tâm cành)

       Lực bóp tay F_hand = 50–150 N                     ▲ +F_n (Phản lực đẩy bung khi đụng mắt cành)
                  │                                      │     ┌───── Họng Open-Sky mở lên trời vô hạn
                  ▼                                      │     │     (Dải vỏ cuộn thoát tự do lên +Y)
         Lực hàm F_jaw = MA_jaw · F_hand                 │    ╲    ▲
       ┌──────────┴──────────┐                           │     ╲   │  ┌────────┐
       ▼                     ▼                  Dải vỏ   │      ╲  │  │Con chạy│ ◄── Đòn bẩy L = 14.5 mm
   [Lưỡi +Z]             [Lưỡi -Z]             ══════════╪═══════╲═╧══╧════════╝     gây mô-men lật M_o
   Răng cưa rạch đứt sợi vỏ dọc theo 2 đường      28° (`\`) ══════►● E(0, -11)  ───► CHIỀU CẮT (+X)
   song song cách nhau W = 4–18 mm, chạm gỗ dừng lại              F_t (13–313 N; đỉnh 783 N)
   (Chừa rãnh bảo vệ tầng gỗ: cữ DEPTH_GAP = 1.5 mm)             ▼ -F_n (Lực hút ngược vào gỗ do góc 28°)
```

### 3.1. Pha 1 — Cắt rạch song song và thiết lập cữ chiều sâu (Radial Indentation)
- Người dùng đặt hàm cong ôm quanh cành (`D = 10–80 mm`), điểm tiếp xúc nằm tại `c_x = 42.0–60.9 mm` tính từ trục bản lề. Với tâm bàn tay đặt cách bản lề `r_hand ≈ 85 mm`, tỷ số đòn bẩy kìm khi bóp là:
  $$\text{MA}_{\text{jaw}} = \frac{85}{c_x} = 1.39\text{–}2.02\times \quad (\approx 1.70\times \text{ tại } D = 40\text{ mm})$$
- Lực bóp tay bình thường `F_hand = 50–150 N` tạo lực ép lên hai hàm `F_jaw = 70–300 N`. Áp lực tập trung trên `3–6` đỉnh răng cưa đạt `30–60 MPa`, **cắt đứt ngang thớ sợi vỏ (phloem/sclereid)** theo 2 đường tròn song song cách nhau `W = 4–18 mm` cho tới khi chân răng chạm lớp gỗ cứng (`xylem`) và hãm lại.
- Lúc này, mũi lưỡi bào dưới (nằm lùi **`DEPTH_GAP = 1.5 mm`** bên trong đường đỉnh răng tại **`E = (0.0, -11.0) mm`**) tự động nằm đúng tại **mặt trượt tầng sinh gỗ (`cambium`)** — cao hơn bề mặt lõi gỗ **`0.90–1.41 mm`** (khi vỏ dày `2.2 mm`, răng ăn vào gỗ `0.6 mm`) trên **toàn bộ `71/71` cỡ cành `D = 10..80 mm`** để **bóc sạch vỏ mà không phạm gỗ**.

### 3.2. Pha 2 — Xoay quỹ đạo tách vỏ & khuếch đại lực tay quay ($\text{MA}_{\text{orbit}}$)
- Người dùng giữ lực bóp nhẹ (`30–80 N`) để răng cưa bám đường rạch và xoay tay cầm quanh tâm cành (`360°` với 1 hàm Phương án A; `180°` với 2 hàm Phương án C).
- Vì bàn tay quay ở bán kính `R_hand = c_x + 85 = 127–146 mm` trong khi lưỡi bào cắt trên bán kính cành `R = 5–40 mm`, kéo biến thành một **tay quay có tỷ số khuếch đại lực cơ học rất lớn**:
  $$\text{MA}_{\text{orbit}} = \frac{R_{\text{hand}}}{R} = \frac{c_x + 85}{D / 2}$$
  - Tại `D = 10 mm` (`R = 5 mm`, `c_x = 42.0 mm`): $\text{MA}_{\text{orbit}} = \frac{127}{5} = \mathbf{25.4\times}$
  - Tại `D = 20 mm` (`R = 10 mm`, `c_x = 44.7 mm`): $\text{MA}_{\text{orbit}} = \frac{129.7}{10} = \mathbf{13.0\times}$
  - Tại `D = 40 mm` (`R = 20 mm`, `c_x = 50.1 mm`): $\text{MA}_{\text{orbit}} = \frac{135.1}{20} = \mathbf{6.75\times}$
  - Tại `D = 60 mm` (`R = 30 mm`, `c_x = 55.5 mm`): $\text{MA}_{\text{orbit}} = \frac{140.5}{30} = \mathbf{4.68\times}$
  - Tại `D = 80 mm` (`R = 40 mm`, `c_x = 60.9 mm`): $\text{MA}_{\text{orbit}} = \frac{145.9}{40} = \mathbf{3.65\times}$
- **Hệ quả quan trọng:** Chỉ cần người làm vườn đẩy tay cầm với lực nhẹ `80–150 N`, lực tác động thực tế tại mũi lưỡi bào trên cành đã đạt **`290–1,013 N`**. Vì vậy, **con chạy phải được thiết kế chịu tải hàng trăm Newton**, tuyệt đối không thể ước lượng theo lực bóp nhẹ bằng ngón tay.

---

## 4. Bảng Tính Định Lượng Hệ Lực Cắt Trên 5 Kịch Bản Cây Ăn Quả Việt Nam

Trên thực tế, lực cản tiếp tuyến trên một cụm lưỡi bào rộng $W$ cắt vỏ dày $h_b$ gồm 4 thành phần vật lý:
$$F_{t,\text{ổn định}} = \underbrace{k_e W}_{\text{cày mép lưỡi}} + \underbrace{\tau_{\text{camb}} W L_{\text{tách}}}_{\text{tách tầng sinh gỗ}} + \underbrace{0.5\,\tau_{\text{cut}} W h_{\text{chưa rạch}}}_{\text{cắt sợi vỏ sót}} + \underbrace{\frac{\sigma_{y,\text{vỏ}} W (0.65 h_b)^2}{4 R_{\text{cuộn}}}}_{\text{uốn cong dải vỏ}}$$

Khi mũi dao va vào **mắt cành ngủ, sẹo vỏ chai sần hoặc u lồi thân cây**, lực tăng đột ngột theo **hệ số xung động $K_d = 1.4\text{–}2.5$** ($F_{t,\text{đỉnh}} = K_d \cdot F_{t,\text{ổn định}}$). Đồng thời, lực pháp tuyến $F_n$ tác dụng theo **cả hai chiều ngược nhau**:
- **Lực hút vào gỗ ($-F_n$, chiều âm hướng tâm):** Do mặt vát `28°` có góc trước dương lớn ($\gamma = 62^\circ$), khi bóc vỏ trơn ướt ($\mu \approx 0.20$), hợp lực kéo mũi dao cắm sâu xuống lõi gỗ với độ lớn $F_{n,\text{hút}} \approx (0.45\text{–}0.60) F_{t,\text{ổn định}}$.
- **Lực đẩy bung ra ngoài ($+F_n$, chiều dương `+Y`):** Khi mặt thoát sau `22°` trượt cạ lên sẹo gỗ cứng hoặc dải vỏ dày kẹt họng, phản lực đẩy bật con chạy văng khỏi sống lưng đạt tới $F_{n,\text{bung,đỉnh}} \approx 0.90\,F_{t,\text{đỉnh}}$.
- **Lực xòe ngang 2 lưỡi ($F_a$, phương `±Z`):** Do hai lưỡi nêm vào vỏ kết hợp độ giãn ngang Poisson của dải vỏ bị nén ($15\text{–}35\text{ N}$ cộng thêm $0.15\text{–}0.22\,F_t$).
- **Mô-men lật quanh trục khóa sống lưng ($M_o = F_t \cdot L$):** Đánh giá tại cánh tay đòn thực tế `L = 14.5 mm` (tâm trục kẹp `M5` tại `Y = +3.5 mm` trong PA 1-Rev2; với PA 2 xuyên lỗ `Y = -4.5 mm` thì cánh tay đòn thực chỉ còn **`L = 6.5 mm`**), cùng mức tham chiếu `L = 30 mm` / `40 mm` cho các cụm chốt cao cũ.

| Kịch bản & Loại cây ăn quả VN | $W$ (mm) | $h_b$ (mm) | $\tau_{\text{cut}} / \tau_{\text{camb}}$ (MPa) | $K_d$ | $F_t$ Ổn định / **Đỉnh** (N) | $F_n$ Hút vào / **Đẩy bung đỉnh** (N) | $F_a$ Ổn định / **Đỉnh** (N) | $M_o$ @ $L=14.5\text{ mm}$ Ổn định / **Đỉnh** (N·mm) | $M_o$ @ $L=30\text{ mm}$ Ổn định / **Đỉnh** (N·mm) | $M_o$ @ $L=40\text{ mm}$ **Đỉnh** (N·mm) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Vỏ mềm, mỏng, rãnh hẹp**<br>*(Cam, chanh, bưởi tơ)* | 4 | 1.5–2.2 | 3.0 / 0.25 | 1.4 | 13.3 / **18.6** | -7.3 / **+16.7** | 17.0 / **39.1** | 193 / **270** | 399 / **557** | **743** |
| **2. Vỏ mềm/vừa, rãnh rộng**<br>*(Cam già, bưởi trưởng thành)* | 18 | 2.0–3.0 | 4.0 / 0.32 | 1.5 | 85.7 / **128.6** | -47.2 / **+115.7** | 27.9 / **63.3** | 1,243 / **1,865** | 2,571 / **3,858** | **5,144** |
| **3. Vỏ dai nhiều xơ, rãnh hẹp**<br>*(Nhãn, vải, xoài cành nhỏ)* | 4 | 2.5–3.8 | 8.0 / 0.45 | 1.8 | 35.6 / **64.1** | -19.6 / **+57.7** | 20.3 / **49.1** | 516 / **929** | 1,068 / **1,922** | **2,563** |
| **4. Vỏ dai nhiều xơ, rãnh rộng**<br>*(Nhãn, vải, xoài cành lớn)* | 18 | 3.0–4.2 | 9.8 / 0.50 | 2.0 | 201.8 / **403.7** | -111.0 / **+363.3** | 45.3 / **123.8** | 2,926 / **5,854** | 6,054 / **12,110** | **16,146** |
| **5. Vỏ dày xù xì + mắt cành/nhựa**<br>*(Sầu riêng, nhãn cổ thụ)* | 18 | 4.0–5.0 | 12.0 / 0.65 | 2.5 | 313.3 / **783.4** | -172.3 / **+705.0** | 62.0 / **207.3** | 4,543 / **11,359** | 9,399 / **23,501** | **31,334** |

> **Ý nghĩa thiết kế:** Thiết kế cơ khí thực tế không được phép chỉ tính cho trường hợp nhẹ `50–120 N`, mà phải chịu an toàn được vùng cắt vườn phổ biến **`35–202 N`** và sống sót không biến dạng khi đụng mắt vỏ đỉnh **`404–783 N`** (lực đẩy bung **`+363` đến `+705 N`**). Đặc biệt, với xung đỉnh `783.4 N`, vật liệu cột đỡ cổ chữ C Inox 304 ủ (`215 MPa`) chỉ an toàn đến **`≤ 400 N`**; muốn cắt mắt cành sầu riêng/nhãn cổ thụ `783 N` bắt buộc dùng **thép tôi `C45/65Mn` (`≥ 650–850 MPa`) hoặc Inox 304 cán nguội (`≥ 450 MPa`)** kết hợp **PA 2** hoặc **PA 1-Rev2 siết cờ-lê** (chi tiết tại Tài liệu `02`).

---

## 5. Chứng Minh Định Lượng 5 Cơ Chế Thất Bại Của Chốt Lò Xo & Tổng Hợp 9 Lỗi "Chỉ Đẹp Trên 3D"

### 5.1. Năm cơ chế thất bại định lượng của chốt lò xo kéo lên

1. **Cơ chế 1 — Bật trượt chốt khỏi khấc bán nguyệt (`Cam-out Pop-out`):**
   - Để ngón tay ướt/đeo găng rút được núm kéo lên dễ dàng, lực ép ban đầu của lò xo bị giới hạn ở **$F_{\text{lò xo}} = 12\text{–}20\text{ N}$** (với lò xo dây `Ø0.42 mm` / đường kính vòng `Ø2.3 mm`, `5.5` vòng trong `tool.js` chỉ có độ cứng $k \approx 4.6\text{ N/mm}$).
   - Khấc sống lưng trong `tool.js:68–71` là **khấc bán nguyệt** (mép tròn vát góc $\psi = 20^\circ\text{–}45^\circ$ tại vùng tiếp xúc chốt). Dưới tác dụng của lực cắt $F_t$ và độ trơn nhựa cây ($\mu \approx 0.12$), lực đẩy bật chốt lên trên là:
     $$F_{\text{bật,ròng}} = F_t \tan\psi - \mu F_t$$
   - Ở $F_t = 50\text{ N}$ ($\psi = 35^\circ$): $F_{\text{bật,ròng}} = 35.0 - 6.0 = \mathbf{29.0\text{ N}} > 20\text{ N}$ → **tự bật chốt ngay ở tải nhẹ**.
   - Ở $F_t = 120\text{ N}$ ($\psi = 20^\circ\text{–}35^\circ$): $F_{\text{bật,ròng}} = \mathbf{29.3\text{–}69.6\text{ N}}$ (gấp **`1.5–3.5×`** lực lò xo).
   - Ở $F_t = 250\text{–}400\text{ N}$: $F_{\text{bật,ròng}} = \mathbf{61.0\text{–}232.1\text{ N}}$ (gấp **`3–15×`** lực lò xo).
2. **Cơ chế 2 — Đứt cắt chốt `Ø1.1 mm` & bất đối xứng chết trên `backHalf`:**
   - Trong `tool.js:276`, trục chốt chỉ có đường kính `Ø1.1 mm` ($A = 0.95\text{ mm}^2$). Ở $F_t = 400\text{ N}$ (cắt đơn tại má trước), ứng suất cắt đạt **$\tau = 421\text{ MPa}$**; ở đỉnh $783\text{ N}$ đạt **$\tau = 824\text{ MPa}$** — gãy hoặc uốn xoắn chốt tức thì. Hơn nữa `backHalf` có chốt `rearDetent` cố định không nối với núm kéo nên con chạy vẽ trong 3D thực chất không thể trượt qua khấc!
3. **Cơ chế 3 — Độ rơ trượt gây rung & phạm gỗ (*Chatter & Xylem Gouging*):**
   - Chốt `Ø1.1 mm` nằm trong miệng khấc bán nguyệt rộng `2.62–2.91 mm` tạo độ rơ dọc **`1.5–1.8 mm`**. Cộng thêm khe hở dẫn hướng để chốt trượt được (`0.25–0.50 mm`), yên con chạy dài `13.1 mm` rung lắc góc $\pm 1.5^\circ$, làm mũi lưỡi bào dao động độ sâu `±0.4–0.6 mm` — vượt quá vùng an toàn `0.5–0.9 mm` trên tầng gỗ khi bị lực hút `-172 N` kéo xuống → **phạm gỗ làm chết cành**.
4. **Cơ chế 4 — Kẹt cứng bởi nhựa cây & mùn vỏ (*Sap & Latex Seizure*):**
   - Nhựa *xoài, mít, nhãn, bưởi* kết hợp mùn vỏ ẩm chui ngay vào các vòng lò xo lộ thiên và khe trượt `0.05–0.15 mm` trong ống dẫn hướng, nhanh chóng đóng keo khiến chốt không sập hết đáy hoặc kẹt chết không rút lên được.
5. **Cơ chế 5 — Vướng cành nhánh bật mở núm giật:**
   - Núm giật đỏ nhô cao `11.7 mm` phía trên sống lưng đóng vai trò như một cái móc; khi xoay `360°` trong tán cành *cam/nhãn* chật hẹp, chỉ cần lực va quẹt `15–25 N` móc dưới mũ núm là chốt tự mở ngay giữa vòng cắt.

### 5.2. Tổng hợp 9 lỗi "chỉ đẹp trên 3D" (`3D-only fantasies`) của bản v8/v9

| STT | Chi tiết trong v8/v9 (`tool.js` / `app.js` / `thong-so-ky-thuat.md`) | Thực tế vật lý & chế tạo ngoài đời thực |
| :-: | :--- | :--- |
| **1** | **Chốt lò xo kéo lên `Ø1.1 mm` + `rearDetent` chết** (`tool.js:264–376`) | Tự bật văng khỏi khấc (`29–232 N > 12–20 N`), gãy cắt (`421–824 MPa`), kẹt nhựa, má sau không kéo lên được. |
| **2** | **Gờ móc chữ J (`lipMesh`) ở `y = -4.4 mm`** (`tool.js:215–226`) | Bản lưỡi HM226 là thép đặc liên tục từ `y = 0` xuống `-12.5 mm` → gờ móc ở `y = -4.4 mm` **đâm xuyên qua mặt thép đặc**, hoàn toàn không có mép dưới để móc chống nhổ `+Y`! |
| **3** | **Ốc tai hồng `M3` bắt trên thành ống `Ø4.2 / Ø3.05 mm`** (`tool.js:383–417`) | Thành ống chỉ dày `(4.2 - 3.05)/2 = 0.575 mm` → ren `M3` bước `0.5 mm` chỉ ăn **`1.15 vòng ren`**, vặn tay là chờn ren hoặc bóp bẹp ống kẹt ty; lực giữ ướt chỉ `109 N < 124–207 N` ($F_a$). |
| **4** | **2 lá dao chữ L dày `0.95 mm` nhưng dịch pháp tuyến chỉ `0.30 mm`** (`tool.js:89, 95, 470`) | Hai lá thép **đâm xuyên vào nhau `0.65 mm`** trong không gian thực; ngoài đời phải bỏ cơ cấu 2 lá mỏng lệch `0.3 mm` để chuyển sang **Hệ lưỡi bào 2 tầng (liền thân/ghép lớp cho `W=4–10`, T-Anvil + lưỡi phẳng `1.5 mm` cho `W=12–18`)**. |
| **5** | **Chân giá đỡ `0.55 mm` & xuyên lưỡi kéo ở `W = 4 mm`** (`tool.js:464–533`) | Hai chân `0.55 mm` chịu ứng suất uốn **`1,797 MPa`** ở $150\text{ N}$ (gãy ngay), võng `1.29 mm` ở $30\text{ N}$; `earMesh` đâm xuyên lá thép HM226; khe thoát phoi ở `W = 4 mm` bị bóp còn `1.5–1.7 mm` (nhỏ hơn độ dày vỏ `2.2 mm`). |
| **6** | **Ống lồng `Ø4.2 mm` & `Ø2.2 mm` chắn ngang họng thoát phoi** (`tool.js:380–413`) | Đáy ống nằm chỉ cao hơn sống lưng **`+1.1` đến `+1.3 mm`** đúng ngay đường đi của dải vỏ `2.2–5.0 mm` → chặn bít 100% cửa thoát phoi. |
| **7** | **4 khấc bán nguyệt nén trong `14.09 mm`** (`app.js:27–52`, `tool.js:68–71`) | Khoảng cách tâm các khấc chỉ **`5.62 / 4.84 / 3.64 mm`** — nếu dùng chốt `Ø3.5–4.0 mm` sẽ làm thủng vách thép giữa Khấc 3 và Khấc 4 (`-0.36 mm` chồng lỗ!), còn khấc sâu `1.8 mm` làm giảm mô-đun chống uốn của sống dao xuống còn `(9.1/10.9)^2 = 69.7%`. |
| **8** | **Vặn co nhỏ chi tiết `M3` về `Ø1.0–1.1 mm` để đánh lừa tỷ lệ** (`tool.js:320, 521`) | Vẽ ren M3 như đường kính `Ø1.0 mm` và cánh chuồn siêu nhỏ để vừa thân con chạy `12.6 mm`; lắp ốc thật (`M4`/`M5` + đầu tán thật) đòi hỏi không gian & kiểm tra va chạm ốc M5 gốc HM226 tại Khấc 1. |
| **9** | **Hàm dưới `optionC` đặt trùng mặt phẳng `Z` (`zLo = W/2`)** (`app.js:279`) | Trên kéo HM226 thật, hàm dưới và hàm trên xếp chéo kiểu kéo cắt (lệch nhau `1×` bề dày lưỡi `~1.5 mm`), không thể nằm trùng mặt phẳng `Z` nếu không va đập lưỡi ở khớp đóng `D = 10 mm`. |

---

## 6. Chốt Bảng 9 Yêu Cầu Thiết Kế Cơ Khí (MDR-1 đến MDR-9)

Mọi phương án khóa sống lưng, họng thoát phoi và lưỡi bào trong Tài liệu `02` và `03` đều **bắt buộc phải thỏa mãn 100%** 9 tiêu chí định lượng sau (tính với hệ số an toàn $\text{SF} \ge 3.0$ ở vùng tải nặng thường trực):

| Mã | Hạng mục yêu cầu | Ngưỡng định lượng bắt buộc | Mục đích & Điều kiện nghiệm thu |
| :-: | :--- | :--- | :--- |
| **MDR-1** | **Khả năng chịu cắt & mô-men lật** | Tải tiếp tuyến phá hủy **$F_{t,\text{ult}} \ge 1,200\text{ N}$** (mức $\text{SF}=3$ cho `400 N` nặng ổn định; hướng tới `2,400 N` cho đỉnh mắt `783 N`); Mô-men lật **$M_{o,\text{ult}} \ge 36\text{–}70\text{ N}\cdot\text{m}$** (hoặc khóa chống xoay 2 điểm $\text{SF} \ge 2.9\text{–}6\times$). | Tuyệt đối không dùng ma sát trơn đơn thuần hay lò xo `12–20 N`; bắt buộc có **chặn tỳ cơ học (khấc đáy U `r=0.5 mm` + chốt `DIN 1481 Ø3.0 mm` hoặc bu-lông xuyên lỗ PA 2)** và khóa chống xoay 2 chốt trên `Rear C-Throat`. |
| **MDR-2** | **Điều kiện tự hãm & chống nhổ `+Y`** | Góc vách khấc **$\psi \le 0^\circ$** (vách vuông `90°`); lực giữ chống nhổ **`+Y` $\ge 1,400\text{ N}$** (kẹp ép 4 mặt không thất thoát lực preload ở PA 1-Rev2, $\text{SF} \ge 1.99\times$ so với `+705 N`) hoặc khóa cắt **`9,131 N`** (PA 2, $\text{SF} = 13.0\times$). | Không bao giờ dùng "móc ảo" ở `y = -4.4 mm`, và không đặt long đền kê cứng trên đỉnh sống lưng làm mất lực ép kẹp 4 mặt vào lưỡi; lực đẩy bung `+705 N` không thể làm tụt cụm dao. |
| **MDR-3** | **Độ cứng vững & chống phạm gỗ** | Tổng độ rơ hướng kính tại mũi bào **$\le 0.15\text{ mm}$**; độ võng đàn hồi ở $400\text{ N}$ **$\le 0.25\text{ mm}$**; duy trì khoảng an toàn trên gỗ **`0.90–1.41 mm`** trên **71/71 cỡ `D = 10..80 mm`** (mũi cắt `E = (0.0, -11.0) mm`). | Khử sạch độ rơ trượt, chọn bộ vị trí `t_E = [0.375, 0.445, 0.515]` để `peelDist < R` ở mọi đường kính `10–80 mm`, và cấp đúng vật liệu `C45/65Mn` tôi cho tải sầu riêng `783 N`. |
| **MDR-4** | **Khóa khoảng cách ngang (`F_a`)** | Lực giữ chống xòe giữa 2 má **$\ge 630\text{ N}$** ($\text{SF} \ge 3$ cho đỉnh `207 N`); dùng bu-lông **ren suốt `DIN 933`** + **ống đệm nhôm 6061 `Ø8×Ø4.3 mm` + shim căn tinh**. | Không bao giờ siết bu-lông trơn qua khe hở `W` làm bóp méo lưỡi kéo; không dùng `DIN 912` phần thân trơn gây kịch ren ở `W = 12 mm`. |
| **MDR-5** | **Bảo toàn độ bền sống lưỡi HM226** | Giữ **$\ge 74\%$ mô-đun chống uốn** và **vách thép giữa các khấc/lỗ $\ge 3.6\text{–}4.6\text{ mm}$**; góc lượn đáy khấc **$r \ge 0.5\text{ mm}$** (`K_t < 1.8`). | **PA 1-Rev2:** 3 khấc đáy U `1.5 × 3.2 mm` (`r = 0.5 mm`, `74.4%` mô-đun, vách `4.57–4.62 mm`). **PA 2:** lưới 5 lỗ chung `Ø4.2 mm` tại `Y = -4.5 mm` (bước `7.80 mm`, `79.8%` mô-đun, vách `3.60 mm`). |
| **MDR-6** | **Họng thoát phoi thông thoáng tuyệt đối (Open-Sky Vô Hạn)** | Khoảng trống thẳng lên trời `+∞` trên vùng mũi bào `28°` **`X ∈ [-7.5, +5.0] mm`** trống 100%: **0 bu-lông, 0 chốt ngang, 0 cầu nối nằm trong vùng vỏ thoát**. | Chốt cắt `Ø3.0 mm` (PA 1-Rev2) dời ra ngoài vùng `X ∈ [-7.5, +5.0]` tới **`X = +6.5 mm`**; mọi bu-lông sau nằm sau `X ≤ -9.6 mm`; đảm bảo thoát phoi thông thoáng ở cả `W_clear = 2.5–18 mm`. |
| **MDR-7** | **Kháng nhựa cây & chống vướng tán** | **0 lò xo lộ thiên**, **0 núm giật lồi cao** (`nhô ≤ 5 mm` hoặc gọn theo thân má); ren thô dễ lau rửa (`M4` bước `0.7 mm` / `M5` bước `0.8 mm`); tháo vệ sinh `< 30 giây`. | Hoạt động bền bỉ trong vườn *xoài, nhãn, mít, sầu riêng* đầy nhựa dính và chạc cành hẹp. |
| **MDR-8** | **Khối lượng & cân bằng cầm tay** | Khối lượng tăng thêm mục tiêu `≤ 35 g`: **PA 2 đạt `+27.1–36.6 g`** (tổng kéo **`187–197 g`**, đạt chuẩn MDR-8 trên dải cỡ phổ biến); **PA 1-Rev2 (không khoan lưỡi) đánh đổi `+51.1–65.1 g`** (tổng **`211–225 g`**) để đủ độ cứng má kẹp `3.0 mm` + bu-lông `M5/M4` không thất thoát lực kẹp. | Công bố trung thực từng gram theo tỷ trọng thật; ưu tiên **PA 2** cho bản thi đấu KHKT / tải nặng tối ưu khối lượng và **PA 1-Rev2** cho bản DIY không khoan thép tôi. |
| **MDR-9** | **Gọn khe cắt & tương thích cành nhỏ `10–20 mm`** | Vát vát sau `45°` né sạch long đền & ốc tai hồng M5 gốc HM226 ở Khấc 1 (`t_E = 0.375`) dư **`+1.17–1.43 mm`** (tai hồng) và **`+8.17–8.43 mm`** (long đền); không cạ hàm đối diện ở `D = 10 mm`. | Ưu tiên chế tạo nguyên mẫu **1 hàm (Phương án A)** trước để kiểm chứng va chạm hàm và độ lệch kéo cắt HM226. |
