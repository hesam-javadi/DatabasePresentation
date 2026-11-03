import gsap from 'gsap';
import { newSlide, Slide } from '../core/deck';
import { h, show } from '../core/dom';
import { frame, arrow, note, tag } from '../kit/parts';
import { ICON } from '../kit/icons';
import { itemsTable, worker, CLAIM_SQL, ITEMS } from './items';

const CH = 'بخش سوم · یک مورد واقعی';
const MSG = `<span class="msg">${ICON.mail} item=42 seen=0</span>`;

/** Duplicate deliveries: three instances race for item 42; the conditional UPDATE picks one. */
export function claimSlide(stage: HTMLElement): Slide {
  const { el, master, step } = newSlide(stage, 's-claim');
  const f = frame(el, 'یک آیتم، یک صاحب', 'Claim · Conditional UPDATE');
  const table = itemsTable(el, [
    { id: '41', status: 'Succeeded', att: '1', tok: 'NULL', until: 'NULL' },
    { id: '42', status: 'Queued', att: '0', tok: 'NULL', until: 'NULL' },
    { id: '43', status: 'Queued', att: '0', tok: 'NULL', until: 'NULL' },
    { id: '44', status: 'Processing', att: '1', tok: 'a1b2', until: '12:00:41' },
  ]);
  const code = h('div', 'code-panel', `<label>دستور تصاحب؛ هر سه نمونه همین را می‌فرستند</label><pre dir="ltr">${CLAIM_SQL}</pre>`, el);
  code.style.cssText = `left:${ITEMS.x}px;top:728px;width:880px`;

  const ws = [worker(el, 't1', 1, 262, MSG), worker(el, 't2', 2, 466, MSG), worker(el, 't3', 3, 670, MSG)];
  const edge = table.edge('42', 'right', 10);
  const outs = [10, 140, 236];
  const arrows = ws.map((w, i) => arrow(f, w.side('left', -40), { x: edge.x + outs[i], y: edge.y }, (['t1', 't2', 't3'] as const)[i], { bend: i === 0 ? 0.12 : i === 1 ? 0.04 : -0.1 }));

  const above = { x: table.cell('42', 'status').x, y: table.rowY('42') - 30 };
  const ok = tag(el, `<span dir="ltr">Status = 'Queued' AND AttemptCount = 0</span> ${ICON.check}`, 'ok mono check', above);
  const no = tag(el, `<span dir="ltr">Status = 'Processing' ≠ 'Queued'</span> ${ICON.cross}`, 'bad mono check', above);
  gsap.set([ok, no], { opacity: 0 });
  const outcome = note(el, 'بدون قفل صریح و بدون تراکنش طولانی؛ <b>همان الگوی صندلی 14C</b>.', 'ok', ITEMS.x, 940, 880);
  outcome.el.classList.add('one');

  step((t) => {
    t.add(f.narr.to('صف «دست‌کم یک‌بار» تحویل می‌دهد: پیام آیتم ۴۲ به <b>سه</b> نمونهٔ سرویس رسیده (تحویل دوباره بعد از یک قطعی).'), 0.1)
      .add(show(table.el, { y: 30 }), 0)
      .add(show(code, { y: 20 }), 0.25)
      .add(show(ws.map((w) => w.el), { x: 60, y: 0, stagger: 0.15 }), 0.3)
      .add(table.focus('42', true), 1.0);
  });

  step((t) => {
    t.add(f.narr.to('هر سه هم‌زمان همان UPDATE را می‌فرستند. <span class="k1">api-1</span> زودتر قفل را می‌گیرد و شرط برقرار است.'), 0);
    arrows.forEach((a, i) => t.add(a.draw(0.55), 0.2 + i * 0.07));
    ws.forEach((w) => t.add(w.state('run', 'UPDATE'), 0.2));
    t.add(table.lock('42', 't1', 'W1', 'X', 'right'), 0.8)
      .add(table.wait('42', 't2', 'W2', 'right', 140), 0.95)
      .add(table.wait('42', 't3', 'W3', 'right', 236), 1.05)
      .add(ws[1].state('wait', 'منتظر'), 1.0)
      .add(ws[2].state('wait', 'منتظر'), 1.1)
      .add(table.mark('42', 'status', 't1'), 1.3)
      .add(table.mark('42', 'att', 't1'), 1.3)
      .fromTo(ok, { opacity: 0, y: above.y + 12 }, { opacity: 1, y: above.y, duration: 0.4, immediateRender: false }, 1.4)
      .add(table.set('42', 'status', 'Processing', { wet: 't1' }), 2.0)
      .add(table.set('42', 'tok', '7f3a', { wet: 't1' }), 2.15)
      .add(table.set('42', 'until', '12:00:30', { wet: 't1' }), 2.3)
      .to(ok, { opacity: 0, duration: 0.3 }, 2.8)
      .add(ws[0].msg('(1 row affected)', 'ok'), 2.4)
      .add(arrows[0].hide(), 2.6);
  });

  step((t) => {
    t.add(f.narr.to('قفل آزاد می‌شود. بقیه شرط را <b>دوباره</b> می‌سنجند: دیگر Queued نیست. <b class="kbad">۰ ردیف</b>؛ پیامشان را دور می‌اندازند.'), 0)
      .add(table.dry('42'), 0.2)
      .add(table.unlock('42', 't1'), 0.4)
      .add(table.mark('42', 'att', 't1', false), 0.4)
      .add(ws[0].state('ok', 'صاحب آیتم'), 0.6)
      .add(arrows[1].hide(), 0.8)
      .add(table.unwait('42', 't2'), 0.8)
      .add(table.lock('42', 't2', 'W2', 'X', 'right'), 1.0)
      .fromTo(no, { opacity: 0, y: above.y + 12 }, { opacity: 1, y: above.y, duration: 0.4, immediateRender: false }, 1.4)
      .add(ws[1].msg('(0 rows affected)', 'bad'), 1.7)
      .add(table.unlock('42', 't2'), 1.9)
      .add(arrows[2].hide(), 2.2)
      .add(table.unwait('42', 't3'), 2.2)
      .add(table.lock('42', 't3', 'W3', 'X', 'right'), 2.4)
      .add(ws[2].msg('(0 rows affected)', 'bad'), 2.9)
      .add(table.unlock('42', 't3'), 3.1)
      .to(no, { opacity: 0, duration: 0.3 }, 3.3)
      .add(table.mark('42', 'status', 't1', false), 3.3)
      .add(ws[1].mem('msg', `<span class="msg gone">${ICON.trash} ack · discarded</span>`), 3.4)
      .add(ws[2].mem('msg', `<span class="msg gone">${ICON.trash} ack · discarded</span>`), 3.5)
      .add(ws[1].state('idle', 'کنار رفت'), 3.4)
      .add(ws[2].state('idle', 'کنار رفت'), 3.5);
  });

  step((t) => {
    t.add(f.narr.to('یک آیتم، یک صاحب. داور، <b>پایگاه داده</b> است؛ نه حافظهٔ هیچ نمونه‌ای.'), 0)
      .add(ws[1].dim(true), 0.2)
      .add(ws[2].dim(true), 0.3)
      .add(outcome.show(), 0.6);
  });

  return { id: 'claim', chapter: CH, label: 'تصاحب آیتم', steps: 4, group: 'items', el, tl: master };
}
