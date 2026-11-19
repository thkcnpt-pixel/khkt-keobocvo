import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============================================================================
   KHKT 3D SIMULATOR — CẢI TIẾN KÉO KHOANH VỎ CÂY HM226 (PHƯƠNG ÁN A & B)
   Scale: 1 Three.js unit = 1 cm (Overall tool length = 22 cm, blade = 10 cm)
   ============================================================================ */

// --- Global State ---
const state = {
  mode: 'optionA',       // 'original' | 'optionA' | 'optionB'
  diameter: 4.0,         // 1.0 .. 8.0 cm
  carriageT: 0.38,       // 0.0 .. 1.0 along upper spine (Option A)
  manualCarriage: false,
  peelAngle: 0,          // 0 .. 360 deg
  isPlaying: false,
  explode: 0,            // 0 .. 1
  showAnnotations: true,
  showBranch: true,
  autoRotate: false,
  activeCamera: 'overview',
};

// 4 Spine Notches for Option A (t along curve + diameter range labels)
const NOTCHES = [
  { t: 0.18, label: 'Khấc 1 (1–2 cm)', diamMin: 1.0, diamMax: 2.5 },
  { t: 0.40, label: 'Khấc 2 (3–4 cm)', diamMin: 2.5, diamMax: 4.5 },
  { t: 0.64, label: 'Khấc 3 (5–6 cm)', diamMin: 4.5, diamMax: 6.5 },
  { t: 0.86, label: 'Khấc 4 (7–8 cm)', diamMin: 6.5, diamMax: 8.1 },
];

const STRIP_WIDTH = 1.3; // 13 mm spacing between double parallel blades

// --- Scene, Camera, Renderer ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(11, 9.5, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 5;
controls.maxDistance = 55;
controls.target.set(1.5, 0, 0);

// --- Studio Lighting ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.15);
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.75);
keyLight.position.set(14, 22, 16);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 2;
keyLight.shadow.camera.far = 60;
const d = 18;
keyLight.shadow.camera.left = -d;
keyLight.shadow.camera.right = d;
keyLight.shadow.camera.top = d;
keyLight.shadow.camera.bottom = -d;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.75);
fillLight.position.set(-16, 8, -12);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xfef3c7, 0.55);
rimLight.position.set(5, -10, -14);
scene.add(rimLight);

// Subtle shadow-catching studio floor
const floorGeo = new THREE.PlaneGeometry(80, 80);
const floorMat = new THREE.ShadowMaterial({ opacity: 0.12 });
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -7.5;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// --- Procedural Textures for Realistic Bark & Wood ---
function createBarkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 420; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 18 + Math.random() * 80;
    const h = 2 + Math.random() * 6;
    const shade = Math.random() > 0.5 ? '#3e2723' : '#795548';
    ctx.fillStyle = shade;
    ctx.globalAlpha = 0.25 + Math.random() * 0.45;
    ctx.fillRect(x, y, w, h);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createWoodGrainTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e7d5a8';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#d4bc84';
  ctx.lineWidth = 2;
  for (let y = 0; y < 256; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(85, y + Math.sin(y) * 3, 170, y - Math.cos(y) * 3, 256, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createGrowthRingsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e5cfa0';
  ctx.fillRect(0, 0, 256, 256);
  const cx = 128, cy = 128;
  for (let r = 12; r < 124; r += 11) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = r > 110 ? '#5c4033' : '#b89860';
    ctx.lineWidth = r > 110 ? 6 : 2;
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

// --- Shared PBR Materials ---
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
  }),
  barkInner: new THREE.MeshStandardMaterial({
    color: 0x8d6e4c,
    roughness: 0.85,
    side: THREE.DoubleSide,
  }),
  cambium: new THREE.MeshStandardMaterial({
    map: createWoodGrainTexture(),
    roughness: 0.68,
    metalness: 0.02,
  }),
  woodCap: new THREE.MeshStandardMaterial({
    map: createGrowthRingsTexture(),
    roughness: 0.78,
  }),
  scoreLine: new THREE.MeshBasicMaterial({
    color: 0x26150c,
  }),
};

// --- Helper: Curved Spine Parametric Path for HM226 Jaw ---
// Returns a point (x, y) and tangent angle along the upper jaw spine (x: 1.5 -> 9.8 cm)
function getUpperJawSpinePoint(t) {
  // Arching crescent: starts near pivot, rises to y=3.6, curves down toward tip (9.8, 1.3)
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
  // Start at pivot neck
  shape.moveTo(-0.8, 0.75);
  shape.lineTo(1.4, 1.35);

  // Outer spine arc (with optional 4 milled notches for Option A)
  const steps = 64;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const pt = getUpperJawSpinePoint(t);
    let nx = 0, ny = 0;
    if (withSpineNotches) {
      for (const notch of NOTCHES) {
        if (Math.abs(t - notch.t) < 0.022) {
          // Indent inward toward center of blade
          const normAngle = pt.angle - Math.PI / 2;
          nx = Math.cos(normAngle) * 0.22;
          ny = Math.sin(normAngle) * 0.22;
        }
      }
    }
    shape.lineTo(pt.x + nx, pt.y + ny);
  }

  // Rounded tip
  shape.lineTo(10.05, 1.1);
  shape.lineTo(9.6, 0.75);

  // Inner concave serrated edge (teeth pointing toward branch!)
  const teethCount = 26;
  for (let i = teethCount; i >= 0; i--) {
    const t = i / teethCount;
    // Inner concave arc roughly parallel to spine, offset inward by ~1.15 cm
    const pt = getUpperJawSpinePoint(t);
    const normAngle = pt.angle - Math.PI / 2;
    const baseDepth = 1.15;
    const ix = pt.x + Math.cos(normAngle) * baseDepth;
    const iy = pt.y + Math.sin(normAngle) * baseDepth;

    // Add sawtooth protrusion every other step
    const tooth = (i % 2 === 1 && i > 1 && i < teethCount - 1) ? 0.18 : 0.0;
    shape.lineTo(ix + Math.cos(normAngle) * tooth, iy + Math.sin(normAngle) * tooth);
  }

  shape.lineTo(0.8, -0.35);
  shape.lineTo(-0.8, -0.55);
  shape.closePath();

  const extrudeSettings = {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.translate(0, 0, -0.08);
  return geo;
}

// --- Helper: Build Ergonomic Red Handle ---
function createHandleMesh(isUpper) {
  const group = new THREE.Group();
  const sign = isUpper ? 1 : -1;

  // Steel tang connecting pivot to plastic grip
  const tangCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, sign * 0.1, 0),
    new THREE.Vector3(-2.4, sign * 0.85, 0),
    new THREE.Vector3(-5.5, sign * 1.9, 0),
  ]);
  const tangGeo = new THREE.TubeGeometry(tangCurve, 18, 0.28, 10, false);
  const tang = new THREE.Mesh(tangGeo, materials.steel);
  tang.castShadow = true;
  group.add(tang);

  // Red rubber-coated handle grip (extends to x = -12 cm, total length 22 cm)
  const gripCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.6, sign * 0.92, 0),
    new THREE.Vector3(-5.8, sign * 2.0, 0),
    new THREE.Vector3(-9.2, sign * 2.55, 0),
    new THREE.Vector3(-12.0, sign * 2.15, 0),
  ]);
  const gripGeo = new THREE.TubeGeometry(gripCurve, 28, 0.56, 16, false);
  const grip = new THREE.Mesh(gripGeo, materials.redHandle);
  grip.castShadow = true;
  grip.receiveShadow = true;
  group.add(grip);

  // Rounded end cap
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.56, 16, 12), materials.redHandle);
  cap.position.set(-12.0, sign * 2.15, 0);
  group.add(cap);

  return group;
}

// --- Helper: Build Wing Nut + Bolt + Washers Assembly ---
function createWingNutAssembly(length = 2.1) {
  const group = new THREE.Group();

  // Threaded bolt shaft
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, length, 14),
    materials.brassBolt
  );
  shaft.rotation.x = Math.PI / 2;
  group.add(shaft);

  // Hex head on -Z end
  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.22, 6),
    materials.brassBolt
  );
  head.rotation.x = Math.PI / 2;
  head.position.z = -length / 2;
  group.add(head);

  // Spacer washers between parallel blades
  for (let i = -1; i <= 1; i++) {
    const washer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.14, 16),
      materials.darkSteel
    );
    washer.rotation.x = Math.PI / 2;
    washer.position.z = i * 0.32;
    group.add(washer);
  }

  // Wing nut (ốc cánh chuồn) on +Z end
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
  const geo = new THREE.TubeGeometry(curve, 100, 0.075, 8, false);
  const mesh = new THREE.Mesh(geo, materials.darkSteel);
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

// Handles attached to jaws
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
upperBladeFront.receiveShadow = true;

const upperBladeBack = new THREE.Mesh(upperBladeGeoNotched, materials.steel);
upperBladeBack.position.z = -STRIP_WIDTH / 2;
upperBladeBack.castShadow = true;
upperBladeBack.receiveShadow = true;

upperHMGroup.add(upperBladeFront, upperBladeBack);

// Wing nut adjuster on upper jaw
const upperWingNut = createWingNutAssembly(2.1);
upperWingNut.position.set(2.0, 1.35, 0);
upperHMGroup.add(upperWingNut);

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

// Outer U-channel carriage wrapping the spine (no slot in blade!)
const carriageTopBridge = new THREE.Mesh(
  new THREE.BoxGeometry(1.45, 0.34, STRIP_WIDTH + 0.65),
  materials.improvementAmber
);
carriageTopBridge.position.set(0, 0.25, 0);
carriageTopBridge.castShadow = true;
optionACarriage.add(carriageTopBridge);

// Side cheek plates hugging the outer surfaces of the two blades
const cheekGeo = new THREE.BoxGeometry(1.3, 1.25, 0.16);
const cheekFront = new THREE.Mesh(cheekGeo, materials.improvementAmber);
cheekFront.position.set(0, -0.35, (STRIP_WIDTH + 0.45) / 2);
const cheekBack = new THREE.Mesh(cheekGeo, materials.improvementAmber);
cheekBack.position.set(0, -0.35, -(STRIP_WIDTH + 0.45) / 2);
optionACarriage.add(cheekFront, cheekBack);

// Quick-release spring push pin (chốt nhấn lò xo gài nhanh)
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

// Inner blade holder arms reaching down between the 2 parallel blades
const peelBladeAssemblyA = new THREE.Group();
peelBladeAssemblyA.position.set(0, -0.95, 0); // Recessed 1.5mm behind serrated tips!

// Angled horizontal peeling blade (28° rake angle + chip evacuation slot behind it)
const peelBladeGeoA = new THREE.BoxGeometry(0.78, 0.14, STRIP_WIDTH - 0.14);
const peelBladeMeshA = new THREE.Mesh(peelBladeGeoA, materials.peelBladeTeal);
peelBladeMeshA.rotation.z = THREE.MathUtils.degToRad(28); // 28° peeling angle!
peelBladeMeshA.castShadow = true;
peelBladeAssemblyA.add(peelBladeMeshA);

// Chip evacuation deflector ramp (khe thoát phoi)
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

// V-shaped structural frame facing +Y
const vShape = new THREE.Shape();
vShape.moveTo(-0.8, 0.55);
vShape.lineTo(1.8, 0.35);
vShape.lineTo(5.2, -3.15); // Vertex of V
vShape.lineTo(9.2, -0.35); // Outer tip of V
vShape.lineTo(9.65, -0.95);
vShape.lineTo(5.2, -4.15); // Outer spine of V
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
vFrameMesh.receiveShadow = true;
optionBLowerV.add(vFrameMesh);

// 2 Mini Rollers (con lăn mini) mounted on the two faces of the V-jaw
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

  // Visual groove indicator so user sees the roller spinning!
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

// Clean structural upper arm reaching to x = 5.3 cm
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

// Self-aligning pivot joint (khớp xoay tự lựa ±12°)
const optionBPivotHead = new THREE.Group();
optionBPivotHead.position.set(5.45, 2.65, 0);
optionBUpperGroup.add(optionBPivotHead);

const pivotAxisB = new THREE.Mesh(
  new THREE.CylinderGeometry(0.26, 0.26, 1.9, 16),
  materials.brassBolt
);
pivotAxisB.rotation.x = Math.PI / 2;
optionBPivotHead.add(pivotAxisB);

// U-shaped cutter housing (cụm dao chữ U)
const uHousingTop = new THREE.Mesh(
  new THREE.BoxGeometry(2.1, 0.42, STRIP_WIDTH + 0.55),
  materials.improvementAmber
);
uHousingTop.position.set(0, -0.15, 0);
uHousingTop.castShadow = true;
optionBPivotHead.add(uHousingTop);

// 2 Parallel scoring / depth-limiter side blades (protrude 1.5 mm below peeling blade)
const sideBladeGeoB = new THREE.BoxGeometry(2.0, 0.85, 0.14);
const sideBladeFrontB = new THREE.Mesh(sideBladeGeoB, materials.steel);
sideBladeFrontB.position.set(0, -0.68, STRIP_WIDTH / 2);
const sideBladeBackB = new THREE.Mesh(sideBladeGeoB, materials.steel);
sideBladeBackB.position.set(0, -0.68, -STRIP_WIDTH / 2);
optionBPivotHead.add(sideBladeFrontB, sideBladeBackB);

// Horizontal 28° peeling blade inside the U-head + chip evacuation slot
const peelBladeMeshB = new THREE.Mesh(
  new THREE.BoxGeometry(0.86, 0.14, STRIP_WIDTH - 0.14),
  materials.peelBladeTeal
);
peelBladeMeshB.position.set(0.15, -0.92, 0); // 1.5 mm above side-blade tips!
peelBladeMeshB.rotation.z = THREE.MathUtils.degToRad(28);
peelBladeMeshB.castShadow = true;
optionBPivotHead.add(peelBladeMeshB);

// Wing nut on U-cutter for strip width adjustment
const wingNutB = createWingNutAssembly(2.05);
wingNutB.position.set(-0.55, -0.15, 0);
optionBPivotHead.add(wingNutB);

// ============================================================================
// BRANCH & DYNAMIC BARK PEELING VISUALIZATION
// ============================================================================
const branchRoot = new THREE.Group();
scene.add(branchRoot);

const branchSpinGroup = new THREE.Group();
branchRoot.add(branchSpinGroup);

let branchMeshes = {
  core: null,
  barkLeft: null,
  barkRight: null,
  barkStrip: null,
  scoreRingL: null,
  scoreRingR: null,
  curlRibbon: null,
};

function rebuildBranchGeometry() {
  // Dispose previous meshes
  while (branchSpinGroup.children.length > 0) {
    const child = branchSpinGroup.children[0];
    if (child.geometry) child.geometry.dispose();
    branchSpinGroup.remove(child);
  }
  if (branchMeshes.curlRibbon) {
    if (branchMeshes.curlRibbon.geometry) branchMeshes.curlRibbon.geometry.dispose();
    branchRoot.remove(branchMeshes.curlRibbon);
    branchMeshes.curlRibbon = null;
  }

  const R = state.diameter / 2;       // Outer bark radius (0.5 .. 4.0 cm)
  const barkThickness = Math.min(0.18, R * 0.16);
  const Rcore = Math.max(0.25, R - barkThickness);
  const totalLen = 11.0;
  const sideLen = (totalLen - STRIP_WIDTH) / 2;

  // Inner cambium/wood core cylinder (along Z)
  const coreGeo = new THREE.CylinderGeometry(Rcore, Rcore, totalLen, 44);
  coreGeo.rotateX(Math.PI / 2);
  const coreMats = [materials.cambium, materials.woodCap, materials.woodCap];
  const coreMesh = new THREE.Mesh(coreGeo, coreMats);
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  branchSpinGroup.add(coreMesh);

  // Left & right intact bark sleeves
  const sleeveGeoL = new THREE.CylinderGeometry(R, R, sideLen, 44, 1, false);
  sleeveGeoL.rotateX(Math.PI / 2);
  const barkLeft = new THREE.Mesh(sleeveGeoL, [materials.bark, materials.barkInner, materials.barkInner]);
  barkLeft.position.z = -(STRIP_WIDTH / 2 + sideLen / 2);
  barkLeft.castShadow = true;
  barkLeft.receiveShadow = true;
  branchSpinGroup.add(barkLeft);

  const barkRight = new THREE.Mesh(sleeveGeoL.clone(), [materials.bark, materials.barkInner, materials.barkInner]);
  barkRight.position.z = +(STRIP_WIDTH / 2 + sideLen / 2);
  barkRight.castShadow = true;
  barkRight.receiveShadow = true;
  branchSpinGroup.add(barkRight);

  // Middle bark strip (girdled zone)
  const peelRad = THREE.MathUtils.degToRad(state.peelAngle);
  if (state.mode === 'original') {
    // Original HM226: full bark strip stays stuck, only 2 dark scored rings grow!
    const stripGeo = new THREE.CylinderGeometry(R, R, STRIP_WIDTH, 44, 1, false);
    stripGeo.rotateX(Math.PI / 2);
    const barkStrip = new THREE.Mesh(stripGeo, materials.bark);
    barkStrip.castShadow = true;
    branchSpinGroup.add(barkStrip);

    if (peelRad > 0.02) {
      const torusGeo = new THREE.TorusGeometry(R + 0.02, 0.045, 8, 48, peelRad);
      const ringL = new THREE.Mesh(torusGeo, materials.scoreLine);
      ringL.position.z = -STRIP_WIDTH / 2;
      ringL.rotation.z = Math.PI / 2 - peelRad;
      const ringR = new THREE.Mesh(torusGeo.clone(), materials.scoreLine);
      ringR.position.z = +STRIP_WIDTH / 2;
      ringR.rotation.z = Math.PI / 2 - peelRad;
      branchSpinGroup.add(ringL, ringR);
    }
  } else {
    // Option A & B: bark strip is progressively removed!
    const remainingArc = Math.max(0, Math.PI * 2 - peelRad);
    if (remainingArc > 0.02) {
      const stripGeo = new THREE.CylinderGeometry(
        R,
        R,
        STRIP_WIDTH - 0.02,
        44,
        1,
        false,
        peelRad,
        remainingArc
      );
      stripGeo.rotateX(Math.PI / 2);
      // Align start angle so peeling occurs right at the top contact point (+Y)
      const barkStrip = new THREE.Mesh(stripGeo, materials.bark);
      barkStrip.rotation.z = -peelRad;
      barkStrip.castShadow = true;
      branchSpinGroup.add(barkStrip);
    }

    // Curling bark chip ribbon emerging from the peeling blade!
    if (peelRad > 0.05) {
      const ribbonLen = Math.min(3.8, peelRad * R * 0.45);
      const ribbonPoints = [];
      const segs = 20;
      for (let i = 0; i <= segs; i++) {
        const s = i / segs;
        const spiralAngle = s * Math.PI * 1.45;
        const spiralR = 0.65 - s * 0.25;
        const rx = -s * ribbonLen * 0.55 - Math.sin(spiralAngle) * spiralR * 0.45;
        const ry = R + 0.08 + s * 0.95 + (1 - Math.cos(spiralAngle)) * spiralR * 0.55;
        ribbonPoints.push(new THREE.Vector3(rx, ry, 0));
      }
      const ribbonCurve = new THREE.CatmullRomCurve3(ribbonPoints);
      const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 24, 0.14, 6, false);
      // Flatten tube along Z to look like a wide bark ribbon
      ribbonGeo.scale(1, 1, (STRIP_WIDTH * 0.42) / 0.14);
      const curlMesh = new THREE.Mesh(ribbonGeo, materials.bark);
      curlMesh.castShadow = true;
      branchRoot.add(curlMesh);
      branchMeshes.curlRibbon = curlMesh;
    }
  }
}

// ============================================================================
// KINEMATICS & MODE SYNCHRONIZATION
// ============================================================================
function updateKinematics() {
  const R = state.diameter / 2; // 0.5 .. 4.0 cm
  const isOriginal = state.mode === 'original';
  const isA = state.mode === 'optionA';
  const isB = state.mode === 'optionB';

  // Visibility of mode-specific assemblies
  upperHMGroup.visible = isOriginal || isA;
  lowerHMGroup.visible = isOriginal || isA;
  optionACarriage.visible = isA;
  optionBLowerV.visible = isB;
  optionBUpperGroup.visible = isB;

  // Swap notched vs smooth upper blade geometry
  const targetUpperGeo = isA ? upperBladeGeoNotched : upperBladeGeoSmooth;
  if (upperBladeFront.geometry !== targetUpperGeo) {
    upperBladeFront.geometry = targetUpperGeo;
    upperBladeBack.geometry = targetUpperGeo;
  }

  // Compute jaw opening angle & branch center X based on diameter
  let jawAngle = 0;
  let branchX = 5.3;

  if (isOriginal || isA) {
    // Larger branches sit slightly further out along the curved jaw & open the jaws wider
    const normD = (state.diameter - 1.0) / 7.0; // 0 .. 1
    branchX = 3.2 + normD * 3.4; // 3.2 cm (1cm twig) -> 6.6 cm (8cm branch)
    jawAngle = THREE.MathUtils.degToRad(-6 + normD * 31);

    // Auto-position carriage on Option A unless user manually dragged slider
    if (isA && !state.manualCarriage) {
      let notchIdx = 0;
      for (let i = 0; i < NOTCHES.length; i++) {
        if (state.diameter >= NOTCHES[i].diamMin && state.diameter < NOTCHES[i].diamMax) {
          notchIdx = i;
          break;
        }
      }
      state.carriageT = NOTCHES[notchIdx].t;
      syncCarriageUI(notchIdx);
    }

    // Position the Option A sliding carriage along the upper jaw spine curve
    const pt = getUpperJawSpinePoint(state.carriageT);
    optionACarriage.position.set(pt.x, pt.y, 0);
    optionACarriage.rotation.z = pt.angle;
  } else if (isB) {
    // Option B: V-jaw automatically centers branch at x ≈ 5.35 cm regardless of diameter!
    const normD = (state.diameter - 1.0) / 7.0;
    branchX = 5.35;
    jawAngle = THREE.MathUtils.degToRad(-8 + normD * 34);

    // Self-aligning pivot tilts slightly (±12°) to stay tangent to the top of the branch
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

  upperJawGroup.rotation.z = jawAngle;
  lowerJawGroup.rotation.z = -jawAngle;

  // Stretch return spring nicely with jaw opening
  springMesh.scale.y = 1 + Math.max(-0.25, jawAngle * 0.9);

  // Position branch
  branchRoot.visible = state.showBranch;
  branchRoot.position.set(branchX, 0, 0);

  // Spin rollers in Option B in sync with peelAngle
  const peelRad = THREE.MathUtils.degToRad(state.peelAngle);
  if (isB) {
    const rollerSpin = (peelRad * R) / 0.55;
    rollers.forEach((r) => {
      r.rotation.y = rollerSpin;
    });
  }

  // Exploded View Offsets (CAD disassembly)
  const ex = state.explode;
  upperBladeFront.position.z = STRIP_WIDTH / 2 + ex * 2.4;
  upperBladeBack.position.z = -STRIP_WIDTH / 2 - ex * 2.4;
  lowerBladeFront.position.z = STRIP_WIDTH / 2 + ex * 2.4;
  lowerBladeBack.position.z = -STRIP_WIDTH / 2 - ex * 2.4;
  upperWingNut.position.z = ex * 3.8;
  lowerWingNut.position.z = ex * 3.8;
  pivotAssembly.position.z = ex * 2.2;
  springMesh.position.x = -5.2 - ex * 1.8;

  // Explode Option A parts
  pushPinGroup.position.y = ex * 1.5;
  peelBladeAssemblyA.position.y = -0.95 - ex * 1.6;
  cheekFront.position.z = (STRIP_WIDTH + 0.45) / 2 + ex * 1.8;
  cheekBack.position.z = -(STRIP_WIDTH + 0.45) / 2 - ex * 1.8;

  // Explode Option B parts
  rollerLeft.position.z = ex * 2.0;
  rollerRight.position.z = -ex * 2.0;
  sideBladeFrontB.position.z = STRIP_WIDTH / 2 + ex * 2.2;
  sideBladeBackB.position.z = -STRIP_WIDTH / 2 - ex * 2.2;
  peelBladeMeshB.position.y = -0.92 - ex * 1.5;
  wingNutB.position.z = ex * 3.4;

  rebuildBranchGeometry();
}

// ============================================================================
// 3D ENGINEERING ANNOTATIONS (HTML OVERLAY PROJECTED FROM 3D SPACE)
// ============================================================================
const annotationsLayer = document.getElementById('annotations-layer');

const ANNOTATION_DEFS = {
  original: [
    { id: 'orig-blades', label: '<strong>Lưỡi răng cưa kép HM226</strong><br/>Chỉ rạch 2 đường song song', obj: () => upperBladeFront, offset: new THREE.Vector3(5.5, 3.2, 0.7), improvement: false },
    { id: 'orig-nut', label: '<strong>Ốc cánh chuồn & Long đền</strong><br/>Căn chỉnh độ rộng dải vỏ', obj: () => upperWingNut, offset: new THREE.Vector3(0, 0.5, 1.1), improvement: false },
  ],
  optionA: [
    { id: 'a-carriage', label: '<strong>Con chạy ôm sống lưng</strong><br/>Chốt nhấn lò xo khóa 4 khấc', obj: () => optionACarriage, offset: new THREE.Vector3(0, 1.35, 0), improvement: true },
    { id: 'a-peel', label: '<strong>Lưỡi bào ngang 28° + Khe thoát phoi</strong><br/>Tự bóc vỏ, cữ sâu 1.5 mm bảo vệ lõi gỗ', obj: () => peelBladeAssemblyA, offset: new THREE.Vector3(0, -0.35, 0.6), improvement: true },
    { id: 'a-nut', label: '<strong>Ốc cánh chuồn HM226</strong><br/>Giữ nguyên kết cấu chỉnh bề rộng', obj: () => upperWingNut, offset: new THREE.Vector3(0, 0.5, 1.1), improvement: false },
  ],
  optionB: [
    { id: 'b-pivot', label: '<strong>Cụm dao chữ U + Khớp tự lựa (±12°)</strong><br/>Lưỡi bào 28° luôn tiếp tuyến bề mặt vỏ', obj: () => optionBPivotHead, offset: new THREE.Vector3(0, 0.65, 0), improvement: true },
    { id: 'b-vjaw', label: '<strong>Hàm chữ V + 2 Con lăn mini</strong><br/>Tự định tâm cành 1–8 cm, giảm ma sát xoay', obj: () => rollerRight, offset: new THREE.Vector3(0.4, -0.7, 0.8), improvement: true },
    { id: 'b-spring', label: '<strong>Lò xo đẩy & Tay cầm công thái học</strong><br/>Thao tác nhẹ bằng 1 tay', obj: () => springMesh, offset: new THREE.Vector3(0, 0, 0.5), improvement: false },
  ],
};

let activePinElements = [];

function rebuildAnnotationPins() {
  annotationsLayer.innerHTML = '';
  activePinElements = [];
  const defs = ANNOTATION_DEFS[state.mode] || [];
  defs.forEach((def) => {
    const el = document.createElement('div');
    el.className = 'annotation-pin';
    el.innerHTML = `
      <span class="pin-dot ${def.improvement ? 'improvement' : ''}"></span>
      <span class="pin-label">${def.label}</span>
    `;
    annotationsLayer.appendChild(el);
    activePinElements.push({ el, def });
  });
}

const tempVec = new THREE.Vector3();
function updateAnnotationsPositions() {
  if (!state.showAnnotations) {
    annotationsLayer.style.display = 'none';
    return;
  }
  annotationsLayer.style.display = 'block';

  const width = window.innerWidth;
  const height = window.innerHeight;

  activePinElements.forEach(({ el, def }) => {
    const targetObj = def.obj();
    if (!targetObj) return;
    targetObj.updateWorldMatrix(true, false);
    tempVec.copy(def.offset).applyMatrix4(targetObj.matrixWorld);
    tempVec.project(camera);

    const isBehind = tempVec.z > 1;
    if (isBehind) {
      el.classList.add('hidden-pin');
      return;
    }
    el.classList.remove('hidden-pin');
    const x = (tempVec.x * 0.5 + 0.5) * width;
    const y = (-tempVec.y * 0.5 + 0.5) * height;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  });
}

// ============================================================================
// CAMERA PRESETS (Smooth Interpolation)
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

  let targetPos = new THREE.Vector3(11, 9.5, 22);
  let targetLook = new THREE.Vector3(1.5, 0, 0);

  if (preset === 'blade') {
    targetPos.set(9.5, 5.2, 9.5);
    targetLook.set(5.2, 1.4, 0);
  } else if (preset === 'section') {
    targetPos.set(5.2, 0.8, 17.5);
    targetLook.set(5.2, 0.2, 0);
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
// UI BINDINGS & MODE DESCRIPTIONS
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

function syncCarriageUI(notchIdx) {
  document.querySelectorAll('.notch-btn').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.notch) === notchIdx);
  });
  const sliderVal = Math.round(((state.carriageT - 0.14) / 0.76) * 100);
  document.getElementById('slider-carriage').value = THREE.MathUtils.clamp(sliderVal, 0, 100);
  document.getElementById('val-carriage').textContent =
    notchIdx >= 0 ? NOTCHES[notchIdx].label : `Tùy chỉnh (${Math.round(state.carriageT * 100)}%)`;
}

// Event Listeners
document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

document.getElementById('slider-diameter').addEventListener('input', (e) => {
  state.diameter = parseFloat(e.target.value);
  state.manualCarriage = false;
  document.getElementById('val-diameter').textContent = `${state.diameter.toFixed(1)} cm`;
  updateKinematics();
});

document.querySelectorAll('.notch-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.notch);
    state.manualCarriage = true;
    state.carriageT = NOTCHES[idx].t;
    syncCarriageUI(idx);
    updateKinematics();
  });
});

document.getElementById('slider-carriage').addEventListener('input', (e) => {
  const pct = parseFloat(e.target.value) / 100;
  state.manualCarriage = true;
  state.carriageT = 0.14 + pct * 0.76;
  syncCarriageUI(-1);
  updateKinematics();
});

const btnPlay = document.getElementById('btn-play-peel');
btnPlay.addEventListener('click', () => {
  if (state.peelAngle >= 360) state.peelAngle = 0;
  state.isPlaying = !state.isPlaying;
  btnPlay.textContent = state.isPlaying ? '⏸ Tạm dừng xoay' : '▶ Chạy mô phỏng xoay';
});

document.getElementById('btn-reset-peel').addEventListener('click', () => {
  state.isPlaying = false;
  state.peelAngle = 0;
  btnPlay.textContent = '▶ Chạy mô phỏng xoay';
  document.getElementById('slider-peel').value = 0;
  document.getElementById('val-peel').textContent = '0°';
  updateKinematics();
});

document.getElementById('slider-peel').addEventListener('input', (e) => {
  state.isPlaying = false;
  btnPlay.textContent = '▶ Chạy mô phỏng xoay';
  state.peelAngle = parseFloat(e.target.value);
  document.getElementById('val-peel').textContent = `${Math.round(state.peelAngle)}°`;
  updateKinematics();
});

document.getElementById('slider-explode').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  state.explode = val / 100;
  document.getElementById('val-explode').textContent = `${Math.round(val)}%`;
  updateKinematics();
});

document.getElementById('toggle-annotations').addEventListener('change', (e) => {
  state.showAnnotations = e.target.checked;
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

  // Peeling animation step
  if (state.isPlaying) {
    state.peelAngle += dt * 95; // ~3.8 seconds for a full 360° girdle
    if (state.peelAngle >= 360) {
      state.peelAngle = 360;
      state.isPlaying = false;
      btnPlay.textContent = '▶ Chạy lại mô phỏng';
    }
    document.getElementById('slider-peel').value = Math.round(state.peelAngle);
    document.getElementById('val-peel').textContent = `${Math.round(state.peelAngle)}°`;
    updateKinematics();
  }

  // Smooth camera preset transition
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
