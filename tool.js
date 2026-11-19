/* ============================================================================
   tool.js (v6) — Dựng hình 3D kéo HM226, Phương án A, Phương án B
   và Phương án C (Tối ưu thực tế: Đế chữ V lót PTFE gắn ốc cánh chuồn + Dao bào thay nhanh).
   Hỗ trợ điều chỉnh động Bề rộng lớp vỏ bóc W (khoảng cách giữa 2 lưỡi rạch: 4..18 mm).
   ============================================================================ */
import * as THREE from 'three';
import * as K from './kinematics.js?v=6';

const W0 = K.STRIP_WIDTH; // 1.3 cm (13 mm baseline)
const RAKE = THREE.MathUtils.degToRad(K.RAKE_DEG);
const V2 = (x, y) => new THREE.Vector2(x, y);

export const bladeW = (t) =>
  K.BLADE_WIDTH * (0.62 + 0.38 * Math.min(1, Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * 1.6));

export function extrude(shape, depth, bevel = 0.02) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 6,
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
    if (notches) for (const n of notches) if (Math.abs(t - n.t) < 0.011) d -= 0.17;
    const [x, y] = K.offsetPoint(t, d); P(x, y);
  }
  P(-0.8, 0.66);
  return new THREE.Shape(v);
}

/** Lưỡi bào ngang nghiêng 28°: mép cắt tại (0, yEdge), hướng +X cục bộ */
export function makePeelBlade(M, yEdge, width) {
  const g = new THREE.Group();
  const L = 0.95, th = 0.11;
  const d = V2(-Math.cos(RAKE), Math.sin(RAKE));
  const n = V2(Math.sin(RAKE), Math.cos(RAKE));
  const E = V2(0, yEdge);
  const p1 = E.clone().addScaledVector(d, L);
  const p2 = p1.clone().addScaledVector(n, th);
  const p3 = E.clone().addScaledVector(d, 0.3).addScaledVector(n, th);
  const blade = new THREE.Mesh(extrude(new THREE.Shape([E, p1, p2, p3]), width, 0), M.peel);
  blade.userData.part = 'peel';
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, width + 0.02, 6), M.edge);
  edge.rotation.x = Math.PI / 2;
  edge.position.set(E.x - 0.01, E.y + 0.012, 0);
  g.add(blade, edge);
  g.userData.backTop = p2;
  g.userData.edge = E;
  g.userData.baseWidth = width;
  return g;
}

function wingNutBolt(M, len) {
  const g = new THREE.Group();
  const cyl = (r1, r2, h, s, m) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, s), m); o.rotation.x = Math.PI / 2; return o; };
  const shaft = cyl(0.13, 0.13, len, 12, M.bolt);
  const head = cyl(0.28, 0.28, 0.18, 6, M.bolt); head.position.z = -len / 2;
  const spacer = cyl(0.24, 0.24, W0 - 0.2, 14, M.darkSteel); // long đền / ống cách 2 lưỡi
  const nut = new THREE.Group(); nut.position.z = len / 2;
  nut.add(cyl(0.24, 0.28, 0.22, 12, M.bolt));
  const wing = new THREE.BoxGeometry(0.14, 0.55, 0.26);
  [-1, 1].forEach((s) => { const w = new THREE.Mesh(wing, M.bolt); w.position.set(0, s * 0.33, 0.06); w.rotation.x = s * 0.2; nut.add(w); });
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

  // ---------- HM226 / Phương án A / Phương án C (Giữ hàm cong thép HM226) ----------
  T.hmU = new THREE.Group(); T.upper.add(T.hmU);
  T.hmL = new THREE.Group(); T.lower.add(T.hmL);
  T.geoUpSmooth = extrude(jawShape(1, null), 0.14);
  T.geoUpNotched = extrude(jawShape(1, notches), 0.14);
  const geoLo = extrude(jawShape(-1, null), 0.14);
  T.upF = new THREE.Mesh(T.geoUpNotched, M.steel); T.upB = new THREE.Mesh(T.geoUpNotched, M.steel);
  T.loF = new THREE.Mesh(geoLo, M.steel); T.loB = new THREE.Mesh(geoLo, M.steel);
  [T.upF, T.upB, T.loF, T.loB].forEach((m) => { m.userData.part = 'blade'; });
  T.hmU.add(T.upF, T.upB); T.hmL.add(T.loF, T.loB);
  const [nx, ny] = K.offsetPoint(0.13, 0.7);
  T.nutU = wingNutBolt(M, W0 + 1.1); T.nutU.position.set(nx, ny, 0);
  T.nutL = wingNutBolt(M, W0 + 1.1); T.nutL.position.set(nx, -ny, 0);
  T.hmU.add(T.nutU); T.hmL.add(T.nutL);

  // ---------- Phương án A: Con chạy sống lưng + Chốt lò xo + Lưỡi bào ----------
  T.carriage = new THREE.Group(); T.hmU.add(T.carriage);
  T.carBody = new THREE.Group(); T.carriage.add(T.carBody);
  T.carBridge = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, W0 + 0.62), M.amber);
  T.carBridge.position.set(-0.35, 0.2, 0);
  const cheekGeo = new THREE.BoxGeometry(1.35, 0.95, 0.12);
  T.cheekF = new THREE.Mesh(cheekGeo, M.amber); T.cheekF.position.set(-0.35, -0.22, W0 / 2 + 0.16);
  T.cheekB = new THREE.Mesh(cheekGeo, M.amber); T.cheekB.position.set(-0.35, -0.22, -(W0 / 2 + 0.16));
  T.carBody.add(T.carBridge, T.cheekF, T.cheekB);
  T.pin = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 14), M.darkSteel); housing.position.y = 0.55;
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.2, 16), M.red); btn.position.y = 0.85;
  const ptip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8), M.bolt); ptip.position.y = 0.08;
  T.pin.add(housing, btn, ptip); T.carBody.add(T.pin);
  T.carriage.traverse((o) => { o.userData.part = 'carriage'; });
  T.peelA = new THREE.Group(); T.carriage.add(T.peelA);

  T.buildPeelA = (t, stripW = W0) => {
    disposeGroup(T.peelA);
    const yEdge = -(bladeW(t) - K.DEPTH_GAP); // mũi bào cao hơn đỉnh răng 1.5 mm
    const pW = Math.max(0.22, stripW - 0.16);
    const blade = makePeelBlade(M, yEdge, pW);
    const top = blade.userData.backTop;
    const stemH = Math.max(0.2, 0.05 - top.y);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.32, stemH, Math.max(0.18, stripW - 0.24)), M.amber);
    stem.position.set(top.x - 0.05, top.y + stemH / 2, 0);
    const defl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, Math.max(0.18, stripW - 0.24)), M.amber);
    defl.position.set(top.x - 0.5, top.y + 0.4, 0); defl.rotation.z = -0.9;
    // Vít hãm thay nhanh lưỡi bào thực tế (M3 thumb screw)
    const clampScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.28, 12), M.bolt);
    clampScrew.position.set(top.x - 0.15, top.y + stemH * 0.45, 0);
    clampScrew.rotation.z = Math.PI / 2;
    T.peelA.add(blade, stem, defl, clampScrew);
    T.peelA.traverse((o) => { if (!o.userData.part) o.userData.part = 'peel'; });
    T.peelAEdge = blade.userData.edge;
  };

  // ---------- Phương án C (TỐI ƯU THỰC TẾ): Giữ nguyên thân kéo HM226 + Đế trượt chữ V bọc PTFE lắp vào hàm dưới ----------
  // Không cần cắt bỏ hàm dưới HM226! Đế chữ V (V-block) bắt trực tiếp lên hàm dưới qua chốt bu-lông ốc cánh chuồn.
  T.cLowerSaddle = new THREE.Group();
  T.lower.add(T.cLowerSaddle);
  {
    const { left, right } = K.vFaceDirs();
    const V = V2(...K.B.vertex);
    const Lt = V.clone().add(V2(...left).multiplyScalar(3.3));
    const Rt = V.clone().add(V2(...right).multiplyScalar(3.3));
    const th = 0.45;
    const nLo = V2(-left[1], left[0]), nRo = V2(right[1], -right[0]);
    const VO = V.clone().add(V2(0, -th / Math.sin(K.B.halfAngle)));
    const saddleShape = new THREE.Shape([Lt, V, Rt, Rt.clone().addScaledVector(nRo, th), VO, Lt.clone().addScaledVector(nLo, th)]);
    T.cSaddleBody = new THREE.Mesh(extrude(saddleShape, W0 - 0.18, 0.03), M.amber);
    T.cLinerPads = new THREE.Group();
    // 2 má trượt nhựa kỹ thuật PTFE/POM trắng ngà tự bôi trơn, chống kẹt nhựa cây (thay cho ổ bi con lăn)
    K.rollerCentersLocal().forEach(([rx, ry], idx) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(K.B.rollerR, K.B.rollerR, W0 + 0.1, 20), M.roller);
      pad.rotation.x = Math.PI / 2;
      pad.position.set(rx, ry, 0);
      T.cLinerPads.add(pad);
    });
    T.cLowerSaddle.add(T.cSaddleBody, T.cLinerPads);
    T.cLowerSaddle.traverse((o) => { o.userData.part = 'vjaw'; });
  }

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
  T.bHousing = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.42, W0 + 0.55), M.amber); T.bHousing.position.y = -0.2;
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
  T.peelB = makePeelBlade(M, tipY + K.DEPTH_GAP, W0 - 0.2);
  T.stemB = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, W0 - 0.3), M.amber);
  const tb = T.peelB.userData.backTop; T.stemB.position.set(tb.x, Math.min(-0.4, tb.y + 0.2), 0);
  T.peelBG = new THREE.Group(); T.peelBG.add(T.peelB, T.stemB); T.bHeadInner.add(T.peelBG);
  T.nutB = wingNutBolt(M, W0 + 1.1); T.nutB.position.set(-0.75, -0.2, 0); T.bHeadInner.add(T.nutB);
  T.bHead.traverse((o) => { if (!o.userData.part) o.userData.part = 'bhead'; });
  T.peelB.traverse((o) => { o.userData.part = 'peel'; });

  return T;
}
