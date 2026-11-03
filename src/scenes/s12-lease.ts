import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Ctx } from '../deck';
import { stage, v3 } from './base';
import { actor, slab, beam, label, mat, C, pulse, fade, burst, Slab } from '../three/props';
import { lease, CH, fa } from '../content';

/** One item, three workers: claim, lease with heartbeat, a zombie fenced off, the sweeper. */
export function leaseScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const g = st.group;

  const item = slab(8, 1.6, 4.6, 'Queued', { size: 76, mono: true });
  g.add(item.group);

  const ws = [
    { a: actor(C.a), p: v3(-10, 0, 6) },
    { a: actor(C.b), p: v3(10, 0, 6) },
    { a: actor(C.c), p: v3(0, 0, -10) },
  ];
  ws.forEach(({ a, p }) => { a.group.position.copy(p); g.add(a.group); });
  ws.forEach(({ a, p }) => { a.group.rotation.set(0, Math.atan2(-p.x, -p.z), 0); });

  const reach = ws.map(({ a }) => {
    const b = beam(C.ink, 0.2);
    b.set(a.group.position.clone().add(v3(0, 4.4, 0)), v3(0, 1.8, 0), 3);
    g.add(b.mesh);
    return b;
  });

  // key card above the owner
  const card = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.5, 0.25, 2, 0.12), mat(0xe2a400, { metalness: 0.6, roughness: 0.25 }));
  card.castShadow = true;
  g.add(card);
  const tokenTag = label('token 7f3a', { w: 640, h: 150, size: 80, mono: true, bg: '#ffffff', color: '#13203a', stroke: '#13203a', scale: 1.7 });
  g.add(tokenTag);

  // the lease timer: a ring that drains around the item
  const ringMat = new THREE.MeshBasicMaterial({ color: C.ok, side: THREE.DoubleSide, toneMapped: false, transparent: true });
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.9, 96, 1, 0, Math.PI * 2), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
  g.add(ring);
  const timer = { left: 1 };
  const setRing = () => {
    ring.geometry.dispose();
    ring.geometry = new THREE.RingGeometry(5.2, 5.9, 96, 1, Math.PI / 2, Math.PI * 2 * Math.max(0.0001, timer.left));
    const c = timer.left > 0.35 ? C.ok : timer.left > 0.12 ? C.c : C.fault;
    ringMat.color.set(c);
  };

  // fence: a translucent shield that flashes on a stale write
  const shield = new THREE.Mesh(new THREE.SphereGeometry(6.4, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: C.fault, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  g.add(shield);
  const stale = beam(C.zombie, 0.3);
  stale.set(v3(-10, 4.4, 6), v3(0, 1.8, 0), 5);
  // the sweeper lane sits to the right of the item
  g.add(stale.mesh);

  // sweeper lane: expired items slide back to a queue, one has hit the attempt cap
  const lane: Slab[] = [];
  for (let i = 0; i < 3; i++) {
    const s = slab(3.6, 0.9, 2.4, '', { size: 84, mono: true });
    s.group.position.set(15, 0, -8 + i * 3.2);
    s.group.scale.setScalar(0.001);
    g.add(s.group);
    lane.push(s);
  }
  const broom = new THREE.Mesh(new RoundedBoxGeometry(0.7, 1.2, 12, 2, 0.2), mat(C.c));
  broom.position.set(20, 0.6, -5);
  broom.castShadow = true;
  broom.scale.setScalar(0.001);
  g.add(broom);

  const card$ = st.panel(`
    <h1 class="h1">${lease.h1}</h1>
    <div class="focus">
      <div class="term focus-t"></div>
      <p class="lede focus-b" style="color:var(--ink)"></p>
    </div>
    <ul class="dots"></ul>
  `);
  const ft = card$.querySelector('.focus-t') as HTMLElement;
  const fb = card$.querySelector('.focus-b') as HTMLElement;
  ft.style.cssText = 'font-family:inherit;direction:rtl;font-size:3.6rem;font-weight:800;color:var(--ink);border-bottom-width:.5rem';

  const sql = st.panel(`<div class="sql">${lease.sql}</div>`, 'band');
  sql.dataset.manual = '1';
  sql.style.cssText = 'left:10rem;right:auto;width:92rem;bottom:13rem';

  const pinOne = st.pin('1 row', ws[0].a.group, [0, 9.5, 0], 'okp mono');
  const pinZ1 = st.pin('0 rows', ws[1].a.group, [0, 7.4, 0], 'bad mono');
  const pinZ2 = st.pin('0 rows', ws[2].a.group, [0, 7.4, 0], 'bad mono');
  const pinStale = st.pin('token 7f3a ≠ c91e → 0 rows', ws[0].a.group, [5, 8, 0], 'bad mono');
  const pinCap = st.pin('', lane[2].group, [0, 2.2, 0], 'mono');

  let mode = 0, beat = 0;
  const owner = { i: 0 };
  ctx.frame((t, dt) => {
    const o = ws[owner.i].a.group.position;
    card.position.set(o.x, 8.0 + Math.sin(t * 2) * 0.2, o.z);
    card.rotation.y = t * 1.2;
    tokenTag.position.set(0, 4.6, 0);
    if (mode === 2) {
      // healthy: lease drains, heartbeat refills it
      timer.left -= dt * 0.22;
      if (t - beat > 2.6) { beat = t; timer.left = 1; pulse(g, v3(o.x, 0.1, o.z), C.ok, 3); pulse(g, v3(0, 0.1, 0), C.ok, 5); }
      setRing();
    } else if (mode === 3) {
      timer.left = Math.max(0, timer.left - dt * 0.5);
      setRing();
    }
  });

  let tl: gsap.core.Timeline | null = null;

  return st.define({
    id: 'lease', label: lease.label, chapter: CH.real, steps: 4,
    caption: (s) => s === 1 ? 'شکل ساده‌شدهٔ دستور تصاحب' : 'نمایشی',
    shot: (s) => s === 4 ? { pos: [6, 26, 36], look: [4, 1.5, -1], shift: 40 } : { pos: [0, 22, 36], look: [0, 3, 2], shift: 40 },
    apply: (step, a) => {
      tl?.kill();
      tl = gsap.timeline();
      mode = 0;
      const [title, body] = lease.steps[step - 1];
      ft.textContent = title; fb.textContent = body;
      gsap.fromTo([ft, fb], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 });
      (card$.querySelector('.dots') as HTMLElement).innerHTML = lease.steps.map((_, i) => `<li class="${i === step - 1 ? 'on' : i < step - 1 ? 'done' : ''}"></li>`).join('');

      [pinOne, pinZ1, pinZ2, pinStale, pinCap].forEach((p) => p.classList.remove('on'));
      reach.forEach((r) => { r.grow(0, 0.3); r.setColor(C.ink); });
      gsap.to(shield.material, { opacity: 0, duration: 0.3 });
      stale.grow(0, 0.2);
      ws[0].a.setColor(C.a); fade(ws[0].a.group, 1, 0.3);
      lane.forEach((s) => gsap.to(s.group.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.3 }));
      gsap.to(broom.position, { x: 20, duration: 0.3 });
      gsap.to(broom.scale, { x: step === 4 ? 1 : 0.001, y: step === 4 ? 1 : 0.001, z: step === 4 ? 1 : 0.001, duration: 0.3 });
      owner.i = 0;
      gsap.to(card.scale, { x: step === 4 ? 0.001 : 1, y: step === 4 ? 0.001 : 1, z: step === 4 ? 0.001 : 1, duration: 0.3 });
      gsap.to(tokenTag.material, { opacity: step >= 2 && step < 4 ? 1 : 0, duration: 0.3 });
      gsap.to(ringMat, { opacity: step === 2 || step === 3 ? 1 : 0, duration: 0.3 });

      if (step === 1) {
        sql.classList.add('on'); gsap.to(sql, { opacity: 1, duration: 0.6, delay: 0.4 });
        item.setText('Queued');
        gsap.set(card.scale, { x: 0.001, y: 0.001, z: 0.001 });
        tl.add(() => reach.forEach((r) => r.grow(1, 0.7)), 0.3)
          .add(() => { reach[1].setColor(C.fault); reach[2].setColor(C.fault); item.setText('Processing', '#2457d6'); }, 1.2)
          .add(() => { reach[1].grow(0, 0.5); reach[2].grow(0, 0.5); pinOne.classList.add('on'); pinZ1.classList.add('on'); pinZ2.classList.add('on'); }, 1.5)
          .to(card.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(2)' }, 1.6);
      } else {
        gsap.to(sql, { opacity: 0, duration: 0.3, onComplete: () => sql.classList.remove('on') });
      }

      if (step === 2) {
        item.setText('Processing', '#2457d6');
        tokenTag.userData.set('token 7f3a');
        timer.left = 1; mode = 2; setRing();
        reach[0].grow(1, 0.5);
      }

      if (step === 3) {
        item.setText('Processing', '#2457d6');
        tokenTag.userData.set('token 7f3a');
        timer.left = 0.55; setRing();
        ws[0].a.setColor(C.zombie);
        tl.add(() => { mode = 3; }, 0.2)
          // lease runs out → sweeper requeues → worker B claims with a new token
          .add(() => { owner.i = 1; tokenTag.userData.set('token c91e'); reach[1].setColor(C.b); reach[1].grow(1, 0.6); timer.left = 1; mode = 2; setRing(); }, 1.8)
          // the zombie wakes up and tries to write
          .add(() => { stale.grow(1, 0.6); }, 3.0)
          .to(shield.material, { opacity: 0.35, duration: 0.15 }, 3.6)
          .add(() => { pinStale.classList.add('on'); if (a.dir > 0) burst(g, v3(-4, 4, 3), C.zombie, 14); }, 3.6)
          .to(shield.material, { opacity: 0.12, duration: 0.8 }, 3.8);
        fade(ws[0].a.group, 0.6, 0.6);
      }

      if (step === 4) {
        item.setText('Queued');
        const texts = [['Queued', '#13203a'], ['Queued', '#13203a'], ['Failed', '#d7263d']];
        lane.forEach((s, i) => {
          s.setText(texts[i][0], texts[i][1]);
          s.group.position.set(9 + i * 0.5, 0, -8 + i * 3.2);
          tl!.to(s.group.scale, { x: 1, y: 1, z: 1, duration: 0.4 }, 0.2 + i * 0.1);
        });
        tl.to(broom.position, { x: 6, duration: 0.01 }, 0.6)
          .to(broom.position, { x: 15, duration: 1.0, ease: 'power2.inOut' }, 0.7);
        lane.forEach((s, i) => tl!.to(s.group.position, { x: 17 + (i === 2 ? 3 : 0), duration: 1.0, ease: 'power2.inOut' }, 0.75));
        pinCap.innerHTML = `${fa(5)} / ${fa(5)} attempts`;
        tl.add(() => { pinCap.classList.add('on'); lane[2].tint(0xf9d9de); }, 1.9);
      } else {
        lane[2].tint(0xffffff, 0);
      }
    },
    leave: () => { gsap.to(sql, { opacity: 0, duration: 0.3, onComplete: () => sql.classList.remove('on') }); mode = 0; },
  });
}
