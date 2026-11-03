import * as THREE from 'three';
import gsap from 'gsap';
import { Ctx, markSteps } from '../deck';
import { stage, v3 } from './base';
import { actor, slab, beam, label, mat, C, Slab, fade } from '../three/props';
import { reads, CH, fa } from '../content';

/** A reader with a report and a stack of rows that won't hold still. */
export function readsScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const g = st.group;

  // a short tower of rows (a result set)
  const stack: Slab[] = [];
  const vals = [120, 340, 75];
  vals.forEach((v, i) => {
    const s = slab(8, 1.4, 5, fa(v), { size: 160 });
    s.group.position.set(3, i * 1.7, 0);
    g.add(s.group);
    stack.push(s);
  });
  const ghost = slab(8, 1.4, 5, fa(510), { size: 160, color: '#7a879c' });
  ghost.group.position.set(3, 3 * 1.7, 0);
  (ghost.body.material as THREE.MeshPhysicalMaterial).color.set(0xdfe6f0);
  g.add(ghost.group);
  fade(ghost.group, 0, 0);

  const reader = actor(C.a);
  reader.group.position.set(-11, 0, 4); reader.group.rotation.y = 0.8;
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 0.2), mat(0xffffff));
  board.position.set(1.4, 3.4, 1.3); board.rotation.y = -0.3;
  reader.group.add(board);
  g.add(reader.group);

  const writer = actor(C.b);
  writer.group.position.set(14, 0, -2); writer.group.rotation.y = -1.0;
  g.add(writer.group);

  const readTag = label('', { w: 512, h: 192, size: 96, bg: '#ffffff', color: '#2457d6', stroke: '#2457d6', scale: 2.4 });
  readTag.position.set(-11, 9.4, 4);
  g.add(readTag);

  const look = beam(C.a, 0.14); look.set(v3(-9.6, 5.6, 4), v3(3, 3, 0), 3);
  const touch = beam(C.b, 0.22); touch.set(v3(13, 5, -2), v3(5, 1.6, 0), 3);
  g.add(look.mesh, touch.mesh);

  const panel = st.panel(`
    <h1 class="h1">${reads.h1}</h1>
    <ul class="steps">${reads.items.map(([en, t, s]) => `<li><span class="code" style="font-size:2.3rem;color:var(--ink-soft)">${en}</span><br>${t}<span class="sub">${s}</span></li>`).join('')}</ul>
  `);
  const list = panel.querySelector('.steps') as HTMLElement;

  const pinUncommitted = st.pin('commit نشده', stack[1].group, [0, 2.4, 0], 'bad');
  const pinNew = st.pin('ردیف تازه', ghost.group, [0, 2.4, 0], 'b');

  let flicker = false;
  ctx.frame((t) => {
    if (flicker) (stack[1].body.material as THREE.MeshPhysicalMaterial).emissive.setRGB(0.25 + Math.sin(t * 8) * 0.2, 0.02, 0.05);
  });

  return st.define({
    id: 'reads', label: reads.label, chapter: CH.problems, steps: 3,
    caption: 'نمایشی',
    shot: () => ({ pos: [0, 17, 37], look: [1, 3.5, 0], shift: 40 }),
    apply: (step, a) => {
      markSteps(list, step);
      const m1 = stack[1].body.material as THREE.MeshPhysicalMaterial;
      flicker = step === 1;
      if (!flicker) m1.emissive.setRGB(0, 0, 0);
      pinUncommitted.classList.toggle('on', step === 1);
      pinNew.classList.toggle('on', step === 3);
      look.grow(1, 0.6);
      touch.state.p = 0; touch.grow(1, 0.7);
      touch.mesh.position.set(0, 0, 0);

      if (step === 1) {
        touch.set(v3(13, 5, -2), v3(5, 3.2, 0), 3);
        stack[1].setText(fa(900), '#d7263d');
        readTag.userData.set(`خواند ${fa(900)}`);
        // the writer rolls back a moment later
        if (!a.arriving || a.dir > 0) gsap.delayedCall(1.8, () => { if (flicker) { stack[1].setText(fa(340)); } });
      } else if (step === 2) {
        touch.set(v3(13, 5, -2), v3(5, 1.6, 0), 3);
        stack[1].setText(fa(340));
        stack[0].setText(fa(120));
        readTag.userData.set(`${fa(120)} ← ${fa(95)}`);
        gsap.delayedCall(0.9, () => stack[0].setText(fa(95), '#c2185b'));
      } else {
        touch.set(v3(13, 5, -2), v3(5, 5.8, 0), 3);
        stack[0].setText(fa(95), '#c2185b');
        readTag.userData.set(`${fa(3)} ← ${fa(4)} ردیف`);
      }
      fade(ghost.group, step === 3 ? 0.85 : 0, 0.8);
      gsap.fromTo(ghost.group.position, { y: step === 3 ? 9 : 3 * 1.7 }, { y: 3 * 1.7, duration: 0.9, ease: 'bounce.out' });
    },
  });
}
