import * as THREE from 'three';
import gsap from 'gsap';
import { Ctx, markSteps } from '../deck';
import { stage, v3 } from './base';
import { actor, slab, mat, C, fade, burst } from '../three/props';
import { deadlock, CH } from '../content';

/** A chain of torus links between two points, revealed link by link. */
function chain(color: number, a: THREE.Vector3, b: THREE.Vector3, lift = 3, size = 1) {
  const g = new THREE.Group();
  const curve = new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(v3(0, lift, 0)), b);
  const len = curve.getLength();
  const n = Math.max(4, Math.round(len / (0.95 * size)));
  const m = mat(color, { metalness: 0.3, roughness: 0.25 });
  const links: THREE.Mesh[] = [];
  for (let i = 0; i < n; i++) {
    const l = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.15, 10, 20), m);
    const t = (i + 0.5) / n;
    l.position.copy(curve.getPointAt(t));
    const tan = curve.getTangentAt(t);
    l.quaternion.setFromUnitVectors(v3(0, 0, 1), tan);
    l.rotateZ(i % 2 ? Math.PI / 2 : 0);
    l.rotateY(Math.PI / 2);
    l.scale.setScalar(0.001);
    l.castShadow = true;
    g.add(l); links.push(l);
  }
  return {
    g, m,
    show(on: boolean, delay = 0) {
      links.forEach((l, i) => gsap.to(l.scale, { x: on ? size : 0.001, y: on ? size : 0.001, z: on ? size : 0.001, duration: 0.25, delay: delay + (on ? i * 0.04 : 0) }));
    },
    color(c: number) { const col = new THREE.Color(c); gsap.to(m.color, { r: col.r, g: col.g, b: col.b, duration: 0.4 }); },
  };
}

export function deadlockScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const g = st.group;

  const order = slab(7, 1.6, 4.6, 'سفارش', { size: 120 });
  const stock = slab(7, 1.6, 4.6, 'انبار', { size: 120 });
  order.group.position.set(6.5, 0, -3);
  stock.group.position.set(-6.5, 0, -3);
  g.add(order.group, stock.group);

  const T1 = actor(C.a), T2 = actor(C.b);
  T1.group.position.set(9, 0, 8); T1.group.rotation.y = -0.5;
  T2.group.position.set(-9, 0, 8); T2.group.rotation.y = 0.5;
  g.add(T1.group, T2.group);

  const hand1 = v3(9, 4, 8), hand2 = v3(-9, 4, 8);
  const top1 = v3(6.5, 1.7, -3), top2 = v3(-6.5, 1.7, -3);
  const hold1 = chain(C.a, hand1, top1, 0.5);
  const hold2 = chain(C.b, hand2, top2, 0.5);
  const want1 = chain(C.a, hand1.clone().add(v3(-0.4, 1, 0)), top2.clone().add(v3(1.2, 0.3, -1)), 9, 0.7);
  const want2 = chain(C.b, hand2.clone().add(v3(0.4, 1, 0)), top1.clone().add(v3(-1.2, 0.3, -1)), 12, 0.7);
  g.add(hold1.g, hold2.g, want1.g, want2.g);

  // the wait-for cycle, drawn as a spinning ring above the scene
  const cycle = new THREE.Mesh(new THREE.TorusGeometry(5, 0.22, 12, 80, Math.PI * 1.85), new THREE.MeshBasicMaterial({ color: C.fault, transparent: true, opacity: 0, toneMapped: false }));
  cycle.position.set(0, 17, -2); cycle.rotation.x = -1.1;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 20), cycle.material);
  head.position.set(5, 0, 0); head.rotation.z = Math.PI;
  cycle.add(head);
  g.add(cycle);

  const panel = st.panel(`
    <div class="term">${deadlock.term}</div>
    <h1 class="h1">${deadlock.h1}</h1>
    <ul class="steps">${deadlock.steps.map((s) => `<li>${s}</li>`).join('')}</ul>
    <div class="callout ok" style="opacity:0">${deadlock.fix}</div>
  `);
  const list = panel.querySelector('.steps') as HTMLElement;
  const fix = panel.querySelector('.callout') as HTMLElement;
  const pinVictim = st.pin('قربانی', T2.group, [0, 8, 0], 'bad mono');

  let spin = false;
  ctx.frame((_t, dt) => { if (spin) cycle.rotation.z += dt * 1.6; });

  return st.define({
    id: 'deadlock', label: deadlock.label, chapter: CH.problems, steps: 4,
    caption: 'نمایشی',
    shot: (s) => s === 3 ? { pos: [0, 24, 34], look: [0, 4, 0], shift: 40 } : { pos: [0, 19, 38], look: [0, 3.5, 1], shift: 40 },
    apply: (step, a) => {
      markSteps(list, step);
      hold1.show(step >= 1);
      want1.show(step >= 3, 0.1);
      want2.show(step === 3, 0.5);
      hold2.show(step >= 2 && step < 4);
      const cm = cycle.material as THREE.MeshBasicMaterial;
      spin = step === 3;
      gsap.to(cm, { opacity: step === 3 ? 0.9 : 0, duration: 0.5, delay: step === 3 ? 1.2 : 0 });
      order.tint(step >= 1 ? 0xdbe5fb : 0xffffff);
      stock.tint(step >= 2 && step < 4 ? 0xf7dbe6 : step >= 4 ? 0xdbe5fb : 0xffffff);
      // step 4: T2 is the victim; T1 gets the stock row
      if (step === 4) {
        T2.setColor(C.zombie);
        gsap.to(T2.group.rotation, { z: -1.2, duration: 0.8, ease: 'power2.in' });
        gsap.to(T2.group.position, { y: -0.6, x: -11, duration: 0.8 });
        fade(T2.group, 0.45, 0.8);
        if (a.dir > 0 && !a.arriving) burst(g, v3(-9, 4, 8), C.fault, 18);
      } else {
        T2.setColor(C.b);
        gsap.to(T2.group.rotation, { z: 0, duration: 0.5 });
        gsap.to(T2.group.position, { y: 0, x: -9, duration: 0.5 });
        fade(T2.group, 1, 0.4);
      }
      pinVictim.classList.toggle('on', step === 4);
      pinVictim.textContent = 'Msg 1205: victim';
      gsap.to(fix, { opacity: step === 4 ? 1 : 0, duration: 0.5, delay: step === 4 ? 1 : 0 });
    },
  });
}
