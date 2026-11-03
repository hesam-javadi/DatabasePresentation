import * as THREE from 'three';
import gsap from 'gsap';
import { Ctx, markSteps } from '../deck';
import { stage, v3 } from './base';
import { actor, mat, beam, C, shadows, pulse } from '../three/props';
import { skew, CH } from '../content';

function lamp(x: number) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 6, 20), mat(C.steel));
  post.position.y = 3;
  const bulbMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: new THREE.Color(C.ok), emissiveIntensity: 1.4, roughness: 0.2, transmission: 0.2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 20), bulbMat);
  bulb.position.y = 7.3;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.5, 32), mat(0xffffff));
  base.position.y = 0.25;
  g.add(post, bulb, base);
  g.position.x = x;
  shadows(g);
  return { g, bulbMat };
}

/** Two on-call lamps; two doctors each check the other and switch off. */
export function skewScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const g = st.group;

  const lamps = [lamp(4.5), lamp(-4.5)];
  lamps.forEach((l) => g.add(l.g));

  const docA = actor(C.a), docB = actor(C.b);
  docA.group.position.set(9, 0, 6); docA.group.rotation.y = -0.6;
  docB.group.position.set(-9, 0, 6); docB.group.rotation.y = 0.6;
  // white coats: a lighter cap ring
  g.add(docA.group, docB.group);

  // each doctor looks at the *other* lamp
  const lookA = beam(C.a, 0.14), lookB = beam(C.b, 0.14);
  lookA.set(v3(9, 5.4, 6), v3(-4.5, 7.3, 0), 3);
  lookB.set(v3(-9, 5.4, 6), v3(4.5, 7.3, 0), 5);
  g.add(lookA.mesh, lookB.mesh);

  const alarm = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.22, 12, 96), new THREE.MeshBasicMaterial({ color: C.fault, transparent: true, opacity: 0, toneMapped: false }));
  alarm.rotation.x = -Math.PI / 2; alarm.position.y = 0.1;
  g.add(alarm);

  const panel = st.panel(`
    <div class="term">${skew.term}</div>
    <h1 class="h1">${skew.h1}</h1>
    <p class="lede">${skew.rule}</p>
    <ul class="steps">${skew.steps.map((s) => `<li>${s}</li>`).join('')}</ul>
    <div class="callout bad" style="opacity:0">${skew.verdict}</div>
  `);
  const list = panel.querySelector('.steps') as HTMLElement;
  const verdict = panel.querySelector('.callout') as HTMLElement;
  const pinA = st.pin('کشیک', lamps[0].g, [0, 10, 0], 'okp');
  const pinB = st.pin('کشیک', lamps[1].g, [0, 10, 0], 'okp');

  let alarmOn = false, lastPulse = 0;
  ctx.frame((t) => {
    if (alarmOn) {
      (alarm.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(t * 6) * 0.4;
      if (t - lastPulse > 1.2) { lastPulse = t; pulse(g, v3(0, 0.1, 0), C.fault, 8); }
    }
  });

  return st.define({
    id: 'skew', label: skew.label, chapter: CH.problems, steps: 3,
    caption: 'مثال کلاسیک کتاب‌های پایگاه داده؛ نمایشی',
    shot: () => ({ pos: [0, 17, 36], look: [0, 4.5, 1], shift: 40 }),
    apply: (step) => {
      markSteps(list, step);
      lookA.grow(step === 2 ? 1 : 0, 0.7);
      lookB.grow(step === 2 ? 1 : 0, 0.7);
      const on = step < 3;
      lamps.forEach((l, i) => {
        gsap.to(l.bulbMat, { emissiveIntensity: on ? 1.4 : 0, duration: 0.5, delay: on ? 0 : 0.4 + i * 0.15 });
        const c = new THREE.Color(on ? C.ok : 0x9aa4b4);
        gsap.to(l.bulbMat.emissive, { r: c.r, g: c.g, b: c.b, duration: 0.5, delay: on ? 0 : 0.4 + i * 0.15 });
        const base = new THREE.Color(on ? 0xffffff : 0x8d97a8);
        gsap.to(l.bulbMat.color, { r: base.r, g: base.g, b: base.b, duration: 0.5, delay: on ? 0 : 0.4 + i * 0.15 });
      });
      for (const p of [pinA, pinB]) {
        p.classList.add('on');
        p.textContent = on ? 'کشیک' : 'مرخصی';
        p.className = `pin on ${on ? 'okp' : 'bad'}`;
      }
      gsap.to(docA.group.position, { x: on ? 9 : 12, z: on ? 6 : -8, duration: 1.2, delay: on ? 0 : 0.3 });
      gsap.to(docB.group.position, { x: on ? -9 : -12, z: on ? 6 : -8, duration: 1.2, delay: on ? 0 : 0.3 });
      alarmOn = !on;
      if (on) (alarm.material as THREE.MeshBasicMaterial).opacity = 0;
      gsap.to(verdict, { opacity: on ? 0 : 1, duration: 0.5, delay: on ? 0 : 1 });
    },
  });
}
