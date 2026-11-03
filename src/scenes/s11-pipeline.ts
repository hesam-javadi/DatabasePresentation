import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Ctx, markSteps } from '../deck';
import { stage, v3 } from './base';
import { actor, mat, C, shadows, beam, fade } from '../three/props';
import { pipe, CH } from '../content';

/** API → item table → dispatch window → queue → workers, laid out right to left. */
export function pipelineScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const g = st.group;

  // API instance
  const api = new THREE.Mesh(new RoundedBoxGeometry(4.4, 5, 4.4, 4, 0.5), mat(C.ink, { roughness: 0.3 }));
  api.position.set(19, 2.5, 0);
  g.add(shadows(api));

  // item table: 8×8 small rows
  const N = 64;
  const tile = new THREE.InstancedMesh(new RoundedBoxGeometry(1.2, 0.5, 0.9, 1, 0.12), mat(0xffffff, { roughness: 0.45 }), N);
  tile.castShadow = true;
  const tpos: THREE.Vector3[] = [];
  for (let i = 0; i < N; i++) tpos.push(v3(10.5 - (i % 8) * 1.45, 0.25, -5 + Math.floor(i / 8) * 1.2));
  g.add(tile);
  const base = new THREE.Mesh(new RoundedBoxGeometry(12.6, 0.3, 10.4, 2, 0.15), mat(0xdfe6ef, { roughness: 0.7 }));
  base.position.set(5.4, 0.15 - 0.15, -0.8);
  base.receiveShadow = true;
  g.add(base);

  // dispatch window: a frame with 6 slots
  const frame = new THREE.Group();
  const fm = mat(C.c);
  const side = new THREE.Mesh(new RoundedBoxGeometry(0.6, 6, 0.6, 2, 0.15), fm);
  const s1 = side.clone(); s1.position.set(0, 3, -3.4);
  const s2 = side.clone(); s2.position.set(0, 3, 3.4);
  const top = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.6, 7.4, 2, 0.15), fm); top.position.y = 6.1;
  frame.add(s1, s2, top);
  frame.position.set(-2.5, 0, 0);
  g.add(shadows(frame));

  // queue pipe
  const path = new THREE.CatmullRomCurve3([v3(-3.5, 3, 0), v3(-7, 4.5, 1), v3(-11, 3.5, 0), v3(-14, 3, 0)]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(path, 60, 1.25, 24), new THREE.MeshPhysicalMaterial({ color: 0xe8eef7, roughness: 0.05, transmission: 0.75, thickness: 0.5, transparent: true, opacity: 0.6, depthWrite: false }));
  g.add(tube);
  const M = 9;
  const msgs = Array.from({ length: M }, (_, i) => {
    const c = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.9, 0.9, 2, 0.15), mat(i === 4 || i === 5 ? C.b : C.a));
    c.castShadow = true;
    g.add(c);
    c.visible = false;
    return c;
  });

  // workers (service instances)
  const workers = [-4, 0, 4].map((z) => {
    const a = actor(C.ink, 0.7);
    a.group.position.set(-18, 0, z);
    a.group.rotation.y = Math.PI / 2;
    g.add(a.group);
    return a;
  });

  const back = beam(C.ok, 0.2);
  back.set(v3(-18, 5, 0), v3(5, 1, -1), 11);
  g.add(back.mesh);

  const pins = [
    st.pin('API', api, [0, 3.6, 0], 'mono'),
    st.pin('جدول آیتم‌ها', base, [0, 2.4, 4.6]),
    st.pin('پنجرهٔ ارسال', frame, [0, 8.2, 0], 'c'),
    st.pin('RabbitMQ', tube, [-8, 7.4, 0], 'mono'),
    st.pin('چند نمونهٔ سرویس', workers[0].group, [5, 7.6, 4]),
  ];

  const panel = st.panel(`
    <h1 class="h1">${pipe.h1}</h1>
    <ul class="steps">${pipe.steps.map(([t, s]) => `<li>${t}<span class="sub">${s}</span></li>`).join('')}</ul>
  `);
  const list = panel.querySelector('.steps') as HTMLElement;

  let stepNow = 1;
  const filled = { n: 0 };
  const done = new Set<number>();
  const tm = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  const cWhite = new THREE.Color(0xffffff), cWin = new THREE.Color(C.c), cDone = new THREE.Color(C.ok), cWork = new THREE.Color(C.a);

  ctx.frame((t) => {
    for (let i = 0; i < N; i++) {
      const on = i < filled.n;
      sc.setScalar(on ? 1 : 0.0001);
      const lifted = stepNow >= 2 && i < 6 && !done.has(i);
      tm.compose(v3(tpos[i].x, tpos[i].y + (lifted ? 0.5 + Math.sin(t * 4 + i) * 0.15 : 0), tpos[i].z), q, sc);
      tile.setMatrixAt(i, tm);
      tile.setColorAt(i, done.has(i) ? cDone : lifted ? cWin : stepNow >= 4 && i < 14 ? cWork : cWhite);
    }
    tile.instanceMatrix.needsUpdate = true;
    if (tile.instanceColor) tile.instanceColor.needsUpdate = true;

    msgs.forEach((c, i) => {
      c.visible = stepNow >= 3;
      if (!c.visible) return;
      // two magenta cubes travel together: a duplicate delivery
      const dup = i === 5 ? 0.035 : 0;
      const u = ((t * 0.16 + i / M) % 1) + dup;
      c.position.copy(path.getPointAt(Math.min(1, u)));
      c.rotation.set(t + i, t * 0.7, 0);
    });

    if (stepNow >= 4) {
      workers.forEach((w, i) => { w.body.position.y = 2.3 + Math.abs(Math.sin(t * 3 + i * 2)) * 0.5; });
      if (Math.floor(t * 2) % 3 === 0) done.add(Math.floor(t * 2) % 14);
    }
  });

  return st.define({
    id: 'pipeline', label: pipe.label, chapter: CH.real, steps: 4,
    caption: 'طرح کلی، ساده‌شده',
    shot: () => ({ pos: [0, 24, 44], look: [-1, 2, 0], shift: 40, zoom: 1.3 }),
    apply: (step) => {
      markSteps(list, step);
      stepNow = step;
      if (step < 4) done.clear();
      gsap.to(filled, { n: N, duration: step === 1 ? 1.4 : 0, ease: 'power1.in', delay: step === 1 ? 0.6 : 0 });
      pins.forEach((p, i) => p.classList.toggle('on', i === 0 || (i === 1) || (i === 2 && step >= 2) || (i === 3 && step >= 3) || (i === 4 && step >= 4)));
      fade(frame, step >= 2 ? 1 : 0.25, 0.5);
      fade(tube, step >= 3 ? 1 : 0.3, 0.5);
      workers.forEach((w) => { w.setColor(step >= 4 ? C.a : C.ink); fade(w.group, step >= 4 ? 1 : 0.3, 0.5); });
      back.grow(step >= 4 ? 1 : 0, 1);
      void cWork;
    },
  });
}
