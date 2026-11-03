import * as THREE from 'three';
import gsap from 'gsap';
import { Ctx, markSteps } from '../deck';
import { stage, v3 } from './base';
import { actor, slab, C, Actor, Slab, fade } from '../three/props';
import { hot, CH, fa } from '../content';

/** Everyone queues behind one counter row; then the counter is spread out. */
export function hotScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const g = st.group;

  const counter = slab(7, 2, 5, fa(0), { size: 170 });
  counter.group.position.set(-4, 0, -2);
  g.add(counter.group);

  const lockRing = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.25, 12, 80), new THREE.MeshBasicMaterial({ color: C.fault, transparent: true, opacity: 0, toneMapped: false }));
  lockRing.rotation.x = -Math.PI / 2; lockRing.position.set(-4, 1, -2);
  g.add(lockRing);

  const shards: Slab[] = [];
  for (let i = 0; i < 6; i++) {
    const s = slab(3.4, 1.2, 2.6, '', { size: 150 });
    s.group.position.set(-4, 0, -2);
    s.group.scale.setScalar(0.001);
    g.add(s.group);
    shards.push(s);
  }
  const shardSpot = (i: number) => v3(-13 + i * 4.6, 0, -6 + Math.abs(i - 2.5) * 1.1);

  const palette = [C.a, C.b, C.c, C.ok];
  const N = 30;
  const crowd: Actor[] = [];
  for (let i = 0; i < N; i++) {
    const a = actor(palette[i % 4], 0.5);
    g.add(a.group);
    crowd.push(a);
  }
  // a single-file line that snakes away from the row
  const line = new THREE.CatmullRomCurve3([v3(-4, 0, 3.6), v3(1, 0, 6), v3(8, 0, 4), v3(13, 0, 8), v3(9, 0, 12.5), v3(1, 0, 12), v3(-6, 0, 10), v3(-12, 0, 12)]);
  const queueSpot = (i: number) => line.getPointAt(Math.min(1, i / (N - 1)));
  const shardQueue = (i: number) => {
    const s = i % 6, k = Math.floor(i / 6);
    const p = shardSpot(s);
    return v3(p.x, 0, p.z + 3.6 + k * 2.1);
  };

  const panel = st.panel(`
    <div class="term">${hot.term}</div>
    <h1 class="h1">${hot.h1}</h1>
    <ul class="steps">${hot.steps.map((s) => `<li>${s}</li>`).join('')}</ul>
    <div class="sql" style="opacity:0"><span class="cm">-- every request</span>
<span class="kw">UPDATE</span> Stats <span class="kw">SET</span> Done = Done + 1 <span class="kw">WHERE</span> Id = 1

<span class="cm">-- instead: count what is already there</span>
<span class="kw">SELECT</span> <span class="hl">COUNT(*)</span> <span class="kw">FROM</span> Item <span class="kw">WHERE</span> Status = 'Done'</div>
  `);
  const list = panel.querySelector('.steps') as HTMLElement;
  const sql = panel.querySelector('.sql') as HTMLElement;

  let mode = 1, count = 0, acc = 0, served = 0;
  ctx.frame((t, dt) => {
    acc += dt;
    const rate = mode === 1 ? 0.5 : mode === 2 ? 0.9 : 0.12;
    if (acc > rate) {
      acc = 0;
      count += mode === 3 ? 6 : 1;
      counter.setText(fa(count, true));
      served++;
      if (mode === 3) shards.forEach((s, i) => s.setText(fa(Math.floor(count / 6) + (i < count % 6 ? 1 : 0))));
      // the actor at the front hops
      const front = crowd[served % (mode === 3 ? 6 : 1)];
      gsap.fromTo(front.body.position, { y: 2.3 }, { y: 3.6, duration: 0.18, yoyo: true, repeat: 1 });
    }
    if (mode >= 2 && mode < 3) (lockRing.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 5) * 0.35;
    crowd.forEach((a, i) => { a.head.position.y = 5.1 + Math.sin(t * 3 + i) * 0.05; });
  });

  return st.define({
    id: 'hot', label: hot.label, chapter: CH.problems, steps: 3,
    caption: 'نمایشی',
    shot: (s) => s === 3 ? { pos: [-2, 26, 36], look: [-2, 1.5, 1], shift: 40 } : { pos: [0, 22, 36], look: [0, 1.5, 3], shift: 40 },
    apply: (step) => {
      markSteps(list, step);
      mode = step;
      const split = step === 3;
      crowd.forEach((a, i) => {
        const visible = step === 1 ? i < 10 : true;
        const p = split ? shardQueue(i) : queueSpot(i);
        gsap.to(a.group.position, { x: p.x, z: p.z, duration: 1.2, ease: 'power2.inOut', delay: i * 0.015 });
        gsap.to(a.group.scale, { x: visible ? 0.5 : 0.001, y: visible ? 0.5 : 0.001, z: visible ? 0.5 : 0.001, duration: 0.5, delay: visible ? i * 0.03 : 0 });
        const ahead = split ? shardSpot(i % 6) : queueSpot(Math.max(0, i - 1));
        a.group.rotation.y = i === 0 && !split ? Math.PI : Math.atan2(ahead.x - p.x, ahead.z - p.z);
      });
      shards.forEach((s, i) => {
        const p = split ? shardSpot(i) : v3(-4, 0, -2);
        gsap.to(s.group.position, { x: p.x, z: p.z, duration: 1, ease: 'power3.out', delay: split ? 0.2 + i * 0.06 : 0 });
        gsap.to(s.group.scale, { x: split ? 1 : 0.001, y: split ? 1 : 0.001, z: split ? 1 : 0.001, duration: 0.7, delay: split ? 0.2 + i * 0.06 : 0 });
      });
      fade(counter.group, split ? 0 : 1, 0.6);
      gsap.to(counter.group.scale, { x: split ? 0.4 : 1, y: split ? 0.4 : 1, z: split ? 0.4 : 1, duration: 0.6 });
      gsap.to(lockRing.material, { opacity: step === 2 ? 0.8 : 0, duration: 0.4 });
      gsap.to(sql, { opacity: split ? 1 : 0, duration: 0.5, delay: split ? 0.8 : 0 });
    },
  });
}
