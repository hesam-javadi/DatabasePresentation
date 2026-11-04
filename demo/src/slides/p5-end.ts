import gsap from 'gsap';
import { build } from '../core/build';
import { h } from '../core/dom';
import { arrow, node, anchor, ruleCard, tag, note } from '../kit/parts';
import { ICON } from '../kit/icons';
import { CH, k, cm, hl, str } from './common';

const P = (e: HTMLElement, root: HTMLElement) => anchor(e, root);

// ---------------------------------------------------------------- risk 1 · side effects outside the database

export function riskExternal(stage: HTMLElement) {
  const b = build(stage, { id: 'risk-ext', chapter: CH.end, label: 'اثر بیرونی', title: 'اثری که بیرون از پایگاه داده است', term: 'خطر ۱ · Idempotency' });
  const w = node(b.el, `${ICON.bolt}<b>کارگر</b><small>ارسال پیامک نمره</small>`, 1460, 360, 320, 'tone t-t1');
  const svc = node(b.el, `${ICON.mail}<b>سرویس پیامک</b>`, 800, 360, 320, 'tone t-t3');
  const ph = node(b.el, `${ICON.phone}<b>گوشی دانشجو</b><div class="sms-box"></div>`, 160, 330, 320, 'phonebox');
  const box = ph.querySelector('.sms-box') as HTMLElement;
  const sms = [1, 2, 3].map((i) => h('div', `sms ${i === 2 ? 'dup' : ''}`, i === 3 ? 'همان پیام، فقط یک بار' : 'نمرهٔ پایگاه داده: ۱۸', box));
  const a1 = arrow(b.f, P(w, b.el).l, P(svc, b.el).r, 't1', { bend: 0 });
  const a2 = arrow(b.f, P(svc, b.el).l, P(ph, b.el).r, 't3', { bend: 0 });
  const lost = tag(b.el, `${ICON.clock} جواب نرسید (تایم‌اوت)`, 'bad', { x: 1290, y: 300 });
  const keyed = node(b.el, `<label>راه‌حل: کلید یکتایی که مقصد هم بشناسد</label><pre dir="ltr">POST /sms\n${hl('Idempotency-Key: op17-item42')}\n${cm('same key again → same result, no second SMS')}</pre>`, 800, 640, 980, 'codebox');
  b.hide(lost, ...sms);
  const rule = ruleCard(b.el, { name: 'اثر بیرونی را تکرارپذیر کنید', term: 'Idempotency Key', tone: 'ok', kicker: 'خطر ۱', body: 'هر چیزی بیرون از پایگاه داده (پیامک، پرداخت، فراخوانی سرویس) <b>داخل تراکنش شما نیست</b>. تلاش دوباره یعنی شاید دو بار ارسال. یک کلید یکتا بفرستید که <b>مقصد</b> هم بررسی کند.' });
  b.s('خطرهای سناریوهای مشابه. اولی: کاری که بیرون از پایگاه داده انجام می‌شود.')
    .show('کارگری که پیامک نمره می‌فرستد.', w)
    .show('سرویس پیامک.', svc, (t) => t.add(a1.draw(0.7), 0.4))
    .show('و گوشی دانشجو.', ph, (t) => t.add(a2.draw(0.7), 0.4))
    .s('پیامک ارسال و تحویل می‌شود…', (t) => t.fromTo(sms[0], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }))
    .s('…ولی جوابِ سرویس به کارگر نمی‌رسد.', (t) => t.fromTo(lost, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }))
    .s('کارگر فکر می‌کند ناموفق بوده و دوباره می‌فرستد. <b class="kbad">دو پیامک.</b>', (t) => t.fromTo(sms[1], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }))
    .show('راه‌حل: کلید یکتایی که سرویسِ مقصد هم بشناسد.', keyed, (t) => t.to([sms[0], sms[1], lost], { opacity: 0, duration: 0.3 }, 0.4).fromTo(sms[2], { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, 0.8))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- risk 2 · dual write

export function riskDualWrite(stage: HTMLElement) {
  const b = build(stage, { id: 'risk-dual', chapter: CH.end, label: 'نوشتن دوگانه', title: 'ذخیره کن و پیام بفرست: دو کار، نه یکی', term: 'خطر ۲ · Outbox' });
  const api = node(b.el, `${ICON.bolt}<b>سرویس</b>`, 1500, 420, 280, 'tone t-t1');
  const db = node(b.el, `${ICON.db}<b>پایگاه داده</b>`, 860, 280, 320, 'tone t-v');
  const mq = node(b.el, `${ICON.mail}<b>صف پیام</b>`, 860, 580, 320, 'tone t-t3');
  const a1 = arrow(b.f, P(api, b.el).l, P(db, b.el).r, 't1', { bend: 0.1 });
  const a2 = arrow(b.f, P(api, b.el).l, P(mq, b.el).r, 't1', { bend: -0.1 });
  const ok = tag(b.el, `${ICON.check} ذخیره شد`, 'ok', { x: 1020, y: 250 });
  const crash = tag(b.el, `${ICON.skull} سرویس همین‌جا افتاد`, 'bad', { x: 1330, y: 560 });
  const stuck = note(b.el, 'وضعیت در پایگاه داده عوض شد، ولی پیامی منتشر نشد. آیتم <b>تا ابد</b> منتظر می‌ماند.', 'bad', 160, 800, 900);
  const outbox = node(b.el, `<label>راه‌حل: Outbox</label><pre dir="ltr">${k('BEGIN TRAN')}\n  ${k('UPDATE')} Items …\n  ${hl(`${k('INSERT')} Outbox (Message) …`)}  ${cm('same transaction')}\n${k('COMMIT')}\n${cm('a relay publishes Outbox rows to the queue')}</pre>`, 160, 280, 600, 'codebox');
  b.hide(ok, crash);
  const rule = ruleCard(b.el, { name: 'نوشتن دوگانه', term: 'Dual Write', tone: 'ok', kicker: 'خطر ۲', body: '«ذخیره در پایگاه داده» و «انتشار در صف» دو کارِ جدا هستند؛ ممکن است فقط یکی انجام شود. پیام را در <b>همان تراکنش</b> در جدول Outbox بنویسید و یک رله منتشرش کند؛ یا مثل سامانهٔ ما، جاروکشی که آیتم‌های جامانده را دوباره منتشر کند.' });
  b.s('دومی: کاری که دو جا را تغییر می‌دهد.')
    .show('سرویس باید وضعیت را در پایگاه داده ذخیره کند…', [api, db], (t) => t.add(a1.draw(0.7), 0.5))
    .show('…و یک پیام در صف بگذارد.', mq, (t) => t.add(a2.draw(0.7), 0.4))
    .s('ذخیره انجام می‌شود.', (t) => t.fromTo(ok, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }))
    .s('و قبل از ارسالِ پیام، سرویس می‌افتد.', (t) => t.fromTo(crash, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, immediateRender: false }).add(a2.hide(), 0.3))
    .show(null, stuck.el)
    .show('راه‌حل: پیام را در همان تراکنش، در جدول Outbox بنویسید.', outbox, (t) => t.add(stuck.hide(), 0))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- risks 3 & 4 · quick callbacks

export function riskRecap(stage: HTMLElement) {
  const b = build(stage, { id: 'risk-recap', chapter: CH.end, label: 'مکث و پیام سمی', title: 'دو خطر که قبلاً حلشان کردیم', term: 'خطر ۳ و ۴' });
  const c1 = node(b.el, `<div class="fx-t">${ICON.pause} توقف طولانی</div><div class="fx-d">مکث GC یا قطعی شبکه، کارگر را از مدت اجاره بیشتر نگه می‌دارد. اجاره به‌تنهایی کافی نیست.</div><div class="fx-o">${ICON.check} هر نوشتن با توکن مالکیت شرطی شود (fencing)</div>`, 1000, 300, 820, 'fixpanel');
  const c2 = node(b.el, `<div class="fx-t">${ICON.skull} پیام سمی</div><div class="fx-d">آیتمی که همیشه خطا می‌دهد، بی‌پایان در صف می‌چرخد و ظرفیت را می‌خورد.</div><div class="fx-o">${ICON.check} سقف تلاش، و جدا کردن خطای قطعی از گذرا</div>`, 100, 300, 820, 'fixpanel');
  b.s('دو خطرِ دیگر را در سامانهٔ واقعی دیدیم؛ فقط یادآوری.')
    .show('توقف طولانی: همان کارگر زامبی.', c1)
    .show('پیام سمی: همان سقف تلاش.', c2);
  return b.done();
}

// ---------------------------------------------------------------- risk 5 · lock escalation

export function riskEscalation(stage: HTMLElement) {
  const b = build(stage, { id: 'risk-esc', chapter: CH.end, label: 'تشدید قفل', title: 'وقتی هزاران قفلِ ردیف، یک قفلِ جدول می‌شوند', term: 'خطر ۵ · Lock Escalation' });
  const grid = h('div', 'esc-grid', '', b.el);
  const cells = Array.from({ length: 240 }, () => h('i', '', '', grid));
  const big = h('div', 'esc-big', `${ICON.lock}<b>قفل کل جدول</b>`, grid);
  const counter = node(b.el, '<b class="esc-n">۰</b><small>قفلِ ردیف</small>', 1460, 300, 320, 'gauge');
  const cn = counter.querySelector('.esc-n') as HTMLElement;
  const waiters = node(b.el, `${ICON.hourglass}<b>همه منتظر</b><small>حتی کسانی که با ردیف‌های دیگر کار داشتند</small>`, 1460, 560, 320, 'tone t-bad');
  const batch = node(b.el, `<label>راه‌حل: دسته‌های کوچک، با ایندکسِ مناسب</label><pre dir="ltr">${k('UPDATE TOP')} (1000) BulkOperationItems ${k('SET')} Status = ${str('Cancelled')}\n${k('WHERE')} OperationId = 17 ${k('AND')} Status = ${str('Queued')}\n${cm('repeat until 0 rows')}</pre>`, 160, 820, 1100, 'codebox');
  b.hide(big);
  const rule = ruleCard(b.el, { name: 'تشدید قفل', term: 'Lock Escalation', tone: 'ok', kicker: 'خطر ۵', body: 'وقتی یک دستور حدود <b>۵۰۰۰ قفل</b> روی یک جدول بگیرد، SQL Server تلاش می‌کند آن‌ها را به <b>قفلِ کلِ جدول</b> تبدیل کند و ناگهان همه منتظر می‌مانند. تغییرهای بزرگ را <b>دسته‌دسته</b> انجام دهید، با ایندکسی که دقیقاً همان شرط را پوشش دهد.' });
  const count = { n: 0 };
  b.s('پنجمی: یک UPDATE بزرگ، مثلاً لغوِ همهٔ آیتم‌های یک عملیات در یک دستور.')
    .show('هر خانه، یک ردیف از جدول آیتم‌ها.', grid)
    .show('شمارندهٔ قفل‌ها.', counter)
    .s('دستور ردیف‌به‌ردیف قفل می‌گیرد…', (t) => {
      t.to(cells, { backgroundColor: '#2856e6', duration: 0.05, stagger: 0.012 }, 0);
      t.to(count, { n: 5000, duration: 0.012 * 240, ease: 'none', onUpdate: () => { cn.textContent = Math.round(count.n).toLocaleString('fa-IR'); } }, 0);
    })
    .s('…تا حدود ۵۰۰۰ قفل. SQL Server همه را به <b>یک قفلِ کلِ جدول</b> تبدیل می‌کند.', (t) => t.fromTo(big, { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out', immediateRender: false }))
    .show('حالا هر کس با این جدول کار دارد، منتظر می‌ماند.', waiters)
    .show(null, batch)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- risk 6 · retry storm

export function riskStorm(stage: HTMLElement) {
  const b = build(stage, { id: 'risk-storm', chapter: CH.end, label: 'طوفان تلاش دوباره', title: 'همه با هم برمی‌گردند', term: 'خطر ۶ · Retry Storm' });
  const chart = h('div', 'storm', '<label>درخواست در ثانیه، بعد از برگشتنِ سرویس</label><div class="bars a"></div><div class="bars b"></div><span class="cap">ظرفیت</span>', b.el);
  const A = chart.querySelector('.bars.a') as HTMLElement, B = chart.querySelector('.bars.b') as HTMLElement;
  const hA = [4, 4, 4, 0, 0, 0, 96, 92, 0, 0, 88, 0, 0, 0, 82, 0, 0, 4, 4, 4];
  const hB = [4, 4, 4, 0, 0, 0, 18, 22, 20, 24, 21, 19, 23, 20, 18, 16, 12, 8, 6, 4];
  const ba = hA.map((v) => { const e = h('i', '', '', A); e.style.height = `${v * 4}px`; return e; });
  const bb = hB.map((v) => { const e = h('i', '', '', B); e.style.height = `${v * 4}px`; return e; });
  const out = tag(b.el, 'قطعی', 'ink', { x: 1180, y: 300 });
  const fix = node(b.el, `<label>راه‌حل: تأخیرِ افزایشی، با کمی تصادف</label><pre dir="ltr">delay = min(cap, base * 2^attempt) * random(0.5, 1.5)</pre>`, 160, 820, 1000, 'codebox');
  b.hide(out, ...bb);
  const rule = ruleCard(b.el, { name: 'طوفان تلاش دوباره', term: 'Retry Storm', tone: 'ok', kicker: 'خطر ۶', body: 'بعد از یک قطعی، اگر همه با <b>تأخیرِ ثابت</b> دوباره امتحان کنند، با هم برمی‌گردند و بار چند برابر می‌شود. تأخیرِ <b>افزایشی</b>، با کمی <b>تصادف</b> (jitter)، و یک سقف.' });
  b.s('آخری: بعد از یک قطعی، همهٔ کارگرها دوباره امتحان می‌کنند.')
    .show('نمودار درخواست‌ها.', chart, undefined)
    .s('سرویس چند ثانیه قطع می‌شود.', (t) => t.fromTo(out, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }))
    .s('اگر همه با تأخیرِ ثابت دوباره امتحان کنند، <b>با هم</b> برمی‌گردند: موج‌هایی بالاتر از ظرفیت.', (t) => t.fromTo(ba, { scaleY: 0 }, { scaleY: 1, duration: 0.4, stagger: 0.06, transformOrigin: 'bottom', immediateRender: false }))
    .s('با تأخیرِ افزایشی و تصادفی، همان درخواست‌ها پخش می‌شوند.', (t) => t.to(A, { opacity: 0.25, duration: 0.4 }).fromTo(bb, { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.4, stagger: 0.05, transformOrigin: 'bottom', immediateRender: false }, 0.3))
    .show(null, fix)
    .s(null, (t) => t.add(rule.show()));
  gsap.set(ba, { scaleY: 0, transformOrigin: 'bottom' });
  return b.done();
}

// ---------------------------------------------------------------- closing

const RULES = [
  ['شرط را داخل <code>UPDATE</code> بگذارید، نه در کد', 'بررسی و نوشتن یک کار اتمی شود.'],
  ['قفل بی‌انقضا نگیرید؛ اجاره بگیرید', 'زمان‌دار، با توکن، با ضربان.'],
  ['هر نوشتن را با توکن مالکیت شرطی کنید', 'نتیجهٔ کهنهٔ کارگر زامبی رد می‌شود.'],
  ['فرض کنید هر پیام دو بار می‌رسد', 'تکرار باید بی‌اثر باشد.'],
  ['تراکنش کوتاه، ترتیب ثابت، تلاش دوباره با تأخیر', 'بن‌بست کم می‌شود و طوفان تلاش دوباره نمی‌گیرد.'],
];

export function rules(stage: HTMLElement) {
  const b = build(stage, { id: 'rules', chapter: CH.end, label: 'پنج قانون', title: 'پنج قانون برای بردن به خانه' });
  const list = h('ol', 'rules', RULES.map(([a, d]) => `<li><span class="n">${ICON.check}</span><div><b>${a}</b><small>${d}</small></div></li>`).join(''), b.el);
  const quote = h('div', 'end-quote', 'هم‌زمانی را نمی‌شود حذف کرد؛ فقط می‌شود طوری طراحی کرد که وقتی رخ داد، <b>پایگاه داده حَکَم باشد</b>.', b.el);
  b.s('اگر فقط پنج جمله از امروز یادتان بماند:');
  Array.from(list.children).forEach((li) => b.show(null, li, undefined, { y: 18 }));
  b.show(null, quote);
  return b.done();
}

export function qa(stage: HTMLElement) {
  const b = build(stage, { id: 'qa', chapter: CH.end, label: 'پرسش و پاسخ', title: '', cls: 's-qa' });
  const box = h('div', 'qa-box', `<h1>پرسش و پاسخ</h1><p>ممنون از توجه شما</p><div class="people"><div><small>ارائه</small><b>حسام جوادی</b><b>علی‌محمد قلی‌زاده</b></div><div><small>استاد</small><b>دکتر محمد سلطانیان</b></div><div><small>درس</small><b>پایگاه داده</b></div></div>`, b.el);
  b.hide(box);
  b.s(null, (t) => t.fromTo(box, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, immediateRender: false }));
  return b.done();
}

