import gsap from 'gsap';
import { build, Builder } from '../core/build';
import { h } from '../core/dom';
import { arrow, TxnCard, ruleCard, note, tag, node } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';
import { CH, k, cm, hl, fa } from './common';

const Y = 268;
export const LEVELS = [
  { name: 'READ UNCOMMITTED', cost: 'بدون قفل خواندن' },
  { name: 'READ COMMITTED', cost: 'قفل S کوتاه · پیش‌فرض' },
  { name: 'REPEATABLE READ', cost: 'قفل S تا پایان' },
  { name: 'SERIALIZABLE', cost: 'قفل روی بازه' },
  { name: 'SNAPSHOT', cost: 'نسخه‌ها در tempdb' },
];
const ANOM = ['خواندن کثیف', 'خواندن تکرارنشدنی', 'ردیف شبح'];
const VERDICT: ('ok' | 'bad')[][] = [['bad', 'bad', 'bad'], ['ok', 'bad', 'bad'], ['ok', 'ok', 'bad'], ['ok', 'ok', 'ok'], ['ok', 'ok', 'ok']];

const COLS = [
  { key: 'k', label: 'Id', w: 120, kind: 'mono' as const, pk: true },
  { key: 'name', label: 'Name', w: 200 },
  { key: 'g', label: 'Grade', w: 160, kind: 'num' as const },
];
const ROWS = () => [{ id: '10', k: '10', name: 'سارا', g: '17' }, { id: '20', k: '20', name: 'رضا', g: '12' }, { id: '30', k: '30', name: 'مینا', g: '15' }];
const NEW = { id: '25', k: '25', name: 'نیما', g: '18' };
const R = (n: number, sum: number, cls = '') => `<span class="${cls}">${n} rows · Σ ${sum}</span>`;
const ST = { wet: '<span class="s-wet">uncommitted</span>', wait: '<span class="s-wait">waiting…</span>', ok: '<span class="s-ok">committed</span>', back: '<span class="s-back">rolled back</span>' };

const T1_CODE = `${k('①')} ${k('INSERT')} Grades ${k('VALUES')}\n   (25, ${fa('نیما')}, 18)\n${k('②')} ${k('UPDATE')} Grades ${k('SET')}\n   Grade = 16 ${k('WHERE')} Id = 20`;
const t2Code = (lvl: string) => `${hl(`${cm('')}${lvl}`)}\n${k('SELECT COUNT')}(*), ${k('SUM')}(Grade)\n${k('FROM')} Grades ${k('WHERE')} Id ${k('BETWEEN')} 10 ${k('AND')} 30\n${cm('twice, then COMMIT')}`;

/** Table + both cards of the isolation scenario (all hidden until shown). */
function scene(root: HTMLElement, lvl: string) {
  const table = new DbTable(root, { name: 'dbo.Grades', x: 720, y: Y, rowH: 74, gap: 22, cols: COLS, rows: ROWS() });
  const t1 = new TxnCard(root, { tone: 't1', who: 'T1', name: 'استاد', sub: 'دو نوشتن جدا', x: 96, y: Y, w: 420, exec: T1_CODE, execLabel: 'دستورها', memLabel: 'وضعیت', mem: [{ key: 'INSERT', init: '<span class="null">—</span>' }, { key: 'UPDATE', init: '<span class="null">—</span>' }] });
  const t2 = new TxnCard(root, { tone: 't2', who: 'T2', name: 'گزارش درس', sub: 'یک تراکنش، دو خواندن', x: 1404, y: Y, w: 420, exec: t2Code(lvl), execLabel: 'تراکنش', memLabel: 'نتیجهٔ خواندن‌ها', mem: [{ key: '#1', init: '<span class="null">—</span>' }, { key: '#2', init: '<span class="null">—</span>' }] });
  return { table, t1, t2 };
}

/** The reader's scan: a band sweeps the rows; S locks are skipped, brief, or kept. */
function scan(table: DbTable, ids: string[], mode: 'none' | 'short' | 'hold', skip: string[] = []) {
  const band = h('div', 'scan t-t2', '', table.body);
  gsap.set(band, { opacity: 0, y: table.rowY(ids[0]) - table.top0 });
  const t = gsap.timeline();
  t.to(band, { opacity: 1, duration: 0.25 }, 0);
  ids.forEach((id, i) => {
    const at = 0.2 + i * 0.75;
    t.to(band, { y: table.rowY(id) - table.top0, duration: 0.45, ease: 'power2.inOut' }, at);
    if (mode !== 'none' && !skip.includes(id)) {
      t.add(table.lock(id, 't2', 'T2', 'S', 'right'), at + 0.3);
      if (mode === 'short') t.add(table.unlock(id, 't2'), at + 0.7);
    }
  });
  t.to(band, { opacity: 0, duration: 0.3 }, 0.2 + ids.length * 0.75 + 0.15);
  return t;
}

/** Anomaly matrix; columns before `filled` are already answered. */
export function matrix(root: HTMLElement, filled: number, o: { skew?: boolean; top?: number } = {}) {
  const anoms = o.skew ? [...ANOM, 'انحراف نوشتن'] : ANOM;
  const mx = h('div', `iso-matrix ${o.skew ? 'big' : ''}`, '', root);
  if (o.top) mx.style.top = `${o.top}px`;
  h('div', 'mx-col legend', `<div class="mx-h"><span>کدام اشکال ممکن است؟</span></div>${anoms.map((a) => `<div class="mx-c">${a}</div>`).join('')}`, mx);
  const cols = LEVELS.map((lv, i) => h('div', `mx-col lv ${i === 4 ? 'snap' : ''}`, `<i class="mx-hl"></i><div class="mx-h"><b dir="ltr">${lv.name}</b><small>${lv.cost}</small></div>${anoms.map(() => '<div class="mx-c"><i class="ind"></i></div>').join('')}`, mx));
  cols.forEach((c, i) => {
    gsap.set(c.querySelector('.mx-hl'), { opacity: 0 });
    if (i < filled) VERDICT[i].forEach((v, j) => h('span', `res ${v}`, v === 'ok' ? ICON.check : ICON.cross, c.querySelectorAll('.mx-c')[j]));
  });
  const put = (i: number, v: ('ok' | 'bad')[], from = 0) => {
    const t = gsap.timeline();
    v.forEach((r, j) => {
      const ic = h('span', `res ${r}`, r === 'ok' ? ICON.check : ICON.cross, cols[i].querySelectorAll('.mx-c')[from + j]);
      gsap.set(ic, { opacity: 0 });
      t.fromTo(ic, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.4)', immediateRender: false }, j * 0.25);
    });
    return t;
  };
  return {
    el: mx, cols,
    verdict: (i: number) => put(i, VERDICT[i]),
    put,
    focus: (i: number) => gsap.to(cols[i].querySelector('.mx-hl'), { opacity: 1, duration: 0.4 }),
  };
}

/** Common opening: title, table, both cards, matrix. */
function open(b: Builder, sc: ReturnType<typeof scene>, mx: ReturnType<typeof matrix>, lvl: number, narr: string) {
  b.s(narr)
    .show('همان جدول نمره‌ها؛ ردیف‌ها با فاصله، چون کلیدها پشت سر هم نیستند.', sc.table.el)
    .show('T1 (استاد): یک نمرهٔ تازه درج می‌کند و یک نمره را اصلاح می‌کند؛ هر کدام با commit خودش.', sc.t1.el)
    .show('T2 (گزارش): یک بازه را دو بار می‌خواند: تعداد و جمع نمره‌ها.', sc.t2.el)
    .show('و جدول اشکال‌ها؛ این ستون را پر می‌کنیم.', mx.el, (t) => t.add(mx.focus(lvl), 0.4));
}

// ---------------------------------------------------------------- intro

export function isoIntro(stage: HTMLElement) {
  const b = build(stage, { id: 'iso-intro', chapter: CH.tools, label: 'سطح جداسازی', title: 'سطح جداسازی یعنی چه؟', term: 'Isolation Level' });
  const dial = h('div', 'dial', LEVELS.map((l, i) => `<div class="dl ${i === 4 ? 'snap' : ''}"><b dir="ltr">${l.name}</b><span>${l.cost}</span></div>`).join(''), b.el);
  const dls = Array.from(dial.children) as HTMLElement[];
  const q1 = node(b.el, `${ICON.lock}<b>خواننده قفل می‌گیرد؟</b><small>و تا کی نگهش می‌دارد؟</small>`, 1260, 300, 300, 'tone t-t2');
  const q2 = node(b.el, `${ICON.camera}<b>یا از یک نسخهٔ قدیمی می‌خواند؟</b><small>بدون قفل</small>`, 1260, 560, 300, 'tone t-v');
  const scale = h('div', 'iso-scale', '<span>هم‌زمانیِ بیشتر</span><i></i><span>درستیِ بیشتر</span>', b.el);
  const rule = ruleCard(b.el, { name: 'سطح جداسازی', term: 'Isolation', tone: 'v', kicker: 'تعریف', body: 'حرف <b>I</b> در ACID. سطح جداسازی تعیین می‌کند یک تراکنش چقدر از کار تراکنش‌های دیگر <b>جدا بماند</b>: خواننده قفل بگیرد یا نه، تا کی نگهش دارد، و آیا از یک <b>نسخهٔ قدیمی</b> بخواند. سخت‌گیری بیشتر، درستی بیشتر و انتظار بیشتر.' });
  b.s('دیدیم که خواندن و نوشتنِ هم‌زمان چه مشکلاتی می‌سازد. SQL Server یک «پیچ تنظیم» برای این کار دارد.');
  dls.forEach((d, i) => b.show(i === 0 ? 'پنج سطح؛ از پایین به بالا سخت‌گیرتر.' : null, d, undefined, { y: 16 }));
  b.show('هر سطح در واقع به دو سؤال جواب می‌دهد. اول: خواننده قفل می‌گیرد و تا کی؟', q1)
    .show('دوم: یا اصلاً قفل نمی‌گیرد و از یک «عکس» قدیمی می‌خواند؟', q2)
    .show('بالا رفتن یعنی درستیِ بیشتر، به قیمتِ انتظارِ بیشتر.', scale)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- one slide per level

export function isoLevel(level: 0 | 1 | 2 | 3 | 4) {
  return (stage: HTMLElement) => {
    const L = LEVELS[level];
    const b = build(stage, { id: `iso-${level}`, chapter: CH.tools, label: L.name, title: L.name, term: 'Isolation Level', cls: 'iso-level' });
    b.f.title.querySelector('.h1')!.setAttribute('dir', 'ltr');
    const sc = scene(b.el, L.name);
    const mx = matrix(b.el, level);
    const { table, t1, t2 } = sc;
    const a1 = arrow(b.f, t1.side('right', 10), table.edge('20', 'left', 12), 't1', { bend: -0.1 });
    const a2 = arrow(b.f, t1.side('right', 10), table.edge('20', 'left', 12), 't1', { bend: -0.1 });
    const a3 = arrow(b.f, t1.side('right', 10), table.edge('20', 'left', 82), 't1', { bend: -0.1 });
    const verdictStep = (body: string) => {
      const rule = ruleCard(b.el, { name: L.name, tone: level === 4 ? 'v' : 'ink', kicker: 'خلاصهٔ این سطح', body });
      b.s('ستونِ این سطح پر می‌شود.', (t) => t.add(mx.verdict(level)))
        .s(null, (t) => t.add(rule.show()));
    };
    const insertCommit = (t: gsap.core.Timeline, at = 0) =>
      t.add(a1.draw(0.8), at).add(table.insert(NEW, 2, { wet: 't1', from: 'left' }), at + 0.8).add(table.lock('25', 't1', 'T1', 'X', 'left'), at + 1.4)
        .add(t1.mem('INSERT', ST.wet), at + 1.4).add(table.dry('25'), at + 2.4).add(table.unlock('25', 't1'), at + 2.5).add(t1.mem('INSERT', ST.ok), at + 2.5).add(a1.hide(), at + 2.6);
    const updateCommit = (t: gsap.core.Timeline, at = 0) =>
      t.add(a2.draw(0.8), at).add(table.lock('20', 't1', 'T1', 'X', 'left'), at + 0.8).add(table.set('20', 'g', '16', { wet: 't1' }), at + 1.3)
        .add(table.dry('20'), at + 2.2).add(table.unlock('20', 't1'), at + 2.3).add(t1.mem('UPDATE', ST.ok), at + 2.3).add(a2.hide(), at + 2.4);

    if (level === 0) {
      open(b, sc, mx, 0, '<b>READ UNCOMMITTED</b>: پایین‌ترین سطح. خواننده <b>هیچ قفلی</b> نمی‌گیرد.');
      b.s('استاد نمرهٔ دیرهنگام نیما را درج می‌کند؛ هنوز commit نشده.', (t) => t.add(t1.state('run', 'در حال اجرا')).add(a1.draw(0.8), 0).add(table.insert(NEW, 2, { wet: 't1', from: 'left' }), 0.8).add(table.lock('25', 't1', 'T1', 'X', 'left'), 1.4).add(t1.mem('INSERT', ST.wet), 1.4).add(a1.hide(), 1.8))
        .s('گزارش می‌خواند؛ بدون قفل، حتی ردیفِ <b>خیس</b> را هم می‌شمارد.', (t) => t.add(t2.state('run', 'در حال خواندن')).add(scan(table, ['10', '20', '25', '30'], 'none'), 0.2))
        .s('نتیجهٔ اول: ۴ ردیف، جمع ۶۲.', (t) => t.add(t2.mem('#1', R(4, 62, 'dirty'))))
        .s('درجِ نمره خطا می‌دهد و <code>ROLLBACK</code> می‌شود. ردیف ناپدید می‌شود.', (t) => t.add(t1.mem('INSERT', ST.back)).add(table.unlock('25', 't1'), 0).add(table.remove('25', { evaporate: true }), 0.2))
        .s('گزارش ردیفی را شمرد که <b class="kbad">هرگز وجود نداشت</b>.', (t) => t.add(t2.mem('#1', R(4, 62, 'bad strike'))));
      verdictStep('خواننده هیچ قفلی نمی‌گیرد و حتی دادهٔ commitنشده را می‌بیند. <b>همهٔ اشکال‌ها ممکن‌اند</b>. معادل <code>WITH (NOLOCK)</code>؛ فقط برای گزارش‌های تقریبی.');
    }

    if (level === 1) {
      open(b, sc, mx, 1, '<b>READ COMMITTED</b>: پیش‌فرض SQL Server. فقط دادهٔ commitشده خوانده می‌شود.');
      b.s('گزارش می‌خواند. روی هر ردیف قفل S می‌گذارد و <b>بلافاصله</b> برمی‌دارد.', (t) => t.add(t2.state('run', 'در حال خواندن')).add(scan(table, ['10', '20', '30'], 'short'), 0.2))
        .s('نتیجهٔ اول: ۳ ردیف، جمع ۴۴.', (t) => t.add(t2.mem('#1', R(3, 44))))
        .s('استاد نمرهٔ نیما را درج و commit می‌کند. قفلی سر راهش نیست.', (t) => { t.add(t1.state('run', 'در حال اجرا')); insertCommit(t); })
        .s('و نمرهٔ رضا را اصلاح و commit می‌کند.', (t) => updateCommit(t))
        .s('گزارش دوباره می‌خواند.', (t) => t.add(scan(table, ['10', '20', '25', '30'], 'short')))
        .s('دو جواب متفاوت: یک ردیف <b>عوض شد</b> و یک ردیف <b>اضافه شد</b>.', (t) => t.add(t2.mem('#2', R(4, 66, 'bad'))));
      verdictStep('خواندنِ کثیف ممکن نیست؛ ولی چون قفل S فقط لحظهٔ خواندن نگه داشته می‌شود، بین دو خواندن داده <b>عوض می‌شود</b> و <b>ردیف تازه</b> می‌آید. پیش‌فرض SQL Server همین است.');
    }

    if (level === 2) {
      open(b, sc, mx, 2, '<b>REPEATABLE READ</b>: هر ردیفی که خوانده شد، تا پایان تراکنش قفل می‌ماند.');
      b.s('گزارش می‌خواند و این بار قفل‌های S <b>می‌مانند</b>.', (t) => t.add(t2.state('run', 'در حال خواندن')).add(scan(table, ['10', '20', '30'], 'hold'), 0.2))
        .s('نتیجهٔ اول: ۳ ردیف، جمع ۴۴.', (t) => t.add(t2.mem('#1', R(3, 44))))
        .s('درجِ نیما <b>از لای ردیف‌ها</b> رد می‌شود؛ روی فاصله‌ها قفلی نیست.', (t) => { t.add(t1.state('run', 'در حال اجرا')); insertCommit(t); })
        .s('ولی اصلاح نمرهٔ رضا پشت قفل S گزارش <b>منتظر</b> می‌ماند.', (t) => t.add(a3.draw(0.8)).add(table.wait('20', 't1', 'T1', 'left'), 0.8).add(t1.mem('UPDATE', ST.wait), 0.8).add(t1.state('wait', 'منتظر T2'), 0.8))
        .s('گزارش دوباره می‌خواند.', (t) => t.add(scan(table, ['10', '20', '25', '30'], 'hold', ['10', '20', '30'])))
        .s('مقدارها ثابت ماندند، ولی یک ردیف «شبح» اضافه شد: ۴ ردیف، جمع ۶۲.', (t) => t.add(t2.mem('#2', R(4, 62, 'bad'))));
      verdictStep('ردیف‌های خوانده‌شده تا پایان تراکنش قفل می‌مانند، پس <b>تغییر نمی‌کنند</b>. ولی فاصلهٔ بین ردیف‌ها قفل نیست و <b>ردیف شبح</b> ممکن است. نویسنده‌ها بیشتر منتظر می‌مانند.');
    }

    if (level === 3) {
      open(b, sc, mx, 3, '<b>SERIALIZABLE</b>: سخت‌گیرترین سطحِ قفلی. نتیجه مثل این است که تراکنش‌ها یکی‌یکی اجرا شده باشند.');
      const gaps = [0, 1, 2, 3].map((i) => table.gapLock(i, 't2'));
      const ghost = h('div', 'ghost-row t-t1', `${ICON.hourglass}<span dir="ltr">INSERT 25</span>`, b.el);
      gsap.set(ghost, { x: 606, y: table.gapY(2), xPercent: -50, yPercent: -50, opacity: 0 });
      b.s('گزارش می‌خواند و قفل‌های S را نگه می‌دارد.', (t) => t.add(t2.state('run', 'در حال خواندن')).add(scan(table, ['10', '20', '30'], 'hold'), 0.2))
        .s('و این بار <b>فاصلهٔ بین کلیدها</b> هم قفل می‌شود: قفل بازه.', (t) => gaps.forEach((g, i) => t.add(g.t, i * 0.2)))
        .s('نتیجهٔ اول: ۳ ردیف، جمع ۴۴.', (t) => t.add(t2.mem('#1', R(3, 44))))
        .s('درجِ نیما پشتِ قفلِ بازه <b>منتظر</b> می‌ماند.', (t) => t.add(t1.state('wait', 'منتظر T2')).fromTo(ghost, { opacity: 0, x: 560 }, { opacity: 1, x: 622, duration: 0.7, ease: 'power3.out', immediateRender: false }, 0.2).to(ghost, { x: 606, duration: 0.3 }, 0.9).add(gaps[2].pulse(), 0.9).add(t1.mem('INSERT', ST.wait), 1.0))
        .s('خواندن دوم، همان جواب: ۳ ردیف، جمع ۴۴.', (t) => t.add(scan(table, ['10', '20', '30'], 'hold', ['10', '20', '30'])).add(t2.mem('#2', R(3, 44, 'good')), 2.6))
        .s('گزارش commit می‌کند و قفل‌ها آزاد می‌شوند؛ تازه حالا درج انجام می‌شود.', (t) => {
          t.add(t2.state('ok', 'commit'));
          ['10', '20', '30'].forEach((id, i) => t.add(table.unlock(id, 't2'), 0.1 + i * 0.1));
          gaps.forEach((g) => t.to(g.el, { opacity: 0, duration: 0.3 }, 0.3));
          t.to(ghost, { opacity: 0, duration: 0.3 }, 0.5).add(table.insert(NEW, 2, { wet: 't1', from: 'left' }), 0.8).add(table.dry('25'), 1.8).add(t1.mem('INSERT', ST.ok), 1.8).add(t1.state('run', 'ادامه'), 1.8);
        });
      verdictStep('ردیف‌ها <b>و فاصله‌های بینشان</b> قفل می‌شوند، پس هیچ‌کدام از سه اشکال رخ نمی‌دهد. بهایش: نویسنده‌ها <b>بیشتر منتظر می‌مانند</b> و احتمال بن‌بست بالا می‌رود.');
    }

    if (level === 4) {
      open(b, sc, mx, 4, '<b>SNAPSHOT</b>: ایدهٔ متفاوت. به‌جای قفل، <b>نسخه</b>.');
      const flash = h('div', 'flash', '', b.el);
      flash.style.cssText = `left:${table.x - 20}px;top:${Y - 10}px;width:${table.width + 40}px;height:${table.bottom - Y + 30}px`;
      gsap.set(flash, { opacity: 0 });
      const pol = h('div', 'polaroid', '', b.el);
      const photo = new DbTable(pol, { name: 'Grades @ 12:00:03', x: 0, y: 0, rowH: 74, gap: 22, cols: COLS, rows: ROWS() }, h('div', 'pol-img', '', pol));
      h('div', 'pol-cap', `${ICON.camera}<span>عکس لحظهٔ شروع T2</span>`, pol);
      gsap.set(pol, { x: 1490, y: 352, rotation: -4, opacity: 0 });
      b.s('وقتی گزارش شروع می‌شود، از دادهٔ commitشده یک <b>عکس</b> گرفته می‌شود.', (t) => t.to(flash, { opacity: 0.95, duration: 0.1 }, 0).to(flash, { opacity: 0, duration: 0.7 }, 0.15)
        .fromTo(pol, { x: table.x + 140, y: Y + 40, rotation: 0, scale: 2.3, opacity: 0 }, { x: 1490, y: 352, rotation: -4, scale: 1, opacity: 1, duration: 1.2, ease: 'power3.inOut', immediateRender: false }, 0.2))
        .s('خواندن اول از روی عکس: ۳ ردیف، جمع ۴۴. هیچ قفلی روی جدول نیست.', (t) => t.add(t2.state('run', 'از عکس می‌خواند')).add(scan(photo, ['10', '20', '30'], 'none'), 0).add(t2.mem('#1', R(3, 44)), 2.4))
        .s('استاد نمرهٔ نیما را درج و commit می‌کند؛ بی‌معطلی.', (t) => { t.add(t1.state('run', 'در حال اجرا')); insertCommit(t); })
        .s('و نمرهٔ رضا را اصلاح و commit می‌کند؛ باز هم بی‌معطلی.', (t) => updateCommit(t))
        .s('گزارش دوباره از همان عکس می‌خواند: همان جواب. <b>هیچ‌کس منتظر نماند.</b>', (t) => t.add(scan(photo, ['10', '20', '30'], 'none')).add(t2.mem('#2', R(3, 44, 'good')), 2.4));
      verdictStep('خواننده قفل نمی‌گیرد و از <b>نسخه‌ای</b> می‌خواند که در شروع تراکنش commit شده بود. نویسنده و خواننده معطل هم نمی‌شوند. بهایش: فضای نسخه‌ها در tempdb، و <b>Write Skew همچنان ممکن است</b>.');
    }
    return b.done();
  };
}

// ---------------------------------------------------------------- SNAPSHOT from the inside: the version store

export function snapshotInside(stage: HTMLElement) {
  const b = build(stage, { id: 'iso-versions', chapter: CH.tools, label: 'نسخه‌ها', title: 'عکس از کجا می‌آید؟', term: 'Version Store' });
  const table = new DbTable(b.el, { name: 'dbo.Grades', x: 300, y: 320, rowH: 84, cols: COLS, rows: ROWS() });
  const cellX = table.x + table.width + 60, cellY = table.rowMid('20');
  const store = h('div', 'vstore', `${ICON.db}<b>tempdb</b><small>انبار نسخه‌ها</small>`, b.el);
  const ver = (v: string, time: string, i: number) => {
    const e = h('div', 'ver', `<b dir="ltr">${v}</b><small dir="ltr">${time}</small>`, b.el);
    gsap.set(e, { x: cellX + i * 26, y: cellY - 46 - i * 26, opacity: 0 });
    return e;
  };
  const v1 = ver('12', 'until 12:00:04', 0), v2 = ver('16', 'until 12:00:09', 1);
  const reader = tag(b.el, `${ICON.camera} T2 از <span dir="ltr">12:00:03</span> شروع شد`, 'ink', { x: cellX + 110, y: cellY + 120 });
  const pick = arrow(b.f, { x: cellX + 110, y: cellY + 96 }, { x: cellX + 60, y: cellY + 4 }, 'v', { bend: 0.2 });
  const cmp = node(b.el, `<div class="fx-t">دو گونه</div><div class="cmpr"><div><b dir="ltr">RCSI</b><span>هر <b>دستور</b> یک عکس تازه</span><i>${ICON.camera}${ICON.camera}</i></div><div><b dir="ltr">SNAPSHOT</b><span>یک عکس برای <b>کل تراکنش</b></span><i>${ICON.camera}</i></div></div>`, 1180, 640, 640, 'fixpanel');
  b.hide(reader);
  const rule = ruleCard(b.el, { name: 'نسخه به‌جای قفل', term: 'Row Versioning', tone: 'v', kicker: 'جمع‌بندی', body: 'هر تغییر، نسخهٔ قبلیِ ردیف را در <b>tempdb</b> نگه می‌دارد. خواننده نسخه‌ای را برمی‌دارد که در لحظهٔ شروعش commit شده بود. بهایش: فضای tempdb، و تراکنش‌های طولانی که نسخه‌های قدیمی را زنده نگه می‌دارند.' });
  b.s('SNAPSHOT عکس را از کجا می‌آورد؟ از نسخه‌های قدیمی که SQL Server نگه می‌دارد.')
    .show('ردیف رضا: نمرهٔ ۱۲.', table.el, (t) => t.add(table.focus('20', true), 0.4))
    .show('انبار نسخه‌ها در tempdb است.', store)
    .s('ساعت ۱۲:۰۰:۰۴ نمره ۱۶ می‌شود. نسخهٔ قبلی (۱۲) کنار گذاشته می‌شود.', (t) => t.fromTo(v1, { opacity: 0, x: table.cell('20', 'g').x, y: cellY - 20 }, { opacity: 1, x: cellX, y: cellY - 46, duration: 1.0, ease: 'power3.out', immediateRender: false }).add(table.set('20', 'g', '16'), 0.4))
    .s('ساعت ۱۲:۰۰:۰۹ نمره ۱۸ می‌شود. نسخهٔ ۱۶ هم به انبار می‌رود.', (t) => t.fromTo(v2, { opacity: 0, x: table.cell('20', 'g').x, y: cellY - 20 }, { opacity: 1, x: cellX + 26, y: cellY - 72, duration: 1.0, ease: 'power3.out', immediateRender: false }).add(table.set('20', 'g', '18'), 0.4))
    .s('گزارشی که ساعت ۱۲:۰۰:۰۳ شروع شده، نسخه‌ای را برمی‌دارد که <b>آن لحظه</b> معتبر بود: ۱۲.', (t) => t.fromTo(reader, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }).add(pick.draw(0.8), 0.4).to(v1, { scale: 1.12, borderColor: '#7651d4', duration: 0.4 }, 1.1))
    .show(null, cmp)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- SNAPSHOT update conflict

export function snapshotConflict(stage: HTMLElement) {
  const b = build(stage, { id: 'iso-conflict', chapter: CH.tools, label: 'تعارض در SNAPSHOT', title: 'وقتی دو نفر یک نسخه را تغییر می‌دهند', term: 'Update Conflict' });
  const table = new DbTable(b.el, { name: 'dbo.Grades', x: 720, y: Y, rowH: 84, cols: COLS, rows: ROWS() });
  const t1 = new TxnCard(b.el, { tone: 't1', who: 'T1', name: 'استاد', sub: 'اصلاح نمره', x: 96, y: Y, w: 420, exec: `${k('UPDATE')} Grades ${k('SET')} Grade = 16\n${k('WHERE')} Id = 20` });
  const t2 = new TxnCard(b.el, { tone: 't2', who: 'T2', name: 'نمرهٔ تشویقی', sub: 'SNAPSHOT', x: 1404, y: Y, w: 420, exec: `${hl(cm('SNAPSHOT'))}\ng = ${k('SELECT')} Grade … Id = 20\n${k('UPDATE')} Grades ${k('SET')} Grade = g + 1\n${k('WHERE')} Id = 20`, mem: [{ key: 'g' }] });
  const a1 = arrow(b.f, t1.side('right', 20), table.edge('20', 'left', 12), 't1', { bend: -0.1 });
  const a2 = arrow(b.f, t2.side('left', 60), table.edge('20', 'right', 12), 't2', { bend: 0.1 });
  const clash = tag(b.el, `${ICON.cross} <span dir="ltr">row changed since 12:00:03</span>`, 'bad mono check', { x: table.cell('20', 'g').x - 60, y: table.rowY('20') - 30 });
  b.hide(clash);
  const rule = ruleCard(b.el, { name: 'SNAPSHOT خوش‌بین است', tone: 'v', kicker: 'جمع‌بندی', body: 'SNAPSHOT جلوی خواندن‌ها را نمی‌گیرد، ولی اگر بخواهید ردیفی را تغییر دهید که <b>بعد از شروعِ شما</b> عوض شده، خطای <code>3960</code> می‌گیرید و باید دوباره تلاش کنید. برای جاهایی خوب است که تعارض کم است.' });
  b.s('SNAPSHOT برای خواندن عالی است. ولی اگر خواننده بخواهد <b>بنویسد</b> چه؟')
    .show('ردیف رضا: ۱۲.', table.el, (t) => t.add(table.focus('20', true), 0.4))
    .show('T2 در SNAPSHOT می‌خواند و بعد نمرهٔ تشویقی می‌دهد: یکی اضافه.', t2.el)
    .show('T1 استاد است که همان نمره را اصلاح می‌کند.', t1.el)
    .s('T2 شروع می‌کند و از عکس، ۱۲ را می‌خواند.', (t) => t.add(t2.state('run', 'SNAPSHOT')).add(table.flash('20', 't2', 0.5), 0.2).add(t2.mem('g', '12'), 0.8))
    .s('در همین فاصله، استاد ۱۲ را ۱۶ می‌کند و commit.', (t) => t.add(a1.draw(0.8)).add(table.lock('20', 't1', 'T1', 'X', 'left'), 0.8).add(table.set('20', 'g', '16', { wet: 't1' }), 1.2).add(table.dry('20'), 2.0).add(table.unlock('20', 't1'), 2.1).add(t1.state('ok', 'commit'), 2.1).add(a1.hide(), 2.2))
    .s('حالا T2 می‌خواهد ۱۳ را بنویسد؛ ولی ردیف بعد از شروعِ او عوض شده است.', (t) => t.add(a2.draw(0.8)).fromTo(clash, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, immediateRender: false }, 0.9).to(table.cellEl('20', 'g'), { x: 6, duration: 0.07, yoyo: true, repeat: 5 }, 1.0))
    .s('SQL Server اجازه نمی‌دهد: خطای <code>3960</code> و rollback. اگر می‌نوشت، اصلاحِ استاد گم می‌شد.', (t) => t.add(t2.msg('Msg 3960: update conflict', 'bad')).add(t2.state('bad', 'دوباره تلاش کن'), 0.2).add(a2.hide(), 0.4))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- summary

export function isoSummary(stage: HTMLElement) {
  const b = build(stage, { id: 'iso-sum', chapter: CH.tools, label: 'جمع‌بندی سطوح', title: 'همهٔ سطوح، یک‌جا' });
  const mx = matrix(b.el, 5, { skew: true, top: 300 });
  const ws: ('ok' | 'bad')[] = ['bad', 'bad', 'bad', 'ok', 'bad'];
  const def = note(b.el, 'پیش‌فرض SQL Server: <b>READ COMMITTED</b> با قفل · پیش‌فرض Azure SQL Database: همان با نسخه (<b>RCSI</b>)', 'v', 360, 820, 1200);
  def.el.classList.add('one');
  const rule = ruleCard(b.el, { name: 'پیش‌فرض را کورکورانه نپذیرید', tone: 'v', kicker: 'جمع‌بندی', body: 'انتخاب سطح جداسازی، انتخاب بین <b>درستی</b> و <b>هم‌زمانی</b> است. پیش‌فرض اغلب کافی نیست؛ و برای مشکلی مثل Write Skew فقط SERIALIZABLE یا یک قفل/شرطِ صریح جواب می‌دهد.' });
  b.s('همهٔ نتیجه‌ها کنار هم.')
    .show('سه اشکالِ خواندن، در پنج سطح.', mx.el)
    .s('و Write Skew: فقط SERIALIZABLE جلویش را می‌گیرد؛ حتی SNAPSHOT هم نه.', (t) => ws.forEach((v, i) => t.add(mx.put(i, [v], 3), i * 0.2)))
    .show(null, def.el)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}
