import gsap from 'gsap';
import { newSlide, Slide } from '../core/deck';
import { h, screenBox } from '../core/dom';
import { DbTable } from '../kit/table';

const POINTER = `<svg viewBox="0 0 24 28" class="ptr" aria-hidden="true"><path d="M2 1.5v21.5l5.6-5.2 3.7 8.4 3.6-1.6-3.6-8.2h7.8z" fill="var(--c)" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

/** Two multiplayer cursors land on the same cell of a table; the cell can't decide what it holds. */
export function titleSlide(stage: HTMLElement): Slide {
  const { el, master, step } = newSlide(stage, 's-title');

  const text = h('div', 'title-text', `
    <div class="kicker">یک گفت‌وگوی فنی دربارهٔ هم‌زمانی</div>
    <h1>مشکلات پایگاه دادهٔ <span class="duo">چندکاربره</span> در دنیای واقعی</h1>
    <p>وقتی دو نفر در یک لحظه به یک ردیف دست می‌زنند: از آخرین صندلی پرواز تا پردازش صدها هزار آیتم هم‌زمان.</p>
    <div class="meta"><span>SQL Server</span><i></i><span>RabbitMQ</span><i></i><span>pep-mms</span></div>
  `, el);

  const wrap = h('div', 'title-3d', '', el);
  const tilt = h('div', 'tilt', '', wrap);
  const table = new DbTable(el, {
    name: 'dbo.Accounts', x: 0, y: 0, rowH: 82,
    cols: [
      { key: 'id', label: 'Id', w: 120, kind: 'mono', pk: true },
      { key: 'owner', label: 'Owner', w: 230 },
      { key: 'bal', label: 'Balance', w: 230, kind: 'num' },
    ],
    rows: [
      { id: '1', owner: 'علی', bal: '1,240' },
      { id: '2', owner: 'مریم', bal: '880' },
      { id: '3', owner: 'سارا', bal: '100' },
      { id: '4', owner: 'رضا', bal: '2,400' },
      { id: '5', owner: 'نیما', bal: '730' },
    ],
  }, tilt);

  // the contested cell flickers between the two writers' values
  const cellEl = table.cellEl('3', 'bal');
  const flick = h('div', 'flick', '<span class="fa t-t1">150</span><span class="fb t-t2">80</span>', cellEl);
  const ring = h('div', 'duo-ring', '', cellEl);
  const orig = cellEl.querySelector('.v') as HTMLElement;
  gsap.set([flick, ring], { opacity: 0 });

  const target = screenBox(cellEl, stage);
  const cursors = [
    { tone: 't1', name: 'سارا', from: { x: 1180, y: 1120 }, to: { x: target.r - 58, y: target.cy + 4 }, via: { x: 900, y: 860 } },
    { tone: 't2', name: 'رضا', from: { x: -120, y: 120 }, to: { x: target.x + 22, y: target.cy - 12 }, via: { x: 160, y: 380 } },
  ].map((c) => {
    const cur = h('div', `cursor t-${c.tone}`, `<div class="cur-in">${POINTER}<span class="cur-name">${c.name}</span></div>`, el);
    gsap.set(cur, { x: c.from.x, y: c.from.y });
    const ripple = h('div', `ripple t-${c.tone}`, '', el);
    gsap.set(ripple, { x: c.to.x, y: c.to.y, xPercent: -50, yPercent: -50, opacity: 0, scale: 0.2 });
    return { ...c, cur, ripple };
  });

  step((t) => {
    t.fromTo(table.el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', immediateRender: false }, 0)
      .fromTo(table.el.querySelectorAll('.tr'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out', immediateRender: false }, 0.25)
      .fromTo(text.children, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', immediateRender: false }, 0.35);
    cursors.forEach((c, i) => {
      const p = { k: 0 };
      t.to(p, {
        k: 1, duration: 1.5, ease: 'power3.inOut',
        onUpdate() {
          const k = p.k, q = 1 - k;
          gsap.set(c.cur, { x: q * q * c.from.x + 2 * q * k * c.via.x + k * k * c.to.x, y: q * q * c.from.y + 2 * q * k * c.via.y + k * k * c.to.y });
        },
      }, 0.9 + i * 0.12);
      t.fromTo(c.ripple, { opacity: 0.9, scale: 0.2 }, { opacity: 0, scale: 1.6, duration: 0.8, ease: 'power2.out', immediateRender: false }, 2.55 + i * 0.05);
    });
    t.to(orig, { opacity: 0, duration: 0.2 }, 2.6)
      .to([flick, ring], { opacity: 1, duration: 0.3 }, 2.6);
  });

  return { id: 'title', chapter: '', label: 'عنوان', steps: 1, el, tl: master };
}
