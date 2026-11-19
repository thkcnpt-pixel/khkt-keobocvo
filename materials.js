/* ============================================================================
   materials.js — Texture thủ tục (vỏ cây, tầng sinh gỗ, vân gỗ) & vật liệu PBR
   ============================================================================ */
import * as THREE from 'three';

export const TAU = Math.PI * 2;

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function finish(tex, renderer, repeat = true) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function barkTexture(renderer) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const r = rng(7);
  g.fillStyle = '#6a4a36';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(40,26,18,0.25)' : 'rgba(150,115,85,0.18)';
    g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2 + r() * 3);
  }
  // Vết nứt chạy dọc thân cành
  for (let i = 0; i < 46; i++) {
    let x = r() * 512;
    const w = 2 + r() * 4;
    g.strokeStyle = `rgba(30,18,12,${0.45 + r() * 0.35})`;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x, 0);
    for (let y = 0; y <= 512; y += 32) { x += (r() - 0.5) * 10; g.lineTo(x, y); }
    g.stroke();
  }
  return finish(new THREE.CanvasTexture(c), renderer);
}

function cambiumTexture(renderer) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const r = rng(11);
  g.fillStyle = '#e3e4b4';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 160; i++) {
    g.strokeStyle = r() > 0.5 ? 'rgba(170,180,110,0.35)' : 'rgba(255,255,230,0.35)';
    g.lineWidth = 1 + r() * 1.5;
    const x = r() * 256;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 6, 256); g.stroke();
  }
  return finish(new THREE.CanvasTexture(c), renderer);
}

function ringsTexture(renderer) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const r = rng(3);
  const grd = g.createRadialGradient(256, 256, 10, 256, 256, 256);
  grd.addColorStop(0, '#d9b77e');
  grd.addColorStop(0.75, '#ecd4a2');
  grd.addColorStop(1, '#f2deb2');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  let rad = 14;
  while (rad < 244) {
    g.strokeStyle = `rgba(168,120,66,${0.35 + r() * 0.25})`;
    g.lineWidth = 1.5 + r() * 2.2;
    g.beginPath();
    for (let a = 0; a <= TAU + 0.01; a += 0.05) {
      const rr = rad + Math.sin(a * 3 + rad) * 1.2;
      const x = 256 + Math.cos(a) * rr, y = 256 + Math.sin(a) * rr;
      if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
    rad += 11 + r() * 9;
  }
  g.fillStyle = '#8a6239';
  g.beginPath(); g.arc(256, 256, 6, 0, TAU); g.fill();
  g.strokeStyle = '#a3b363'; // tầng sinh gỗ (cambium)
  g.lineWidth = 8;
  g.beginPath(); g.arc(256, 256, 250, 0, TAU); g.stroke();
  return finish(new THREE.CanvasTexture(c), renderer, false);
}

/** Tạo bộ vật liệu. clipMats = danh sách vật liệu bị cắt khi bật Mặt cắt. */
export function createMaterials(renderer) {
  const tex = { bark: barkTexture(renderer), cambium: cambiumTexture(renderer), rings: ringsTexture(renderer) };
  const clipMats = [];
  const mk = (p, clip = true) => {
    const m = new THREE.MeshStandardMaterial(p);
    if (clip) clipMats.push(m);
    return m;
  };
  const DS = THREE.DoubleSide;
  const M = {
    steel: mk({ color: 0xdfe5ec, metalness: 0.92, roughness: 0.26, side: DS }),
    darkSteel: mk({ color: 0x4b5563, metalness: 0.85, roughness: 0.35, side: DS }),
    bolt: mk({ color: 0xc7ced8, metalness: 0.95, roughness: 0.2, side: DS }),
    red: mk({ color: 0xd42a2a, metalness: 0.0, roughness: 0.55 }, false),
    amber: mk({ color: 0xe08a12, metalness: 0.35, roughness: 0.4, side: DS }),
    amberV: mk({ color: 0xc8730a, metalness: 0.3, roughness: 0.45, side: DS }),
    peel: mk({ color: 0x0ea5a0, metalness: 0.7, roughness: 0.2, emissive: 0x06524f, emissiveIntensity: 0.7, side: DS }),
    edge: mk({ color: 0xffffff, metalness: 1.0, roughness: 0.05, emissive: 0x9ffcf3, emissiveIntensity: 1.0, side: DS }),
    roller: mk({ color: 0x0f766e, metalness: 0.3, roughness: 0.4, side: DS }),
    bark: mk({ map: tex.bark, roughness: 0.95, metalness: 0.0, side: DS }),
    barkCut: mk({ color: 0x4f3424, roughness: 0.9, side: DS }),
    phloem: mk({ color: 0xb98a5c, roughness: 0.8, side: DS }),
    cambium: mk({ map: tex.cambium, roughness: 0.45, metalness: 0.0, side: DS }),
    rings: mk({ map: tex.rings, roughness: 0.8, side: DS }),
    groove: mk({ color: 0x1a0f09, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, side: DS }),
    ribbonBark: mk({ map: tex.bark, roughness: 0.95, side: DS, transparent: true }),
    ribbonInner: mk({ color: 0xd2b07a, roughness: 0.7, side: DS, transparent: true }),
    // Nắp mặt cắt — không bị cắt
    capRings: mk({ map: tex.rings, roughness: 0.8, side: DS }, false),
    capPhloem: mk({ color: 0xb98a5c, roughness: 0.8, side: DS }, false),
    capBark: mk({ color: 0x4f3424, roughness: 0.9, side: DS }, false),
  };
  return { M, clipMats };
}
