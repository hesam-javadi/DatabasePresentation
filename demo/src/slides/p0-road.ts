import gsap from 'gsap';
import { build } from '../core/build';
import { h } from '../core/dom';
import { ICON } from '../kit/icons';
import { CH } from './common';

const STATIONS = [
  { tone: 't1', icon: ICON.db, name: 'پایه‌ها', desc: 'تراکنش، هم‌زمانی، قفل' },
  { tone: 'bad', icon: ICON.bolt, name: 'مشکلات', desc: 'شش اشکال کلاسیک، با مثال‌های دانشگاه' },
  { tone: 'v', icon: ICON.shield, name: 'ابزارها', desc: 'سطوح جداسازی و سه روش کنترل' },
  { tone: 'ok', icon: ICON.refresh, name: 'یک سامانهٔ واقعی', desc: 'پردازش صدها هزار آیتم هم‌زمان' },
  { tone: 't3', icon: ICON.check, name: 'خطرها و جمع‌بندی', desc: 'آنچه در سناریوهای مشابه می‌شکند' },
];

/** Advance organizer: the five parts of the talk, one per click. */
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
  b.s('امروز از ساده‌ترین تعریف شروع می‌کنیم و به یک سامانهٔ واقعی می‌رسیم.', (t) => t.to(line, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }));
  const say = [
    'اول زبان مشترک: تراکنش چیست، هم‌زمانی یعنی چه، و قفل چه می‌کند.',
    'بعد شش مشکل کلاسیک، هر کدام با یک ماجرای آشنا از دانشگاه و بعد روی خود جدول.',
    'سپس ابزارها: سطوح جداسازی و سه روش برای کنترل هم‌زمانی.',
    'بعد یک سامانهٔ واقعی: چرا ساخته شد، چطور کار می‌کند و چه مشکلات هم‌زمانی‌ای داشت.',
    'و در پایان، خطرهای سناریوهای مشابه و پنج قانون.',
  ];
  st.forEach((e, i) => b.show(say[i], e, undefined, { y: 30 }));
  return b.done();
}
