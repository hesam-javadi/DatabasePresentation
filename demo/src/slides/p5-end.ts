import { build } from '../core/build';
import { h } from '../core/dom';
import { arrow, node, anchor, ruleCard, tag, note } from '../kit/parts';
import { ICON } from '../kit/icons';
import { CH, k, cm, hl, str } from './common';

const P = (e: HTMLElement, root: HTMLElement) => anchor(e, root);

// ---------------------------------------------------------------- risk 1 · side effects outside the database

export function riskExternal(stage: HTMLElement) {
  const b = build(stage, { id: 'risk-ext', chapter: CH.end, label: 'اثر بیرونی', title: 'اثری که بیرون از پایگاه داده است', term: 'خطر ۱ · Idempotency' });
  const w = node(b.el, `${ICON.bolt}<b>Worker</b><small>ارسال پیامک نمره</small>`, 1460, 360, 320, 'tone t-t1');
  const svc = node(b.el, `${ICON.mail}<b>سرویس پیامک</b>`, 800, 360, 320, 'tone t-t3');
  const ph = node(b.el, `${ICON.phone}<b>گوشی دانشجو</b><div class="sms-box"></div>`, 160, 330, 320, 'phonebox');
  const box = ph.querySelector('.sms-box') as HTMLElement;
  const sms = [1, 2, 3].map((i) => h('div', `sms ${i === 2 ? 'dup' : ''}`, i === 3 ? 'همان پیام، فقط یک بار' : 'نمرهٔ پایگاه داده: ۱۸', box));
  const a1 = arrow(b.f, P(w, b.el).l, P(svc, b.el).r, 't1', { bend: 0 });
  const a2 = arrow(b.f, P(svc, b.el).l, P(ph, b.el).r, 't3', { bend: 0 });
  const lost = tag(b.el, `${ICON.clock} جواب نرسید (Timeout)`, 'bad', { x: 1290, y: 300 });
  const keyed = node(b.el, `<label>راه‌حل: کلید یکتایی که مقصد هم بشناسد</label><pre dir="ltr">POST /sms\n${hl('Idempotency-Key: op17-item42')}\n${cm('same key again → same result, no second SMS')}</pre>`, 800, 640, 980, 'codebox');
  b.hide(lost, ...sms);
  const rule = ruleCard(b.el, { name: 'اثر بیرونی را Idempotent کنید', term: 'Idempotency Key', tone: 'ok', kicker: 'خطر ۱', body: 'هر چیزی بیرون از پایگاه داده (پیامک، پرداخت، فراخوانی سرویس) <b>داخل Transaction شما نیست</b>. Retry یعنی شاید دو بار ارسال. یک کلید یکتا بفرستید که <b>مقصد</b> هم بررسی کند.' });
  b.show('خطرهای سناریوهای مشابه. اولی: کاری بیرون از پایگاه داده؛ مثلاً Workerی که پیامک نمره می‌فرستد.', [w, svc, ph], (t) => t.add(a1.draw(0.7), 0.5).add(a2.draw(0.7), 0.9), { stagger: 0.2 })
    .s('پیامک تحویل می‌شود؛ ولی جوابِ سرویس به Worker نمی‌رسد.', (t) => t.fromTo(sms[0], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }).fromTo(lost, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 0.9))
    .s('Worker فکر می‌کند ناموفق بوده و Retry می‌کند. <b class="kbad">دو پیامک.</b>', (t) => t.fromTo(sms[1], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }))
    .show('راه‌حل: کلید یکتایی که سرویسِ مقصد هم بشناسد.', keyed, (t) => t.to([sms[0], sms[1], lost], { opacity: 0, duration: 0.3 }, 0.4).fromTo(sms[2], { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, 0.8))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- risk 2 · dual write

export function riskDualWrite(stage: HTMLElement) {
  const b = build(stage, { id: 'risk-dual', chapter: CH.end, label: 'Dual Write', title: 'ذخیره کن و پیام بفرست: دو کار، نه یکی', term: 'خطر ۲ · Outbox' });
  const api = node(b.el, `${ICON.bolt}<b>سرویس</b>`, 1500, 420, 280, 'tone t-t1');
  const db = node(b.el, `${ICON.db}<b>پایگاه داده</b>`, 860, 280, 320, 'tone t-v');
  const mq = node(b.el, `${ICON.mail}<b>Message Queue</b>`, 860, 580, 320, 'tone t-t3');
  const a1 = arrow(b.f, P(api, b.el).l, P(db, b.el).r, 't1', { bend: 0.1 });
  const a2 = arrow(b.f, P(api, b.el).l, P(mq, b.el).r, 't1', { bend: -0.1 });
  const ok = tag(b.el, `${ICON.check} ذخیره شد`, 'ok', { x: 1020, y: 250 });
  const crash = tag(b.el, `${ICON.skull} سرویس همین‌جا افتاد`, 'bad', { x: 1330, y: 560 });
  const stuck = note(b.el, 'وضعیت در پایگاه داده عوض شد، ولی پیامی منتشر نشد. آیتم <b>تا ابد</b> منتظر می‌ماند.', 'bad', 160, 800, 900);
  const outbox = node(b.el, `<label>راه‌حل: Outbox</label><pre dir="ltr">${k('BEGIN TRAN')}\n  ${k('UPDATE')} Items …\n  ${cm('same transaction:')}\n  ${hl(`${k('INSERT')} Outbox (Message) …`)}\n${k('COMMIT')}\n${cm('a relay publishes Outbox rows')}</pre>`, 160, 280, 600, 'codebox');
  b.hide(ok, crash);
  const rule = ruleCard(b.el, { name: 'Dual Write', tone: 'ok', kicker: 'خطر ۲', body: '«ذخیره در پایگاه داده» و «انتشار در صف» دو کارِ جدا هستند؛ ممکن است فقط یکی انجام شود. پیام را در <b>همان Transaction</b> در جدول Outbox بنویسید و یک Relay منتشرش کند؛ یا مثل سامانهٔ ما، Sweeperی که آیتم‌های جامانده را دوباره منتشر کند.' });
  b.show('دومی: سرویس باید وضعیت را در پایگاه داده ذخیره کند <b>و</b> یک پیام در صف بگذارد؛ دو جا، دو کار.', [api, db, mq], (t) => t.add(a1.draw(0.7), 0.5).add(a2.draw(0.7), 0.8), { stagger: 0.2 })
    .s('ذخیره انجام می‌شود؛ ولی قبل از ارسالِ پیام، سرویس می‌افتد.', (t) => t.fromTo(ok, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }).fromTo(crash, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, immediateRender: false }, 1.0).add(a2.hide(), 1.3))
    .show(null, stuck.el)
    .show('راه‌حل: پیام را در همان Transaction، در جدول Outbox بنویسید.', outbox, (t) => t.add(stuck.hide(), 0))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- risk 5 · lock escalation

export function riskEscalation(stage: HTMLElement) {
  const b = build(stage, { id: 'risk-esc', chapter: CH.end, label: 'Lock Escalation', title: 'وقتی هزاران Row Lock، یک Table Lock می‌شوند', term: 'خطر ۳ · Lock Escalation' });
  const grid = h('div', 'esc-grid', '', b.el);
  const cells = Array.from({ length: 240 }, () => h('i', '', '', grid));
  const big = h('div', 'esc-big', `${ICON.lock}<b>Table Lock</b>`, grid);
  const counter = node(b.el, '<b class="esc-n">۰</b><small>Row Lock</small>', 1460, 300, 320, 'gauge');
  const cn = counter.querySelector('.esc-n') as HTMLElement;
  const waiters = node(b.el, `${ICON.hourglass}<b>همه Wait می‌کنند</b><small>حتی کسانی که با ردیف‌های دیگر کار داشتند</small>`, 1460, 560, 320, 'tone t-bad');
  const batch = node(b.el, `<label>راه‌حل: دسته‌های کوچک، با ایندکسِ مناسب</label><pre dir="ltr">${k('UPDATE TOP')} (1000) BulkOperationItems ${k('SET')} Status = ${str('Cancelled')}\n${k('WHERE')} OperationId = 17 ${k('AND')} Status = ${str('Queued')}\n${cm('repeat until 0 rows')}</pre>`, 160, 820, 1100, 'codebox');
  b.hide(big);
  const rule = ruleCard(b.el, { name: 'Lock Escalation', tone: 'ok', kicker: 'خطر ۳', body: 'وقتی یک دستور حدود <b>۵۰۰۰ Lock</b> روی یک جدول بگیرد، SQL Server تلاش می‌کند آن‌ها را به <b>Table Lock</b> تبدیل کند و ناگهان همه Wait می‌کنند. تغییرهای بزرگ را <b>دسته‌دسته</b> انجام دهید، با ایندکسی که دقیقاً همان شرط را پوشش دهد.' });
  const count = { n: 0 };
  b.show('سومی: یک UPDATE بزرگ؛ مثلاً Cancel همهٔ آیتم‌های یک عملیات در یک دستور. هر خانه، یک ردیف است.', [grid, counter])
    .s('دستور ردیف‌به‌ردیف Lock می‌گیرد…', (t) => {
      t.to(cells, { backgroundColor: '#2856e6', duration: 0.05, stagger: 0.012 }, 0);
      t.to(count, { n: 5000, duration: 0.012 * 240, ease: 'none', onUpdate: () => { cn.textContent = Math.round(count.n).toLocaleString('fa-IR'); } }, 0);
    })
    .show('…تا حدود ۵۰۰۰ Lock. SQL Server همه را به <b>یک Table Lock</b> تبدیل می‌کند و هر کس با این جدول کار دارد Wait می‌کند.', waiters, (t) => t.fromTo(big, { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out', immediateRender: false }, 0))
    .show(null, batch)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- closing

const RULES = [
  ['شرط را داخل <code>UPDATE</code> بگذارید، نه در کد', 'بررسی و Write یک کار اتمی شود.'],
  ['Lock بی‌انقضا نگیرید؛ Lease بگیرید', 'زمان‌دار، با Token، با Heartbeat.'],
  ['هر Write را با Token مالکیت شرطی کنید', 'نتیجهٔ کهنهٔ Worker زامبی رد می‌شود.'],
  ['فرض کنید هر پیام دو بار می‌رسد', 'تکرار باید بی‌اثر (Idempotent) باشد.'],
  ['Transaction کوتاه، ترتیب ثابت، Retry با تأخیر', 'Deadlock کم می‌شود و همه با هم برنمی‌گردند.'],
];

export function rules(stage: HTMLElement) {
  const b = build(stage, { id: 'rules', chapter: CH.end, label: 'پنج قانون', title: 'پنج قانون برای بردن به خانه' });
  const list = h('ol', 'rules', RULES.map(([a, d]) => `<li><span class="n">${ICON.check}</span><div><b>${a}</b><small>${d}</small></div></li>`).join(''), b.el);
  const quote = h('div', 'end-quote', 'هم‌زمانی را نمی‌شود حذف کرد؛ فقط می‌شود طوری طراحی کرد که وقتی رخ داد، <b>پایگاه داده حَکَم باشد</b>.', b.el);
  b.show('اگر فقط پنج جمله از امروز یادتان بماند:', Array.from(list.children), undefined, { y: 18, stagger: 0.3 })
    .show(null, quote);
  return b.done();
}

export function qa(stage: HTMLElement) {
  const b = build(stage, { id: 'qa', chapter: CH.end, label: 'پایان', title: '', cls: 's-qa' });
  const box = h('div', 'qa-box', `<h1>سپاس از توجه شما</h1><div class="people"><div><small>ارائه</small><b>حسام جوادی</b><b>علی‌محمد قلی‌زاده</b></div><div><small>استاد</small><b>دکتر محمد سلطانیان</b></div><div><small>درس</small><b>پایگاه داده</b></div></div>`, b.el);
  b.hide(box);
  b.s(null, (t) => t.fromTo(box, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, immediateRender: false }));
  return b.done();
}

