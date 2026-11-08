import * as THREE from 'three';
import gsap from 'gsap';
import { h } from '../core/dom';

// Flat-shaded, low-poly props for the story slides. Colors follow the 2D palette.
export const P = {
  plat: 0xf7f9fc, floor: 0xe8edf4, desk: 0xd3dbe7, deskLeg: 0x9aa7bb, chair: 0x8fa1bb, crowd: 0xb7c2d3,
  skin: 0xf1c7a1, hair: 0x3a2e2a, hairL: 0x6b4a33, wall: 0xdde4ee, board: 0xffffff, screen: 0xcfe0ff,
  t1: 0x2856e6, t2: 0xb8218f, t3: 0xdc8300, ok: 0x0e9467, bad: 0xe0313b, ink: 0x141b2d, wood: 0xc9a27a,
};

const cache = new Map<number, THREE.MeshLambertMaterial>();
export function mat(c: number) {
  let m = cache.get(c);
  if (!m) { m = new THREE.MeshLambertMaterial({ color: c, flatShading: true }); cache.set(c, m); }
  return m;
}
/** A material that can be animated (not shared). */
export function own(c: number, o: { emissive?: number; transparent?: boolean } = {}) {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true, emissive: o.emissive ?? 0x000000, transparent: o.transparent ?? false });
}
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };

// ---------------------------------------------------------------- the stage

interface Label { el: HTMLElement; obj: THREE.Object3D; off: THREE.Vector3 }

/**
 * One WebGL renderer shared by every 3D story, created on first use and lent to whichever
 * story slide is on screen. Phones cap total canvas memory, so five renderers at full
 * density crashed the tab there.
 */
let shared: { r: THREE.WebGLRenderer; c: HTMLCanvasElement } | null | undefined;
let owner: Stage3D | null = null;
const touchDevice = () => matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 820;
/** Desktop keeps its original density; phones and tablets render at the size they actually display. */
function pixelRatio() {
  const dpr = devicePixelRatio || 1;
  if (!touchDevice()) return Math.min(2, dpr) * 1.25;
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  return Math.min(1.5, Math.max(0.6, k * dpr * 1.15));
}
function getShared() {
  if (shared !== undefined) return shared;
  try {
    const c = document.createElement('canvas');
    c.className = 'gl';
    const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.outputColorSpace = THREE.SRGBColorSpace;
    c.addEventListener('webglcontextlost', (e) => e.preventDefault());
    c.addEventListener('webglcontextrestored', () => owner?.renderOnce());
    shared = { r, c };
  } catch {
    shared = null;
  }
  return shared;
}

export class Stage3D {
  box: HTMLElement;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  private poster: HTMLCanvasElement;
  private labels: Label[] = [];
  private on = false;
  private release = 0;
  private v = new THREE.Vector3();

  constructor(private root: HTMLElement, public o: { x: number; y: number; w: number; h: number; cam: [number, number, number]; look: [number, number, number]; fov?: number }) {
    this.box = h('div', 'stage3d', '', root);
    this.box.style.cssText = `left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px`;
    this.poster = h('canvas', 'gl poster', '', this.box) as HTMLCanvasElement;
    this.poster.width = this.poster.height = 0;
    this.camera = new THREE.PerspectiveCamera(o.fov ?? 30, o.w / o.h, 0.1, 200);
    this.camera.position.set(...o.cam);
    this.camera.lookAt(new THREE.Vector3(...o.look));
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4d8, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(-6, 12, 8);
    this.scene.add(sun);
    addEventListener('resize', () => { if (owner === this) this.size(); });
  }

  add(...o: THREE.Object3D[]) { this.scene.add(...o); return this; }

  /** HTML label pinned to a 3D object; hidden until a timeline shows it. */
  label(html: string, obj: THREE.Object3D, off: [number, number, number] = [0, 0, 0], cls = '') {
    const el = h('div', `pin3 ${cls}`, html, this.root);
    gsap.set(el, { opacity: 0, xPercent: -50, yPercent: -100 });
    this.labels.push({ el, obj, off: new THREE.Vector3(...off) });
    this.place();
    return el;
  }

  private place() {
    this.scene.updateMatrixWorld();
    for (const l of this.labels) {
      l.obj.getWorldPosition(this.v).add(l.off).project(this.camera);
      gsap.set(l.el, { x: this.o.x + (this.v.x + 1) / 2 * this.o.w, y: this.o.y + (1 - this.v.y) / 2 * this.o.h });
    }
  }

  private size() {
    if (!shared) return;
    shared.r.setPixelRatio(pixelRatio());
    shared.r.setSize(this.o.w, this.o.h, false);
  }

  private loop = () => {
    if (!this.on || owner !== this || !shared) return;
    this.place();
    shared.r.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  };

  /** Render only while the slide is current; the shared canvas moves into this slide. */
  active(on: boolean) {
    if (on === this.on) return;
    this.on = on;
    clearTimeout(this.release);
    if (on) {
      const sh = getShared();
      if (!sh) return;
      if (owner && owner !== this) owner.on = false;
      owner = this;
      if (sh.c.parentElement !== this.box) this.box.appendChild(sh.c);
      this.size();
      this.poster.style.display = 'none';
      this.poster.width = this.poster.height = 0;
      requestAnimationFrame(this.loop);
    } else if (owner === this && shared) {
      // keep the last frame visible while the slide fades out, then free it
      const c = shared.c;
      this.poster.width = c.width;
      this.poster.height = c.height;
      this.poster.getContext('2d')?.drawImage(c, 0, 0);
      this.poster.style.display = '';
      owner = null;
      this.release = window.setTimeout(() => { if (!this.on) this.poster.width = this.poster.height = 0; }, 1500);
    }
  }

  renderOnce() { if (owner === this && shared) { this.place(); shared.r.render(this.scene, this.camera); } }
}

// ---------------------------------------------------------------- props

/** Diorama base: a slab with a slightly darker floor inset. */
export function platform(w: number, d: number, floor = P.floor) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, 0.4, d), mat(P.plat), 0, -0.2, 0));
  g.add(mesh(new THREE.BoxGeometry(w - 0.5, 0.02, d - 0.5), mat(floor), 0, 0.01, 0));
  return g;
}

export function blob(r = 0.45) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: 0x141b2d, transparent: true, opacity: 0.13, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.03;
  return m;
}

export interface Person { g: THREE.Group; body: THREE.Mesh; head: THREE.Mesh; armL: THREE.Object3D; armR: THREE.Object3D; mat: THREE.MeshLambertMaterial }

/** A low-poly person. `seated` puts the hips at chair height. */
export function person(color: number, o: { seated?: boolean; hair?: number; scale?: number; long?: boolean } = {}): Person {
  const g = new THREE.Group();
  const m = own(color);
  const hip = o.seated ? 0.55 : 0;
  if (!o.seated) {
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.62, 6), mat(0x3d4659), -0.12, 0.31, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.62, 6), mat(0x3d4659), 0.12, 0.31, 0));
  } else {
    g.add(mesh(new THREE.BoxGeometry(0.46, 0.18, 0.46), mat(0x3d4659), 0, hip + 0.05, 0.12));
  }
  const body = mesh(new THREE.CylinderGeometry(0.25, 0.33, 0.7, 7), m, 0, hip + 0.62 + (o.seated ? -0.05 : 0.33), 0);
  g.add(body);
  const top = body.position.y + 0.35;
  const head = mesh(new THREE.IcosahedronGeometry(0.25, 1), mat(P.skin), 0, top + 0.28, 0);
  g.add(head);
  const hair = mesh(new THREE.SphereGeometry(0.27, 8, 6, 0, Math.PI * 2, 0, o.long ? 1.9 : 1.35), mat(o.hair ?? P.hair), 0, top + 0.33, -0.02);
  g.add(hair);
  const arm = (side: number) => {
    const a = new THREE.Group();
    a.position.set(side * 0.33, top - 0.08, 0);
    a.add(mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.55, 5), m, 0, -0.26, 0));
    a.rotation.z = side * 0.18;
    g.add(a);
    return a;
  };
  const armL = arm(-1), armR = arm(1);
  g.add(blob(0.42));
  g.scale.setScalar(o.scale ?? 1);
  return { g, body, head, armL, armR, mat: m };
}

export function desk(w = 0.9, d = 0.55) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, 0.06, d), mat(P.desk), 0, 0.74, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(mesh(new THREE.BoxGeometry(0.05, 0.72, 0.05), mat(P.deskLeg), x * (w / 2 - 0.06), 0.36, z * (d / 2 - 0.06)));
  return g;
}

export function chair(color = P.chair) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.46, 0.06, 0.44), mat(color), 0, 0.46, 0));
  g.add(mesh(new THREE.BoxGeometry(0.46, 0.5, 0.06), mat(color), 0, 0.72, 0.21));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), mat(P.deskLeg), x * 0.19, 0.22, z * 0.18));
  return g;
}

/** Laptop with a glowing screen; `screen` is exposed to recolor it. */
export function laptop(color = P.screen) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.56, 0.03, 0.38), mat(0x8792a6), 0, 0.015, 0));
  const lid = new THREE.Group();
  lid.position.set(0, 0.03, -0.18);
  lid.rotation.x = -0.28;
  lid.add(mesh(new THREE.BoxGeometry(0.56, 0.36, 0.025), mat(0x6f7a8f), 0, 0.18, 0));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ color }));
  screen.position.set(0, 0.18, 0.014);
  lid.add(screen);
  g.add(lid);
  return { g, screen };
}

export function phone(color = P.screen) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.3, 0.025), mat(0x2b3245)));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.135, 0.26), new THREE.MeshBasicMaterial({ color }));
  screen.position.z = 0.014;
  g.add(screen);
  return { g, screen };
}

/** A whiteboard/sign on two legs, or wall-mounted when `legs` is false. */
export function board(w = 2.2, hh = 1.0, legs = true, color = P.board) {
  const g = new THREE.Group();
  const y = legs ? 1.35 : 0;
  g.add(mesh(new THREE.BoxGeometry(w + 0.1, hh + 0.1, 0.06), mat(0x6f7a8f), 0, y, -0.01));
  g.add(mesh(new THREE.BoxGeometry(w, hh, 0.07), mat(color), 0, y, 0));
  if (legs) for (const x of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.06, y, 0.06), mat(P.deskLeg), x * (w / 2 - 0.15), y / 2, 0));
  return g;
}

export function door(color: number) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.25, 2.3, 0.16), mat(0xc4ccda), 0, 1.15, 0));
  const panel = mesh(new THREE.BoxGeometry(1.0, 2.1, 0.08), own(color), 0, 1.05, 0.06);
  g.add(panel);
  g.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0xf0f2f6), 0.36, 1.05, 0.12));
  return { g, panel };
}

/** A turnstile gate: two posts and a bar. */
export function gate(color = P.ink) {
  const g = new THREE.Group();
  for (const x of [-0.55, 0.55]) g.add(mesh(new THREE.BoxGeometry(0.22, 1.05, 0.5), mat(0x9aa7bb), x, 0.52, 0));
  const bar = mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), own(color), 0, 0.85, 0);
  g.add(bar);
  return { g, bar };
}

/** Wall segment for room-like dioramas. */
export function wall(w: number, hh = 1.6, color = P.wall) {
  return mesh(new THREE.BoxGeometry(w, hh, 0.15), mat(color), 0, hh / 2, 0);
}

/** Pop a group in from nothing (timeline helper). */
export function grow(t: gsap.core.Timeline, o: THREE.Object3D, at: number, dur = 0.7, to = 1) {
  t.fromTo(o.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: to, y: to, z: to, duration: dur, ease: 'back.out(1.6)', immediateRender: false }, at);
}
export function hidden(...o: THREE.Object3D[]) { o.forEach((x) => x.scale.setScalar(0.001)); }

/** Show/hide an HTML pin. */
export function pinIn(t: gsap.core.Timeline, el: HTMLElement, at: number) {
  t.fromTo(el, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: false }, at);
}
export function pinOut(t: gsap.core.Timeline, el: HTMLElement, at: number) {
  t.to(el, { opacity: 0, duration: 0.3 }, at);
}

/** A thin colored mat lying on the ground (room floors, personal spots). */
export function rug(w: number, d: number, color = P.floor) {
  return mesh(new THREE.BoxGeometry(w, 0.03, d), mat(color), 0, 0.015, 0);
}

/** A database: three stacked discs. */
export function dbStack(color = 0x5b6b8a) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.36, 14), mat(i % 2 ? 0x7d8cab : color), 0, 0.22 + i * 0.42, 0));
  return g;
}

/** A small data cube that can travel between props. */
export function packet(color: number) {
  const m = own(color, { transparent: true });
  return new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), m);
}
