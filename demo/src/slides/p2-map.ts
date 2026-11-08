import { build } from '../core/build';
import { h } from '../core/dom';
import { note } from '../kit/parts';
import { CH, PROBLEMS } from './common';

const FA = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

/** Part 2 opener: the seven numbered problems, so the audience always knows where they are. */
export function problemMap(stage: HTMLElement) {
  const b = build(stage, { id: 'pmap', chapter: CH.problems, label: 'هفت مشکل', title: 'هفت مشکل، یکی‌یکی' });
  const lines = [
    'دو ثبت‌نام هم‌زمان، یک صندلی',
    'Read کردنِ تغییری که Commit نشده',
    'دو Read در یک Transaction، دو جواب',
    'ردیفی که وسط کار پیدا می‌شود',
    'هر دو درست، با هم غلط',
    'هر کدام منتظرِ دیگری',
    'همه پشت یک ردیف',
  ];
  const grid = h('div', 'pmap', '', b.el);
  const cards = PROBLEMS.map((name, i) => h('div', `pm${i >= 1 && i <= 3 ? ' pm-iso' : ''}`, `<span class="pm-n">${FA(i + 1)}</span><div><b dir="ltr">${name}</b><small>${lines[i]}</small></div>`, grid));
  const iso = note(b.el, 'راه‌حلِ مشکل‌های <b>۲ تا ۴</b> یک ابزار است: <b>Isolation Level</b>. آن را یک‌جا در <b>بخش ۳</b> می‌بینیم.', 'v', 560, 846, 800);
  iso.el.classList.add('one');
  b.show('در این بخش، هفت مشکل را به ترتیب می‌بینیم. هر کدام: یک <b>ماجرا</b>، همان ماجرا <b>روی جدول</b>، و <b>راه‌حل</b>.', cards, undefined, { stagger: 0.09 })
    .s('بالای هر اسلاید، شمارهٔ مشکل را می‌بینید.', (t) => { t.add(iso.show()); cards.forEach((c, i) => { if (i >= 1 && i <= 3) t.to(c, { borderColor: '#6d3fd9', duration: 0.4 }, 0.2); }); });
  return b.done();
}
