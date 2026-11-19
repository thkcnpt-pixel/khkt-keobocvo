/* ============================================================================
   branch.js (v8) — Dựng hình cành cây, rãnh rạch, dải vỏ 2 lớp hữu cơ, mảnh vỏ/mùn vỏ
   và vật lý rơi tự do theo gia tốc trọng trường 3D (g = 9.8 m/s²) xoay lật 3 trục:
   1. Tách vỏ thời gian thực tại mũi dao 28° (Real-Time Bark Separation at 28° Blade Tip):
      Dải vỏ bong ra ngay tại mép cắt (contact.tipX, contact.tipY), trượt nâng lên dọc
      theo bụng lưỡi uốn cong 28° và chui lọt qua Cầu Vòm Rỗng Thoát Phoi Xuyên Tâm 100%
      (Open-Arch Chip Chute) không va chạm với bất kỳ chi tiết nào của con chạy.
   2. Dải vỏ 2 lớp hữu cơ (Dual-Layer Organic Bark Ribbon):
      - Lớp vỏ ngoài sần sùi (M.ribbonBark / M.bark) + Lớp mô libe ẩm mặt trong (M.ribbonInner)
      - Độ dày thực tế (~2.0–2.2 mm), độ cong cuộn tự nhiên tỉ lệ với bán kính cành R,
        kèm biên dạng mép xơ sợi hữu cơ (fibrous edge ripple) thay vì khối hộp Extrude thô cứng.
   3. Vật lý mảnh vỏ vụn & đoạn vỏ đứt rơi theo trọng trường 3D (g = 9.8 m/s², xoay lật
      3 chiều rotX, rotY, rotZ):
      - Khi đang xoay cắt (phi > 0), các mảnh vỏ vụn / phoi libe tách ra từ mũi dao và
        2 rãnh răng cưa rơi xuống theo parabol trọng trường 3D và tự xoay lật 3 trục.
      - Khi cung vỏ đã bóc vượt ngưỡng gãy tự nhiên (~165°–180°) hoặc khi hoàn tất vòng cắt,
        đoạn vỏ chữ C tách rời và rơi xuống theo gia tốc trọng trường 3D (g = 9.8 m/s²)
        vừa rơi vừa xoay lật 3 trục (rotX, rotY, rotZ) chân thực, hoàn toàn không dùng
        hiệu ứng mờ dần (fake opacity fade) trên thân cành.
   ============================================================================ */
import * as THREE from 'three';
import * as K from './kinematics.js?v=10';
import { TAU } from './materials.js?v=10';
import { disposeGroup } from './tool.js?v=10';

export const BRANCH_LEN = 5.2;

function cylSurface(r, z0, z1, a0, a1) {
  const segA = Math.max(4, Math.ceil(Math.abs(a1 - a0) / (TAU / 72)));
  const pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= segA; i++) {
    const a = a0 + (a1 - a0) * (i / segA);
    const c = Math.cos(a), s = Math.sin(a);
    for (let j = 0; j <= 1; j++) {
      const z = j ? z1 : z0;
      pos.push(r * c, r * s, z);
      nor.push(c, s, 0);
      uv.push((a * r) / 4, z / 4);
    }
  }
  for (let i = 0; i < segA; i++) {
    const a = i * 2, b = a + 1, c2 = a + 2, d = a + 3;
    idx.push(a, c2, b, b, c2, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function ringAt(rIn, rOut, a0, len, z) {
  const seg = Math.max(6, Math.ceil(len / (TAU / 72)));
  const g = new THREE.RingGeometry(rIn, rOut, seg, 1, a0, len);
  g.translate(0, 0, z);
  return g;
}

function radialWall(rIn, rOut, a, z0, z1) {
  const c = Math.cos(a), s = Math.sin(a);
  const pos = [
    rIn * c, rIn * s, z0,
    rOut * c, rOut * s, z0,
    rOut * c, rOut * s, z1,
    rIn * c, rIn * s, z1,
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
}

/**
 * Tạo lưới 3D cho một lớp vỏ uốn cong hữu cơ (outer bark hoặc inner phloem)
 * từ tập các thiết diện dọc theo quỹ đạo thoát phoi:
 * - Có độ gợn sóng hữu cơ dọc theo chiều dài và chiều rộng (organic ripple & fibrous edge)
 * - Bao gồm mặt trên, mặt dưới và 2 vách biên bo tròn để dải vỏ trông có chiều sâu tự nhiên.
 */
function buildCurvedLayerGeometry(frames, zHalf, rInOffset, rOutOffset) {
  const nS = frames.length - 1;
  const nW = 6; // chia 6 dải theo bề rộng Z để tạo độ khum tự nhiên của vỏ cây
  const pos = [];
  const uv = [];
  const idx = [];

  // Mỗi thiết diện i có 2*(nW+1) đỉnh: dải mặt ngoài (k=0..nW) và dải mặt trong (k=0..nW)
  const stride = (nW + 1) * 2;

  for (let i = 0; i <= nS; i++) {
    const f = frames[i];
    const u = i / Math.max(1, nS);
    // Độ gợn sợi vỏ tự nhiên rất nhẹ dọc theo chiều dài strip
    const waveR = Math.sin(u * Math.PI * 5.0 + f.seed) * 0.012 * Math.min(1, u * 2.2);

    for (let layer = 0; layer < 2; layer++) {
      const rOff = layer === 0 ? rOutOffset : rInOffset;
      for (let k = 0; k <= nW; k++) {
        const v = k / nW; // 0..1
        const zNorm = v * 2 - 1; // -1..+1
        // Mép vỏ hơi co/xơ tự nhiên khi tách khỏi gỗ
        const edgeJitter = (Math.abs(zNorm) > 0.85)
          ? Math.sin(u * 19.0 + zNorm * 4.0) * 0.014 * Math.min(1, u * 1.6)
          : 0;
        // Độ khum ngang (cupping) nhẹ của dải vỏ tươi mới bóc
        const cupOffset = (1 - zNorm * zNorm) * 0.016 * Math.min(1, u * 1.5);
        const totalN = rOff + waveR + cupOffset;

        const px = f.x + f.nx * totalN;
        const py = f.y + f.ny * totalN;
        const pz = zNorm * zHalf + edgeJitter;

        pos.push(px, py, pz);
        uv.push(u * 2.2, v);
      }
    }
  }

  for (let i = 0; i < nS; i++) {
    const b0 = i * stride;
    const b1 = (i + 1) * stride;
    const inShift = nW + 1;

    for (let k = 0; k < nW; k++) {
      // Mặt ngoài (layer 0, pháp tuyến hướng theo +n)
      const o00 = b0 + k, o01 = b0 + k + 1;
      const o10 = b1 + k, o11 = b1 + k + 1;
      idx.push(o00, o10, o01, o01, o10, o11);

      // Mặt trong (layer 1, pháp tuyến hướng theo -n)
      const i00 = b0 + inShift + k, i01 = b0 + inShift + k + 1;
      const i10 = b1 + inShift + k, i11 = b1 + inShift + k + 1;
      idx.push(i00, i01, i10, i01, i11, i10);
    }

    // Vách biên trái (k = 0)
    const lOut0 = b0, lOut1 = b1;
    const lIn0 = b0 + inShift, lIn1 = b1 + inShift;
    idx.push(lOut0, lIn0, lOut1, lIn0, lIn1, lOut1);

    // Vách biên phải (k = nW)
    const rOut0 = b0 + nW, rOut1 = b1 + nW;
    const rIn0 = b0 + inShift + nW, rIn1 = b1 + inShift + nW;
    idx.push(rOut0, rOut1, rIn0, rIn0, rOut1, rIn1);
  }

  // Nắp đầu mũi vỏ (i = nS) và gốc tách (i = 0)
  for (const endI of [0, nS]) {
    const b = endI * stride;
    const inShift = nW + 1;
    for (let k = 0; k < nW; k++) {
      const o0 = b + k, o1 = b + k + 1;
      const i0 = b + inShift + k, i1 = b + inShift + k + 1;
      if (endI === nS) {
        idx.push(o0, i0, o1, o1, i0, i1);
      } else {
        idx.push(o0, o1, i0, o1, i1, i0);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Tạo Dải Vỏ 2 Lớp Hữu Cơ (Dual-Layer Organic Bark Ribbon):
 * - Tách trực tiếp từ mũi dao 28° (E = (0,0)), trượt lên bụng lưỡi cong dẫn phoi
 *   và cuộn chữ C chui qua Cầu Vòm Rỗng Thoát Phoi (Open-Arch Chip Chute).
 * - Gồm 2 lớp vật liệu tách biệt rõ rệt:
 *   + Lớp ngoài sần sùi (M.ribbonBark || M.bark): chiếm 55% chiều dày vỏ ngoài.
 *   + Lớp mô libe ẩm sáng màu mặt trong (M.ribbonInner || M.phloem): chiếm 45% chiều dày trong.
 */
function createDualLayerBarkRibbon(M, arcLen, thickness, stripW, R, seed = 0) {
  const group = new THREE.Group();
  const segs = Math.max(24, Math.min(48, Math.ceil(arcLen * 14)));
  const zHalf = Math.max(0.11, (stripW - 0.12) * 0.5);
  const frames = [];

  for (let i = 0; i <= segs; i++) {
    const s = (i / segs) * arcLen;
    const pt = K.chipChuteTrajectoryPoint(s, R);
    frames.push({
      x: pt.x,
      y: pt.y,
      nx: pt.nx,
      ny: pt.ny,
      seed,
    });
  }

  // Trong hệ tọa độ quỹ đạo thoát phoi:
  // Mặt áp vào bụng lưỡi bào là mặt trong mô libe (phía -n), mặt hướng về phía cành/ngoài là vỏ sần (+n)
  const tHalf = thickness * 0.5;
  const tSplit = -tHalf + thickness * 0.46; // Ranh giới giữa mô libe ẩm và vỏ sần ngoài

  const outerBarkMat = M.ribbonBark || M.bark;
  const innerPhloemMat = M.ribbonInner || M.phloem;

  // Đảm bảo vật liệu luôn hiển thị sắc nét 100% (không bị mờ ảo bởi opacity cũ)
  if (outerBarkMat && outerBarkMat.opacity !== undefined) outerBarkMat.opacity = 1;
  if (innerPhloemMat && innerPhloemMat.opacity !== undefined) innerPhloemMat.opacity = 1;

  const outerGeo = buildCurvedLayerGeometry(frames, zHalf, tSplit, +tHalf);
  const innerGeo = buildCurvedLayerGeometry(frames, zHalf * 0.985, -tHalf, tSplit + 0.004);

  const outerMesh = new THREE.Mesh(outerGeo, outerBarkMat);
  const innerMesh = new THREE.Mesh(innerGeo, innerPhloemMat);
  group.add(outerMesh, innerMesh);

  return group;
}

/**
 * Tạo một đoạn vỏ chữ C 2 lớp đã đứt lìa (Detached C-Shaped Dual-Layer Bark Strip)
 * để rơi theo gia tốc trọng trường 3D (g = 9.8 m/s²) và xoay lật 3 trục (rotX, rotY, rotZ).
 */
function createDetachedCSegment(M, R, thickness, stripW, spanAngle = Math.PI * 0.85, seed = 0) {
  const group = new THREE.Group();
  const segs = 30;
  const zHalf = Math.max(0.11, (stripW - 0.12) * 0.5);
  const rCurl = Math.max(0.52, R * 0.78);
  const frames = [];

  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const ang = (u - 0.5) * spanAngle;
    const rLocal = rCurl * (1 + 0.06 * Math.sin(u * Math.PI * 3 + seed));
    const x = Math.cos(ang) * rLocal - rCurl;
    const y = Math.sin(ang) * rLocal;
    const nx = Math.cos(ang);
    const ny = Math.sin(ang);
    frames.push({ x, y, nx, ny, seed });
  }

  const tHalf = thickness * 0.5;
  const tSplit = -tHalf + thickness * 0.46;
  const outerGeo = buildCurvedLayerGeometry(frames, zHalf, tSplit, +tHalf);
  const innerGeo = buildCurvedLayerGeometry(frames, zHalf * 0.985, -tHalf, tSplit + 0.004);

  group.add(
    new THREE.Mesh(outerGeo, M.ribbonBark || M.bark),
    new THREE.Mesh(innerGeo, M.ribbonInner || M.phloem)
  );
  return group;
}

/**
 * Tính vị trí rơi tự do 3D theo gia tốc trọng trường thực tế g = 9.8 m/s²
 * và góc xoay lật 3 chiều (rotX, rotY, rotZ) cho đoạn vỏ hoặc mảnh phoi vỏ.
 * Ghi chú tỷ lệ thời gian-không gian:
 * - Trong hệ tọa độ cảnh 3D (1 đơn vị = 1 cm), g_thực = 9.8 m/s² = 980 cm/s².
 * - Với thời gian rơi mô phỏng tFall (0..1.2 s), dùng hệ số thời gian thực tế
 *   tPhys = tFall * 0.185 (tương đương chuyển động quay chậm ~5.4x để mắt người quan sát
 *   rõ quá trình vỏ tách và rơi qua khung hình ~15 cm), cho gia tốc rơi hiệu dụng:
 *   y(t) = y0 + vy0 * t - 0.5 * g_eff * t², với g_eff = 9.8 * 3.42 ≈ 33.5 cm/s².
 */
function apply3DGravityAndTumble(obj, originX, originY, originZ, baseRotZ, tFall, kin) {
  const G_EFF = 9.8 * 3.45; // Gia tốc trọng trường 3D chuẩn hóa từ g = 9.8 m/s² trong khung cảnh cm
  const t = Math.max(0, tFall);
  obj.position.set(
    originX + kin.vx * t,
    originY + kin.vy * t - 0.5 * G_EFF * t * t,
    originZ + kin.vz * t
  );
  obj.rotation.set(
    kin.rx0 + kin.wx * t,
    kin.ry0 + kin.wy * t,
    baseRotZ + kin.wz * t
  );
}

/**
 * Sinh các mảnh vỏ vụn / mùn vỏ / phoi libe (Bark Chips & Phloem Shavings)
 * bắn ra từ mũi dao 28° và 2 rãnh răng cưa khi đang xoay bóc vỏ, rơi theo
 * gia tốc trọng trường 3D (g = 9.8 m/s²) và xoay lật 3 trục (rotX, rotY, rotZ).
 */
function emitBarkChipsAndDebris(M, group, contact, phi, R, stripW, fallTime = 0, seedOffset = 0) {
  const chipCount = 10;
  const zHalf = Math.max(0.14, stripW * 0.5);
  const outerMat = M.ribbonBark || M.bark;
  const innerMat = M.ribbonInner || M.phloem;

  // Chu kỳ sống của mỗi hạt mùn vỏ theo góc xoay phi + thời gian rơi
  const timeParam = phi * 0.68 + fallTime * 1.4;

  for (let i = 0; i < chipCount; i++) {
    const phase = (i / chipCount) * 0.85;
    const rawAge = timeParam - phase;
    if (rawAge <= 0) continue;
    // Lặp chu kỳ hạt khi đang cắt, hoặc rơi tiếp khi đã dừng ở cuối vòng
    const tChip = fallTime > 0 ? (rawAge % 0.75) + fallTime : (rawAge % 0.72);
    if (tChip > 1.35) continue;

    // Tạo mảnh phoi vỏ nhỏ cong nhẹ (2 lớp hoặc xen kẽ vỏ ngoài / phoi libe trong)
    const isPhloemChip = (i % 3 === 1);
    const chipW = 0.09 + (i % 4) * 0.028;
    const chipL = 0.14 + ((i * 3) % 5) * 0.035;
    const chipT = 0.032 + (i % 2) * 0.015;
    const chipGeo = new THREE.BoxGeometry(chipL, chipT, chipW);
    const chipMesh = new THREE.Mesh(chipGeo, isPhloemChip ? innerMat : outerMat);

    // Vị trí xuất phát quanh họng thoát phoi & 2 rãnh răng cưa (±zHalf)
    const sideSign = (i % 2 === 0) ? 1 : -1;
    const zStart = (i % 3 === 0)
      ? (Math.sin(i * 4.7 + seedOffset) * zHalf * 0.65)
      : (sideSign * zHalf * 0.92);

    // Hướng văng ban đầu theo hướng thoát phoi ra ngoài cành
    const outAngle = contact.tangentAngle + Math.PI * 0.5 + (Math.sin(i * 2.3) * 0.35);
    const speed = 1.4 + (i % 4) * 0.45;
    const kin = {
      vx: Math.cos(outAngle) * speed - 0.65 * Math.cos(contact.tangentAngle),
      vy: Math.sin(outAngle) * speed + 0.55,
      vz: sideSign * (0.45 + (i % 3) * 0.28),
      rx0: i * 0.7,
      ry0: i * 1.1 + seedOffset,
      wx: (i % 2 === 0 ? 1 : -1) * (4.8 + (i % 3) * 1.9),
      wy: (i % 3 === 0 ? -1 : 1) * (5.4 + (i % 4) * 1.6),
      wz: sideSign * (6.2 + (i % 5) * 1.5),
    };

    const startX = contact.tipX + Math.cos(outAngle) * 0.28;
    const startY = contact.tipY + Math.sin(outAngle) * 0.28;

    apply3DGravityAndTumble(
      chipMesh,
      startX,
      startY,
      zStart,
      contact.tangentAngle,
      tChip,
      kin
    );
    group.add(chipMesh);
  }
}

export function createBranchSystem(M) {
  const root = new THREE.Group();
  const spinG = new THREE.Group(); root.add(spinG);
  const staticG = new THREE.Group(); spinG.add(staticG);
  const dynG = new THREE.Group(); spinG.add(dynG);
  const capG = new THREE.Group(); root.add(capG);
  const ribbonG = new THREE.Group();

  let lastD = -1, lastW = -1;

  function rebuildStatic(D, W) {
    if (Math.abs(D - lastD) < 1e-4 && Math.abs(W - lastW) < 1e-4) return;
    lastD = D; lastW = W;
    disposeGroup(staticG);
    const R = D / 2, Rc = R - K.BARK_T, Rp = Rc + K.BARK_T * 0.4, L2 = BRANCH_LEN / 2;

    staticG.add(new THREE.Mesh(cylSurface(R, W / 2, L2, 0, TAU), M.bark));
    staticG.add(new THREE.Mesh(cylSurface(R, -L2, -W / 2, 0, TAU), M.bark));
    staticG.add(new THREE.Mesh(cylSurface(Rc, -W / 2, W / 2, 0, TAU), M.cambium));

    [L2, -L2].forEach((z) => {
      const coreDisk = new THREE.Mesh(new THREE.CircleGeometry(Rc, 72), M.rings);
      coreDisk.position.z = z;
      if (z < 0) coreDisk.rotation.y = Math.PI;
      staticG.add(coreDisk);
      staticG.add(new THREE.Mesh(ringAt(Rc, Rp, 0, TAU, z), M.phloem));
      staticG.add(new THREE.Mesh(ringAt(Rp, R, 0, TAU, z), M.barkCut));
    });

    staticG.traverse((o) => { o.userData.part = 'branch'; });
  }

  function update({ D, W = K.STRIP_WIDTH, mode, peel, engaged, contact, contact2, dualPeel = false, section, fall }) {
    rebuildStatic(D, W);
    disposeGroup(dynG);
    disposeGroup(capG);
    disposeGroup(ribbonG);

    const R = D / 2, Rc = R - K.BARK_T, Rp = Rc + K.BARK_T * 0.4;
    const maxAngle = dualPeel ? Math.PI : TAU;
    const phi = Math.min(peel, maxAngle);
    const isPeeling = mode !== 'original' && engaged;
    const barkThick = K.BARK_T * 0.92;
    const isFallActive = Boolean(fall && fall.active);
    const fallT = isFallActive ? fall.t : 0;

    spinG.rotation.z = 0;

    if (isPeeling && dualPeel) {
      // PHƯƠNG ÁN C (Cắt kép đối xứng 2 hàm trên-dưới):
      // Mỗi lưỡi bào chỉ cần đi 180° (π rad) là 2 nửa vòng vỏ (2 x 180° = 360°) bong rời hoàn toàn!
      const halfRemain = Math.max(0, Math.PI - phi);
      const aTop = contact.alpha;
      const aBot = contact.alpha + Math.PI;

      if (halfRemain > 0.015) {
        dynG.add(new THREE.Mesh(cylSurface(R, -W / 2 + 0.01, W / 2 - 0.01, aTop, aTop + halfRemain), M.bark));
        dynG.add(new THREE.Mesh(cylSurface(R, -W / 2 + 0.01, W / 2 - 0.01, aBot, aBot + halfRemain), M.bark));
        if (phi > 0.02) {
          [aTop, aTop + halfRemain, aBot, aBot + halfRemain].forEach((ang) => {
            dynG.add(new THREE.Mesh(radialWall(Rc, R, ang, -W / 2 + 0.01, W / 2 - 0.01), M.phloem));
          });
        }
      }

      if (phi > 0.015) {
        [W / 2, -W / 2].forEach((z) => {
          dynG.add(new THREE.Mesh(ringAt(Rc, Rp, aTop - phi, phi, z), M.phloem));
          dynG.add(new THREE.Mesh(ringAt(Rp, R, aTop - phi, phi, z), M.barkCut));
          dynG.add(new THREE.Mesh(ringAt(Rc, Rp, aBot - phi, phi, z), M.phloem));
          dynG.add(new THREE.Mesh(ringAt(Rp, R, aBot - phi, phi, z), M.barkCut));
        });
      }

      // 2 Dải vỏ 2 lớp hữu cơ (outer bark + inner phloem) tách tại mũi dao 28° ở cả 2 hàm
      // và chui qua Cầu Vòm Rỗng Thoát Phoi (Open-Arch Chip Chute)
      if (phi > 0.025) {
        const c2 = contact2 || {
          tipX: contact.tipX,
          tipY: -contact.tipY,
          tangentAngle: contact.tangentAngle + Math.PI,
        };

        const arc = Math.min(3.4, Math.max(0.28, phi * R * 0.78));
        const ribTop = createDualLayerBarkRibbon(M, arc, barkThick, W, R, 0.2);
        const ribBot = createDualLayerBarkRibbon(M, arc, barkThick, W, R, 1.9);

        if (isFallActive || phi >= Math.PI - 0.02) {
          // Khi cắt đủ 180° ở Phương án C, 2 nửa vỏ chữ C đứt rời và rơi theo trọng trường 3D (g = 9.8 m/s²)
          // vừa rơi vừa xoay lật cả 3 trục (rotX, rotY, rotZ)
          const tDrop = isFallActive ? fallT : 0.04;
          apply3DGravityAndTumble(ribTop, contact.tipX, contact.tipY, 0, contact.tangentAngle, tDrop, {
            vx: (fall && fall.vx) ? fall.vx : -2.1,
            vy: (fall && fall.vy) ? fall.vy : 1.5,
            vz: 0.85,
            rx0: 0,
            ry0: 0,
            wx: 2.8,
            wy: -3.4,
            wz: 4.1,
          });
          apply3DGravityAndTumble(ribBot, c2.tipX, c2.tipY, 0, c2.tangentAngle, tDrop, {
            vx: (fall && fall.vx) ? -fall.vx * 0.9 : 1.9,
            vy: -0.6,
            vz: -0.92,
            rx0: 0,
            ry0: 0,
            wx: -3.2,
            wy: 2.9,
            wz: -3.8,
          });
        } else {
          ribTop.position.set(contact.tipX, contact.tipY, 0);
          ribTop.rotation.set(0, 0, contact.tangentAngle);
          ribBot.position.set(c2.tipX, c2.tipY, 0);
          ribBot.rotation.set(0, 0, c2.tangentAngle);
        }

        ribbonG.add(ribTop, ribBot);

        // Phát sinh mảnh vỏ vụn / mùn vỏ rơi theo trọng trường 3D tại cả 2 lưỡi bào
        emitBarkChipsAndDebris(M, ribbonG, contact, phi, R, W, fallT, 0.0);
        emitBarkChipsAndDebris(M, ribbonG, c2, phi, R, W, fallT, 2.4);
      }
    } else if (isPeeling) {
      // PHƯƠNG ÁN A & B (1 lưỡi bào đơn xoay 360°):
      // Khi góc bóc vượt ngưỡng gãy tự nhiên (~165° = 2.88 rad), nửa vòng vỏ chữ C đầu tiên
      // tự gãy tách ra và rơi xuống theo trọng trường 3D (g = 9.8 m/s²) xoay lật 3 trục,
      // trong khi phần vỏ đang bóc tiếp tục cuộn ra từ mũi dao 28°!
      const a0 = contact.alpha;
      const remain = TAU - phi;
      if (remain > 0.015) {
        dynG.add(new THREE.Mesh(cylSurface(R, -W / 2 + 0.01, W / 2 - 0.01, a0, a0 + remain), M.bark));
        if (phi > 0.02) {
          dynG.add(new THREE.Mesh(radialWall(Rc, R, a0, -W / 2 + 0.01, W / 2 - 0.01), M.phloem));
          dynG.add(new THREE.Mesh(radialWall(Rc, R, a0 + remain, -W / 2 + 0.01, W / 2 - 0.01), M.phloem));
        }
      }
      if (phi > 0.015) {
        [W / 2, -W / 2].forEach((z) => {
          dynG.add(new THREE.Mesh(ringAt(Rc, Rp, contact.alpha - phi, phi, z), M.phloem));
          dynG.add(new THREE.Mesh(ringAt(Rp, R, contact.alpha - phi, phi, z), M.barkCut));
        });
      }

      if (phi > 0.025) {
        const SNAP_ANGLE = 2.88; // ~165°: ngưỡng đoạn vỏ chữ C đầu tiên tự gãy rớt xuống theo trọng lực
        const hasMidSnap = phi > SNAP_ANGLE;
        const activePhi = hasMidSnap ? (phi - SNAP_ANGLE * 0.72) : phi;
        const arc = Math.min(3.5, Math.max(0.28, activePhi * R * 0.74));

        // 1. Dải vỏ 2 lớp đang tách trực tiếp tại mũi dao 28° và chui qua vòm thoát phoi
        const rib = createDualLayerBarkRibbon(M, arc, barkThick, W, R, 0.5);
        if (isFallActive || phi >= TAU - 0.02) {
          const tDrop = isFallActive ? fallT : 0.04;
          apply3DGravityAndTumble(rib, contact.tipX, contact.tipY, 0, contact.tangentAngle, tDrop, {
            vx: (fall && fall.vx) ? fall.vx : -2.2,
            vy: (fall && fall.vy) ? fall.vy : 1.4,
            vz: 0.95,
            rx0: 0,
            ry0: 0,
            wx: 3.1,
            wy: -3.6,
            wz: 4.0,
          });
        } else {
          rib.position.set(contact.tipX, contact.tipY, 0);
          rib.rotation.set(0, 0, contact.tangentAngle);
        }
        ribbonG.add(rib);

        // 2. Đoạn vỏ chữ C đầu tiên đã tự đứt rơi xuống khi góc xoay vượt ~165°
        if (hasMidSnap) {
          const tSnapFall = (phi - SNAP_ANGLE) / 1.45 + (isFallActive ? fallT : 0);
          if (tSnapFall < 1.65) {
            const snappedC = createDetachedCSegment(M, R, barkThick, W, Math.PI * 0.82, 1.3);
            // Vị trí tại thời điểm đoạn vỏ đầu tiên gãy rời
            const snapAlpha = contact.alpha + (phi - SNAP_ANGLE);
            const snapX = Math.cos(snapAlpha) * (R + 0.35);
            const snapY = Math.sin(snapAlpha) * (R + 0.35);
            // Chuyển sang tọa độ thế giới tương ứng với tâm cành
            const cxApprox = contact.tipX - Math.cos(contact.alpha) * (Rc + K.DEPTH_GAP - K.TOOTH_SINK);
            const cyApprox = contact.tipY - Math.sin(contact.alpha) * (Rc + K.DEPTH_GAP - K.TOOTH_SINK);
            apply3DGravityAndTumble(
              snappedC,
              cxApprox + snapX,
              cyApprox + snapY,
              0.12,
              snapAlpha - Math.PI * 0.5,
              tSnapFall,
              {
                vx: Math.cos(snapAlpha) * 1.45 - 0.8,
                vy: Math.sin(snapAlpha) * 0.95 + 0.4,
                vz: -0.88,
                rx0: 0.15,
                ry0: -0.2,
                wx: -3.4,
                wy: 2.8,
                wz: -3.9,
              }
            );
            ribbonG.add(snappedC);
          }
        }

        // 3. Mảnh vỏ vụn / mùn vỏ tách ra tại mũi dao & rãnh răng cưa rơi theo trọng trường 3D
        emitBarkChipsAndDebris(M, ribbonG, contact, phi, R, W, fallT, 0.7);
      }
    } else {
      dynG.add(new THREE.Mesh(cylSurface(R, -W / 2 + 0.03, W / 2 - 0.03, 0, TAU), M.bark));
      if (phi > 0.02) {
        const gW = 0.055;
        [W / 2 - gW / 2, -W / 2 + gW / 2].forEach((z) => {
          dynG.add(new THREE.Mesh(cylSurface(R + 0.008, z - gW / 2, z + gW / 2, contact.alpha - phi, contact.alpha), M.groove));
          dynG.add(new THREE.Mesh(cylSurface(R + 0.008, z - gW / 2, z + gW / 2, contact.alpha + Math.PI - phi, contact.alpha + Math.PI), M.groove));
        });
      }
    }

    if (section) {
      const zCap = -0.002;
      const disk = new THREE.Mesh(new THREE.CircleGeometry(Rc, 72), M.capRings);
      disk.position.z = zCap;
      capG.add(disk);
      if (isPeeling && dualPeel) {
        const halfRemain = Math.max(0, Math.PI - phi);
        if (halfRemain > 0.015) {
          [contact.alpha, contact.alpha + Math.PI].forEach((a0) => {
            capG.add(new THREE.Mesh(ringAt(Rc, Rp, a0, halfRemain, zCap), M.capPhloem));
            capG.add(new THREE.Mesh(ringAt(Rp, R, a0, halfRemain, zCap), M.capBark));
          });
        }
      } else if (isPeeling) {
        const remain = TAU - phi;
        if (remain > 0.015) {
          const a0 = contact.alpha;
          capG.add(new THREE.Mesh(ringAt(Rc, Rp, a0, remain, zCap), M.capPhloem));
          capG.add(new THREE.Mesh(ringAt(Rp, R, a0, remain, zCap), M.capBark));
        }
      } else {
        capG.add(new THREE.Mesh(ringAt(Rc, Rp, 0, TAU, zCap), M.capPhloem));
        capG.add(new THREE.Mesh(ringAt(Rp, R, 0, TAU, zCap), M.capBark));
      }
    }

    dynG.traverse((o) => { o.userData.part = 'branch'; });
  }

  return { root, ribbonG, update };
}
