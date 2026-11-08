import gsap from 'gsap';
import { build } from '../core/build';
import { h } from '../core/dom';
import { arrow, ruleCard, tag, Lanes } from '../kit/parts';
import { ICON } from '../kit/icons';
import { CH, sections, SEC, card, k, cm, lanes, LAY } from './common';
import { DbTable } from '../kit/table';

// ---------------------------------------------------------------- 1 · what a transaction is

export function txnSlide(stage: HTMLElement) {
  const b = build(stage, { id: 'txn', chapter: CH.basics, label: 'Transaction', title: 'Transaction چیست؟', term: 'BEGIN · COMMIT · ROLLBACK' });
  const tb = sections(b.el, [SEC.g1('30'), SEC.g2('25'), { id: '3', title: 'پایگاه داده ۳', cap: '30', enr: '30' }]);
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'تغییر گروه: ۱ ← ۲', exec: cm('waiting') });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'تغییر گروه: ۲ ← ۳', exec: cm('waiting') });
  const err = tag(b.el, `${ICON.cross} <span dir="ltr">31 &gt; Capacity</span>`, 'bad mono check', { x: tb.cell('3', 'enr').x, y: tb.rowY('3') - 30 });
  const a1 = arrow(b.f, sara.side('left', 0), tb.edge('1', 'right', 10), 't1', { bend: 0.1 });
  const a2 = arrow(b.f, sara.side('left', 40), tb.edge('2', 'right', 10), 't1', { bend: 0.1 });
  const r1 = arrow(b.f, reza.side('right', 40), tb.edge('2', 'left', 10), 't2', { bend: -0.1 });
  const r2 = arrow(b.f, reza.side('right', 80), tb.edge('3', 'left', 10), 't2', { bend: 0.1 });
  const rule = ruleCard(b.el, { name: 'Transaction: همه یا هیچ', term: 'Atomicity', tone: 'ink', kicker: 'جمع‌بندی', body: 'دستورهای یک Transaction یا <b>با هم ماندگار</b> می‌شوند (<code>COMMIT</code>) یا <b>با هم برمی‌گردند</b> (<code>ROLLBACK</code>). تا قبل از COMMIT، تغییر <b>uncommitted</b> است (رنگی و خط‌چین): هنوز قطعی نیست.' });

  b.show('Transaction یعنی چند دستور که با هم <b>یک کار</b> را انجام می‌دهند. سارا می‌خواهد از گروه ۱ به گروه ۲ برود: <b>دو</b> تغییر.', sara.el)
    .s('Transaction شروع می‌شود و اول یک نفر از گروه ۱ کم می‌شود. رنگ و خط‌چین یعنی <b>uncommitted</b>: هنوز قطعی نیست.', (t) =>
      t.add(sara.exec(`${k('BEGIN TRAN')}\n${k('UPDATE')} Sections\n${k('SET')} Enrolled = Enrolled - 1\n${k('WHERE')} Id = 1`)).add(sara.state('run', 'Running'), 0).add(a1.draw(), 0.3).add(tb.set('1', 'enr', '29', { wet: 't1' }), 1.0).add(a1.hide(), 1.6))
    .s('بعد یک نفر به گروه ۲ اضافه می‌شود.', (t) =>
      t.add(sara.exec(`${k('UPDATE')} Sections\n${k('SET')} Enrolled = Enrolled + 1\n${k('WHERE')} Id = 2`)).add(a2.draw(), 0.3).add(tb.set('2', 'enr', '26', { wet: 't1' }), 1.0).add(a2.hide(), 1.6))
    .s('<code>COMMIT</code>: هر دو تغییر <b>با هم</b> ماندگار می‌شوند؛ حالا <b>committed</b> هستند.', (t) =>
      t.add(sara.exec(k('COMMIT'))).add(tb.dry('1'), 0.4).add(tb.dry('2'), 0.4).add(sara.state('ok', 'Committed'), 0.8))
    .show('حالا رضا می‌خواهد از گروه ۲ به گروه ۳ برود. اول از گروه ۲ کم می‌شود؛ uncommitted.', reza.el, (t) =>
      t.add(reza.exec(`${k('BEGIN TRAN')}\n${k('UPDATE')} Sections\n${k('SET')} Enrolled = Enrolled - 1\n${k('WHERE')} Id = 2`)).add(reza.state('run', 'Running'), 0).add(r1.draw(), 0.3).add(tb.set('2', 'enr', '25', { wet: 't2' }), 1.0).add(r1.hide(), 1.6))
    .s('بعد باید به گروه ۳ اضافه شود؛ ولی گروه ۳ پر است و قید جدول (<code>Enrolled &lt;= Capacity</code>) خطا می‌دهد.', (t) =>
      t.add(reza.exec(`${k('UPDATE')} Sections\n${k('SET')} Enrolled = Enrolled + 1\n${k('WHERE')} Id = 3\n${cm('CHECK Enrolled<=Capacity')}`)).add(r2.draw(), 0.3)
        .fromTo(err, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, immediateRender: false }, 1.1)
        .to(tb.cellEl('3', 'enr'), { x: 6, duration: 0.07, yoyo: true, repeat: 5 }, 1.2)
        .add(reza.msg('Msg 547: CHECK constraint', 'bad'), 1.4).add(r2.hide(), 1.8))
    .s('<code>ROLLBACK</code>: کم‌شدن از گروه ۲ هم <b>برمی‌گردد</b>. چیزی نیمه‌کاره نمی‌ماند.', (t) =>
      t.add(reza.exec(k('ROLLBACK'))).to(err, { opacity: 0, duration: 0.3 }, 0.2).add(tb.evaporate('2'), 0.4).add(reza.state('bad', 'Rolled back'), 1.2))
    .s(null, (t) => t.add(rule.show()));
  gsap.set(err, { opacity: 0 });
  return b.done();
}

// ---------------------------------------------------------------- 2 · interleaving

export function interleaveSlide(stage: HTMLElement) {
  const b = build(stage, { id: 'interleave', chapter: CH.basics, label: 'Interleaving', title: 'چند کاربر، یک پایگاه داده', term: 'Interleaving' });
  const code = (who: string) => `${cm(who)}\n${k('①')} ${k('SELECT')} Enrolled … Id = 2\n${k('②')} ${k('UPDATE')} Sections … Id = 2`;
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'ثبت‌نام در گروه ۲', exec: code('Sara'), execLabel: 'دو دستور' });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'ثبت‌نام در گروه ۲', exec: code('Reza'), execLabel: 'دو دستور' });
  const ln: Lanes = lanes(b.el, [{ tone: 't1', label: 'T1 · سارا' }, { tone: 't2', label: 'T2 · رضا' }], 6, 640);
  const orders = h('div', 'orders', `<label>چند ترتیب ممکن، از میان شش ترتیب</label>
    ${[['t1', 't1', 't2', 't2'], ['t1', 't2', 't1', 't2'], ['t2', 't1', 't1', 't2'], ['t2', 't2', 't1', 't1']].map((o) => `<div class="ord">${o.map((x) => `<i class="t-${x}">${x === 't1' ? 'T1' : 'T2'}</i>`).join('')}</div>`).join('')}`, b.el);
  const rule = ruleCard(b.el, { name: 'هم‌زمانی یعنی درهم‌رفتن دستورها', tone: 'ink', kicker: 'جمع‌بندی', body: 'دستورهای Transactionهای مختلف <b>یکی در میان</b> اجرا می‌شوند و ترتیبشان دست ما نیست. کد درست، کدی است که با <b>هر ترتیبی</b> درست بماند.' });

  b.show('سرور هم‌زمان به ده‌ها اتصال جواب می‌دهد. سارا و رضا هر کدام دو دستور دارند: یک Read و یک Write.', [sara.el, reza.el, ln.el])
    .s('دستورها <b>یکی در میان</b> اجرا می‌شوند: ① سارا، ① رضا، ② سارا، ② رضا.', (t) => t.add(ln.ev(0, 1, 'SELECT')).add(ln.ev(1, 2, 'SELECT'), 0.7).add(ln.ev(0, 3, 'UPDATE'), 1.4).add(ln.ev(1, 4, 'UPDATE'), 2.1))
    .show('دفعهٔ بعد ممکن است ترتیب فرق کند. برنامه‌نویس ترتیب را انتخاب نمی‌کند.', orders)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- 3 · S and X locks

export function locksSlide(stage: HTMLElement) {
  const b = build(stage, { id: 'locks', chapter: CH.basics, label: 'Lock', title: 'Shared Lock و Exclusive Lock', term: 'S / X' });
  const tb = new DbTable(b.el, { name: 'dbo.Sections', x: 717, y: LAY.tableY, rowH: 84, cols: [{ key: 'id', label: 'Id', w: 100, kind: 'mono', pk: true }, { key: 'title', label: 'Title', w: 230 }, { key: 'cap', label: 'Capacity', w: 155, kind: 'num' }], rows: [SEC.g1(), SEC.g2(), SEC.os()] });
  const t1 = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'Read', exec: `${k('SELECT')} Capacity\n${k('FROM')} Sections ${k('WHERE')} Id = 2` });
  const t2 = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'Read', exec: `${k('SELECT')} Capacity\n${k('FROM')} Sections ${k('WHERE')} Id = 2` });
  const t3 = card.right(b.el, 't3', 'T3', { name: 'کارمند آموزش', sub: 'Write', y: 650, exec: `${k('UPDATE')} Sections\n${k('SET')} Capacity = 35\n${k('WHERE')} Id = 2` });
  t3.el.classList.add('compact');
  const grid = h('div', 'compat', `<label>آیا دو Lock با هم کنار می‌آیند؟</label>
    <div class="cg"><span></span><b>S می‌خواهد</b><b>X می‌خواهد</b>
    <b>S دارد</b><i data-k="ss"></i><i data-k="sx"></i>
    <b>X دارد</b><i data-k="xs"></i><i data-k="xx"></i></div>`, b.el);
  const cell = (key: string, ok: boolean) => {
    const c = grid.querySelector(`[data-k="${key}"]`) as HTMLElement;
    const e = h('span', `res ${ok ? 'ok' : 'bad'}`, ok ? ICON.check : ICON.cross, c);
    gsap.set(e, { opacity: 0 });
    return gsap.fromTo(e, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.4)', immediateRender: false });
  };
  const rule = ruleCard(b.el, { name: 'S با S کنار می‌آید؛ X با هیچ‌کس', tone: 'ink', kicker: 'جمع‌بندی', body: '<b>Shared Lock (S)</b> برای Read است و چند نفر می‌توانند هم‌زمان داشته باشندش. <b>Exclusive Lock (X)</b> برای Write است و تا پایان Transaction فقط دست یک نفر است. کسی که Lock ناسازگار بخواهد، <b>Wait</b> می‌کند.' });
  const row = '2';
  b.show('Lock یعنی «فعلاً به این ردیف دست نزن». سارا ردیف گروه ۲ را Read می‌کند و <b>Shared Lock (S)</b> می‌گیرد.', t1.el, (t) => t.add(tb.focus(row, true), 0).add(tb.lock(row, 't1', 'T1', 'S', 'right'), 0.4))
    .show('رضا هم همین ردیف را Read می‌کند و S می‌گیرد. <b>دو S با هم کنار می‌آیند.</b>', [t2.el, grid], (t) => t.add(tb.lock(row, 't2', 'T2', 'S', 'left'), 0.2).add(cell('ss', true), 0.8))
    .show('کارمند آموزش می‌خواهد ظرفیت را Write کند: <b>Exclusive Lock (X)</b> لازم دارد و X با S کنار نمی‌آید؛ پس <b>Wait</b> می‌کند.', t3.el, (t) =>
      t.add(tb.wait(row, 't3', 'T3', 'right', 136), 0.3).add(t3.state('wait', 'Waiting'), 0.5).add(cell('sx', false), 0.9))
    .s('Readها تمام می‌شوند و S آزاد می‌شود؛ حالا کارمند X را می‌گیرد. حاشیهٔ پررنگ و هاشور یعنی X.', (t) =>
      t.add(tb.unlock(row, 't1')).add(tb.unlock(row, 't2'), 0.3).add(t1.state('ok', 'Done'), 0.5).add(t2.state('ok', 'Done'), 0.5)
        .add(tb.unwait(row, 't3'), 1.0).add(tb.lock(row, 't3', 'T3', 'X', 'right'), 1.3).add(t3.state('run', 'Writing'), 1.3).add(tb.set(row, 'cap', '35', { wet: 't3' }), 2.0))
    .s('تا وقتی X هست، <b>حتی Read</b> هم باید Wait کند.', (t) =>
      t.add(t2.exec(`${k('SELECT')} Capacity\n${k('FROM')} Sections ${k('WHERE')} Id = 2`)).add(tb.wait(row, 't2', 'T2', 'left')).add(t2.state('wait', 'Waiting'), 0.2).add(cell('xs', false), 0.6).add(cell('xx', false), 0.8))
    .s('کارمند Commit می‌کند؛ X آزاد می‌شود و رضا مقدار تازه را Read می‌کند.', (t) =>
      t.add(tb.dry(row)).add(tb.unlock(row, 't3'), 0.3).add(t3.state('ok', 'Committed'), 0.4).add(tb.unwait(row, 't2'), 0.8).add(tb.flash(row, 't2', 0.5), 1.0).add(t2.state('ok', 'Read: 35'), 1.2))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

