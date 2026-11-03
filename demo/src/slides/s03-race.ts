import { newSlide, Slide } from '../core/deck';
import { show } from '../core/dom';
import { frame, arrow, fly, note } from '../kit/parts';
import { seatTable, seatCards, seatLanes, SQL } from './seats';

const CH = 'بخش اول · مشکلات';

/** The check-then-act race on the real row, step by step. */
export function raceSlide(stage: HTMLElement): Slide {
  const { el, master, step } = newSlide(stage, 's-race');
  const f = frame(el, 'دو رزرو، یک صندلی', 'Lost Update');
  const table = seatTable(el);
  const { sara, reza } = seatCards(el, [{ key: 'status' }], [SQL.logic, SQL.logic]);
  const lanes = seatLanes(el, 7);
  const verdict = note(el, 'دو پیام «رزرو شد»، یک صندلی؛ و هیچ خطایی در لاگ نیست.', 'bad', 560, 738, 800);
  verdict.el.classList.add('one');

  // request arrows: card edge → row edge
  const rowR = table.edge('14C', 'right', 10), rowL = table.edge('14C', 'left', 10);
  const s1 = arrow(f, sara.side('left', 30), rowR, 't1', { bend: 0.12 });
  const r1 = arrow(f, reza.side('right', 30), rowL, 't2', { bend: -0.12 });
  const s2 = arrow(f, sara.side('left', 60), rowR, 't1', { bend: 0.12 });
  const r2 = arrow(f, reza.side('right', 60), rowL, 't2', { bend: -0.12 });

  step((t) => {
    t.add(f.narr.to('صندلی <code>14C</code> آزاد است. هر دو جلسه یک کد را اجرا می‌کنند: <b>بخوان؛ اگر آزاد بود، رزرو کن.</b>'), 0.1)
      .add(show(table.el, { y: 30 }), 0)
      .add(show([sara.el, reza.el], { y: 30, stagger: 0.12 }), 0.15)
      .add(show(lanes.el, { y: 20 }), 0.35)
      .add(table.focus('14C', true), 0.9);
  });

  // T1 reads
  step((t) => {
    t.add(f.narr.to('سارا وضعیت را می‌خواند: <b>Free</b>. این مقدار حالا در حافظهٔ برنامهٔ اوست، نه در پایگاه داده.'), 0)
      .add(sara.exec(SQL.select), 0)
      .add(sara.state('run', 'در حال اجرا'), 0)
      .add(s1.draw(), 0.3)
      .add(table.flash('14C', 't1', 0.6), 0.85)
      .add(fly(f, table.cell('14C', 'status'), sara.memPos('status'), "'Free'", 't1', { arc: -0.35 }), 1.0)
      .add(sara.mem('status', "<span class=\"str\">'Free'</span>"), 2.0)
      .add(lanes.ev(0, 1, 'SELECT → Free'), 2.0)
      .add(s1.hide(), 2.2);
  });

  // T2 reads
  step((t) => {
    t.add(f.narr.to('۱۵ میلی‌ثانیه بعد، رضا هم می‌خواند. هنوز <b>Free</b> است؛ هر دو یک چیز را باور دارند.'), 0)
      .add(reza.exec(SQL.select), 0)
      .add(reza.state('run', 'در حال اجرا'), 0)
      .add(r1.draw(), 0.3)
      .add(table.flash('14C', 't2', 0.6), 0.85)
      .add(fly(f, table.cell('14C', 'status'), reza.memPos('status'), "'Free'", 't2', { arc: -0.35 }), 1.0)
      .add(reza.mem('status', "<span class=\"str\">'Free'</span>"), 2.0)
      .add(lanes.ev(1, 2, 'SELECT → Free'), 2.0)
      .add(r1.hide(), 2.2);
  });

  // T1 writes: X lock + uncommitted ("wet") values
  step((t) => {
    t.add(f.narr.to('سارا رزرو می‌کند. <code>UPDATE</code> روی ردیف قفل <b class="k1">X</b> (انحصاری) می‌گذارد؛ مقدار تازه هنوز commit نشده است.'), 0)
      .add(sara.exec(SQL.update('سارا')), 0)
      .add(s2.draw(), 0.3)
      .add(table.lock('14C', 't1', 'T1', 'X', 'right'), 0.85)
      .add(table.set('14C', 'status', 'Booked', { wet: 't1' }), 1.4)
      .add(table.set('14C', 'pax', 'سارا', { wet: 't1' }), 1.55)
      .add(lanes.ev(0, 3, 'UPDATE'), 1.5)
      .add(s2.hide(), 1.9);
  });

  // T1 commits
  step((t) => {
    t.add(f.narr.to('سارا commit می‌کند: جوهر خشک می‌شود و قفل آزاد می‌شود. اپ به سارا می‌گوید: <b class="kok">رزرو شد</b>.'), 0)
      .add(sara.exec(SQL.commit), 0)
      .add(table.dry('14C'), 0.4)
      .add(table.unlock('14C', 't1'), 0.7)
      .add(lanes.ev(0, 4, 'COMMIT'), 0.6)
      .add(sara.state('ok', 'رزرو شد'), 1.0)
      .add(sara.msg('(1 row affected)', 'ok'), 1.1);
  });

  // T2 writes with a stale belief
  step((t) => {
    t.add(f.narr.to('رضا هنوز <b>Free</b> را در حافظه دارد؛ مقداری که دیگر درست نیست. او هم رزرو می‌کند و نام سارا را <b class="kbad">بازنویسی</b> می‌کند.'), 0)
      .add(reza.stale('status', true), 0.2)
      .add(reza.exec(SQL.update('رضا')), 0.3)
      .add(r2.draw(), 0.8)
      .add(table.lock('14C', 't2', 'T2', 'X', 'left'), 1.3)
      .add(table.set('14C', 'pax', 'رضا', { wet: 't2', knock: true }), 1.85)
      .add(lanes.ev(1, 5, 'UPDATE'), 1.9)
      .add(r2.hide(), 2.3)
      .add(reza.exec(SQL.commit), 2.6)
      .add(table.dry('14C'), 2.9)
      .add(table.unlock('14C', 't2'), 3.1)
      .add(lanes.ev(1, 6, 'COMMIT'), 3.0)
      .add(reza.state('ok', 'رزرو شد'), 3.4)
      .add(reza.msg('(1 row affected)', 'ok'), 3.5);
  });

  // reveal: the danger window
  step((t) => {
    t.add(f.narr.to('قفل‌ها بودند، ولی فقط <b>لحظهٔ نوشتن</b> را پوشاندند؛ نه فاصلهٔ بین خواندن و نوشتن را.'), 0)
      .add(lanes.bracket(1, 2, 5, 'پنجرهٔ خطر: بین خواندن و نوشتن'), 0.3)
      .add(lanes.ev(0, 3, 'UPDATE', { cls: 'gone' }), 0.9)
      .add(verdict.show(), 1.2)
      .add(sara.state('bad', 'بلیت بی‌صندلی'), 1.4);
  });

  return { id: 'race', chapter: CH, label: 'دو رزرو، یک صندلی', steps: 7, group: 'seat', el, tl: master };
}
