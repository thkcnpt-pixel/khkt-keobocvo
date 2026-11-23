/* ============================================================================
   app.js (v15) — Bộ điều phối chính:
   1. PA 2 (★ Khuyên dùng KHKT): Dao-trục hình nêm khoan 2 lỗ Ø4.2 mm đặt giữa 2 lá kéo,
      khóa cứng bằng 2 bu-lông M4 cấp 10.9 xuyên từ lá 1 → thân dao → lá 2 + đai ốc Nyloc.
      Mỗi lá khoan 4 lỗ (bước 7.8 mm) tạo 3 vị trí cỡ cành (1–8 cm).
   2. PA 1 (Bản hoàn thiện thay nhanh): Cùng dao-trục 2 lỗ nhưng khóa bằng 1 ghim chữ U Ø4 mm
      thép lò xo + 2 vòng hãm E-clip (tháo lắp nhanh bằng tay không cần cờ-lê).
   3. PA C (2 Hàm Đối Tâm • Xoay 180° đứt 360°):
      Gắn 2 cụm dao-trục ở cả hàm trên và hàm dưới theo chiều NGƯỢC NHAU (đối xứng tâm 180°)
      để khi xoay kéo cùng 1 chiều quanh cành, cả 2 dao trên và dưới đều tiến vào cắt vỏ!
   ============================================================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as K from './kinematics.js?v=17';
import { TAU, createMaterials, setupStudioLighting } from './materials.js?v=17';
import { bladeW, buildTool } from './tool.js?v=17';
import { createBranchSystem } from './branch.js?v=17';

const W0 = K.STRIP_WIDTH;
const TILT_NOMINAL = THREE.MathUtils.degToRad(-13.5);

// ----------------------------------------------------------------------------
// 1. 3 VỊ TRÍ HOẠT ĐỘNG CHUẨN REV 2 (t_E = [0.375, 0.445, 0.515], phủ 71/71 cỡ cành 10..80 mm)
// ----------------------------------------------------------------------------
const NOTCHES = [
  { t: K.REV2_POSITIONS[0], sampleD: 1.6, dMin: 1.0, dMax: 2.2, label: 'Vị trí 1 (1.0–2.2 cm)' },
  { t: K.REV2_POSITIONS[1], sampleD: 4.0, dMin: 2.3, dMax: 5.5, label: 'Vị trí 2 (2.3–5.5 cm)' },
  { t: K.REV2_POSITIONS[2], sampleD: 6.8, dMin: 5.6, dMax: 8.0, label: 'Vị trí 3 (5.6–8.0 cm)' },
];

function bestNotchFor(D) {
  if (D <= 2.25) return 0;
  if (D <= 5.55) return 1;
  return 2;
}


// ----------------------------------------------------------------------------
// 2. GLOBAL STATE
// ----------------------------------------------------------------------------
const state = {
  mode: 'optionA',      // 'original' | 'optionA' | 'optionD' | 'optionC'
  D: 4.0,               // 1.0 .. 8.0 cm
  stripMM: 13,          // 4 .. 18 mm
  W: 1.3,               // = stripMM / 10 (cm)
  notchIdx: 1,          // 0..2 or -1
  carriageT: NOTCHES[1].t,
  manualCarriage: false,
  peel: 0,              // 0 .. 2π rad (ở Phương án C chỉ cần 0 .. π là bóc sạch 100%!)
  playing: false,
  explode: 0,           // 0 .. 1
  section: false,
  showLabels: true,
  showBranch: true,
  autoRotate: false,
  cam: 'overview',
  sol: null,
  engaged: true,
  contact: { alpha: Math.PI / 2, tipX: 5, tipY: 2, tangentAngle: 0 },
  contact2: { alpha: -Math.PI / 2, tipX: 5, tipY: -2, tangentAngle: Math.PI },
  fall: { active: false, t: 0, vx: -2.2, vy: 1.4 },
};

// ----------------------------------------------------------------------------
// 3. RENDERER, SCENE, CAMERA & STUDIO ENVIRONMENT
// ----------------------------------------------------------------------------
const container = document.getElementById('canvas-container');
const isTouch = matchMedia('(pointer: coarse)').matches;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.75 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.localClippingEnabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

setupStudioLighting(scene, renderer);

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.5, 160);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4.5;
controls.maxDistance = 55;

const { M, clipMats } = createMaterials(renderer);
const sectionPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);

function applySectionClipping(enabled) {
  clipMats.forEach((m) => {
    m.clippingPlanes = enabled ? [sectionPlane] : null;
    m.needsUpdate = true;
  });
}

// ----------------------------------------------------------------------------
// 4. BUILD SCENE HIERARCHY
// ----------------------------------------------------------------------------
const worldRoot = new THREE.Group();
scene.add(worldRoot);

const toolOrbitPivot = new THREE.Group();
const toolOffsetGroup = new THREE.Group();
toolOrbitPivot.add(toolOffsetGroup);
worldRoot.add(toolOrbitPivot);

const T = buildTool(M, NOTCHES);
toolOffsetGroup.add(T.root);

const branchSys = createBranchSystem(M);
worldRoot.add(branchSys.root);
worldRoot.add(branchSys.ribbonG);

// ----------------------------------------------------------------------------
// 5. KINEMATICS, DAO-TRỤC 2 LỖ, PA C ĐỐI TÂM 180° & TÁCH LỚP CHI TIẾT
// ----------------------------------------------------------------------------
function updateAll() {
  state.W = state.stripMM / 10;
  const W = state.W;

  const isOrig = state.mode === 'original';
  const isA = state.mode === 'optionA'; // PA 2: Dao-trục 2 lỗ + 2 bu-lông M4 (Khuyên dùng KHKT)
  const isD = state.mode === 'optionD'; // PA 1: Dao-trục 2 lỗ + Ghim chữ U + 2 E-clip (Tháo lắp tay)
  const isB = false;
  const isC = state.mode === 'optionC'; // PA C: 2 Hàm ngược chiều đối tâm (Xoay 180° đứt 360°)
  const hasCarriage = isA || isD || isC;

  T.hmU.visible = isOrig || hasCarriage;
  T.hmL.visible = isOrig || hasCarriage;
  T.carriage.visible = hasCarriage;
  T.carriageLower.visible = isC;
  T.bL.visible = isB;
  T.bU.visible = isB;

  const targetUpperGeo = hasCarriage ? T.geoUpPA2 : T.geoUpSmooth;
  if (T.upF.geometry !== targetUpperGeo) T.upF.geometry = targetUpperGeo;
  if (T.upB.geometry !== targetUpperGeo) T.upB.geometry = targetUpperGeo;

  const targetLowerGeo = isC ? T.geoLoPA2 : T.geoLoSmooth;
  if (T.loF.geometry !== targetLowerGeo) T.loF.geometry = targetLowerGeo;
  if (T.loB.geometry !== targetLowerGeo) T.loB.geometry = targetLowerGeo;

  let cx = 5.0, cy = 0;

  if (isOrig || hasCarriage) {
    const sol = K.solveHM(state.D);
    state.sol = sol;
    cx = sol.cx; cy = sol.cy;

    T.upper.rotation.z = sol.theta;
    T.lower.rotation.z = -sol.theta;

    if (hasCarriage) {
      if (!state.manualCarriage) {
        state.notchIdx = bestNotchFor(state.D);
        state.carriageT = NOTCHES[state.notchIdx].t;
        syncCarriageUI(state.notchIdx);
      }
      const f = K.toothFrame(state.carriageT);
      const w = bladeW(state.carriageT);
      const archType = isD ? 'pa1' : 'pa2';

      // Đặt cụm dao-trục hàm trên tại gốc đường đỉnh răng (f.x, f.y)
      T.carriage.position.set(f.x, f.y, 0);
      T.carriage.rotation.z = f.angle;
      T.upperCarriageSys.updateCarriage(W, +K.DEPTH_GAP, state.explode, archType, state.carriageT, 0);

      // Đặt cụm dao-trục ngược chiều ở hàm dưới (Phương án C: mũi dao quay ngược lại để cùng cắt khi xoay 1 chiều)
      if (isC) {
        T.carriageLower.position.set(f.x, -f.y, 0);
        T.carriageLower.rotation.z = -f.angle;
        T.lowerCarriageSys.updateCarriage(W, -K.DEPTH_GAP, state.explode, 'pa2', state.carriageT, 0);
      }

      const [tipX, tipY] = K.peelTipWorldA(state.carriageT, sol.theta);
      const distToCenter = Math.hypot(tipX - cx, tipY - cy);
      state.engaged = distToCenter <= sol.R + 0.12;
      const alpha = Math.atan2(tipY - cy, tipX - cx);
      state.contact = {
        alpha,
        tipX,
        tipY,
        tangentAngle: alpha - Math.PI / 2,
      };
      // Điểm tiếp xúc đối xứng ở hàm dưới (cho Phương án C)
      const alphaBot = Math.atan2(-tipY - cy, tipX - cx);
      state.contact2 = {
        alpha: alpha + Math.PI,
        tipX,
        tipY: -tipY,
        tangentAngle: alphaBot - Math.PI / 2,
      };
    } else {
      state.engaged = false;
      const [tx, ty] = K.peelTipWorldA(sol.contactT, sol.theta);
      const alpha = Math.atan2(ty - cy, tx - cx);
      state.contact = { alpha, tipX: tx, tipY: ty, tangentAngle: alpha - Math.PI / 2 };
    }
  } else {
    // Phương án B (Dự phòng)
    const sol = K.solveB(state.D);
    state.sol = sol;
    cx = sol.cx; cy = sol.cy;

    T.upper.rotation.z = sol.thetaU;
    T.lower.rotation.z = -sol.thetaL;

    const localAim = sol.aim - sol.thetaU + Math.PI / 2;
    T.bHead.rotation.z = localAim;

    state.engaged = true;
    const alpha = sol.aim + Math.PI;
    const rTip = sol.Rc + K.DEPTH_GAP - K.TOOTH_SINK;
    const tipX = cx + Math.cos(alpha) * rTip;
    const tipY = cy + Math.sin(alpha) * rTip;
    state.contact = {
      alpha,
      tipX,
      tipY,
      tangentAngle: alpha - Math.PI / 2,
    };
  }

  // Lò xo xoắn (torsion spring) quấn quanh trục bản lề (0, 0) như kéo HM226 thật
  const pU = new THREE.Vector3(-4.2, -1.35, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), T.upper.rotation.z);
  const pL = new THREE.Vector3(-4.2, +1.35, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), T.lower.rotation.z);
  const legSpread = Math.max(0.55, Math.abs(pL.y - pU.y) / 2.7);
  T.spring.position.set(0, 0, state.explode * 1.45);
  T.spring.scale.set(1, legSpread, 1);
  T.spring.rotation.z = 0;

  // Đặt tâm xoay kéo tại đúng tâm cành (cx, cy)
  toolOrbitPivot.position.set(cx, cy, 0);
  toolOffsetGroup.position.set(-cx, -cy, 0);
  toolOrbitPivot.rotation.z = -state.peel;

  const showBranchNow = state.showBranch && state.cam !== 'carriage';
  branchSys.root.visible = showBranchNow;
  branchSys.ribbonG.visible = showBranchNow;
  branchSys.root.position.set(cx, cy, 0);

  // --- CẬP NHẬT ĐỘ RỘNG VỎ BÓC (KHOẢNG CÁCH GIỮA 2 DAO W) & TÁCH LỚP CHI TIẾT CHÍNH XÁC 100% ---
  const ex = state.explode;
  const zUp = W / 2;
  const zLo = isC ? W / 2 : Math.max(0.12, W / 2 - 0.14);

  // 2 lá kéo trước (+Z) và sau (-Z) tách đối xứng sang 2 bên
  T.upF.position.z = zUp + ex * 1.6;
  T.upB.position.z = -zUp - ex * 1.6;
  T.loF.position.z = zLo + ex * 1.3;
  T.loB.position.z = -zLo - ex * 1.3;

  // Bản lề kéo: Trục chốt giữ ở tâm hoặc nhích nhẹ, mũ chốt (+Z) và đai ốc hãm (-Z) tách ra 2 bên
  if (T.pivot.userData && T.pivot.userData.pcap) {
    T.pivot.position.z = 0;
    T.pivot.userData.pin.position.z = ex * 0.45;
    T.pivot.userData.pcap.position.z = 1.12 + ex * 1.45;
    T.pivot.userData.pnut.position.z = -1.12 - ex * 1.45;
  } else {
    T.pivot.position.z = ex * 1.4;
  }

  // Cụm bu-lông & ốc cánh chuồn nguyên bản của kéo HM226:
  // - Ống đệm (spacer) giữ ở giữa (z = 0)
  // - Thân bu-lông + Mũ lục giác (boltUnit) rút liền khối về phía -Z (không bị đứt rời mũ khỏi thân!)
  // - Ốc cánh chuồn (wingnut) tháo ra về phía +Z (ngoài mặt lá kéo 1)
  [T.nutU, T.nutUF, T.nutL, T.nutLF, T.nutB].forEach((n) => {
    if (n && n.userData.nut) {
      const spacerScale = Math.max(0.18, (W - 0.16) / (W0 - 0.2));
      if (n.userData.spacer) n.userData.spacer.scale.y = spacerScale;
      const halfSpan = W / 2 + 0.32;
      if (n.userData.boltUnit) {
        n.userData.head.position.z = -n.userData.baseLen / 2;
        n.userData.boltUnit.position.z = (n.userData.baseLen / 2 - halfSpan) - ex * 2.25;
      }
      n.userData.nut.position.z = halfSpan + ex * 2.35;
    }
  });

  // Cập nhật tọa độ mũi lưỡi bào trên & dưới khi kéo xoay quanh cành
  const rotContact = { ...state.contact };
  const rotContact2 = { ...state.contact2 };
  if (state.peel > 0) {
    const c = Math.cos(-state.peel), s = Math.sin(-state.peel);
    const dx1 = state.contact.tipX - cx, dy1 = state.contact.tipY - cy;
    rotContact.tipX = cx + dx1 * c - dy1 * s;
    rotContact.tipY = cy + dx1 * s + dy1 * c;
    rotContact.tangentAngle = state.contact.tangentAngle - state.peel;

    const dx2 = state.contact2.tipX - cx, dy2 = state.contact2.tipY - cy;
    rotContact2.tipX = cx + dx2 * c - dy2 * s;
    rotContact2.tipY = cy + dx2 * s + dy2 * c;
    rotContact2.tangentAngle = state.contact2.tangentAngle - state.peel;
  }

  branchSys.update({
    D: state.D,
    W,
    mode: state.mode,
    peel: state.peel,
    engaged: state.engaged,
    contact: rotContact,
    contact2: rotContact2,
    dualPeel: isC,
    section: state.section,
    fall: state.fall,
  });

  // Cập nhật huy hiệu trạng thái trên thanh tương tác nhanh
  const badge = document.getElementById('quick-status-badge');
  if (badge) {
    if (isOrig) {
      badge.textContent = `Rạch ${state.stripMM}mm`;
    } else if (isA || isD) {
      badge.textContent = state.engaged
        ? (state.notchIdx >= 0 ? NOTCHES[state.notchIdx].label : 'Đang ăn vỏ')
        : 'Lệch vị trí';
    } else if (isC) {
      badge.textContent = `2 Dao Ngược Chiều • 180°`;
    }
  }
}

// ----------------------------------------------------------------------------
// 6. CAMERA PRESETS
// ----------------------------------------------------------------------------
let cameraLerp = null;

function getPresetPose(preset) {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const aspectScale = aspect < 1 ? Math.min(2.15, 1.05 / Math.max(0.42, aspect)) : 1.0;

  const cx = state.sol ? state.sol.cx : 5.2;
  const cy = state.sol ? state.sol.cy : 0;
  const dx = (state.contact ? state.contact.tipX : cx) - cx;
  const dy = (state.contact ? state.contact.tipY : cy + 1.5) - cy;
  const c = Math.cos(-state.peel), s = Math.sin(-state.peel);
  const tx = cx + dx * c - dy * s;
  const ty = cy + dx * s + dy * c;

  if (preset === 'carriage') {
    worldRoot.updateWorldMatrix(true, true);
    const cWorld = new THREE.Vector3(-0.75, 0.35, 0).applyMatrix4(T.carriage.matrixWorld);
    const dist = 5.4 * Math.min(1.5, aspectScale * 0.78);
    return {
      pos: new THREE.Vector3(cWorld.x + dist * 0.75, cWorld.y - dist * 0.55, dist * 0.58),
      look: new THREE.Vector3(cWorld.x, cWorld.y, 0),
    };
  }
  if (preset === 'blade') {
    const dist = (3.85 + state.D * 0.42) * Math.min(1.4, aspectScale * 0.72);
    return {
      pos: new THREE.Vector3(tx - dist * 0.56, ty + dist * 0.68, dist * 0.92),
      look: new THREE.Vector3(tx - 0.12, ty + 0.12, 0),
    };
  }
  if (preset === 'section') {
    const span = Math.max(7.5, state.D * 1.65 + 4.2);
    const dist = span * 1.15 * Math.min(1.65, aspectScale * 0.78);
    return {
      pos: new THREE.Vector3(cx, cy + state.D * 0.12, dist),
      look: new THREE.Vector3(cx, cy + state.D * 0.12, 0),
    };
  }
  const baseZ = aspect < 1 ? 37.5 : 23.5;
  return {
    pos: new THREE.Vector3(3.1, 4.2, baseZ),
    look: new THREE.Vector3(2.9, -0.1, 0),
  };
}

function setCameraPreset(preset, immediate = false) {
  if (preset === 'autorotate') {
    state.autoRotate = !state.autoRotate;
    controls.autoRotate = state.autoRotate;
    controls.autoRotateSpeed = 2.0;
    document.querySelector('.cam-btn[data-cam="autorotate"]').classList.toggle('active', state.autoRotate);
    return;
  }

  const prevCam = state.cam;
  state.cam = preset;
  document.querySelectorAll('.cam-btn').forEach((btn) => {
    if (btn.dataset.cam !== 'autorotate') {
      btn.classList.toggle('active', btn.dataset.cam === preset);
    }
  });

  if (preset === 'carriage') {
    if (state.mode !== 'optionA' && state.mode !== 'optionD' && state.mode !== 'optionC') {
      setMode('optionA');
    }
    if (state.playing) {
      state.playing = false;
      syncPlayUI();
    }
    if (state.peel > 0.05) {
      state.peel = 0;
      document.getElementById('slider-peel').value = 0;
      document.getElementById('val-peel').textContent = '0°';
    }
    updateAll();
    showToast('🔍 <strong>Soi chi tiết Dao-trục 2 lỗ Ø4,2</strong> — Kéo <strong>Rộng vỏ (4–18mm)</strong> hoặc bấm <strong>Tách lớp</strong> để xem bu-lông M4 / ghim chữ U!');
  } else if (prevCam === 'carriage') {
    updateAll();
  }

  const wantSection = preset === 'section';
  if (state.section !== wantSection) {
    state.section = wantSection;
    const secToggle = document.getElementById('toggle-section');
    if (secToggle) secToggle.checked = wantSection;
    applySectionClipping(wantSection);
    updateAll();
  }

  const pose = getPresetPose(preset);
  if (immediate) {
    camera.position.copy(pose.pos);
    controls.target.copy(pose.look);
    controls.update();
    cameraLerp = null;
  } else {
    cameraLerp = {
      startPos: camera.position.clone(),
      endPos: pose.pos,
      startLook: controls.target.clone(),
      endLook: pose.look,
      t: 0,
    };
  }
}

// ----------------------------------------------------------------------------
// 7. SVG LEADER-LINE ANNOTATIONS
// ----------------------------------------------------------------------------
const annotationsLayer = document.getElementById('annotations-layer');
const leaderSvg = document.getElementById('leader-svg');
const calloutsContainer = document.getElementById('callouts-container');

const ANNOTATION_DEFS = {
  original: [
    {
      id: 'orig-blades',
      slot: 'top-right',
      label: '<strong>Lưỡi răng cưa kép HM226</strong>Chỉ rạch 2 đường song song',
      getWorldPos: () => {
        const [x, y] = K.offsetPoint(0.55, 0.25);
        return new THREE.Vector3(x, y, state.W / 2).applyMatrix4(T.hmU.matrixWorld);
      },
      improvement: false,
    },
    {
      id: 'orig-nut',
      slot: 'top-left',
      label: '<strong>2 Ốc cánh chuồn + Đai ốc đệm lục giác</strong>Giữ 2 lá song song & chỉnh rộng vỏ 4–18 mm',
      getWorldPos: () => new THREE.Vector3(0, 0.2, state.W / 2 + 0.3).applyMatrix4(T.nutU.matrixWorld),
      improvement: false,
    },
  ],
  optionA: [
    {
      id: 'a-carriage',
      slot: 'top-right',
      label: '<strong>★ PA 2 — Dao-trục 2 lỗ + 2 bu-lông M4</strong>Bu-lông 10.9 xuyên lá 1 → thân dao → lá 2 + đai ốc • Cứng vững tuyệt đối',
      getWorldPos: () => new THREE.Vector3(-0.75, -0.45, state.W * 0.5 + 0.25).applyMatrix4(T.carriage.matrixWorld),
      improvement: true,
    },
    {
      id: 'a-peel',
      slot: 'bottom-right',
      label: '<strong>Dao-trục hình nêm (khoan 2 lỗ Ø4,2)</strong>Dài khít khe W • 3 cỡ dao 4–8 / 8–13 / 13–18 mm',
      getWorldPos: () => new THREE.Vector3(-0.2, -0.8, 0).applyMatrix4(T.carriage.matrixWorld),
      improvement: true,
    },
    {
      id: 'a-nut',
      slot: 'top-left',
      label: '<strong>Ốc cánh chuồn (4–18 mm)</strong>Chỉnh khoảng cách giữa 2 lá kéo',
      getWorldPos: () => new THREE.Vector3(0, 0.2, state.W / 2 + 0.3).applyMatrix4(T.nutU.matrixWorld),
      improvement: false,
    },
  ],
  optionD: [
    {
      id: 'a-carriage',
      slot: 'top-right',
      label: '<strong>PA 1 — Ghim chữ U + 2 E-clip (tháo tay)</strong>2 chân ghim Ø4 xuyên dao-trục, cầu nối ngoài lá 1, E-clip khóa ở lá 2',
      getWorldPos: () => new THREE.Vector3(-0.75, -0.45, state.W * 0.5 + 0.25).applyMatrix4(T.carriage.matrixWorld),
      improvement: true,
    },
    {
      id: 'a-peel',
      slot: 'bottom-right',
      label: '<strong>Dao-trục hình nêm (khoan 2 lỗ Ø4,2)</strong>Rút ghim là thay dao • 3 vị trí × 2 lỗ liền kề',
      getWorldPos: () => new THREE.Vector3(-0.2, -0.8, 0).applyMatrix4(T.carriage.matrixWorld),
      improvement: true,
    },
    {
      id: 'a-nut',
      slot: 'top-left',
      label: '<strong>Ốc cánh chuồn (4–18 mm)</strong>Chỉnh khoảng cách giữa 2 lá kéo',
      getWorldPos: () => new THREE.Vector3(0, 0.2, state.W / 2 + 0.3).applyMatrix4(T.nutU.matrixWorld),
      improvement: false,
    },
  ],
  optionC: [
    {
      id: 'a-carriage',
      slot: 'top-right',
      label: '<strong>Dao-trục Hàm trên (Hướng thuận +X)</strong>Khóa 2 bu-lông M4 xuyên 2 lá • Cắt nửa vòng trên',
      getWorldPos: () => new THREE.Vector3(-0.75, -0.45, state.W * 0.5 + 0.25).applyMatrix4(T.carriage.matrixWorld),
      improvement: true,
    },
    {
      id: 'c-lower',
      slot: 'bottom-right',
      label: '<strong>Dao-trục Hàm dưới (Quay ngược chiều -X)</strong>Đối xứng tâm với dao trên → Xoay 1 chiều 180° cắt đứt trọn 360° vỏ!',
      getWorldPos: () => new THREE.Vector3(0.75, 0.45, state.W * 0.5 + 0.25).applyMatrix4(T.carriageLower.matrixWorld),
      improvement: true,
    },
    {
      id: 'a-nut',
      slot: 'top-left',
      label: '<strong>Đồng bộ bề rộng W (4–18 mm)</strong>2 dao-trục trên & dưới cùng cỡ bề rộng',
      getWorldPos: () => new THREE.Vector3(0, 0.2, state.W / 2 + 0.3).applyMatrix4(T.nutU.matrixWorld),
      improvement: false,
    },
  ],
};

let activeCallouts = [];

function rebuildAnnotationPins() {
  calloutsContainer.innerHTML = '';
  leaderSvg.innerHTML = '';
  activeCallouts = [];

  const defs = ANNOTATION_DEFS[state.mode] || [];
  defs.forEach((def) => {
    const box = document.createElement('div');
    box.className = `callout-box ${def.improvement ? 'improvement' : ''}`;
    box.innerHTML = def.label;
    box.addEventListener('click', () => handlePartAction(def.id));
    calloutsContainer.appendChild(box);

    const color = def.improvement ? '#f59e0b' : '#0f766e';
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', color);
    polyline.setAttribute('stroke-width', '1.8');
    polyline.setAttribute('stroke-dasharray', '4,3');
    leaderSvg.appendChild(polyline);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '4.5');
    dot.setAttribute('fill', color);
    dot.setAttribute('stroke', '#ffffff');
    dot.setAttribute('stroke-width', '1.8');
    leaderSvg.appendChild(dot);

    activeCallouts.push({ box, polyline, dot, def });
  });
}

function getSlotScreenCoords(slot, Wv, Hv, boxW = 152, boxH = 56) {
  const isMobile = Wv <= 900;
  const brandEl = document.querySelector('.brand-card');
  const brandBottom = brandEl ? brandEl.getBoundingClientRect().bottom + 8 : 88;
  const topY = isMobile ? Math.max(88, brandBottom) : 78;

  // Đo chính xác cạnh trên của .bottom-hud để hộp chú thích dưới KHÔNG BAO GIỜ bị đè cắt chữ!
  const dockEl = document.querySelector('.bottom-hud');
  const dockTop = dockEl ? dockEl.getBoundingClientRect().top : (Hv - 210);
  const bottomY = Math.max(topY + 95, dockTop - boxH - 12);

  const leftX = isMobile ? 10 : 18;
  const rightX = isMobile ? Math.max(leftX + 152, Wv - boxW - 10) : Math.max(leftX + 180, Wv - 340 - boxW - 24);

  switch (slot) {
    case 'top-left':
      return { x: leftX, y: topY };
    case 'top-right':
      return { x: rightX, y: isMobile ? 64 : 78 };
    case 'bottom-left':
      return { x: leftX, y: bottomY };
    case 'bottom-right':
    default:
      return { x: rightX, y: bottomY };
  }
}

function updateAnnotationsPositions() {
  if (!state.showLabels) {
    annotationsLayer.style.display = 'none';
    return;
  }
  annotationsLayer.style.display = 'block';

  const Wv = window.innerWidth;
  const Hv = window.innerHeight;
  worldRoot.updateWorldMatrix(true, true);

  activeCallouts.forEach(({ box, polyline, dot, def }) => {
    const wp = def.getWorldPos();
    wp.project(camera);

    if (wp.z > 1) {
      box.classList.add('hidden-pin');
      polyline.style.display = 'none';
      dot.style.display = 'none';
      return;
    }

    box.classList.remove('hidden-pin');
    polyline.style.display = 'block';
    dot.style.display = 'block';

    const px = (wp.x * 0.5 + 0.5) * Wv;
    const py = (-wp.y * 0.5 + 0.5) * Hv;

    const boxW = box.offsetWidth || 152;
    const boxH = box.offsetHeight || 56;
    const slotPos = getSlotScreenCoords(def.slot, Wv, Hv, boxW, boxH);
    box.style.left = `${slotPos.x}px`;
    box.style.top = `${slotPos.y}px`;

    const isTop = def.slot.startsWith('top');
    const bx = slotPos.x + boxW * 0.5;
    const by = isTop ? slotPos.y + boxH : slotPos.y;
    const elbowY = isTop ? by + 15 : by - 15;

    polyline.setAttribute(
      'points',
      `${px.toFixed(1)},${py.toFixed(1)} ${bx.toFixed(1)},${elbowY.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`
    );
    dot.setAttribute('cx', px.toFixed(1));
    dot.setAttribute('cy', py.toFixed(1));
  });
}

// ----------------------------------------------------------------------------
// 8. DIRECT 3D TOUCH / RAYCAST INTERACTION
// ----------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let downPos = { x: 0, y: 0 };
let toastTimer = null;

function showToast(html) {
  const el = document.getElementById('part-toast');
  if (!el) return;
  el.innerHTML = html;
  el.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
}

function handlePartAction(id) {
  if (id === 'a-carriage' || id === 'c-lower' || id === 'carriage') {
    const nextIdx = (state.notchIdx + 1) % NOTCHES.length;
    state.notchIdx = nextIdx;
    state.manualCarriage = false;
    state.D = NOTCHES[nextIdx].sampleD;
    syncDiameterUI(state.D);
    syncCarriageUI(nextIdx);
    updateAll();
    showToast(`🔧 Đã chuyển dao-trục sang cặp lỗ <strong>${NOTCHES[nextIdx].label}</strong> (Cành ${state.D.toFixed(1)} cm)`);
  } else if (id === 'a-peel' || id === 'b-pivot' || id === 'peel' || id === 'bhead') {
    setCameraPreset('blade');
    showToast('🔍 Cận cảnh Dao-trục hình nêm 2 lỗ Ø4,2 mm & khe thoát vỏ thoáng 100%');
  } else if (id === 'orig-nut' || id === 'a-nut' || id === 'b-spring' || id === 'nut') {
    const widths = [4, 8, 13, 18];
    const nextW = widths[(widths.indexOf(state.stripMM) + 1) % widths.length] || 13;
    state.stripMM = nextW;
    syncStripWidthUI(nextW);
    updateAll();
    showToast(`🔩 Đã chỉnh rộng vỏ = <strong>${nextW} mm</strong> (Dao-trục dài khít khe giữa 2 lá kéo!)`);
  } else {
    togglePeelPlay();
    showToast(state.playing ? '🔄 Đang mô phỏng xoay khoanh & bóc vỏ cây...' : '⏸ Đã tạm dừng mô phỏng');
  }
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  downPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 7) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects([T.root, branchSys.root], true);
  if (!hits.length) return;
  let obj = hits[0].object;
  while (obj && !obj.userData.part) obj = obj.parent;
  const part = obj ? obj.userData.part : 'branch';
  handlePartAction(part);
});

// ----------------------------------------------------------------------------
// 9. UI BINDINGS & MODE DESCRIPTIONS
// ----------------------------------------------------------------------------
const MODE_INFO = {
  original: {
    html: '<strong>Mẫu gốc HM226 (Chưa cải tiến)</strong>Chỉ có 2 lưỡi răng cưa kép song song cố định bằng ốc cánh chuồn. Khi xoay chỉ rạch được 2 đường trên vỏ; nông dân phải dùng tay hoặc dao cậy bóc dải vỏ.',
    angle: 'Không có',
    depth: 'Chỉnh bằng tay',
    adapt: 'Cung hàm cố định',
  },
  optionA: {
    html: '<strong>★ PA 2 (Làm mẫu thử — Dễ nhất) — Dao-trục 2 lỗ + 2 bu-lông M4</strong>Dao là <strong>một khối thép hình nêm đặt giữa 2 lá kéo</strong>, khoan xuyên 2 lỗ Ø4,2 mm dọc thân. 2 bu-lông M4 cấp 10.9 đi từ lá 1 → xuyên thân dao → lá 2 rồi siết đai ốc nyloc. 2 bu-lông tạo ngẫu lực chống xoay, 2 mặt đầu dao tì sát mặt trong 2 lá chống lệch. Mỗi lá khoan 4 lỗ (bước 7,8 mm) tạo 3 vị trí cỡ cành (mỗi vị trí dùng 2 lỗ liền kề).',
    angle: '28° (dao-trục nêm)',
    depth: '1.5 mm (Cữ răng)',
    adapt: '2 bu-lông M4 • 4 lỗ/lá',
  },
  optionD: {
    html: '<strong>PA 1 (Bản hoàn thiện — Thay nhanh) — Ghim chữ U + 2 E-clip</strong>Cùng dao-trục hình nêm 2 lỗ Ø4,2 mm như PA 2, nhưng thay 2 bu-lông bằng <strong>1 ghim chữ U Ø4 mm thép lò xo</strong>: 2 chân xuyên qua dao-trục, cầu nối nằm sát mặt ngoài lá 1, 2 đầu chân khóa bằng vòng E-clip ở mặt ngoài lá 2. Thay dao hoặc đổi vị trí chỉ cần bật 2 E-clip rồi rút ghim bằng tay.',
    angle: '28° (dao-trục nêm)',
    depth: '1.5 mm (Cữ răng)',
    adapt: 'Ghim U + 2 E-clip • tháo tay',
  },
  optionC: {
    html: '<strong>PA C (2 Hàm Đối Tâm • Xoay 180° đứt 360°)</strong>Gắn 2 cụm dao-trục ở cả hàm trên và hàm dưới theo chiều <strong>ngược nhau (đối xứng tâm 180°)</strong>: mũi dao hàm trên hướng thuận chiều xoay (+X), mũi dao hàm dưới quay ngược lại (-X). Khi xoay kéo theo 1 chiều chỉ cần <strong>180°</strong> là cả 2 lưỡi trên-dưới cùng cắt đứt trọn 360° vòng vỏ!',
    angle: '2 × 28° (Ngược chiều)',
    depth: '1.5 mm (Cữ răng)',
    adapt: '2 dao đối tâm • Xoay 180°',
  },
};

function setMode(mode) {
  state.mode = mode;
  state.manualCarriage = false;
  if (mode === 'optionC' && state.peel > Math.PI) {
    state.peel = Math.PI;
    document.getElementById('slider-peel').value = 180;
    document.getElementById('val-peel').textContent = '180° (Đứt 360°)';
  }

  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const info = MODE_INFO[mode];
  document.getElementById('mode-summary').innerHTML = info.html;
  document.getElementById('metric-angle').textContent = info.angle;
  document.getElementById('metric-depth').textContent = info.depth;
  document.getElementById('metric-width').textContent = `${state.stripMM} mm`;
  document.getElementById('metric-adapt').textContent = info.adapt;

  document.getElementById('group-option-a').classList.toggle('hidden', mode !== 'optionA' && mode !== 'optionD' && mode !== 'optionC');
  const grpB = document.getElementById('group-option-b'); if (grpB) grpB.classList.toggle('hidden', true);

  rebuildAnnotationPins();
  updateAll();
}

function syncDiameterUI(dVal) {
  document.getElementById('slider-diameter').value = dVal;
  document.getElementById('val-diameter').textContent = `${dVal.toFixed(1)} cm`;
  const qSlider = document.getElementById('quick-slider-diameter');
  const qVal = document.getElementById('quick-val-diameter');
  if (qSlider) qSlider.value = dVal;
  if (qVal) qVal.textContent = `${dVal.toFixed(1)} cm`;
}

function syncStripWidthUI(mmVal) {
  document.getElementById('slider-width').value = mmVal;
  document.getElementById('val-width').textContent = `${mmVal} mm`;
  document.getElementById('metric-width').textContent = `${mmVal} mm`;
  const qSlider = document.getElementById('quick-slider-width');
  const qVal = document.getElementById('quick-val-width');
  if (qSlider) qSlider.value = mmVal;
  if (qVal) qVal.textContent = `${mmVal} mm`;
}

function syncCarriageUI(notchIdx) {
  document.querySelectorAll('.notch-btn').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.notch) === notchIdx);
  });
  const tMin = 0.25, tMax = 0.72;
  const pct = Math.round(((state.carriageT - tMin) / (tMax - tMin)) * 100);
  document.getElementById('slider-carriage').value = THREE.MathUtils.clamp(pct, 0, 100);
  document.getElementById('val-carriage').textContent =
    notchIdx >= 0 ? NOTCHES[notchIdx].label : `Tùy chỉnh (${THREE.MathUtils.clamp(pct, 0, 100)}%)`;
}

function syncPlayUI() {
  const btnPlay = document.getElementById('btn-play-peel');
  const qIcon = document.getElementById('quick-play-icon');
  const qLabel = document.getElementById('quick-play-label');
  if (btnPlay) btnPlay.textContent = state.playing ? '⏸ Tạm dừng xoay' : '▶ Chạy mô phỏng xoay';
  if (qIcon && qLabel) {
    qIcon.textContent = state.playing ? '⏸' : '▶';
    qLabel.textContent = state.playing ? 'Dừng' : 'Bóc vỏ';
  }
}

function togglePeelPlay() {
  const maxRad = state.mode === 'optionC' ? Math.PI : TAU;
  if (state.peel >= maxRad - 0.01) {
    state.peel = 0;
    state.fall.active = false;
    state.fall.t = 0;
  }
  state.playing = !state.playing;
  syncPlayUI();
}

function setExplodeValue(pct) {
  state.explode = pct / 100;
  document.getElementById('slider-explode').value = Math.round(pct);
  document.getElementById('val-explode').textContent = `${Math.round(pct)}%`;
  const qBtn = document.getElementById('btn-quick-explode');
  if (qBtn) qBtn.classList.toggle('active', state.explode > 0.05);
  updateAll();
}

document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

['slider-diameter', 'quick-slider-diameter'].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', (e) => {
    state.D = parseFloat(e.target.value);
    state.manualCarriage = false;
    syncDiameterUI(state.D);
    updateAll();
  });
});

['slider-width', 'quick-slider-width'].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', (e) => {
    state.stripMM = parseInt(e.target.value, 10);
    syncStripWidthUI(state.stripMM);
    updateAll();
  });
});

document.querySelectorAll('.notch-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.notch);
    state.notchIdx = idx;
    state.manualCarriage = true;
    state.carriageT = NOTCHES[idx].t;
    syncCarriageUI(idx);
    updateAll();
  });
});

document.getElementById('slider-carriage').addEventListener('input', (e) => {
  const pct = parseFloat(e.target.value) / 100;
  state.notchIdx = -1;
  state.manualCarriage = true;
  state.carriageT = 0.25 + pct * (0.72 - 0.25);
  syncCarriageUI(-1);
  updateAll();
});

document.getElementById('btn-play-peel').addEventListener('click', togglePeelPlay);
document.getElementById('btn-quick-play').addEventListener('click', togglePeelPlay);

document.getElementById('btn-quick-explode').addEventListener('click', () => {
  setExplodeValue(state.explode > 0.1 ? 0 : 75);
});

document.getElementById('btn-reset-peel').addEventListener('click', () => {
  state.playing = false;
  state.peel = 0;
  state.fall.active = false;
  state.fall.t = 0;
  syncPlayUI();
  document.getElementById('slider-peel').value = 0;
  document.getElementById('val-peel').textContent = '0°';
  updateAll();
});

document.getElementById('slider-peel').addEventListener('input', (e) => {
  state.playing = false;
  state.fall.active = false;
  syncPlayUI();
  const deg = parseFloat(e.target.value);
  state.peel = THREE.MathUtils.degToRad(deg);
  const label = (state.mode === 'optionC' && deg >= 180)
    ? `${Math.round(deg)}° (Đã đứt 360°)`
    : `${Math.round(deg)}°`;
  document.getElementById('val-peel').textContent = label;
  updateAll();
});

document.getElementById('slider-explode').addEventListener('input', (e) => {
  setExplodeValue(parseFloat(e.target.value));
});

const secToggle = document.getElementById('toggle-section');
if (secToggle) {
  secToggle.addEventListener('change', (e) => {
    state.section = e.target.checked;
    applySectionClipping(state.section);
    updateAll();
  });
}

function setLabelsVisibility(v) {
  state.showLabels = v;
  document.getElementById('toggle-annotations').checked = v;
  document.getElementById('btn-toggle-labels').classList.toggle('active', v);
}

document.getElementById('toggle-annotations').addEventListener('change', (e) => {
  setLabelsVisibility(e.target.checked);
});
document.getElementById('btn-toggle-labels').addEventListener('click', () => {
  setLabelsVisibility(!state.showLabels);
});

document.getElementById('toggle-branch').addEventListener('change', (e) => {
  state.showBranch = e.target.checked;
  updateAll();
});

document.querySelectorAll('.cam-btn').forEach((btn) => {
  btn.addEventListener('click', () => setCameraPreset(btn.dataset.cam));
});

// Modals
const compareModal = document.getElementById('compare-modal');
document.getElementById('btn-compare').addEventListener('click', () => compareModal.classList.add('open'));
document.getElementById('btn-close-modal').addEventListener('click', () => compareModal.classList.remove('open'));
compareModal.addEventListener('click', (e) => { if (e.target === compareModal) compareModal.classList.remove('open'); });

const practicalModal = document.getElementById('practical-modal');
document.getElementById('btn-practical').addEventListener('click', () => practicalModal.classList.add('open'));
document.getElementById('btn-close-practical').addEventListener('click', () => practicalModal.classList.remove('open'));
practicalModal.addEventListener('click', (e) => { if (e.target === practicalModal) practicalModal.classList.remove('open'); });

document.getElementById('btn-activate-optC').addEventListener('click', () => {
  practicalModal.classList.remove('open');
  setMode('optionC');
  showToast('★ Đang hiển thị <strong>Phương án C — 2 Cụm bào đối xứng (Chỉ cần lắc 180° đứt trọn 360° vỏ!)</strong>');
});

const controlPanel = document.getElementById('control-panel');
document.getElementById('btn-mobile-panel').addEventListener('click', () => {
  controlPanel.classList.toggle('mobile-open');
});
document.getElementById('btn-close-panel').addEventListener('click', () => {
  controlPanel.classList.remove('mobile-open');
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----------------------------------------------------------------------------
// 10. ANIMATION LOOP
// ----------------------------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state.playing) {
    const maxRad = state.mode === 'optionC' ? Math.PI : TAU;
    state.peel += dt * 1.45;
    if (state.peel >= maxRad) {
      state.peel = maxRad;
      state.playing = false;
      state.fall.active = true;
      state.fall.t = 0;
      syncPlayUI();
    }
    const deg = Math.round(THREE.MathUtils.radToDeg(state.peel));
    document.getElementById('slider-peel').value = deg;
    document.getElementById('val-peel').textContent =
      (state.mode === 'optionC' && deg >= 180) ? '180° (Đứt 360°)' : `${deg}°`;
    updateAll();
  } else if (state.fall.active) {
    state.fall.t += dt;
    if (state.fall.t > 1.2) state.fall.active = false;
    updateAll();
  }

  if (cameraLerp) {
    cameraLerp.t = Math.min(1, cameraLerp.t + dt * 3.0);
    const ease = 1 - Math.pow(1 - cameraLerp.t, 3);
    camera.position.lerpVectors(cameraLerp.startPos, cameraLerp.endPos, ease);
    controls.target.lerpVectors(cameraLerp.startLook, cameraLerp.endLook, ease);
    if (cameraLerp.t >= 1) cameraLerp = null;
  }

  controls.update();
  renderer.render(scene, camera);
  updateAnnotationsPositions();
}

// Khởi chạy
setMode('optionA');
setCameraPreset('overview', true);
animate();
