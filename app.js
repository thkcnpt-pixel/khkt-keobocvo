import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============================================================================
   KHKT 3D SIMULATOR — CẢI TIẾN KÉO KHOANH VỎ CÂY HM226 (PHƯƠNG ÁN A & B)
   Scale: 1 Three.js unit = 1 cm (Overall tool length = 22 cm, blade = 10 cm)
   Optimized for Zero Z-Fighting, SVG Leader-Line Callouts, & Direct 3D Touch
   ============================================================================ */

// --- Global State ---
const state = {
  mode: 'optionA',       // 'original' | 'optionA' | 'optionB'
  diameter: 4.0,         // 1.0 .. 8.0 cm
  carriageT: 0.40,       // 0.0 .. 1.0 along upper spine (Option A)
  notchIdx: 1,           // 0..3 or -1
  manualCarriage: false,
  peelAngle: 0,          // 0 .. 360 deg
  isPlaying: false,
  explode: 0,            // 0 .. 1
  showAnnotations: true,
  showBranch: true,
  autoRotate: false,
  activeCamera: 'overview',
};

// 4 Spine Notches for Option A
const NOTCHES = [
  { t: 0.18, label: 'Khấc 1 (1–2cm)', diamMin: 1.0, diamMax: 2.5, sampleDiam: 1.8 },
  { t: 0.40, label: 'Khấc 2 (3–4cm)', diamMin: 2.5, diamMax: 4.5, sampleDiam: 3.8 },
  { t: 0.64, label: 'Khấc 3 (5–6cm)', diamMin: 4.5, diamMax: 6.5, sampleDiam: 5.5 },
  { t: 0.86, label: 'Khấc 4 (7–8cm)', diamMin: 6.5, diamMax: 8.1, sampleDiam: 7.4 },
];

const STRIP_WIDTH = 1.3; // 13 mm spacing between double parallel blades

// --- Scene, Camera, Renderer ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.5,   // Higher near-plane ratio eliminates mobile depth-buffer Z-fighting!
  120
);

function getDefaultCameraPos() {
  const isMobile = window.innerWidth < 768;
  return isMobile
    ? new THREE.Vector3(10.5, 9.2, 26.5)
    : new THREE.Vector3(10.5, 8.8, 21.5);
}
camera.position.copy(getDefaultCameraPos());

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 6;
controls.maxDistance = 48;
controls.target.set(2.2, -0.3, 0);

// --- Studio Lighting ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.2);
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
keyLight.position.set(14, 22, 16);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 3;
keyLight.shadow.camera.far = 50;
const d = 16;
keyLight.shadow.camera.left = -d;
keyLight.shadow.camera.right = d;
keyLight.shadow.camera.top = d;
keyLight.shadow.camera.bottom = -d;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.75);
fillLight.position.set(-16, 8, -12);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xfef3c7, 0.5);
rimLight.position.set(5, -10, -14);
scene.add(rimLight);

// Subtle shadow-catching studio floor
const floorMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(70, 70),
  new THREE.ShadowMaterial({ opacity: 0.11 })
);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -7.5;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// --- Procedural Textures for Realistic Bark & Wood (Mipmapped, Non-Flickering) ---
function createBarkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 180; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = 14 + Math.random() * 55;
    const h = 2 + Math.random() * 4;
    ctx.fillStyle = Math.random() > 0.5 ? '#432c23' : '#745244';
    ctx.globalAlpha = 0.25 + Math.random() * 0.35;
    ctx.fillRect(x, y, w, h);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

function createWoodGrainTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ead8ad';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#d7c08e';
  ctx.lineWidth = 2;
  for (let y = 0; y < 256; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(85, y + 2, 170, y - 2, 256, y);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function createGrowthRingsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e8d3a5';
  ctx.fillRect(0, 0, 256, 256);
  const cx = 128, cy = 128;
  for (let r = 16; r < 122; r += 13) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = r > 108 ? '#5d4037' : '#c2a46e';
    ctx.lineWidth = r > 108 ? 6 : 2;
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

// --- Shared PBR Materials (with polygonOffset on bark to prevent ANY Z-fighting!) ---
const materials = {
  steel: new THREE.MeshStandardMaterial({
    color: 0xd4dbe3,
    metalness: 0.85,
    roughness: 0.28,
  }),
  darkSteel: new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.82,
    roughness: 0.36,
  }),
  brassBolt: new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.22,
  }),
  redHandle: new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.05,
    roughness: 0.65,
  }),
  improvementAmber: new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.55,
    roughness: 0.32,
  }),
  peelBladeTeal: new THREE.MeshStandardMaterial({
    color: 0x0f766e,
    metalness: 0.72,
    roughness: 0.22,
  }),
  rollerTeal: new THREE.MeshStandardMaterial({
    color: 0x0d9488,
    metalness: 0.35,
    roughness: 0.35,
  }),
  bark: new THREE.MeshStandardMaterial({
    map: createBarkTexture(),
    roughness: 0.92,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  }),
  barkCap: new THREE.MeshStandardMaterial({
    color: 0x6d4c3d,
    roughness: 0.9,
  }),
  cambium: new THREE.MeshStandardMaterial({
    map: createWoodGrainTexture(),
    roughness: 0.72,
    metalness: 0.02,
  }),
  woodCap: new THREE.MeshStandardMaterial({
    map: createGrowthRingsTexture(),
    roughness: 0.8,
  }),
  scoreLine: new THREE.MeshBasicMaterial({
    color: 0x26150c,
  }),
};

// --- Helper: Curved Spine Parametric Path for HM226 Jaw ---
function getUpperJawSpinePoint(t) {
  const p0 = new THREE.Vector2(1.4, 1.35);
  const p1 = new THREE.Vector2(4.4, 4.35);
  const p2 = new THREE.Vector2(8.0, 4.05);
  const p3 = new THREE.Vector2(9.9, 1.55);

  const u = 1 - t;
  const x = u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x;
  const y = u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y;

  const dx = 3*u*u*(p1.x - p0.x) + 6*u*t*(p2.x - p1.x) + 3*t*t*(p3.x - p2.x);
  const dy = 3*u*u*(p1.y - p0.y) + 6*u*t*(p2.y - p1.y) + 3*t*t*(p3.y - p2.y);
  const angle = Math.atan2(dy, dx);
  return { x, y, angle };
}

// --- Helper: Build a Curved HM226 Serrated Blade Geometry ---
function createSerratedBladeGeometry(withSpineNotches = false) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.8, 0.75);
  shape.lineTo(1.4, 1.35);

  const steps = 64;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const pt = getUpperJawSpinePoint(t);
    let nx = 0, ny = 0;
    if (withSpineNotches) {
      for (const notch of NOTCHES) {
        if (Math.abs(t - notch.t) < 0.022) {
          const normAngle = pt.angle - Math.PI / 2;
          nx = Math.cos(normAngle) * 0.22;
          ny = Math.sin(normAngle) * 0.22;
        }
      }
    }
    shape.lineTo(pt.x + nx, pt.y + ny);
  }

  shape.lineTo(10.05, 1.1);
  shape.lineTo(9.6, 0.75);

  const teethCount = 26;
  for (let i = teethCount; i >= 0; i--) {
    const t = i / teethCount;
    const pt = getUpperJawSpinePoint(t);
    const normAngle = pt.angle - Math.PI / 2;
    const baseDepth = 1.15;
    const ix = pt.x + Math.cos(normAngle) * baseDepth;
    const iy = pt.y + Math.sin(normAngle) * baseDepth;
    const tooth = (i % 2 === 1 && i > 1 && i < teethCount - 1) ? 0.18 : 0.0;
    shape.lineTo(ix + Math.cos(normAngle) * tooth, iy + Math.sin(normAngle) * tooth);
  }

  shape.lineTo(0.8, -0.35);
  shape.lineTo(-0.8, -0.55);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
  });
  geo.translate(0, 0, -0.08);
  return geo;
}

// --- Helper: Build Ergonomic Red Handle ---
function createHandleMesh(isUpper) {
  const group = new THREE.Group();
  const sign = isUpper ? 1 : -1;

  const tangCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, sign * 0.1, 0),
    new THREE.Vector3(-2.4, sign * 0.85, 0),
    new THREE.Vector3(-5.5, sign * 1.9, 0),
  ]);
  const tang = new THREE.Mesh(
    new THREE.TubeGeometry(tangCurve, 18, 0.28, 10, false),
    materials.steel
  );
  tang.castShadow = true;
  group.add(tang);

  const gripCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.6, sign * 0.92, 0),
    new THREE.Vector3(-5.8, sign * 2.0, 0),
    new THREE.Vector3(-9.2, sign * 2.55, 0),
    new THREE.Vector3(-12.0, sign * 2.15, 0),
  ]);
  const grip = new THREE.Mesh(
    new THREE.TubeGeometry(gripCurve, 28, 0.56, 16, false),
    materials.redHandle
  );
  grip.castShadow = true;
  grip.receiveShadow = true;
  group.add(grip);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.56, 16, 12), materials.redHandle);
  cap.position.set(-12.0, sign * 2.15, 0);
  group.add(cap);

  return group;
}

// --- Helper: Build Wing Nut + Bolt + Washers Assembly ---
function createWingNutAssembly(length = 2.1) {
  const group = new THREE.Group();

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, length, 14),
    materials.brassBolt
  );
  shaft.rotation.x = Math.PI / 2;
  group.add(shaft);

  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.22, 6),
    materials.brassBolt
  );
  head.rotation.x = Math.PI / 2;
  head.position.z = -length / 2;
  group.add(head);

  for (let i = -1; i <= 1; i++) {
    const washer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.14, 16),
      materials.darkSteel
    );
    washer.rotation.x = Math.PI / 2;
    washer.position.z = i * 0.32;
    group.add(washer);
  }

  const wingBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.26, 16),
    materials.brassBolt
  );
  wingBase.rotation.x = Math.PI / 2;
  wingBase.position.z = length / 2;
  group.add(wingBase);

  const wingGeo = new THREE.BoxGeometry(0.18, 0.65, 0.32);
  const wing1 = new THREE.Mesh(wingGeo, materials.brassBolt);
  wing1.position.set(0, 0.36, length / 2 + 0.08);
  wing1.rotation.x = 0.25;
  group.add(wing1);

  const wing2 = new THREE.Mesh(wingGeo, materials.brassBolt);
  wing2.position.set(0, -0.36, length / 2 + 0.08);
  wing2.rotation.x = -0.25;
  group.add(wing2);

  return group;
}

// --- Helper: Build Return Spring between Handles ---
function createReturnSpring() {
  const points = [];
  const turns = 7;
  const radius = 0.38;
  const height = 3.2;
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    const angle = t * turns * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      (t - 0.5) * height,
      Math.sin(angle) * radius
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 90, 0.075, 8, false),
    materials.darkSteel
  );
  mesh.castShadow = true;
  return mesh;
}

// ============================================================================
// BUILD MAIN TOOL HIERARCHY
// ============================================================================
const toolRoot = new THREE.Group();
scene.add(toolRoot);

// Central Pivot Bolt
const pivotAssembly = new THREE.Group();
const pivotPin = new THREE.Mesh(
  new THREE.CylinderGeometry(0.38, 0.38, 2.2, 20),
  materials.darkSteel
);
pivotPin.rotation.x = Math.PI / 2;
pivotAssembly.add(pivotPin);
const pivotCapFront = new THREE.Mesh(
  new THREE.CylinderGeometry(0.55, 0.55, 0.16, 6),
  materials.brassBolt
);
pivotCapFront.rotation.x = Math.PI / 2;
pivotCapFront.position.z = 1.12;
pivotAssembly.add(pivotCapFront);
toolRoot.add(pivotAssembly);

// Return Spring
const springMesh = createReturnSpring();
springMesh.position.set(-5.2, 0, 0);
toolRoot.add(springMesh);

// Upper & Lower Jaw Pivot Groups
const upperJawGroup = new THREE.Group();
const lowerJawGroup = new THREE.Group();
toolRoot.add(upperJawGroup);
toolRoot.add(lowerJawGroup);

const upperHandle = createHandleMesh(true);
const lowerHandle = createHandleMesh(false);
upperJawGroup.add(upperHandle);
lowerJawGroup.add(lowerHandle);

// --- 1. HM226 / Option A Upper Curved Double Blades ---
const upperHMGroup = new THREE.Group();
upperJawGroup.add(upperHMGroup);

const upperBladeGeoSmooth = createSerratedBladeGeometry(false);
const upperBladeGeoNotched = createSerratedBladeGeometry(true);

const upperBladeFront = new THREE.Mesh(upperBladeGeoNotched, materials.steel);
upperBladeFront.position.z = STRIP_WIDTH / 2;
upperBladeFront.castShadow = true;

const upperBladeBack = new THREE.Mesh(upperBladeGeoNotched, materials.steel);
upperBladeBack.position.z = -STRIP_WIDTH / 2;
upperBladeBack.castShadow = true;

const upperWingNut = createWingNutAssembly(2.1);
upperWingNut.position.set(2.0, 1.35, 0);
upperHMGroup.add(upperBladeFront, upperBladeBack, upperWingNut);

// --- 2. HM226 / Option A Lower Curved Double Blades ---
const lowerHMGroup = new THREE.Group();
lowerJawGroup.add(lowerHMGroup);

const lowerBladeFront = new THREE.Mesh(upperBladeGeoSmooth, materials.steel);
lowerBladeFront.scale.y = -1;
lowerBladeFront.position.z = STRIP_WIDTH / 2;
lowerBladeFront.castShadow = true;

const lowerBladeBack = new THREE.Mesh(upperBladeGeoSmooth, materials.steel);
lowerBladeBack.scale.y = -1;
lowerBladeBack.position.z = -STRIP_WIDTH / 2;
lowerBladeBack.castShadow = true;

const lowerWingNut = createWingNutAssembly(2.1);
lowerWingNut.position.set(2.0, -1.35, 0);
lowerHMGroup.add(lowerBladeFront, lowerBladeBack, lowerWingNut);

// --- 3. OPTION A: Spine Sliding Carriage + Quick-Release Pin + 28° Peeling Blade ---
const optionACarriage = new THREE.Group();
upperHMGroup.add(optionACarriage);

const carriageTopBridge = new THREE.Mesh(
  new THREE.BoxGeometry(1.45, 0.34, STRIP_WIDTH + 0.65),
  materials.improvementAmber
);
carriageTopBridge.position.set(0, 0.25, 0);
carriageTopBridge.castShadow = true;
optionACarriage.add(carriageTopBridge);

const cheekGeo = new THREE.BoxGeometry(1.3, 1.25, 0.16);
const cheekFront = new THREE.Mesh(cheekGeo, materials.improvementAmber);
cheekFront.position.set(0, -0.35, (STRIP_WIDTH + 0.45) / 2);
const cheekBack = new THREE.Mesh(cheekGeo, materials.improvementAmber);
cheekBack.position.set(0, -0.35, -(STRIP_WIDTH + 0.45) / 2);
optionACarriage.add(cheekFront, cheekBack);

const pushPinGroup = new THREE.Group();
const pinHousing = new THREE.Mesh(
  new THREE.CylinderGeometry(0.28, 0.28, 0.55, 16),
  materials.darkSteel
);
pinHousing.position.set(0, 0.65, 0);
const pinButton = new THREE.Mesh(
  new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16),
  materials.redHandle
);
pinButton.position.set(0, 0.98, 0);
pushPinGroup.add(pinHousing, pinButton);
optionACarriage.add(pushPinGroup);

const peelBladeAssemblyA = new THREE.Group();
peelBladeAssemblyA.position.set(0, -0.95, 0);

const peelBladeMeshA = new THREE.Mesh(
  new THREE.BoxGeometry(0.78, 0.14, STRIP_WIDTH - 0.14),
  materials.peelBladeTeal
);
peelBladeMeshA.rotation.z = THREE.MathUtils.degToRad(28);
peelBladeMeshA.castShadow = true;
peelBladeAssemblyA.add(peelBladeMeshA);

const deflectorA = new THREE.Mesh(
  new THREE.BoxGeometry(0.32, 0.1, STRIP_WIDTH - 0.2),
  materials.improvementAmber
);
deflectorA.position.set(-0.32, 0.26, 0);
deflectorA.rotation.z = THREE.MathUtils.degToRad(48);
peelBladeAssemblyA.add(deflectorA);

optionACarriage.add(peelBladeAssemblyA);

// --- 4. OPTION B: V-Shaped Support Jaw with 2 Mini Rollers (Lower Jaw) ---
const optionBLowerV = new THREE.Group();
lowerJawGroup.add(optionBLowerV);

const vShape = new THREE.Shape();
vShape.moveTo(-0.8, 0.55);
vShape.lineTo(1.8, 0.35);
vShape.lineTo(5.2, -3.15);
vShape.lineTo(9.2, -0.35);
vShape.lineTo(9.65, -0.95);
vShape.lineTo(5.2, -4.15);
vShape.lineTo(1.2, -0.75);
vShape.lineTo(-0.8, -0.65);
vShape.closePath();

const vExtrude = new THREE.ExtrudeGeometry(vShape, {
  depth: 1.5,
  bevelEnabled: true,
  bevelSize: 0.05,
  bevelThickness: 0.05,
});
vExtrude.translate(0, 0, -0.75);
const vFrameMesh = new THREE.Mesh(vExtrude, materials.improvementAmber);
vFrameMesh.castShadow = true;
optionBLowerV.add(vFrameMesh);

const rollers = [];
function createMiniRoller(x, y) {
  const rGroup = new THREE.Group();
  rGroup.position.set(x, y, 0);

  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 1.85, 22),
    materials.rollerTeal
  );
  wheel.rotation.x = Math.PI / 2;
  wheel.castShadow = true;

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.14, 1.88),
    materials.darkSteel
  );
  wheel.add(stripe);

  const axle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 2.15, 12),
    materials.brassBolt
  );
  axle.rotation.x = Math.PI / 2;

  rGroup.add(wheel, axle);
  rollers.push(wheel);
  return rGroup;
}

const rollerLeft = createMiniRoller(3.35, -1.15);
const rollerRight = createMiniRoller(7.15, -1.25);
optionBLowerV.add(rollerLeft, rollerRight);

// --- 5. OPTION B: Upper Carrier Arm + Self-Aligning U-Shaped Cutter Head ---
const optionBUpperGroup = new THREE.Group();
upperJawGroup.add(optionBUpperGroup);

const armShape = new THREE.Shape();
armShape.moveTo(-0.8, 0.65);
armShape.lineTo(1.6, 1.6);
armShape.lineTo(5.6, 3.6);
armShape.lineTo(6.1, 2.75);
armShape.lineTo(2.0, 0.75);
armShape.lineTo(-0.8, -0.55);
armShape.closePath();

const armGeo = new THREE.ExtrudeGeometry(armShape, {
  depth: 0.75,
  bevelEnabled: true,
  bevelSize: 0.04,
  bevelThickness: 0.04,
});
armGeo.translate(0, 0, -0.375);
const upperArmMeshB = new THREE.Mesh(armGeo, materials.steel);
upperArmMeshB.castShadow = true;
optionBUpperGroup.add(upperArmMeshB);

const optionBPivotHead = new THREE.Group();
optionBPivotHead.position.set(5.45, 2.65, 0);
optionBUpperGroup.add(optionBPivotHead);

const pivotAxisB = new THREE.Mesh(
  new THREE.CylinderGeometry(0.26, 0.26, 1.9, 16),
  materials.brassBolt
);
pivotAxisB.rotation.x = Math.PI / 2;
optionBPivotHead.add(pivotAxisB);

const uHousingTop = new THREE.Mesh(
  new THREE.BoxGeometry(2.1, 0.42, STRIP_WIDTH + 0.55),
  materials.improvementAmber
);
uHousingTop.position.set(0, -0.15, 0);
uHousingTop.castShadow = true;
optionBPivotHead.add(uHousingTop);

const sideBladeGeoB = new THREE.BoxGeometry(2.0, 0.85, 0.14);
const sideBladeFrontB = new THREE.Mesh(sideBladeGeoB, materials.steel);
sideBladeFrontB.position.set(0, -0.68, STRIP_WIDTH / 2);
const sideBladeBackB = new THREE.Mesh(sideBladeGeoB, materials.steel);
sideBladeBackB.position.set(0, -0.68, -STRIP_WIDTH / 2);
optionBPivotHead.add(sideBladeFrontB, sideBladeBackB);

const peelBladeMeshB = new THREE.Mesh(
  new THREE.BoxGeometry(0.86, 0.14, STRIP_WIDTH - 0.14),
  materials.peelBladeTeal
);
peelBladeMeshB.position.set(0.15, -0.92, 0);
peelBladeMeshB.rotation.z = THREE.MathUtils.degToRad(28);
peelBladeMeshB.castShadow = true;
optionBPivotHead.add(peelBladeMeshB);

const wingNutB = createWingNutAssembly(2.05);
wingNutB.position.set(-0.55, -0.15, 0);
optionBPivotHead.add(wingNutB);

// ============================================================================
// BRANCH & DYNAMIC BARK PEELING (ZERO Z-FIGHTING GEOMETRY!)
// ============================================================================
const branchRoot = new THREE.Group();
scene.add(branchRoot);

const branchSpinGroup = new THREE.Group();
branchRoot.add(branchSpinGroup);

let curlRibbonMesh = null;

function rebuildBranchGeometry() {
  while (branchSpinGroup.children.length > 0) {
    const child = branchSpinGroup.children[0];
    if (child.geometry) child.geometry.dispose();
    branchSpinGroup.remove(child);
  }
  if (curlRibbonMesh) {
    if (curlRibbonMesh.geometry) curlRibbonMesh.geometry.dispose();
    branchRoot.remove(curlRibbonMesh);
    curlRibbonMesh = null;
  }

  const R = state.diameter / 2; // 0.5 .. 4.0 cm
  // Clear radial separation between bark sleeve and inner wood core so they NEVER Z-fight!
  const barkThickness = Math.max(0.14, Math.min(0.24, R * 0.18));
  const Rcore = Math.max(0.22, R - barkThickness);
  const totalLen = 10.6;
  const sideLen = (totalLen - STRIP_WIDTH) / 2;

  // 1. Inner cambium/wood core cylinder: length is slightly longer (+0.08 cm) than total bark
  // so the end-caps of core and bark sleeves NEVER sit on the same Z-plane!
  const coreGeo = new THREE.CylinderGeometry(Rcore, Rcore, totalLen + 0.12, 36);
  coreGeo.rotateX(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, [materials.cambium, materials.woodCap, materials.woodCap]);
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  branchSpinGroup.add(coreMesh);

  // 2. Left & right intact bark sleeves (openEnded: false with distinct Z positions)
  const sleeveGeoL = new THREE.CylinderGeometry(R, R, sideLen - 0.04, 36, 1, false);
  sleeveGeoL.rotateX(Math.PI / 2);
  const barkLeft = new THREE.Mesh(sleeveGeoL, [materials.bark, materials.barkCap, materials.barkCap]);
  barkLeft.position.z = -(STRIP_WIDTH / 2 + sideLen / 2);
  barkLeft.castShadow = true;
  barkLeft.receiveShadow = true;
  branchSpinGroup.add(barkLeft);

  const sleeveGeoR = new THREE.CylinderGeometry(R, R, sideLen - 0.04, 36, 1, false);
  sleeveGeoR.rotateX(Math.PI / 2);
  const barkRight = new THREE.Mesh(sleeveGeoR, [materials.bark, materials.barkCap, materials.barkCap]);
  barkRight.position.z = +(STRIP_WIDTH / 2 + sideLen / 2);
  barkRight.castShadow = true;
  barkRight.receiveShadow = true;
  branchSpinGroup.add(barkRight);

  // 3. Middle bark strip (girdled zone): length slightly smaller (STRIP_WIDTH - 0.08)
  // so its caps never overlap the left/right sleeve caps!
  const peelRad = THREE.MathUtils.degToRad(state.peelAngle);
  if (state.mode === 'original') {
    const stripGeo = new THREE.CylinderGeometry(R, R, STRIP_WIDTH - 0.06, 36, 1, true);
    stripGeo.rotateX(Math.PI / 2);
    const barkStrip = new THREE.Mesh(stripGeo, materials.bark);
    branchSpinGroup.add(barkStrip);

    if (peelRad > 0.02) {
      const torusGeo = new THREE.TorusGeometry(R + 0.03, 0.045, 8, 40, peelRad);
      const ringL = new THREE.Mesh(torusGeo, materials.scoreLine);
      ringL.position.z = -STRIP_WIDTH / 2;
      ringL.rotation.z = Math.PI / 2 - peelRad;
      const ringR = new THREE.Mesh(torusGeo.clone(), materials.scoreLine);
      ringR.position.z = +STRIP_WIDTH / 2;
      ringR.rotation.z = Math.PI / 2 - peelRad;
      branchSpinGroup.add(ringL, ringR);
    }
  } else {
    const remainingArc = Math.max(0, Math.PI * 2 - peelRad);
    if (remainingArc > 0.03) {
      // openEnded = true eliminates cap flickering while peeling!
      const stripGeo = new THREE.CylinderGeometry(
        R,
        R,
        STRIP_WIDTH - 0.08,
        36,
        1,
        true,
        peelRad,
        remainingArc
      );
      stripGeo.rotateX(Math.PI / 2);
      const barkStrip = new THREE.Mesh(stripGeo, materials.bark);
      barkStrip.rotation.z = -peelRad;
      branchSpinGroup.add(barkStrip);
    }

    // Curling bark chip ribbon emerging from the peeling blade
    if (peelRad > 0.05) {
      const ribbonLen = Math.min(3.6, peelRad * R * 0.45);
      const ribbonPoints = [];
      const segs = 18;
      for (let i = 0; i <= segs; i++) {
        const s = i / segs;
        const spiralAngle = s * Math.PI * 1.4;
        const spiralR = 0.62 - s * 0.22;
        const rx = -s * ribbonLen * 0.55 - Math.sin(spiralAngle) * spiralR * 0.45;
        const ry = R + 0.12 + s * 0.95 + (1 - Math.cos(spiralAngle)) * spiralR * 0.55;
        ribbonPoints.push(new THREE.Vector3(rx, ry, 0));
      }
      const ribbonCurve = new THREE.CatmullRomCurve3(ribbonPoints);
      const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 20, 0.13, 6, false);
      ribbonGeo.scale(1, 1, (STRIP_WIDTH * 0.4) / 0.13);
      curlRibbonMesh = new THREE.Mesh(ribbonGeo, materials.bark);
      branchRoot.add(curlRibbonMesh);
    }
  }
}

// ============================================================================
// KINEMATICS & MODE SYNCHRONIZATION
// ============================================================================
function updateKinematics() {
  const R = state.diameter / 2;
  const isOriginal = state.mode === 'original';
  const isA = state.mode === 'optionA';
  const isB = state.mode === 'optionB';

  upperHMGroup.visible = isOriginal || isA;
  lowerHMGroup.visible = isOriginal || isA;
  optionACarriage.visible = isA;
  optionBLowerV.visible = isB;
  optionBUpperGroup.visible = isB;

  const targetUpperGeo = isA ? upperBladeGeoNotched : upperBladeGeoSmooth;
  if (upperBladeFront.geometry !== targetUpperGeo) {
    upperBladeFront.geometry = targetUpperGeo;
    upperBladeBack.geometry = targetUpperGeo;
  }

  let jawAngle = 0;
  let branchX = 5.3;

  if (isOriginal || isA) {
    const normD = (state.diameter - 1.0) / 7.0;
    branchX = 3.2 + normD * 3.4;
    jawAngle = THREE.MathUtils.degToRad(-6 + normD * 31);

    if (isA && !state.manualCarriage) {
      let nIdx = 0;
      for (let i = 0; i < NOTCHES.length; i++) {
        if (state.diameter >= NOTCHES[i].diamMin && state.diameter < NOTCHES[i].diamMax) {
          nIdx = i;
          break;
        }
      }
      state.notchIdx = nIdx;
      state.carriageT = NOTCHES[nIdx].t;
      syncCarriageUI(nIdx);
    }

    const pt = getUpperJawSpinePoint(state.carriageT);
    optionACarriage.position.set(pt.x, pt.y, 0);
    optionACarriage.rotation.z = pt.angle;
  } else if (isB) {
    const normD = (state.diameter - 1.0) / 7.0;
    branchX = 5.35;
    jawAngle = THREE.MathUtils.degToRad(-8 + normD * 34);

    const selfTiltRad = -jawAngle * 0.85;
    optionBPivotHead.rotation.z = THREE.MathUtils.clamp(
      selfTiltRad,
      THREE.MathUtils.degToRad(-12),
      THREE.MathUtils.degToRad(12)
    );

    const tiltDeg = THREE.MathUtils.radToDeg(optionBPivotHead.rotation.z).toFixed(1);
    const bDiamEl = document.getElementById('b-diam-text');
    const bTiltEl = document.getElementById('b-tilt-text');
    if (bDiamEl) bDiamEl.textContent = `${state.diameter.toFixed(1)} cm`;
    if (bTiltEl) bTiltEl.textContent = `${tiltDeg >= 0 ? '+' : ''}${tiltDeg}°`;
  }

  // Sync Quick Bar Badge
  const quickBadge = document.getElementById('quick-status-badge');
  if (quickBadge) {
    if (isOriginal) {
      quickBadge.textContent = 'Chỉ rạch 2 đường';
    } else if (isA) {
      quickBadge.textContent = state.notchIdx >= 0 ? NOTCHES[state.notchIdx].label : 'Tùy chỉnh';
    } else {
      const tiltDeg = THREE.MathUtils.radToDeg(optionBPivotHead.rotation.z).toFixed(1);
      quickBadge.textContent = `Tự lựa ${tiltDeg >= 0 ? '+' : ''}${tiltDeg}°`;
    }
  }

  upperJawGroup.rotation.z = jawAngle;
  lowerJawGroup.rotation.z = -jawAngle;
  springMesh.scale.y = 1 + Math.max(-0.25, jawAngle * 0.9);

  branchRoot.visible = state.showBranch;
  branchRoot.position.set(branchX, 0, 0);

  const peelRad = THREE.MathUtils.degToRad(state.peelAngle);
  if (isB) {
    const rollerSpin = (peelRad * R) / 0.55;
    rollers.forEach((r) => {
      r.rotation.y = rollerSpin;
    });
  }

  // Exploded View Offsets
  const ex = state.explode;
  upperBladeFront.position.z = STRIP_WIDTH / 2 + ex * 2.4;
  upperBladeBack.position.z = -STRIP_WIDTH / 2 - ex * 2.4;
  lowerBladeFront.position.z = STRIP_WIDTH / 2 + ex * 2.4;
  lowerBladeBack.position.z = -STRIP_WIDTH / 2 - ex * 2.4;
  upperWingNut.position.z = ex * 3.8;
  lowerWingNut.position.z = ex * 3.8;
  pivotAssembly.position.z = ex * 2.2;
  springMesh.position.x = -5.2 - ex * 1.8;

  pushPinGroup.position.y = ex * 1.5;
  peelBladeAssemblyA.position.y = -0.95 - ex * 1.6;
  cheekFront.position.z = (STRIP_WIDTH + 0.45) / 2 + ex * 1.8;
  cheekBack.position.z = -(STRIP_WIDTH + 0.45) / 2 - ex * 1.8;

  rollerLeft.position.z = ex * 2.0;
  rollerRight.position.z = -ex * 2.0;
  sideBladeFrontB.position.z = STRIP_WIDTH / 2 + ex * 2.2;
  sideBladeBackB.position.z = -STRIP_WIDTH / 2 - ex * 2.2;
  peelBladeMeshB.position.y = -0.92 - ex * 1.5;
  wingNutB.position.z = ex * 3.4;

  rebuildBranchGeometry();
}

// ============================================================================
// SVG LEADER-LINE ANNOTATIONS (PULLED OUT TO EMPTY MARGINS!)
// ============================================================================
const annotationsLayer = document.getElementById('annotations-layer');
const leaderSvg = document.getElementById('leader-svg');
const calloutsContainer = document.getElementById('callouts-container');

// slot: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
// Places the text box in the empty viewport perimeter and draws an SVG elbow line to the 3D part!
const ANNOTATION_DEFS = {
  original: [
    {
      id: 'orig-blades',
      slot: 'top-right',
      label: '<strong>Lưỡi răng cưa kép HM226</strong>Chỉ rạch 2 đường song song',
      obj: () => upperBladeFront,
      offset: new THREE.Vector3(6.2, 3.3, 0.2),
      improvement: false,
    },
    {
      id: 'orig-nut',
      slot: 'top-left',
      label: '<strong>Ốc cánh chuồn & Long đền</strong>Căn chỉnh bề rộng dải vỏ',
      obj: () => upperWingNut,
      offset: new THREE.Vector3(0, 0.3, 0.9),
      improvement: false,
    },
  ],
  optionA: [
    {
      id: 'a-carriage',
      slot: 'top-right',
      label: '<strong>Con chạy sống lưng (4 khấc)</strong>Chạm để nhảy khấc gài nhanh',
      obj: () => optionACarriage,
      offset: new THREE.Vector3(0, 0.85, 0),
      improvement: true,
    },
    {
      id: 'a-peel',
      slot: 'bottom-right',
      label: '<strong>Lưỡi bào 28° + Thoát phoi</strong>Tự bóc vỏ, cữ sâu 1.5 mm',
      obj: () => peelBladeAssemblyA,
      offset: new THREE.Vector3(0.2, -0.2, 0.4),
      improvement: true,
    },
    {
      id: 'a-nut',
      slot: 'top-left',
      label: '<strong>Ốc cánh chuồn HM226</strong>Giữ kết cấu chỉnh độ rộng',
      obj: () => upperWingNut,
      offset: new THREE.Vector3(0, 0.3, 0.9),
      improvement: false,
    },
  ],
  optionB: [
    {
      id: 'b-pivot',
      slot: 'top-right',
      label: '<strong>Cụm dao chữ U tự lựa (±12°)</strong>Lưỡi bào 28° luôn tiếp tuyến vỏ',
      obj: () => optionBPivotHead,
      offset: new THREE.Vector3(0.2, 0.2, 0),
      improvement: true,
    },
    {
      id: 'b-vjaw',
      slot: 'bottom-right',
      label: '<strong>Hàm chữ V + 2 Con lăn mini</strong>Tự định tâm cành 1–8 cm',
      obj: () => rollerRight,
      offset: new THREE.Vector3(0, -0.35, 0.5),
      improvement: true,
    },
    {
      id: 'b-spring',
      slot: 'top-left',
      label: '<strong>Lò xo đẩy & Tay cầm đỏ</strong>Bóp nhẹ bằng 1 tay',
      obj: () => springMesh,
      offset: new THREE.Vector3(0, 0.8, 0),
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
    // HTML Callout card in outer margin
    const box = document.createElement('div');
    box.className = `callout-box ${def.improvement ? 'improvement' : ''}`;
    box.innerHTML = def.label;
    box.addEventListener('click', () => handleAnnotationOrPartAction(def.id));
    calloutsContainer.appendChild(box);

    // SVG polyline (elbow leader line) + anchor dot on the 3D part
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

function getSlotScreenCoords(slot, W, H) {
  const isMobile = W <= 900;
  // Keep callout boxes in the empty space above and below the central 3D model!
  const topY = isMobile ? 70 : 80;
  const bottomY = isMobile ? H - 225 : H - 210;
  const leftX = isMobile ? 10 : 18;
  const rightMargin = isMobile ? W - 156 : W - 515;

  switch (slot) {
    case 'top-left':
      return { x: leftX, y: topY };
    case 'top-right':
      return { x: Math.max(leftX + 155, rightMargin), y: topY };
    case 'bottom-left':
      return { x: leftX, y: bottomY };
    case 'bottom-right':
    default:
      return { x: Math.max(leftX + 155, rightMargin), y: bottomY };
  }
}

const tempVec = new THREE.Vector3();
function updateAnnotationsPositions() {
  if (!state.showAnnotations) {
    annotationsLayer.style.display = 'none';
    return;
  }
  annotationsLayer.style.display = 'block';

  const W = window.innerWidth;
  const H = window.innerHeight;

  activeCallouts.forEach(({ box, polyline, dot, def }) => {
    const targetObj = def.obj();
    if (!targetObj) return;
    targetObj.updateWorldMatrix(true, false);
    tempVec.copy(def.offset).applyMatrix4(targetObj.matrixWorld);
    tempVec.project(camera);

    if (tempVec.z > 1) {
      box.classList.add('hidden-pin');
      polyline.style.display = 'none';
      dot.style.display = 'none';
      return;
    }

    box.classList.remove('hidden-pin');
    polyline.style.display = 'block';
    dot.style.display = 'block';

    // 3D anchor point in screen pixels
    const px = (tempVec.x * 0.5 + 0.5) * W;
    const py = (-tempVec.y * 0.5 + 0.5) * H;

    // Outer margin callout box coordinates
    const slotPos = getSlotScreenCoords(def.slot, W, H);
    box.style.left = `${slotPos.x}px`;
    box.style.top = `${slotPos.y}px`;

    const boxW = box.offsetWidth || 145;
    const boxH = box.offsetHeight || 42;

    // Connect from the nearest edge of the callout box via an angled CAD elbow line
    const isTop = def.slot.startsWith('top');
    const bx = slotPos.x + boxW * 0.5;
    const by = isTop ? slotPos.y + boxH : slotPos.y;
    const elbowY = isTop ? by + 16 : by - 16;

    polyline.setAttribute('points', `${px.toFixed(1)},${py.toFixed(1)} ${bx.toFixed(1)},${elbowY.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`);
    dot.setAttribute('cx', px.toFixed(1));
    dot.setAttribute('cy', py.toFixed(1));
  });
}

// ============================================================================
// DIRECT 3D RAYCAST INTERACTION (TAP ON 3D PARTS TO INTERACT!)
// ============================================================================
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };
let toastTimer = null;

function showPartToast(htmlText) {
  const toast = document.getElementById('part-toast');
  if (!toast) return;
  toast.innerHTML = htmlText;
  toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2800);
}

function pulseMaterialHighlight(meshOrGroup) {
  const targets = [];
  meshOrGroup.traverse((child) => {
    if (child.isMesh && child.material && child.material.emissive) {
      targets.push(child.material);
    }
  });
  targets.forEach((mat) => mat.emissive.setHex(0x334155));
  setTimeout(() => {
    targets.forEach((mat) => mat.emissive.setHex(0x000000));
  }, 350);
}

function handleAnnotationOrPartAction(actionId) {
  if (actionId === 'a-carriage') {
    // Cycle to next spine notch on Option A!
    const nextIdx = (state.notchIdx + 1) % NOTCHES.length;
    state.notchIdx = nextIdx;
    state.manualCarriage = true;
    state.carriageT = NOTCHES[nextIdx].t;
    state.diameter = NOTCHES[nextIdx].sampleDiam;
    syncDiameterUI(state.diameter);
    syncCarriageUI(nextIdx);
    updateKinematics();
    pulseMaterialHighlight(optionACarriage);
    showPartToast(`🔧 Đã gài <strong>${NOTCHES[nextIdx].label}</strong> (Cành ~${state.diameter} cm)`);
  } else if (actionId === 'a-peel' || actionId === 'b-pivot') {
    setCameraPreset('blade');
    togglePeelSimulation();
    showPartToast('🔄 Đang mô phỏng lưỡi bào ngang 28° tự động bóc vỏ');
  } else if (actionId === 'b-vjaw') {
    // Cycle branch size in Option B to demonstrate self-centering V-jaw
    const sampleDiams = [2.0, 4.0, 6.0, 7.8];
    const nextD = sampleDiams[(sampleDiams.indexOf(state.diameter) + 1) % sampleDiams.length] || 6.0;
    state.diameter = nextD;
    syncDiameterUI(nextD);
    updateKinematics();
    pulseMaterialHighlight(optionBLowerV);
    showPartToast(`⚙️ Hàm chữ V tự định tâm cành <strong>${nextD.toFixed(1)} cm</strong>`);
  } else {
    togglePeelSimulation();
    showPartToast('▶ Đang chạy mô phỏng xoay khoanh vỏ cây');
  }
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos.x = e.clientX;
  pointerDownPos.y = e.clientY;
});

renderer.domElement.addEventListener('pointerup', (e) => {
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dist > 7) return; // User was rotating/panning camera, not tapping

  const rect = renderer.domElement.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects([toolRoot, branchRoot], true);
  if (hits.length === 0) return;

  const hitObj = hits[0].object;

  // Check which mechanical assembly was tapped
  if (state.mode === 'optionA' && isDescendantOf(hitObj, optionACarriage)) {
    handleAnnotationOrPartAction('a-carriage');
  } else if (state.mode === 'optionB' && isDescendantOf(hitObj, optionBPivotHead)) {
    handleAnnotationOrPartAction('b-pivot');
  } else if (state.mode === 'optionB' && isDescendantOf(hitObj, optionBLowerV)) {
    handleAnnotationOrPartAction('b-vjaw');
  } else if (isDescendantOf(hitObj, branchRoot)) {
    togglePeelSimulation();
    showPartToast(state.isPlaying ? '🔄 Đang xoay khoanh & bóc vỏ cây...' : '⏸ Đã tạm dừng mô phỏng xoay');
  } else if (isDescendantOf(hitObj, upperWingNut) || isDescendantOf(hitObj, lowerWingNut)) {
    const targetEx = state.explode > 0.3 ? 0 : 0.65;
    setExplodeValue(targetEx * 100);
    showPartToast(targetEx > 0 ? '🔩 Đã tách lớp chi tiết bu-lông & ốc cánh chuồn' : '🔩 Đã đóng cụm chi tiết CAD');
  }
});

function isDescendantOf(obj, parent) {
  let curr = obj;
  while (curr) {
    if (curr === parent) return true;
    curr = curr.parent;
  }
  return false;
}

// ============================================================================
// CAMERA PRESETS
// ============================================================================
let cameraLerp = null;

function setCameraPreset(preset) {
  state.activeCamera = preset;
  document.querySelectorAll('.cam-btn').forEach((btn) => {
    if (btn.dataset.cam !== 'autorotate') {
      btn.classList.toggle('active', btn.dataset.cam === preset);
    }
  });

  if (preset === 'autorotate') {
    state.autoRotate = !state.autoRotate;
    controls.autoRotate = state.autoRotate;
    controls.autoRotateSpeed = 2.0;
    document.querySelector('.cam-btn[data-cam="autorotate"]').classList.toggle('active', state.autoRotate);
    return;
  }

  let targetPos = getDefaultCameraPos();
  let targetLook = new THREE.Vector3(2.2, -0.3, 0);

  if (preset === 'blade') {
    targetPos = new THREE.Vector3(9.2, 4.8, 10.5);
    targetLook = new THREE.Vector3(5.0, 1.1, 0);
  } else if (preset === 'section') {
    targetPos = new THREE.Vector3(5.2, 0.6, 18.5);
    targetLook = new THREE.Vector3(5.2, -0.2, 0);
  }

  cameraLerp = {
    startPos: camera.position.clone(),
    endPos: targetPos,
    startLook: controls.target.clone(),
    endLook: targetLook,
    t: 0,
  };
}

// ============================================================================
// UI BINDINGS & SYNCHRONIZATION
// ============================================================================
const MODE_INFO = {
  original: {
    html: '<strong>Mẫu gốc HM226 (Chưa cải tiến)</strong>Chỉ có 2 lưỡi răng cưa kép song song. Khi xoay chỉ rạch được 2 đường trên vỏ; người nông dân phải dùng tay hoặc dao khác cậy bóc dải vỏ.',
    angle: 'Không có',
    depth: 'Chỉnh bằng tay',
    peel: 'Thủ công (2 bước)',
    adapt: 'Cung hàm cố định',
  },
  optionA: {
    html: '<strong>Phương án A — Nâng cấp trực tiếp HM226</strong>Con chạy ôm bên ngoài sống lưng hàm trên (không khoét rãnh vào lưỡi thép), khóa nhanh bằng chốt nhấn lò xo qua 4 khấc. Lưỡi bào ngang 28° + khe thoát phoi tự bóc vỏ trong 1 lần xoay.',
    angle: '28° (20°–35°)',
    depth: '1.5 mm (Cữ răng)',
    peel: 'Tự động (1 bước)',
    adapt: '4 khấc (1–8 cm)',
  },
  optionB: {
    html: '<strong>Phương án B — Hàm chữ V tự thích nghi (Đột phá)</strong>Hàm dưới đổi thành chữ V gắn 2 con lăn mini giảm ma sát và tự ép tâm mọi cỡ cành (1–8 cm) vào đúng cụm dao chữ U gắn trên khớp xoay tự lựa (±12°). Không cần chỉnh tay.',
    angle: '28° + Tự lựa ±12°',
    depth: '1.5 mm (Cữ 2 bên)',
    peel: 'Tự động siêu mượt',
    adapt: 'Tự động 100%',
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
  document.getElementById('metric-peel').textContent = info.peel;
  document.getElementById('metric-adapt').textContent = info.adapt;

  document.getElementById('group-option-a').classList.toggle('hidden', mode !== 'optionA');
  document.getElementById('group-option-b').classList.toggle('hidden', mode !== 'optionB');

  rebuildAnnotationPins();
  updateKinematics();
}

function syncDiameterUI(dVal) {
  document.getElementById('slider-diameter').value = dVal;
  document.getElementById('val-diameter').textContent = `${dVal.toFixed(1)} cm`;
  const qSlider = document.getElementById('quick-slider-diameter');
  const qVal = document.getElementById('quick-val-diameter');
  if (qSlider) qSlider.value = dVal;
  if (qVal) qVal.textContent = `${dVal.toFixed(1)} cm`;
}

function syncCarriageUI(notchIdx) {
  document.querySelectorAll('.notch-btn').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.notch) === notchIdx);
  });
  const sliderVal = Math.round(((state.carriageT - 0.14) / 0.76) * 100);
  document.getElementById('slider-carriage').value = THREE.MathUtils.clamp(sliderVal, 0, 100);
  document.getElementById('val-carriage').textContent =
    notchIdx >= 0 ? NOTCHES[notchIdx].label : `Tùy chỉnh (${Math.round(state.carriageT * 100)}%)`;
}

function syncPlayButtonsUI() {
  const btnPlay = document.getElementById('btn-play-peel');
  const qIcon = document.getElementById('quick-play-icon');
  const qLabel = document.getElementById('quick-play-label');
  if (btnPlay) {
    btnPlay.textContent = state.isPlaying ? '⏸ Tạm dừng xoay' : '▶ Chạy mô phỏng xoay';
  }
  if (qIcon && qLabel) {
    qIcon.textContent = state.isPlaying ? '⏸' : '▶';
    qLabel.textContent = state.isPlaying ? 'Dừng' : 'Bóc vỏ';
  }
}

function togglePeelSimulation() {
  if (state.peelAngle >= 360) state.peelAngle = 0;
  state.isPlaying = !state.isPlaying;
  syncPlayButtonsUI();
}

function setExplodeValue(pctVal) {
  state.explode = pctVal / 100;
  document.getElementById('slider-explode').value = Math.round(pctVal);
  document.getElementById('val-explode').textContent = `${Math.round(pctVal)}%`;
  const qBtn = document.getElementById('btn-quick-explode');
  if (qBtn) qBtn.classList.toggle('active', state.explode > 0.05);
  updateKinematics();
}

// Event Listeners
document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

// Both Quick Bar diameter slider and Drawer diameter slider stay in sync
['slider-diameter', 'quick-slider-diameter'].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', (e) => {
    state.diameter = parseFloat(e.target.value);
    state.manualCarriage = false;
    syncDiameterUI(state.diameter);
    updateKinematics();
  });
});

document.querySelectorAll('.notch-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.notch);
    state.notchIdx = idx;
    state.manualCarriage = true;
    state.carriageT = NOTCHES[idx].t;
    syncCarriageUI(idx);
    updateKinematics();
  });
});

document.getElementById('slider-carriage').addEventListener('input', (e) => {
  const pct = parseFloat(e.target.value) / 100;
  state.notchIdx = -1;
  state.manualCarriage = true;
  state.carriageT = 0.14 + pct * 0.76;
  syncCarriageUI(-1);
  updateKinematics();
});

document.getElementById('btn-play-peel').addEventListener('click', togglePeelSimulation);
document.getElementById('btn-quick-play').addEventListener('click', togglePeelSimulation);

document.getElementById('btn-quick-explode').addEventListener('click', () => {
  const nextPct = state.explode > 0.1 ? 0 : 65;
  setExplodeValue(nextPct);
});

document.getElementById('btn-reset-peel').addEventListener('click', () => {
  state.isPlaying = false;
  state.peelAngle = 0;
  syncPlayButtonsUI();
  document.getElementById('slider-peel').value = 0;
  document.getElementById('val-peel').textContent = '0°';
  updateKinematics();
});

document.getElementById('slider-peel').addEventListener('input', (e) => {
  state.isPlaying = false;
  syncPlayButtonsUI();
  state.peelAngle = parseFloat(e.target.value);
  document.getElementById('val-peel').textContent = `${Math.round(state.peelAngle)}°`;
  updateKinematics();
});

document.getElementById('slider-explode').addEventListener('input', (e) => {
  setExplodeValue(parseFloat(e.target.value));
});

function setAnnotationsVisibility(visible) {
  state.showAnnotations = visible;
  document.getElementById('toggle-annotations').checked = visible;
  document.getElementById('btn-toggle-labels').classList.toggle('active', visible);
}

document.getElementById('toggle-annotations').addEventListener('change', (e) => {
  setAnnotationsVisibility(e.target.checked);
});

document.getElementById('btn-toggle-labels').addEventListener('click', () => {
  setAnnotationsVisibility(!state.showAnnotations);
});

document.getElementById('toggle-branch').addEventListener('change', (e) => {
  state.showBranch = e.target.checked;
  updateKinematics();
});

document.querySelectorAll('.cam-btn').forEach((btn) => {
  btn.addEventListener('click', () => setCameraPreset(btn.dataset.cam));
});

// Comparison Modal
const modal = document.getElementById('compare-modal');
document.getElementById('btn-compare').addEventListener('click', () => modal.classList.add('open'));
document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('open');
});

// Mobile Control Drawer
const controlPanel = document.getElementById('control-panel');
document.getElementById('btn-mobile-panel').addEventListener('click', () => {
  controlPanel.classList.toggle('mobile-open');
});
document.getElementById('btn-close-panel').addEventListener('click', () => {
  controlPanel.classList.remove('mobile-open');
});

// Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================================
// MAIN ANIMATION LOOP
// ============================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state.isPlaying) {
    state.peelAngle += dt * 95;
    if (state.peelAngle >= 360) {
      state.peelAngle = 360;
      state.isPlaying = false;
      syncPlayButtonsUI();
    }
    document.getElementById('slider-peel').value = Math.round(state.peelAngle);
    document.getElementById('val-peel').textContent = `${Math.round(state.peelAngle)}°`;
    updateKinematics();
  }

  if (cameraLerp) {
    cameraLerp.t = Math.min(1, cameraLerp.t + dt * 2.8);
    const ease = 1 - Math.pow(1 - cameraLerp.t, 3);
    camera.position.lerpVectors(cameraLerp.startPos, cameraLerp.endPos, ease);
    controls.target.lerpVectors(cameraLerp.startLook, cameraLerp.endLook, ease);
    if (cameraLerp.t >= 1) cameraLerp = null;
  }

  controls.update();
  renderer.render(scene, camera);
  updateAnnotationsPositions();
}

// Initialize
setMode('optionA');
animate();
