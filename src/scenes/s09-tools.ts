import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Ctx, markSteps } from '../deck';
import { stage, v3 } from './base';
import { mat, slab, label, C, shadows, fade, pulse } from '../three/props';
import { tools, CH } from '../content';

function padlock() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(4.2, 3.6, 1.8, 4, 0.45), mat(C.a, { metalness: 0.2 }));
  body.position.y = 2.6;
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.32, 16, 40, Math.PI), mat(C.steel, { metalness: 0.8, roughness: 0.2 }));
  shackle.position.y = 4.4;
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.2, 16), shackle.material);
  legL.position.set(-1.35, 4.0, 0);
  const legR = legL.clone(); legR.position.x = 1.35;
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 20), mat(C.ink));
  hole.rotation.x = Math.PI / 2; hole.position.set(0, 2.4, 0.92);
  const top = new THREE.Group(); top.add(shackle, legL, legR);
  g.add(body, top, hole);
  shadows(g);
  return { g, top };
}

function stamp() {
  const g = new THREE.Group();
  const paper = slab(5, 0.4, 3.6, 'v7', { size: 200, mono: true, color: '#c2185b' } as any);
  g.add(paper.group);
  const s = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 16), mat(C.b));
  handle.position.y = 3.2;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.2, 20), mat(C.b));
  neck.position.y = 2;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.6, 36), mat(C.ink));
  foot.position.y = 0.6;
  s.add(handle, neck, foot);
  s.position.y = 2.5;
  g.add(s);
  shadows(g);
  return { g, s, paper };
}

function gate() {
  const g = new THREE.Group();
  const m = mat(C.ok);
  const l = new THREE.Mesh(new RoundedBoxGeometry(0.9, 6, 0.9, 2, 0.2), m); l.position.set(-2.8, 3, 0);
  const r = l.clone(); r.position.x = 2.8;
  const t = new THREE.Mesh(new RoundedBoxGeometry(6.5, 0.9, 0.9, 2, 0.2), m); t.position.y = 6.2;
  const item = slab(3.6, 1, 2.4, '', {});
  item.group.position.set(0, 0, 6);
  const sign = label('Queued?', { w: 512, h: 160, size: 84, mono: true, color: '#0c7f66', scale: 1.8 });
  sign.position.set(0, 7.9, 0);
  g.add(l, r, t, item.group, sign);
  shadows(g);
  return { g, item };
}

/** Three tools on three plinths; the active one performs its move. */
export function toolsScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const g = st.group;
  const lock = padlock(), stp = stamp(), gt = gate();
  const objs = [lock.g, stp.g, gt.g];
  objs.forEach((o, i) => {
    o.position.set(11 - i * 11, 0, 0);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.5, 48), mat(0xffffff, { roughness: 0.5 }));
    plinth.position.set(o.position.x, 0.25, 0);
    plinth.receiveShadow = true;
    g.add(plinth, o);
  });

  const panel = st.panel(`
    <h1 class="h1">${tools.h1}</h1>
    <ul class="steps">${tools.items.map(([t, s, code]) => `<li>${t}<span class="sub">${s}</span><span class="code" style="display:block;font-size:2.05rem;margin-top:.6rem;color:var(--ink)">${code}</span></li>`).join('')}</ul>
  `);
  const list = panel.querySelector('.steps') as HTMLElement;

  let cur = 0, acc = 0, phase = 0;
  ctx.frame((t, dt) => {
    objs.forEach((o, i) => { o.rotation.y = i === cur - 1 ? Math.sin(t * 0.8) * 0.25 : 0; });
    acc += dt;
    if (acc < 2.2) return;
    acc = 0; phase++;
    if (cur === 1) {
      gsap.to(lock.top.position, { y: phase % 2 ? 0.9 : 0, duration: 0.4, ease: 'back.out(3)' });
    } else if (cur === 2) {
      gsap.timeline()
        .to(stp.s.position, { y: 0.15, duration: 0.25, ease: 'power3.in' })
        .add(() => { stp.paper.setText(phase % 2 ? 'v8' : 'v7', '#c2185b'); pulse(stp.g, v3(0, 0.45, 0), C.b, 4); })
        .to(stp.s.position, { y: 2.5, duration: 0.5, ease: 'power2.out' });
    } else if (cur === 3) {
      // the first try passes the gate, the second bounces off (0 rows)
      const pass = phase % 2 === 1;
      gt.item.setText(pass ? '1 row' : '0 rows', pass ? '#0c7f66' : '#d7263d');
      gsap.timeline()
        .set(gt.item.group.position, { z: 6 })
        .to(gt.item.group.position, { z: pass ? -6 : 1.2, duration: 0.8, ease: pass ? 'power2.in' : 'power3.out' })
        .to(gt.item.group.position, { z: pass ? -6 : 6, duration: pass ? 0 : 0.6, ease: 'power2.out' });
    }
  });

  return st.define({
    id: 'tools', label: tools.label, chapter: CH.tools, steps: 3,
    shot: () => ({ pos: [0, 16, 38], look: [0, 3, 0], shift: 40 }),
    apply: (step) => {
      markSteps(list, step);
      cur = step; acc = 2.0;
      objs.forEach((o, i) => {
        fade(o, i === step - 1 ? 1 : 0.25, 0.5);
        gsap.to(o.position, { y: i === step - 1 ? 0.8 : 0, duration: 0.6 });
      });
    },
  });
}
