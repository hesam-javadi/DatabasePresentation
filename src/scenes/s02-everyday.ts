import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Ctx, markSteps } from '../deck';
import { stage } from './base';
import { actor, mat, C, shadows, fade } from '../three/props';
import { everyday, CH } from '../content';

const rb = (w: number, h: number, d: number, r = 0.2) => new RoundedBoxGeometry(w, h, d, 3, r);

function seat() {
  const g = new THREE.Group();
  const m = mat(C.a);
  const s = new THREE.Mesh(rb(3, 0.7, 3), m); s.position.y = 1.4;
  const b = new THREE.Mesh(rb(3, 3.2, 0.6), m); b.position.set(0, 3.0, -1.2); b.rotation.x = -0.12;
  const l = new THREE.Mesh(rb(0.5, 1.2, 2.4), mat(C.steel)); l.position.set(-1.6, 1.9, 0);
  const r = l.clone(); r.position.x = 1.6;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.2), mat(C.steel)); leg.position.y = 0.6;
  g.add(s, b, l, r, leg);
  return g;
}

function coins() {
  const g = new THREE.Group();
  const m = mat(0xd9a521, { metalness: 0.5, roughness: 0.3 });
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.42, 40), m);
    c.position.set(Math.sin(i) * 0.12, 0.25 + i * 0.46, Math.cos(i) * 0.12);
    g.add(c);
  }
  const c2 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.42, 40), m);
  c2.position.set(2.4, 0.25, 0.6); g.add(c2);
  return g;
}

function ticket() {
  const g = new THREE.Group();
  const t = new THREE.Mesh(rb(4.6, 0.3, 2.4, 0.12), mat(C.b));
  t.rotation.z = 0.35; t.position.y = 2.2;
  for (let i = 0; i < 6; i++) {
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.34, 10), mat(0xffffff));
    dot.position.set(1.2, 0, -1 + i * 0.4);
    t.add(dot);
  }
  g.add(t);
  return g;
}

function crate() {
  const g = new THREE.Group();
  const m = mat(0xc89a5b, { roughness: 0.6, clearcoat: 0.1 });
  const b = new THREE.Mesh(rb(3.2, 3.2, 3.2, 0.15), m); b.position.y = 1.6;
  g.add(b);
  for (const y of [0.6, 1.6, 2.6]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.12, 3.3), mat(0x9b7240, { roughness: 0.7, clearcoat: 0 }));
    p.position.y = y; g.add(p);
  }
  const small = new THREE.Mesh(rb(1.8, 1.8, 1.8, 0.12), m); small.position.set(2.4, 0.9, 0.8); g.add(small);
  return g;
}

/** Four everyday collisions on four pedestals; each step brings one forward. */
export function everydayScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const icons = [seat(), coins(), ticket(), crate()];
  const spots = icons.map((icon, i) => {
    const g = new THREE.Group();
    // RTL: first item on the right
    g.position.set(13.5 - i * 9, 0, 0);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 1.2, 48), mat(0xffffff, { roughness: 0.5 }));
    ped.position.y = 0.6;
    icon.position.y = 1.2;
    const a = actor(C.a, 0.55), b = actor(C.b, 0.55);
    a.group.position.set(-2.4, 0, 4.2); b.group.position.set(2.4, 0, 4.2);
    a.group.rotation.y = Math.PI * 0.78; b.group.rotation.y = -Math.PI * 0.78;
    g.add(ped, icon, a.group, b.group);
    shadows(g);
    st.group.add(g);
    return { g, icon, a, b };
  });

  const panel = st.panel(`
    <h1 class="h1">${everyday.h1}</h1>
    <ul class="steps">${everyday.items.map(([t, s]) => `<li>${t}<span class="sub">${s}</span></li>`).join('')}</ul>
    <div class="callout bad" style="opacity:0">${everyday.punch}</div>
  `);
  const list = panel.querySelector('.steps') as HTMLElement;
  const punch = panel.querySelector('.callout') as HTMLElement;

  ctx.frame((t) => {
    spots.forEach((s, i) => {
      if (s.g.userData.active) s.icon.rotation.y = Math.sin(t * 0.9 + i) * 0.5;
      const lean = s.g.userData.active ? Math.sin(t * 3 + i) * 0.08 + 0.18 : 0;
      s.a.body.rotation.x = -lean; s.b.body.rotation.x = -lean;
    });
  });

  return st.define({
    id: 'everyday', label: everyday.label, chapter: CH.problems, steps: 4,
    caption: 'تصویرها نمایشی‌اند',
    shot: () => ({ pos: [2, 17, 40], look: [0, 2.6, 0], shift: 40 }),
    apply: (step) => {
      markSteps(list, step);
      spots.forEach((s, i) => {
        const on = i === step - 1;
        s.g.userData.active = on;
        gsap.to(s.icon.position, { y: on ? 2.6 : 1.2, duration: 0.7, ease: 'power3.out' });
        gsap.to(s.icon.scale, { x: on ? 1.25 : 1, y: on ? 1.25 : 1, z: on ? 1.25 : 1, duration: 0.7 });
        const a = s.a.group.position, b = s.b.group.position;
        gsap.to(a, { x: on ? -1.7 : -2.4, z: on ? 3.2 : 4.2, duration: 0.7 });
        gsap.to(b, { x: on ? 1.7 : 2.4, z: on ? 3.2 : 4.2, duration: 0.7 });
        fade(s.g, i < step ? 1 : 0.28, 0.6);
      });
      gsap.to(punch, { opacity: step === 4 ? 1 : 0, y: step === 4 ? 0 : 20, duration: 0.6, delay: step === 4 ? 0.6 : 0 });
    },
  });
}

