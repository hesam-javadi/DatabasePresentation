import gsap from 'gsap';
import { newSlide, Slide } from '../core/deck';
import { h, show } from '../core/dom';
import { frame, subFrame, arrow, TxnCard, Lanes, Frame, note } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';

const CH = 'بخش اول · مشکلات';
const Y = 268;

const ORD = (id: string, code: string) => `<span class="ln${id}">${code} <span class="kw">UPDATE</span> Orders … <span class="kw">WHERE</span> Id=7001</span>`;
const STK = (id: string, code: string) => `<span class="ln${id}">${code} <span class="kw">UPDATE</span> Stock  … <span class="kw">WHERE</span> Id=42</span>`;
const code = (lines: string[], cur: number, head: string) =>
  [`<span class="cm">-- ${head}</span>`, ...lines.map((l, i) => (i + 1 === cur ? `<span class="cur">${l}</span>` : l)), cur === 3 ? '<span class="cur">   <span class="kw">COMMIT</span></span>' : '   <span class="kw">COMMIT</span>'].join('\n');

interface World { root: HTMLElement; f: Frame; orders: DbTable; stock: DbTable; t1: TxnCard; t2: TxnCard; lanes: Lanes }

function world(el: HTMLElement, pf: Frame, t2Lines: string[], hidden: boolean): World {
  const root = h('div', 'iso-layer', '', el);
  if (hidden) gsap.set(root, { opacity: 0 });
  const f = subFrame(pf, root);
  const orders = new DbTable(root, {
    name: 'dbo.Orders', x: 700, y: Y, rowH: 72,
    cols: [{ key: 'id', label: 'Id', w: 140, kind: 'mono', pk: true }, { key: 'status', label: 'Status', w: 200, kind: 'pill' }, { key: 'cust', label: 'Customer', w: 180 }],
    rows: [{ id: '7001', status: 'Pending', cust: 'سارا' }, { id: '7002', status: 'Paid', cust: 'رضا' }],
  });
  const stock = new DbTable(root, {
    name: 'dbo.Stock', x: 700, y: Y + 284, rowH: 72,
    cols: [{ key: 'id', label: 'Id', w: 140, kind: 'mono', pk: true }, { key: 'prod', label: 'Product', w: 200 }, { key: 'qty', label: 'Qty', w: 180, kind: 'num' }],
    rows: [{ id: '41', prod: 'کابل', qty: '120' }, { id: '42', prod: 'هدفون', qty: '19' }],
  });
  const t1 = new TxnCard(root, { tone: 't1', who: 'T1', name: 'سفارش', sub: 'سرویس پرداخت', x: 1364, y: Y, w: 460, exec: code([ORD('a', '①'), STK('b', '②')], 0, 'checkout'), execLabel: 'تراکنش' });
  const t2 = new TxnCard(root, { tone: 't2', who: 'T2', name: 'انبار', sub: 'همگام‌سازی موجودی', x: 96, y: Y, w: 460, exec: code(t2Lines, 0, 'warehouse sync'), execLabel: 'تراکنش' });
  const lanes = new Lanes(root, { x: 96, y: 876, w: 1728, ticks: 7, laneH: 52, lanes: [{ tone: 't1', label: 'T1 · سفارش' }, { tone: 't2', label: 'T2 · انبار' }] });
  return { root, f, orders, stock, t1, t2, lanes };
}

/** Two rows locked in opposite orders: the wait-for cycle, the victim, and the fix. */
export function deadlockSlide(stage: HTMLElement): Slide {
  const { el, master, step } = newSlide(stage, 's-dead');
  const pf = frame(el, 'هر کدام منتظر دیگری', 'Deadlock');
  const A = world(el, pf, [STK('a', '①'), ORD('b', '②')], false);
  const B = world(el, pf, [ORD('a', '①'), STK('b', '②')], true);

  // wait-for cycle: a red loop around both tables
  const ns = 'http://www.w3.org/2000/svg';
  const cyc = document.createElementNS(ns, 'g');
  cyc.setAttribute('class', 'cycle');
  cyc.innerHTML = `
    <ellipse cx="960" cy="548" rx="345" ry="290" class="cyc-path"/>
    <path d="M 615 520 l -15 30 l 30 0 z" class="cyc-head"/>
    <path d="M 1305 560 l 15 -30 l -30 0 z" class="cyc-head"/>`;
  A.f.svg.appendChild(cyc);
  gsap.set(cyc, { opacity: 0, svgOrigin: '960 548' });
  const cycLbl = h('div', 'cyc-lbl', `<span class="k1">T1</span> منتظر <span class="k2">T2</span> · <span class="k2">T2</span> منتظر <span class="k1">T1</span>`, A.root);
  gsap.set(cycLbl, { opacity: 0 });

  const mon = h('div', 'monitor', `<span class="radar">${ICON.radar}</span><span dir="ltr">Lock Monitor</span><small>هر ۵ ثانیه حلقه‌ها را می‌جوید</small>`, A.root);
  gsap.set(mon, { opacity: 0 });
  const fixNote = note(B.root, `${ICON.check} ترتیب ثابت برای قفل‌ها<br>${ICON.check} تراکنش کوتاه<br>${ICON.check} تلاش دوباره روی خطای <span dir="ltr">1205</span>`, 'ok', 1364, 640, 460);
  fixNote.el.classList.add('list');

  const { orders, stock, t1, t2, lanes } = A;
  const oR = orders.edge('7001', 'right', 10), oL = orders.edge('7001', 'left', 10);
  const sR = stock.edge('42', 'right', 10), sL = stock.edge('42', 'left', 10);
  const T1 = { ord: arrow(A.f, t1.side('left', 20), oR, 't1', { bend: 0.1 }), stk: arrow(A.f, t1.side('left', 60), { x: sR.x + 84, y: sR.y }, 't1', { bend: 0.15 }) };
  const T2 = { stk: arrow(A.f, t2.side('right', 20), sL, 't2', { bend: 0.15 }), ord: arrow(A.f, t2.side('right', 60), { x: oL.x - 84, y: oL.y }, 't2', { bend: -0.1 }) };

  step((t) => {
    t.add(pf.narr.to('دو تراکنش، همان دو ردیف؛ ولی با <b>ترتیب مخالف</b>. T1 اول سفارش را می‌گیرد، T2 اول انبار را.'), 0.1)
      .add(show([orders.el, stock.el], { y: 30, stagger: 0.1 }), 0)
      .add(show([t1.el, t2.el], { y: 30, stagger: 0.12 }), 0.15)
      .add(show(lanes.el, { y: 20 }), 0.35)
      .add(orders.focus('7001', true), 0.9)
      .add(stock.focus('42', true), 1.0);
  });

  step((t) => {
    t.add(pf.narr.to('T1 ردیف سفارش <code>7001</code> را با قفل <b class="k1">X</b> می‌گیرد.'), 0)
      .add(t1.exec(code([ORD('a', '①'), STK('b', '②')], 1, 'checkout')), 0)
      .add(t1.state('run', 'در حال اجرا'), 0)
      .add(T1.ord.draw(), 0.3)
      .add(orders.lock('7001', 't1', 'T1', 'X', 'right'), 0.8)
      .add(orders.set('7001', 'status', 'Paid', { wet: 't1' }), 1.3)
      .add(lanes.ev(0, 1, 'X · Orders'), 1.3)
      .add(T1.ord.hide(), 1.6);
  });

  step((t) => {
    t.add(pf.narr.to('هم‌زمان، T2 ردیف کالای <code>42</code> را با قفل <b class="k2">X</b> می‌گیرد.'), 0)
      .add(t2.exec(code([STK('a', '①'), ORD('b', '②')], 1, 'warehouse sync')), 0)
      .add(t2.state('run', 'در حال اجرا'), 0)
      .add(T2.stk.draw(), 0.3)
      .add(stock.lock('42', 't2', 'T2', 'X', 'left'), 0.8)
      .add(stock.set('42', 'qty', '18', { wet: 't2' }), 1.3)
      .add(lanes.ev(1, 2, 'X · Stock'), 1.3)
      .add(T2.stk.hide(), 1.6);
  });

  step((t) => {
    t.add(pf.narr.to('T1 حالا کالای ۴۲ را می‌خواهد؛ قفلش دست T2 است. <b>منتظر می‌ماند.</b>'), 0)
      .add(t1.exec(code([ORD('a', '①'), STK('b', '②')], 2, 'checkout')), 0)
      .add(T1.stk.draw(), 0.3)
      .add(stock.wait('42', 't1', 'T1', 'right'), 0.8)
      .add(t1.state('wait', 'منتظر T2'), 0.8)
      .add(lanes.ev(0, 3, `${ICON.hourglass} Stock`, { cls: 'wait', span: 2 }), 0.9);
  });

  step((t) => {
    t.add(pf.narr.to('و T2 سفارش ۷۰۰۱ را می‌خواهد؛ قفلش دست T1 است. یک <b class="kbad">حلقهٔ انتظار</b>: هیچ‌کدام تا ابد جلو نمی‌رود.'), 0)
      .add(t2.exec(code([STK('a', '①'), ORD('b', '②')], 2, 'warehouse sync')), 0)
      .add(T2.ord.draw(), 0.3)
      .add(orders.wait('7001', 't2', 'T2', 'left'), 0.8)
      .add(t2.state('wait', 'منتظر T1'), 0.8)
      .add(lanes.ev(1, 4, `${ICON.hourglass} Orders`, { cls: 'wait', span: 1 }), 0.9)
      .to(cyc, { opacity: 1, duration: 0.6 }, 1.5)
      .fromTo(cyc, { scale: 0.85 }, { scale: 1, duration: 1.0, ease: 'power3.out', immediateRender: false }, 1.5)
      .fromTo(cycLbl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, 2.0);
  });

  step((t) => {
    t.add(pf.narr.to('SQL Server حلقه را پیدا می‌کند و یکی را <b class="kbad">قربانی</b> می‌کند: خطای <code>1205</code>. کار T2 برمی‌گردد و T1 ادامه می‌دهد.'), 0)
      .fromTo(mon, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, 0.2)
      .to(cyc, { opacity: 0.35, duration: 0.15, yoyo: true, repeat: 3 }, 1.0)
      .add(t2.state('dead', 'قربانی'), 1.8)
      .add(t2.msg('Msg 1205: … chosen as the deadlock victim', 'bad'), 1.9)
      .add(orders.unwait('7001', 't2'), 2.0)
      .add(T2.ord.hide(), 2.0)
      .add(stock.evaporate('42'), 2.2)
      .add(stock.unlock('42', 't2'), 2.5)
      .to([cyc, cycLbl], { opacity: 0, duration: 0.5 }, 2.6)
      .add(lanes.ev(1, 5, '1205 · rollback', { cls: 'lost' }), 2.4)
      .add(t2.dim(true), 2.8)
      .add(stock.unwait('42', 't1'), 3.2)
      .add(T1.stk.hide(), 3.2)
      .add(stock.lock('42', 't1', 'T1', 'X', 'right'), 3.4)
      .add(stock.set('42', 'qty', '18', { wet: 't1' }), 3.9)
      .add(lanes.ev(0, 5, 'X · Stock'), 3.9)
      .add(t1.exec(code([ORD('a', '①'), STK('b', '②')], 3, 'checkout')), 4.5)
      .add(orders.dry('7001'), 4.8)
      .add(stock.dry('42'), 4.8)
      .add(orders.unlock('7001', 't1'), 5.0)
      .add(stock.unlock('42', 't1'), 5.0)
      .add(lanes.ev(0, 6, 'COMMIT'), 5.0)
      .add(t1.state('ok', 'انجام شد'), 5.2)
      .to(mon, { opacity: 0, duration: 0.4 }, 5.4);
  });

  // fix: the same order for everyone; now it's a queue, not a cycle
  step((t) => {
    const b = B;
    const bo = { oR: b.orders.edge('7001', 'right', 10), oL: b.orders.edge('7001', 'left', 10), sR: b.stock.edge('42', 'right', 10), sL: b.stock.edge('42', 'left', 10) };
    const x1 = arrow(b.f, b.t1.side('left', 20), bo.oR, 't1', { bend: 0.1 });
    const x2 = arrow(b.f, b.t2.side('right', 20), { x: bo.oL.x - 84, y: bo.oL.y }, 't2', { bend: -0.1 });
    const x3 = arrow(b.f, b.t1.side('left', 60), bo.sR, 't1', { bend: 0.15 });
    const x4 = arrow(b.f, b.t2.side('right', 60), bo.sL, 't2', { bend: 0.15 });
    t.to(A.root, { opacity: 0, duration: 0.4 }, 0)
      .to(B.root, { opacity: 1, duration: 0.5 }, 0.3)
      .add(pf.narr.to('راه‌حل: همه به <b>یک ترتیب</b> قفل بگیرند؛ اول سفارش، بعد انبار. حالا فقط <b class="kok">صف</b> است، نه حلقه.'), 0)
      .add(b.t2.exec(code([ORD('a', '①'), STK('b', '②')], 0, 'warehouse sync')), 1.0)
      .fromTo(b.t2.el.querySelector('.tx-exec'), { boxShadow: '0 0 0 0px rgba(14,148,103,0)' }, { boxShadow: '0 0 0 5px rgba(14,148,103,.7)', duration: 0.3, yoyo: true, repeat: 1, immediateRender: false }, 1.0)
      .add(x1.draw(), 1.8)
      .add(b.orders.lock('7001', 't1', 'T1', 'X', 'right'), 2.2)
      .add(b.orders.set('7001', 'status', 'Paid', { wet: 't1' }), 2.6)
      .add(b.lanes.ev(0, 1, 'X · Orders'), 2.6)
      .add(x1.hide(), 2.9)
      .add(x2.draw(), 3.0)
      .add(b.orders.wait('7001', 't2', 'T2', 'left'), 3.4)
      .add(b.t2.state('wait', 'در صف'), 3.4)
      .add(b.lanes.ev(1, 2, `${ICON.hourglass} Orders`, { cls: 'wait', span: 2 }), 3.5)
      .add(x3.draw(), 3.9)
      .add(b.stock.lock('42', 't1', 'T1', 'X', 'right'), 4.3)
      .add(b.stock.set('42', 'qty', '18', { wet: 't1' }), 4.7)
      .add(b.lanes.ev(0, 2, 'X · Stock'), 4.7)
      .add(x3.hide(), 5.0)
      .add(b.orders.dry('7001'), 5.4).add(b.stock.dry('42'), 5.4)
      .add(b.orders.unlock('7001', 't1'), 5.6).add(b.stock.unlock('42', 't1'), 5.6)
      .add(b.lanes.ev(0, 3, 'COMMIT'), 5.6)
      .add(b.t1.state('ok', 'انجام شد'), 5.7)
      .add(x2.hide(), 6.0)
      .add(b.orders.unwait('7001', 't2'), 6.0)
      .add(b.orders.lock('7001', 't2', 'T2', 'X', 'left'), 6.2)
      .add(b.lanes.ev(1, 4, 'X · Orders'), 6.4)
      .add(x4.draw(), 6.6)
      .add(b.stock.lock('42', 't2', 'T2', 'X', 'left'), 7.0)
      .add(b.stock.set('42', 'qty', '17', { wet: 't2' }), 7.4)
      .add(b.lanes.ev(1, 5, 'X · Stock'), 7.4)
      .add(x4.hide(), 7.7)
      .add(b.orders.unlock('7001', 't2'), 8.1).add(b.stock.dry('42'), 8.0).add(b.stock.unlock('42', 't2'), 8.1)
      .add(b.lanes.ev(1, 6, 'COMMIT'), 8.1)
      .add(b.t2.state('ok', 'انجام شد'), 8.2)
      .add(fixNote.show(), 8.6);
  });

  return { id: 'deadlock', chapter: CH, label: 'بن‌بست', steps: 7, el, tl: master };
}
