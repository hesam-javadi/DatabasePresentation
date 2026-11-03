import gsap from 'gsap';
import { Ctx, markSteps } from '../deck';
import { stage, v3 } from './base';
import { actor, slab, beam, label, burst, C } from '../three/props';
import { lost, CH, fa } from '../content';

/** Two users, one balance row: read, read, write, overwrite. */
export function lostScene(ctx: Ctx, index: number) {
  const st = stage(ctx, index);
  const g = st.group;

  const row = slab(10, 2, 6.4, fa(100), { size: 190 });
  row.group.position.set(0, 0, 0);
  g.add(row.group);
  const caption = label('موجودی', { w: 512, h: 160, size: 80, color: '#46526d', scale: 2.2 });
  caption.position.set(0, 3.4, -3.8);
  g.add(caption);

  const A = actor(C.a), B = actor(C.b);
  A.group.position.set(-12, 0, 5); A.group.rotation.y = 0.9;
  B.group.position.set(12, 0, 5); B.group.rotation.y = -0.9;
  g.add(A.group, B.group);

  const tagA = label(fa(100), { w: 384, h: 192, size: 110, bg: '#ffffff', color: '#2457d6', stroke: '#2457d6', scale: 2.4 });
  const tagB = label(fa(100), { w: 384, h: 192, size: 110, bg: '#ffffff', color: '#c2185b', stroke: '#c2185b', scale: 2.4 });
  tagA.position.set(-12, 9, 5); tagB.position.set(12, 9, 5);
  g.add(tagA, tagB);

  const top = v3(0, 2.3, 0);
  const readA = beam(C.a), readB = beam(C.b), writeA = beam(C.a, 0.3), writeB = beam(C.b, 0.3);
  readA.set(top, v3(-12, 6.2, 5), 5); readB.set(top, v3(12, 6.2, 5), 5);
  writeA.set(v3(-12, 6.2, 5), top, 7); writeB.set(v3(12, 6.2, 5), top, 7);
  g.add(readA.mesh, readB.mesh, writeA.mesh, writeB.mesh);

  const panel = st.panel(`
    <div class="term">${lost.term}</div>
    <h1 class="h1">${lost.h1}</h1>
    <ul class="steps">${lost.steps.map((s) => `<li>${s}</li>`).join('')}</ul>
    <div class="lanes">
      <div class="lane a"><span class="who k-a">الف</span><span class="cell" data-k="2">خواند ۱۰۰</span><span class="cell" data-k="9"></span><span class="cell" data-k="3">نوشت ۱۵۰</span><span class="cell" data-k="9"></span></div>
      <div class="lane b"><span class="who k-b">ب</span><span class="cell" data-k="9"></span><span class="cell" data-k="2">خواند ۱۰۰</span><span class="cell" data-k="9"></span><span class="cell" data-k="4">نوشت ۸۰</span></div>
    </div>
    <div class="callout bad fixbox" style="opacity:0">${lost.verdict}</div>
  `);
  panel.style.top = '14rem';
  const list = panel.querySelector('.steps') as HTMLElement;
  const fixbox = panel.querySelector('.fixbox') as HTMLElement;
  const cells = Array.from(panel.querySelectorAll<HTMLElement>('.cell'));

  const fixPanel = st.panel(`
    <div class="sql"><span class="cm">-- read-modify-write in the app (unsafe)</span>
balance = <span class="kw">SELECT</span> Balance ...
<span class="kw">UPDATE</span> Account <span class="kw">SET</span> Balance = <span class="hl">@newBalance</span>

<span class="cm">-- let the statement do the math (safe)</span>
<span class="kw">UPDATE</span> Account <span class="kw">SET</span> Balance = <span class="hl">Balance + 50</span>
<span class="kw">WHERE</span> Id = @id</div>`, 'band');
  fixPanel.dataset.manual = '1';
  fixPanel.style.cssText = 'left:10rem;right:auto;width:84rem;bottom:13rem';

  ctx.frame((t) => {
    A.body.position.y = 2.3 + Math.sin(t * 2) * 0.12;
    B.body.position.y = 2.3 + Math.sin(t * 2 + 1) * 0.12;
  });

  return st.define({
    id: 'lost', label: lost.label, chapter: CH.problems, steps: 4,
    caption: 'نمایشی: دو جلسهٔ هم‌زمان روی یک حساب',
    shot: (s) => s < 4
      ? { pos: [0, 19, 38], look: [0, 3.5, 1], shift: 40 }
      : { pos: [0, 24, 36], look: [0, -6, 2], shift: 40 },
    apply: (step, a) => {
      markSteps(list, step);
      cells.forEach((c) => {
        const k = +c.dataset.k!;
        c.classList.toggle('on', k <= step);
        c.classList.toggle('lost', k === 3 && step >= 4);
      });
      readA.grow(step >= 2 ? 1 : 0, 0.8);
      readB.grow(step >= 2 ? 1 : 0, 0.8);
      writeA.grow(step === 3 ? 1 : 0, 0.8);
      writeB.grow(step >= 4 ? 1 : 0, 0.8);
      gsap.to([tagA.material, tagB.material], { opacity: step >= 2 ? 1 : 0, duration: 0.5 });

      tagA.userData.set(step >= 3 ? fa(150) : fa(100));
      tagB.userData.set(step >= 4 ? fa(80) : fa(100));
      const value = step >= 4 ? fa(80) : step === 3 ? fa(150) : fa(100);
      const color = step >= 4 ? '#c2185b' : step === 3 ? '#2457d6' : '#13203a';
      gsap.delayedCall(step >= 3 ? 0.7 : 0, () => row.setText(value, color));
      if (step === 4 && a.dir > 0 && !a.arriving) gsap.delayedCall(0.7, () => burst(g, v3(-12, 9, 5), C.fault));
      gsap.to(tagA.scale, { x: step >= 4 ? 0.01 : 4.8, y: step >= 4 ? 0.01 : 2.4, duration: 0.4, delay: step >= 4 ? 0.7 : 0 });

      gsap.to(row.group.position, { y: step >= 3 ? 0.6 : 0, duration: 0.3, yoyo: true, repeat: 1 });
      gsap.to(fixbox, { opacity: step >= 4 ? 1 : 0, duration: 0.5, delay: step >= 4 ? 0.9 : 0 });
      if (step === 4) { fixPanel.classList.add('on'); gsap.to(fixPanel, { opacity: 1, duration: 0.6, delay: 1.2 }); }
      else gsap.to(fixPanel, { opacity: 0, duration: 0.3, onComplete: () => fixPanel.classList.remove('on') });
    },
    leave: () => { gsap.to(fixPanel, { opacity: 0, duration: 0.3, onComplete: () => fixPanel.classList.remove('on') }); },
  });
}

