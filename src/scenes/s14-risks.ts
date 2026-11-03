import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Ctx } from '../deck';
import { stage } from './base';
import { mat, textTexture, C, shadows } from '../three/props';
import { risks, CH } from '../content';

/** A wall of six tiles; each step flips one to its red side and details it. */
export function risksScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const tiles = risks.items.map(([t], i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(7.6, 5.4, 0.7, 3, 0.3), [
      mat(0xffffff), mat(0xffffff), mat(0xffffff), mat(0xffffff), mat(0xffffff), mat(C.fault),
    ]);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.6), new THREE.MeshBasicMaterial({ map: textTexture(t, { w: 768, h: 504, size: 78, color: '#13203a', weight: 760 }), transparent: true, toneMapped: false }));
    front.position.z = 0.37;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.6), new THREE.MeshBasicMaterial({ map: textTexture(t, { w: 768, h: 504, size: 78, color: '#ffffff', weight: 800 }), transparent: true, toneMapped: false }));
    back.position.z = -0.37; back.rotation.y = Math.PI;
    (body.material as THREE.MeshPhysicalMaterial[])[5].color.set(C.fault);
    g.add(body, front, back);
    // RTL reading order: right to left, top to bottom
    const col = i % 3, row = Math.floor(i / 3);
    g.position.set(8.4 - col * 8.4, 9.8 - row * 6.2, 0);
    shadows(g);
    st.group.add(g);
    return g;
  });

  const panel = st.panel(`
    <h1 class="h1" style="font-size:6rem">${risks.h1}</h1>
    <div class="risk">
      <div class="risk-title"></div>
      <p class="risk-body"></p>
      <p class="risk-fix"></p>
    </div>
  `);
  const rt = panel.querySelector('.risk-title') as HTMLElement;
  const rb = panel.querySelector('.risk-body') as HTMLElement;
  const rf = panel.querySelector('.risk-fix') as HTMLElement;

  ctx.frame((t) => { tiles.forEach((g, i) => { g.position.z = Math.sin(t * 0.8 + i) * 0.15; }); });

  return st.define({
    id: 'risks', label: risks.label, chapter: CH.real, steps: 6,
    shot: () => ({ pos: [0, 8, 40], look: [0, 6.6, 0], shift: 40, zoom: 1.2 }),
    apply: (step) => {
      const [t, body, fix] = risks.items[step - 1];
      rt.textContent = t; rb.textContent = body; rf.textContent = `راه مقابله: ${fix}`;
      gsap.fromTo([rt, rb, rf], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 });
      tiles.forEach((g, i) => {
        const flipped = i === step - 1;
        gsap.to(g.rotation, { y: flipped ? Math.PI : 0, duration: 0.9, ease: 'power3.inOut' });
        gsap.to(g.scale, { x: flipped ? 1.08 : 1, y: flipped ? 1.08 : 1, z: 1, duration: 0.9 });
        g.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
          if (!m) return;
          for (const mm of Array.isArray(m) ? m : [m]) { mm.transparent = true; gsap.to(mm, { opacity: i < step ? 1 : 0.45, duration: 0.5 }); }
        });
      });
    },
  });
}
