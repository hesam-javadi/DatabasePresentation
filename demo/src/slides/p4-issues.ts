import gsap from 'gsap';
import { build } from '../core/build';
import { h, swapper } from '../core/dom';
import { arrow, ruleCard, tag, node, note } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';
import { C } from '../kit/colors';
import { CH, k, cm, hl, str, chal } from './common';
import { itemsTable, worker, CLAIM_SQL, ITEMS } from './items';

const MSG = `<span class="msg">${ICON.mail} item=42 seen=0</span>`;
const codePanel = (root: HTMLElement, label: string, html: string, y = 690) => {
  const e = node(root, `<label>${label}</label><div class="cp-body"></div>`, ITEMS.x, y, 880, 'codebox');
  const sw = swapper(e.querySelector('.cp-body') as HTMLElement, `<pre dir="ltr">${html}</pre>`);
  return { el: e, to: (x: string) => sw.to(`<pre dir="ltr">${x}</pre>`) };
};
const dbClock = (root: HTMLElement, time: string) => {
  const box = h('div', 'dbclock', '', root);
  box.dir = 'ltr';
  const sw = swapper(box, `${ICON.clock}<span>SYSUTCDATETIME() = <b>${time}</b></span>`);
  return { el: box, to: (t: string) => sw.to(`${ICON.clock}<span>SYSUTCDATETIME() = <b>${t}</b></span>`) };
};
/** A lease progress bar inside the LockUntil cell. */
function leaseBar(table: DbTable, id: string, live = false) {
  const bar = h('div', 'lease', '<i class="fill-live"></i><i class="fill"></i>', table.cellEl(id, 'until'));
  const lv = bar.querySelector('.fill-live') as HTMLElement, fill = bar.querySelector('.fill') as HTMLElement;
  gsap.set(fill, { scaleX: 1, backgroundColor: C.ok, opacity: live ? 0 : 1 });
  gsap.set(lv, { opacity: live ? 1 : 0 });
  gsap.set(bar, { opacity: 0 });
  return { bar, lv, fill };
}

// ---------------------------------------------------------------- issue 1 · duplicate delivery → claim

export function claim(stage: HTMLElement) {
  const b = build(stage, { id: 'claim', chapter: CH.real, label: 'Duplicate Message', title: 'یک آیتم، یک صاحب', badge: chal(1) });
  const table = itemsTable(b.el, [
    { id: '41', status: 'Succeeded', att: '1', tok: 'NULL', until: 'NULL' },
    { id: '42', status: 'Queued', att: '0', tok: 'NULL', until: 'NULL' },
    { id: '43', status: 'Queued', att: '0', tok: 'NULL', until: 'NULL' },
    { id: '44', status: 'Processing', att: '1', tok: 'a1b2', until: '12:00:41' },
  ]);
  const code = codePanel(b.el, 'دستور تصاحب؛ هر سه Worker همین را می‌فرستند', CLAIM_SQL, 728);
  const ws = [worker(b.el, 't1', 1, 262, MSG), worker(b.el, 't2', 2, 466, MSG), worker(b.el, 't3', 3, 670, MSG)];
  const edge = table.edge('42', 'right', 10);
  const outs = [10, 140, 236];
  const arrows = ws.map((w, i) => arrow(b.f, w.side('left', -40), { x: edge.x + outs[i], y: edge.y }, (['t1', 't2', 't3'] as const)[i], { bend: i === 0 ? 0.12 : i === 1 ? 0.04 : -0.1 }));
  const above = { x: table.cell('42', 'status').x + 60, y: table.rowY('42') - 30 };
  const ok = tag(b.el, `<span dir="ltr">Status = 'Queued' AND AttemptCount = 0</span> ${ICON.check}`, 'ok mono check', above);
  const no = tag(b.el, `<span dir="ltr">Status = 'Processing' ≠ 'Queued'</span> ${ICON.cross}`, 'bad mono check', above);
  b.hide(ok, no);
  const rule = ruleCard(b.el, { name: 'یک آیتم، یک صاحب', tone: 'ok', kicker: 'حل چالش ۱', body: 'تصاحب با <b>Conditional UPDATE</b>: فقط وقتی اثر دارد که آیتم هنوز Queued باشد. یکی <b>۱ ردیف</b> می‌گیرد و صاحب می‌شود؛ بقیه <b>۰ ردیف</b> و پیامشان را کنار می‌گذارند. بدون Lock صریح و بدون Transaction طولانی؛ همان راه‌حلِ مشکل ۱.' });
  b.show('چالش ۱: پیام آیتم ۴۲ به <b>سه</b> Worker رسیده. کدام باید انجامش دهد؟ آیتم ۴۲ الان Queued است، تلاش ۰.', ws.map((w) => w.el), (t) => t.add(table.focus('42', true), 0), { x: 50, y: 0 })
    .show('جواب، همان Conditional UPDATE مشکل ۱ است: فقط اگر آیتم هنوز Queued باشد.', code.el)
    .s('هر سه هم‌زمان همان دستور را می‌فرستند. api-1 زودتر می‌رسد و <b>X Lock</b> می‌گیرد؛ بقیه پشت Lock، Wait می‌کنند.', (t) => {
      ws.forEach((w) => t.add(w.state('run', 'UPDATE'), 0));
      arrows.forEach((a, i) => t.add(a.draw(0.7), i * 0.15));
      t.add(table.lock('42', 't1', 'W1', 'X', 'right'), 0.8).add(table.wait('42', 't2', 'W2', 'right', 140), 0.95).add(table.wait('42', 't3', 'W3', 'right', 236), 1.1)
        .add(ws[1].state('wait', 'Waiting'), 1.0).add(ws[2].state('wait', 'Waiting'), 1.15).add(arrows[0].hide(), 1.6);
    })
    .s('شرط روی ردیفِ Lockشده برقرار است؛ آیتم مال api-1 می‌شود: Status، Token و LockUntil ثبت می‌شود. <b>۱ ردیف.</b>', (t) => t.add(table.mark('42', 'status', 't1')).add(table.mark('42', 'att', 't1'), 0.1).fromTo(ok, { opacity: 0, y: above.y + 12 }, { opacity: 1, y: above.y, duration: 0.5, immediateRender: false }, 0.3)
      .to(ok, { opacity: 0, duration: 0.3 }, 1.6).add(table.set('42', 'status', 'Processing', { wet: 't1' }), 1.8).add(table.set('42', 'tok', '7f3a', { wet: 't1' }), 2.0).add(table.set('42', 'until', '12:00:30', { wet: 't1' }), 2.2).add(ws[0].msg('(1 row affected)', 'ok'), 2.5))
    .s('Lock آزاد می‌شود. api-2 شرط را <b>دوباره</b> می‌سنجد: دیگر Queued نیست.', (t) => t.add(table.dry('42')).add(table.unlock('42', 't1'), 0.2).add(table.mark('42', 'att', 't1', false), 0.2).add(ws[0].state('ok', 'Owner'), 0.4).add(arrows[1].hide(), 0.5).add(table.unwait('42', 't2'), 0.5).add(table.lock('42', 't2', 'W2', 'X', 'right'), 0.7).fromTo(no, { opacity: 0, y: above.y + 12 }, { opacity: 1, y: above.y, duration: 0.5, immediateRender: false }, 1.1))
    .s('<b class="kbad">۰ ردیف</b>؛ پیام را کنار می‌گذارد. api-3 هم همین‌طور.', (t) => t.add(ws[1].msg('(0 rows affected)', 'bad')).add(table.unlock('42', 't2'), 0.3).add(arrows[2].hide(), 0.6).add(table.unwait('42', 't3'), 0.6).add(table.lock('42', 't3', 'W3', 'X', 'right'), 0.8).add(ws[2].msg('(0 rows affected)', 'bad'), 1.3).add(table.unlock('42', 't3'), 1.5).to(no, { opacity: 0, duration: 0.3 }, 1.7).add(table.mark('42', 'status', 't1', false), 1.7).add(ws[1].mem('msg', `<span class="msg gone">${ICON.trash} ack · discarded</span>`), 1.8).add(ws[2].mem('msg', `<span class="msg gone">${ICON.trash} ack · discarded</span>`), 1.9).add(ws[1].state('idle', 'Skipped'), 1.8).add(ws[2].state('idle', 'Skipped'), 1.9))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- issue 2 · dead worker → lease + heartbeat

const BEAT = `${cm('heartbeat: every few seconds while working')}\n${k('UPDATE')} BulkOperationItems\n${k('SET')}   LockUntil = ${k('SYSUTCDATETIME')}() + @lease\n${k('WHERE')} Id = 42 ${hl(`${k('AND')} LockToken = ${str('7f3a')}`)}`;

export function lease(stage: HTMLElement) {
  const b = build(stage, { id: 'lease', chapter: CH.real, label: 'Dead Worker', title: 'Lease، نه Lock ابدی', badge: chal(2) });
  const A = h('div', 'iso-layer', '', b.el), B = h('div', 'iso-layer', '', b.el);
  const rows = (until: string) => [{ id: '41', status: 'Succeeded', att: '1', tok: 'NULL', until: 'NULL' }, { id: '42', status: 'Processing', att: '0', tok: '7f3a', until }, { id: '43', status: 'Queued', att: '0', tok: 'NULL', until: 'NULL' }];
  const ta = itemsTable(A, rows('NULL')), tbB = itemsTable(B, rows('12:00:30'));
  const wa = worker(A, 't1', 1, 262, '<span class="msg">item=42 · token 7f3a</span>');
  const wb = worker(B, 't1', 1, 262, '<span class="msg">item=42 · token 7f3a</span>');
  const stuck = h('div', 'stuck', `${ICON.clock}<span class="sw-wrap"></span>`, A);
  const stuckS = swapper(stuck.querySelector('.sw-wrap') as HTMLElement, '۱ دقیقه بعد…');
  const sp = ta.edge('42', 'right', 24);
  gsap.set(stuck, { x: sp.x, y: sp.y, yPercent: -50, opacity: 0 });
  const code = codePanel(B, 'دستوری که Worker زنده تکرار می‌کند (Heartbeat)', BEAT, 610);
  const lb = leaseBar(tbB, '42', true);
  const beat = h('i', 'beat t-t1', '', wb.el.querySelector('.tx-head') as HTMLElement);
  gsap.set(B, { opacity: 0 });
  b.hide(beat, code.el);
  const rule = ruleCard(b.el, { name: 'Lease، نه Lock ابدی', tone: 'ok', kicker: 'حل چالش ۲', body: 'مالکیتِ آیتم <b>زمان‌دار</b> است (<code>LockUntil</code>). Worker زنده با <b>Heartbeat</b> آن را تمدید می‌کند؛ Worker مرده تمدید نمی‌کند و آیتم بعد از چند ثانیه آزاد می‌شود.' });
  b.show('چالش ۲: اگر صاحبِ آیتم وسط کار بمیرد چه می‌شود؟ آیتم ۴۲ مال api-1 است؛ ولی <code>LockUntil</code> خالی است.', wa.el, (t) => t.add(ta.focus('42', true), 0), { x: 50, y: 0 })
    .s('api-1 وسط کار از کار می‌افتد. هیچ‌کس دیگری حق ندارد به آیتم دست بزند؛ چون هنوز «مالِ api-1» است.', (t) => t.add(wa.state('dead', 'Crashed')).add(wa.dim(true), 0.2).fromTo(stuck, { opacity: 0, x: sp.x + 30 }, { opacity: 1, x: sp.x, duration: 0.5, immediateRender: false }, 0.8))
    .s('و آیتم <b>تا ابد</b> Processing می‌ماند: مالکیت تاریخ انقضا ندارد.', (t) => t.add(stuckS.to('۱ ساعت بعد…')).add(stuckS.to('۱ روز بعد؛ هنوز Processing'), 1.2).to(ta.cellEl('42', 'status'), { x: 5, duration: 0.07, yoyo: true, repeat: 5 }, 1.6))
    .s('راه‌حل: <b>Lease</b>. آیتم فقط تا یک زمان مشخص مال Worker است؛ این نوار، زمانِ باقی‌ماندهٔ Lease است.', (t) => t.to(A, { opacity: 0, duration: 0.4 }).to(B, { opacity: 1, duration: 0.5 }, 0.3).add(tbB.focus('42', true), 0.6).add(tbB.mark('42', 'until', 't1'), 0.9).to(lb.bar, { opacity: 1, duration: 0.4 }, 1.2).add(wb.state('run', 'Working'), 1.2))
    .show('Worker زنده هر چند ثانیه Lease را <b>تمدید</b> می‌کند (Heartbeat)؛ فقط اگر Token هنوز مال خودش باشد.', [code.el, beat])
    .s('اگر Worker بمیرد، Heartbeatی نمی‌رسد و Lease خودش تمام می‌شود. آیتم آزاد است.', (t) => t.to([lb.lv, beat], { opacity: 0, duration: 0.2 }).set(lb.fill, { opacity: 1, scaleX: 0.75 }, 0.2).to(lb.fill, { scaleX: 0, duration: 2.0, ease: 'none' }, 0.3).to(lb.fill, { backgroundColor: C.bad, duration: 1.4 }, 0.6).add(wb.state('dead', 'Crashed'), 0.2).add(wb.dim(true), 0.2))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- issue 3 · zombie worker → fencing token

const SWEEP = `${cm('sweeper: give expired leases back to the queue')}\n${k('UPDATE')} BulkOperationItems\n${k('SET')}   Status = ${str('Queued')}, AttemptCount += 1, LockToken = ${k('NULL')}\n${k('WHERE')} Status = ${str('Processing')} ${hl(`${k('AND')} LockUntil &lt; ${k('SYSUTCDATETIME')}()`)}`;
const STALE = `${cm('api-1 wakes up and saves its result')}\n${k('UPDATE')} BulkOperationItems\n${k('SET')}   Status = ${str('Succeeded')}\n${k('WHERE')} Id = 42 ${hl(`${k('AND')} LockToken = ${str('7f3a')}`)}  ${cm('fencing')}`;
const CLAIM2 = `${cm('api-2 claims it: same conditional UPDATE, seen = 1')}\n${k('UPDATE')} … ${k('SET')} Status = ${str('Processing')}, LockToken = ${str('c91e')}, …\n${k('WHERE')} Id = 42 ${k('AND')} Status = ${str('Queued')} ${k('AND')} AttemptCount = 1`;

export function zombie(stage: HTMLElement) {
  const b = build(stage, { id: 'zombie', chapter: CH.real, label: 'Zombie Worker', title: 'وقتی Worker از خواب برمی‌گردد', badge: chal(3) });
  const table = itemsTable(b.el, [{ id: '41', status: 'Succeeded', att: '1', tok: 'NULL', until: 'NULL' }, { id: '42', status: 'Processing', att: '0', tok: '7f3a', until: '12:00:30' }, { id: '43', status: 'Queued', att: '0', tok: 'NULL', until: 'NULL' }]);
  const w1 = worker(b.el, 't1', 1, 262, '<span class="msg">item=42 · token 7f3a</span>');
  const w2 = worker(b.el, 't2', 2, 466, '<span class="msg">item=42 · seen=1</span>');
  const clock = dbClock(b.el, '12:00:12');
  const code = codePanel(b.el, 'دستوری که الان اجرا می‌شود', BEAT, 610);
  b.hide(code.el);
  const lb = leaseBar(table, '42');
  const a2 = arrow(b.f, w2.side('left', -40), table.edge('42', 'right', 10), 't2', { bend: 0.1 });
  const a1 = arrow(b.f, w1.side('left', -40), table.edge('42', 'right', 10), 't1', { bend: 0.12 });
  const above = { x: table.cell('42', 'tok').x, y: table.rowY('42') - 30 };
  const fence = tag(b.el, `<span dir="ltr">LockToken = 'c91e' ≠ '7f3a'</span> ${ICON.cross}`, 'bad mono check', above);
  b.hide(fence);
  const rule = ruleCard(b.el, { name: 'هر Write، مالکیت را ثابت کند', term: 'Fencing Token', tone: 'ok', kicker: 'حل چالش ۳', body: 'Lease به‌تنهایی کافی نیست؛ Workerی که مکث کرده نمی‌داند Leaseش تمام شده. پس <b>هر Write</b> شرطِ <code>LockToken = @myToken</code> دارد. نتیجهٔ کهنه با <b>۰ ردیف</b> رد می‌شود.' });
  b.show('چالش ۳: Workerی که نمرده، فقط <b>خوابیده</b> بود. آیتم ۴۲ مال api-1 است، با Token 7f3a و Lease تا 12:00:30.', [clock.el, w1.el, w2.el], (t) => t.add(table.focus('42', true), 0).to(lb.bar, { opacity: 1, duration: 0.4 }, 0.2), { x: 50, y: 0 })
    .show('api-1 کار می‌کند و Heartbeat می‌فرستد. ساعتِ مرجع، ساعتِ خودِ پایگاه داده است.', code.el, (t) => t.add(w1.state('run', 'Working'), 0))
    .s('api-1 در یک <b>مکث طولانی GC</b> گیر می‌کند؛ Heartbeatی نمی‌رسد و Lease تمام می‌شود.', (t) => t.add(w1.state('pause', 'GC Pause')).add(w1.dim(true), 0.2).to(lb.fill, { scaleX: 0, duration: 2.4, ease: 'none' }, 0.6).to(lb.fill, { backgroundColor: C.t3, duration: 1.0 }, 0.9).to(lb.fill, { backgroundColor: C.bad, duration: 0.8 }, 2.0).add(clock.to('12:00:31'), 2.8).add(table.mark('42', 'until', 'bad'), 3.0))
    .s('Sweeper آیتمِ منقضی را به صف برمی‌گرداند. تلاش ۱.', (t) => t.add(code.to(SWEEP)).add(table.mark('42', 'until', 'bad', false), 0.6).add(table.set('42', 'status', 'Queued'), 0.8).add(table.set('42', 'att', '1'), 1.0).add(table.set('42', 'tok', 'NULL'), 1.2).add(table.set('42', 'until', 'NULL'), 1.4).to(lb.bar, { opacity: 0, duration: 0.3 }, 0.8))
    .s('api-2 پیامِ تازه را می‌گیرد و با Tokenِ <b>c91e</b> صاحبِ آیتم می‌شود.', (t) => t.add(code.to(CLAIM2)).add(a2.draw(0.8), 0.3).add(w2.state('run', 'UPDATE'), 0.3).add(table.lock('42', 't2', 'W2', 'X', 'right'), 1.0).add(table.set('42', 'status', 'Processing', { wet: 't2' }), 1.4).add(table.set('42', 'tok', 'c91e', { wet: 't2' }), 1.6).add(table.set('42', 'until', '12:01:02', { wet: 't2' }), 1.8).add(table.dry('42'), 2.5).add(table.unlock('42', 't2'), 2.6).add(w2.state('ok', 'New Owner'), 2.7).set(lb.fill, { scaleX: 1, backgroundColor: C.ok }, 2.7).to(lb.bar, { opacity: 1, duration: 0.4 }, 2.8).add(a2.hide(), 2.9))
    .s('api-1 بیدار می‌شود و نتیجه‌اش را با Tokenِ <b>قدیمی</b> ذخیره می‌کند. شرطِ Token برقرار نیست.', (t) => t.add(w1.dim(false)).add(w1.state('run', 'Woke up'), 0).add(code.to(STALE), 0.2).add(a1.draw(0.8), 0.8).add(table.mark('42', 'tok', 'bad'), 1.6).fromTo(fence, { opacity: 0, y: above.y + 12 }, { opacity: 1, y: above.y, duration: 0.5, immediateRender: false }, 1.8).to(table.rowEl('42'), { x: 8, duration: 0.07, yoyo: true, repeat: 5 }, 2.0))
    .s('<b class="kbad">۰ ردیف</b>: نتیجهٔ کهنه رد شد و کارِ api-2 سالم ماند.', (t) => t.add(w1.msg('(0 rows affected)', 'bad')).add(w1.state('bad', 'Rejected'), 0.2).add(a1.hide(), 0.6))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- issue 4 · sweeper and the attempt cap

export function sweeper(stage: HTMLElement) {
  const b = build(stage, { id: 'sweeper', chapter: CH.real, label: 'Poison Message', title: 'Sweeper و سقف Retry', badge: chal(4) });
  const table = itemsTable(b.el, [
    { id: '51', status: 'Processing', att: '0', tok: 'b7e1', until: '12:00:02' },
    { id: '52', status: 'Processing', att: '1', tok: '4c0d', until: '12:00:05' },
    { id: '53', status: 'Processing', att: '0', tok: '9a33', until: '12:00:40' },
    { id: '54', status: 'Processing', att: '4', tok: 'e210', until: '12:00:01' },
  ]);
  const clock = dbClock(b.el, '12:00:10');
  const job = node(b.el, `${ICON.broom}<b>Sweeper</b><small>هر ۱۰ ثانیه، در پس‌زمینه</small>`, 1404, 300, 420, 'tone t-t3');
  const code = codePanel(b.el, 'کاری که Sweeper انجام می‌دهد', `${SWEEP}\n${cm('…and items at the attempt cap become Failed')}`, 690);
  const rule = ruleCard(b.el, { name: 'سقفِ Retry', tone: 'ok', kicker: 'حل چالش ۴', body: 'Leaseهای منقضی به صف برمی‌گردند و هر بار <b>یک تلاش</b> به شمارنده اضافه می‌شود. آیتمی که به <b>سقف</b> رسید (این‌جا ۵)، Failed می‌شود تا یک <b>Poison Message</b> تا ابد در چرخه نماند.' });
  b.show('چالش ۴: آیتم‌هایی که صاحبشان رفت، و آیتمی که <b>هیچ‌وقت</b> درست انجام نمی‌شود. یک کار پس‌زمینه: <b>Sweeper</b>.', [clock.el, job, code.el], undefined, { stagger: 0.2 })
    .s('Sweeper Leaseهای <b>منقضی</b> را پیدا می‌کند (LockUntil قبل از الان) و به صف برمی‌گرداند؛ با یک تلاشِ بیشتر.', (t) => {
      ['51', '52', '54'].forEach((r, i) => t.add(table.mark(r, 'until', 'bad'), i * 0.2));
      [['51', '1'], ['52', '2']].forEach(([r, a], i) => { const o = 1.2 + i * 0.3; t.add(table.mark(r, 'until', 'bad', false), o); t.add(table.set(r, 'status', 'Queued'), o + 0.2); t.add(table.set(r, 'att', a), o + 0.3); t.add(table.set(r, 'tok', 'NULL'), o + 0.4); t.add(table.set(r, 'until', 'NULL'), o + 0.5); });
    })
    .s('آیتم ۵۴ قبلاً چهار بار شکست خورده بود؛ این پنجمی است: <b>Failed</b>. آیتم ۵۳ هنوز Lease معتبر دارد؛ دست نخورد.', (t) => t.add(table.mark('54', 'until', 'bad', false)).add(table.set('54', 'att', '5'), 0.2).add(table.set('54', 'status', 'Failed'), 0.5).add(table.set('54', 'tok', 'NULL'), 0.7).add(table.set('54', 'until', 'NULL'), 0.8).add(table.focus('54', true, 'bad'), 0.9).add(table.focus('53', true, 'ok'), 1.6))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- issue 5 · progress counters → derived

export function counters(stage: HTMLElement) {
  const b = build(stage, { id: 'counters', chapter: CH.real, label: 'Hot Counter', title: 'شمارنده‌ها مشتق‌اند', badge: chal(5) });
  const op = new DbTable(b.el, { name: 'dbo.BulkOperation', x: 220, y: 300, rowH: 88, cols: [{ key: 'id', label: 'Id', w: 90, kind: 'mono', pk: true }, { key: 'st', label: 'Status', w: 190, kind: 'pill' }, { key: 'ok', label: 'Succeeded', w: 200, kind: 'num' }], rows: [{ id: '17', st: 'Running', ok: '182344' }] });
  const naive = node(b.el, `<label>راه ساده: بعد از هر آیتمِ موفق</label><pre dir="ltr">${k('UPDATE')} BulkOperation\n${k('SET')} Succeeded = ${hl('Succeeded + 1')} ${k('WHERE')} Id = 17</pre>`, 220, 470, 640, 'codebox');
  const derive = node(b.el, `<label>به‌جایش: هر چند ثانیه، از روی خودِ آیتم‌ها</label><pre dir="ltr">${k('SELECT')} Status, ${k('COUNT')}(*)\n${k('FROM')} BulkOperationItems\n${k('WHERE')} OperationId = 17 ${k('GROUP BY')} Status</pre>`, 220, 680, 640, 'codebox');
  const y = op.rowMid('17');
  const q = Array.from({ length: 6 }, (_, i) => { const e = h('div', 'qchip', `W${i + 2}`, b.el); gsap.set(e, { x: 860 + i * 82, y: y - 31, opacity: 0 }); return e; });
  const res = node(b.el, `<div class="cnt-r"><span>Succeeded</span><b>182,351</b></div><div class="cnt-r"><span>Failed</span><b>211</b></div><div class="cnt-r"><span>Processing</span><b>2,400</b></div><div class="cnt-r"><span>Queued</span><b>1,000</b></div>`, 1260, 620, 560, 'cnt');
  const rule = ruleCard(b.el, { name: 'شمارندهٔ مشتق', tone: 'ok', kicker: 'حل چالش ۵', body: 'پیشرفت را <b>از روی وضعیت آیتم‌ها</b> حساب می‌کنیم، هر چند ثانیه یک بار. هیچ Workerی روی یک ردیفِ مشترک <code>++</code> نمی‌زند؛ پس صفی هم پشت آن تشکیل نمی‌شود. همان راه‌حلِ مشکل ۷ (Hot Row).' });
  b.show('چالش ۵: کاربر می‌خواهد پیشرفت را ببیند. راه ساده: هر Worker بعد از هر آیتمِ موفق، یکی به <code>Succeeded</code> اضافه کند.', naive, (t) => t.add(op.focus('17', true), 0))
    .s('ولی هر Worker برای این کار X Lock همین ردیف را می‌خواهد و همه پشتِ آن صف می‌کشند: <b>Hot Row</b>، همان مشکل ۷.', (t) => t.add(op.lock('17', 't1', 'W1', 'X', 'right')).add(op.set('17', 'ok', '182345', { wet: 't1' }), 0.6).fromTo(q, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.1, immediateRender: false }, 1.0))
    .show('پس شمارنده نگه نمی‌داریم؛ هر چند ثانیه، وضعیت آیتم‌ها شمرده می‌شود.', derive, (t) => t.to(naive, { opacity: 0.35, duration: 0.4 }, 0).to(q, { opacity: 0, x: '+=40', duration: 0.4, stagger: 0.05 }, 0).add(op.evaporate('17'), 0.1).add(op.unlock('17', 't1'), 0.3))
    .show('و نتیجه همان پیشرفتی است که کاربر می‌بیند.', res, (t) => t.add(op.set('17', 'ok', '182351'), 0.6))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- issue 6 · cancel is a state

export function cancel(stage: HTMLElement) {
  const b = build(stage, { id: 'cancel', chapter: CH.real, label: 'Cancel', title: 'Cancel، یک وضعیت است', badge: chal(6) });
  const op = new DbTable(b.el, { name: 'dbo.BulkOperation', x: 300, y: 262, rowH: 76, cols: [{ key: 'id', label: 'Id', w: 90, kind: 'mono', pk: true }, { key: 'st', label: 'Status', w: 220, kind: 'pill' }], rows: [{ id: '17', st: 'Running' }] });
  const it = new DbTable(b.el, { name: 'dbo.BulkOperationItems', x: 150, y: 460, rowH: 70, cols: [{ key: 'id', label: 'Id', w: 100, kind: 'mono', pk: true }, { key: 'status', label: 'Status', w: 250, kind: 'pill' }, { key: 'tok', label: 'LockToken', w: 190, kind: 'mono' }], rows: [{ id: '61', status: 'Processing', tok: '7f3a' }, { id: '62', status: 'Processing', tok: 'c91e' }, { id: '63', status: 'Queued', tok: 'NULL' }, { id: '64', status: 'Pending', tok: 'NULL' }] });
  const w1 = worker(b.el, 't1', 1, 262, '<span class="msg">item=61 · token 7f3a</span>');
  const w2 = worker(b.el, 't2', 2, 466, '<span class="msg">item=62 · token c91e</span>');
  const hb = node(b.el, `<label>Heartbeatِ Worker، با یک شرطِ اضافه</label><pre dir="ltr">${k('UPDATE')} i ${k('SET')} LockUntil = …\n${k('FROM')} BulkOperationItems i ${k('JOIN')} BulkOperation o …\n${k('WHERE')} i.Id = 61 ${k('AND')} i.LockToken = ${str('7f3a')}\n  ${hl(`${k('AND')} o.Status = ${str('Running')}`)}   ${cm('0 rows → stop')}</pre>`, 820, 690, 1004, 'codebox');
  const rule = ruleCard(b.el, { name: 'Cancel، یک وضعیت است', tone: 'ok', kicker: 'حل چالش ۶', body: 'کسی پروسه‌ای را نمی‌کشد. وضعیتِ عملیات <b>Cancelled</b> می‌شود؛ Workerها در <b>Heartbeatِ بعدی</b> (که حالا ۰ ردیف برمی‌گرداند) خودشان می‌ایستند، و آیتم‌های باقی‌مانده دسته‌دسته Cancelled می‌شوند.' });
  b.show('چالش ۶: کاربر وسطِ کار Cancel می‌زند. Workerهای روی سرورهای دیگر چطور بفهمند؟', [w1.el, w2.el], (t) => t.add(w1.state('run', 'Working'), 0.3).add(w2.state('run', 'Working'), 0.3), { x: 50, y: 0 })
    .s('فقط <b>یک UPDATE</b> روی ردیفِ عملیات: Cancelled.', (t) => t.add(op.set('17', 'st', 'Cancelled')).add(op.focus('17', true, 'bad'), 0.3))
    .show('Heartbeatِ Workerها یک شرط اضافه دارد: عملیات هنوز Running باشد.', hb)
    .s('Heartbeatِ بعدی <b>۰ ردیف</b> برمی‌گرداند؛ پس هر Worker خودش می‌ایستد.', (t) => t.add(w1.msg('(0 rows affected)', 'bad')).add(w1.state('idle', 'Stopped'), 0.3).add(w1.dim(true), 0.5).add(it.set('61', 'status', 'Cancelled'), 0.6)
      .add(w2.msg('(0 rows affected)', 'bad'), 1.0).add(w2.state('idle', 'Stopped'), 1.3).add(w2.dim(true), 1.5).add(it.set('62', 'status', 'Cancelled'), 1.6))
    .s('آیتم‌های باقی‌مانده دسته‌دسته Cancelled می‌شوند.', (t) => t.add(it.set('63', 'status', 'Cancelled')).add(it.set('64', 'status', 'Cancelled'), 0.25))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- issue 7 · transient vs permanent errors

export function errors(stage: HTMLElement) {
  const b = build(stage, { id: 'errors', chapter: CH.real, label: 'Retry', title: 'کدام خطا را Retry کنیم؟', badge: chal(7) });
  const retry = node(b.el, `${ICON.refresh}<b>Retry، با تأخیر</b><small>خطای گذرا؛ احتمالاً بار بعد درست می‌شود</small>`, 1180, 560, 560, 'tone t-t1 bin');
  const fail = node(b.el, `${ICON.cross}<b>Failed، بدون تکرار</b><small>خطای قطعی؛ تکرارش فقط بار اضافه است</small>`, 180, 560, 560, 'tone t-bad bin');
  const chips = [['1205 · deadlock victim', 'r'], ['1222 · lock timeout', 'r'], ['network timeout', 'r'], ['invalid national code', 'f'], ['record not found', 'f']].map(([t, kind], i) => {
    const e = h('div', `echip ${kind}`, t, b.el);
    e.dir = 'ltr';
    gsap.set(e, { x: 760, y: 280 + i * 54, opacity: 0 });
    return { e, kind };
  });
  const back = node(b.el, `<label>تأخیر بین Retryها، کمی تصادفی (Jitter)</label><div class="backoff"><i style="width:60px">1s</i><i style="width:120px">2s</i><i style="width:240px">4s</i><i style="width:480px">8s</i></div>`, 1180, 300, 560, 'codebox');
  const rule = ruleCard(b.el, { name: 'گذرا یا قطعی؟', tone: 'ok', kicker: 'حل چالش ۷', body: 'Deadlock (<code>1205</code>)، Lock Timeout (<code>1222</code>) و قطعی شبکه <b>گذرا</b>اند: با تأخیرِ افزایشی و کمی Jitter دوباره امتحان می‌شوند. خطای قانونِ کسب‌وکار <b>قطعی</b> است: آیتم بلافاصله Failed می‌شود.' });
  b.show('چالش ۷: کارِ یک آیتم با خطا تمام شد. Retry کنیم؟ دو مسیر داریم، و این خطاها از راه می‌رسند.', [fail, retry], (t) => chips.forEach(({ e }, i) => t.fromTo(e, { opacity: 0, x: 820 }, { opacity: 1, x: 760, duration: 0.4, immediateRender: false }, 0.5 + i * 0.12)))
    .s('Deadlock، Lock Timeout و قطعی شبکه، <b>گذرا</b>اند.', (t) => chips.filter((c) => c.kind === 'r').forEach(({ e }, i) => t.to(e, { x: 1250 + (i % 2) * 60, y: 710 + i * 46, duration: 0.9, ease: 'power2.inOut' }, i * 0.15)))
    .s('خطای قانونِ کسب‌وکار، <b>قطعی</b> است؛ تکرارش فایده‌ای ندارد.', (t) => chips.filter((c) => c.kind === 'f').forEach(({ e }, i) => t.to(e, { x: 260 + i * 60, y: 710 + i * 46, duration: 0.9, ease: 'power2.inOut' }, i * 0.15)))
    .show('و Retry با تأخیرِ افزایشی (Exponential Backoff)، تا همه با هم برنگردند.', back)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- issue 8 · one clock

export function oneClock(stage: HTMLElement) {
  const b = build(stage, { id: 'clock', chapter: CH.real, label: 'Clock Skew', title: 'ساعتِ چه کسی؟', badge: chal(8) });
  const table = itemsTable(b.el, [{ id: '42', status: 'Processing', att: '0', tok: '7f3a', until: '12:00:30' }]);
  const s1 = node(b.el, `${ICON.clock}<b dir="ltr">12:00:35</b><small>ساعتِ سرور api-1</small>`, 1404, 280, 420, 'tone t-t1 clk');
  const s2 = node(b.el, `${ICON.clock}<b dir="ltr">12:00:28</b><small>ساعتِ سرور api-2 (۷ ثانیه عقب)</small>`, 1404, 520, 420, 'tone t-t2 clk');
  const v1 = tag(b.el, 'Lease منقضی شده؛ برش می‌دارم', 't1-tag', { x: 1614, y: 458 });
  const v2 = tag(b.el, 'به نظرم هنوز مال من است', 't2-tag', { x: 1614, y: 698 });
  const both = note(b.el, '<b>دو صاحب</b> برای یک آیتم، فقط به‌خاطر ۷ ثانیه اختلاف ساعت.', 'bad', 150, 520, 880);
  const fix = node(b.el, `<label>راه‌حل: «منقضی شد» را فقط پایگاه داده تعیین کند</label><pre dir="ltr">${cm('one clock for everyone')}\n${k('WHERE')} … ${hl(`${k('AND')} LockUntil &lt; ${k('SYSUTCDATETIME')}()`)}</pre>`, 150, 700, 880, 'codebox');
  b.hide(v1, v2);
  const rule = ruleCard(b.el, { name: 'یک ساعتِ مرجع', tone: 'ok', kicker: 'حل چالش ۸', body: 'هیچ سروری با ساعتِ خودش دربارهٔ انقضا قضاوت نمی‌کند. زمان‌ها با <code>SYSUTCDATETIME()</code> <b>داخل خودِ دستور</b> سنجیده می‌شوند؛ همه یک ساعت دارند: ساعتِ پایگاه داده.' });
  b.show('چالش ۸: «Lease تمام شده یا نه؟» را چه کسی تعیین می‌کند؟ Lease آیتم ۴۲ تا 12:00:30 است و ساعتِ دو سرور کمی اختلاف دارد.', [s1, s2], (t) => t.add(table.mark('42', 'until', 't1'), 0), { stagger: 0.3 })
    .s('هر سرور با ساعتِ خودش قضاوت می‌کند: api-1 می‌گوید منقضی شده؛ api-2 می‌گوید هنوز معتبر است.', (t) => t.fromTo(v1, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }).fromTo(v2, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 0.9))
    .show('نتیجه: <b>دو صاحب</b> برای یک آیتم.', both.el)
    .show('راه‌حل: «منقضی شد» را فقط پایگاه داده تعیین کند.', fix)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

