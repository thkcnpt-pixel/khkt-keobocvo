/* ============================================================================
   tool.js (v8) — Dựng hình 3D cơ khí chi tiết kéo HM226, Phương án A, B & C:
   1. Con chạy 2 má ngàm chữ J bo cong vát mép (ExtrudeGeometry với bevel mượt,
      curveSegments: 20) ôm sống lưng ngoài của 2 lưỡi răng cưa, tạo Cầu Vòm Rỗng
      Thoát Phoi Xuyên Tâm 100% (Open-Arch Chip Chute) — TUYỆT ĐỐI KHÔNG có vách
      ngăn hay trụ đứng nào ở khe giữa 2 lưỡi kéo cản đường thoát vỏ!
   2. Chốt xuyên lò xo gài khấc sống dao (Spring-Loaded Indexing Pin): thân ống,
      lò xo xoắn lộ thiên (TubeGeometry helix), mũi chốt thép ăn khớp khấc bán nguyệt
      trên sống dao và núm giật đỏ vát khía.
   3. Ống lồng đồng trục (Coaxial Tube-in-Tube Telescopic Guide Ø4.2 mm / Ø3.0 mm)
      & Đai ốc tai hồng M3 vặn tay (M3 Hand-Tightened Wing Nut): khi thu hẹp về 4 mm
      (0.4 cm) tuyệt đối KHÔNG bị thò dư thanh sắt ra ngoài má con chạy, và khi mở
      rộng 18 mm (1.8 cm) vẫn lồng đồng trục vững chắc.
   4. 2 Lá dao chữ L xếp chồng lệch mặt phẳng 0.3 mm (0.03 cm) theo pháp tuyến lưỡi,
      có bụng lưỡi uốn cong dẫn phoi góc 28° + chân chữ L bắt sát biên má ngàm chữ J,
      trượt êm kiểu cửa lùa từ 4 mm đến 18 mm không bao giờ Z-fighting.
   ============================================================================ */
import * as THREE from 'three';
import * as K from './kinematics.js?v=8';

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

/** Biên dạng lưỡi cong răng cưa (sign +1 hàm trên, -1 hàm dưới) */
function jawShape(sign, notches) {
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
  for (let i = 90; i >= 0; i--) {
    const t = t0 + (t1 - t0) * (i / 90);
    let d = bladeW(t);
    if (notches) {
      for (const n of notches) {
        const dist = Math.abs(t - n.t);
        if (dist < 0.013) {
          // Khấc bán nguyệt (semi-circular spine notch) để mũi chốt lò xo gài khít
          const u = dist / 0.013;
          d -= 0.18 * Math.sqrt(Math.max(0, 1 - u * u));
        }
      }
    }
    const [x, y] = K.offsetPoint(t, d); P(x, y);
  }
  P(-0.8, 0.66);
  return new THREE.Shape(v);
}

/**
 * Lưỡi bào chữ L có bụng lưỡi uốn cong dẫn phoi góc 28° (28° Curved Chip-Guiding Belly):
 * - Mép cắt tại E = (0, yEdge) kèm độ dịch mặt phẳng normalOffset (±0.015 cm = tổng lệch 0.03 cm / 0.3 mm)
 *   để 2 lá dao chữ L trượt chồng lên nhau kiểu cửa lùa từ 4..18 mm tuyệt đối KHÔNG Z-fighting.
 * - Bụng lưỡi uốn cong mượt (quadratic Bezier) nâng dải vỏ hướng thẳng lên cầu vòm thoát phoi.
 */
export function makePeelBlade(M, yEdge, width, zOffset = 0, flipY = false, normalOffset = 0) {
  const g = new THREE.Group();
  const L = 0.94, th = 0.095;
  const sY = flipY ? -1 : 1;
  const d = V2(-Math.cos(RAKE), sY * Math.sin(RAKE));
  const n = V2(Math.sin(RAKE), sY * Math.cos(RAKE));

  // Dịch lá dao dọc theo pháp tuyến n (±0.015 cm -> 2 lá lệch nhau đúng 0.03 cm = 0.3 mm)
  const E = V2(0, yEdge).addScaledVector(n, normalOffset);
  const pBellyMid = E.clone().addScaledVector(d, L * 0.46).addScaledVector(n, -0.045);
  const p1 = E.clone().addScaledVector(d, L).addScaledVector(n, 0.09);
  const p2 = p1.clone().addScaledVector(n, th);
  const pBackMid = E.clone().addScaledVector(d, L * 0.52).addScaledVector(n, th * 0.72);
  const p3 = E.clone().addScaledVector(d, 0.22).addScaledVector(n, th * 0.86);

  const shape = new THREE.Shape();
  shape.moveTo(E.x, E.y);
  // Bụng lưỡi uốn cong dẫn phoi 28° (concave chip-guiding belly)
  shape.quadraticCurveTo(pBellyMid.x, pBellyMid.y, p1.x, p1.y);
  shape.lineTo(p2.x, p2.y);
  shape.quadraticCurveTo(pBackMid.x, pBackMid.y, p3.x, p3.y);
  shape.closePath();

  const peelMat = M.peelSteel || M.peel;
  const blade = new THREE.Mesh(extrude(shape, width, 0.008, 20), peelMat);
  blade.position.z = zOffset;
  blade.userData.part = 'peel';

  const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, width + 0.012, 12), M.edge);
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

/** Tạo hình học cánh tai hồng bo tròn (Sculpted Thumb Wing) cho đai ốc vặn tay */
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

/**
 * Tạo biên dạng Má Ngàm Chữ J (J-Hook Jaw Profile) trong mặt phẳng YZ (nhìn dọc theo sống dao X):
 * - Ôm từ mặt ngoài của lá lưỡi răng cưa (dày 1.4 mm = 0.14 cm), vòng lên đỉnh sống lưng
 *   và vươn cao lên thành Cầu Vòm Rỗng Thoát Phoi (Open-Arch Chip Chute).
 * - TUYỆT ĐỐI KHÔNG có má trong (innerCheek) thò xuống khe giữa 2 lưỡi kéo!
 */
function createJHookJawMesh(M, mat, sY, zSign) {
  const group = new THREE.Group();

  // Biên dạng chữ J trong mặt phẳng XY (sau đó xoay để nằm trong mặt phẳng YZ, kéo dài dọc X = 1.24 cm)
  // Ở đây ta vẽ biên dạng mặt bên (XY) với vòm rỗng cao thoáng ở giữa và gờ móc chữ J ở mặt ngoài Z
  const sideShape = new THREE.Shape();
  sideShape.moveTo(-0.92, -0.34);
  sideShape.quadraticCurveTo(-0.95, 0.22, -0.68, 0.44);
  sideShape.quadraticCurveTo(-0.30, 0.56, 0.16, 0.44);
  sideShape.quadraticCurveTo(0.36, 0.34, 0.34, -0.08);
  sideShape.quadraticCurveTo(0.32, -0.34, 0.10, -0.36);
  sideShape.lineTo(-0.22, -0.36);
  // Hốc vòm thoát phoi khoét cao ở giữa má ngàm
  sideShape.quadraticCurveTo(-0.34, -0.10, -0.54, -0.10);
  sideShape.quadraticCurveTo(-0.72, -0.10, -0.76, -0.34);
  sideShape.closePath();

  // Má ngoài chữ J (Outer J-Cheek): nằm hoàn toàn ở mặt ngoài lá lưỡi răng cưa (|z| > zBlade)
  const outerCheekGeo = extrude(sideShape, 0.13, 0.022, 20);
  if (sY < 0) outerCheekGeo.scale(1, -1, 1);
  const outerCheek = new THREE.Mesh(outerCheekGeo, mat);
  outerCheek.position.set(0, 0, zSign * 0.145);
  group.add(outerCheek);

  // Gờ móc đáy chữ J (J-Hook Bottom Lip): móc nhẹ dưới gờ ngoài của bản lưỡi để chống nhổ hướng kính
  const lipShape = new THREE.Shape();
  lipShape.moveTo(-0.88, -0.44);
  lipShape.lineTo(0.18, -0.44);
  lipShape.quadraticCurveTo(0.28, -0.44, 0.28, -0.33);
  lipShape.lineTo(-0.88, -0.33);
  lipShape.closePath();
  const lipGeo = extrude(lipShape, 0.17, 0.016, 18);
  if (sY < 0) lipGeo.scale(1, -1, 1);
  const lipMesh = new THREE.Mesh(lipGeo, mat);
  lipMesh.position.set(0, 0, zSign * 0.115);
  group.add(lipMesh);

  // Cầu vòm sống lưng cao (High Open-Arch Saddle Crown): chỉ ôm đỉnh sống dao (y > 0.04)
  // tạo cửa vòm rỗng xuyên tâm 100% bên dưới cho dải vỏ thoát tự do
  const archShape = new THREE.Shape();
  archShape.moveTo(-0.86, 0.04);
  archShape.quadraticCurveTo(-0.88, 0.36, -0.58, 0.48);
  archShape.quadraticCurveTo(-0.26, 0.56, 0.14, 0.44);
  archShape.quadraticCurveTo(0.32, 0.34, 0.30, 0.04);
  archShape.lineTo(0.08, 0.04);
  // Vòm rỗng thoát phoi uốn cong cao ở bụng yên (Open-Arch Chip Chute)
  archShape.quadraticCurveTo(-0.28, 0.26, -0.66, 0.04);
  archShape.closePath();

  const archGeo = extrude(archShape, 0.22, 0.022, 22);
  if (sY < 0) archGeo.scale(1, -1, 1);
  const archMesh = new THREE.Mesh(archGeo, mat);
  archMesh.position.set(0, 0, zSign * 0.07);
  group.add(archMesh);

  // Gờ tai bắt ống lồng đồng trục trên đỉnh vòm (Telescopic Boss Ear)
  const bossGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.22, 20);
  bossGeo.rotateX(Math.PI / 2);
  const bossMesh = new THREE.Mesh(bossGeo, mat);
  bossMesh.position.set(-0.28, sY * 0.34, zSign * 0.09);
  group.add(bossMesh);

  return group;
}

/**
 * Tạo cụm Chốt Xuyên Lò Xo Gài Khấc Sống Dao (Spring-Loaded Indexing Pin):
 * - Thân ống dẫn hướng có bậc vát (Stepped Barrel Housing)
 * - Lò xo xoắn thép lộ thiên (Helical Coil Spring - TubeGeometry) ôm quanh trục chốt
 * - Mũi chốt định vị bằng thép tôi (Hardened Indexing Pin Tip) cắm trực tiếp xuống
 *   khấc bán nguyệt trên sống lưng lưỡi răng cưa
 * - Núm giật đỏ vát khía công thái học (Sculpted Red Pull Knob + Chamfered Collar)
 */
function buildSpringIndexingPin(M, sY) {
  const pinG = new THREE.Group();
  const xPin = 0.02;

  // 1. Đế bích & Thân ống dẫn hướng (Barrel Housing)
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.10, 18), M.darkSteel);
  flange.position.set(xPin, sY * 0.36, 0);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.26, 18), M.darkSteel);
  barrel.position.set(xPin, sY * 0.49, 0);
  pinG.add(flange, barrel);

  // 2. Trục chốt xuyên bằng thép (Indexing Pin Shaft) + Mũi chốt bán cầu gài khấc sống dao
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.96, 16), M.steel);
  shaft.position.set(xPin, sY * 0.36, 0);
  const pinTip = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.26, 16), M.bolt);
  // Mũi chốt chọc thẳng xuống rãnh khấc bán nguyệt trên sống dao (y ≈ -0.06)
  pinTip.position.set(xPin, -sY * 0.05, 0);
  pinG.add(shaft, pinTip);

  // 3. Lò xo xoắn lộ thiên (Exposed Helical Coil Spring) quấn quanh trục chốt
  const coilPts = [];
  const turns = 5.5, segs = 72;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const ang = u * turns * Math.PI * 2;
    const rCoil = 0.115;
    const yCoil = sY * (0.50 + u * 0.30);
    coilPts.push(new THREE.Vector3(xPin + Math.cos(ang) * rCoil, yCoil, Math.sin(ang) * rCoil));
  }
  const coilGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 80, 0.021, 8, false);
  const coilMesh = new THREE.Mesh(coilGeo, M.bolt);
  pinG.add(coilMesh);

  // 4. Núm giật đỏ tạo hình công thái học (Sculpted Red Pull Knob)
  const knobCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.10, 0.08, 18), M.red);
  knobCollar.position.set(xPin, sY * 0.82, 0);
  const knobBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.15, 22), M.red);
  knobBody.position.set(xPin, sY * 0.92, 0);
  const knobCap = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), M.red);
  knobCap.position.set(xPin, sY * 0.98, 0);
  if (sY < 0) knobCap.rotation.x = Math.PI;
  // Vòng khía chống trượt quanh núm đỏ
  const knurlRing = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.018, 10, 24), M.darkSteel);
  knurlRing.rotation.x = Math.PI / 2;
  knurlRing.position.set(xPin, sY * 0.92, 0);

  pinG.add(knobCollar, knobBody, knobCap, knurlRing);
  return pinG;
}

/**
 * Tạo Đai Ốc Tai Hồng M3 Vặn Tay (M3 Hand-Tightened Wing Nut) khóa cứng ống lồng đồng trục:
 * - Gồm trụ ren M3 (threaded stud), cổ lục giác/vòng đệm ép và 2 cánh tai hồng bo cong.
 */
function buildM3WingNut(M, sY) {
  const nutG = new THREE.Group();
  const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.24, 14), M.bolt);
  stud.position.y = sY * 0.10;
  const washer = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 18), M.darkSteel);
  washer.position.y = sY * 0.03;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 0.12, 16), M.bolt);
  collar.position.y = sY * 0.11;
  nutG.add(stud, washer, collar);

  const wingGeo = makeThumbWingGeo(0.15, 0.26, 0.065);
  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(wingGeo, M.bolt);
    wing.position.set(side * 0.08, sY * 0.14, 0);
    wing.rotation.z = -side * sY * 0.42 + (sY < 0 ? Math.PI : 0);
    nutG.add(wing);
  });
  return nutG;
}

/**
 * Tạo cụm Con Chạy 2 Má Ngàm Chữ J Lồng Trượt (Beveled J-Hook Split Telescopic Carriage):
 * - 2 Má ngàm chữ J (Má trước +Z dùng M.amber, Má sau -Z dùng M.amberV) ôm mặt ngoài sống dao,
 *   ở giữa là Cầu Vòm Rỗng Thoát Phoi Xuyên Tâm 100% (Open-Arch Chip Chute) không có bất kỳ
 *   vách ngăn hay má trong nào cản đường thoát vỏ.
 * - Ống lồng đồng trục (Tube-in-Tube Telescopic Guide):
 *   + Ống dẫn hướng rỗng ngoài Ø4.2 mm (bán kính 0.21 cm) gắn vào má trước (frontHalf).
 *   + Trục đặc lồng trong Ø3.0 mm (bán kính 0.15 cm) gắn vào má sau (backHalf) trượt đồng trục.
 *   + Chiều dài ống và trục được giới hạn thông minh theo khoảng cách stripW để khi thu hẹp về
 *     4 mm (0.4 cm) TUYỆT ĐỐI KHÔNG bị thò dư thanh sắt ra ngoài má con chạy, và ở 18 mm (1.8 cm)
 *     vẫn lồng khít đồng trục.
 * - Khóa cố định thực tế: Chốt xuyên lò xo gài khấc sống dao (lò xo xoắn + núm giật đỏ)
 *   + Đai ốc tai hồng M3 vặn tay khóa cứng ống lồng.
 * - 2 Lá dao chữ L xếp chồng lệch mặt phẳng 0.3 mm (0.03 cm) có bụng lưỡi uốn cong dẫn phoi 28°,
 *   chân chữ L nằm sát mặt trong 2 lưỡi răng cưa để họng thoát phoi ở giữa rỗng 100%.
 */
function buildTelescopicCarriage(M, isLower = false) {
  const sY = isLower ? -1 : 1;
  const root = new THREE.Group();
  const frontHalf = new THREE.Group(); // đi theo lá lưỡi +Z
  const backHalf = new THREE.Group();  // đi theo lá lưỡi -Z
  const centerGuide = new THREE.Group();
  root.add(frontHalf, backHalf, centerGuide);

  // 1. Hai má ngàm chữ J bo cong vát mép (Beveled J-Hook Jaws)
  const frontJaw = createJHookJawMesh(M, M.amber, sY, +1);
  frontHalf.add(frontJaw);

  const backJaw = createJHookJawMesh(M, M.amberV, sY, -1);
  backHalf.add(backJaw);

  // 2. Chốt xuyên lò xo gài khấc sống dao (Spring-Loaded Indexing Pin) trên má trước
  const pinG = buildSpringIndexingPin(M, sY);
  frontHalf.add(pinG);

  // Chốt định vị phụ trên má sau để đồng bộ khấc trên cả 2 lá lưỡi răng cưa
  const rearDetent = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.28, 14), M.bolt);
  rearDetent.position.set(0.02, -sY * 0.04, 0);
  backHalf.add(rearDetent);

  // 3. Ống lồng đồng trục (Coaxial Tube-in-Tube Telescopic Guide Ø4.2 mm / Ø3.0 mm)
  //    + Đai ốc tai hồng M3 vặn tay (M3 Hand-Tightened Wing Nut)
  const yTele = sY * 0.34;
  const xTele = -0.28;

  // Ống ngoài rỗng Ø4.2 mm (bán kính ngoài 0.21 cm, chiều dài cơ sở 1.0 cm để scale theo stripW)
  const outerTubeGroup = new THREE.Group();
  outerTubeGroup.position.set(xTele, yTele, 0);
  const outerTubeGeo = new THREE.CylinderGeometry(0.21, 0.21, 1.0, 22);
  outerTubeGeo.rotateX(Math.PI / 2);
  const outerTubeMesh = new THREE.Mesh(outerTubeGeo, M.darkSteel);
  // Lỗ lòng ống Ø3.0 mm ở đầu ống ngoài
  const tubeBoreGeo = new THREE.RingGeometry(0.15, 0.21, 20);
  const tubeBoreCap = new THREE.Mesh(tubeBoreGeo, M.steel);
  tubeBoreCap.rotation.y = Math.PI;
  tubeBoreCap.position.z = -0.501;
  outerTubeGroup.add(outerTubeMesh, tubeBoreCap);

  // Trục đặc lồng trong Ø3.0 mm (bán kính 0.15 cm, chiều dài cơ sở 1.0 cm)
  const innerRodGroup = new THREE.Group();
  innerRodGroup.position.set(xTele, yTele, 0);
  const innerRodGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.0, 20);
  innerRodGeo.rotateX(Math.PI / 2);
  const innerRodMesh = new THREE.Mesh(innerRodGeo, M.steel);
  innerRodGroup.add(innerRodMesh);

  // Thanh chống xoay phụ đồng trục thu gọn (Sub-guide anti-rotation telescopic pin Ø2.4/Ø1.8 mm)
  const subOuterGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.0, 16);
  subOuterGeo.rotateX(Math.PI / 2);
  const subOuterMesh = new THREE.Mesh(subOuterGeo, M.darkSteel);
  subOuterMesh.position.set(-0.66, sY * 0.22, 0);

  const subInnerGeo = new THREE.CylinderGeometry(0.075, 0.075, 1.0, 16);
  subInnerGeo.rotateX(Math.PI / 2);
  const subInnerMesh = new THREE.Mesh(subInnerGeo, M.bolt);
  subInnerMesh.position.set(-0.66, sY * 0.22, 0);

  // Đai ốc tai hồng M3 vặn tay (M3 Hand-Tightened Wing Nut) khóa cứng ống ngoài Ø4.2 mm lên trục Ø3.0 mm
  const m3WingNut = buildM3WingNut(M, sY);
  m3WingNut.position.set(xTele, yTele + sY * 0.21, 0);

  centerGuide.add(outerTubeGroup, innerRodGroup, subOuterMesh, subInnerMesh, m3WingNut);

  // 4. Nhóm giữ 2 lá lưỡi bào chữ L xếp chồng lệch mặt phẳng 0.3 mm (0.03 cm)
  const peelGroup = new THREE.Group();
  root.add(peelGroup);

  function updateCarriage(t, stripW, explode = 0) {
    const zBlade = stripW / 2;
    const zEx = explode * 0.9;
    frontHalf.position.z = zBlade + zEx;
    backHalf.position.z = -zBlade - zEx;
    frontHalf.position.y = sY * explode * 0.7;
    backHalf.position.y = sY * explode * 0.7;
    pinG.position.y = sY * explode * 0.65;
    centerGuide.position.y = sY * explode * 1.05;

    // --- QUY TẮC HÌNH HỌC ỐNG LỒNG ĐỒNG TRỤC (ZERO OVERHANG TẠI 4 MM & LỒNG KHÍT TẠI 18 MM) ---
    // Mặt ngoài cùng của má ngàm chữ J nằm tại ±(zBlade + 0.21 cm).
    // Tại stripW = 0.4 cm (4 mm), tổng bề rộng từ mặt ngoài má trước đến mặt ngoài má sau là 0.82 cm.
    // Chọn chiều dài ống ngoài và trục trong co giãn trong khoảng [0.38 cm .. 1.38 cm] (không bao giờ
    // vượt quá khoảng cách giữa 2 mặt ngoài `stripW + 0.18`), neo đầu ngoài vào đúng hốc tai má ngàm
    // tại ±(zBlade + 0.08 cm) → ở 4 mm (0.4 cm) hai ống lồng khít 100% bên trong, TUYỆT ĐỐI KHÔNG
    // có đầu thanh sắt nào thò ra ngoài má con chạy! Ở 18 mm (1.8 cm), ống ngoài và trục trong
    // mỗi bên dài ~1.36 cm nên vẫn gối lồng đồng trục vào nhau 0.76 cm cực kỳ cứng vững.
    const zAnchor = zBlade + 0.08;
    const teleLen = Math.max(0.38, Math.min(1.38, stripW * 0.72 + 0.09));

    outerTubeGroup.scale.set(1, 1, teleLen);
    outerTubeGroup.position.z = (zAnchor + zEx) - teleLen / 2;

    innerRodGroup.scale.set(1, 1, teleLen);
    innerRodGroup.position.z = -(zAnchor + zEx) + teleLen / 2;

    subOuterMesh.scale.set(1, 1, teleLen);
    subOuterMesh.position.z = (zAnchor + zEx) - teleLen / 2;

    subInnerMesh.scale.set(1, 1, teleLen);
    subInnerMesh.position.z = -(zAnchor + zEx) + teleLen / 2;

    // Đai ốc tai hồng M3 gắn trên cổ ống ngoài Ø4.2 mm để ép khóa trục trong Ø3.0 mm
    m3WingNut.position.z = Math.max(0, (zAnchor + zEx) - teleLen * 0.42);

    // --- DỰNG 2 LÁ DAO CHỮ L XẾP CHỒNG LỆCH MẶT PHẲNG 0.3 MM (0.03 CM) + BỤNG CONG 28° ---
    disposeGroup(peelGroup);
    const yEdge = -sY * (bladeW(t) - K.DEPTH_GAP); // mũi bào lùi 1.5 mm so với đỉnh răng cưa
    const clearW = Math.max(0.26, stripW - 0.12);
    // Mỗi lá bào chữ L rộng ~66% bề rộng lòng cắt -> luôn chồng khít ở giữa từ 4..18 mm
    const leafW = Math.max(0.18, clearW * 0.66);
    const zLeafOffset = (clearW - leafW) / 2;

    // Lệch mặt phẳng đúng 0.03 cm (0.3 mm): lá trước +0.015 cm, lá sau -0.015 cm dọc theo pháp tuyến lưỡi
    const halfOffset = (K.BLADE_OFFSET_CM || 0.03) * 0.5;
    const zFrontLeaf = +zLeafOffset + explode * 0.45;
    const zBackLeaf = -zLeafOffset - explode * 0.45;

    const bladeFront = makePeelBlade(M, yEdge, leafW, zFrontLeaf, isLower, +halfOffset);
    const bladeBack = makePeelBlade(M, yEdge, leafW, zBackLeaf, isLower, -halfOffset);
    peelGroup.add(bladeFront, bladeBack);

    // Chốt trượt & rãnh dẫn hướng (Guide Slot & Retaining Pin) giữ 2 lá dao chữ L áp sát nhau
    const nVec = bladeFront.userData.normalVec;
    const dVec = bladeFront.userData.dirVec;
    const E0 = bladeFront.userData.edge;
    const slotCenter = E0.clone().addScaledVector(dVec, 0.52).addScaledVector(nVec, 0.03);
    const guidePin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, Math.max(0.14, leafW * 2 - clearW + 0.08), 14),
      M.bolt
    );
    guidePin.rotation.x = Math.PI / 2;
    guidePin.position.set(slotCenter.x, slotCenter.y, 0);
    peelGroup.add(guidePin);

    // Giá đỡ biên chữ L (Lateral L-Profile Brackets):
    // Bắt sát biên ngoài của từng lá dao (áp sát mặt trong lưỡi răng cưa tại ±clearW/2)
    // và vươn vòng ra má ngàm chữ J bên ngoài — ĐỂ LẠI KHE GIỮA RỖNG XUYÊN TÂM 100% CHO VỎ THOÁT!
    const topF = bladeFront.userData.backTop;
    const topB = bladeBack.userData.backTop;
    const legThickZ = 0.055;
    const peelMat = M.peelSteel || M.peel;

    const buildLateralLBracket = (topPt, zOuterEdge, zSign, bracketMat) => {
      const brkG = new THREE.Group();
      // Cánh đứng chữ L mỏng (0.55 mm) ép sát mặt bên lưỡi răng cưa, hoàn toàn không chắn họng giữa
      const legShape = new THREE.Shape();
      const yBot = topPt.y;
      const yTop = sY * 0.08;
      const yMin = Math.min(yBot, yTop), yMax = Math.max(yBot, yTop);
      legShape.moveTo(topPt.x - 0.14, yMin);
      legShape.lineTo(topPt.x + 0.12, yMin);
      legShape.quadraticCurveTo(topPt.x + 0.16, (yMin + yMax) * 0.5, topPt.x + 0.10, yMax);
      legShape.lineTo(topPt.x - 0.16, yMax);
      legShape.closePath();

      const vertLeg = new THREE.Mesh(extrude(legShape, legThickZ, 0.008, 16), peelMat);
      vertLeg.position.z = zOuterEdge - zSign * (legThickZ * 0.5);
      brkG.add(vertLeg);

      // Tai ngang chữ L (Lateral Mounting Ear) vòng qua mép sống dao bắt vít M3 vào má ngàm chữ J ngoài
      const earGeo = new THREE.BoxGeometry(0.28, 0.08, 0.18);
      const earMesh = new THREE.Mesh(earGeo, bracketMat);
      earMesh.position.set(topPt.x - 0.03, yTop, zOuterEdge + zSign * 0.06);
      // Vít lục giác M3 cố định chân chữ L vào má ngàm chữ J (cố định trên rãnh hạt đậu chỉnh cữ sâu)
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12), M.bolt);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(topPt.x - 0.03, yTop - sY * 0.06, zOuterEdge + zSign * 0.15);
      brkG.add(earMesh, screw);
      return brkG;
    };

    const zFrontEdge = zFrontLeaf + leafW / 2;
    const zBackEdge = zBackLeaf - leafW / 2;
    peelGroup.add(
      buildLateralLBracket(topF, zFrontEdge, +1, M.amber),
      buildLateralLBracket(topB, zBackEdge, -1, M.amberV)
    );

    peelGroup.position.y = -sY * explode * 0.85;
    peelGroup.traverse((o) => { if (!o.userData.part) o.userData.part = 'peel'; });
  }

  root.traverse((o) => { if (!o.userData.part) o.userData.part = 'carriage'; });
  return { root, frontHalf, backHalf, pinG, peelGroup, updateCarriage };
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

  // ---------- HM226 / Phương án A / Phương án C ----------
  T.hmU = new THREE.Group(); T.upper.add(T.hmU);
  T.hmL = new THREE.Group(); T.lower.add(T.hmL);
  T.geoUpSmooth = extrude(jawShape(1, null), 0.14);
  T.geoUpNotched = extrude(jawShape(1, notches), 0.14);
  T.geoLoSmooth = extrude(jawShape(-1, null), 0.14);
  T.geoLoNotched = extrude(jawShape(-1, notches), 0.14);

  T.upF = new THREE.Mesh(T.geoUpNotched, M.steel); T.upB = new THREE.Mesh(T.geoUpNotched, M.steel);
  T.loF = new THREE.Mesh(T.geoLoSmooth, M.steel); T.loB = new THREE.Mesh(T.geoLoSmooth, M.steel);
  [T.upF, T.upB, T.loF, T.loB].forEach((m) => { m.userData.part = 'blade'; });
  T.hmU.add(T.upF, T.upB); T.hmL.add(T.loF, T.loB);

  const [nx, ny] = K.offsetPoint(0.13, 0.7);
  T.nutU = wingNutBolt(M, W0 + 1.35); T.nutU.position.set(nx, ny, 0);
  T.nutL = wingNutBolt(M, W0 + 1.35); T.nutL.position.set(nx, -ny, 0);
  T.hmU.add(T.nutU); T.hmL.add(T.nutL);

  // ---------- Con chạy Hàm Trên (Dùng cho cả Phương án A & Phương án C) ----------
  // Gồm 2 nửa lồng trượt trên 2 thanh dẫn hướng + 2 lá lưỡi bào chữ L lồng nhau (tự co giãn 4..18 mm!)
  T.upperCarriageSys = buildTelescopicCarriage(M, false);
  T.carriage = T.upperCarriageSys.root;
  T.peelA = T.upperCarriageSys.peelGroup;
  T.hmU.add(T.carriage);

  // ---------- Con chạy Đối Xứng Hàm Dưới (Dành riêng cho Phương án C — Cắt Kép 180°) ----------
  // Giúp người nông dân chỉ cần bóp & xoay lắc cổ tay 180° (nửa vòng) là 2 lưỡi bào trên-dưới bóc đứt trọn 360°!
  T.lowerCarriageSys = buildTelescopicCarriage(M, true);
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
