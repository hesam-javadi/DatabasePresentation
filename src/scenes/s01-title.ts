import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Ctx } from '../deck';
import { stage, v3 } from './base';
import { actor, mat, slab, C, pulse } from '../three/props';
import { title, CH } from '../content';

/** A city of rows; one row lifts and four users converge on it. */
export function titleScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const { group } = st;

  // the table as a field of rows
  const cols = 26, rows = 16;
  const geo = new RoundedBoxGeometry(3.4, 1, 2.2, 2, 0.25);
  const field = new THREE.InstancedMesh(geo, mat(0xffffff, { roughness: 0.4, clearcoat: 0.5 }), cols * rows);
  field.castShadow = true; field.receiveShadow = true;
  const m = new THREE.Matrix4();
  const heights: number[] = [];
  let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const hgt = 0.4 + Math.random() * 0.9;
    heights.push(hgt);
    const x = (c - cols / 2) * 4.1, z = (r - rows / 2) * 3.0 - 6;
    const clear = Math.abs(x) < 15 && z > -9 && z < 17; // plaza for the hero row
    m.compose(v3(x, hgt / 2, z), new THREE.Quaternion(), clear ? v3(0.0001, 0.0001, 0.0001) : v3(1, hgt, 1));
    field.setMatrixAt(k++, m);
  }
  group.add(field);

  const hero = slab(7, 1.4, 4.4, 'ردیف ۴۲', { size: 120 });
  hero.group.position.set(0, 0, 4);
  group.add(hero.group);

  const users = [C.a, C.b, C.c, C.ok].map((col, i) => {
    const a = actor(col, 0.9);
    const ang = (i / 4) * Math.PI * 2 + 0.6;
    a.group.position.set(Math.cos(ang) * 22, 0, 4 + Math.sin(ang) * 14);
    a.group.lookAt(0, 0, 4);
    group.add(a.group);
    return { a, ang };
  });

  st.panel(`
    <h1 class="h1" style="font-size:8.6rem">${title.title}</h1>
    <p class="lede">${title.sub}</p>
    ${title.presenter ? `<p class="lede" style="margin-top:5rem;color:var(--ink)">${title.presenter}</p>` : ''}
    ${title.event ? `<p class="lede">${title.event}</p>` : ''}
  `, 'panel').style.cssText = 'top:30rem;width:82rem';

  let t0 = 0;
  ctx.frame((t) => {
    if (!t0) t0 = t;
    hero.group.position.y = 3 + Math.sin(t * 1.3) * 0.35;
    hero.group.rotation.y = Math.sin(t * 0.4) * 0.12;
    users.forEach(({ a, ang }, i) => {
      const r = 9.5 + Math.sin(t * 0.8 + i) * 0.6;
      const aa = ang + t * 0.12;
      a.group.position.set(Math.cos(aa) * r, 0, 4 + Math.sin(aa) * r * 0.75);
      a.group.lookAt(0, 0, 4);
      a.body.position.y = 2.3 + Math.abs(Math.sin(t * 2.2 + i)) * 0.25;
    });
  });

  let pulseT = 0;
  ctx.frame((t) => {
    if (t - pulseT > 2.4) { pulseT = t; pulse(group, v3(0, 0.05, 4), C.ink, 9); }
  });

  return st.define({
    id: 'title', label: title.title, chapter: CH.problems, steps: 1,
    shot: () => ({ pos: [-4, 30, 46], look: [-2, 0, 0], shift: 40, zoom: 1 }),
    apply: (_s, a) => {
      if (a.arriving) {
        users.forEach(({ a: u }, i) => gsap.fromTo(u.group.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 0.9, y: 0.9, z: 0.9, duration: 0.8, delay: 0.6 + i * 0.12, ease: 'back.out(2)' }));
      }
    },
  });
}
