import gsap from 'gsap';
import { build } from '../core/build';
import { h, swapper } from '../core/dom';
import { arrow, node, anchor, ruleCard, note, tag } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';
import { CH } from './common';

// ---------------------------------------------------------------- chapter

export function caseChapter(stage: HTMLElement) {
  const b = build(stage, { id: 'case', chapter: CH.real, label: 'یک سامانهٔ واقعی', title: '', cls: 's-chapter' });
  const cv = h('canvas', 'field', '', b.el) as HTMLCanvasElement;
  cv.width = 1920; cv.height = 1080;
  const g = cv.getContext('2d')!;
  h('div', 'field-fade', '', b.el);
  const card = h('div', 'ch-card', '', b.el);
  const kick = h('div', 'kicker', 'بخش ۴ · یک سامانهٔ واقعی', card);
  const tt = h('h1', '', '<span dir="ltr">BulkOperation</span>', card);
  const lede = h('p', '', 'سامانه‌ای که ساختیم تا یک عملیات را روی صدها هزار آیتم، در پس‌زمینه و روی چند سرور هم‌زمان، اجرا کند.', card);
  const facts = h('div', 'facts', `<div><b>۵۰۰٬۰۰۰</b><span>آیتم در آزمون بار</span></div><div><b>۳</b><span>Instance هم‌زمان سرویس</span></div><div><b>۱</b><span>منبع حقیقت: SQL Server</span></div>`, card);
  const order = h('div', 'req', 'اول می‌بینیم <b>چرا</b> لازم شد و <b>چطور</b> کار می‌کند؛ بعد مشکلات هم‌زمانی‌اش را.', card);
  const S = 16, GAP = 5, cols = Math.ceil(1920 / (S + GAP)), rows = Math.ceil(1080 / (S + GAP));
  const seed = Array.from({ length: cols * rows }, () => Math.random());
  let raf = 0, t0 = 0;
  const draw = (now: number) => {
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    g.clearRect(0, 0, 1920, 1080);
    const front = ((t * 0.1 + 0.35) % 1.3) * cols;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const r = seed[j * cols + i];
      const d = cols - 1 - i + (r - 0.5) * 9 + Math.sin(j * 0.35) * 3;
      g.fillStyle = d < front - 4 ? (r < 0.012 ? '#e0313b' : '#7fcbb0') : d < front ? (r < 0.33 ? '#2856e6' : r < 0.36 ? '#dc8300' : '#a9bdf5') : '#dde3ec';
      g.fillRect(i * (S + GAP), j * (S + GAP), S, S);
    }
    raf = requestAnimationFrame(draw);
  };
  b.hide(cv, card);
  b.hide(lede, facts, order);
  b.s(null, (t) => t.to(cv, { opacity: 0.7, duration: 1.0 }, 0).fromTo([card, lede], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.3, immediateRender: false }, 0.2));
  b.show(null, [facts, order], undefined, { stagger: 0.3 });
  void kick; void tt;
  b.onStep((s) => { cancelAnimationFrame(raf); if (s > 0) raf = requestAnimationFrame(draw); });
  return b.done();
}

// ---------------------------------------------------------------- the need

export function caseNeed(stage: HTMLElement) {
  const b = build(stage, { id: 'need', chapter: CH.real, label: 'نیاز', title: 'یک کلیک، ۵۰۰٬۰۰۰ کار' });
  const op = node(b.el, `${ICON.phone}<b>کاربر سامانه</b><small>«این عملیات را روی همهٔ این ۵۰۰٬۰۰۰ مورد اجرا کن»</small>`, 1440, 330, 380, 'tone t-t1');
  const ext = node(b.el, `${ICON.bolt}<b>سرویس بیرونی</b><small>هر درخواست حدود ۲۰۰ میلی‌ثانیه؛ گاهی هم خطا</small>`, 160, 330, 380, 'tone t-t3');
  const a = arrow(b.f, anchor(op, b.el).l, anchor(ext, b.el).r, 't1', { bend: 0 });
  const calc = node(b.el, '<b dir="ltr">500,000 × 200 ms = 100,000 s</b><small>یعنی حدود <b>۲۸ ساعت</b>، اگر یکی‌یکی انجام شود</small>', 660, 330, 600, 'calc');
  const analogy = note(b.el, 'مثال آشنا: آموزش بخواهد اطلاعات ۵۰۰ هزار دانش‌آموخته را یکی‌یکی برای سامانهٔ وزارت بفرستد.', 'ink', 560, 560, 800);
  const fails = [
    [ICON.clock, 'درخواست HTTP بعد از چند ده ثانیه Timeout می‌شود'],
    [ICON.refresh, 'با هر Restart یا Deploy، هرچه انجام شده بود گم می‌شود'],
    [ICON.cross, 'نه پیشرفتی دیده می‌شود، نه می‌شود Cancelش کرد'],
    [ICON.db, 'فقط یک سرور کار می‌کند؛ دو سرور دیگر بیکارند'],
  ].map(([ic, t], i) => node(b.el, `<span class="fl">${ic}</span>${t}`, 160 + (i % 2) * 820, 700 + Math.floor(i / 2) * 110, 780, 'fail'));
  const rule = ruleCard(b.el, { name: 'کارِ طولانی را از درخواست جدا کنید', tone: 'ok', kicker: 'نتیجه', body: 'درخواست فقط <b>کار را ثبت می‌کند</b> و فوراً جواب می‌دهد. خودِ کار در پس‌زمینه، تکه‌تکه، روی چند سرور انجام می‌شود و وضعیتش در <b>پایگاه داده</b> نگه داشته می‌شود.' });
  b.show('نیاز: کاربر چند صد هزار مورد را انتخاب می‌کند و با <b>یک کلیک</b> یک عملیات را روی همه اجرا می‌کند.', op)
    .show('هر مورد یعنی یک درخواست به یک سرویس بیرونی؛ کُند و گاهی ناموفق.', ext, (t) => t.add(a.draw(0.8), 0.4))
    .show('یک حساب ساده: اگر یکی‌یکی انجام شود، حدود ۲۸ ساعت.', [calc, analogy.el], undefined, { stagger: 0.4 })
    .show('اگر همه را داخل همان یک درخواست انجام دهیم، چه می‌شود؟', fails, (t) => t.add(analogy.hide(), 0), { y: 14, stagger: 0.25 })
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- requirements

export function caseReqs(stage: HTMLElement) {
  const b = build(stage, { id: 'reqs', chapter: CH.real, label: 'خواسته‌ها', title: 'از سامانه چه می‌خواستیم؟' });
  const items: [string, string, string][] = [
    [ICON.bolt, 'جواب فوری', 'درخواست فقط ثبت شود و بلافاصله برگردد'],
    [ICON.refresh, 'پیشرفتِ قابل‌مشاهده', 'در هر لحظه بدانیم چند مورد انجام شد'],
    [ICON.cross, 'قابل Cancel', 'هر وقت کاربر خواست، متوقف شود'],
    [ICON.shield, 'مقاوم در برابر Restart', 'اگر سرور افتاد، کار از همان‌جا ادامه پیدا کند'],
    [ICON.db, 'پخش روی چند سرور', 'هر سه Instance سرویس هم‌زمان کار کنند'],
    [ICON.check, 'دقیقاً یک بار', 'هیچ موردی دو بار اجرا نشود، هیچ موردی جا نماند'],
    [ICON.clock, 'Retry', 'خطای گذرا دوباره امتحان شود؛ خطای قطعی نه'],
  ];
  const grid = h('div', 'reqs', '', b.el);
  const els = items.map(([ic, n, d], i) => h('div', `rq ${i === 5 ? 'key' : ''}`, `<span class="rq-i">${ic}</span><div><b>${n}</b><span>${d}</span></div>`, grid));
  b.show('خواسته‌ها؛ هر کدام بعداً یک تصمیم طراحی می‌شود.', els.filter((_, i) => i !== 5), undefined, { y: 14, stagger: 0.12 })
    .show('و سخت‌ترینش: <b>دقیقاً یک بار</b>. این‌جاست که هم‌زمانی وارد بازی می‌شود.', els[5], undefined, { y: 14 });
  return b.done();
}

// ---------------------------------------------------------------- data model

export function caseModel(stage: HTMLElement) {
  const b = build(stage, { id: 'model', chapter: CH.real, label: 'مدل داده', title: 'دو جدول: عملیات و آیتم‌هایش' });
  const op = new DbTable(b.el, {
    name: 'dbo.BulkOperation', x: 570, y: 262, rowH: 76,
    cols: [{ key: 'id', label: 'Id', w: 90, kind: 'mono', pk: true }, { key: 'st', label: 'Status', w: 190, kind: 'pill' }, { key: 'tot', label: 'Total', w: 170, kind: 'num' }, { key: 'ok', label: 'Succeeded', w: 190, kind: 'num' }, { key: 'bad', label: 'Failed', w: 140, kind: 'num' }],
    rows: [{ id: '17', st: 'Running', tot: '500000', ok: '182344', bad: '211' }],
  });
  const it = new DbTable(b.el, {
    name: 'dbo.BulkOperationItems', x: 470, y: 540, rowH: 70,
    cols: [{ key: 'id', label: 'Id', w: 90, kind: 'mono', pk: true }, { key: 'op', label: 'OperationId', w: 160, kind: 'mono' }, { key: 'st', label: 'Status', w: 210, kind: 'pill' }, { key: 'att', label: 'Attempt', w: 120, kind: 'num' }, { key: 'tok', label: 'LockToken', w: 190, kind: 'mono' }, { key: 'until', label: 'LockUntil', w: 190, kind: 'mono' }],
    rows: [
      { id: '41', op: '17', st: 'Succeeded', att: '1', tok: 'NULL', until: 'NULL' },
      { id: '42', op: '17', st: 'Queued', att: '0', tok: 'NULL', until: 'NULL' },
      { id: '43', op: '17', st: 'Processing', att: '1', tok: '7f3a', until: '12:00:30' },
      { id: '44', op: '17', st: 'Pending', att: '0', tok: 'NULL', until: 'NULL' },
    ],
  });
  const rel = arrow(b.f, { x: op.x + 45, y: op.bottom + 6 }, { x: it.x + 70, y: it.y - 6 }, 'ink', { bend: 0.15 });
  const relTag = tag(b.el, 'یک عملیات، تعداد زیادی آیتم', 'ink', { x: 360, y: 490 });
  b.hide(relTag);
  b.show('همهٔ وضعیت در دو جدول است، نه در حافظهٔ سرورها. <code>BulkOperation</code>: برای هر درخواست یک ردیف، با Status و پیشرفت.', op.el, (t) => t.add(op.mark('17', 'st', 't1'), 0.6).add(op.mark('17', 'tot', 't1'), 0.8).add(op.mark('17', 'ok', 't1'), 0.9).add(op.mark('17', 'bad', 't1'), 1.0))
    .show('<code>BulkOperationItems</code>: برای هر مورد یک ردیف؛ <code>Status</code> جای آیتم در مسیر و <code>Attempt</code> تعداد تلاش.', it.el, (t) => {
      ['st', 'tot', 'ok', 'bad'].forEach((c) => t.add(op.mark('17', c, 't1', false), 0));
      t.add(rel.draw(0.8), 0.5).fromTo(relTag, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 1.0);
      ['41', '42', '43', '44'].forEach((r, i) => { t.add(it.mark(r, 'st', 't2'), 1.2 + i * 0.1); t.add(it.mark(r, 'att', 't2'), 1.4 + i * 0.1); });
    })
    .s('<code>LockToken</code> و <code>LockUntil</code>: چه کسی صاحب آیتم است و تا کی. قلب حل مسئلهٔ هم‌زمانی.', (t) => { ['41', '42', '43', '44'].forEach((r) => { t.add(it.mark(r, 'st', 't2', false), 0); t.add(it.mark(r, 'att', 't2', false), 0); }); t.add(it.focus('43', true, 't1'), 0.2).add(it.mark('43', 'tok', 't1'), 0.3).add(it.mark('43', 'until', 't1'), 0.4); });
  return b.done();
}

// ---------------------------------------------------------------- item lifecycle

export function caseLifecycle(stage: HTMLElement) {
  const b = build(stage, { id: 'life', chapter: CH.real, label: 'چرخهٔ عمر آیتم', title: 'چرخهٔ عمر یک آیتم' });
  const st = (name: string, desc: string, x: number, y: number, tone: string) => node(b.el, `<b dir="ltr">${name}</b><small>${desc}</small>`, x, y, 300, `tone t-${tone} state`);
  const pending = st('Pending', 'ثبت شده؛ هنوز در صف نیست', 1520, 420, 'mute');
  const queued = st('Queued', 'پیامش در صف است', 1100, 420, 'mute');
  const proc = st('Processing', 'یک Worker صاحبش است', 680, 420, 't1');
  const done = st('Succeeded', 'انجام شد', 260, 300, 'ok');
  const failed = st('Failed', 'خطای قطعی یا سقفِ Retry', 260, 560, 'bad');
  const cancel = st('Cancelled', 'عملیات Cancel شد', 1100, 720, 't3');
  const A = (a: HTMLElement, c: HTMLElement, side: 'h' | 'v' = 'h', bend = 0) => {
    const p = anchor(a, b.el), q = anchor(c, b.el);
    return arrow(b.f, side === 'h' ? p.l : p.b, side === 'h' ? q.r : q.t, 'ink', { bend });
  };
  const e1 = A(pending, queued), e2 = A(queued, proc), e3 = A(proc, done, 'h', 0.1), e4 = A(proc, failed, 'h', -0.1);
  const pq = anchor(proc, b.el), qq = anchor(queued, b.el);
  const back = arrow(b.f, pq.t, qq.t, 'bad', { bend: -0.5, dashed: true });
  const backTag = tag(b.el, 'Lease تمام شد یا خطای گذرا ← دوباره در صف', 'bad', { x: 1050, y: 300 });
  const e5 = A(queued, cancel, 'v');
  b.hide(backTag);
  b.show('هر آیتم از چند وضعیت رد می‌شود؛ هر تغییر وضعیت یک UPDATE است. <b>Pending</b>: ثبت شده، هنوز در صف نیست.', pending)
    .show('<b>Queued</b>: پیامش در صف است. <b>Processing</b>: یک Worker صاحبش شده؛ با یک Token و زمانِ Lease.', [queued, proc], (t) => t.add(e1.draw(0.7), 0.3).add(e2.draw(0.7), 0.8), { stagger: 0.5 })
    .show('<b>Succeeded</b>: انجام شد. <b>Failed</b>: خطای قطعی، یا بعد از سقفِ Retry.', [done, failed], (t) => t.add(e3.draw(0.7), 0.3).add(e4.draw(0.7), 0.5))
    .s('و یک راه برگشت: اگر Lease تمام شد یا خطای گذرا آمد، آیتم <b>دوباره Queued</b> می‌شود.', (t) => t.add(back.draw()).fromTo(backTag, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 0.5))
    .show('<b>Cancelled</b>: اگر کاربر عملیات را Cancel کند، آیتم‌های باقی‌مانده.', cancel, (t) => t.add(e5.draw(0.7), 0.4));
  return b.done();
}

// ---------------------------------------------------------------- the flow

export function caseFlow(stage: HTMLElement) {
  const b = build(stage, { id: 'flow', chapter: CH.real, label: 'مسیر کار', title: 'مسیر یک آیتم، از کلیک تا انجام' });
  const N = (html: string, x: number, y: number, w: number, tone: string) => node(b.el, html, x, y, w, `tone t-${tone}`);
  const user = N(`${ICON.phone}<b>کاربر</b>`, 1600, 300, 220, 't1');
  const api = N(`${ICON.bolt}<b>API</b><small>۳ Instance</small>`, 1260, 300, 240, 'ink');
  const db = N(`${ICON.db}<b>SQL Server</b><small>عملیات + آیتم‌ها</small>`, 840, 300, 300, 'v');
  const disp = N(`${ICON.refresh}<b>Dispatcher</b><small>Window ارسال</small>`, 840, 560, 300, 'ink');
  const mq = N(`${ICON.mail}<b>RabbitMQ</b><small>Message Queue</small>`, 420, 560, 280, 't3');
  const workers = N(`${ICON.bolt}<b>Workerها</b><small>همان ۳ Instance</small>`, 420, 300, 280, 'ink');
  const ext = N(`${ICON.bolt}<b>سرویس بیرونی</b>`, 96, 300, 240, 't3');
  const P = (e: HTMLElement) => anchor(e, b.el);
  const ar = [
    arrow(b.f, P(user).l, P(api).r, 'ink', { bend: 0 }),
    arrow(b.f, P(api).l, P(db).r, 'ink', { bend: 0 }),
    arrow(b.f, P(db).b, P(disp).t, 'ink', { bend: 0 }),
    arrow(b.f, P(disp).l, P(mq).r, 'ink', { bend: 0 }),
    arrow(b.f, P(mq).t, P(workers).b, 'ink', { bend: 0 }),
    arrow(b.f, P(workers).l, P(ext).r, 'ink', { bend: 0 }),
    arrow(b.f, { x: P(workers).r.x, y: P(workers).r.y - 20 }, { x: P(db).l.x, y: P(db).l.y - 20 }, 'ok', { bend: 0 }),
  ];
  b.show('مسیر کلی: کاربر عملیات را ثبت می‌کند؛ API یک ردیف عملیات و ۵۰۰٬۰۰۰ ردیف آیتم را <b>یکجا</b> درج می‌کند و فوراً جواب می‌دهد.', [user, api, db], (t) => t.add(ar[0].draw(0.7), 0.4).add(ar[1].draw(0.7), 0.8), { stagger: 0.3 })
    .show('یک <b>Dispatcher</b> در پس‌زمینه آیتم‌ها را <b>دسته‌دسته</b> برمی‌دارد و برای هر کدام یک پیام در صف می‌گذارد.', [disp, mq], (t) => t.add(ar[2].draw(0.7), 0.2).add(ar[3].draw(0.7), 0.7), { stagger: 0.4 })
    .show('<b>Workerها</b>، روی هر سه Instance سرویس، پیام‌ها را برمی‌دارند و کار را با سرویس بیرونی انجام می‌دهند.', [workers, ext], (t) => t.add(ar[4].draw(0.7), 0.2).add(ar[5].draw(0.7), 0.7), { stagger: 0.4 })
    .s('و نتیجه را در پایگاه داده ثبت می‌کنند. <b>هر تصمیمی همین‌جا گرفته می‌شود.</b>', (t) => t.add(ar[6].draw(0.8)).to(db, { scale: 1.06, duration: 0.3, yoyo: true, repeat: 1 }, 0.6));
  return b.done();
}

// ---------------------------------------------------------------- bulk insert

export function caseBulk(stage: HTMLElement) {
  const b = build(stage, { id: 'bulk', chapter: CH.real, label: 'درج دسته‌ای', title: 'نیم میلیون ردیف، یکجا', term: 'SqlBulkCopy' });
  const laneA = node(b.el, '<b>ردیف‌به‌ردیف</b><small>۵۰۰٬۰۰۰ بار: بفرست، صبر کن، جواب بگیر</small>', 1060, 300, 760, 'lane-box');
  const laneB = node(b.el, '<b>SqlBulkCopy</b><small>یک جریان داده، یک بار</small>', 1060, 600, 760, 'lane-box');
  const dbA = node(b.el, `${ICON.db}<b>SQL Server</b>`, 160, 300, 260, 'tone t-v');
  const dbB = node(b.el, `${ICON.db}<b>SQL Server</b>`, 160, 600, 260, 'tone t-v');
  const chips = Array.from({ length: 6 }, (_, i) => { const c = h('div', 'mini-ins', 'INSERT', b.el); gsap.set(c, { x: 1000, y: 360 + (i % 2) * 6, opacity: 0 }); return c; });
  const block = h('div', 'big-block', '500,000 rows', b.el);
  gsap.set(block, { x: 980, y: 650, opacity: 0 });
  const cntBox = h('div', 'counter', '', b.el);
  const cnt = swapper(cntBox, 'رفت‌وبرگشت: <b>۰</b>');
  const tA = note(b.el, 'حدود <b>۱۵ دقیقه</b>', 'bad', 620, 480, 300); tA.el.classList.add('one');
  const tB = note(b.el, 'حدود <b>۱۰ ثانیه</b>', 'ok', 620, 780, 300); tB.el.classList.add('one');
  b.show('قدم اول: ۵۰۰٬۰۰۰ آیتم باید در جدول بنشینند. راه ساده: هر ردیف یک INSERT، یعنی یک رفت‌وبرگشت شبکه.', [laneA, dbA, cntBox], (t) => {
      t.add(cnt.to('رفت‌وبرگشت: <b>۳</b>'), 0.6);
      chips.forEach((c, i) => t.fromTo(c, { x: 1000, opacity: 0 }, { x: 440, opacity: 1, duration: 0.9, ease: 'none', immediateRender: false }, 0.6 + i * 0.35).to(c, { opacity: 0, duration: 0.15 }, 0.6 + i * 0.35 + 0.9));
      t.add(cnt.to('رفت‌وبرگشت: <b>۱۲٬۴۰۰</b>…'), 1.8).add(cnt.to('رفت‌وبرگشت: <b>۵۰۰٬۰۰۰</b>'), 3.0).add(tA.show(), 3.2);
    })
    .show('راه درست: <code>SqlBulkCopy</code>؛ همهٔ ردیف‌ها در یک جریان، یک بار.', [laneB, dbB], (t) => t.fromTo(block, { opacity: 0, x: 980 }, { opacity: 1, x: 440, duration: 1.2, ease: 'power2.inOut', immediateRender: false }, 0.3).add(tB.show(), 1.6));
  cntBox.style.cssText = 'left:1100px;top:440px';
  return b.done();
}

// ---------------------------------------------------------------- dispatch window

export function caseWindow(stage: HTMLElement) {
  const b = build(stage, { id: 'window', chapter: CH.real, label: 'پنجرهٔ ارسال', title: 'همه را یکجا در صف نریزید', term: 'Backpressure' });
  const N = 16, x0 = 820, y0 = 270, hh = 40;
  const col = h('div', 'icol', '', b.el);
  col.style.cssText = `left:${x0}px;top:${y0}px`;
  const bars = Array.from({ length: N }, () => h('i', '', '', col));
  const frame = h('div', 'iwin', '<span>Window: ۱٬۰۰۰ آیتم</span>', b.el);
  frame.style.cssText = `left:${x0 - 14}px;top:${y0 - 8}px;height:${hh * 5 + 8}px`;
  const gauge = node(b.el, `${ICON.mail}<b class="gq">۱٬۰۰۰</b><small>پیام در صف؛ هیچ‌وقت بیشتر</small>`, 1360, 420, 300, 'gauge');
  const legend = h('div', 'ilegend', '<span><i class="p"></i>Pending</span><span><i class="q"></i>Queued</span><span><i class="s"></i>Succeeded</span>', b.el);
  legend.dir = 'ltr';
  const why = node(b.el, '<b>چرا؟</b><small>صف و پایگاه داده غرق نمی‌شوند، و Cancel هم سریع اثر می‌کند: فقط همین Window در جریان است.</small>', 160, 420, 440, 'fixpanel');
  const color = (t: gsap.core.Timeline, i: number, c: string, at: number) => t.to(bars[i], { backgroundColor: c, duration: 0.35 }, at);
  b.show('آیتم‌ها در جدول نشسته‌اند، همه <b>Pending</b>. همه را یکجا در صف بریزیم؟', [col, legend])
    .show('نه؛ فقط یک <b>Window</b> از آیتم‌ها Queued می‌شود و تعداد پیام‌های صف محدود می‌ماند.', [frame, gauge], (t) => { for (let i = 0; i < 5; i++) color(t, i, '#2856e6', 0.4 + i * 0.1); })
    .s('آیتم‌ها انجام می‌شوند و Window جلو می‌رود؛ آیتم‌های بعدی Queued می‌شوند.', (t) => {
      for (let i = 0; i < 3; i++) color(t, i, '#0e9467', i * 0.3);
      t.to(frame, { top: y0 - 8 + hh * 3, duration: 0.9, ease: 'power2.inOut' }, 1.0); for (let i = 5; i < 8; i++) color(t, i, '#2856e6', 1.6 + (i - 5) * 0.1);
      for (let i = 3; i < 7; i++) color(t, i, '#0e9467', 2.4 + (i - 3) * 0.2); t.to(frame, { top: y0 - 8 + hh * 7, duration: 0.9, ease: 'power2.inOut' }, 3.2); for (let i = 8; i < 12; i++) color(t, i, '#2856e6', 3.8 + (i - 8) * 0.1);
    })
    .show(null, why);
  return b.done();
}

// ---------------------------------------------------------------- at-least-once delivery

export function caseAtLeastOnce(stage: HTMLElement) {
  const b = build(stage, { id: 'alo', chapter: CH.real, label: 'دست‌کم یک‌بار', title: 'صف قول «دست‌کم یک‌بار» می‌دهد', term: 'At-least-once' });
  const mq = node(b.el, `${ICON.mail}<b>RabbitMQ</b>`, 1500, 420, 300, 'tone t-t3');
  const w1 = node(b.el, `${ICON.bolt}<b>Worker · api-1</b>`, 800, 300, 300, 'tone t-t1');
  const w2 = node(b.el, `${ICON.bolt}<b>Worker · api-2</b>`, 800, 600, 300, 'tone t-t2');
  const env = h('div', 'env', `${ICON.mail}<span dir="ltr">item 42</span>`, b.el);
  const env2 = h('div', 'env', `${ICON.mail}<span dir="ltr">item 42</span>`, b.el);
  const ack = tag(b.el, `${ICON.check} ack`, 'ok', { x: 1300, y: 340 });
  const crash = tag(b.el, `${ICON.skull} قبل از ack افتاد`, 'bad', { x: 950, y: 270 });
  const dup = note(b.el, 'حالا آیتم ۴۲ <b>دو بار</b> تحویل شده است. اگر Worker اول کارش را انجام داده بود، کار دو بار انجام می‌شود.', 'bad', 160, 800, 900);
  const P = (e: HTMLElement) => anchor(e, b.el);
  gsap.set([env, env2], { x: P(mq).c.x, y: P(mq).c.y, xPercent: -50, yPercent: -50, opacity: 0 });
  b.hide(ack, crash);
  const rule = ruleCard(b.el, { name: 'پیام تکراری عادی است', tone: 'ink', kicker: 'قاعده', body: 'صف فقط قول می‌دهد هر پیام <b>دست‌کم یک بار</b> برسد؛ نه <b>دقیقاً یک بار</b>. پس طراحی باید پیام تکراری را عادی بداند و پایگاه داده تصمیم بگیرد که کار انجام شده یا نه.' });
  b.show('RabbitMQ پیام را تحویل می‌دهد و منتظر تأیید (<b>ack</b>) می‌ماند. یک صف و دو Worker.', [mq, w1, w2], undefined, { stagger: 0.2 })
    .s('پیام آیتم ۴۲ به Worker اول می‌رسد. اگر کار تمام شود، ack می‌فرستد و صف پیام را پاک می‌کند.', (t) => t.to(env, { opacity: 1, duration: 0.2 }).to(env, { x: P(w1).c.x, y: P(w1).b.y + 34, duration: 1.2, ease: 'power2.inOut' }, 0.2)
      .fromTo(ack, { opacity: 0, x: 1100 }, { opacity: 1, x: 1300, duration: 0.8, immediateRender: false }, 1.6).to(ack, { opacity: 0, duration: 0.3 }, 3.0))
    .s('ولی این بار Worker <b>قبل از ack</b> می‌افتد؛ شاید بعد از انجامِ کار.', (t) => t.fromTo(crash, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, immediateRender: false }).to(w1, { opacity: 0.4, filter: 'grayscale(1)', duration: 0.5 }, 0.2))
    .s('صف ackی نگرفته؛ پس همان پیام را به Worker دیگری می‌دهد.', (t) => t.to(env2, { opacity: 1, duration: 0.2 }).to(env2, { x: P(w2).c.x, y: P(w2).b.y + 34, duration: 1.2, ease: 'power2.inOut' }, 0.2).add(dup.show(), 1.6))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- competing consumers

export function caseConsumers(stage: HTMLElement) {
  const b = build(stage, { id: 'consumers', chapter: CH.real, label: 'چند مصرف‌کننده', title: 'سه سرور، یک صف، یک پایگاه داده' });
  const mq = node(b.el, `${ICON.mail}<b>RabbitMQ</b>`, 1500, 440, 300, 'tone t-t3');
  const ws = ['t1', 't2', 't3'].map((tn, i) => node(b.el, `${ICON.bolt}<b dir="ltr">Worker · api-${i + 1}</b><small class="mem-b">App Memory: «آیتم ۴۲ مال من است»</small>`, 900, 280 + i * 190, 320, `tone t-${tn}`));
  const db = node(b.el, `${ICON.db}<b>SQL Server</b><small>تنها داور</small>`, 260, 440, 320, 'tone t-v');
  const P = (e: HTMLElement) => anchor(e, b.el);
  const ins = ws.map((w) => arrow(b.f, P(mq).l, P(w).r, 't3', { bend: 0 }));
  const outs = ws.map((w) => arrow(b.f, P(w).l, P(db).r, 'v', { bend: 0 }));
  const mems = ws.map((w) => w.querySelector('.mem-b') as HTMLElement);
  b.hide(...mems);
  b.show('هر سه Instance سرویس از یک صف پیام برمی‌دارند: سه Worker، روی سه سرور.', [mq, ...ws], (t) => ins.forEach((a, i) => t.add(a.draw(0.6), 0.6 + i * 0.15)), { stagger: 0.15 })
    .s('با پیام تکراری، ممکن است هر سه فکر کنند آیتم ۴۲ مال آن‌هاست.', (t) => t.fromTo(mems, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.2, immediateRender: false }))
    .show('هیچ‌کدام به حافظهٔ خودش اعتماد نمی‌کند؛ تصمیم را <b>پایگاه داده</b> می‌گیرد. حالا چالش‌های هم‌زمانی این طراحی را یکی‌یکی حل می‌کنیم.', db, (t) => { outs.forEach((a, i) => t.add(a.draw(0.6), 0.3 + i * 0.15)); t.to(mems, { opacity: 0.3, textDecoration: 'line-through', duration: 0.4 }, 1.0); });
  return b.done();
}

