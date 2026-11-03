import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';

export const C = {
  ink: 0x13203a,
  inkSoft: 0x46526d,
  a: 0x2457d6,
  b: 0xc2185b,
  c: 0xd08a00,
  ok: 0x0c8f70,
  fault: 0xd7263d,
  slab: 0xffffff,
  steel: 0xb9c4d2,
  ghost: 0x9fb0c6,
  zombie: 0x8a93a3,
};

export function mat(color: number, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: 0.38, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.25, ...o,
  });
}

export function shadows(o: THREE.Object3D, cast = true, receive = true) {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) { c.castShadow = cast; c.receiveShadow = receive; }
  });
  return o;
}

/** Fade every material under an object. Materials are made transparent on first use. */
export function fade(o: THREE.Object3D, opacity: number, duration = 0.6) {
  o.traverse((c) => {
    const m = (c as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    for (const mm of Array.isArray(m) ? m : [m]) {
      if (mm.userData.baseOpacity === undefined) mm.userData.baseOpacity = mm.opacity;
      mm.transparent = true;
      const target = opacity * mm.userData.baseOpacity;
      if (duration <= 0) mm.opacity = target;
      else gsap.to(mm, { opacity: target, duration, overwrite: true });
    }
  });
}

// ---------------------------------------------------------------- text textures

const FONT = "'Estedad Variable', sans-serif";
const MONO = "'JetBrains Mono Variable', monospace";

export interface TextOpts {
  w?: number; h?: number; size?: number; color?: string; bg?: string | null;
  weight?: number; mono?: boolean; radius?: number; stroke?: string;
}

export function drawText(canvas: HTMLCanvasElement, text: string, o: TextOpts = {}) {
  const w = o.w ?? 512, h = o.h ?? 256;
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d')!;
  g.clearRect(0, 0, w, h);
  if (o.bg) {
    g.fillStyle = o.bg;
    const r = o.radius ?? 28;
    g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, r); g.fill();
    if (o.stroke) { g.lineWidth = 8; g.strokeStyle = o.stroke; g.stroke(); }
  }
  g.fillStyle = o.color ?? '#13203a';
  g.font = `${o.weight ?? 760} ${o.size ?? 120}px ${o.mono ? MONO : FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.direction = o.mono ? 'ltr' : 'rtl';
  const lines = text.split('\n');
  const lh = (o.size ?? 120) * 1.25;
  lines.forEach((ln, i) => g.fillText(ln, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lh + (o.size ?? 120) * 0.06));
}

export function textTexture(text: string, o: TextOpts = {}) {
  const cv = document.createElement('canvas');
  drawText(cv, text, o);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** A flat label that always faces the camera. */
export function label(text: string, o: TextOpts & { scale?: number } = {}) {
  const tex = textTexture(text, o);
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const s = new THREE.Sprite(m);
  const sc = o.scale ?? 4;
  s.scale.set(sc * (o.w ?? 512) / (o.h ?? 256), sc, 1);
  s.userData.set = (t: string, oo: TextOpts = {}) => {
    drawText(tex.image as HTMLCanvasElement, t, { ...o, ...oo });
    tex.needsUpdate = true;
  };
  return s as THREE.Sprite & { userData: { set: (t: string, o?: TextOpts) => void } };
}

// ---------------------------------------------------------------- the row slab (protagonist)

export interface Slab {
  group: THREE.Group;
  body: THREE.Mesh;
  face: THREE.Mesh;
  setText: (t: string, color?: string) => void;
  tint: (color: number, dur?: number) => void;
}

export function slab(w = 8, h = 1.6, d = 5, text = '', o: TextOpts = {}): Slab {
  const group = new THREE.Group();
  const bodyMat = mat(C.slab, { roughness: 0.3, clearcoat: 0.9 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(h, d) * 0.22), bodyMat);
  body.position.y = h / 2;
  group.add(body);

  const cv = document.createElement('canvas');
  const opts: TextOpts = { w: 512, h: Math.round(512 * d / w), size: 150, ...o };
  drawText(cv, text, opts);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.9, d * 0.86),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })
  );
  face.rotation.x = -Math.PI / 2;
  face.position.y = h + 0.02;
  group.add(face);
  shadows(body);

  return {
    group, body, face,
    setText(t, color) {
      drawText(cv, t, { ...opts, color: color ?? opts.color });
      tex.needsUpdate = true;
    },
    tint(color, dur = 0.5) {
      const c = new THREE.Color(color);
      gsap.to(bodyMat.color, { r: c.r, g: c.g, b: c.b, duration: dur });
    },
  };
}

// ---------------------------------------------------------------- users / workers

export interface Actor {
  group: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  ring: THREE.Mesh;
  setColor: (c: number, dur?: number) => void;
}

export function actor(color: number, scale = 1): Actor {
  const group = new THREE.Group();
  const m = mat(color, { roughness: 0.32 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.15, 2.2, 8, 24), m);
  body.position.y = 2.3;
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 20), mat(0xffffff, { roughness: 0.25, clearcoat: 1 }));
  head.position.y = 5.1;
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), m);
  visor.rotation.x = Math.PI / 2;
  visor.position.set(0, 5.15, 0.5);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.12, 10, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  group.add(body, head, visor, ring);
  group.scale.setScalar(scale);
  shadows(body); shadows(head);
  return {
    group, body, head, ring,
    setColor(c, dur = 0.5) {
      const col = new THREE.Color(c);
      gsap.to(m.color, { r: col.r, g: col.g, b: col.b, duration: dur });
      gsap.to((ring.material as THREE.MeshBasicMaterial).color, { r: col.r, g: col.g, b: col.b, duration: dur });
    },
  };
}

// ---------------------------------------------------------------- beams (reads / writes / waits)

export interface Beam {
  mesh: THREE.Mesh;
  set: (a: THREE.Vector3, b: THREE.Vector3, lift?: number) => void;
  grow: (to: number, dur?: number) => gsap.core.Tween;
  setColor: (c: number) => void;
  state: { p: number };
}

export function beam(color: number, radius = 0.18): Beam {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m);
  const state = { p: 0 };
  let curve: THREE.QuadraticBezierCurve3 | null = null;
  const rebuild = () => {
    if (!curve) return;
    mesh.geometry.dispose();
    const p = Math.max(0.001, state.p);
    const pts = curve.getPoints(40).slice(0, Math.max(2, Math.ceil(41 * p)));
    mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, radius, 8, false);
    mesh.visible = state.p > 0.002;
  };
  mesh.visible = false;
  return {
    mesh, state,
    set(a, b, lift = 4) {
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.y += lift;
      curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
      rebuild();
    },
    grow(to, dur = 0.8) {
      return gsap.to(state, { p: to, duration: dur, ease: 'power2.inOut', onUpdate: rebuild });
    },
    setColor(c) { m.color.set(c); },
  };
}

// ---------------------------------------------------------------- burst

export function burst(parent: THREE.Object3D, at: THREE.Vector3, color: number, n = 26) {
  const geo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
  const m = new THREE.MeshStandardMaterial({ color, transparent: true });
  for (let i = 0; i < n; i++) {
    const c = new THREE.Mesh(geo, m);
    c.position.copy(at);
    parent.add(c);
    const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 + 0.2, Math.random() - 0.5).normalize();
    const d = 4 + Math.random() * 6;
    gsap.to(c.position, { x: at.x + dir.x * d, y: Math.max(0.3, at.y + dir.y * d - 2), z: at.z + dir.z * d, duration: 1.2, ease: 'power2.out' });
    gsap.to(c.rotation, { x: Math.random() * 6, y: Math.random() * 6, duration: 1.2 });
    gsap.to(c.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.6, delay: 0.9, onComplete: () => parent.remove(c) });
  }
}

/** A pulse ring that expands from a point on the floor. */
export function pulse(parent: THREE.Object3D, at: THREE.Vector3, color: number, size = 6) {
  const r = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
  r.rotation.x = -Math.PI / 2;
  r.position.copy(at);
  parent.add(r);
  gsap.to(r.scale, { x: size, y: size, z: size, duration: 1.1, ease: 'power2.out' });
  gsap.to(r.material, { opacity: 0, duration: 1.1, ease: 'power1.in', onComplete: () => { parent.remove(r); r.geometry.dispose(); } });
}
