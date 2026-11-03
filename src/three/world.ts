import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

export const PAPER = 0xf3f5f8;
export const SPACING = 170;

/** Each scene lives at its own spot; the talk travels leftwards (RTL). */
export function anchor(i: number) {
  return new THREE.Vector3(-i * SPACING, 0, 0);
}

export interface Shot {
  pos: [number, number, number];   // camera position, relative to anchor
  look: [number, number, number];  // target, relative to anchor
  shift?: number;                  // horizontal screen shift in rem (+ = content moves left)
  fov?: number;
  zoom?: number;                   // pulls the camera back along its view line (default 1.35)
}

type FrameFn = (t: number, dt: number) => void;

export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  sun: THREE.DirectionalLight;
  rig = { px: 0, py: 30, pz: 60, tx: 0, ty: 0, tz: 0, shift: 0, fov: 34 };
  private frames = new Set<FrameFn>();
  private clock = new THREE.Clock();
  private elapsed = 0;
  capture = new URLSearchParams(location.search).has('capture');
  lowQuality = false;
  private slowFrames = 0;
  private fastFrames = 0;
  private motes!: THREE.InstancedMesh;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: this.capture });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.5, 900);

    this.scene.background = new THREE.Color(PAPER);
    this.scene.fog = new THREE.Fog(PAPER, 130, 300);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d2de, 1.1));

    this.sun = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = this.sun.shadow.camera;
    s.left = -46; s.right = 46; s.top = 46; s.bottom = -46; s.near = 1; s.far = 200;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    this.sun.shadow.radius = 6;
    this.scene.add(this.sun, this.sun.target);

    this.buildFloor();
    this.buildMotes();

    addEventListener('resize', () => this.resize());
    this.resize();
    addEventListener('keydown', (e) => {
      if (e.key === 'q' || e.key === 'Q') this.setLow(!this.lowQuality);
    });
  }

  private buildFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 600),
      new THREE.MeshStandardMaterial({ color: 0xe7ecf1, roughness: 0.95, metalness: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(-700, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(4000, 1000, 0xcfd7e1, 0xd9e0e8);
    grid.position.set(-700, 0.01, 0);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    this.scene.add(grid);
  }

  private buildMotes() {
    const n = 420;
    const geo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const mat = new THREE.MeshStandardMaterial({ color: 0xb8c3d1, roughness: 0.6 });
    this.motes = new THREE.InstancedMesh(geo, mat, n);
    const m = new THREE.Matrix4();
    const seeds: number[] = [];
    for (let i = 0; i < n; i++) {
      seeds.push(Math.random() * -2800 + 100, 8 + Math.random() * 40, -70 + Math.random() * 60, Math.random() * 6.28);
    }
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const one = new THREE.Vector3(1, 1, 1);
    this.onFrame((t) => {
      for (let i = 0; i < n; i++) {
        const k = i * 4;
        p.set(seeds[k], seeds[k + 1] + Math.sin(t * 0.3 + seeds[k + 3]) * 1.5, seeds[k + 2]);
        e.set(t * 0.2 + seeds[k + 3], t * 0.15, 0);
        q.setFromEuler(e);
        m.compose(p, q, one);
        this.motes.setMatrixAt(i, m);
      }
      this.motes.instanceMatrix.needsUpdate = true;
    });
    this.scene.add(this.motes);
  }

  setLow(low: boolean) {
    this.lowQuality = low;
    this.renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.type = low ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    this.resize();
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** px per rem of the 1920×1080 design stage */
  get rem() {
    return Math.min(innerWidth / 192, innerHeight / 108);
  }

  onFrame(fn: FrameFn) {
    this.frames.add(fn);
    return () => this.frames.delete(fn);
  }

  fly(base: THREE.Vector3, shot: Shot, dur = 2.2) {
    gsap.killTweensOf(this.rig);
    const z = shot.zoom ?? 1.35;
    const pos = shot.pos.map((p, i) => shot.look[i] + (p - shot.look[i]) * z);
    const to = {
      px: base.x + pos[0], py: base.y + pos[1], pz: base.z + pos[2],
      tx: base.x + shot.look[0], ty: base.y + shot.look[1], tz: base.z + shot.look[2],
      shift: shot.shift ?? 0, fov: shot.fov ?? 34,
    };
    if (dur <= 0) Object.assign(this.rig, to);
    else gsap.to(this.rig, { ...to, duration: dur, ease: 'power3.inOut' });
  }

  private applyRig() {
    const r = this.rig;
    const w = innerWidth, h = innerHeight;
    const stageH = 108 * this.rem;
    // lock the vertical framing to the 16:9 stage on tall windows
    const fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(r.fov) / 2) * h / stageH));
    if (Math.abs(this.camera.fov - fov) > 1e-3) {
      this.camera.fov = fov;
    }
    this.camera.position.set(r.px, r.py, r.pz);
    this.camera.lookAt(r.tx, r.ty, r.tz);
    this.camera.setViewOffset(w, h, r.shift * this.rem, 0, w, h);
    this.camera.updateProjectionMatrix();

    this.sun.position.set(r.tx + 26, 60, r.tz + 34);
    this.sun.target.position.set(r.tx, 0, r.tz);
  }

  /** world point → stage rem coordinates */
  project(v: THREE.Vector3) {
    const p = v.clone().project(this.camera);
    const w = innerWidth, h = innerHeight, rem = this.rem;
    const sx = (p.x * 0.5 + 0.5) * w, sy = (-p.y * 0.5 + 0.5) * h;
    const ox = (w - 192 * rem) / 2, oy = (h - 108 * rem) / 2;
    return { x: (sx - ox) / rem, y: (sy - oy) / rem, behind: p.z > 1 };
  }

  warm() {
    this.applyRig();
    this.renderer.compile(this.scene, this.camera);
  }

  start() {
    const loop = () => {
      const dt = Math.min(this.clock.getDelta(), 0.1);
      this.elapsed += dt;
      for (const f of this.frames) f(this.elapsed, dt);
      this.applyRig();
      this.renderer.render(this.scene, this.camera);
      this.watchQuality(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private watchQuality(dt: number) {
    if (this.capture || this.lowQuality || document.hidden || dt > 0.2) return;
    if (dt > 1 / 28) this.slowFrames++;
    else this.fastFrames++;
    if (this.slowFrames + this.fastFrames >= 180) {
      if (this.slowFrames > 110) this.setLow(true);
      this.slowFrames = this.fastFrames = 0;
    }
  }
}
