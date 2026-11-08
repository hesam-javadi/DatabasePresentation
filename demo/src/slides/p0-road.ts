import gsap from 'gsap';
import { build } from '../core/build';
import { h } from '../core/dom';
import { ICON } from '../kit/icons';
import { CH } from './common';

const STATIONS = [
  { tone: 't1', icon: ICON.db, name: 'پایه‌ها', desc: 'Transaction، هم‌زمانی، Lock' },
  { tone: 'bad', icon: ICON.bolt, name: 'مشکلات', desc: 'هفت مشکل، با مثال‌های دانشگاه' },
  { tone: 'v', icon: ICON.shield, name: 'ابزارها', desc: 'Isolation Level و سه روش کنترل' },
  { tone: 'ok', icon: ICON.refresh, name: 'یک سامانهٔ واقعی', desc: 'پردازش صدها هزار آیتم هم‌زمان' },
  { tone: 't3', icon: ICON.check, name: 'خطرها و جمع‌بندی', desc: 'آنچه در سناریوهای مشابه می‌شکند' },
];

/** Advance organizer: the five parts of the talk. */
export function roadSlide(stage: HTMLElement) {
  const b = build(stage, { id: 'road', chapter: CH.open, label: 'نقشهٔ راه', title: 'نقشهٔ راه' });
  const road = h('div', 'road', '', b.el);
  const line = h('div', 'road-line', '', road);
  gsap.set(line, { scaleX: 0, transformOrigin: 'right center' });
  const st = STATIONS.map((s, i) => {
    const e = h('div', `station t-${s.tone}`, `<div class="dot">${s.icon}</div><i>بخش ${'۱۲۳۴۵'[i]}</i><b>${s.name}</b><span>${s.desc}</span>`, road);
    e.style.right = `${i * 350}px`;
    return e;
  });
  b.show('امروز در پنج بخش، از ساده‌ترین تعریف شروع می‌کنیم و به یک سامانهٔ واقعی می‌رسیم.', st, (t) => t.to(line, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0), { y: 30, stagger: 0.25 });
  return b.done();
}
