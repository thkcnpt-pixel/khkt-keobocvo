/* ============================================================================
   tool.js (v10 — Rev 2 Mechanical Real-World Architecture):
   1. PA 2 (Khuyến nghị KHKT / Tải nặng):
      - Lưỡi HM226 khoan 5 lỗ xuyên Ø4.2 mm tại Y = -4.5 mm (bước 7.80 mm, bảo toàn 79.8%).
      - 02 má kẹp gọn Inox 304 dày 2.0 mm (vát 45° sau né ốc M5 HM226).
      - 02 bu-lông ren suốt DIN 933 M4 xuyên lỗ + 01 bu-lông M4 chống xoay trên (-9.6, +2.5)
        + Đai ốc khóa Nyloc M4 + Ống đệm nhôm 6061 Ø8×Ø4.3 mm co giãn đúng khe W_clear.
   2. PA 1-Rev2 (Khuyến nghị DIY Không khoan lưỡi HM226):
      - 3 khấc đáy U (1.5×3.2 mm, bo đáy r=0.5 mm, vách 90°) trên sống lưng.
      - 02 má khoét vòm Inox 304 dày 3.0 mm + Khóa đòn bẩy 3 điểm 2 tầng M5/M4
        + Tấm đệm treo nhôm 6061 + Chốt ống đàn hồi DIN 1481 Ø3.0 mm tại (+6.5, -0.16) mm.
   3. Họng thoát phoi Open-Sky (mở lên trời 100% vùng X ∈ [-7.5, +5.0] mm)
      + Cổ chữ C sau (Rear C-Throat 2.0×11.0 mm) khóa 2 điểm
      + Hệ lưỡi bào 2 tầng (Tầng 1: 4–10 mm; Tầng 2: T-Anvil 10 mm + lưỡi SK5 1.5 mm + 2 vít DIN 7991).
   ============================================================================ */
import * as THREE from 'three';
import * as K from './kinematics.js?v=10';

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
        const halfT = 0.0145; // ~1.6 mm nửa bề rộng khấc 3.2 mm
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

  // Lưới 5 lỗ khoan xuyên Ø4.2 mm (r = 0.21 cm) tại Y = -4.5 mm cho PA 2
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

/** Lưỡi bào phẳng SK5 1.5 mm vát 1 mặt 28° có bụng dẫn phoi hướng lên họng Open-Sky */
export function makePeelBlade(M, yEdge, width, zOffset = 0, flipY = false, normalOffset = 0) {
  const g = new THREE.Group();
  const L = 1.05, th = 0.15;
  const sY = flipY ? -1 : 1;
  const d = V2(-Math.cos(RAKE), sY * Math.sin(RAKE));
  const n = V2(Math.sin(RAKE), sY * Math.cos(RAKE));

  const E = V2(0, yEdge).addScaledVector(n, normalOffset);
  const pBellyMid = E.clone().addScaledVector(d, L * 0.46).addScaledVector(n, -0.04);
  const p1 = E.clone().addScaledVector(d, L).addScaledVector(n, 0.08);
  const p2 = p1.clone().addScaledVector(n, th);
  const pBackMid = E.clone().addScaledVector(d, L * 0.52).addScaledVector(n, th * 0.75);
  const p3 = E.clone().addScaledVector(d, 0.24).addScaledVector(n, th * 0.88);

  const shape = new THREE.Shape();
  shape.moveTo(E.x, E.y);
  shape.quadraticCurveTo(pBellyMid.x, pBellyMid.y, p1.x, p1.y);
  shape.lineTo(p2.x, p2.y);
  shape.quadraticCurveTo(pBackMid.x, pBackMid.y, p3.x, p3.y);
  shape.closePath();

  const peelMat = M.peelSteel || M.peel;
  const blade = new THREE.Mesh(extrude(shape, width, 0.008, 20), peelMat);
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

/**
 * Tạo cụm bu-lông ren suốt DIN 933 + đai ốc khóa Nyloc (vòng nhựa xanh dương đặc trưng)
 * + ống đệm nhôm 6061 (Ø8×Ø4.3 mm) co giãn chính xác theo khe hở W_clear.
 */
function makeThroughBoltAssembly(M, x, y, diaCm, spanZ, clearW, explode, zDir = 1, includeSpacer = true) {
  const g = new THREE.Group();
  g.position.set(x, y, 0);
  const rShaft = diaCm * 0.5;
  const rHead = diaCm * 0.88;
  const headH = diaCm * 0.65;
  const boltLen = spanZ + headH * 2 + 0.36;

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(rShaft, rShaft, boltLen, 16), M.bolt);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = zDir * explode * 0.65;
  g.add(shaft);

  const head = new THREE.Mesh(new THREE.CylinderGeometry(rHead, rHead, headH, 6), M.bolt);
  head.rotation.x = Math.PI / 2;
  head.position.z = -spanZ * 0.5 - headH * 0.5 - explode * 0.85;
  g.add(head);

  const fwGeo = new THREE.CylinderGeometry(rHead * 1.15, rHead * 1.15, 0.08, 18);
  const fw1 = new THREE.Mesh(fwGeo, M.steel);
  fw1.rotation.x = Math.PI / 2;
  fw1.position.z = -spanZ * 0.5 - 0.04 - explode * 0.5;
  const fw2 = new THREE.Mesh(fwGeo, M.steel);
  fw2.rotation.x = Math.PI / 2;
  fw2.position.z = spanZ * 0.5 + 0.04 + explode * 0.5;
  g.add(fw1, fw2);

  const nutG = new THREE.Group();
  const nutHex = new THREE.Mesh(new THREE.CylinderGeometry(rHead, rHead, headH * 1.05, 6), M.bolt);
  nutHex.rotation.x = Math.PI / 2;
  const nylocRing = new THREE.Mesh(
    new THREE.TorusGeometry(rShaft * 1.12, rShaft * 0.24, 10, 18),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.05 })
  );
  nylocRing.position.z = headH * 0.48;
  nutG.add(nutHex, nylocRing);
  nutG.position.z = spanZ * 0.5 + headH * 0.55 + explode * 1.15;
  g.add(nutG);

  if (includeSpacer && clearW > 0.14) {
    const alMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.28, metalness: 0.86 });
    const spacer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.40, 0.40, Math.max(0.14, clearW - 0.02), 20),
      alMat
    );
    spacer.rotation.x = Math.PI / 2;
    g.add(spacer);
  }
  return g;
}

/** Má kẹp gọn PA 2 (Inox 304 dày 2.0 mm, vát 45° sau né ốc M5 HM226) */
function makePA2CheekGeo(sY) {
  const sh = new THREE.Shape();
  const Y = (v) => sY * v;
  sh.moveTo(-0.95, Y(-0.75));
  sh.lineTo(+0.95, Y(-0.75));
  sh.lineTo(+0.95, Y(+0.38));
  sh.quadraticCurveTo(+0.95, Y(+0.55), +0.75, Y(+0.55));
  sh.lineTo(-1.12, Y(+0.55));
  sh.quadraticCurveTo(-1.32, Y(+0.55), -1.32, Y(+0.35));
  sh.lineTo(-1.32, Y(-0.15));
  sh.lineTo(-0.95, Y(-0.75));
  sh.closePath();

  [[-0.96, -0.45], [+0.60, -0.45], [-0.96, +0.25]].forEach(([hx, hy]) => {
    const h = new THREE.Path();
    h.absarc(hx, Y(hy), 0.21, 0, Math.PI * 2, true);
    sh.holes.push(h);
  });
  return extrude(sh, 0.20, 0.018, 20);
}

/** Má khoét vòm PA 1-Rev2 (Inox 304 dày 3.0 mm, khoét vòm mở họng Open-Sky ở giữa) */
function makePA1CheekGeo(sY) {
  const sh = new THREE.Shape();
  const Y = (v) => sY * v;
  sh.moveTo(-0.95, Y(-0.50));
  sh.lineTo(-0.75, Y(-0.50));
  sh.lineTo(-0.75, Y(+0.18));
  sh.quadraticCurveTo(-0.12, Y(+0.48), +0.50, Y(+0.18));
  sh.lineTo(+0.50, Y(-0.50));
  sh.lineTo(+1.60, Y(-0.50));
  sh.lineTo(+1.60, Y(+0.98));
  sh.quadraticCurveTo(+1.60, Y(+1.15), +1.40, Y(+1.15));
  sh.lineTo(-1.30, Y(+1.15));
  sh.quadraticCurveTo(-1.50, Y(+1.15), -1.50, Y(+0.95));
  sh.lineTo(-1.50, Y(+0.05));
  sh.lineTo(-0.95, Y(-0.50));
  sh.closePath();

  [[-1.05, +0.35, 0.26], [+1.15, +0.35, 0.26], [-1.05, +0.95, 0.21], [+1.15, +0.95, 0.21], [+0.65, -0.016, 0.15]].forEach(([hx, hy, hr]) => {
    const h = new THREE.Path();
    h.absarc(hx, Y(hy), hr, 0, Math.PI * 2, true);
    sh.holes.push(h);
  });
  return extrude(sh, 0.30, 0.02, 20);
}

/**
 * Con chạy cơ khí Rev 2 — Hỗ trợ đồng thời cả PA 2 (Xuyên 5 lỗ M4) & PA 1-Rev2 (DIY Đòn bẩy 3 điểm M5/M4 + Chốt ống DIN 1481 Ø3.0)
 * + Họng thoát phoi Open-Sky vô hạn + Cổ chữ C sau (Rear C-Throat) + Hệ lưỡi bào 2 tầng (Tầng 1 / Tầng 2 T-Anvil).
 */
function buildRev2Carriage(M, isLower = false) {
  const sY = isLower ? -1 : 1;
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const peelGroup = new THREE.Group();
  root.add(bodyGroup, peelGroup);

  const alMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.26, metalness: 0.88 });
  const pinSpringMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.78 });
  const cThroatMat = M.amberV;

  const pa2CheekGeo = makePA2CheekGeo(sY);
  const pa1CheekGeo = makePA1CheekGeo(sY);

  let lastKey = '';

  function updateCarriage(stripW, yEdge, explode = 0, archType = 'pa2') {
    const key = `${archType}_${stripW.toFixed(3)}_${yEdge.toFixed(3)}_${explode.toFixed(3)}`;
    if (key === lastKey) return;
    lastKey = key;

    disposeGroup(bodyGroup);
    disposeGroup(peelGroup);

    const bladeTh = 0.14;
    const clearW = Math.max(0.26, stripW - bladeTh);
    const zBladeOuter = stripW * 0.5 + bladeTh * 0.5;
    const isPA1 = archType === 'pa1';
    const cheekTh = isPA1 ? 0.30 : 0.20;
    const zCheekCenter = zBladeOuter + cheekTh * 0.5 + explode * 1.1;
    const totalSpanZ = (zBladeOuter + cheekTh) * 2;

    // 1. 02 Má kẹp ngoài
    const cheekGeo = isPA1 ? pa1CheekGeo : pa2CheekGeo;
    const fCheek = new THREE.Mesh(cheekGeo, M.amber);
    fCheek.position.z = +zCheekCenter;
    const bCheek = new THREE.Mesh(cheekGeo, M.amberV);
    bCheek.position.z = -zCheekCenter;
    bodyGroup.add(fCheek, bCheek);

    // 2. Hệ khóa cưỡng bức theo từng phương án
    if (!isPA1) {
      bodyGroup.add(
        makeThroughBoltAssembly(M, -0.96, sY * (-0.45), 0.40, totalSpanZ, clearW, explode, 1, true),
        makeThroughBoltAssembly(M, +0.60, sY * (-0.45), 0.40, totalSpanZ, clearW, explode, 1, true),
        makeThroughBoltAssembly(M, -0.96, sY * (+0.25), 0.40, totalSpanZ, clearW, explode, 1, true)
      );
    } else {
      bodyGroup.add(
        makeThroughBoltAssembly(M, -1.05, sY * (+0.35), 0.50, totalSpanZ, clearW, explode, 1, false),
        makeThroughBoltAssembly(M, +1.15, sY * (+0.35), 0.50, totalSpanZ, clearW, explode, 1, false),
        makeThroughBoltAssembly(M, -1.05, sY * (+0.95), 0.40, totalSpanZ, clearW, explode, 1, true),
        makeThroughBoltAssembly(M, +1.15, sY * (+0.95), 0.40, totalSpanZ, clearW, explode, 1, true)
      );
      const hangerGeo = new THREE.BoxGeometry(0.62, 0.96, Math.max(0.14, clearW - 0.02));
      const hRear = new THREE.Mesh(hangerGeo, alMat);
      hRear.position.set(-1.05, sY * 0.06, 0);
      const hFront = new THREE.Mesh(hangerGeo, alMat);
      hFront.position.set(+1.15, sY * 0.06, 0);
      bodyGroup.add(hRear, hFront);

      const rollPinLen = totalSpanZ + 0.14;
      const rollPin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, rollPinLen, 16), pinSpringMat);
      rollPin.rotation.x = Math.PI / 2;
      rollPin.position.set(+0.65, sY * (-0.016), explode * 1.45);
      const slotStripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, rollPinLen + 0.02), M.steel);
      slotStripe.position.set(+0.65, sY * (0.13), explode * 1.45);
      bodyGroup.add(rollPin, slotStripe);
    }

    // 3. Cổ chữ C sau (Rear C-Throat 2.0×11.0 mm) khóa 2 điểm
    const throatW = Math.min(clearW - 0.04, 0.36);
    const cShape = new THREE.Shape();
    const Y = (v) => sY * v;
    const yBackTop = isPA1 ? 0.95 : 0.25;
    const yBladeSeat = yEdge + sY * 0.24;
    cShape.moveTo(-1.26, Y(yBackTop + 0.18));
    cShape.lineTo(-0.76, Y(yBackTop + 0.18));
    cShape.lineTo(-0.76, yBladeSeat + sY * 0.28);
    cShape.quadraticCurveTo(-0.76, yBladeSeat - sY * 0.06, -0.42, yBladeSeat - sY * 0.06);
    cShape.lineTo(-0.42, yBladeSeat - sY * 0.26);
    cShape.lineTo(-1.12, yBladeSeat - sY * 0.26);
    cShape.quadraticCurveTo(-1.38, yBladeSeat - sY * 0.26, -1.38, yBladeSeat + sY * 0.12);
    cShape.lineTo(-1.26, Y(yBackTop + 0.18));
    cShape.closePath();

    const cThroat = new THREE.Mesh(extrude(cShape, Math.max(0.18, throatW), 0.014, 16), cThroatMat);
    cThroat.position.y = -sY * explode * 0.45;
    peelGroup.add(cThroat);

    // 4. Hệ lưỡi bào 2 tầng (Tầng 1: 4-10 mm | Tầng 2: T-Anvil 10mm + lưỡi SK5 1.5mm + 2 vít DIN 7991)
    const bladeSpan = Math.max(0.24, clearW - 0.04);
    const isTier2 = stripW > 1.05;

    const mainBlade = makePeelBlade(M, yEdge, bladeSpan, 0, isLower, 0);
    mainBlade.position.y = -sY * explode * 0.85;
    peelGroup.add(mainBlade);

    if (isTier2) {
      const anvilW = Math.min(bladeSpan - 0.06, 1.00);
      const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, anvilW), alMat);
      anvil.position.set(-0.44, yEdge + sY * 0.22 - sY * explode * 0.65, 0);
      peelGroup.add(anvil);

      const screwZ = anvilW * 0.30;
      [-screwZ, +screwZ].forEach((sz) => {
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.055, 0.18, 12), M.bolt);
        screw.position.set(-0.44, yEdge + sY * 0.25 - sY * explode * 1.05, sz);
        peelGroup.add(screw);
      });
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

  // ---------- HM226 / PA 2 (5 lỗ Ø4.2) / PA 1-Rev2 (3 khấc đáy U) / Phương án C ----------
  T.hmU = new THREE.Group(); T.upper.add(T.hmU);
  T.hmL = new THREE.Group(); T.lower.add(T.hmL);
  T.geoUpSmooth = extrude(jawShape(1, null), 0.14);
  T.geoUpPA2 = extrude(jawShape(1, 'pa2'), 0.14);
  T.geoUpPA1 = extrude(jawShape(1, 'pa1'), 0.14);
  T.geoUpNotched = T.geoUpPA2;

  T.geoLoSmooth = extrude(jawShape(-1, null), 0.14);
  T.geoLoPA2 = extrude(jawShape(-1, 'pa2'), 0.14);
  T.geoLoNotched = T.geoLoPA2;

  T.upF = new THREE.Mesh(T.geoUpPA2, M.steel); T.upB = new THREE.Mesh(T.geoUpPA2, M.steel);
  T.loF = new THREE.Mesh(T.geoLoSmooth, M.steel); T.loB = new THREE.Mesh(T.geoLoSmooth, M.steel);
  [T.upF, T.upB, T.loF, T.loB].forEach((m) => { m.userData.part = 'blade'; });
  T.hmU.add(T.upF, T.upB); T.hmL.add(T.loF, T.loB);

  const [nx, ny] = K.offsetPoint(0.13, 0.7);
  T.nutU = wingNutBolt(M, W0 + 1.35); T.nutU.position.set(nx, ny, 0);
  T.nutL = wingNutBolt(M, W0 + 1.35); T.nutL.position.set(nx, -ny, 0);
  T.hmU.add(T.nutU); T.hmL.add(T.nutL);

  // ---------- Con chạy Hàm Trên Rev 2 (Hỗ trợ cả PA 2 & PA 1-Rev2) ----------
  T.upperCarriageSys = buildRev2Carriage(M, false);
  T.carriage = T.upperCarriageSys.root;
  T.peelA = T.upperCarriageSys.peelGroup;
  T.hmU.add(T.carriage);

  // ---------- Con chạy Đối Xứng Hàm Dưới (Dành riêng cho Phương án C — Cắt Kép 180°) ----------
  T.lowerCarriageSys = buildRev2Carriage(M, true);
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
