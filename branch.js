/* ============================================================================
   branch.js (v6) — Dựng hình cành cây, rãnh rạch, dải vỏ bị bóc, cuộn vỏ & mặt cắt
   Hỗ trợ điều chỉnh động Bề rộng lớp vỏ bóc W (khoảng cách giữa 2 dao: 0.4..1.8 cm)
   Không có bất kỳ hai mặt phẳng nào trùng tọa độ → triệt tiêu hoàn toàn Z-fighting.
   ============================================================================ */
import * as THREE from 'three';
import * as K from './kinematics.js?v=6';
import { TAU } from './materials.js?v=6';
import { disposeGroup, extrude } from './tool.js?v=6';

export const BRANCH_LEN = 5.2;

/** Mặt trụ không nắp: bán kính r, từ z0..z1, góc a0..a1 (rad). UV liên tục theo chu vi. */
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

/** Vành khuyên phẳng tại z (rIn..rOut, góc a0..a0+len). Các vành đồng phẳng không chồng bán kính! */
function ringAt(rIn, rOut, a0, len, z) {
  const seg = Math.max(6, Math.ceil(len / (TAU / 72)));
  const g = new THREE.RingGeometry(rIn, rOut, seg, 1, a0, len);
  g.translate(0, 0, z);
  return g;
}

/** Vách mặt cắt xuyên tâm của lớp vỏ tại góc a (nối từ Rc đến R, dọc z0..z1) */
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

/** Dải vỏ cuộn cong thoát ra phía sau lưỡi bào theo đúng bề rộng W */
function curlRibbonGeo(arcLen, thickness, stripW) {
  const segs = 28;
  const r0 = 0.35;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const s = (i / segs) * arcLen;
    const ang = s / (r0 + s * 0.08);
    const r = r0 + ang * 0.07;
    const x = -Math.sin(ang) * r;
    const y = r0 - Math.cos(ang) * r + 0.08 * Math.min(1, s);
    pts.push(new THREE.Vector2(x, y));
  }
  const outer = [], inner = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(pts.length - 1, i + 1)];
    const tx = p1.x - p0.x, ty = p1.y - p0.y;
    const l = Math.hypot(tx, ty) || 1;
    const nx = -ty / l, ny = tx / l;
    outer.push(new THREE.Vector2(pts[i].x + nx * (thickness * 0.5), pts[i].y + ny * (thickness * 0.5)));
    inner.push(new THREE.Vector2(pts[i].x - nx * (thickness * 0.5), pts[i].y - ny * (thickness * 0.5)));
  }
  const shapePts = [...outer, ...inner.reverse()];
  return extrude(new THREE.Shape(shapePts), Math.max(0.22, stripW - 0.14), 0);
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

    // 2 ống vỏ hai bên dải khoanh (cách nhau đúng bề rộng dải vỏ W)
    staticG.add(new THREE.Mesh(cylSurface(R, W / 2, L2, 0, TAU), M.bark));
    staticG.add(new THREE.Mesh(cylSurface(R, -L2, -W / 2, 0, TAU), M.bark));

    // Lõi tầng sinh gỗ ở giữa [-W/2, W/2] bán kính Rc < R
    staticG.add(new THREE.Mesh(cylSurface(Rc, -W / 2, W / 2, 0, TAU), M.cambium));

    // Nắp 2 đầu cành tại z = ±L2
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

  function update({ D, W = K.STRIP_WIDTH, mode, peel, engaged, contact, section, fall }) {
    rebuildStatic(D, W);
    disposeGroup(dynG);
    disposeGroup(capG);
    disposeGroup(ribbonG);

    const R = D / 2, Rc = R - K.BARK_T, Rp = Rc + K.BARK_T * 0.4;
    const phi = Math.min(peel, TAU);
    const isPeeling = mode !== 'original' && engaged;

    spinG.rotation.z = 0;

    if (isPeeling) {
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

      if (phi > 0.03) {
        const arc = Math.min(2.6, phi * R * 0.55);
        const geo = curlRibbonGeo(arc, K.BARK_T * 0.82, W);
        const rib = new THREE.Mesh(geo, M.ribbonBark);
        ribbonG.position.set(contact.tipX, contact.tipY, 0);
        ribbonG.rotation.z = contact.tangentAngle;
        if (fall && fall.active) {
          ribbonG.position.x += fall.vx * fall.t;
          ribbonG.position.y += fall.vy * fall.t - 0.5 * 18 * fall.t * fall.t;
          ribbonG.rotation.z += fall.t * 3.5;
          M.ribbonBark.opacity = Math.max(0, 1 - fall.t * 0.85);
        } else {
          M.ribbonBark.opacity = 1;
        }
        ribbonG.add(rib);
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
      if (isPeeling) {
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
