import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Ctx } from '../deck';
import { stage, v3 } from './base';
import { mat } from '../three/props';
import { chapter, CH } from '../content';

/** A huge table of items being processed in a sweeping wave. */
export function chapterScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const cols = 64, rows = 30;
  const n = cols * rows;
  const field = new THREE.InstancedMesh(new RoundedBoxGeometry(1.5, 0.5, 1.1, 1, 0.15), mat(0xffffff, { roughness: 0.5, clearcoat: 0.3 }), n);
  field.receiveShadow = true; field.castShadow = true;
  const m = new THREE.Matrix4();
  const pos: THREE.Vector3[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const p = v3((c - cols / 2) * 1.8, 0.25, (r - rows / 2) * 1.4 + 6);
    pos.push(p);
    m.makeTranslation(p.x, p.y, p.z);
    field.setMatrixAt(r * cols + c, m);
    field.setColorAt(r * cols + c, new THREE.Color(0xffffff));
  }
  st.group.add(field);

  const pending = new THREE.Color(0xffffff), working = new THREE.Color(0x2457d6), done = new THREE.Color(0x0c8f70), failed = new THREE.Color(0xd7263d);
  const col = new THREE.Color();
  const seed = Array.from({ length: n }, () => Math.random());
  ctx.frame((t) => {
    // a front sweeping from right to left, with a jagged edge
    const front = ((t * 9) % (cols * 1.8 + 30)) - cols * 0.9 - 10;
    for (let i = 0; i < n; i++) {
      const p = pos[i];
      const d = (cols * 0.9 - p.x) - (front + cols * 0.9) + seed[i] * 6;
      if (d < 0) col.copy(seed[i] > 0.985 ? failed : done);
      else if (d < 5) col.copy(working);
      else col.copy(pending);
      field.setColorAt(i, col);
      const lift = d >= 0 && d < 5 ? 0.6 : 0;
      m.makeTranslation(p.x, p.y + lift, p.z);
      field.setMatrixAt(i, m);
    }
    field.instanceColor!.needsUpdate = true;
    field.instanceMatrix.needsUpdate = true;
  });

  st.panel(`
    <p class="lede" style="color:var(--ink);font-weight:650">${chapter.kicker}</p>
    <h1 class="h1 ltr" style="font-size:9rem;margin:1rem 0 2rem">${chapter.h1}</h1>
    <p class="lede" style="max-width:110rem">${chapter.lede}</p>
    <div class="facts">${chapter.facts.map(([b, s]) => `<div class="fact"><b>${b}</b><span>${s}</span></div>`).join('')}</div>
    <p class="lede" style="margin-top:3rem;font-size:2.5rem">${chapter.note}</p>
  `, 'center').style.cssText = 'justify-content:flex-start;padding-top:14rem;background:linear-gradient(to bottom, rgba(243,245,248,.96) 52%, rgba(243,245,248,0) 78%)';

  return st.define({
    id: 'chapter', label: chapter.label, chapter: CH.real, steps: 1,
    caption: 'نمایشی: موج پردازش روی جدول آیتم‌ها',
    shot: () => ({ pos: [0, 44, 40], look: [0, 0, -2], shift: 0, zoom: 1 }),
    apply: () => {},
  });
}
