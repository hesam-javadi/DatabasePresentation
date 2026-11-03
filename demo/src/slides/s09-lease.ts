import gsap from 'gsap';
import { newSlide, Slide } from '../core/deck';
import { h, show, swapper } from '../core/dom';
import { frame, subFrame, arrow, tag, Frame } from '../kit/parts';
import { ICON } from '../kit/icons';
import { C } from '../kit/colors';
import { itemsTable, worker, ITEMS } from './items';

const CH = 'بخش سوم · یک مورد واقعی';

const SQL = {
  none: `<span class="cm">-- claimed earlier, with no expiry:</span>
<span class="kw">UPDATE</span> … <span class="kw">SET</span> Status = <span class="str">'Processing'</span>, LockToken = @token
<span class="kw">WHERE</span> Id = 42 <span class="kw">AND</span> Status = <span class="str">'Queued'</span>`,
  beat: `<span class="cm">-- heartbeat, every few seconds while working</span>
<span class="kw">UPDATE</span> BulkOperationItems
<span class="kw">SET</span>   LockUntil = <span class="kw">SYSUTCDATETIME</span>() + @lease
<span class="kw">WHERE</span> Id = 42 <span class="hl"><span class="kw">AND</span> LockToken = <span class="str">'7f3a'</span></span>`,
  sweep: `<span class="cm">-- sweeper: give expired leases back to the queue</span>
<span class="kw">UPDATE</span> BulkOperationItems
<span class="kw">SET</span>   Status = <span class="str">'Queued'</span>, AttemptCount += 1, LockToken = <span class="kw">NULL</span>
<span class="kw">WHERE</span> Status = <span class="str">'Processing'</span> <span class="hl"><span class="kw">AND</span> LockUntil &lt; <span class="kw">SYSUTCDATETIME</span>()</span>`,
  stale: `<span class="cm">-- api-1 wakes up and saves its result</span>
<span class="kw">UPDATE</span> BulkOperationItems
<span class="kw">SET</span>   Status = <span class="str">'Succeeded'</span>
<span class="kw">WHERE</span> Id = 42 <span class="hl"><span class="kw">AND</span> LockToken = <span class="str">'7f3a'</span></span>   <span class="cm">-- fencing</span>`,
};

const rows = (until: string) => [
  { id: '41', status: 'Succeeded', att: '1', tok: 'NULL', until: 'NULL' },
  { id: '42', status: 'Processing', att: '0', tok: '7f3a', until },
  { id: '43', status: 'Queued', att: '0', tok: 'NULL', until: 'NULL' },
];

function scene(el: HTMLElement, pf: Frame, until: string, hidden: boolean) {
  const root = h('div', 'iso-layer', '', el);
  if (hidden) gsap.set(root, { opacity: 0 });
  const f = subFrame(pf, root);
  const table = itemsTable(root, rows(until));
  const codeBox = h('div', 'code-panel', '<label>دستوری که الان اجرا می‌شود</label>', root);
  codeBox.style.cssText = `left:${ITEMS.x}px;top:668px;width:880px`;
  const pre = h('div', '', '', codeBox);
  pre.dir = 'ltr';
  const code = swapper(pre, `<pre>${hidden ? SQL.beat : SQL.none}</pre>`);
  const w1 = worker(root, 't1', 1, 262, '<span class="msg">item=42 · token 7f3a</span>');
  const w2 = worker(root, 't2', 2, 466, '<span class="msg">item=42 · seen=1</span>');
  const clockBox = h('div', 'dbclock', '', root);
  clockBox.dir = 'ltr';
  const clock = swapper(clockBox, `${ICON.clock}<span>SYSUTCDATETIME() = <b>12:00:12</b></span>`);
  return { root, f, table, code, w1, w2, clock };
}

/** Lease + heartbeat, the zombie worker, the sweeper, and the fencing token. */
export function leaseSlide(stage: HTMLElement): Slide {
  const { el, master, step } = newSlide(stage, 's-lease');
  const pf = frame(el, 'اجاره، نه قفل ابدی', 'Lease · Heartbeat · Fencing Token');
  const A = scene(el, pf, 'NULL', false);
  const B = scene(el, pf, '12:00:30', true);

  // A: the stuck item — a clock that keeps running
  const stuck = h('div', 'stuck', `${ICON.clock}<span class="sw-wrap"></span>`, A.root);
  const stuckS = swapper(stuck.querySelector('.sw-wrap') as HTMLElement, '۱ دقیقه بعد');
  const stuckPos = A.table.edge('42', 'right', 24);
  gsap.set(stuck, { x: stuckPos.x, y: stuckPos.y, yPercent: -50, opacity: 0 });

  // B: the lease bar lives inside the LockUntil cell
  const cell = B.table.cellEl('42', 'until');
  const bar = h('div', 'lease', '<i class="fill-live"></i><i class="fill"></i>', cell);
  const live = bar.querySelector('.fill-live') as HTMLElement;
  const fill = bar.querySelector('.fill') as HTMLElement;
  gsap.set(fill, { scaleX: 1, opacity: 0, backgroundColor: C.ok });
  const beat = h('i', 'beat t-t1', '', B.w1.el.querySelector('.tx-head') as HTMLElement);
  gsap.set([live, beat], { opacity: 0 });

  const above = { x: B.table.cell('42', 'tok').x, y: B.table.rowY('42') - 30 };
  const fence = tag(B.root, `<span dir="ltr">LockToken = 'c91e' ≠ '7f3a'</span> ${ICON.cross}`, 'bad mono check', above);
  gsap.set(fence, { opacity: 0 });

  step((t) => {
    const { table, w1 } = A;
    t.add(pf.narr.to('قفل بی‌انقضا: api-1 آیتم ۴۲ را گرفته، ولی قفلش تاریخ انقضا ندارد. حالا api-1 <b>از کار می‌افتد</b>.'), 0.1)
      .add(show(table.el, { y: 30 }), 0)
      .add(show([A.w1.el, A.w2.el], { x: 60, y: 0, stagger: 0.12 }), 0.2)
      .add(show(A.root.querySelector('.code-panel')!, { y: 20 }), 0.3)
      .add(show(A.root.querySelector('.dbclock')!, { y: 10 }), 0.4)
      .add(table.focus('42', true), 0.9)
      .add(w1.state('dead', 'از کار افتاد'), 1.8)
      .add(w1.dim(true), 1.9)
      .fromTo(stuck, { opacity: 0, x: stuckPos.x + 30 }, { opacity: 1, x: stuckPos.x, duration: 0.4, immediateRender: false }, 2.4)
      .add(stuckS.to('۱ ساعت بعد'), 3.2)
      .add(A.clock.to(`${ICON.clock}<span>SYSUTCDATETIME() = <b>13:00:12</b></span>`), 3.2)
      .add(stuckS.to('۱ روز بعد؛ هنوز Processing'), 4.2)
      .add(A.clock.to(`${ICON.clock}<span>SYSUTCDATETIME() = <b>+1 day</b></span>`), 4.2)
      .to(table.cellEl('42', 'status'), { x: 5, duration: 0.07, yoyo: true, repeat: 5 }, 4.6);
  });

  step((t) => {
    const { table, w1, code } = B;
    t.to(A.root, { opacity: 0, duration: 0.4 }, 0)
      .to(B.root, { opacity: 1, duration: 0.5 }, 0.3)
      .add(pf.narr.to('اجاره: قفل <b>زمان‌دار</b> به‌همراه یک توکن یکتا. کارگر زنده با <b>ضربان</b> آن را مدام تمدید می‌کند.'), 0)
      .add(table.focus('42', true), 0.6)
      .add(w1.state('run', 'در حال کار'), 0.7)
      .add(code.to(`<pre>${SQL.beat}</pre>`), 0.4)
      .add(table.mark('42', 'until', 't1'), 1.0)
      .to([live, beat], { opacity: 1, duration: 0.4 }, 1.2);
  });

  step((t) => {
    const { table, w1, clock } = B;
    t.add(pf.narr.to('api-1 در یک مکث طولانی GC گیر می‌کند. ضربانی نمی‌رسد و اجاره <b class="kbad">تمام می‌شود</b>.'), 0)
      .add(w1.state('pause', 'مکث GC'), 0.2)
      .add(w1.dim(true), 0.2)
      .to([live, beat], { opacity: 0, duration: 0.2 }, 0.3)
      .set(fill, { opacity: 1, scaleX: 0.8 }, 0.3)
      .to(fill, { scaleX: 0, duration: 2.6, ease: 'none' }, 0.4)
      .to(fill, { backgroundColor: C.t3, duration: 1.0 }, 0.6)
      .to(fill, { backgroundColor: C.bad, duration: 0.8 }, 1.8)
      .add(clock.to(`${ICON.clock}<span>SYSUTCDATETIME() = <b>12:00:31</b></span>`), 2.6)
      .add(table.mark('42', 'until', 't1', false), 2.8)
      .add(table.mark('42', 'until', 'bad'), 2.9);
  });

  step((t) => {
    const { table, w2, code, f } = B;
    const a2 = arrow(f, w2.side('left', -40), table.edge('42', 'right', 10), 't2', { bend: 0.1 });
    t.add(pf.narr.to('جاروکش اجارهٔ منقضی را به صف برمی‌گرداند (تلاش ۱). <span class="k2">api-2</span> پیام تازه را می‌گیرد و با <b>توکن جدید</b> صاحبش می‌شود.'), 0)
      .add(code.to(`<pre>${SQL.sweep}</pre>`), 0)
      .add(table.mark('42', 'until', 'bad', false), 0.6)
      .add(table.set('42', 'status', 'Queued'), 0.8)
      .add(table.set('42', 'att', '1'), 0.95)
      .add(table.set('42', 'tok', 'NULL'), 1.1)
      .add(table.set('42', 'until', 'NULL'), 1.25)
      .to(fill, { opacity: 0, duration: 0.3 }, 0.8)
      .add(code.to(`<pre>${'<span class="cm">-- api-2 claims it: same conditional UPDATE, seen = 1</span>\n<span class="kw">UPDATE</span> … <span class="kw">SET</span> Status = <span class="str">\'Processing\'</span>, LockToken = <span class="str">\'c91e\'</span>, …\n<span class="kw">WHERE</span> Id = 42 <span class="kw">AND</span> Status = <span class="str">\'Queued\'</span> <span class="kw">AND</span> AttemptCount = 1'}</pre>`), 2.0)
      .add(a2.draw(), 2.2)
      .add(w2.state('run', 'UPDATE'), 2.2)
      .add(table.lock('42', 't2', 'W2', 'X', 'right'), 2.7)
      .add(table.set('42', 'status', 'Processing', { wet: 't2' }), 3.1)
      .add(table.set('42', 'tok', 'c91e', { wet: 't2' }), 3.25)
      .add(table.set('42', 'until', '12:01:02', { wet: 't2' }), 3.4)
      .add(table.dry('42'), 4.0)
      .add(table.unlock('42', 't2'), 4.1)
      .add(w2.msg('(1 row affected)', 'ok'), 4.0)
      .add(w2.state('ok', 'صاحب جدید'), 4.2)
      .set(fill, { scaleX: 1, backgroundColor: C.ok }, 4.2)
      .to(fill, { opacity: 1, duration: 0.4 }, 4.3)
      .add(a2.hide(), 4.4);
  });

  step((t) => {
    const { table, w1, code, f } = B;
    const a1 = arrow(f, w1.side('left', -40), table.edge('42', 'right', 10), 't1', { bend: 0.12 });
    t.add(pf.narr.to('api-1 بیدار می‌شود و نتیجه‌اش را می‌نویسد؛ ولی توکنش دیگر معتبر نیست. <b class="kbad">۰ ردیف</b>: نتیجهٔ کهنه رد شد.'), 0)
      .add(w1.dim(false), 0.1)
      .add(w1.state('run', 'بیدار شد'), 0.1)
      .add(code.to(`<pre>${SQL.stale}</pre>`), 0.2)
      .add(a1.draw(), 0.8)
      .add(table.mark('42', 'tok', 'bad'), 1.4)
      .fromTo(fence, { opacity: 0, y: above.y + 12 }, { opacity: 1, y: above.y, duration: 0.4, immediateRender: false }, 1.5)
      .to(table.rowEl('42'), { x: 8, duration: 0.07, yoyo: true, repeat: 5 }, 1.6)
      .add(w1.msg('(0 rows affected)', 'bad'), 2.1)
      .add(w1.state('bad', 'نتیجهٔ کهنه رد شد'), 2.2)
      .add(a1.hide(), 2.6);
  });

  return { id: 'lease', chapter: CH, label: 'اجاره و توکن', steps: 5, group: 'items', el, tl: master };
}
