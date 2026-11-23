/* ============================================================================
   materials.js — Texture thủ tục 1024×1024 (vỏ cây, mô libe, vân gỗ, kim loại),
   vật liệu PBR (bumpMap / roughnessMap) & ánh sáng studio 3 điểm + Soft Shadows
   ============================================================================ */
import * as THREE from 'three';

export const TAU = Math.PI * 2;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function finish(tex, renderer, { repeat = true, isColor = true } = {}) {
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  const maxAniso = renderer?.capabilities?.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;
  tex.anisotropy = Math.min(8, maxAniso);
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  } else {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  }
  tex.needsUpdate = true;
  return tex;
}

function makeCanvas(size = 1024) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return [c, c.getContext('2d')];
}

/** Sinh cặp texture vỏ cây ngoài 1024×1024: Albedo + Bump/Roughness đồng bộ */
function barkTextures(renderer) {
  const S = 1024;
  const [cCol, gCol] = makeCanvas(S);
  const [cBump, gBump] = makeCanvas(S);
  const r = rng(17);

  // Nền màu vỏ gỗ & nền chiều cao trung tính
  const baseGrad = gCol.createLinearGradient(0, 0, S, 0);
  baseGrad.addColorStop(0, '#5e402e');
  baseGrad.addColorStop(0.35, '#6d4b37');
  baseGrad.addColorStop(0.7, '#583b2a');
  baseGrad.addColorStop(1, '#5e402e');
  gCol.fillStyle = baseGrad;
  gCol.fillRect(0, 0, S, S);

  gBump.fillStyle = 'rgb(142,142,142)';
  gBump.fillRect(0, 0, S, S);

  // Sợi vỏ dọc (fibrous ridges) — bọc vòng quanh trục Y để seamless
  for (let i = 0; i < 420; i++) {
    const x = r() * S;
    const w = 2 + r() * 7;
    const bright = r() > 0.45;
    const colA = 0.08 + r() * 0.16;
    gCol.strokeStyle = bright ? `rgba(148,112,84,${colA})` : `rgba(38,24,16,${colA * 1.25})`;
    gCol.lineWidth = w;

    const hVal = bright ? Math.round(168 + r() * 52) : Math.round(92 - r() * 35);
    gBump.strokeStyle = `rgba(${hVal},${hVal},${hVal},${0.22 + r() * 0.25})`;
    gBump.lineWidth = w * 1.1;

    gCol.beginPath();
    gBump.beginPath();
    let curX = x;
    gCol.moveTo(curX, 0);
    gBump.moveTo(curX, 0);
    for (let y = 32; y <= S; y += 32) {
      curX += (r() - 0.5) * 8;
      gCol.lineTo(curX, y);
      gBump.lineTo(curX, y);
    }
    gCol.stroke();
    gBump.stroke();
  }

  // Rãnh nứt vỏ sâu (deep bark fissures)
  for (let i = 0; i < 88; i++) {
    let x = r() * S;
    const w = 2.5 + r() * 6.5;
    const alpha = 0.5 + r() * 0.4;
    gCol.strokeStyle = `rgba(24,14,9,${alpha})`;
    gCol.lineWidth = w;
    gCol.lineCap = 'round';

    gBump.strokeStyle = `rgba(22,22,22,${0.62 + r() * 0.3})`;
    gBump.lineWidth = w * 1.35;
    gBump.lineCap = 'round';

    gCol.beginPath();
    gBump.beginPath();
    gCol.moveTo(x, 0);
    gBump.moveTo(x, 0);
    for (let y = 24; y <= S; y += 24) {
      x += (r() - 0.5) * 14;
      gCol.lineTo(x, y);
      gBump.lineTo(x, y);
      if (r() < 0.08) {
        // Nhánh nứt phụ
        const bx = x + (r() > 0.5 ? 1 : -1) * (10 + r() * 18);
        const by = y + 20 + r() * 26;
        gCol.moveTo(x, y);
        gCol.lineTo(bx, by);
        gCol.moveTo(x, y);
        gBump.moveTo(x, y);
        gBump.lineTo(bx, by);
        gBump.moveTo(x, y);
      }
    }
    gCol.stroke();
    gBump.stroke();
  }

  // Bì khổng ngang (lenticels) — đặc trưng trên vỏ cây ăn quả / cây công nghiệp
  for (let i = 0; i < 240; i++) {
    const lx = r() * S;
    const ly = r() * S;
    const lw = 8 + r() * 22;
    const lh = 2 + r() * 3.2;
    gCol.fillStyle = `rgba(176,138,102,${0.2 + r() * 0.28})`;
    gCol.beginPath();
    gCol.ellipse(lx, ly, lw * 0.5, lh * 0.5, (r() - 0.5) * 0.14, 0, TAU);
    gCol.fill();

    gBump.fillStyle = `rgba(215,215,215,${0.25 + r() * 0.3})`;
    gBump.beginPath();
    gBump.ellipse(lx, ly, lw * 0.5, lh * 0.5, 0, 0, TAU);
    gBump.fill();
  }

  // Đốm địa y / rêu vi mô & hạt nhám hữu cơ
  for (let i = 0; i < 7500; i++) {
    const sx = r() * S;
    const sy = r() * S;
    const sz = 1.5 + r() * 4.5;
    const kind = r();
    if (kind < 0.14) {
      // Địa y xám xanh nhạt
      gCol.fillStyle = `rgba(134,142,108,${0.12 + r() * 0.2})`;
      gBump.fillStyle = `rgba(190,190,190,0.22)`;
    } else if (kind < 0.55) {
      gCol.fillStyle = `rgba(34,21,14,${0.18 + r() * 0.22})`;
      gBump.fillStyle = `rgba(75,75,75,0.28)`;
    } else {
      gCol.fillStyle = `rgba(156,122,90,${0.14 + r() * 0.2})`;
      gBump.fillStyle = `rgba(182,182,182,0.22)`;
    }
    gCol.fillRect(sx, sy, sz, sz * (0.8 + r() * 0.8));
    gBump.fillRect(sx, sy, sz, sz);
  }

  return {
    map: finish(new THREE.CanvasTexture(cCol), renderer, { repeat: true, isColor: true }),
    bumpMap: finish(new THREE.CanvasTexture(cBump), renderer, { repeat: true, isColor: false }),
  };
}

/** Alias tương thích cho barkTexture(renderer) */
function barkTexture(renderer) {
  return barkTextures(renderer).map;
}

/** Texture tầng sinh gỗ & mặt trong mô libe ẩm 1024×1024 + bump sợi mạch dọc */
function cambiumTextures(renderer) {
  const S = 1024;
  const [cCol, gCol] = makeCanvas(S);
  const [cBump, gBump] = makeCanvas(S);
  const r = rng(29);

  // Nền mô libe / tầng sinh gỗ sáng ẩm
  const grad = gCol.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, '#dfe2ad');
  grad.addColorStop(0.5, '#e6e8bc');
  grad.addColorStop(1, '#d7da9f');
  gCol.fillStyle = grad;
  gCol.fillRect(0, 0, S, S);

  gBump.fillStyle = 'rgb(138,138,138)';
  gBump.fillRect(0, 0, S, S);

  // Bó sợi mạch rây dọc (longitudinal vascular fibers)
  for (let i = 0; i < 950; i++) {
    const x = r() * S;
    const w = 1 + r() * 2.8;
    const light = r() > 0.42;
    gCol.strokeStyle = light
      ? `rgba(255,253,228,${0.22 + r() * 0.25})`
      : `rgba(156,166,94,${0.2 + r() * 0.26})`;
    gCol.lineWidth = w;

    const bv = light ? Math.round(170 + r() * 45) : Math.round(98 + r() * 28);
    gBump.strokeStyle = `rgba(${bv},${bv},${bv},0.34)`;
    gBump.lineWidth = w;

    gCol.beginPath();
    gBump.beginPath();
    let cx = x;
    gCol.moveTo(cx, 0);
    gBump.moveTo(cx, 0);
    for (let y = 64; y <= S; y += 64) {
      cx += (r() - 0.5) * 4.5;
      gCol.lineTo(cx, y);
      gBump.lineTo(cx, y);
    }
    gCol.stroke();
    gBump.stroke();
  }

  // Vệt nhựa ẩm loang tự nhiên (sap sheen patches)
  for (let i = 0; i < 65; i++) {
    const sx = r() * S;
    const sy = r() * S;
    const rx = 18 + r() * 55;
    const ry = 40 + r() * 140;
    gCol.fillStyle = `rgba(248,250,214,${0.1 + r() * 0.12})`;
    gCol.beginPath();
    gCol.ellipse(sx, sy, rx, ry, (r() - 0.5) * 0.2, 0, TAU);
    gCol.fill();

    // Vùng nhựa ẩm mịn hơn trên bump
    gBump.fillStyle = 'rgba(152,152,152,0.16)';
    gBump.beginPath();
    gBump.ellipse(sx, sy, rx, ry, 0, 0, TAU);
    gBump.fill();
  }

  return {
    map: finish(new THREE.CanvasTexture(cCol), renderer, { repeat: true, isColor: true }),
    bumpMap: finish(new THREE.CanvasTexture(cBump), renderer, { repeat: true, isColor: false }),
  };
}

/** Texture vân gỗ mặt cắt 1024×1024: lõi/dác gỗ, vòng tăng trưởng, tia tủy & bump nhẹ */
function ringsTextures(renderer) {
  const S = 1024;
  const H = S / 2;
  const [cCol, gCol] = makeCanvas(S);
  const [cBump, gBump] = makeCanvas(S);
  const r = rng(43);

  // Chuyển màu lõi gỗ (heartwood) -> dác gỗ (sapwood)
  const grd = gCol.createRadialGradient(H, H, 16, H, H, H);
  grd.addColorStop(0, '#b58450');
  grd.addColorStop(0.28, '#cfa16a');
  grd.addColorStop(0.65, '#e7cc96');
  grd.addColorStop(0.95, '#f2dfb5');
  grd.addColorStop(1, '#e8d2a0');
  gCol.fillStyle = grd;
  gCol.fillRect(0, 0, S, S);

  gBump.fillStyle = 'rgb(135,135,135)';
  gBump.fillRect(0, 0, S, S);

  // Vòng tăng trưởng (growth rings) có độ gợn hữu cơ
  let rad = 20;
  let ringIdx = 0;
  while (rad < H - 16) {
    const phase = r() * TAU;
    const amp = 1.6 + r() * 2.4;
    const lw = 2.0 + r() * 3.8;
    const alpha = 0.28 + r() * 0.34;
    gCol.strokeStyle = `rgba(148,100,52,${alpha})`;
    gCol.lineWidth = lw;

    const bv = ringIdx % 2 === 0 ? 105 : 162;
    gBump.strokeStyle = `rgba(${bv},${bv},${bv},0.36)`;
    gBump.lineWidth = lw;

    gCol.beginPath();
    gBump.beginPath();
    for (let a = 0; a <= TAU + 0.02; a += 0.025) {
      const rr = rad + Math.sin(a * 4 + phase) * amp + Math.cos(a * 9 - phase) * (amp * 0.45);
      const x = H + Math.cos(a) * rr;
      const y = H + Math.sin(a) * rr;
      if (a === 0) {
        gCol.moveTo(x, y);
        gBump.moveTo(x, y);
      } else {
        gCol.lineTo(x, y);
        gBump.lineTo(x, y);
      }
    }
    gCol.stroke();
    gBump.stroke();
    rad += 16 + r() * 18;
    ringIdx++;
  }

  // Tia tủy hướng tâm (medullary rays)
  for (let i = 0; i < 110; i++) {
    const a = (i / 110) * TAU + (r() - 0.5) * 0.03;
    const r0 = 18 + r() * 40;
    const r1 = H - 18 - r() * 25;
    gCol.strokeStyle = `rgba(165,118,68,${0.12 + r() * 0.16})`;
    gCol.lineWidth = 1 + r() * 1.4;
    gCol.beginPath();
    gCol.moveTo(H + Math.cos(a) * r0, H + Math.sin(a) * r0);
    gCol.lineTo(H + Math.cos(a) * r1, H + Math.sin(a) * r1);
    gCol.stroke();

    gBump.strokeStyle = 'rgba(116,116,116,0.22)';
    gBump.lineWidth = 1.2;
    gBump.beginPath();
    gBump.moveTo(H + Math.cos(a) * r0, H + Math.sin(a) * r0);
    gBump.lineTo(H + Math.cos(a) * r1, H + Math.sin(a) * r1);
    gBump.stroke();
  }

  // Tủy gỗ (pith) ở tâm
  gCol.fillStyle = '#7c532d';
  gCol.beginPath();
  gCol.arc(H, H, 13, 0, TAU);
  gCol.fill();

  // Viền tầng sinh gỗ (cambium ring)
  gCol.strokeStyle = '#a3b562';
  gCol.lineWidth = 14;
  gCol.beginPath();
  gCol.arc(H, H, H - 12, 0, TAU);
  gCol.stroke();

  return {
    map: finish(new THREE.CanvasTexture(cCol), renderer, { repeat: false, isColor: true }),
    bumpMap: finish(new THREE.CanvasTexture(cBump), renderer, { repeat: false, isColor: false }),
  };
}

/** Texture kim loại xước định hướng 1024×1024 (thép SK5 & hợp kim anod hóa) */
function metalBrushTexture(renderer, { base = 175, contrast = 38, streakCount = 3200, seed = 71 } = {}) {
  const S = 1024;
  const [c, g] = makeCanvas(S);
  const r = rng(seed);

  g.fillStyle = `rgb(${base},${base},${base})`;
  g.fillRect(0, 0, S, S);

  // Vệt xước phay/mài ngang định hướng (directional brushed streaks)
  for (let i = 0; i < streakCount; i++) {
    const y = r() * S;
    const x = r() * S;
    const len = 80 + r() * 440;
    const delta = (r() - 0.5) * 2 * contrast;
    const v = Math.max(20, Math.min(248, Math.round(base + delta)));
    g.strokeStyle = `rgba(${v},${v},${v},${0.16 + r() * 0.34})`;
    g.lineWidth = 0.7 + r() * 1.4;

    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + len, y + (r() - 0.5) * 1.5);
    g.stroke();

    // Bọc mép ngang để seamless
    if (x + len > S) {
      g.beginPath();
      g.moveTo(x - S, y);
      g.lineTo(x + len - S, y);
      g.stroke();
    }
  }

  return finish(new THREE.CanvasTexture(c), renderer, { repeat: true, isColor: false });
}

/** Tạo bộ vật liệu PBR. clipMats = danh sách vật liệu bị cắt khi bật Mặt cắt. */
export function createMaterials(renderer) {
  const bark = barkTextures(renderer);
  const cambium = cambiumTextures(renderer);
  const rings = ringsTextures(renderer);

  // Map kim loại xước thép SK5 & map anod hóa mịn cho con chạy
  const metalRough = metalBrushTexture(renderer, { base: 84, contrast: 32, streakCount: 3600, seed: 71 });
  const metalBump = metalBrushTexture(renderer, { base: 128, contrast: 42, streakCount: 3600, seed: 73 });
  const anodizedRough = metalBrushTexture(renderer, { base: 112, contrast: 20, streakCount: 2200, seed: 97 });
  const anodizedBump = metalBrushTexture(renderer, { base: 128, contrast: 22, streakCount: 2200, seed: 101 });

  const clipMats = [];
  const mk = (p, clip = true) => {
    const m = new THREE.MeshStandardMaterial(p);
    if (clip) clipMats.push(m);
    return m;
  };
  const DS = THREE.DoubleSide;

  // Vật liệu thép lưỡi bào SK5 phay xước sắc nét (dùng cho cả peel & peelSteel)
  const sk5PeelProps = {
    color: 0xdce4ed,
    metalness: 0.94,
    roughness: 0.24,
    roughnessMap: metalRough,
    bumpMap: metalBump,
    bumpScale: 0.008,
    emissive: 0x0b3b3a,
    emissiveIntensity: 0.16,
    side: DS,
  };

  const M = {
    steel: mk({
      color: 0xdde3ea,
      metalness: 0.92,
      roughness: 0.28,
      roughnessMap: metalRough,
      bumpMap: metalBump,
      bumpScale: 0.009,
      side: DS,
    }),
    darkSteel: mk({
      color: 0x4b5563,
      metalness: 0.86,
      roughness: 0.36,
      roughnessMap: metalRough,
      bumpMap: metalBump,
      bumpScale: 0.007,
      side: DS,
    }),
    bolt: mk({
      color: 0xd8dee6,
      metalness: 0.95,
      roughness: 0.20,
      roughnessMap: metalRough,
      side: DS,
    }),
    brassBolt: mk({
      color: 0xd4a843,
      metalness: 0.88,
      roughness: 0.24,
      side: DS,
    }),
    red: mk({ color: 0xd42a2a, metalness: 0.04, roughness: 0.48 }, false),
    amber: mk({
      color: 0xe38e17,
      metalness: 0.62,
      roughness: 0.34,
      roughnessMap: anodizedRough,
      bumpMap: anodizedBump,
      bumpScale: 0.006,
      side: DS,
    }),
    amberV: mk({
      color: 0xc9750e,
      metalness: 0.58,
      roughness: 0.38,
      roughnessMap: anodizedRough,
      bumpMap: anodizedBump,
      bumpScale: 0.006,
      side: DS,
    }),
    peel: mk({
      color: 0x14b8b2,
      metalness: 0.82,
      roughness: 0.22,
      roughnessMap: metalRough,
      bumpMap: metalBump,
      bumpScale: 0.007,
      emissive: 0x06524f,
      emissiveIntensity: 0.48,
      side: DS,
    }),
    peelSteel: mk(sk5PeelProps),
    edge: mk({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.06,
      emissive: 0x9ffcf3,
      emissiveIntensity: 0.85,
      side: DS,
    }),
    roller: mk({
      color: 0x0f766e,
      metalness: 0.36,
      roughness: 0.38,
      roughnessMap: anodizedRough,
      side: DS,
    }),
    bark: mk({
      map: bark.map,
      bumpMap: bark.bumpMap,
      bumpScale: 0.045,
      roughnessMap: bark.bumpMap,
      roughness: 0.92,
      metalness: 0.0,
      side: DS,
    }),
    barkCut: mk({
      color: 0x4f3424,
      bumpMap: bark.bumpMap,
      bumpScale: 0.025,
      roughness: 0.9,
      side: DS,
    }),
    phloem: mk({
      color: 0xc29263,
      bumpMap: cambium.bumpMap,
      bumpScale: 0.014,
      roughness: 0.68,
      side: DS,
    }),
    cambium: mk({
      map: cambium.map,
      bumpMap: cambium.bumpMap,
      bumpScale: 0.015,
      roughness: 0.44,
      metalness: 0.0,
      side: DS,
    }),
    rings: mk({
      map: rings.map,
      bumpMap: rings.bumpMap,
      bumpScale: 0.012,
      roughness: 0.78,
      side: DS,
    }),
    groove: mk({
      color: 0x1a0f09,
      roughness: 1.0,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: DS,
    }),
    ribbonBark: mk({
      map: bark.map,
      bumpMap: bark.bumpMap,
      bumpScale: 0.045,
      roughnessMap: bark.bumpMap,
      roughness: 0.92,
      metalness: 0.0,
      side: DS,
      transparent: true,
      opacity: 1.0,
    }),
    ribbonInner: mk({
      map: cambium.map,
      color: 0xf1deb5,
      bumpMap: cambium.bumpMap,
      bumpScale: 0.018,
      roughness: 0.46,
      metalness: 0.02,
      side: DS,
      transparent: true,
      opacity: 1.0,
    }),
    // Nắp mặt cắt — không bị cắt
    capRings: mk({
      map: rings.map,
      bumpMap: rings.bumpMap,
      bumpScale: 0.012,
      roughness: 0.78,
      side: DS,
    }, false),
    capPhloem: mk({
      color: 0xc29263,
      bumpMap: cambium.bumpMap,
      bumpScale: 0.014,
      roughness: 0.68,
      side: DS,
    }, false),
    capBark: mk({
      color: 0x4f3424,
      bumpMap: bark.bumpMap,
      bumpScale: 0.025,
      roughness: 0.9,
      side: DS,
    }, false),
  };

  return { M, clipMats };
}

/**
 * Thiết lập ánh sáng studio 3 điểm + Hemisphere Fill + Soft Shadows
 * làm nổi bật cạnh vát kim loại, vòm thoát phoi (Open-Arch Chip Chute) và dải vỏ 2 lớp.
 */
export function setupStudioLighting(scene, renderer) {
  if (renderer) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  // Tránh tạo trùng đèn nếu hàm được gọi lại
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const ch = scene.children[i];
    if (ch && ch.userData && ch.userData.studioLight) {
      scene.remove(ch);
    }
  }

  // 1. Hemisphere Fill: ánh sáng studio trần ấm nhẹ + phản xạ nền trung tính
  const hemiLight = new THREE.HemisphereLight(0xfff9f0, 0xb8c4d4, 0.85);
  hemiLight.position.set(0, 16, 0);
  hemiLight.userData.studioLight = true;
  scene.add(hemiLight);

  // 2. Key Light: nguồn sáng chính CRI cao có đổ bóng mềm 2048×2048
  const keyLight = new THREE.DirectionalLight(0xfff7ea, 1.75);
  keyLight.position.set(11, 16, 17);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 2;
  keyLight.shadow.camera.far = 52;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  keyLight.shadow.radius = 2.6;
  keyLight.userData.studioLight = true;
  scene.add(keyLight);

  // 3. Fill Light: ánh sáng phụ mát dịu làm sáng chi tiết bên trong ngàm chữ J & khe 2 lưỡi dao
  const fillLight = new THREE.DirectionalLight(0xd9e8ff, 0.68);
  fillLight.position.set(-13, 5, 11);
  fillLight.userData.studioLight = true;
  scene.add(fillLight);

  // 4. Rim / Back Light: đèn viền tách khối, nhấn cạnh vát con chạy, vòm thoát phoi & dải vỏ bóc
  const rimLight = new THREE.DirectionalLight(0xffe8c2, 0.92);
  rimLight.position.set(-10, -7, -14);
  rimLight.userData.studioLight = true;
  scene.add(rimLight);

  // 5. Đèn điểm nhấn dưới vòm thoát phoi (Under-Arch Accent) làm rõ lưỡi bào 28° & mặt libe
  const archAccent = new THREE.PointLight(0xfff4e0, 0.55, 22, 1.6);
  archAccent.position.set(5.5, -3.5, 4.5);
  archAccent.userData.studioLight = true;
  scene.add(archAccent);

  return { hemiLight, keyLight, fillLight, rimLight };
}

