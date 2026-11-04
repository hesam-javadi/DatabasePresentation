import gsap from 'gsap';
import { build } from '../core/build';
import { h } from '../core/dom';
import { arrow, ruleCard, tag, Lanes } from '../kit/parts';
import { ICON } from '../kit/icons';
import { CH, sections, SEC, card, k, cm, lanes, LAY } from './common';
import { DbTable } from '../kit/table';

// ---------------------------------------------------------------- 1 · what a transaction is

export function txnSlide(stage: HTMLElement) {
  const b = build(stage, { id: 'txn', chapter: CH.basics, label: 'تراکنش', title: 'تراکنش چیست؟', term: 'Transaction' });
  const tb = sections(b.el, [SEC.g1('30'), SEC.g2('25'), { id: '3', title: 'پایگاه داده ۳', cap: '30', enr: '30' }]);
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'تغییر گروه: ۱ ← ۲', exec: cm('waiting') });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'تغییر گروه: ۲ ← ۳', exec: cm('waiting') });
  const err = tag(b.el, `${ICON.cross} <span dir="ltr">31 &gt; Capacity</span>`, 'bad mono check', { x: tb.cell('3', 'enr').x, y: tb.rowY('3') - 30 });
  const a1 = arrow(b.f, sara.side('left', 0), tb.edge('1', 'right', 10), 't1', { bend: 0.1 });
  const a2 = arrow(b.f, sara.side('left', 40), tb.edge('2', 'right', 10), 't1', { bend: 0.1 });
  const r1 = arrow(b.f, reza.side('right', 40), tb.edge('2', 'left', 10), 't2', { bend: -0.1 });
  const r2 = arrow(b.f, reza.side('right', 80), tb.edge('3', 'left', 10), 't2', { bend: 0.1 });
  const rule = ruleCard(b.el, { name: 'تراکنش: همه یا هیچ', term: 'Atomicity', tone: 'ink', kicker: 'جمع‌بندی', body: 'دستورهای یک تراکنش یا <b>با هم ماندگار</b> می‌شوند (<code>COMMIT</code>) یا <b>با هم برمی‌گردند</b> (<code>ROLLBACK</code>). تا قبل از COMMIT، تغییر را «جوهر خیس» نشان می‌دهیم: هنوز قطعی نیست.' });

  b.s('تراکنش یعنی چند دستور که با هم <b>یک کار</b> را انجام می‌دهند.')
    .show('این جدول <code>Sections</code> است: هر ردیف یک گروه درسی، با ظرفیت و تعداد ثبت‌نامی.', tb.el)
    .show('سارا می‌خواهد از گروه ۱ به گروه ۲ برود. این یعنی <b>دو</b> تغییر.', sara.el)
    .s('تراکنش شروع می‌شود.', (t) => t.add(sara.exec(`${k('BEGIN TRAN')}`)).add(sara.state('run', 'در حال اجرا'), 0))
    .s('اول یک نفر از گروه ۱ کم می‌شود. رنگ آبی و خط‌چین یعنی این تغییر <b>هنوز commit نشده</b>.', (t) =>
      t.add(sara.exec(`${k('UPDATE')} Sections\n${k('SET')} Enrolled = Enrolled - 1\n${k('WHERE')} Id = 1`)).add(a1.draw(), 0.3).add(tb.set('1', 'enr', '29', { wet: 't1' }), 1.0).add(a1.hide(), 1.6))
    .s('بعد یک نفر به گروه ۲ اضافه می‌شود.', (t) =>
      t.add(sara.exec(`${k('UPDATE')} Sections\n${k('SET')} Enrolled = Enrolled + 1\n${k('WHERE')} Id = 2`)).add(a2.draw(), 0.3).add(tb.set('2', 'enr', '26', { wet: 't1' }), 1.0).add(a2.hide(), 1.6))
    .s('<code>COMMIT</code>: هر دو تغییر <b>با هم</b> ماندگار می‌شوند. جوهر خشک شد.', (t) =>
      t.add(sara.exec(k('COMMIT'))).add(tb.dry('1'), 0.4).add(tb.dry('2'), 0.4).add(sara.state('ok', 'انجام شد'), 0.8))
    .show('حالا رضا می‌خواهد از گروه ۲ به گروه ۳ برود؛ ولی گروه ۳ پر است.', reza.el)
    .s('اول از گروه ۲ کم می‌شود؛ هنوز commit نشده.', (t) =>
      t.add(reza.exec(`${k('BEGIN TRAN')}\n${k('UPDATE')} Sections\n${k('SET')} Enrolled = Enrolled - 1\n${k('WHERE')} Id = 2`)).add(reza.state('run', 'در حال اجرا'), 0).add(r1.draw(), 0.3).add(tb.set('2', 'enr', '25', { wet: 't2' }), 1.0).add(r1.hide(), 1.6))
    .s('بعد باید به گروه ۳ اضافه شود؛ ولی گروه ۳ پر است و قید جدول (<code>Enrolled &lt;= Capacity</code>) خطا می‌دهد.', (t) =>
      t.add(reza.exec(`${k('UPDATE')} Sections\n${k('SET')} Enrolled = Enrolled + 1\n${k('WHERE')} Id = 3\n${cm('CHECK (Enrolled <= Capacity)')}`)).add(r2.draw(), 0.3)
        .fromTo(err, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, immediateRender: false }, 1.1)
        .to(tb.cellEl('3', 'enr'), { x: 6, duration: 0.07, yoyo: true, repeat: 5 }, 1.2)
        .add(reza.msg('Msg 547: CHECK constraint', 'bad'), 1.4).add(r2.hide(), 1.8))
    .s('<code>ROLLBACK</code>: کم‌شدن از گروه ۲ هم <b>برمی‌گردد</b>. چیزی نیمه‌کاره نمی‌ماند.', (t) =>
      t.add(reza.exec(k('ROLLBACK'))).to(err, { opacity: 0, duration: 0.3 }, 0.2).add(tb.evaporate('2'), 0.4).add(reza.state('bad', 'برگشت خورد'), 1.2))
    .s(null, (t) => t.add(rule.show()));
  gsap.set(err, { opacity: 0 });
  return b.done();
}

// ---------------------------------------------------------------- 2 · interleaving

export function interleaveSlide(stage: HTMLElement) {
  const b = build(stage, { id: 'interleave', chapter: CH.basics, label: 'هم‌زمانی', title: 'چند کاربر، یک پایگاه داده', term: 'Interleaving' });
  const code = (who: string) => `${cm(who)}\n${k('①')} ${k('SELECT')} Enrolled … Id = 2\n${k('②')} ${k('UPDATE')} Sections … Id = 2`;
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'ثبت‌نام در گروه ۲', exec: code('Sara'), execLabel: 'دو دستور' });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'ثبت‌نام در گروه ۲', exec: code('Reza'), execLabel: 'دو دستور' });
  const ln: Lanes = lanes(b.el, [{ tone: 't1', label: 'T1 · سارا' }, { tone: 't2', label: 'T2 · رضا' }], 6, 640);
  const orders = h('div', 'orders', `<label>چند ترتیب ممکن، از میان شش ترتیب</label>
    ${[['t1', 't1', 't2', 't2'], ['t1', 't2', 't1', 't2'], ['t2', 't1', 't1', 't2'], ['t2', 't2', 't1', 't1']].map((o) => `<div class="ord">${o.map((x) => `<i class="t-${x}">${x === 't1' ? 'T1' : 'T2'}</i>`).join('')}</div>`).join('')}`, b.el);
  const rule = ruleCard(b.el, { name: 'هم‌زمانی یعنی درهم‌رفتن دستورها', tone: 'ink', kicker: 'جمع‌بندی', body: 'دستورهای تراکنش‌های مختلف <b>یکی در میان</b> اجرا می‌شوند و ترتیبشان دست ما نیست. کد درست، کدی است که با <b>هر ترتیبی</b> درست بماند.' });

  b.s('سرور پایگاه داده هم‌زمان به ده‌ها اتصال جواب می‌دهد. هر اتصال، تراکنش خودش را دارد.')
    .show('سارا دو دستور دارد: یک خواندن و یک نوشتن.', sara.el)
    .show('رضا هم همان دو دستور را دارد.', reza.el)
    .show('هر خط زمانی مال یک تراکنش است. زمان از راست به چپ جلو می‌رود.', ln.el)
    .s('اول دستور ① سارا اجرا می‌شود.', (t) => t.add(ln.ev(0, 1, 'SELECT')))
    .s('بعد دستور ① رضا.', (t) => t.add(ln.ev(1, 2, 'SELECT')))
    .s('بعد دستور ② سارا.', (t) => t.add(ln.ev(0, 3, 'UPDATE')))
    .s('و در آخر دستور ② رضا. دستورها <b>یکی در میان</b> اجرا شدند.', (t) => t.add(ln.ev(1, 4, 'UPDATE')))
    .show('دفعهٔ بعد ممکن است ترتیب فرق کند. برنامه‌نویس ترتیب را انتخاب نمی‌کند.', orders)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- 3 · S and X locks

export function locksSlide(stage: HTMLElement) {
  const b = build(stage, { id: 'locks', chapter: CH.basics, label: 'قفل', title: 'قفل اشتراکی و قفل انحصاری', term: 'S / X Locks' });
  const tb = new DbTable(b.el, { name: 'dbo.Sections', x: 717, y: LAY.tableY, rowH: 84, cols: [{ key: 'id', label: 'Id', w: 100, kind: 'mono', pk: true }, { key: 'title', label: 'Title', w: 230 }, { key: 'cap', label: 'Capacity', w: 155, kind: 'num' }], rows: [SEC.g1(), SEC.g2(), SEC.os()] });
  const t1 = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'می‌خواند', exec: `${k('SELECT')} Capacity\n${k('FROM')} Sections ${k('WHERE')} Id = 2` });
  const t2 = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'می‌خواند', exec: `${k('SELECT')} Capacity\n${k('FROM')} Sections ${k('WHERE')} Id = 2` });
  const t3 = card.right(b.el, 't3', 'T3', { name: 'کارمند آموزش', sub: 'می‌نویسد', y: 650, exec: `${k('UPDATE')} Sections ${k('SET')} Capacity = 35\n${k('WHERE')} Id = 2` });
  t3.el.classList.add('compact');
  const grid = h('div', 'compat', `<label>آیا دو قفل با هم کنار می‌آیند؟</label>
    <div class="cg"><span></span><b>S می‌خواهد</b><b>X می‌خواهد</b>
    <b>S دارد</b><i data-k="ss"></i><i data-k="sx"></i>
    <b>X دارد</b><i data-k="xs"></i><i data-k="xx"></i></div>`, b.el);
  const cell = (key: string, ok: boolean) => {
    const c = grid.querySelector(`[data-k="${key}"]`) as HTMLElement;
    const e = h('span', `res ${ok ? 'ok' : 'bad'}`, ok ? ICON.check : ICON.cross, c);
    gsap.set(e, { opacity: 0 });
    return gsap.fromTo(e, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.4)', immediateRender: false });
  };
  const rule = ruleCard(b.el, { name: 'S با S کنار می‌آید؛ X با هیچ‌کس', tone: 'ink', kicker: 'جمع‌بندی', body: 'قفل <b>S</b> برای خواندن است و چند خواننده می‌توانند هم‌زمان داشته باشندش. قفل <b>X</b> برای نوشتن است و تا پایان تراکنش فقط دست یک نفر است. کسی که قفل ناسازگار بخواهد، <b>منتظر می‌ماند</b>.' });
  const row = '2';
  b.s('قفل یعنی «فعلاً به این ردیف دست نزن». دو نوع اصلی دارد.')
    .show('همان جدول گروه‌های درسی.', tb.el, (t) => t.add(tb.focus(row, true), 0.6))
    .show('سارا می‌خواهد ردیف گروه ۲ را بخواند.', t1.el)
    .s('برای خواندن، قفل <b>S</b> (اشتراکی) می‌گیرد. حاشیهٔ خط‌چین و نشان سفید یعنی قفل S.', (t) => t.add(tb.lock(row, 't1', 'T1', 'S', 'right')))
    .show('رضا هم همین ردیف را می‌خواند.', t2.el)
    .s('رضا هم قفل S می‌گیرد. <b>دو قفل S با هم کنار می‌آیند.</b>', (t) => t.add(tb.lock(row, 't2', 'T2', 'S', 'left')))
    .show('این جدول کوچک، سازگاری قفل‌ها را جمع می‌کند.', grid, (t) => t.add(cell('ss', true), 0.4))
    .show('حالا کارمند آموزش می‌خواهد ظرفیت همین گروه را عوض کند.', t3.el)
    .s('نوشتن قفل <b>X</b> می‌خواهد و X با S کنار نمی‌آید. پس <b>منتظر</b> می‌ماند.', (t) =>
      t.add(tb.wait(row, 't3', 'T3', 'right', 136)).add(t3.state('wait', 'منتظر'), 0.2).add(cell('sx', false), 0.6))
    .s('خواننده‌ها کارشان تمام می‌شود و قفل‌های S آزاد می‌شوند.', (t) =>
      t.add(tb.unlock(row, 't1')).add(tb.unlock(row, 't2'), 0.3).add(t1.state('ok', 'تمام'), 0.5).add(t2.state('ok', 'تمام'), 0.5))
    .s('حالا کارمند قفل <b>X</b> را می‌گیرد: حاشیهٔ پررنگ و هاشور یعنی انحصاری.', (t) =>
      t.add(tb.unwait(row, 't3')).add(tb.lock(row, 't3', 'T3', 'X', 'right'), 0.3).add(t3.state('run', 'در حال نوشتن'), 0.3).add(tb.set(row, 'cap', '35', { wet: 't3' }), 1.0))
    .s('تا وقتی X هست، <b>حتی خواندن</b> هم باید منتظر بماند.', (t) =>
      t.add(t2.exec(`${k('SELECT')} Capacity\n${k('FROM')} Sections ${k('WHERE')} Id = 2`)).add(tb.wait(row, 't2', 'T2', 'left')).add(t2.state('wait', 'منتظر'), 0.2).add(cell('xs', false), 0.6).add(cell('xx', false), 0.8))
    .s('کارمند commit می‌کند؛ قفل X آزاد می‌شود و رضا مقدار تازه را می‌خواند.', (t) =>
      t.add(tb.dry(row)).add(tb.unlock(row, 't3'), 0.3).add(t3.state('ok', 'انجام شد'), 0.4).add(tb.unwait(row, 't2'), 0.8).add(tb.flash(row, 't2', 0.5), 1.0).add(t2.state('ok', 'خواند: ۳۵'), 1.2))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- 4 · the visual language, recalled

export function legendSlide(stage: HTMLElement) {
  const b = build(stage, { id: 'legend', chapter: CH.basics, label: 'زبان تصویری', title: 'چطور اسلایدهای بعد را بخوانیم' });
  const items: [string, string, string][] = [
    ['<span class="lg-wet">29</span>', 'جوهر خیس', 'نوشته شده، ولی هنوز commit نشده'],
    ['<span class="lg-dry">29</span>', 'جوهر خشک', 'commit شده و ماندگار'],
    [`<span class="lg-x">${ICON.lock}<b>X</b></span>`, 'قفل X', 'نوشتن؛ فقط یک نفر'],
    [`<span class="lg-s">${ICON.lock}<b>S</b></span>`, 'قفل S', 'خواندن؛ چند نفر با هم'],
    ['<span class="lg-w">T2</span>', 'در انتظار', 'منتظر آزاد شدن یک قفل'],
    ['<span class="lg-mem">enrolled = 29</span>', 'حافظهٔ برنامه', 'مقداری که برنامه باور دارد؛ شاید کهنه'],
    ['<span class="lg-ev">UPDATE</span>', 'خط زمانی', 'ترتیب رویدادها، از راست به چپ'],
  ];
  const grid = h('div', 'legend', '', b.el);
  const els = items.map(([v, n, d]) => h('div', 'lg', `<div class="lg-v">${v}</div><div><b>${n}</b><span>${d}</span></div>`, grid));
  b.s('قبل از مشکلات، نمادهایی را که دیدیم یک‌جا مرور کنیم.');
  els.forEach((e) => b.show(null, e, undefined, { y: 16 }));
  return b.done();
}
