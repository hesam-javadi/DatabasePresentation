import gsap from 'gsap';
import { build, Builder } from '../core/build';
import { h } from '../core/dom';
import { arrow, TxnCard, ruleCard, note, tag, node } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';
import { CH, k, cm, hl, fa } from './common';

const Y = 268;
export const LEVELS = [
  { name: 'READ UNCOMMITTED', cost: 'بدون S Lock' },
  { name: 'READ COMMITTED', cost: 'S Lock کوتاه · پیش‌فرض' },
  { name: 'REPEATABLE READ', cost: 'S Lock تا COMMIT' },
  { name: 'SERIALIZABLE', cost: 'Range Lock' },
  { name: 'SNAPSHOT', cost: 'Row Versioning' },
];
const ANOM = ['مشکل ۲ · <span dir="ltr">Dirty Read</span>', 'مشکل ۳ · <span dir="ltr">Non-Repeatable</span>', 'مشکل ۴ · <span dir="ltr">Phantom Read</span>'];
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

const T1_CODE = `${k('①')} ${k('INSERT')} Grades ${k('VALUES')}\n   (25, ${fa('نیما')}, 18)\n${k('②')} ${k('UPDATE')} Grades\n   ${k('SET')} Grade = 16\n   ${k('WHERE')} Id = 20`;
const t2Code = (lvl: string) => `${hl(`${cm('')}${lvl}`)}\n${k('SELECT COUNT')}(*), ${k('SUM')}(Grade)\n${k('FROM')} Grades\n${k('WHERE')} Id ${k('BETWEEN')} 10 ${k('AND')} 30`;
const CW = 440;

/** Table + both cards of the isolation scenario. */
function scene(root: HTMLElement, lvl: string) {
  const table = new DbTable(root, { name: 'dbo.Grades', x: 720, y: Y, rowH: 74, gap: 22, cols: COLS, rows: ROWS() });
  const t1 = new TxnCard(root, { tone: 't1', who: 'T1', name: 'استاد', sub: 'دو Write جدا', x: 96, y: Y, w: CW, exec: T1_CODE, execLabel: 'Queries', memLabel: 'Status', mem: [{ key: 'INSERT', init: '<span class="null">—</span>' }, { key: 'UPDATE', init: '<span class="null">—</span>' }] });
  const t2 = new TxnCard(root, { tone: 't2', who: 'T2', name: 'گزارش', sub: 'دو بار Read، بعد COMMIT', x: 1920 - 96 - CW, y: Y, w: CW, exec: t2Code(lvl), execLabel: 'Transaction', memLabel: 'Results', mem: [{ key: '#1', init: '<span class="null">—</span>' }, { key: '#2', init: '<span class="null">—</span>' }] });
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

/** Problem/level matrix; columns before `filled` are already answered. */
export function matrix(root: HTMLElement, filled: number, o: { skew?: boolean; top?: number } = {}) {
  const anoms = o.skew ? [...ANOM, 'مشکل ۵ · <span dir="ltr">Write Skew</span>'] : ANOM;
  const mx = h('div', `iso-matrix big ${o.skew ? 'skew' : ''}`, '', root);
  if (o.top) mx.style.top = `${o.top}px`;
  h('div', 'mx-col legend', `<div class="mx-h"><span>کدام مشکل ممکن است؟</span></div>${anoms.map((a) => `<div class="mx-c">${a}</div>`).join('')}`, mx);
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

/** Opening click: table and both cards together, with the level's one-line idea. */
function open(b: Builder, sc: ReturnType<typeof scene>, narr: string) {
  b.show(narr, [sc.t1.el, sc.t2.el], undefined, { stagger: 0.12 });
}

// ---------------------------------------------------------------- intro

export function isoIntro(stage: HTMLElement) {
  const b = build(stage, { id: 'iso-intro', chapter: CH.tools, label: 'Isolation Level', title: 'Isolation Level یعنی چه؟', term: 'Isolation Level' });
  const dial = h('div', 'dial', LEVELS.map((l, i) => `<div class="dl ${i === 4 ? 'snap' : ''}"><b dir="ltr">${l.name}</b><span>${l.cost}</span></div>`).join(''), b.el);
  const dls = Array.from(dial.children) as HTMLElement[];
  const q1 = node(b.el, `${ICON.lock}<b>Read کننده Lock می‌گیرد؟</b><small>و تا کی نگهش می‌دارد؟</small>`, 760, 300, 420, 'tone t-t2');
  const q2 = node(b.el, `${ICON.camera}<b>یا از یک نسخهٔ قدیمی Read می‌کند؟</b><small>بدون Lock</small>`, 760, 560, 420, 'tone t-v');
  const scale = h('div', 'iso-scale', '<span>هم‌زمانیِ بیشتر</span><i></i><span>درستیِ بیشتر</span>', b.el);
  const rule = ruleCard(b.el, { name: 'Isolation Level', term: 'ACID · I', tone: 'v', kicker: 'تعریف', body: 'حرف <b>I</b> در ACID. Isolation Level تعیین می‌کند یک Transaction چقدر از کار بقیه <b>جدا بماند</b>: Read کننده Lock بگیرد یا نه، تا کی نگهش دارد، یا از یک <b>نسخهٔ قدیمی</b> بخواند. سخت‌گیری بیشتر یعنی درستی بیشتر و Wait بیشتر.' });
  b.show('برای مشکل‌های ۲ تا ۴، SQL Server یک «پیچ تنظیم» دارد: <b>Isolation Level</b>. پنج سطح؛ از پایین به بالا سخت‌گیرتر.', dls, undefined, { y: 16, stagger: 0.12 })
    .show('هر سطح به دو سؤال جواب می‌دهد: Read کننده Lock می‌گیرد و تا کی؟ یا از یک «عکس» قدیمی Read می‌کند؟', [q1, q2])
    .show('بالا رفتن یعنی درستیِ بیشتر، به قیمتِ Wait بیشتر.', scale)
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
    const { table, t1, t2 } = sc;
    const a1 = arrow(b.f, t1.side('right', 10), table.edge('20', 'left', 12), 't1', { bend: -0.1 });
    const a2 = arrow(b.f, t1.side('right', 10), table.edge('20', 'left', 12), 't1', { bend: -0.1 });
    const a3 = arrow(b.f, t1.side('right', 10), table.edge('20', 'left', 82), 't1', { bend: -0.1 });
    // the matrix only appears at the verdict, when the scene steps aside
    const verdictStep = (body: string) => {
      const mx = matrix(b.el, level, { top: 330 });
      b.hide(mx.el);
      const scenery = Array.from(b.el.children).filter((c) => c !== mx.el && !c.matches('.title-row, .narr, .rule'));
      const rule = ruleCard(b.el, { name: L.name, tone: level === 4 ? 'v' : 'ink', kicker: 'خلاصهٔ این سطح', body });
      b.s('ستونِ این سطح در جدولِ مشکلات پر می‌شود.', (t) => t.to(scenery, { opacity: 0, duration: 0.45 }, 0)
        .fromTo(mx.el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', immediateRender: false }, 0.3)
        .add(mx.focus(level), 0.8).add(mx.verdict(level), 1.2))
        .s(null, (t) => t.add(rule.show()));
    };
    const insertCommit = (t: gsap.core.Timeline, at = 0) =>
      t.add(a1.draw(0.8), at).add(table.insert(NEW, 2, { wet: 't1', from: 'left' }), at + 0.8).add(table.lock('25', 't1', 'T1', 'X', 'left'), at + 1.4)
        .add(t1.mem('INSERT', ST.wet), at + 1.4).add(table.dry('25'), at + 2.4).add(table.unlock('25', 't1'), at + 2.5).add(t1.mem('INSERT', ST.ok), at + 2.5).add(a1.hide(), at + 2.6);
    const updateCommit = (t: gsap.core.Timeline, at = 0) =>
      t.add(a2.draw(0.8), at).add(table.lock('20', 't1', 'T1', 'X', 'left'), at + 0.8).add(table.set('20', 'g', '16', { wet: 't1' }), at + 1.3)
        .add(table.dry('20'), at + 2.2).add(table.unlock('20', 't1'), at + 2.3).add(t1.mem('UPDATE', ST.ok), at + 2.3).add(a2.hide(), at + 2.4);

    if (level === 0) {
      open(b, sc, 'یک سناریو در هر پنج سطح: T1 (استاد) نمره درج و اصلاح می‌کند؛ T2 (گزارش) یک بازه را <b>دو بار</b> Read می‌کند.');
      b.s('<b>READ UNCOMMITTED</b>: پایین‌ترین سطح. استاد نمرهٔ دیرهنگام نیما را درج می‌کند؛ هنوز uncommitted.', (t) => t.add(t1.state('run', 'Running')).add(a1.draw(0.8), 0).add(table.insert(NEW, 2, { wet: 't1', from: 'left' }), 0.8).add(table.lock('25', 't1', 'T1', 'X', 'left'), 1.4).add(t1.mem('INSERT', ST.wet), 1.4).add(a1.hide(), 1.8))
        .s('گزارش <b>بدون هیچ Lockی</b> Read می‌کند و حتی ردیفِ uncommitted را می‌شمارد: ۴ ردیف، جمع ۶۲.', (t) => t.add(t2.state('run', 'Reading')).add(scan(table, ['10', '20', '25', '30'], 'none'), 0.2).add(t2.mem('#1', R(4, 62, 'dirty')), 3.4))
        .s('درج خطا می‌دهد و <code>ROLLBACK</code> می‌شود. گزارش ردیفی را شمرد که <b class="kbad">هرگز وجود نداشت</b>.', (t) => t.add(t1.mem('INSERT', ST.back)).add(table.unlock('25', 't1'), 0).add(table.remove('25', { evaporate: true }), 0.2).add(t2.mem('#1', R(4, 62, 'bad strike')), 1.4));
      verdictStep('Read کننده هیچ Lockی نمی‌گیرد و حتی دادهٔ uncommitted را می‌بیند. <b>هر سه مشکل ممکن‌اند</b>. معادل <code>WITH (NOLOCK)</code>؛ فقط برای گزارش‌های تقریبی.');
    }

    if (level === 1) {
      open(b, sc, '<b>READ COMMITTED</b>: پیش‌فرض SQL Server. فقط دادهٔ committed خوانده می‌شود.');
      b.s('گزارش Read می‌کند: روی هر ردیف S Lock می‌گذارد و <b>بلافاصله</b> برمی‌دارد. نتیجه: ۳ ردیف، جمع ۴۴.', (t) => t.add(t2.state('run', 'Reading')).add(scan(table, ['10', '20', '30'], 'short'), 0.2).add(t2.mem('#1', R(3, 44)), 2.7))
        .s('استاد نمرهٔ نیما را درج و نمرهٔ رضا را اصلاح می‌کند و هر دو را Commit؛ Lockی سر راهش نیست.', (t) => { t.add(t1.state('run', 'Running')); insertCommit(t); updateCommit(t, 2.8); })
        .s('Read دوم: یک ردیف <b>عوض شد</b> و یک ردیف <b>اضافه شد</b>. دو جواب متفاوت.', (t) => t.add(scan(table, ['10', '20', '25', '30'], 'short')).add(t2.mem('#2', R(4, 66, 'bad')), 3.4));
      verdictStep('Dirty Read ممکن نیست؛ ولی چون S Lock فقط لحظهٔ Read نگه داشته می‌شود، بین دو Read داده <b>عوض می‌شود</b> و <b>ردیف تازه</b> می‌آید. پیش‌فرض SQL Server همین است.');
    }

    if (level === 2) {
      open(b, sc, '<b>REPEATABLE READ</b>: هر ردیفی که Read شد، تا پایان Transaction زیر S Lock می‌ماند.');
      b.s('گزارش Read می‌کند و این بار S Lockها <b>می‌مانند</b>. نتیجه: ۳ ردیف، جمع ۴۴.', (t) => t.add(t2.state('run', 'Reading')).add(scan(table, ['10', '20', '30'], 'hold'), 0.2).add(t2.mem('#1', R(3, 44)), 2.7))
        .s('درجِ نیما <b>از لای ردیف‌ها</b> رد می‌شود؛ ولی اصلاح نمرهٔ رضا پشت S Lock گزارش <b>Wait</b> می‌کند.', (t) => { t.add(t1.state('run', 'Running')); insertCommit(t); t.add(a3.draw(0.8), 2.8).add(table.wait('20', 't1', 'T1', 'left'), 3.6).add(t1.mem('UPDATE', ST.wait), 3.6).add(t1.state('wait', 'Waiting'), 3.6); })
        .s('Read دوم: مقدارها ثابت ماندند، ولی یک <b>Phantom</b> اضافه شد: ۴ ردیف، جمع ۶۲.', (t) => t.add(scan(table, ['10', '20', '25', '30'], 'hold', ['10', '20', '30'])).add(t2.mem('#2', R(4, 62, 'bad')), 3.4));
      verdictStep('ردیف‌های Read شده تا پایان Transaction زیر Lock می‌مانند، پس <b>تغییر نمی‌کنند</b>. ولی فاصلهٔ بین ردیف‌ها Lock نیست و <b>Phantom Read</b> ممکن است. Writeها بیشتر Wait می‌کنند.');
    }

    if (level === 3) {
      open(b, sc, '<b>SERIALIZABLE</b>: سخت‌گیرترین سطحِ مبتنی بر Lock؛ نتیجه مثل اجرای یکی‌یکی است.');
      const gaps = [0, 1, 2, 3].map((i) => table.gapLock(i, 't2'));
      const ghost = h('div', 'ghost-row t-t1', `${ICON.hourglass}<span dir="ltr">INSERT 25</span>`, b.el);
      gsap.set(ghost, { x: 606, y: table.gapY(2), xPercent: -50, yPercent: -50, opacity: 0 });
      b.s('گزارش Read می‌کند، S Lockها را نگه می‌دارد و <b>فاصلهٔ بین کلیدها</b> را هم Lock می‌کند: <b>Range Lock</b>. نتیجه: ۳ ردیف، جمع ۴۴.', (t) => { t.add(t2.state('run', 'Reading')).add(scan(table, ['10', '20', '30'], 'hold'), 0.2); gaps.forEach((g, i) => t.add(g.t, 2.6 + i * 0.2)); t.add(t2.mem('#1', R(3, 44)), 3.4); })
        .s('درجِ نیما پشتِ Range Lock <b>Wait</b> می‌کند.', (t) => t.add(t1.state('wait', 'Waiting')).fromTo(ghost, { opacity: 0, x: 560 }, { opacity: 1, x: 622, duration: 0.7, ease: 'power3.out', immediateRender: false }, 0.2).to(ghost, { x: 606, duration: 0.3 }, 0.9).add(gaps[2].pulse(), 0.9).add(t1.mem('INSERT', ST.wait), 1.0))
        .s('Read دوم، همان جواب: ۳ ردیف، جمع ۴۴.', (t) => t.add(scan(table, ['10', '20', '30'], 'hold', ['10', '20', '30'])).add(t2.mem('#2', R(3, 44, 'good')), 2.6))
        .s('گزارش Commit می‌کند و Lockها آزاد می‌شوند؛ تازه حالا درج انجام می‌شود.', (t) => {
          t.add(t2.state('ok', 'Committed'));
          ['10', '20', '30'].forEach((id, i) => t.add(table.unlock(id, 't2'), 0.1 + i * 0.1));
          gaps.forEach((g) => t.to(g.el, { opacity: 0, duration: 0.3 }, 0.3));
          t.to(ghost, { opacity: 0, duration: 0.3 }, 0.5).add(table.insert(NEW, 2, { wet: 't1', from: 'left' }), 0.8).add(table.dry('25'), 1.8).add(t1.mem('INSERT', ST.ok), 1.8).add(t1.state('run', 'Running'), 1.8);
        });
      verdictStep('ردیف‌ها <b>و فاصله‌های بینشان</b> Lock می‌شوند، پس هیچ‌کدام از سه مشکل رخ نمی‌دهد. بهایش: Wait بیشتر و احتمال بیشترِ <b>Deadlock</b>.');
    }

    if (level === 4) {
      open(b, sc, '<b>SNAPSHOT</b>: ایدهٔ متفاوت. به‌جای Lock، <b>نسخه</b> (Row Versioning).');
      const flash = h('div', 'flash', '', b.el);
      flash.style.cssText = `left:${table.x - 20}px;top:${Y - 10}px;width:${table.width + 40}px;height:${table.bottom - Y + 30}px`;
      gsap.set(flash, { opacity: 0 });
      const pol = h('div', 'polaroid', '', b.el);
      const photo = new DbTable(pol, { name: 'Grades @ 12:00:03', x: 0, y: 0, rowH: 74, gap: 22, cols: COLS, rows: ROWS() }, h('div', 'pol-img', '', pol));
      h('div', 'pol-cap', `${ICON.camera}<span>عکسِ لحظهٔ شروع T2</span>`, pol);
      const PX = 960 - 137, PY = 724;
      gsap.set(pol, { x: PX, y: PY, rotation: -3, opacity: 0 });
      b.s('گزارش که شروع می‌شود، از دادهٔ committed یک <b>عکس</b> گرفته می‌شود؛ Read از روی عکس است: ۳ ردیف، جمع ۴۴.', (t) => t.to(flash, { opacity: 0.95, duration: 0.1 }, 0).to(flash, { opacity: 0, duration: 0.7 }, 0.15)
        .fromTo(pol, { x: table.x + 110, y: Y + 40, rotation: 0, scale: 1.9, opacity: 0 }, { x: PX, y: PY, rotation: -3, scale: 1, opacity: 1, duration: 1.2, ease: 'power3.inOut', immediateRender: false }, 0.2)
        .add(t2.state('run', 'Reading'), 1.4).add(scan(photo, ['10', '20', '30'], 'none'), 1.5).add(t2.mem('#1', R(3, 44)), 3.9))
        .s('استاد نمرهٔ نیما را درج و نمرهٔ رضا را اصلاح می‌کند و Commit؛ بی‌معطلی.', (t) => { t.add(t1.state('run', 'Running')); insertCommit(t); updateCommit(t, 2.8); })
        .s('Read دوم از همان عکس: همان جواب. <b>هیچ‌کس Wait نکرد.</b>', (t) => t.add(scan(photo, ['10', '20', '30'], 'none')).add(t2.mem('#2', R(3, 44, 'good')), 2.4));
      verdictStep('Read کننده Lock نمی‌گیرد و از <b>نسخه‌ای</b> می‌خواند که در شروع Transaction committed بود؛ Read و Write معطل هم نمی‌شوند. بهایش: فضای نسخه‌ها در tempdb، و <b>Write Skew همچنان ممکن است</b>.');
    }
    return b.done();
  };
}

// ---------------------------------------------------------------- SNAPSHOT update conflict

export function snapshotConflict(stage: HTMLElement) {
  const b = build(stage, { id: 'iso-conflict', chapter: CH.tools, label: 'Update Conflict', title: 'وقتی دو نفر یک نسخه را تغییر می‌دهند', term: 'Update Conflict' });
  const table = new DbTable(b.el, { name: 'dbo.Grades', x: 720, y: Y, rowH: 84, cols: COLS, rows: ROWS() });
  const t1 = new TxnCard(b.el, { tone: 't1', who: 'T1', name: 'استاد', sub: 'اصلاح نمره', x: 96, y: Y, w: CW, exec: `${k('UPDATE')} Grades\n${k('SET')} Grade = 16\n${k('WHERE')} Id = 20` });
  const t2 = new TxnCard(b.el, { tone: 't2', who: 'T2', name: 'نمرهٔ تشویقی', sub: 'SNAPSHOT', x: 1920 - 96 - CW, y: Y, w: CW, exec: `${hl(cm('SNAPSHOT'))}\ng = ${k('SELECT')} Grade … Id=20\n${k('UPDATE')} Grades\n${k('SET')} Grade = g + 1\n${k('WHERE')} Id = 20`, mem: [{ key: 'g' }] });
  const a1 = arrow(b.f, t1.side('right', 20), table.edge('20', 'left', 12), 't1', { bend: -0.1 });
  const a2 = arrow(b.f, t2.side('left', 60), table.edge('20', 'right', 12), 't2', { bend: 0.1 });
  const clash = tag(b.el, `${ICON.cross} <span dir="ltr">row changed since 12:00:03</span>`, 'bad mono check', { x: table.cell('20', 'g').x - 60, y: table.rowY('20') - 30 });
  b.hide(clash, t1.el, t2.el);
  const rule = ruleCard(b.el, { name: 'SNAPSHOT خوش‌بین است', tone: 'v', kicker: 'جمع‌بندی', body: 'SNAPSHOT جلوی Readها را نمی‌گیرد؛ ولی اگر بخواهید ردیفی را Write کنید که <b>بعد از شروعِ شما</b> عوض شده، خطای <code>3960</code> می‌گیرید و باید Retry کنید. برای جاهایی خوب است که تعارض کم است.' });
  b.show('اگر در SNAPSHOT بخواهیم <b>Write</b> کنیم چه؟ T2 به نمرهٔ رضا یک نمره اضافه می‌کند؛ استاد (T1) همان نمره را اصلاح می‌کند.', [t1.el, t2.el], (t) => t.add(table.focus('20', true), 0))
    .s('T2 از عکس، ۱۲ را Read می‌کند. در همین فاصله، استاد ۱۲ را ۱۶ می‌کند و Commit.', (t) => t.add(t2.state('run', 'SNAPSHOT')).add(table.flash('20', 't2', 0.5), 0.2).add(t2.mem('g', '12'), 0.8)
      .add(a1.draw(0.8), 1.2).add(table.lock('20', 't1', 'T1', 'X', 'left'), 2.0).add(table.set('20', 'g', '16', { wet: 't1' }), 2.4).add(table.dry('20'), 3.2).add(table.unlock('20', 't1'), 3.3).add(t1.state('ok', 'Committed'), 3.3).add(a1.hide(), 3.4))
    .s('حالا T2 می‌خواهد ۱۳ را Write کند؛ ولی ردیف بعد از شروعِ او عوض شده است.', (t) => t.add(a2.draw(0.8)).fromTo(clash, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, immediateRender: false }, 0.9).to(table.cellEl('20', 'g'), { x: 6, duration: 0.07, yoyo: true, repeat: 5 }, 1.0))
    .s('SQL Server اجازه نمی‌دهد: خطای <code>3960</code> و Rollback. اگر می‌نوشت، اصلاحِ استاد گم می‌شد (Lost Update).', (t) => t.add(t2.msg('Msg 3960: update conflict', 'bad')).add(t2.state('bad', 'Retry'), 0.2).add(a2.hide(), 0.4))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- summary

export function isoSummary(stage: HTMLElement) {
  const b = build(stage, { id: 'iso-sum', chapter: CH.tools, label: 'جمع‌بندی Isolation Level', title: 'همهٔ سطوح، یک‌جا' });
  const mx = matrix(b.el, 5, { skew: true, top: 290 });
  const ws: ('ok' | 'bad')[] = ['bad', 'bad', 'bad', 'ok', 'bad'];
  const def = note(b.el, 'پیش‌فرض SQL Server: <b>READ COMMITTED</b> با Lock · پیش‌فرض Azure SQL Database: همان با Row Versioning (<b>RCSI</b>)', 'v', 300, 800, 1320);
  def.el.classList.add('one');
  b.hide(mx.el);
  const rule = ruleCard(b.el, { name: 'پیش‌فرض را کورکورانه نپذیرید', tone: 'v', kicker: 'جمع‌بندی', body: 'انتخاب Isolation Level، انتخاب بین <b>درستی</b> و <b>هم‌زمانی</b> است. پیش‌فرض اغلب کافی نیست؛ و برای Write Skew فقط SERIALIZABLE یا یک Lock/شرطِ صریح جواب می‌دهد.' });
  b.show('همهٔ نتیجه‌ها کنار هم: سه مشکلِ Read، در پنج سطح.', mx.el)
    .s('و Write Skew (مشکل ۵): فقط SERIALIZABLE جلویش را می‌گیرد؛ حتی SNAPSHOT هم نه.', (t) => ws.forEach((v, i) => t.add(mx.put(i, [v], 3), i * 0.2)))
    .s('و پیش‌فرض‌ها:', (t) => t.add(def.show()))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}
