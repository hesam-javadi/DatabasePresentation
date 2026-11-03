import gsap from 'gsap';
import { newSlide, Slide } from '../core/deck';
import { h, show } from '../core/dom';
import { frame, subFrame, arrow, TxnCard, tag, Frame } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';

const CH = 'بخش دوم · ابزارها';
const Y = 268;

const LEVELS = [
  { name: 'READ UNCOMMITTED', cost: 'بدون قفل خواندن' },
  { name: 'READ COMMITTED', cost: 'قفل S کوتاه · پیش‌فرض' },
  { name: 'REPEATABLE READ', cost: 'قفل S تا پایان' },
  { name: 'SERIALIZABLE', cost: 'قفل روی بازه' },
  { name: 'SNAPSHOT', cost: 'نسخه‌ها در tempdb' },
];
const ANOM = ['خواندن کثیف', 'خواندن تکرارنشدنی', 'ردیف شبح'];

const rows = () => [
  { id: '10', k: '10', owner: 'سارا', bal: '500' },
  { id: '20', k: '20', owner: 'رضا', bal: '650' },
  { id: '30', k: '30', owner: 'مینا', bal: '300' },
];
const cols = [
  { key: 'k', label: 'Id', w: 120, kind: 'mono' as const, pk: true },
  { key: 'owner', label: 'Owner', w: 200 },
  { key: 'bal', label: 'Balance', w: 200, kind: 'num' as const },
];
const NEW = { id: '25', k: '25', owner: 'نیما', bal: '350' };

const T1_CODE = `<span class="kw">①</span> <span class="kw">INSERT</span> Accounts <span class="kw">VALUES</span>
   (25, N'<span class="fa-in">نیما</span>', 350)
<span class="kw">②</span> <span class="kw">UPDATE</span> Accounts <span class="kw">SET</span>
   Balance=900 <span class="kw">WHERE</span> Id=20`;
const t2Code = (lvl: string) => `<span class="hl"><span class="cm">-- </span>${lvl}</span>
<span class="kw">SELECT</span> * <span class="kw">FROM</span> Accounts
 <span class="kw">WHERE</span> Id <span class="kw">BETWEEN</span> 10 <span class="kw">AND</span> 30
<span class="cm">-- twice, then COMMIT</span>`;

const R = (n: number, sum: string, cls = '') => `<span class="${cls}">${n} rows · Σ ${sum}</span>`;
const ST = {
  wet: '<span class="s-wet">uncommitted</span>',
  wait: '<span class="s-wait">waiting…</span>',
  ok: '<span class="s-ok">committed</span>',
  back: '<span class="s-back">rolled back</span>',
};

interface Layer { root: HTMLElement; table: DbTable; t1: TxnCard; t2: TxnCard; f: Frame }

function layer(el: HTMLElement, k: number, pf: Frame): Layer {
  const root = h('div', 'iso-layer', '', el);
  const f = subFrame(pf, root);
  if (k > 0) gsap.set(root, { opacity: 0 });
  const table = new DbTable(root, { name: 'dbo.Accounts', x: 700, y: Y, rowH: 74, gap: 22, cols, rows: rows() });
  const t1 = new TxnCard(root, {
    tone: 't1', who: 'T1', name: 'کارمند بانک', sub: 'دو نوشتن جدا', x: 96, y: Y, w: 410,
    exec: T1_CODE, execLabel: 'دستورها', memLabel: 'وضعیت', mem: [{ key: 'INSERT', init: '<span class="null">—</span>' }, { key: 'UPDATE', init: '<span class="null">—</span>' }],
  });
  const t2 = new TxnCard(root, {
    tone: 't2', who: 'T2', name: 'گزارش شعبه', sub: 'یک تراکنش، دو خواندن', x: 1414, y: Y, w: 410,
    exec: t2Code(LEVELS[k].name), execLabel: 'تراکنش', memLabel: 'نتیجهٔ خواندن‌ها', mem: [{ key: '#1', init: '<span class="null">—</span>' }, { key: '#2', init: '<span class="null">—</span>' }],
  });
  return { root, table, t1, t2, f };
}

/** The reader's scan: a band sweeps the rows; S locks are skipped, brief, or kept. */
function scan(table: DbTable, ids: string[], mode: 'none' | 'short' | 'hold', skip: string[] = []) {
  const band = h('div', 'scan t-t2', '', table.body);
  gsap.set(band, { opacity: 0, y: table.rowY(ids[0]) - table.top0 });
  const t = gsap.timeline();
  t.to(band, { opacity: 1, duration: 0.2 }, 0);
  ids.forEach((id, i) => {
    const at = 0.15 + i * 0.55;
    t.to(band, { y: table.rowY(id) - table.top0, duration: 0.35, ease: 'power2.inOut' }, at);
    if (mode !== 'none' && !skip.includes(id)) {
      t.add(table.lock(id, 't2', 'T2', 'S', 'right'), at + 0.2);
      if (mode === 'short') t.add(table.unlock(id, 't2'), at + 0.55);
    }
  });
  t.to(band, { opacity: 0, duration: 0.25 }, 0.15 + ids.length * 0.55 + 0.1);
  return t;
}

export function isolationSlide(stage: HTMLElement): Slide {
  const { el, master, step } = newSlide(stage, 's-iso');
  const f = frame(el, 'یک گزارش، پنج قانون', 'Isolation Levels', { narrW: 1728 });
  const L = LEVELS.map((_, k) => layer(el, k, f));

  // ---- the anomaly matrix: fills in as each level is tried
  const mx = h('div', 'iso-matrix', '', el);
  const legend = h('div', 'mx-col legend', `<div class="mx-h"><span>هر سطح جلوی کدام را می‌گیرد؟</span></div>${ANOM.map((a) => `<div class="mx-c">${a}</div>`).join('')}`, mx);
  void legend;
  const colEls = LEVELS.map((lv, k) => h('div', `mx-col lv ${k === 4 ? 'snap' : ''}`, `<i class="mx-hl"></i><div class="mx-h"><b dir="ltr">${lv.name}</b><small>${lv.cost}</small></div>${ANOM.map(() => '<div class="mx-c"><i class="ind"></i></div>').join('')}`, mx));
  const hl = colEls.map((c) => { const e = c.querySelector('.mx-hl') as HTMLElement; gsap.set(e, { opacity: 0 }); return e; });
  const verdict = (k: number, v: ('ok' | 'bad')[]) => {
    const t = gsap.timeline();
    const cells = colEls[k].querySelectorAll('.mx-c');
    v.forEach((r, i) => {
      const ic = h('span', `res ${r}`, r === 'ok' ? ICON.check : ICON.cross, cells[i]);
      gsap.set(ic, { opacity: 0 });
      t.fromTo(ic, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.4)', immediateRender: false }, i * 0.18);
    });
    return t;
  };
  const focusCol = (k: number) => {
    const t = gsap.timeline();
    hl.forEach((e, i) => t.to(e, { opacity: i === k ? 1 : 0, duration: 0.4 }, 0));
    return t;
  };
  const swapLayer = (from: number, to: number) =>
    gsap.timeline().to(L[from].root, { opacity: 0, duration: 0.4 }, 0).to(L[to].root, { opacity: 1, duration: 0.5 }, 0.25);

  const a1 = (lay: Layer, id: string, out = 0) => arrow(lay.f, lay.t1.side('right', 10), lay.table.edge(id, 'left', 12 + out), 't1', { bend: -0.1 });

  // ---- 1 · setup
  step((t) => {
    t.add(f.narr.to('T2 یک گزارش است و یک بازه را <b>دو بار</b> می‌خواند. در همین فاصله T1 یک ردیف <b>اضافه</b> و یکی را <b>عوض</b> می‌کند. T2 چه می‌بیند؟'), 0.1)
      .add(show(L[0].table.el, { y: 30 }), 0)
      .add(show([L[0].t1.el, L[0].t2.el], { y: 30, stagger: 0.12 }), 0.15)
      .add(show(mx, { y: 30 }), 0.4);
  });

  // ---- 2 · READ UNCOMMITTED: reads wet ink that then evaporates
  step((t) => {
    const { table, t1, t2 } = L[0];
    const ar = a1(L[0], '20');
    t.add(f.narr.to('<code>READ UNCOMMITTED</code>: هیچ قفل خواندنی. T2 ردیفی را می‌خواند که هنوز commit نشده؛ و بعد ناپدید می‌شود.'), 0)
      .add(focusCol(0), 0)
      .add(ar.draw(), 0.3)
      .add(table.insert(NEW, 2, { wet: 't1', from: 'left' }), 0.8)
      .add(table.lock('25', 't1', 'T1', 'X', 'left'), 1.5)
      .add(t1.mem('INSERT', ST.wet), 1.5)
      .add(ar.hide(), 1.8)
      .add(scan(table, ['10', '20', '25', '30'], 'none'), 2.2)
      .add(t2.mem('#1', R(4, '1,800', 'dirty')), 4.6)
      .add(t1.mem('INSERT', ST.back), 5.6)
      .add(table.unlock('25', 't1'), 5.6)
      .add(table.remove('25', { evaporate: true }), 5.8)
      .add(t2.mem('#1', R(4, '1,800', 'bad strike')), 6.8)
      .add(verdict(0, ['bad', 'bad', 'bad']), 7.2);
  });

  // ---- 3 · READ COMMITTED: brief S locks; both changes slip in between the reads
  step((t) => {
    const { table, t1, t2 } = L[1];
    const ar1 = a1(L[1], '20'), ar2 = a1(L[1], '20');
    t.add(swapLayer(0, 1), 0)
      .add(f.narr.to('<code>READ COMMITTED</code> (پیش‌فرض SQL Server): قفل S فقط لحظهٔ خواندن. بین دو خواندن، داده عوض می‌شود.'), 0)
      .add(focusCol(1), 0)
      .add(scan(table, ['10', '20', '30'], 'short'), 0.8)
      .add(t2.mem('#1', R(3, '1,450')), 2.6)
      .add(ar1.draw(), 3.0)
      .add(table.insert(NEW, 2, { wet: 't1', from: 'left' }), 3.4)
      .add(table.lock('25', 't1', 'T1', 'X', 'left'), 3.9)
      .add(table.dry('25'), 4.6)
      .add(table.unlock('25', 't1'), 4.7)
      .add(t1.mem('INSERT', ST.ok), 4.7)
      .add(ar1.hide(), 4.8)
      .add(ar2.draw(), 5.0)
      .add(table.lock('20', 't1', 'T1', 'X', 'left'), 5.4)
      .add(table.set('20', 'bal', '900', { wet: 't1' }), 5.8)
      .add(table.dry('20'), 6.5)
      .add(table.unlock('20', 't1'), 6.6)
      .add(t1.mem('UPDATE', ST.ok), 6.6)
      .add(ar2.hide(), 6.7)
      .add(scan(table, ['10', '20', '25', '30'], 'short'), 7.0)
      .add(t2.mem('#2', R(4, '2,050', 'bad')), 9.4)
      .add(verdict(1, ['ok', 'bad', 'bad']), 9.8);
  });

  // ---- 4 · REPEATABLE READ: S locks stay; the update waits, the insert slips into the gap
  step((t) => {
    const { table, t1, t2 } = L[2];
    const ar1 = a1(L[2], '20');
    const ar2 = a1(L[2], '20', 70);
    t.add(swapLayer(1, 2), 0)
      .add(f.narr.to('<code>REPEATABLE READ</code>: قفل‌های S تا پایان تراکنش می‌مانند. تغییر ممنوع است، ولی ردیف تازه از لای ردیف‌ها وارد می‌شود.'), 0)
      .add(focusCol(2), 0)
      .add(scan(table, ['10', '20', '30'], 'hold'), 0.8)
      .add(t2.mem('#1', R(3, '1,450')), 2.6)
      .add(ar1.draw(), 3.0)
      .add(table.insert(NEW, 2, { wet: 't1', from: 'left' }), 3.4)
      .add(table.lock('25', 't1', 'T1', 'X', 'left'), 3.9)
      .add(table.dry('25'), 4.6)
      .add(table.unlock('25', 't1'), 4.7)
      .add(t1.mem('INSERT', ST.ok), 4.7)
      .add(ar1.hide(), 4.8)
      .add(ar2.draw(), 5.0)
      .add(table.wait('20', 't1', 'T1', 'left'), 5.5)
      .add(t1.mem('UPDATE', ST.wait), 5.5)
      .add(t1.state('wait', 'منتظر T2'), 5.5)
      .add(scan(table, ['10', '20', '25', '30'], 'hold', ['10', '20', '30']), 6.4)
      .add(t2.mem('#2', R(4, '1,800', 'bad')), 8.8)
      .add(verdict(2, ['ok', 'ok', 'bad']), 9.2);
  });

  // ---- 5 · SERIALIZABLE: the gaps are locked too; correct, but T1 waits
  step((t) => {
    const { table, t1, t2 } = L[3];
    const g1 = table.gapLock(0, 't2'), g2 = table.gapLock(1, 't2'), g3 = table.gapLock(2, 't2'), g4 = table.gapLock(3, 't2');
    const ghost = h('div', 'ghost-row t-t1', `${ICON.hourglass}<span dir="ltr">INSERT 25</span>`, L[3].root);
    const gy = table.gapY(2);
    gsap.set(ghost, { x: 600, y: gy, xPercent: -50, yPercent: -50, opacity: 0 });
    t.add(swapLayer(2, 3), 0)
      .add(f.narr.to('<code>SERIALIZABLE</code>: فاصلهٔ بین کلیدها هم قفل می‌شود. نتیجه درست است؛ بهایش این است که T1 <b>منتظر</b> ماند.'), 0)
      .add(focusCol(3), 0)
      .add(scan(table, ['10', '20', '30'], 'hold'), 0.8)
      .add(g1.t, 2.5).add(g2.t, 2.6).add(g3.t, 2.7).add(g4.t, 2.8)
      .add(t2.mem('#1', R(3, '1,450')), 2.8)
      .fromTo(ghost, { opacity: 0, x: 560 }, { opacity: 1, x: 622, duration: 0.6, ease: 'power3.out', immediateRender: false }, 3.4)
      .to(ghost, { x: 606, duration: 0.25, ease: 'power2.out' }, 4.0)
      .add(g3.pulse(), 4.0)
      .add(t1.mem('INSERT', ST.wait), 4.2)
      .add(t1.state('wait', 'منتظر T2'), 4.2)
      .add(scan(table, ['10', '20', '30'], 'hold', ['10', '20', '30']), 5.0)
      .add(t2.mem('#2', R(3, '1,450', 'good')), 6.9)
      .add(verdict(3, ['ok', 'ok', 'ok']), 7.3);
  });

  // ---- 6 · SNAPSHOT: a photo taken at the start; nobody waits
  step((t) => {
    const { table, t1, t2, root } = L[4];
    const flash = h('div', 'flash', '', root);
    flash.style.cssText = `left:${table.x - 20}px;top:${Y - 10}px;width:${table.width + 40}px;height:${table.bottom - Y + 30}px`;
    gsap.set(flash, { opacity: 0 });
    const pol = h('div', 'polaroid', '', root);
    const photo = new DbTable(pol, { name: 'dbo.Accounts @ 12:00:00', x: 0, y: 0, rowH: 74, gap: 22, cols, rows: rows() }, h('div', 'pol-img', '', pol));
    h('div', 'pol-cap', `${ICON.camera}<span>عکس لحظهٔ شروع T2</span>`, pol);
    gsap.set(pol, { x: 1500, y: 352, rotation: -4, opacity: 0 });
    const cam = tag(root, `${ICON.camera}`, 'cam', { x: table.x + table.width / 2, y: Y + 160 });
    const ar1 = a1(L[4], '20'), ar2 = a1(L[4], '20');
    t.add(swapLayer(3, 4), 0)
      .add(f.narr.to('<code>SNAPSHOT</code>: نه قفلی، نه انتظاری. T2 از <b class="kv">عکسی</b> می‌خواند که لحظهٔ شروعش گرفته شد.'), 0)
      .add(focusCol(4), 0)
      .fromTo(cam, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.35, immediateRender: false }, 0.7)
      .to(flash, { opacity: 0.95, duration: 0.08 }, 1.1)
      .to(flash, { opacity: 0, duration: 0.6 }, 1.2)
      .to(cam, { opacity: 0, duration: 0.3 }, 1.3)
      .fromTo(pol, { x: table.x + 140, y: Y + 40, rotation: 0, scale: 2.3, opacity: 0 }, { x: 1500, y: 352, rotation: -4, scale: 1, opacity: 1, duration: 1.0, ease: 'power3.inOut', immediateRender: false }, 1.2)
      .add(scan(photo, ['10', '20', '30'], 'none'), 2.5)
      .add(t2.mem('#1', R(3, '1,450')), 4.2)
      .add(ar1.draw(), 4.2)
      .add(table.insert(NEW, 2, { wet: 't1', from: 'left' }), 4.5)
      .add(table.dry('25'), 5.3)
      .add(t1.mem('INSERT', ST.ok), 5.3)
      .add(ar1.hide(), 5.4)
      .add(ar2.draw(), 5.5)
      .add(table.set('20', 'bal', '900', { wet: 't1' }), 5.9)
      .add(table.dry('20'), 6.5)
      .add(t1.mem('UPDATE', ST.ok), 6.5)
      .add(ar2.hide(), 6.6)
      .add(scan(photo, ['10', '20', '30'], 'none'), 6.9)
      .add(t2.mem('#2', R(3, '1,450', 'good')), 8.6)
      .add(verdict(4, ['ok', 'ok', 'ok']), 9.0);
  });

  return { id: 'isolation', chapter: CH, label: 'سطوح جداسازی', steps: 6, el, tl: master };
}

