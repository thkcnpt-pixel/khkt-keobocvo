/* ============================================================================
   kinematics.js — Giải động học cơ khí (thuần toán học, không phụ thuộc Three.js)
   Đơn vị: cm. Trục bản lề kéo tại gốc tọa độ (0,0). Hàm kéo hướng theo +X.
   Cành cây có trục song song trục Z, tâm tại (cx, cy).
   Nguyên tắc: mô phỏng "bóp kéo" — hàm kéo đóng dần từ vị trí mở rộng
   cho tới khi răng cưa chạm đúng độ sâu trên cành → không bao giờ xuyên hình.
   ============================================================================ */

export const STRIP_WIDTH = 1.3;      // Bề rộng dải vỏ (khoảng cách 2 lưỡi rạch) — 13 mm
export const BARK_T = 0.22;          // Độ dày vỏ cây mô phỏng — 2.2 mm
export const TOOTH_SINK = 0.06;      // Răng cưa ăn qua hết vỏ, chạm tầng gỗ — 0.6 mm
export const DEPTH_GAP = 0.15;       // Mép răng nhô hơn mũi lưỡi bào — 1.5 mm (cữ độ sâu)
export const RAKE_DEG = 28;          // Góc nghiêng lưỡi bào
export const BLADE_WIDTH = 1.25;     // Bề rộng bản lưỡi cong (đỉnh răng → sống lưng)
export const TOOTH_H = 0.16;         // Chiều cao răng cưa

const rot = (x, y, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c - y * s, x * s + y * c];
};

/* ---------------- HÀM KÉO HM226 / PHƯƠNG ÁN A ---------------- */
// Đường đỉnh răng cưa hàm trên (Bezier bậc 3), hệ cục bộ của hàm.
// Hai hàm khép lại tạo "mắt" hình hạnh nhân giống kéo HM226 thật.
const Q = [[0.9, 0.18], [3.2, 1.55], [7.6, 1.6], [10.0, 0.12]];

function bez(t, i) {
  const u = 1 - t;
  return u*u*u*Q[0][i] + 3*u*u*t*Q[1][i] + 3*u*t*t*Q[2][i] + t*t*t*Q[3][i];
}
function bezD(t, i) {
  const u = 1 - t;
  return 3*u*u*(Q[1][i]-Q[0][i]) + 6*u*t*(Q[2][i]-Q[1][i]) + 3*t*t*(Q[3][i]-Q[2][i]);
}

/** Điểm trên đường đỉnh răng + góc tiếp tuyến + pháp tuyến hướng ra ngoài (phía sống lưng) */
export function toothFrame(t) {
  const x = bez(t, 0), y = bez(t, 1);
  const angle = Math.atan2(bezD(t, 1), bezD(t, 0));
  return { x, y, angle, nx: -Math.sin(angle), ny: Math.cos(angle) };
}

/** Điểm cách đường đỉnh răng một khoảng d về phía sống lưng */
export function offsetPoint(t, d) {
  const f = toothFrame(t);
  return [f.x + f.nx * d, f.y + f.ny * d];
}

const SAMPLES = 260;
const T_MIN = 0.04, T_MAX = 0.98;
const toothLine = [];
for (let i = 0; i <= SAMPLES; i++) {
  const t = T_MIN + (T_MAX - T_MIN) * (i / SAMPLES);
  const f = toothFrame(t);
  toothLine.push({ t, x: f.x, y: f.y });
}

// Tâm cành theo đường kính: cành lớn nằm sâu hơn về phía giữa/mũi hàm
export function branchCenterX_HM(D) {
  return 4.2 + (D - 1) * 0.27;
}

function minDistUpper(theta, cx, cy) {
  let best = Infinity, bestT = 0;
  for (const s of toothLine) {
    const [x, y] = rot(s.x, s.y, theta);
    const d = Math.hypot(x - cx, y - cy);
    if (d < best) { best = d; bestT = s.t; }
  }
  return { d: best, t: bestT };
}

/** "Bóp kéo": quét góc từ mở rộng → đóng, dừng tại lần chạm đầu tiên rồi tinh chỉnh */
function closeUntilContact(f, thOpen, thClosed, steps = 160) {
  let prev = thOpen;
  let fPrev = f(prev);
  if (fPrev <= 0) return prev;
  for (let i = 1; i <= steps; i++) {
    const th = thOpen + (thClosed - thOpen) * (i / steps);
    const fv = f(th);
    if (fv <= 0) {
      let lo = th, hi = prev; // f(lo) <= 0 < f(hi)
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (f(mid) <= 0) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    prev = th; fPrev = fv;
  }
  return thClosed;
}

/**
 * Giải góc mở hàm (đối xứng) cho HM226 / Phương án A để đỉnh răng cưa
 * ăn đúng qua lớp vỏ chạm tầng gỗ của cành đường kính D.
 */
export function solveHM(D) {
  const R = D / 2;
  const Rc = R - BARK_T;
  const target = Rc - TOOTH_SINK;
  const cx = branchCenterX_HM(D), cy = 0;
  const f = (th) => minDistUpper(th, cx, cy).d - target;
  const theta = closeUntilContact(f, 1.2, -0.25);
  const { t } = minDistUpper(theta, cx, cy);
  return { theta, cx, cy, R, Rc, contactT: t };
}

/** Mũi lưỡi bào (Phương án A) khi con chạy ở tham số t — hệ thế giới */
export function peelTipWorldA(t, theta) {
  const [x, y] = offsetPoint(t, DEPTH_GAP);
  return rot(x, y, theta);
}

/* ---------------- PHƯƠNG ÁN B: HÀM CHỮ V + CỤM DAO CHỮ U ---------------- */
export const B = {
  vertex: [6.0, -2.9],             // Đỉnh chữ V (hệ cục bộ hàm dưới)
  halfAngle: (52 * Math.PI) / 180, // Nửa góc mở chữ V (≈104° toàn phần)
  rollerR: 0.45,                   // Bán kính con lăn mini Ø9 mm
  rollerAlong: 1.55,               // Vị trí con lăn tính từ đỉnh V dọc theo mặt V
  armLen: 4.6,                     // Chiều dài cánh chữ V
  headJoint: [6.55, 1.9],          // Khớp xoay tự lựa trên cánh tay hàm trên (cục bộ)
  headToTooth: 1.0,                // Khoảng cách khớp → đỉnh lưỡi rạch
  lowerRatio: 0.3,                 // Hàm dưới mở theo tỉ lệ so với hàm trên
};

/** Hướng 2 mặt chữ V (vector đơn vị từ đỉnh lên mỗi cánh) — cục bộ */
export function vFaceDirs() {
  const a = B.halfAngle;
  return { left: [-Math.sin(a), Math.cos(a)], right: [Math.sin(a), Math.cos(a)] };
}

/** Tâm 2 con lăn trong hệ cục bộ hàm dưới */
export function rollerCentersLocal() {
  const { left, right } = vFaceDirs();
  const [vx, vy] = B.vertex;
  const r = B.rollerR;
  const nL = [left[1], -left[0]];
  const nR = [-right[1], right[0]];
  return [
    [vx + left[0] * B.rollerAlong + nL[0] * r, vy + left[1] * B.rollerAlong + nL[1] * r],
    [vx + right[0] * B.rollerAlong + nR[0] * r, vy + right[1] * B.rollerAlong + nR[1] * r],
  ];
}

/**
 * Tâm cành khi đặt trên hàm chữ V (hàm dưới xoay góc -thL quanh bản lề).
 * Cành tựa lên 2 con lăn, hoặc tựa 2 mặt V nếu cành rất nhỏ lọt giữa 2 con lăn.
 */
export function branchCenterOnV(R, thL) {
  const [r1, r2] = rollerCentersLocal().map(([x, y]) => rot(x, y, -thL));
  const mx = (r1[0] + r2[0]) / 2, my = (r1[1] + r2[1]) / 2;
  const half = Math.hypot(r2[0] - r1[0], r2[1] - r1[1]) / 2;
  const [vx, vy] = rot(B.vertex[0], B.vertex[1], -thL);
  const bis = rot(0, 1, -thL);
  const L = R + B.rollerR;
  let cRoll = null;
  if (L > half) {
    const h = Math.sqrt(L * L - half * half);
    cRoll = [mx + bis[0] * h, my + bis[1] * h];
  }
  const dV = R / Math.sin(B.halfAngle);
  const cFace = [vx + bis[0] * dV, vy + bis[1] * dV];
  if (!cRoll) return { c: cFace, onRollers: false };
  const hRoll = (cRoll[0] - vx) * bis[0] + (cRoll[1] - vy) * bis[1];
  return hRoll >= dV ? { c: cRoll, onRollers: true } : { c: cFace, onRollers: false };
}

/**
 * Giải động học Phương án B: hàm trên đóng dần từ trên xuống; cụm dao chữ U
 * (khớp tự lựa luôn hướng về tâm cành) dừng khi đỉnh lưỡi rạch đạt đúng độ sâu.
 */
export function solveB(D) {
  const R = D / 2;
  const Rc = R - BARK_T;
  const target = Rc - TOOTH_SINK + B.headToTooth;
  const evalAt = (thU) => {
    const thL = thU * B.lowerRatio;
    const { c, onRollers } = branchCenterOnV(R, thL);
    const j = rot(B.headJoint[0], B.headJoint[1], thU);
    return { thL, c, onRollers, j, d: Math.hypot(j[0] - c[0], j[1] - c[1]) };
  };
  const thU = closeUntilContact((th) => evalAt(th).d - target, 1.3, -0.6);
  const r = evalAt(thU);
  const aim = Math.atan2(r.c[1] - r.j[1], r.c[0] - r.j[0]);
  const nominal = -Math.PI / 2 + thU; // hướng danh định (vuông góc cánh tay, chĩa xuống)
  let tilt = aim - nominal;
  while (tilt > Math.PI) tilt -= 2 * Math.PI;
  while (tilt < -Math.PI) tilt += 2 * Math.PI;
  return { thetaU: thU, thetaL: r.thL, cx: r.c[0], cy: r.c[1], R, Rc, onRollers: r.onRollers, tilt, aim, joint: r.j };
}
