# 03. Hướng Dẫn Chế Tạo Từng Milimét, BOM Việt Nam & Quy Trình Kiểm Thử (Rev 2)

**Mục tiêu tài liệu:** Cung cấp bản vẽ kích thước từng milimét chuẩn chiều cắt **`+X`** (đồng bộ 100% `PROJECT.md` Rev 2 cho cả **PA 2 Chủ lực Thi đấu KHKT** và **PA 1-Rev2 DIY Không khoan lưỡi**), bảng hệ bu-lông **ren suốt `DIN 933`** + **ống đệm nhôm 6061 `Ø8×Ø4.3 mm` + shim**, bảng khối lượng trung thực từng gram, BOM Việt Nam kiểm toán chính xác `100%`, **quy trình gia công DIY an toàn tuyệt đối** (cấm mài ướt 220V, dùng dũa kim cương `r ≥ 0.5 mm`), và quy trình nghiệm thu kéo lực dọc **`+X`**. Lắp thử trên **1 hàm (Phương án A)** trước.

---

## 1. Bản Vẽ Kỹ Thuật ASCII, Tọa Độ & Dung Sai Lắp Ghép (Chuẩn Chiều Cắt `+X`)

### 1.1. Bản vẽ mặt bên (Mặt phẳng `XY` — Chiều cắt chính `→ +X`, Họng thoát phoi Open-Sky mở lên `+Y`)

```text
  (A) KIẾN TRÚC CHỦ LỰC KHKT — PA 2 (XUYÊN LỖ LƯỠI 5 LỖ CHUNG Y=-4.5mm, +27.1..36.6g, 9,131N):

       X=-18.5  -13.2  -9.6   -7.5         0.0      +5.0  +6.0  +9.5  ► +X (CHIỀU CẮT CHÍNH)
          │       │     │      │◄─HỌNG MỞ──│──VÔ HẠN─►│     │     │
    +5.5  │       ┌─────(●)────┴───────────┼──────────┴─────┐     │  ◄── (●) (-9.6,+2.5) M4 chống xoay
          │      ╱│     │   M4 trên        │                ╲     │      (cánh tay đòn d = 7.0 mm)
     0.0 ─┼─────╱─┼─────┼──────────────────┼─────────────────╲────┼═════ Sống lưng HM226 (Y=0)
          │    ╱  │Cổ C │        ▲  Dải vỏ 2.2–5.0 mm         ╲   │
   -1.5   │   ╱   │2.0× │       ╱   cuộn thoát tự do (+Y)      │  │
   -4.5   │  │    │11mm │ (●)──╱───────────┼─────────────(●)───┼──┤  ◄── 2× M4 DIN 933 xuyên lỗ HM226
          │  │    │     │  │  ╱            │              │    │  │      tại X_R=-9.6 & X_F=+6.0, Y=-4.5
   -7.5   │  └─Vát 45°──┴─(X=-7.5)         │             (T-Anvil │      (Mép má sau cách M5 gốc +1.43mm!)
          │       │  (-13.2,-1.5)→(-9.5,-7.5)  28° (`\`)   10 mm) │
  -11.0 ──┼───────┴─────┴────────╲─────────● E(0.0, -11.0)────────┴────► Mũi bào (lùi 1.5mm sau răng)
  -12.5 ──┼───────────────────────╲───────────────────────────────────── Đường đỉnh răng cưa HM226


  (B) KIẾN TRÚC DIY KHÔNG KHOAN — PA 1-REV2 (ĐÒN BẨY 3 ĐIỂM M5/M4 + CHỐT DIN 1481 Ø3.0mm):

       X=-18.5  -15.0  -11.0  -7.5         0.0      +5.0 +6.5 +11.5  +16.0  ► +X (CHIỀU CẮT CHÍNH)
          │       │     │      │◄─OPEN-SKY─│──VÔ HẠN─►│   │    │       │
   +11.5  │       ┌────(●)─────┐           │          │   │   (●)──────┐  ◄── Chốt tựa M4 @ Y=+9.5mm
          │       │   M4 tựa   │  Cầu nối ngoài (Y=+1..+7)│    M4 tựa  │      (Ống Al W_clear+2t_b±0.5)
    +3.5  │       │    (●)─────┴───────────┼──────────┴───┼───(●)──────┤  ◄── Bu-lông chính M5 DIN 933
          │       │  M5 chính  │   ▲ Dải vỏ│              │  M5 chính  │      (X=-11.0 & +11.5, Y=+3.5)
     0.0 ─┼───────┼─────┼──────┼──╱────────┼──────────────┼────┼───────┼════ Sống lưng HM226 (Y=0)
   -0.16  │       │     │Cổ C  │ ╱         │            (●) ◄──┼───────┼── Chốt DIN 1481 Ø3.0 @ (+6.5,-0.16)
   -1.66  │  Vát  │Đệm  │2.0×  │╱          │             └─Khấc đáy U 1.5×3.2, r=0.5mm (X∈[+5,+8])
   -5.0   │  45°  └─────┴──────┤    28°(`\`│)             │    │       │  ◄── Mép dưới tai má & Đệm Al treo
  -11.0 ──┼─────────────┴──────┴───────╲───● E(0.0, -11.0)┴────┴───────┴────► CHIỀU CẮT (+X)
  -12.5 ──┼─────────────────────────────╲─────────────────────────────────── Đỉnh răng cưa (DEPTH_GAP=1.5)
```

*(Ghi chú hình học quan trọng: Ở **PA 1-Rev2**, hai tai má khoét vòm `Y ∈ [-5.0, +11.5] mm`, phần cầu nối nằm ở `X ∈ [-7.5, +6.0] mm, Y ∈ [+1.0, +7.0] mm` ép sát mặt ngoài lá lưỡi nên khe giữa hai lá lưỡi kéo trong vùng `X ∈ [-7.5, +5.0] mm` hoàn toàn trống lên trời `+∞`).*

### 1.2. Bản vẽ mặt cắt ngang (`YZ`) & Cơ cấu Lưỡi bào 2 Tầng (`W = 4–18 mm`)

```text
  (A) PA 2 — CỠ HẸP TẦNG 1 (W_clear = 4 mm, hoặc W_center = 4 mm -> W_clear = 2.5 mm):
      ┌──────┬─────┬────┬────┬─────┬──────┐
      │ Má   │HM226│Ống │Cổ C│HM226│ Má   │   Mỗi lá HM226 = 1.5 mm; Cổ C = 2.0 mm (thép 65Mn/Inox)
      │ngoài │ +Z  │Al  │liền│ -Z  │ngoài │   • W_center = 4 mm (W_clear=2.5): Cổ C 2.0mm liền thân + shim 0.5mm
      │2.0mm │1.5mm│2.0 │2.0 │1.5mm│2.0mm │   • W_clear = 4 mm: Cổ C ghép tấm (2.0+1.5=3.5mm) + ống Al 2.0mm
      └──────┴──┬──┴────┴──┬─┴─────┴──────┘     0 ốc vít trong khe hẹp!
                │          ▼
           Răng cưa   Lưỡi Tầng 1 liền thân/ghép lớp (`2.0–10.0 mm`, `W=4–10 mm` & `12 Case B`)

  (B) PA 2 / PA 1-REV2 — CỠ RỘNG TẦNG 2 (W = 12 Case A, 14, 16, 18 mm):
      ┌──────┬─────┬───────────┬────┬───────────┬─────┬──────┐
      │ Má   │HM226│Ống đệm Al │Cổ C│Ống đệm Al │HM226│ Má   │  • PA 2: Ống Al Ø8×Ø4.3 mm tại Y=-4.5 & +2.5
      │ngoài │ +Z  │ (hoặc tấm │2.0 │ (hoặc tấm │ -Z  │ngoài │  • PA 1-Rev2: Tấm treo Al Y∈[-5,+6] tại X=-11/+11.5
      │2/3mm │1.5mm│ treo Al)  │ mm │ treo Al)  │1.5mm│2/3mm │                + ống Al trên chốt M4 @ Y=+9.5
      └──────┴──┬──┴─────┬─────┴─┬──┴─────┬─────┴──┬──┴──────┘
                │      ┌─┴───────┴────────┴──┐     │
                │      │   Đe T-Anvil 10 mm  │◄────┼── Bắt cưỡi lên chân Cổ C 2.0mm bằng chốt Ø3.0
                │      └───┬─────────────┬───┘     │   2× vít chìm DIN 7991 M2.5/M3 @ X=-5.0mm
                │     ┌────┴─────────────┴────┐    │
                │     │  Lưỡi phẳng SK5 1.5mm │    │   Dài 13.5mm, rãnh U 2.2mm tựa mặt trước cột Cổ C!
                │     └───────────────────────┘
```

### 1.3. Bảng kích thước từng mm & dung sai chi tiết (Đầy đủ PA 2 & PA 1-Rev2)

| Tên chi tiết | Vật liệu chuẩn | Kích thước danh định & Tọa độ (mm) | Dung sai (mm) | Ghi chú lắp ghép & An toàn |
| :--- | :--- | :--- | :---: | :--- |
| **01A. Má kẹp PA 2** (`2` tấm giống nhau) | Inox 304 dày `2.0 mm` | `X ∈ [-13.2, +9.5]`, `Y ∈ [-7.5, +5.5]`, vát sau `(-13.2, -1.5) → (-9.5, -7.5)`; **3 lỗ `Ø4.2 mm`** tại `(-9.6, -4.5)`, `(+6.0, -4.5)`, `(-9.6, +2.5)` | Bao `±0.2`; Tâm lỗ `±0.10`; `Ø4.2(+0.1/-0)` | Mép vát sau cách tâm M5 HM226 ở Vị trí 1 tới `13.43 mm` (dư `+8.43 mm` long đền / `+1.43 mm` tai hồng). |
| **01B. Má kẹp PA 1-Rev2** (`2` tấm khoét vòm) | Inox 304 dày **`3.0 mm`** | `X ∈ [-15.0, +16.0]`, hai tai `Y ∈ [-5.0, +11.5]` (`b_tai = 20`), cầu nối `Y ∈ [+1.0, +7.0]`, vát `45°` `(-15.0, +0.5) → (-9.5, -5.0)`; lỗ **`2× Ø5.3`** `(-11.0, +3.5)` & `(+11.5, +3.5)`; **`2× Ø4.2`** `(-11.0, +9.5)` & `(+11.5, +9.5)`; **`1× Ø3.0`** `(+6.5, -0.16)` | Bao `±0.2`; Tâm lỗ `±0.08`; Lỗ chốt `Ø3.0(+0.05/-0)` | Bắt buộc dày `3.0 mm` để $\sigma_{\text{má}} = 212.0 < 215\text{ MPa}$ khi siết M5 `2,800 N`; mép vát sau cách tâm M5 HM226 `13.17 mm` (dư `+8.17 / +1.17 mm`). |
| **02. Cổ chữ C phía sau (`Rear C-Throat`)** | **Inox 304** `2.0 mm` *(cắt `≤ 400 N`)* hoặc **Thép `65Mn/C45` tôi** `2.0 mm` *(sốc `783 N`)* | Cột đứng **`b = 2.0 × h = 11.0 mm`** tại `X ∈ [-18.5, -7.5]`, chân vươn tới `E = (0.0, -11.0)` với mặt tựa `28°` (`\`). **PA 2:** có 2 lỗ `Ø4.2` tại `(-9.6, -4.5)` & `(-9.6, +2.5)`. **PA 1-Rev2:** có 2 lỗ `Ø5.3` `(-11.0, +3.5)` & `Ø4.2` `(-11.0, +9.5)` + tai vát né M5 ở `Y = -11..-5` | Dày `2.0 ± 0.05`; Góc `28° ± 0.5°` | Khóa **2 điểm** chống xoay `100%`. Inox 304 ủ trên PA 1-Rev2 giới hạn `≤ 400 N` (`143.8 MPa`); dùng `65Mn/C45` cho mắt sầu riêng `783 N` (`313.7 MPa`). |
| **03A. Lưới 5 lỗ PA 2 trên HM226** | Khoan trên 2 lá lưỡi HM226 | **5 lỗ `Ø4.2 mm`** tại **`Y = -4.5 mm`**, bước **`7.80 mm`**, cung sống lưng: **`25.97 / 33.74 / 41.56 / 49.34 / 57.16 mm`** (`t = 0.2874..0.5686`) | Tâm lỗ `±0.10`; `Ø4.2(+0.1/-0)` | Vách thép giữa 2 lỗ `3.60 mm`, giữ **`79.8%`** mô-đun uốn. Vị trí 1 dùng Lỗ 1&3, Vị trí 2 dùng 2&4, Vị trí 3 dùng 3&5. |
| **03B. 3 khấc đáy U PA 1-Rev2 trên HM226** | Cắt mài trên sống lưng HM226 | **3 khấc đáy U** (`r = 0.5 mm`, vách `90°`, $\psi = 0^\circ$), **`1.50 mm` sâu × `3.20 mm` rộng** (`Y_floor = -1.66 mm`) tại cung **`42.07 / 49.84 / 57.66 mm`** (`t_notch = 0.4336 / 0.5032 / 0.5731`) | Sâu `1.5 ± 0.1`; Rộng `3.2(+0.15/-0)` | Khớp chốt ống `DIN 1481 Ø3.0 mm` tại `(+6.5, -0.16) mm` (`0.00 mm` va chạm), đặt mũi bào `E` đúng tại `t_E = [0.375, 0.445, 0.515]`, vách `4.57–4.62 mm`, giữ `74.4%` mô-đun. |
| **04. Hệ lưỡi bào 2 tầng (`4–18 mm`)** | **Tầng 1:** Tấm `65Mn/SK5` `1.5–2.0 mm`<br>**Tầng 2:** Đe `T-Anvil` `10 mm` + Lưỡi `SK5/HSS 1.5 mm` | • **Tầng 1 (`W = 4–10` & `12 Case B`):** Cổ C liền thân hoặc ghép lớp `2.0–10.0 mm` (khe `0.2–0.25 mm/bên`)<br>• **Tầng 2 (`W = 12 Case A, 14–18`):** Đe `T-Anvil 10.0 mm` (rãnh `2.1 mm`, chốt `Ø3.0 mm`) + lưỡi phẳng **`L = 13.5 mm`, dày `1.5 mm`**, rãnh U sau `2.2 mm` tựa cột `X = -7.5`, kẹp bằng `2×` vít chìm `DIN 7991 M2.5/M3` @ `X = -5.0 mm` | Rộng lưỡi `W - 0.4 mm` (`±0.15`); Vát đơn `28°` | Không khoan `Ø4.2 mm` vào lưỡi `3.6 mm`; không dùng dao trổ `0.7 mm` vát cạnh dài hay khò uốn `26 mm`. Chiều dài `13.5 mm` phẳng từ phôi lưỡi bào gỗ mini / cưa máy. |
| **05. Bu-lông `DIN 933` & Đệm Al 6061** | Inox 304 **ren suốt `DIN 933`** + Nhôm `6061` + Thép `65Mn` (`DIN 1481`) | • **PA 2:** `M4 × 30` (`W=4–10`) / `M4 × 35` (`W=12–18`) + Nyloc `M4` + Ống Al `Ø8×Ø4.3` + shim<br>• **PA 1-Rev2:** `M5 × 30/35/40` + Nyloc `M5` + `M4 × 30/35/40` + Tấm treo Al `Y∈[-5,+6]` (`1/2/4 mm`) + chốt `DIN 1481 Ø3.0×20/28 mm` | Ống & shim `±0.08`; Ren suốt `100%` | Cấm dùng `DIN 912` phần thân trơn gây kịch ren ở `W = 12 mm`. Nylon/POM chỉ chịu tải `≤ 1,500 N`, bắt buộc dùng **Al 6061** cho siết cờ-lê. |

### 1.4. Bảng tra ống đệm Nhôm 6061 (`Ø8 × Ø4.3 mm`) + shim & chiều dài bu-lông `DIN 933` ren suốt (`W = 4–18 mm`)

*(Bộ ống đệm chuẩn có sẵn `2 / 4 / 6 / 8 / 10 mm` + long đền `0.8 mm` + shim tinh `0.5 mm`; sai số cộng dồn giảm `13×` từ `±2.00 mm` xuống `±0.15 mm`)*:

| Bề rộng `W` (mm) | **PA 2 (`Case A: W_clear = W`)**<br>*Cổ C `2.0 mm` ở trục sau; `t_blade = 1.5 mm`* | **PA 2 (`Case B: W_clear = W - 1.5 mm`)** | **PA 1-Rev2 (`Case A: W_clear = W`)**<br>*Tấm treo Al ở `M5`; ống Al ở chốt tựa `M4` trên* | Lưỡi bào Tầng 1 / Tầng 2 (`Case A`) | Bu-lông `DIN 933` ren suốt (`PA 2` / `PA 1-Rev2`) |
| :-: | :--- | :--- | :--- | :---: | :---: |
| **4** | **Sau dưới:** `2.0CT + [2]` (`4.0`)<br>**Trước dưới:** `[4]` (`4.0`)<br>**Sau trên (`Y=+2.5`):** `2.0CT + [4] + 2×0.5` (`7.0`) | `W_clear = 2.5`:<br>Sau dưới `2.0CT + 0.5`; Trước `[2]+0.5`; Sau trên `2.0CT + [2]+1×0.8+0.5` (`5.3`) | **Tấm treo M5 sau/trước:** `2.0CT + 2` / `4` (`4.0`)<br>**Ống M4 trên:** Sau `2.0CT+[4]+2×0.5`; Trước `[6]+2×0.5` (`7.0`) | **Tầng 1:** `3.5 mm` *(ghép `2.0+1.5`)* *(Case B: `2.0`)* | `M4×30` / `M5×30 + M4×30` (`DIN 1481 Ø3×20`) |
| **6** | **Sau dưới:** `2.0CT + [4]` (`6.0`)<br>**Trước dưới:** `[6]` (`6.0`)<br>**Sau trên:** `2.0CT + [6] + 2×0.5` (`9.0`) | `W_clear = 4.5`:<br>Sau dưới `2.0CT+[2]+0.5`; Trước `[4]+0.5`; Sau trên `2.0CT+[4]+0.8+0.5` | **Tấm treo M5:** Sau `2.0CT + 4` / Trước `4+2` (`6.0`)<br>**Ống M4 trên:** Sau `2.0CT+[6]+2×0.5`; Trước `[8]+2×0.5` (`9.0`) | **Tầng 1:** `5.5 mm` *(ghép `2.0+1.5+2.0`)* | `M4×30` / `M5×30 + M4×30` (`DIN 1481 Ø3×20`) |
| **8** | **Sau dưới:** `2.0CT + [6]` (`8.0`)<br>**Trước dưới:** `[8]` (`8.0`)<br>**Sau trên:** `2.0CT + [8] + 2×0.5` (`11.0`) | `W_clear = 6.5`:<br>Sau dưới `2.0CT+[4]+0.5`; Trước `[6]+0.5`; Sau trên `2.0CT+[6]+0.8+0.5` | **Tấm treo M5:** Sau `2.0CT + 4+2` / Trước `4+4` (`8.0`)<br>**Ống M4 trên:** Sau `2.0CT+[8]+2×0.5`; Trước `[10]+2×0.5` (`11.0`) | **Tầng 1:** `7.5 mm` *(ghép `2.0+2.0+2.0+1.5`)* | `M4×30` / `M5×30 + M4×30` (`DIN 1481 Ø3×20`) |
| **10** | **Sau dưới:** `2.0CT + [8]` (`10.0`)<br>**Trước dưới:** `[10]` (`10.0`)<br>**Sau trên:** `2.0CT + [10] + 2×0.5` (`13.0`) | `W_clear = 8.5`:<br>Sau dưới `2.0CT+[6]+0.5`; Trước `[8]+0.5`; Sau trên `2.0CT+[8]+0.8+0.5` | **Tấm treo M5:** Sau `2.0CT + 4+4` / Trước `4+4+2` (`10.0`)<br>**Ống M4 trên:** Sau `2.0CT+[10]+2×0.5`; Trước `[10+2]+2×0.5` (`13.0`) | **Tầng 1:** `9.5 mm` *(ghép 5 tấm `2.0/1.5`)* | `M4×30` / `M5×30 + M4×30` (`DIN 1481 Ø3×20`) |
| **12** | **Sau dưới:** `2.0CT + [10]` (`12.0`)<br>**Trước dưới:** `[10+2]` (`12.0`)<br>**Sau trên:** `2.0CT + [10+2] + 2×0.5` (`15.0`) | `W_clear = 10.5`:<br>Sau dưới `2.0CT+[8]+0.5`; Trước `[10]+0.5`; Sau trên `2.0CT+[10]+0.8+0.5` | **Tấm treo M5:** Sau `2.0CT + 10` / Trước `12` (`12.0`)<br>**Ống M4 trên:** Sau `2.0CT+[10+2]+2×0.5`; Trước `[10+4]+2×0.5` (`15.0`) | **Tầng 2 (`Case A`):** `T-Anvil 10` + **`11.6 mm`** (`M2.5`) *(Case B: Tầng 1 `10.0 mm`)* | `M4×35` / `M5×35 + M4×35` (`DIN 1481 Ø3×24`) |
| **14** | **Sau dưới:** `2.0CT + [10+2]` (`14.0`)<br>**Trước dưới:** `[10+4]` (`14.0`)<br>**Sau trên:** `2.0CT + [10+4] + 2×0.5` (`17.0`) | `W_clear = 12.5`:<br>Sau dưới `2.0CT+[10]+0.5`; Trước `[10+2]+0.5`; Sau trên `2.0CT+[10+2]+0.8+0.5` | **Tấm treo M5:** Sau `2.0CT + 12` / Trước `14` (`14.0`)<br>**Ống M4 trên:** Sau `2.0CT+[10+4]+2×0.5`; Trước `[10+6]+2×0.5` (`17.0`) | **Tầng 2:** `T-Anvil 10` + **`13.6 mm`** (`M2.5/M3`) | `M4×35` / `M5×35 + M4×35` (`DIN 1481 Ø3×24`) |
| **16** | **Sau dưới:** `2.0CT + [10+4]` (`16.0`)<br>**Trước dưới:** `[10+6]` (`16.0`)<br>**Sau trên:** `2.0CT + [10+6] + 2×0.5` (`19.0`) | `W_clear = 14.5`:<br>Sau dưới `2.0CT+[10+2]+0.5`; Trước `[10+4]+0.5`; Sau trên `2.0CT+[10+4]+0.8+0.5` | **Tấm treo M5:** Sau `2.0CT + 14` / Trước `16` (`16.0`)<br>**Ống M4 trên:** Sau `2.0CT+[10+6]+2×0.5`; Trước `[10+8]+2×0.5` (`19.0`) | **Tầng 2:** `T-Anvil 10` + **`15.6 mm`** (`M3`) | `M4×35` / `M5×40 + M4×40` (`DIN 1481 Ø3×28`) |
| **18** | **Sau dưới:** `2.0CT + [10+6]` (`18.0`)<br>**Trước dưới:** `[10+8]` (`18.0`)<br>**Sau trên:** `2.0CT + [10+8] + 2×0.5` (`21.0`) | `W_clear = 16.5`:<br>Sau dưới `2.0CT+[10+4]+0.5`; Trước `[10+6]+0.5`; Sau trên `2.0CT+[10+6]+0.8+0.5` | **Tấm treo M5:** Sau `2.0CT + 16` / Trước `18` (`18.0`)<br>**Ống M4 trên:** Sau `2.0CT+[10+8]+2×0.5`; Trước `[10+10]+2×0.5` (`21.0`) | **Tầng 2:** `T-Anvil 10` + **`17.6 mm`** (`M3`) | `M4×35` / `M5×40 + M4×40` (`DIN 1481 Ø3×28`) |

*(Cảnh báo vật liệu đệm: Ống **Nhôm 6061 (`σ_y = 145–276 MPa`)** chịu ứng suất nén `69.9 MPa` đạt **`SF = 2.1–3.9×`** không chảy lún. Tuyệt đối **KHÔNG dùng ống đệm nhựa Nylon/POM** nếu siết cờ-lê `2,500–3,000 N` vì nhựa sẽ bị bẹp chảy từ biến `> 1,500 N`).*

---

## 2. Bảng Khối Lượng Trung Thực Từng Gram (PA 2 vs. PA 1-Rev2)

Tính chính xác từ thể tích hình học thực tế và khối lượng riêng tiêu chuẩn ($\rho_{\text{Inox304}} = 7.93\text{ g/cm}^3$, $\rho_{\text{SK5/65Mn}} = 7.85\text{ g/cm}^3$, $\rho_{\text{Al6061}} = 2.70\text{ g/cm}^3$):

| Thành phần cụm con chạy (1 hàm — Phương án A) | **PA 2 (Khuyến nghị KHKT — `W = 4` / `18 mm`)** | **PA 1-Rev2 (DIY Không khoan — `W = 4` / `18 mm`)** |
| :--- | :---: | :---: |
| **02 Má kẹp ngoài (Inox 304)** | **`7.20 g`** (`2.0 mm`, `227 mm²` thực/má) | **`17.87 g`** (`3.0 mm` khoét vòm `375 mm²`/má) |
| **Khối Cổ chữ C (`Rear C-Throat 2.0×11.0 mm`)** | **`3.80 g`** (`240 mm²`) | **`5.23 g`** (`330 mm²` có tai vươn tới `M4 +9.5`) |
| **Cụm lưỡi bào & đe (`Tầng 1` ở `W=4` / `Tầng 2` ở `W=18`)** | **`0.61 g`** *(thép phụ `1.5 mm`)* / **`5.37 g`** *(`T-Anvil 1.85` + lưỡi `2.64` + vít `0.88`)* | **`0.61 g`** / **`5.37 g`** *(dùng chung hệ lưỡi 2 tầng)* |
| **Hệ bu-lông ren suốt `DIN 933` + Đai ốc Nyloc + Long đền ngoài** | `3× M4×30/35` (`9.50` / `10.61 g`) + `3× Nyloc` (`3.06 g`) + `6× FW` (`1.87 g`) = **`14.43 g` / `15.54 g`** | `2× M5×30/35` (`10.16` / `11.40 g`) + `2× Nyloc M5` (`3.30 g`) + `4× FW M5` (`1.79 g`) + `2× M4×30/35` (`6.34` / `7.38 g`) + `2× Nyloc M4` (`2.04 g`) + `4× FW M4` (`1.24 g`) = **`24.87 g` / `27.15 g`** |
| **Chốt cắt `DIN 1481 Ø3.0 mm` (65Mn)** | `0.00 g` *(không dùng)* | **`0.46 g`** (`L = 13 mm`) / **`0.96 g`** (`L = 27 mm`) |
| **Ống đệm Al 6061 (`0.0965 g/mm`) + Tấm treo Al & Shim** | **`1.06 g`** (`11 mm`) / **`4.69 g`** (`48.6 mm`) | **`2.06 g`** (`0.71` treo + `1.35` ống) / **`8.08 g`** (`4.03` treo + `4.05` ống) |
| **TỔNG KHỐI LƯỢNG TĂNG THÊM (1 HÀM)** | **`+27.1 g` (`W = 4`) → `+36.6 g` (`W = 18`)** *(Đạt chuẩn `MDR-8 ≤ 35 g`)* | **`+51.1 g` (`W = 4`) → `+65.1 g` (`W = 18`)** *(Đánh đổi do không khoan)* |
| **TỔNG KHỐI LƯỢNG KÉO HOÀN CHỈNH (`160 g` + Con chạy)** | **`187.1 g` – `196.6 g`** | **`211.1 g` – `225.1 g`** |

---

## 3. Bảng Danh Mục Vật Tư (BOM) Việt Nam Kiểm Toán Chính Xác 100%

### 3.1. BOM Lộ Trình DIY — PA 2 (Khuyến nghị KHKT / Khoan 5 lỗ HM226)
| STT | Vật tư & Quy cách chuẩn | ĐVT | SL | Đơn giá (VNĐ) | Thành tiền (VNĐ) | Nơi mua thực tế tại VN |
| :-: | :--- | :-: | :-: | ---: | ---: | :--- |
| 1 | Tấm Inox 304 dày `2.0 mm` (`100 × 150 mm`, cắt 2 má kẹp + Cổ C tải `≤ 400 N`) | Tấm | 1 | `30.000` | `30.000` | Shopee VN / Chợ Trời / Tạ Uyên |
| 2 | Thép lá `65Mn/C45` tôi dày `2.0 mm` (làm Cổ C & Tầng 1 chịu sốc sầu riêng `783 N`) | Tấm | 1 | `25.000` | `25.000` | Shopee VN / Tiệm cơ khí |
| 3 | **Lưỡi bào gỗ mini `SK5/HSS` (`82 × 29 × 1.5 mm`)** *(phôi làm lưỡi Tầng 1 & Tầng 2)* | Cái | 2 | `22.000` | `44.000` | Shopee VN / Cửa hàng dụng cụ mộc |
| 4 | Phôi T-Anvil `10 mm` (Al 6061/Inox) + Chốt `Ø3.0×10` + `8` vít `DIN 7991 M2.5/M3×6` | Bộ | 1 | `23.000` | `23.000` | Shopee VN / Kim khí |
| 5 | Bu-lông **ren suốt `DIN 933`** Inox 304 **`M4 × 30 mm`** (`W = 4–10 mm`) | Con | 4 | `1.500` | `6.000` | Shopee VN / Kim khí |
| 6 | Bu-lông **ren suốt `DIN 933`** Inox 304 **`M4 × 35 mm`** (`W = 12–18 mm`) | Con | 4 | `1.800` | `7.200` | Nt. |
| 7 | Đai ốc khóa nhựa **`Nyloc DIN 985 M4`** Inox 304 | Con | 6 | `1.000` | `6.000` | Nt. |
| 8 | **Ống đệm nhôm 6061 (`Ø8 × Ø4.3 mm`)** bộ `12` ống (`2/4/6/8/10 mm`) | Ống | 12 | `1.500` | `18.000` | Shopee VN *("ống đệm nhôm M4 Ø8")* |
| 9 | Long đền phẳng `M4 × 0.8 mm` (`15` cái) + Shim căn tinh `M4 × 0.5 mm` (`10` cái) | Cái | 25 | `300` | `7.500` | Shopee VN / Kim khí |
| 10 | Mũi khoan **Cobalt `Ø4.2 mm`** + mũi mồi `Ø3.2 mm` + nhám nước `P400/P800` | Bộ | 1 | `55.000` | `55.000` | Shopee VN / Kim khí |
| **TỔNG** | **Tổng chi phí mua sắm DIY — PA 2 (1 hàm)** | — | — | — | **`221.700 đ`** | *(Chưa gồm kéo HM226 gốc `~130–180k`)* |

### 3.2. BOM Lộ Trình DIY — PA 1-Rev2 (Không khoan lưỡi HM226)
| STT | Vật tư & Quy cách chuẩn | ĐVT | SL | Đơn giá (VNĐ) | Thành tiền (VNĐ) | Nơi mua thực tế tại VN |
| :-: | :--- | :-: | :-: | ---: | ---: | :--- |
| 1 | Tấm Inox 304 dày **`3.0 mm`** (`100 × 100 mm`, cắt 2 má kẹp khoét vòm) | Tấm | 1 | `30.000` | `30.000` | Shopee VN / Chợ Trời / Tạ Uyên |
| 2 | Tấm Inox 304 `2.0 mm` / Thép `65Mn` `2.0 mm` (làm Cổ C `h = 11 mm` + Tầng 1) | Tấm | 1 | `30.000` | `30.000` | Nt. |
| 3 | **Lưỡi bào gỗ mini `SK5/HSS` (`82 × 29 × 1.5 mm`)** hoặc lưỡi cưa máy `HSS 1.6 mm` | Cái | 2 | `22.000` | `44.000` | Shopee VN / Dụng cụ mộc |
| 4 | Phôi T-Anvil `10 mm` + Chốt `Ø3×10` + Vít `M2.5/M3` + Tấm Al 6061 `1/2/4 mm` làm đệm treo | Bộ | 1 | `35.000` | `35.000` | Shopee VN |
| 5 | **Chốt ống đàn hồi `DIN 1481` `Ø3.0×20` & `Ø3.0×28 mm`** (thép `65Mn`) | Con | 4 | `2.000` | `8.000` | Shopee VN *("chốt chẻ đàn hồi M3")* |
| 6 | Bộ bu-lông **ren suốt `DIN 933` `M5×30/35/40`** (mỗi cỡ 2) + `4` Nyloc `M5` + `6` FW `M5` | Bộ | 1 | `22.000` | `22.000` | Shopee VN / Kim khí |
| 7 | Bộ bu-lông **ren suốt `DIN 933` `M4×30/35/40`** (mỗi cỡ 2) + `4` Nyloc `M4` + `6` FW `M4` | Bộ | 1 | `18.000` | `18.000` | Nt. |
| 8 | Ống đệm Al 6061 `Ø8×Ø4.3` (`10` ống) + `2` ốc tai hồng `M5` *(chỉ dùng cành cam/chanh `≤120 N`)* | Bộ | 1 | `20.000` | `20.000` | Nt. |
| 9 | **Bộ dũa kim cương mini `3–4 mm` (vuông + tròn)** + Mũi Cobalt `Ø5.3 / 4.2 / 3.0 mm` | Bộ | 1 | `65.000` | `65.000` | Shopee VN *("dũa kim cương mini")* |
| 10 | Đá cắt sắt mỏng `100 × 1.2 mm` (1 viên) + Giấy nhám nước `P400 & P800` (2 tờ) | Bộ | 1 | `10.000` | `10.000` | Tiệm điện nước địa phương |
| **TỔNG** | **Tổng chi phí mua sắm DIY — PA 1-Rev2 (1 hàm)** | — | — | — | **`282.000 đ`** | *(Không cần khoan thủng lưỡi HM226)* |

### 3.3. BOM Lộ Trình Laser Fiber CNC (01 Nguyên Mẫu vs. Lô 05 Nguyên Mẫu)
| Phương án | Hạng mục chi phí tại xưởng Laser VN | 01 nguyên mẫu (VNĐ) | Lô 05 nguyên mẫu (VNĐ) |
| :--- | :--- | :---: | :---: |
| **PA 2 (Khuyến nghị KHKT)** | Phí mở máy Laser (`Inox 304 2.0 mm` + `65Mn 2.0 mm` + `SK5 1.5 mm`) + T-Anvil | `150.000 đ` | `280.000 đ` |
| | Phôi Inox 304 + Thép `65Mn/SK5` + T-Anvil | `35.000 đ` | `140.000 đ` |
| | Bộ ốc `DIN 933 M4` + `Nyloc` + `12` ống đệm Al + `25` shim + vít `M2.5/M3` | `55.000 đ` | `200.000 đ` |
| | Mũi khoan Cobalt `Ø4.2 mm` (hoặc khoét EDM 5 lỗ HM226) + nhám `P400/P800` | `40.000 đ` | `55.000 đ` |
| | **TỔNG PA 2 LASER CNC** | **`280.000 đ`** | **`675.000 đ` (`135.000 đ/bộ`)** |
| **PA 1-Rev2 (Không khoan)** | Phí mở máy Laser (`Inox 304 3.0 mm` + `65Mn 2.0 mm` + Đệm treo Al `1/2/4` + `SK5 1.5`) | `160.000 đ` | `300.000 đ` |
| | Phôi Inox 304 `3.0 mm` + Thép `65Mn` + Nhôm `6061` | `45.000 đ` | `180.000 đ` |
| | Bộ ốc `DIN 933 M5/M4` + `Nyloc` + Chốt `DIN 1481 Ø3.0` + Ống Al + Vít `M2.5/M3` | `65.000 đ` | `240.000 đ` |
| | Bộ dũa kim cương mini `3–4 mm` + Đá cắt `1.2 mm` + Nhám `P400/P800` | `35.000 đ` | `45.000 đ` |
| | **TỔNG PA 1-REV2 LASER CNC** | **`305.000 đ`** | **`765.000 đ` (`153.000 đ/bộ`)** |

---

## 4. Quy Trình Chế Tạo DIY An Toàn Tuyệt Đối (Cấm Mài Ướt 220V!) & Lộ Trình Laser CNC

### 4.1. CẢNH BÁO AN TOÀN ĐIỆN & DỤNG CỤ BẮT BUỘC (Sửa lỗi quy trình nguy hiểm cũ)
1. **NGHIÊM CẤM TUYỆT ĐỐI việc nhỏ nước hoặc dầu làm mát trực tiếp lên lưỡi cắt khi máy mài góc 220V đang quay:** Nước văng vào cổ góp/công tắc máy cầm tay 220V gây nguy cơ **điện giật chết người**, còn dầu cắt bốc sương trên đá mài nhựa gây cháy nổ.
2. **LOẠI BỎ dũa sắt thường khi gia công thép tôi HM226 (`52–56 HRC`):** Dũa thép cacbon thông thường trượt trơn ngay lập tức và mòn trơ răng; **bắt buộc dùng bộ dũa kim cương mini `3–4 mm` (`Diamond Needle File`)**.

### 4.2. Quy trình gia công chuẩn theo 2 phương án
1. **Bước 1 — Gia công định vị trên lưỡi HM226 (chọn 1 trong 2 phương án):**
   - **Nếu làm PA 2 (5 lỗ `Ø4.2 mm` tại `Y = -4.5 mm`):** Đóng dấu tâm bằng mũi đột hợp kim tại 5 điểm cách sống lưng `4.5 mm` (cung `25.97 / 33.74 / 41.56 / 49.34 / 57.16 mm`). Kẹp chặt cả 2 lá lưỡi lên bàn khoan tốc độ chậm (`400–600 vòng/phút`), nhỏ dầu cắt lên mũi khoan **Cobalt / hợp kim `Ø4.2 mm`** khoan dứt khoát (hoặc thuê xưởng bắn lỗ EDM/Laser hết `~30–40k`).
   - **Nếu làm PA 1-Rev2 (3 khấc đáy U `1.5 × 3.2 mm` tại cung `42.07 / 49.84 / 57.66 mm` — SOP AN TOÀN):**
     - **Cách ưu tiên (Dùng pin điện áp thấp):** Dùng **máy mài khuôn dùng pin `12V–18V` gắn đĩa cắt kim cương `Ø22–32 mm`** cắt nhẹ đúng chiều sâu `1.2 mm`, không giật điện.
     - **Cách dùng máy mài góc 220V (Giao thức Xung Khô 1 Giây):** Kẹp chặt hàm kéo vào ê-tô; đặt một **cốc nước nguội cách xa máy mài và dây điện `≥ 50 cm`**. Chỉ chạm đá cắt `1.2 mm` đúng **`1 giây/lần` rồi nhấc máy ra**. Muốn làm mát, **tắt hẳn công tắc & đặt máy xuống giá đỡ (rút phích cắm nếu nhúng nước)** rồi mới lau giẻ ẩm vắt kiệt hoặc nhúng phần thép vào cốc nước ngoài máy (`< 60°C`).
     - **Hoàn thiện đáy U `r ≥ 0.5 mm`:** Dùng **dũa kim cương vuông và tròn `3–4 mm`** dũa hai vách đứng vuông `90°` ($\psi = 0^\circ$) và **bo tròn hai góc đáy `r ≥ 0.5 mm`** (giảm hệ số tập trung ứng suất $K_t$ từ `~3.5` xuống `< 1.8`), ướm thử chốt ống `DIN 1481 Ø3.0 mm` lọt khít không rơ ngang.
2. **Bước 2 — Cắt & khoan `2` má ngoài + Cổ chữ C `Rear C-Throat`:**
   - Kẹp chập `2` tấm má ngoài (`2.0 mm` cho PA 2; `3.0 mm` cho PA 1-Rev2) khoan đồng thời bằng mũi `Cobalt` tốc độ chậm + vát góc `45°` ở góc sau dưới để né ốc M5 gốc HM226.
   - Đặt thử Cổ chữ C + lưỡi bào lên thước lá **`1.50 mm`** tỳ sát đường đỉnh răng cưa HM226 rồi mới chấm dấu khoan 2 lỗ chống xoay trên cổ chữ C (đảm bảo `DEPTH_GAP = 1.50 mm` chính xác tuyệt đối).
   - **Lưu ý gia công Laser CNC:** Xuất `.DXF` bù mạch cắt `0.15 mm`, cắt bằng **khí Nitơ**; **KHÔNG chấn gấp 2 má liền thành hình chữ U** để giữ khả năng điều chỉnh `W = 4–18 mm`.
3. **Bước 3 — Gia công hệ lưỡi bào 2 tầng (Không dùng dao rọc giấy `0.7 mm`):**
   - **Tầng 1 (`W = 4–10` & `12 Case B`):** Cắt liền cụm hoặc ghép chập tấm `1.5 mm` + `2.0 mm` xuyên chung 2 chốt cột + chốt chân `Ø3.0 mm`.
   - **Tầng 2 (`W = 12 Case A, 14–18 mm`):** Cắt phẳng đoạn dài **`13.5 mm`** từ phôi **lưỡi bào gỗ mini SK5 (`1.5 mm`)** hoặc **lưỡi cưa máy HSS (`1.6 mm`)** theo bề rộng `W - 0.4 mm`; xẻ rãnh chữ U rộng `2.2 mm` ở đuôi tựa vào cột Cổ chữ C; khoan 2 lỗ vát loa `90°` tại `X = -5.0 mm` bắt vít chìm `DIN 7991 M2.5/M3` xuống đe `T-Anvil 10 mm`.
   - Mài tạo vát đơn **`28°`** bằng **giao thức xung khô 1 giây** (chỉ nhúng riêng lưỡi dao rời vào cốc nước cách xa máy mài), rồi rà tinh trên giấy nhám nước `P400 → P800` đặt trên mặt kính phẳng.
4. **Bước 4 — Lắp ráp đúng thứ tự & siết lực:**
   - Chọn ống đệm Al 6061 (hoặc tấm treo Al ở PA 1-Rev2) theo **Bảng 1.4**.
   - Với **PA 1-Rev2**: gài chốt `DIN 1481 Ø3.0 mm` vào khấc tương ứng, vặn nhẹ vừa tay 2 bu-lông tựa trên `M4` (`Y = +9.5 mm`), sau đó dùng **cờ-lê `8 mm` siết chặt `2×` bu-lông `M5` chính (`Y = +3.5 mm`) đạt `3.0–3.5 N·m`** *(CHÚ Ý: nếu lắp đai ốc tai hồng `M5` vặn tay thì chỉ được cắt cam/chanh nhẹ `≤ 120 N`)*.

---

## 5. Quy Trình Kiểm Thử Nghiệm Thu Thực Tế (Chiều Kéo Lực `+X`)

1. **Test 1 — Lắp khít & Né ốc M5 gốc ở `D = 10 mm`, `W = 4 mm` & `W = 18 mm`:** Khép hàm xuống cỡ `D = 10 mm` tại Vị trí 1 (`t_E = 0.375`). Yêu cầu: Cổ chữ C lọt êm khe `W_clear = 2.5–4.0 mm`; góc vát sau má kẹp cách tai hồng M5 gốc `≥ 1.1 mm`; `DIN 933` còn dư `≥ 1.5 mm` ren ngoài đai ốc Nyloc ở `W = 18 mm`; họng `X ∈ [-7.5, +5.0] mm` trống 100%.
2. **Test 2 — Thử tải tĩnh bôi nhựa mít/dầu ăn `400 N` theo chiều cắt `+X` & chống nhổ `+Y`:**
   - Kẹp hàm HM226 lên ê-tô, bôi dầu ăn/nhựa mít ướt lên cả 4 mặt kẹp và sống lưng. Siết bu-lông theo chuẩn (PA 2 hoặc PA 1-Rev2 `3.0–3.5 N·m`).
   - Móc lực kế vào mũi lưỡi bào **kéo theo chiều cắt chính `+X` lên `400 N`** và **kéo giật hướng kính `+Y` lên `400 N`** (hoặc `705 N` với bản 65Mn/PA 2).
   - **Đạt (PASS):** Dịch chuyển `= 0.0 mm`, chốt `Ø3.0 mm` không biến dạng, cổ chữ C không xoay lệch, ren `Nyloc` không nhả.
3. **Test 3 — Đổi cỡ vị trí dính nhựa sau 30 phút:** Phơi nắng 30 phút cho nhựa se dính, tháo lắp chuyển từ Vị trí 1 sang Vị trí 2 phải hoàn thành trong `< 30 giây`.
4. **Test 4 & 5 — Cắt thực địa 30 vòng trên 3 nhóm cành (`Ø15–20 mm`, `Ø30–45 mm`, `Ø50–70 mm`):** Kiểm tra 100% dải vỏ `2.2–5.0 mm` cuộn thoát thẳng lên trời `+Y` qua họng Open-Sky không kẹt, lớp gỗ lõi trắng nguyên vẹn không xước phạm gỗ (`aboveXylem ≥ 0.9 mm`).
