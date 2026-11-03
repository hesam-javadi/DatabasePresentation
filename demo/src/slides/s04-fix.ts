import gsap from 'gsap';
import { newSlide, Slide } from '../core/deck';
import { show } from '../core/dom';
import { frame, arrow, note, tag } from '../kit/parts';
import { seatTable, seatCards, seatLanes, SQL } from './seats';
import { ICON } from '../kit/icons';

const CH = 'بخش اول · مشکلات';

/** The fix: the check moves into the UPDATE. Shows the X lock, a blocked writer, and the re-check. */
export function fixSlide(stage: HTMLElement): Slide {
  const { el, master, step } = newSlide(stage, 's-fix');
  const f = frame(el, 'شرط را به خود UPDATE بسپارید', 'Conditional UPDATE');
  const table = seatTable(el);
  const mem = [{ key: '@@ROWCOUNT' }];
  const { sara, reza } = seatCards(el, mem, [SQL.cond('سارا'), SQL.cond('رضا')]);
  const lanes = seatLanes(el, 7);

  const rowR = table.edge('14C', 'right', 10), rowL = table.edge('14C', 'left', 10);
  const s1 = arrow(f, sara.side('left', 40), rowR, 't1', { bend: 0.12 });
  const r1 = arrow(f, reza.side('right', 40), { x: rowL.x - 84, y: rowL.y }, 't2', { bend: -0.12 });

  // the WHERE check, shown above the row while a statement evaluates it
  const above = { x: table.cell('14C', 'status').x, y: table.rowY('14C') - 34 };
  const okCheck = tag(el, `<span dir="ltr">Status = 'Free'</span> ${ICON.check}`, 'ok mono check', above);
  const noCheck = tag(el, `<span dir="ltr">Status = 'Booked' ≠ 'Free'</span> ${ICON.cross}`, 'bad mono check', above);
  const outcome = note(el, 'یک برنده، یک پیام روشن؛ بدون تراکنش طولانی و بدون قفل صریح در کد.', 'ok', 560, 738, 800);
  outcome.el.classList.add('one');

  step((t) => {
    t.add(f.narr.to('به‌جای «بخوان، تصمیم بگیر، بنویس»: <b>یک دستور</b>، و شرط داخل خود <code>WHERE</code>.'), 0.1)
      .add(show(table.el, { y: 30 }), 0)
      .add(show([sara.el, reza.el], { y: 30, stagger: 0.12 }), 0.15)
      .add(show(lanes.el, { y: 20 }), 0.35)
      .add(table.focus('14C', true), 0.9)
      .add(table.mark('14C', 'status', 'ink'), 1.1);
  });

  step((t) => {
    t.add(f.narr.to('سارا اول می‌رسد: قفل <b class="k1">X</b> می‌گیرد، شرط برقرار است و <b>۱ ردیف</b> تغییر می‌کند.'), 0)
      .add(sara.state('run', 'در حال اجرا'), 0)
      .add(s1.draw(), 0.2)
      .add(table.lock('14C', 't1', 'T1', 'X', 'right'), 0.75)
      .fromTo(okCheck, { opacity: 0, y: above.y + 14 }, { opacity: 1, y: above.y, duration: 0.4, immediateRender: false }, 1.3)
      .add(table.set('14C', 'status', 'Booked', { wet: 't1' }), 1.9)
      .add(table.set('14C', 'pax', 'سارا', { wet: 't1' }), 2.05)
      .to(okCheck, { opacity: 0, duration: 0.3 }, 2.7)
      .add(sara.mem('@@ROWCOUNT', '1'), 2.3)
      .add(sara.msg('(1 row affected)', 'ok'), 2.3)
      .add(lanes.ev(0, 1, 'UPDATE → 1 row'), 2.3)
      .add(s1.hide(), 2.6);
  });

  step((t) => {
    t.add(f.narr.to('دستور رضا به ردیفِ قفل‌شده می‌رسد و <b>منتظر می‌ماند</b>؛ نه خطا می‌گیرد، نه چیزی را بازنویسی می‌کند.'), 0)
      .add(reza.state('wait', 'منتظر قفل'), 0.2)
      .add(r1.draw(), 0.2)
      .add(table.wait('14C', 't2', 'T2', 'left', 18), 0.75)
      .add(lanes.ev(1, 2, `${ICON.hourglass} WAIT`, { cls: 'wait', span: 2 }), 0.8);
  });

  step((t) => {
    t.add(f.narr.to('سارا commit می‌کند. رضا قفل را می‌گیرد و شرط را <b>دوباره</b> می‌سنجد: دیگر آزاد نیست. <b class="kbad">۰ ردیف</b>.'), 0)
      .add(sara.exec(SQL.commit), 0)
      .add(table.dry('14C'), 0.3)
      .add(table.unlock('14C', 't1'), 0.5)
      .add(lanes.ev(0, 3, 'COMMIT'), 0.5)
      .add(sara.state('ok', 'رزرو شد'), 0.8)
      .add(r1.hide(), 1.0)
      .add(table.unwait('14C', 't2'), 1.1)
      .add(table.lock('14C', 't2', 'T2', 'X', 'left'), 1.3)
      .add(reza.state('run', 'در حال اجرا'), 1.3)
      .fromTo(noCheck, { opacity: 0, y: above.y + 14 }, { opacity: 1, y: above.y, duration: 0.4, immediateRender: false }, 1.9)
      .to(table.cellEl('14C', 'status'), { x: 6, duration: 0.07, yoyo: true, repeat: 5 }, 2.1)
      .add(reza.mem('@@ROWCOUNT', '0', 'zero'), 2.6)
      .add(reza.msg('(0 rows affected)', 'bad'), 2.6)
      .add(lanes.ev(1, 4, 'UPDATE → 0 rows'), 2.6)
      .add(table.unlock('14C', 't2'), 3.0)
      .to(noCheck, { opacity: 0, duration: 0.3 }, 3.4);
  });

  step((t) => {
    t.add(f.narr.to('بین بررسی و نوشتن هیچ فاصله‌ای نیست: <b>شرط و تغییر، یک کار اتمی‌اند.</b>'), 0)
      .add(reza.state('idle', 'پیام به کاربر'), 0.2)
      .add(reza.msg('این صندلی همین الان رزرو شد؛ صندلی دیگری انتخاب کنید.', 'ink', false), 0.3)
      .add(table.mark('14C', 'status', 'ink', false), 0.2)
      .add(outcome.show(), 0.8);
  });

  gsap.set([okCheck, noCheck], { opacity: 0 });
  return { id: 'fix', chapter: CH, label: 'UPDATE شرطی', steps: 5, group: 'seat', el, tl: master };
}
