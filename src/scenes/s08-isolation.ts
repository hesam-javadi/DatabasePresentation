import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Ctx } from '../deck';
import { stage } from './base';
import { actor, mat, C, shadows } from '../three/props';
import { iso, CH } from '../content';

/** A staircase of isolation levels with a glass side platform for SNAPSHOT. */
export function isolationScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const g = st.group;

  const tones = [0xffffff, 0xdde5f2, 0xb7c6e0, 0x8099c7];
  const stepsGeo = tones.map((col, i) => {
    const hgt = 1.6 + i * 1.9;
    const m = new THREE.Mesh(new RoundedBoxGeometry(5.6, hgt, 7, 3, 0.25), mat(col, { roughness: 0.45 }));
    // RTL: climb from right to left
    m.position.set(9 - i * 5.8, hgt / 2, 0);
    shadows(m);
    g.add(m);
    return { m, top: hgt };
  });
  const glass = new THREE.Mesh(
    new RoundedBoxGeometry(6.5, 0.6, 6, 3, 0.2),
    new THREE.MeshPhysicalMaterial({ color: 0xd8f0ea, roughness: 0.08, transmission: 0.7, thickness: 1.2, clearcoat: 1 })
  );
  glass.position.set(-8, 6.4, 8.6);
  shadows(glass);
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 6.1, 12), mat(C.steel));
  legs.position.set(-8, 3.05, 8.6);
  g.add(glass, legs);

  const climber = actor(C.ok, 0.62);
  g.add(climber.group);

  const spots = [
    ...stepsGeo.map((s) => new THREE.Vector3(s.m.position.x, s.top, 0)),
    new THREE.Vector3(-8, 6.7, 8.6),
  ];
  climber.group.position.copy(spots[0]);
  iso.rows.forEach(([name], i) => {
    const holder = new THREE.Object3D();
    holder.position.copy(spots[i]).add(new THREE.Vector3(0, i === 4 ? 0.2 : 0.1, i === 4 ? 2.8 : 3.4));
    g.add(holder);
    st.pin(name, holder, [0, 0, 0], 'mono').classList.add('lvl');
  });

  const head = iso.cols.map((c) => `<th><span class="code">${c}</span></th>`).join('');
  const body = iso.rows.map(([n, v]) => `<tr><td>${n}</td>${v.map((x) => `<td class="${x ? 'yes' : 'no'}">${x ? '✓' : '✕'}</td>`).join('')}</tr>`).join('');
  const panel = st.panel(`
    <h1 class="h1">${iso.h1}</h1>
    <p class="lede">${iso.lede}</p>
    <table class="matrix"><thead><tr><th>سطح</th>${head}</tr></thead><tbody>${body}</tbody></table>
    <div class="callout ok note" style="font-size:2.7rem"></div>
  `);
  const trs = Array.from(panel.querySelectorAll('tbody tr'));
  const note = panel.querySelector('.note') as HTMLElement;

  ctx.frame((t) => { climber.ring.scale.setScalar(1 + Math.sin(t * 4) * 0.08); });

  return st.define({
    id: 'isolation', label: iso.label, chapter: CH.tools, steps: 5,
    caption: '✓ یعنی آن مشکل در این سطح رخ نمی‌دهد (SQL Server)',
    shot: (s) => s === 5 ? { pos: [-2, 22, 40], look: [-1, 4.5, 3], shift: 40, zoom: 1.3 } : { pos: [0, 19, 40], look: [0, 4.5, 1], shift: 40, zoom: 1.3 },
    apply: (step) => {
      trs.forEach((tr, i) => { tr.classList.toggle('on', i < step); tr.classList.toggle('cur', i === step - 1); });
      note.innerHTML = iso.notes[step - 1];
      gsap.fromTo(note, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      st.pins.forEach((p, i) => p.classList.toggle('on', i < step));
      const p = spots[step - 1];
      const tl = gsap.timeline();
      tl.to(climber.group.position, { y: p.y + 3, duration: 0.35, ease: 'power2.out' })
        .to(climber.group.position, { x: p.x, z: p.z, duration: 0.5, ease: 'none' }, '<')
        .to(climber.group.position, { y: p.y, duration: 0.35, ease: 'bounce.out' });
      stepsGeo.forEach((s, i) => {
        const em = (s.m.material as THREE.MeshPhysicalMaterial).emissive;
        const c = new THREE.Color(i === step - 1 ? 0x0c2a1f : 0x000000);
        gsap.to(em, { r: c.r, g: c.g, b: c.b, duration: 0.4 });
      });
    },
  });
}
