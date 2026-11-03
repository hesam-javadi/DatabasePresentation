import * as THREE from 'three';
import gsap from 'gsap';
import { Ctx } from '../deck';
import { stage, v3 } from './base';
import { actor, slab, C, pulse } from '../three/props';
import { rules, qa, CH } from '../content';

/** Calm again: every user has their own row, and each row its own green ring. */
export function rulesScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const cols = [C.a, C.b, C.c, C.ok, C.a];
  const pairs = cols.map((col, i) => {
    const g = new THREE.Group();
    const s = slab(4.4, 1.1, 3, '✓', { size: 170, color: '#0c7f66' });
    const a = actor(col, 0.6);
    a.group.position.set(0, 0, 3.6);
    a.group.rotation.y = Math.PI;
    g.add(s.group, a.group);
    const ang = (i - 2) * 0.42;
    g.position.set(Math.sin(ang) * -10.5, 0, -Math.cos(ang) * 6 + 4);
    g.rotation.y = -ang * 0.6;
    st.group.add(g);
    return { g, a };
  });

  st.panel(`
    <h1 class="h1">${rules.h1}</h1>
    <ul class="steps">${rules.items.map((s) => `<li class="on">${s}</li>`).join('')}</ul>
  `);

  let last = 0, k = 0;
  ctx.frame((t) => {
    pairs.forEach(({ a }, i) => { a.body.position.y = 2.3 + Math.sin(t * 1.5 + i) * 0.1; });
    if (t - last > 0.8) { last = t; const p = pairs[k++ % pairs.length].g.position; pulse(st.group, v3(p.x, 0.1, p.z), C.ok, 4); }
  });

  return st.define({
    id: 'rules', label: rules.label, chapter: CH.end, steps: 1,
    shot: () => ({ pos: [0, 20, 36], look: [0, 1.5, 0], shift: 40, zoom: 1.05 }),
    apply: (_s, a) => {
      if (a.arriving) pairs.forEach(({ g }, i) => gsap.fromTo(g.position, { y: 6 }, { y: 0, duration: 0.9, delay: 0.5 + i * 0.12, ease: 'bounce.out' }));
    },
  });
}

/** The camera lifts over the whole world: every scene of the talk in one line. */
export function qaScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  st.panel(`
    <h1 class="h1" style="font-size:11rem">${qa.h1}</h1>
    <p class="lede" style="font-size:3.6rem">${qa.lede}</p>
  `, 'center').style.cssText = 'justify-content:flex-start;padding-top:26rem';
  return st.define({
    id: 'qa', label: qa.label, chapter: CH.end, steps: 1,
    // look back down on the five rules from above
    shot: () => ({ pos: [128, 30, 58], look: [168, 12, -4], shift: 0, zoom: 1 }),
    apply: () => {},
  });
}
