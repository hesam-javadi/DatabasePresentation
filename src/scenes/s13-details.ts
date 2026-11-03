import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Ctx, markSteps } from '../deck';
import { stage } from './base';
import { mat, label, C, shadows } from '../three/props';
import { details, CH } from '../content';

function bars() {
  const g = new THREE.Group();
  const cols = [C.ok, C.ok, C.ok, C.fault, 0xc6cfdb];
  const bs = cols.map((c, i) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(1.1, 1, 1.1, 2, 0.15), mat(c));
    b.position.set(-2.6 + i * 1.3, 0.5, 0);
    g.add(b);
    return b;
  });
  const sum = label('COUNT(*)', { w: 512, h: 150, size: 80, mono: true, color: '#0c7f66', scale: 1.4 });
  sum.position.set(0, 6.6, 0);
  g.add(sum);
  return { g, bs };
}

function stopSign() {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.5, 8), mat(C.fault));
  s.rotation.x = Math.PI / 2; s.rotation.y = Math.PI / 8; s.position.y = 5;
  const face = label('Cancelled', { w: 512, h: 150, size: 88, mono: true, color: '#ffffff', scale: 1.4 });
  face.position.set(0, 5, 0.4);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 12), mat(C.steel));
  pole.position.y = 1.5;
  g.add(s, face, pole);
  return { g, s };
}

function retry() {
  const g = new THREE.Group();
  const ring = new THREE.Group();
  const arc = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.42, 16, 64, Math.PI * 1.6), mat(C.a));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 24), mat(C.a));
  tip.position.set(2.4, 0, 0); tip.rotation.z = Math.PI;
  ring.add(arc, tip);
  ring.position.y = 4.6;
  const codes = label('1205  1222', { w: 640, h: 150, size: 84, mono: true, color: '#2457d6', scale: 1.3 });
  codes.position.y = 4.6;
  g.add(ring, codes);
  return { g, ring };
}

function clocks() {
  const g = new THREE.Group();
  const mk = (r: number, col: number) => {
    const c = new THREE.Group();
    const face = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.4, 48), mat(0xffffff));
    face.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.18, 12, 48), mat(col));
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.16, r * 0.8, 0.1), mat(C.ink));
    hand.geometry.translate(0, r * 0.4, 0); hand.position.z = 0.3;
    const hand2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, r * 0.55, 0.1), mat(C.ink));
    hand2.geometry.translate(0, r * 0.27, 0); hand2.position.z = 0.32;
    c.add(face, rim, hand, hand2);
    return { c, hand, hand2 };
  };
  const main = mk(2.4, C.ok); main.c.position.y = 5;
  const small = [mk(0.9, 0x9aa4b4), mk(0.9, 0x9aa4b4), mk(0.9, 0x9aa4b4)];
  small.forEach((s, i) => { s.c.position.set(-3.6 + i * 3.6, 1.2, 1.5); g.add(s.c); });
  g.add(main.c);
  return { g, main, small };
}

/** Four small principles on a turntable; each step turns the next one to face the audience. */
export function detailsScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const disc = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(13, 13.4, 0.8, 96), mat(0xffffff, { roughness: 0.5 }));
  plate.position.y = 0.4;
  disc.add(plate);
  const b = bars(), s = stopSign(), r = retry(), c = clocks();
  const items = [b.g, s.g, r.g, c.g];
  items.forEach((o, i) => {
    const ang = -i * Math.PI / 2;
    o.position.set(Math.sin(ang) * 8.5, 0.8, Math.cos(ang) * 8.5);
    o.rotation.y = ang;
    disc.add(o);
  });
  shadows(disc);
  st.group.add(disc);

  const panel = st.panel(`
    <h1 class="h1">${details.h1}</h1>
    <ul class="steps">${details.steps.map(([t, s]) => `<li>${t}<span class="sub">${s}</span></li>`).join('')}</ul>
    <div class="callout ok proof" style="opacity:0;font-size:2.5rem">${details.proof}</div>
  `);
  panel.style.top = '13rem';
  panel.classList.add('compact');
  const list = panel.querySelector('.steps') as HTMLElement;
  const proof = panel.querySelector('.proof') as HTMLElement;

  let cur = 1;
  ctx.frame((t) => {
    if (cur === 1) b.bs.forEach((m, i) => { const h = 1 + Math.abs(Math.sin(t * 0.8 + i * 0.7)) * 4; m.scale.y = h; m.position.y = h / 2; });
    if (cur === 2) s.s.rotation.z = Math.sin(t * 2) * 0.06;
    if (cur === 3) r.ring.rotation.z = -t * 2.2;
    c.main.hand.rotation.z = -t * 0.8; c.main.hand2.rotation.z = -t * 0.07;
    // the servers' clocks drift apart
    c.small.forEach((k, i) => { k.hand.rotation.z = -t * (0.8 + (i - 1) * 0.35) - i; k.hand2.rotation.z = -t * 0.07 - i * 0.6; });
  });

  return st.define({
    id: 'details', label: details.label, chapter: CH.real, steps: 4,
    shot: () => ({ pos: [0, 15, 38], look: [0, 4, 4], shift: 40, zoom: 1.35 }),
    apply: (step) => {
      markSteps(list, step);
      cur = step;
      gsap.to(disc.rotation, { y: (step - 1) * Math.PI / 2, duration: 1.3, ease: 'power3.inOut' });
      gsap.to(proof, { opacity: step === 4 ? 1 : 0, duration: 0.5, delay: step === 4 ? 1 : 0 });
    },
  });
}

