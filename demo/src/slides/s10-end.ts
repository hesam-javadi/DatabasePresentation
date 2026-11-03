import { newSlide, Slide } from '../core/deck';
import { h, show } from '../core/dom';
import { ICON } from '../kit/icons';

const RULES = [
  ['شرط را داخل <code>UPDATE</code> بگذارید، نه در کد', 'بررسی و نوشتن یک کار اتمی شود.'],
  ['قفل بی‌انقضا نگیرید؛ اجاره بگیرید', 'زمان‌دار، با توکن، با ضربان.'],
  ['هر نوشتن را با توکن مالکیت شرطی کنید', 'نتیجهٔ کهنهٔ کارگر زامبی رد می‌شود.'],
  ['فرض کنید هر پیام دو بار می‌رسد', 'تکرار باید بی‌اثر باشد.'],
  ['تراکنش کوتاه، ترتیب ثابت، تلاش دوباره با تأخیر', 'بن‌بست کم می‌شود و طوفان تلاش دوباره نمی‌گیرد.'],
];

/** Closing: the five rules, and the one sentence to remember. */
export function endSlide(stage: HTMLElement): Slide {
  const { el, master, step } = newSlide(stage, 's-end');
  const head = h('div', 'end-head', `<div class="kicker">جمع‌بندی</div><h1>داور، پایگاه داده است</h1>`, el);
  const list = h('ol', 'rules', RULES.map(([a, b]) => `<li><span class="n">${ICON.check}</span><div><b>${a}</b><small>${b}</small></div></li>`).join(''), el);
  const quote = h('div', 'end-quote', 'هم‌زمانی را نمی‌شود حذف کرد؛ فقط می‌شود طوری طراحی کرد که وقتی رخ داد، <b>پایگاه داده حَکَم باشد</b>.', el);
  const qa = h('div', 'end-qa', 'پرسش و پاسخ', el);

  step((t) => {
    t.add(show(head, { y: 30, dur: 0.7 }), 0)
      .add(show(Array.from(list.children), { y: 24, stagger: 0.14 }), 0.4)
      .add(show(quote, { y: 20 }), 1.4)
      .add(show(qa, { y: 10 }), 1.8);
  });

  return { id: 'end', chapter: '', label: 'جمع‌بندی', steps: 1, el, tl: master };
}
