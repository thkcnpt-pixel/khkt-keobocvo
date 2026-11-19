/* ============================================================================
   app.js (v6) — Bộ điều phối chính:
   - Động học chính xác cho HM226, Phương án A, Phương án B và Phương án C (Tối ưu Thực tế)
   - Tùy chỉnh động Bề rộng lớp vỏ bóc (khoảng cách giữa 2 dao: 4..18 mm)
   - Bóc vỏ xoay quanh cành, Tách lớp chi tiết theo hệ trục cục bộ, Mặt cắt ngang giải phẫu
   ============================================================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as K from './kinematics.js?v=6';
import { TAU, createMaterials } from './materials.js?v=6';
import { bladeW, buildTool } from './tool.js?v=6';
import { createBranchSystem } from './branch.js?v=6';

const W0 = K.STRIP_WIDTH; // 1.3 cm (13 mm baseline)
const TILT_NOMINAL = THREE.MathUtils.degToRad(-13.5);

// ----------------------------------------------------------------------------
// 1. KHẤC ĐỊNH VỊ PHƯƠNG ÁN A / C (Tính trực tiếp từ nghiệm động học thật)
// ----------------------------------------------------------------------------
const NOTCH_SAMPLE_D = [1.6, 3.5, 5.5, 7.4];
const NOTCHES = NOTCH_SAMPLE_D.map((d) => ({
  t: K.solveHM(d).contactT,
  sampleD: d,
  dMin: 99,
  dMax: 0,
}));

function bestNotchFor(D) {
  const t = K.solveHM(D).contactT;
  let best = 0, bestErr = Infinity;
  NOTCHES.forEach((n, i) => {
    const err = Math.abs(n.t - t);
    if (err < bestErr) { bestErr = err; best = i; }
  });
  return best;
}

for (let d = 1.0; d <= 8.001; d += 0.1) {
  const idx = bestNotchFor(d);
  NOTCHES[idx].dMin = Math.min(NOTCHES[idx].dMin, d);
  NOTCHES[idx].dMax = Math.max(NOTCHES[idx].dMax, d);
}
NOTCHES.forEach((n, i) => {
  n.label = `Khấc ${i + 1} (${Math.round(n.dMin)}–${Math.round(n.dMax)}cm)`;
});

// ----------------------------------------------------------------------------
// 2. GLOBAL STATE
// ----------------------------------------------------------------------------
const state = {
  mode: 'optionA',      // 'original' | 'optionA' | 'optionB' | 'optionC'
  D: 4.0,               // 1.0 .. 8.0 cm (Đường kính cành)
  stripMM: 13,          // 4 .. 18 mm (Độ rộng lớp vỏ bóc / khoảng cách giữa 2 dao)
  W: 1.3,               // = stripMM / 10 (cm)
  notchIdx: 1,          // 0..3 or -1
  carriageT: NOTCHES[1].t,
  manualCarriage: false,
  peel: 0,              // 0 .. 2π rad (góc xoay kéo quanh cành)
  playing: false,
  explode: 0,           // 0 .. 1
  section: false,       // chế độ cắt lớp mặt phẳng z = 0
  showLabels: true,
  showBranch: true,
  autoRotate: false,
  cam: 'overview',
  sol: null,
  engaged: true,
  contact: { alpha: Math.PI / 2, tipX: 5, tipY: 2, tangentAngle: 0 },
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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.localClippingEnabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 0.95));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.55);
keyLight.position.set(12, 18, 20);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xfff1d6, 0.55);
rimLight.position.set(-12, -8, -12);
scene.add(rimLight);

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
// 4. BUILD SCENE HIERARCHY (Tool Orbiting Branch + Branch System)
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
// 5. KINEMATICS, STRIP WIDTH, PEELING ORBIT & EXPLODED VIEW UPDATE
// ----------------------------------------------------------------------------
function updateAll() {
  state.W = state.stripMM / 10; // cm
  const W = state.W;

  const isOrig = state.mode === 'original';
  const isA = state.mode === 'optionA';
  const isB = state.mode === 'optionB';
  const isC = state.mode === 'optionC'; // Phương án C: Tối ưu thực tế (Khung HM226 + Đế V PTFE lắp hàm dưới + Con chạy lưỡi SK5 thay nhanh)

  T.hmU.visible = isOrig || isA || isC;
  T.hmL.visible = isOrig || isA || isC;
  T.carriage.visible = isA || isC;
  T.cLowerSaddle.visible = isC;
  T.bL.visible = isB;
  T.bU.visible = isB;

  const targetUpperGeo = (isA || isC) ? T.geoUpNotched : T.geoUpSmooth;
  if (T.upF.geometry !== targetUpperGeo) {
    T.upF.geometry = targetUpperGeo;
    T.upB.geometry = targetUpperGeo;
  }

  let cx = 5.0, cy = 0;

  if (isOrig || isA || isC) {
    const sol = K.solveHM(state.D);
    state.sol = sol;
    cx = sol.cx; cy = sol.cy;

    T.upper.rotation.z = sol.theta;
    T.lower.rotation.z = -sol.theta;

    if (isA || isC) {
      if (!state.manualCarriage) {
        state.notchIdx = bestNotchFor(state.D);
        state.carriageT = NOTCHES[state.notchIdx].t;
        syncCarriageUI(state.notchIdx);
      }
      // Đặt con chạy đúng trên đường sống lưng tại tham số state.carriageT
      const f = K.toothFrame(state.carriageT);
      const w = bladeW(state.carriageT);
      T.carriage.position.set(f.x + f.nx * w, f.y + f.ny * w, 0);
      T.carriage.rotation.z = f.angle;
      T.buildPeelA(state.carriageT, W);

      const [tipX, tipY] = K.peelTipWorldA(state.carriageT, sol.theta);
      const distToCenter = Math.hypot(tipX - cx, tipY - cy);
      state.engaged = distToCenter <= sol.R + 0.08;
      const alpha = Math.atan2(tipY - cy, tipX - cx);
      state.contact = {
        alpha,
        tipX,
        tipY,
        tangentAngle: alpha - Math.PI / 2,
      };

      // Nếu là Phương án C (Tối ưu thực tế): Đế chữ V nhựa PTFE bắt trên hàm dưới ôm tiếp xúc mặt dưới cành cây!
      if (isC) {
        // Tính vị trí đỉnh V trong hệ cục bộ hàm dưới sao cho 2 đệm trượt PTFE tỳ đúng mặt dưới cành bán kính R
        const R = sol.R;
        const padDist = (R + K.B.rollerR) / Math.sin(K.B.halfAngle);
        const targetVx = cx * Math.cos(sol.theta) - cy * Math.sin(sol.theta);
        const targetVy = cx * Math.sin(sol.theta) + cy * Math.cos(sol.theta) - padDist;
        T.cLowerSaddle.position.set(targetVx - K.B.vertex[0], targetVy - K.B.vertex[1], 0);
        const scaleZ = Math.max(0.35, W / W0);
        T.cSaddleBody.scale.z = scaleZ;
        T.cLinerPads.scale.z = scaleZ;
      }
    } else {
      state.engaged = false;
      const [tx, ty] = K.peelTipWorldA(sol.contactT, sol.theta);
      const alpha = Math.atan2(ty - cy, tx - cx);
      state.contact = { alpha, tipX: tx, tipY: ty, tangentAngle: alpha - Math.PI / 2 };
    }
  } else {
    // Phương án B: Hàm chữ V + Cụm dao chữ U tự lựa
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

    const relTiltDeg = THREE.MathUtils.radToDeg(sol.tilt - TILT_NOMINAL);
    const bDiamEl = document.getElementById('b-diam-text');
    const bTiltEl = document.getElementById('b-tilt-text');
    if (bDiamEl) bDiamEl.textContent = `${state.D.toFixed(1)} cm`;
    if (bTiltEl) bTiltEl.textContent = `${relTiltDeg >= 0 ? '+' : ''}${relTiltDeg.toFixed(1)}°`;
  }

  // Lò xo đẩy giữa 2 tay cầm
  const pU = new THREE.Vector3(-4.2, -1.35, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), T.upper.rotation.z);
  const pL = new THREE.Vector3(-4.2, +1.35, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), T.lower.rotation.z);
  T.spring.position.copy(pU).add(pL).multiplyScalar(0.5);
  const springVec = pL.clone().sub(pU);
  T.spring.scale.set(1, Math.max(0.4, springVec.length()), 1);
  T.spring.rotation.z = Math.atan2(springVec.y, springVec.x) - Math.PI / 2;

  // Đặt tâm xoay kéo tại đúng tâm cành (cx, cy)
  toolOrbitPivot.position.set(cx, cy, 0);
  toolOffsetGroup.position.set(-cx, -cy, 0);
  toolOrbitPivot.rotation.z = -state.peel;

  if (isB) {
    const rollerAngle = (state.peel * (state.D / 2)) / K.B.rollerR;
    T.rollerSpin.forEach((s) => { s.rotation.z = rollerAngle; });
  }

  branchSys.root.visible = state.showBranch;
  branchSys.ribbonG.visible = state.showBranch;
  branchSys.root.position.set(cx, cy, 0);

  // --- CẬP NHẬT ĐỘ RỘNG VỎ BÓC (KHOẢNG CÁCH GIỮA 2 DAO W) & TÁCH LỚP CHI TIẾT (EXPLODED VIEW) ---
  const ex = state.explode;
  const zUp = W / 2;
  const zLo = Math.max(0.12, W / 2 - 0.14);

  T.upF.position.z = zUp + ex * 1.6;
  T.upB.position.z = -zUp - ex * 1.6;
  T.loF.position.z = zLo + ex * 1.3;
  T.loB.position.z = -zLo - ex * 1.3;
  T.pivot.position.z = ex * 1.8;

  // Ốc cánh chuồn và ống đệm (long đền) tự động dịch chuyển theo bề rộng W!
  [T.nutU, T.nutL, T.nutB].forEach((n) => {
    if (n && n.userData.nut) {
      const spacerScale = Math.max(0.18, (W - 0.16) / (W0 - 0.2));
      if (n.userData.spacer) n.userData.spacer.scale.y = spacerScale;
      n.userData.nut.position.z = W / 2 + 0.32 + ex * 1.4;
      n.userData.head.position.z = -(W / 2 + 0.32) - ex * 1.1;
    }
  });

  // Con chạy Phương án A / C co giãn bề rộng theo khoảng cách 2 lưỡi W
  const cheekZ = W / 2 + 0.16;
  T.carBridge.scale.z = (W + 0.62) / (W0 + 0.62);
  T.carBody.position.y = ex * 0.9;
  T.pin.position.y = ex * 0.95;
  T.cheekF.position.z = cheekZ + ex * 0.95;
  T.cheekB.position.z = -cheekZ - ex * 0.95;
  T.peelA.position.y = -ex * 0.85;
  T.cLowerSaddle.position.z = -ex * 1.4;

  // Cụm dao chữ U Phương án B co giãn bề rộng theo W
  T.rollerG.forEach((rg, idx) => {
    rg.position.z = (idx === 0 ? 1 : -1) * ex * 1.5;
  });
  T.bJoint.position.z = ex * 1.4;
  T.bHousing.scale.z = (W + 0.55) / (W0 + 0.55);
  T.bSideF.position.z = W / 2 + ex * 1.3;
  T.bSideB.position.z = -W / 2 - ex * 1.3;
  const peelBScaleZ = Math.max(0.2, (W - 0.16) / (W0 - 0.2));
  T.peelB.scale.z = peelBScaleZ;
  T.stemB.scale.z = peelBScaleZ;
  T.peelBG.position.y = -ex * 0.95;

  // Cập nhật cành cây, rãnh cắt, cuộn vỏ theo đúng bề rộng W
  const rotContact = { ...state.contact };
  if (state.peel > 0) {
    const dx = state.contact.tipX - cx, dy = state.contact.tipY - cy;
    const c = Math.cos(-state.peel), s = Math.sin(-state.peel);
    rotContact.tipX = cx + dx * c - dy * s;
    rotContact.tipY = cy + dx * s + dy * c;
    rotContact.tangentAngle = state.contact.tangentAngle - state.peel;
  }

  branchSys.update({
    D: state.D,
    W,
    mode: state.mode,
    peel: state.peel,
    engaged: state.engaged,
    contact: rotContact,
    section: state.section,
    fall: state.fall,
  });

  // Cập nhật huy hiệu trạng thái trên thanh Quick Bar
  const badge = document.getElementById('quick-status-badge');
  if (badge) {
    if (isOrig) {
      badge.textContent = `Rạch ${state.stripMM}mm`;
    } else if (isA) {
      badge.textContent = state.engaged
        ? (state.notchIdx >= 0 ? NOTCHES[state.notchIdx].label : 'Đang ăn vỏ')
        : 'Lệch khấc';
    } else if (isC) {
      badge.textContent = `Đế V PTFE • ${state.stripMM}mm`;
    } else {
      const relTiltDeg = THREE.MathUtils.radToDeg(state.sol.tilt - TILT_NOMINAL);
      badge.textContent = `Tự lựa ${relTiltDeg >= 0 ? '+' : ''}${relTiltDeg.toFixed(1)}°`;
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

  if (preset === 'blade') {
    const dist = (4.5 + state.D * 0.48) * Math.min(1.45, aspectScale * 0.72);
    return {
      pos: new THREE.Vector3(tx - dist * 0.42, ty + dist * 0.62, dist * 0.88),
      look: new THREE.Vector3(tx, ty - 0.15, 0),
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
  const baseZ = 22.5 * aspectScale;
  return {
    pos: new THREE.Vector3(-0.2, 4.8, baseZ),
    look: new THREE.Vector3(-0.4, -0.2, 0),
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

  state.cam = preset;
  document.querySelectorAll('.cam-btn').forEach((btn) => {
    if (btn.dataset.cam !== 'autorotate') {
      btn.classList.toggle('active', btn.dataset.cam === preset);
    }
  });

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
      label: '<strong>Ốc cánh chuồn & Long đền</strong>Chỉnh rộng vỏ bóc 4–18 mm',
      getWorldPos: () => new THREE.Vector3(0, 0.2, state.W / 2 + 0.3).applyMatrix4(T.nutU.matrixWorld),
      improvement: false,
    },
  ],
  optionA: [
    {
      id: 'a-carriage',
      slot: 'top-right',
      label: '<strong>Con chạy sống lưng (4 khấc)</strong>Chạm để nhảy khấc gài nhanh',
      getWorldPos: () => new THREE.Vector3(-0.2, 0.65, 0).applyMatrix4(T.carriage.matrixWorld),
      improvement: true,
    },
    {
      id: 'a-peel',
      slot: 'bottom-right',
      label: '<strong>Lưỡi bào 28° + Thoát phoi</strong>Tự bóc vỏ, cữ răng 1.5 mm',
      getWorldPos: () => new THREE.Vector3(0, -0.5, 0).applyMatrix4(T.peelA.matrixWorld),
      improvement: true,
    },
    {
      id: 'a-nut',
      slot: 'top-left',
      label: '<strong>Ốc cánh chuồn (4–18 mm)</strong>Chỉnh khoảng cách giữa 2 dao',
      getWorldPos: () => new THREE.Vector3(0, 0.2, state.W / 2 + 0.3).applyMatrix4(T.nutU.matrixWorld),
      improvement: false,
    },
  ],
  optionB: [
    {
      id: 'b-pivot',
      slot: 'top-right',
      label: '<strong>Cụm dao chữ U tự lựa (±12°)</strong>Lưỡi bào 28° luôn tiếp tuyến vỏ',
      getWorldPos: () => new THREE.Vector3(0, -0.35, 0).applyMatrix4(T.bHead.matrixWorld),
      improvement: true,
    },
    {
      id: 'b-vjaw',
      slot: 'bottom-right',
      label: '<strong>Hàm chữ V + 2 Con lăn mini</strong>Tự định tâm cành 1–8 cm',
      getWorldPos: () => new THREE.Vector3(0, 0, 0.6).applyMatrix4(T.rollerG[1].matrixWorld),
      improvement: true,
    },
    {
      id: 'b-spring',
      slot: 'top-left',
      label: '<strong>Ốc chỉnh rộng vỏ (4–18 mm)</strong>Thay đổi bề rộng khoanh trên cụm U',
      getWorldPos: () => new THREE.Vector3(0, 0.2, state.W / 2 + 0.3).applyMatrix4(T.nutB.matrixWorld),
      improvement: false,
    },
  ],
  optionC: [
    {
      id: 'a-carriage',
      slot: 'top-right',
      label: '<strong>Gá dao SK5 thay nhanh 15s</strong>Vít tay M3 chỉnh cữ sâu 0.8–2.5mm',
      getWorldPos: () => new THREE.Vector3(-0.2, 0.65, 0).applyMatrix4(T.carriage.matrixWorld),
      improvement: true,
    },
    {
      id: 'c-saddle',
      slot: 'bottom-right',
      label: '<strong>Đế chữ V nhựa PTFE (Teflon)</strong>Bắt ốc lên hàm dưới HM226, chống bám nhựa',
      getWorldPos: () => new THREE.Vector3(K.B.vertex[0] + 0.8, K.B.vertex[1] + 0.8, 0).applyMatrix4(T.cLowerSaddle.matrixWorld),
      improvement: true,
    },
    {
      id: 'a-nut',
      slot: 'top-left',
      label: '<strong>Khung HM226 + Ốc (4–18 mm)</strong>Giữ 100% khung gốc, giá cải tạo ~40k',
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

function getSlotScreenCoords(slot, Wv, Hv) {
  const isMobile = Wv <= 900;
  const brandEl = document.querySelector('.brand-card');
  const brandBottom = brandEl ? brandEl.getBoundingClientRect().bottom + 8 : 88;
  const topY = isMobile ? Math.max(88, brandBottom) : 78;
  const bottomY = isMobile ? Hv - 224 : Hv - 208;
  const leftX = isMobile ? 10 : 18;
  const rightMargin = isMobile ? Wv - 158 : Wv - 510;

  switch (slot) {
    case 'top-left':
      return { x: leftX, y: topY };
    case 'top-right':
      return { x: Math.max(leftX + 154, rightMargin), y: isMobile ? 84 : 78 };
    case 'bottom-left':
      return { x: leftX, y: bottomY };
    case 'bottom-right':
    default:
      return { x: Math.max(leftX + 154, rightMargin), y: bottomY };
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

    const slotPos = getSlotScreenCoords(def.slot, Wv, Hv);
    box.style.left = `${slotPos.x}px`;
    box.style.top = `${slotPos.y}px`;

    const boxW = box.offsetWidth || 145;
    const boxH = box.offsetHeight || 42;
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
  if (id === 'a-carriage' || id === 'carriage') {
    const nextIdx = (state.notchIdx + 1) % NOTCHES.length;
    state.notchIdx = nextIdx;
    state.manualCarriage = false;
    state.D = NOTCHES[nextIdx].sampleD;
    syncDiameterUI(state.D);
    syncCarriageUI(nextIdx);
    updateAll();
    showToast(`🔧 Đã nhảy sang <strong>${NOTCHES[nextIdx].label}</strong> (Cành ${state.D.toFixed(1)} cm)`);
  } else if (id === 'a-peel' || id === 'b-pivot' || id === 'peel' || id === 'bhead') {
    setCameraPreset('blade');
    showToast('🔍 Cận cảnh lưỡi bào 28° & cữ giới hạn sâu 1.5 mm');
  } else if (id === 'b-vjaw' || id === 'c-saddle' || id === 'vjaw') {
    const samples = [2.0, 4.0, 6.0, 7.6];
    const nextD = samples[(samples.indexOf(state.D) + 1) % samples.length] || 5.5;
    state.D = nextD;
    syncDiameterUI(nextD);
    updateAll();
    showToast(`⚙️ Đế chữ V tự định tâm cành <strong>${nextD.toFixed(1)} cm</strong>`);
  } else if (id === 'orig-nut' || id === 'a-nut' || id === 'b-spring' || id === 'nut') {
    // Cycle strip width 6mm -> 10mm -> 13mm -> 17mm when tapping the wing nut!
    const widths = [6, 10, 13, 17];
    const nextW = widths[(widths.indexOf(state.stripMM) + 1) % widths.length] || 10;
    state.stripMM = nextW;
    syncStripWidthUI(nextW);
    updateAll();
    showToast(`🔩 Ốc cánh chuồn: Đã chỉnh độ rộng vỏ bóc = <strong>${nextW} mm</strong>`);
  } else {
    togglePeelPlay();
    showToast(state.playing ? '🔄 Đang xoay kéo khoanh & bóc vỏ cây...' : '⏸ Đã tạm dừng mô phỏng xoay');
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
    html: '<strong>Phương án A — Trượt sống lưng 4 khấc</strong>Con chạy ôm bên ngoài sống lưng hàm trên (không khoét rãnh vào lưỡi thép), khóa nhanh bằng chốt nhấn lò xo qua 4 khấc. Lưỡi bào ngang 28° + khe thoát phoi tự bóc vỏ trong 1 lần xoay.',
    angle: '28° (20°–35°)',
    depth: '1.5 mm (Cữ răng)',
    adapt: '4 khấc (1–8 cm)',
  },
  optionB: {
    html: '<strong>Phương án B — Hàm chữ V + Khớp tự lựa</strong>Hàm dưới đổi thành chữ V gắn 2 con lăn mini giảm ma sát và tự ép tâm mọi cỡ cành (1–8 cm) vào đúng cụm dao chữ U gắn trên khớp xoay tự lựa (±12°).',
    angle: '28° + Tự lựa ±12°',
    depth: '1.5 mm (Cữ 2 bên)',
    adapt: 'Tự động 100%',
  },
  optionC: {
    html: '<strong>★ Phương án C — Cải Tạo Thực Tế Tối Ưu (~40.000đ)</strong>Giữ nguyên 100% khung kéo HM226: hàm dưới bắt thêm <strong>đế chữ V nhựa PTFE (Teflon)</strong> không bám nhựa cây vào ốc cánh chuồn; hàm trên gắn <strong>con chạy kẹp lưỡi dao SK5 thay nhanh 15s</strong> có rãnh chỉnh cữ sâu 0.8–2.5 mm.',
    angle: '28° (Dao SK5)',
    depth: '0.8–2.5 mm (Vít M3)',
    adapt: 'Đế V PTFE + 4 khấc',
  },
};

function setMode(mode) {
  state.mode = mode;
  state.manualCarriage = false;

  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const info = MODE_INFO[mode];
  document.getElementById('mode-summary').innerHTML = info.html;
  document.getElementById('metric-angle').textContent = info.angle;
  document.getElementById('metric-depth').textContent = info.depth;
  document.getElementById('metric-width').textContent = `${state.stripMM} mm`;
  document.getElementById('metric-adapt').textContent = info.adapt;

  document.getElementById('group-option-a').classList.toggle('hidden', mode !== 'optionA' && mode !== 'optionC');
  document.getElementById('group-option-b').classList.toggle('hidden', mode !== 'optionB');

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
  if (state.peel >= TAU - 0.01) {
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
  document.getElementById('val-peel').textContent = `${Math.round(deg)}°`;
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

// Modals (Comparison & Practical Retrofit Blueprint)
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
  showToast('★ Đang hiển thị <strong>Phương án C — Cải tạo Thực tế Tối ưu trên kéo HM226</strong>');
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
    state.peel += dt * 1.65;
    if (state.peel >= TAU) {
      state.peel = TAU;
      state.playing = false;
      state.fall.active = true;
      state.fall.t = 0;
      syncPlayUI();
    }
    const deg = Math.round(THREE.MathUtils.radToDeg(state.peel));
    document.getElementById('slider-peel').value = deg;
    document.getElementById('val-peel').textContent = `${deg}°`;
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
