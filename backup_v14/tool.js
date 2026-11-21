/* ============================================================================
   tool.js (v11 — Single-Side Cantilever Carriage + Sliding HSS Blade):
   Thiết kế cơ khí tối giản & thực tế 100%:
   1. PA 2 (★ Khuyên dùng KHKT — Gắn 1 bên lá lưỡi 1 bằng 2 vít M4 xuyên 5 lỗ Ø4.2):
      - Chỉ khoan 5 lỗ Ø4.2 mm trên DUY NHẤT lá lưỡi 1 (+Z); lá lưỡi 2 (-Z) giữ nguyên bản!
      - Cục gá Inox/Nhôm 6061 gọn nhẹ (24 × 14 × 6 mm) ôm mặt ngoài lá lưỡi 1, khóa cứng
        bằng 2 bu-lông M4 ngắn + đai ốc Nyloc xanh dương (chịu cắt > 4.500 N, chỉ +20 g).
      - KHE GIỮA 2 LƯỠI KÉO TRỐNG HOÀN TOÀN 100% — KHÔNG có ống đệm, KHÔNG có cầu nối,
        KHÔNG có bu-lông nào chắn đường vỏ cây bay ra!
      - Thanh lưỡi bào phẳng nguyên khối SK5/HSS (26 × 12 × 2.0 mm, mài vát 1 mặt 28°)
        trượt ngang qua khe 28° của cục gá, khóa bằng DUY NHẤT 1 vít M4:
        + Khi chỉnh Rộng vỏ 4–18 mm, thanh dao trượt tiến/lùi chạm khít mặt trong lá 2,
          phần đuôi dư nằm gọn ra mặt ngoài lá 1 (không chạm cành cây).
   2. PA 1 (DIY — Không khoan lưỡi HM226):
      - Cùng nguyên lý Con chạy 1 bên + Thanh dao trượt ngang (khe giữa trống 100%!),
        thay 2 lỗ xuyên bằng ngàm kẹp chữ U ôm sống lưng lá 1 + chốt tỳ vào 3 khấc đáy U
        + 2 vít kẹp má M4.
   3. PA C (2 Hàm 180°):
      - Gắn đối xứng cụm PA 2 siêu gọn (~20 g/hàm) ở cả hàm trên & hàm dưới.
   ============================================================================ */
import * as THREE from 'three';
import * as K from './kinematics.js?v=14';

const W0 = K.STRIP_WIDTH; // 1.3 cm (13 mm baseline)
const RAKE = THREE.MathUtils.degToRad(K.RAKE_DEG);
const V2 = (x, y) => new THREE.Vector2(x, y);

export const bladeW = (t) =>
  K.BLADE_WIDTH * (0.62 + 0.38 * Math.min(1, Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * 1.6));

export function extrude(shape, depth, bevel = 0.02, curveSegments = 20) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: bevel > 0 ? 3 : 1,
    curveSegments,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

export function disposeGroup(group) {
  for (let i = group.children.length - 1; i >= 0; i--) {
    const ch = group.children[i];
    ch.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    group.remove(ch);
  }
}

/** Biên dạng lưỡi cong răng cưa (sign +1 hàm trên, -1 hàm dưới; variant: null | 'pa2' | 'pa1') */
function jawShape(sign, variant = null) {
  const v = [];
  const P = (x, y) => v.push(V2(x, sign * y));
  P(-0.8, -0.42); P(0.3, -0.12);
  const t0 = 0.04, t1 = 0.98, N = 44, dt = (t1 - t0) / N;
  for (let i = 0; i <= N; i++) {
    const t = t0 + dt * i;
    const [bx, by] = K.offsetPoint(t, K.TOOTH_H); P(bx, by);
    if (i < N) { const [tx, ty] = K.offsetPoint(t + dt * 0.55, 0); P(tx, ty); }
  }
  const fe = K.toothFrame(t1);
  P(fe.x + Math.cos(fe.angle) * 0.22 + fe.nx * 0.35, fe.y + Math.sin(fe.angle) * 0.22 + fe.ny * 0.35);

  const pa1Notches = variant === 'pa1' ? K.PA1_NOTCH_TS : null;
  const spineSteps = 140;
  for (let i = spineSteps; i >= 0; i--) {
    const t = t0 + (t1 - t0) * (i / spineSteps);
    let d = bladeW(t);
    if (pa1Notches) {
      for (const nt of pa1Notches) {
        const dist = Math.abs(t - nt);
        const halfT = 0.0145;
        if (dist < halfT) {
          const edge = dist / halfT;
          const depthDrop = edge < 0.72 ? 0.155 : 0.155 * Math.sqrt(Math.max(0, 1 - ((edge - 0.72) / 0.28) ** 2));
          d -= depthDrop;
        }
      }
    }
    const [x, y] = K.offsetPoint(t, d); P(x, y);
  }
  P(-0.8, 0.66);

  const shape = new THREE.Shape(v);

  // Lưới 5 lỗ khoan xuyên Ø4.2 mm (r = 0.21 cm) tại Y = -4.5 mm cho PA 2 (chỉ trên lá 1!)
  if (variant === 'pa2') {
    for (const ht of K.PA2_HOLE_TS) {
      const [hx, hy] = K.offsetPoint(ht, bladeW(ht) - 0.45);
      const hole = new THREE.Path();
      hole.absarc(hx, sign * hy, 0.21, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  }
  return shape;
}

/** Thanh lưỡi bào phẳng nguyên khối SK5/HSS (dày 2.0 mm, bản rộng 12 mm, vát 1 mặt 28°) */
export function makePeelBlade(M, yEdge, width, zOffset = 0, flipY = false, normalOffset = 0) {
  const g = new THREE.Group();
  const L = 1.18, th = 0.20;
  const sY = flipY ? -1 : 1;
  const d = V2(-Math.cos(RAKE), sY * Math.sin(RAKE));
  const n = V2(Math.sin(RAKE), sY * Math.cos(RAKE));

  const E = V2(0, yEdge).addScaledVector(n, normalOffset);
  const p1 = E.clone().addScaledVector(d, L);
  const p2 = p1.clone().addScaledVector(n, th);
  const p3 = E.clone().addScaledVector(d, 0.34).addScaledVector(n, th);

  const shape = new THREE.Shape();
  shape.moveTo(E.x, E.y);
  shape.lineTo(p1.x, p1.y);
  shape.lineTo(p2.x, p2.y);
  shape.lineTo(p3.x, p3.y);
  shape.closePath();

  const peelMat = M.peelSteel || M.peel;
  const blade = new THREE.Mesh(extrude(shape, width, 0.008, 16), peelMat);
  blade.position.z = zOffset;
  blade.userData.part = 'peel';

  const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, width + 0.012, 12), M.edge);
  edge.rotation.x = Math.PI / 2;
  edge.position.set(E.x - 0.008, E.y + sY * 0.01, zOffset);
  g.add(blade, edge);
  g.userData.backTop = p2;
  g.userData.bellyEnd = p1;
  g.userData.edge = E;
  g.userData.normalVec = n;
  g.userData.dirVec = d;
  return g;
}

function makeThumbWingGeo(wingW = 0.24, wingH = 0.44, thickness = 0.11) {
  const sh = new THREE.Shape();
  sh.moveTo(-wingW * 0.38, 0);
  sh.bezierCurveTo(-wingW * 0.56, wingH * 0.35, -wingW * 0.48, wingH * 0.96, 0, wingH);
  sh.bezierCurveTo(wingW * 0.48, wingH * 0.96, wingW * 0.56, wingH * 0.35, wingW * 0.38, 0);
  sh.closePath();
  return extrude(sh, thickness, 0.015, 18);
}

function wingNutBolt(M, len) {
  const g = new THREE.Group();
  const cyl = (r1, r2, h, s, m) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, s), m);
    o.rotation.x = Math.PI / 2;
    return o;
  };
  const shaft = cyl(0.13, 0.13, len, 16, M.bolt);
  const head = cyl(0.28, 0.28, 0.18, 6, M.bolt);
  head.position.z = -len / 2;
  const spacer = cyl(0.24, 0.24, W0 - 0.2, 18, M.darkSteel);
  const nut = new THREE.Group();
  nut.position.z = len / 2;
  nut.add(cyl(0.23, 0.27, 0.22, 16, M.bolt));
  const wingGeo = makeThumbWingGeo(0.25, 0.42, 0.11);
  [-1, 1].forEach((s) => {
    const w = new THREE.Mesh(wingGeo, M.bolt);
    w.position.set(0, s * 0.18, 0.04);
    w.rotation.z = s > 0 ? 0 : Math.PI;
    w.rotation.x = s * 0.18;
    nut.add(w);
  });
  g.add(shaft, head, spacer, nut);
  g.userData = { part: 'nut', nut, head, spacer, shaft, baseLen: len };
  return g;
}

function handle(M, sign) {
  const g = new THREE.Group();
  const P = (x, y) => new THREE.Vector3(x, sign * y, 0);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(-0.2, 0), P(-2.4, 0.8), P(-4.6, 1.55)]), 16, 0.26, 10), M.steel));
  const grip = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(-3, 1.02), P(-6, 1.95), P(-9.4, 2.35), P(-12.2, 2.0)]), 30, 0.55, 14), M.red);
  grip.userData.part = 'handle';
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), M.red);
  cap.position.copy(P(-12.2, 2.0));
  g.add(grip, cap);
  return g;
}

function spring(M) {
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120, a = t * 8 * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * 0.36, t - 0.5, Math.sin(a) * 0.36));
  }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.06, 6), M.darkSteel);
}

/** Tạo 1 con vít M4 ngắn + đai ốc khóa Nyloc xanh dương (chỉ kẹp lên DUY NHẤT lá lưỡi 1, KHÔNG chắn khe!) */
function makeShortM4Bolt(M, x, y, zBladeCenter, blockTh, explode) {
  const g = new THREE.Group();
  g.position.set(x, y, 0);
  const bladeTh = 0.14;
  const zInnerFace = zBladeCenter - bladeTh * 0.5;
  const zOuterFace = zBladeCenter + bladeTh * 0.5 + blockTh;
  const boltLen = bladeTh + blockTh + 0.36;

  // Thân bu-lông M4 ngắn (chỉ dài ~11 mm, KHÔNG lấn sang khe giữa 2 lưỡi kéo!)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, boltLen, 16), M.bolt);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = (zInnerFace + zOuterFace) * 0.5 + explode * 0.85;
  g.add(shaft);

  // Đầu bu-lông chìm dẹt (Button-Head M4 dày 2 mm) nằm sát mặt trong lá lưỡi 1
  const flatHead = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 16), M.bolt);
  flatHead.rotation.x = Math.PI / 2;
  flatHead.position.z = zInnerFace - 0.06 + explode * 0.25;
  g.add(flatHead);

  // Đai ốc khóa Nyloc M4 ở mặt ngoài cục gá
  const nutHex = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 6), M.bolt);
  nutHex.rotation.x = Math.PI / 2;
  const nylocRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.21, 0.045, 10, 18),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.05 })
  );
  nylocRing.position.z = 0.10;
  const nutG = new THREE.Group();
  nutG.add(nutHex, nylocRing);
  nutG.position.z = zOuterFace + 0.14 + explode * 1.45;
  g.add(nutG);

  return g;
}

function convexHull(points) {
  const P = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const p of P) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  const up = [];
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop();
  return lo.concat(up);
}

/**
 * Con chạy 1 Bên + Thanh Dao Trượt Ngang 1 Vít Khóa (Single-Side Cantilever Carriage + Sliding HSS Blade):
 * - Chỉ gắn lên MẶT NGOÀI của lá lưỡi 1 (+Z) -> Khe giữa 2 lưỡi kéo TRỐNG 100%, vỏ tự rơi 100%!
 * - Thanh lưỡi bào phẳng nguyên khối SK5/HSS (dài 26 mm, dày 2.0 mm, góc 28°) trượt ngang qua khe cục gá,
 *   tự khớp vô cấp mọi độ rộng W = 4..18 mm bằng DUY NHẤT 1 vít khóa M4 ở mặt ngoài!
 */
function buildSingleSideCarriage(M, isLower = false) {
  const sY = isLower ? -1 : 1;
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const peelGroup = new THREE.Group();
  root.add(bodyGroup, peelGroup);

  const lockKnobMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.32, metalness: 0.55 });
  const pinSpringMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.78 });

  let lastKey = '';

  function updateCarriage(stripW, yEdge, explode = 0, archType = 'pa2', tCar = 0.445, wCar = 1.25) {
    const key = `${archType}_${stripW.toFixed(3)}_${yEdge.toFixed(3)}_${explode.toFixed(3)}_${tCar.toFixed(3)}`;
    if (key === lastKey) return;
    lastKey = key;

    disposeGroup(bodyGroup);
    disposeGroup(peelGroup);

    const bladeTh = 0.14;
    const isPA1 = archType === 'pa1'; // PA 1: ghim chữ U + E-clip | PA 2: 2 bu-lông M4 10.9 + đai ốc
    const zBlade1 = stripW * 0.5;
    const zB1Inner = zBlade1 - bladeTh * 0.5;
    const zB2Inner = -stripW * 0.5 + bladeTh * 0.5;
    const zB1Outer = zBlade1 + bladeTh * 0.5;
    const zB2Outer = -stripW * 0.5 - bladeTh * 0.5;
    const gap = zB1Inner - zB2Inner;
    const barLen = Math.max(0.2, gap - 0.03);        // dao-trục dài vừa khít khe (trừ 2×bevel 0.01 -> tổng dày = gap - 0.01)
    const zBarC = (zB1Inner + zB2Inner) * 0.5;

    // --- Vị trí 2 lỗ Ø4.2 nằm SAU mép dao (hệ tọa độ cục bộ của con chạy) ---
    const f = K.toothFrame(tCar);
    const P0x = f.x + f.nx * wCar, P0y = sY * (f.y + f.ny * wCar);
    const ca = Math.cos(-sY * f.angle), sa = Math.sin(-sY * f.angle);
    const holes = [];
    for (const ht of K.PA2_HOLE_TS) {
      const [hx, hy] = K.offsetPoint(ht, bladeW(ht) - 0.45);
      const dx = hx - P0x, dy = sY * hy - P0y;
      const lx = dx * ca - dy * sa, ly = dx * sa + dy * ca;
      if (lx < -0.3 && lx > -2.1) holes.push([lx, ly]);
    }
    holes.sort((p, q) => q[0] - p[0]);
    const hs = holes.slice(0, 2);
    if (hs.length < 2) { const lx0 = -0.76, ly0 = sY * -0.47; hs.length = 0; hs.push([lx0, ly0], [-1.5, sY * -0.54]); }

    // --- DAO-TRỤC: 1 khối nêm ôm 2 lỗ (thân khoan 2 lỗ Ø4.2), mép sắc tại yEdge ---
    const E = [0, yEdge];
    const pts = [E];
    const rBoss = 0.34;
    hs.forEach(([hx, hy]) => { for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; pts.push([hx + rBoss * Math.cos(a), hy + rBoss * Math.sin(a)]); } });
    const hull = convexHull(pts);
    const hsh = new THREE.Shape(hull.map(([x, y]) => new THREE.Vector2(x, y)));
    const bar = new THREE.Mesh(extrude(hsh, barLen, 0.01, 8), M.peelSteel || M.peel);
    bar.position.z = zBarC;
    bar.userData.part = 'peel';
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, barLen + 0.01, 10), M.edge);
    edge.rotation.x = Math.PI / 2;
    edge.position.set(E[0] - 0.008, E[1], zBarC);
    peelGroup.add(bar, edge);

    // --- CỐ ĐỊNH ---
    const ex1 = explode * 2.35, ex2 = explode * 2.35;
    hs.forEach(([hx, hy]) => {
      const shankLen = gap + 2 * bladeTh + 0.24;
      const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, shankLen, 14), M.bolt);
      shank.rotation.x = Math.PI / 2;
      shank.position.set(hx, hy, zBarC + explode * 1.15);
      bodyGroup.add(shank);
      if (!isPA1) {
        // PA 2: đầu trụ lục giác chìm M4 ngoài lá 1, đai ốc M4 ngoài lá 2
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.36, 20), M.bolt);
        head.rotation.x = Math.PI / 2; head.position.set(hx, hy, zB1Outer + 0.18 + ex1);
        const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.32, 6), M.bolt);
        nut.rotation.x = Math.PI / 2; nut.position.set(hx, hy, zB2Outer - 0.16 - ex2);
        bodyGroup.add(head, nut);
      } else {
        // PA 1: E-clip (vòng hở) ở đầu ghim phía lá 2
        const clip = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.05, 8, 20), pinSpringMat);
        clip.position.set(hx, hy, zB2Outer - 0.12 - ex2);
        bodyGroup.add(clip);
      }
    });
    if (isPA1) {
      // PA 1: cầu nối chữ U trên mặt ngoài lá 1 nối 2 chân ghim (1 thao tác rút cả 2 chân)
      const [ax, ay] = hs[0], [bx, by] = hs[1];
      const len = Math.hypot(bx - ax, by - ay);
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, len, 12), pinSpringMat);
      bridge.rotation.z = Math.atan2(by - ay, bx - ax) - Math.PI / 2;
      bridge.position.set((ax + bx) / 2, (ay + by) / 2, zB1Outer + 0.2 + ex1);
      const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.34, 12), pinSpringMat);
      legA.rotation.x = Math.PI / 2; legA.position.set(ax, ay, zB1Outer + 0.08 + ex1);
      const legB = legA.clone(); legB.position.set(bx, by, zB1Outer + 0.08 + ex1);
      bodyGroup.add(bridge, legA, legB);
    }

    bodyGroup.traverse((o) => { if (!o.userData.part) o.userData.part = 'carriage'; });
    peelGroup.traverse((o) => { if (!o.userData.part) o.userData.part = 'peel'; });
  }

  root.traverse((o) => { if (!o.userData.part) o.userData.part = 'carriage'; });
  return { root, bodyGroup, peelGroup, updateCarriage };
}

/** Dựng toàn bộ kéo. Trả về các nhóm chi tiết để app.js điều khiển. */
export function buildTool(M, notches) {
  const T = {};
  T.root = new THREE.Group();
  T.upper = new THREE.Group(); T.lower = new THREE.Group();
  T.root.add(T.upper, T.lower);

  // Bản lề
  T.pivot = new THREE.Group();
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 2.2, 18), M.darkSteel); pin.rotation.x = Math.PI / 2;
  const pcap = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.16, 6), M.bolt); pcap.rotation.x = Math.PI / 2; pcap.position.z = 1.12;
  T.pivot.add(pin, pcap); T.root.add(T.pivot);

  // Tay cầm bắt chéo qua bản lề như kéo thật + lò xo đẩy
  T.upper.add(handle(M, -1)); T.lower.add(handle(M, 1));
  T.spring = spring(M); T.root.add(T.spring);

  // ---------- HM226 / PA 2 (5 lỗ Ø4.2 chỉ trên lá 1!) / PA 1 (3 khấc đáy U chỉ trên lá 1!) / PA C ----------
  T.hmU = new THREE.Group(); T.upper.add(T.hmU);
  T.hmL = new THREE.Group(); T.lower.add(T.hmL);
  T.geoUpSmooth = extrude(jawShape(1, null), 0.14);
  T.geoUpPA2 = extrude(jawShape(1, 'pa2'), 0.14);
  T.geoUpPA1 = extrude(jawShape(1, 'pa1'), 0.14);
  T.geoUpNotched = T.geoUpPA2;

  T.geoLoSmooth = extrude(jawShape(-1, null), 0.14);
  T.geoLoPA2 = extrude(jawShape(-1, 'pa2'), 0.14);
  T.geoLoNotched = T.geoLoPA2;

  // Lá 1 (+Z) mang lỗ/khấc gắn con chạy 1 bên; Lá 2 (-Z) giữ trơn nguyên bản HM226!
  T.upF = new THREE.Mesh(T.geoUpPA2, M.steel); T.upB = new THREE.Mesh(T.geoUpSmooth, M.steel);
  T.loF = new THREE.Mesh(T.geoLoSmooth, M.steel); T.loB = new THREE.Mesh(T.geoLoSmooth, M.steel);
  [T.upF, T.upB, T.loF, T.loB].forEach((m) => { m.userData.part = 'blade'; });
  T.hmU.add(T.upF, T.upB); T.hmL.add(T.loF, T.loB);

  const [nx, ny] = K.offsetPoint(0.13, 0.7);
  T.nutU = wingNutBolt(M, W0 + 1.35); T.nutU.position.set(nx, ny, 0);
  T.nutL = wingNutBolt(M, W0 + 1.35); T.nutL.position.set(nx, -ny, 0);
  T.hmU.add(T.nutU); T.hmL.add(T.nutL);

  // ---------- Con chạy 1 bên Hàm Trên (PA 2 & PA 1 DIY) ----------
  T.upperCarriageSys = buildSingleSideCarriage(M, false);
  T.carriage = T.upperCarriageSys.root;
  T.peelA = T.upperCarriageSys.peelGroup;
  T.hmU.add(T.carriage);

  // ---------- Con chạy 1 bên Đối Xứng Hàm Dưới (PA C — Cắt Kép 180°) ----------
  T.lowerCarriageSys = buildSingleSideCarriage(M, true);
  T.carriageLower = T.lowerCarriageSys.root;
  T.hmL.add(T.carriageLower);

  // ---------- Phương án B: Hàm chữ V nguyên khối + 2 con lăn ----------
  T.bL = new THREE.Group(); T.lower.add(T.bL);
  {
    const { left, right } = K.vFaceDirs();
    const V = V2(...K.B.vertex);
    const Lt = V.clone().add(V2(...left).multiplyScalar(K.B.armLen));
    const Rt = V.clone().add(V2(...right).multiplyScalar(K.B.armLen));
    const th = 0.6;
    const nLo = V2(-left[1], left[0]), nRo = V2(right[1], -right[0]);
    const VO = V.clone().add(V2(0, -th / Math.sin(K.B.halfAngle)));
    const sh = new THREE.Shape([V2(-0.8, 0.45), V2(0.8, 0.25), Lt, V, Rt, Rt.clone().addScaledVector(nRo, th), VO,
      Lt.clone().addScaledVector(nLo, th), V2(0.8, -0.65), V2(-0.8, -0.55)]);
    T.vFrame = new THREE.Mesh(extrude(sh, 1.5, 0.04), M.amberV);
    T.vFrame.userData.part = 'vjaw';
    T.bL.add(T.vFrame);
  }
  T.rollerSpin = []; T.rollerG = [];
  K.rollerCentersLocal().forEach(([x, y]) => {
    const g = new THREE.Group(); g.position.set(x, y, 0);
    const spin = new THREE.Group();
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(K.B.rollerR, K.B.rollerR, 1.75, 24), M.roller); wheel.rotation.x = Math.PI / 2;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(K.B.rollerR * 2.03, 0.1, 1.77), M.darkSteel);
    spin.add(wheel, stripe);
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.0, 10), M.bolt); axle.rotation.x = Math.PI / 2;
    g.add(spin, axle);
    g.traverse((o) => { o.userData.part = 'vjaw'; });
    T.bL.add(g); T.rollerSpin.push(spin); T.rollerG.push(g);
  });

  // ---------- Phương án B: Cánh tay + Cụm dao chữ U tự lựa ----------
  T.bU = new THREE.Group(); T.upper.add(T.bU);
  const [jx, jy] = K.B.headJoint;
  const arm = new THREE.Shape([V2(-0.8, 0.62), V2(2.6, 1.85), V2(jx - 0.4, jy + 0.85), V2(jx + 0.45, jy + 0.45),
    V2(jx + 0.3, jy - 0.35), V2(jx - 0.6, jy - 0.1), V2(2.6, 0.85), V2(-0.8, -0.45)]);
  T.bArm = new THREE.Mesh(extrude(arm, 0.7, 0.04), M.steel); T.bArm.userData.part = 'barm';
  T.bU.add(T.bArm);
  T.bJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.9, 14), M.bolt);
  T.bJoint.rotation.x = Math.PI / 2; T.bJoint.position.set(jx, jy, 0); T.bU.add(T.bJoint);
  T.bHead = new THREE.Group(); T.bHead.position.set(jx, jy, 0); T.bU.add(T.bHead);
  T.bHeadInner = new THREE.Group(); T.bHead.add(T.bHeadInner);
  const bArchShape = new THREE.Shape();
  bArchShape.moveTo(-1.15, -0.36);
  bArchShape.lineTo(-1.15, 0.06);
  bArchShape.lineTo(1.15, 0.06);
  bArchShape.lineTo(1.15, -0.36);
  bArchShape.lineTo(0.45, -0.36);
  bArchShape.quadraticCurveTo(0, -0.02, -0.45, -0.36);
  bArchShape.closePath();
  T.bHousing = new THREE.Mesh(extrude(bArchShape, W0 + 0.55, 0.025, 18), M.amber);
  T.bHeadInner.add(T.bHousing);
  const sv = [V2(-1.15, -0.3)]; const tipY = -K.B.headToTooth;
  for (let i = 0; i <= 14; i++) {
    const x = -1.1 + 2.2 * (i / 14);
    sv.push(V2(x, tipY + 0.06 * x * x + K.TOOTH_H));
    if (i < 14) { const xm = x + 1.1 / 14; sv.push(V2(xm, tipY + 0.06 * xm * xm)); }
  }
  sv.push(V2(1.15, -0.3));
  const sideGeo = extrude(new THREE.Shape(sv), 0.12, 0.01);
  T.bSideF = new THREE.Mesh(sideGeo, M.steel); T.bSideF.position.z = W0 / 2;
  T.bSideB = new THREE.Mesh(sideGeo, M.steel); T.bSideB.position.z = -W0 / 2;
  T.bHeadInner.add(T.bSideF, T.bSideB);
  T.peelB = makePeelBlade(M, tipY + K.DEPTH_GAP, W0 - 0.16);
  T.stemB = new THREE.Group();
  const tb = T.peelB.userData.backTop;
  [-1, 1].forEach((s) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 0.065), M.amber);
    leg.position.set(tb.x, Math.min(-0.36, tb.y + 0.2), s * (W0 - 0.24) * 0.5);
    T.stemB.add(leg);
  });
  T.peelBG = new THREE.Group(); T.peelBG.add(T.peelB, T.stemB); T.bHeadInner.add(T.peelBG);
  T.nutB = wingNutBolt(M, W0 + 1.35); T.nutB.position.set(-0.75, -0.2, 0); T.bHeadInner.add(T.nutB);
  T.bHead.traverse((o) => { if (!o.userData.part) o.userData.part = 'bhead'; });
  T.peelB.traverse((o) => { o.userData.part = 'peel'; });

  return T;
}
