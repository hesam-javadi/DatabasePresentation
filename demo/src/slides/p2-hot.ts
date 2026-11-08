import gsap from 'gsap';
import { build } from '../core/build';
import { h } from '../core/dom';
import { ruleCard, node, tag } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';
import { Stage3D, P, platform, person, gate, board, grow, hidden, pinIn, pinOut } from '../kit/three3d';
import { CH, k, hl, str, prob, PROBLEMS } from './common';

// ---------------------------------------------------------------- story (3D): the 8 AM queue

export function rushStory(stage: HTMLElement) {
  const b = build(stage, { id: 'rush-story', chapter: CH.problems, label: 'ساعت ۸ صبح', title: 'همه پشت یک باجه', badge: prob(7, 'ماجرا') });
  const s3 = new Stage3D(b.el, { x: 96, y: 236, w: 1728, h: 780, cam: [0, 9.5, 12.5], look: [0, 0.4, 0.4], fov: 32 });
  const ground = platform(14, 9, 0xf1f4f9);
  const g0 = gate(P.ink); g0.g.position.set(0, 0, -2.2);
  const sign = board(2.6, 0.7); sign.position.set(0, 0, -3.0);
  const extra = [-4.4, -2.2, 2.2, 4.4].map((x) => { const g = gate(P.ok); g.g.position.set(x, 0, -2.2); return g.g; });
  const slots: [number, number][] = [];
  for (let i = 0; i < 7; i++) slots.push([0, -1.3 + i * 0.75]);
  for (let i = 1; i <= 7; i++) slots.push([i * 0.75, 3.95]);
  const cols = [P.crowd, 0x9fb7d9, 0xc9b3d6, 0xb8d1c4, 0xd6c3a8];
  const crowd = slots.map((_, i) => { const p = person(cols[i % cols.length], { hair: i % 2 ? P.hair : P.hairL, long: i % 3 === 0, scale: 0.9 }); p.g.rotation.y = Math.PI; return p; });
  crowd.forEach((p, i) => p.g.position.set(slots[i][0], 0, slots[i][1]));
  s3.add(ground, g0.g, sign, ...extra, ...crowd.map((p) => p.g));
  hidden(ground, g0.g, sign, ...extra, ...crowd.map((p) => p.g));
  const lSign = s3.label('ثبت‌نام: یک شمارندهٔ مشترک', sign, [0, 1.75, 0.2], 'ui big');
  const lCpu = s3.label(`${ICON.bolt} <span dir="ltr">CPU</span> سرور: ۸٪`, g0.g, [4.6, 0.9, 0], 'soft big');
  const lQ = s3.label('صف: ۴۰۰ نفر', crowd[13].g, [0, 2.0, 0], 'bad');
  const lFix = s3.label('چند باجه، چند شمارنده', sign, [0, 1.75, 0.2], 'ok big');
  b.onStep((s) => s3.active(s > 0));

  // one person passes the gate; everyone moves up one slot
  const pass = (t: gsap.core.Timeline, at: number, first: number) => {
    const p = crowd[first];
    t.to(p.g.position, { z: -3.2, duration: 0.8, ease: 'power1.in' }, at).to(p.g.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.3 }, at + 0.6)
      .to(g0.bar.rotation, { y: Math.PI / 2, duration: 0.3, yoyo: true, repeat: 1 }, at);
    for (let i = first + 1; i < crowd.length; i++) {
      const s = slots[i - first - 1];
      t.to(crowd[i].g.position, { x: s[0], z: s[1], duration: 0.7, ease: 'power1.inOut' }, at + 0.4);
    }
  };

  b.s('ساعت ۸ صبح؛ هزاران ثبت‌نام در یک لحظه. فرض کنید هر ثبت‌نام باید از <b>یک باجه</b> رد شود: یک شمارندهٔ مشترک.', (t) => { grow(t, ground, 0, 0.8); grow(t, g0.g, 0.3); grow(t, sign, 0.4); pinIn(t, lSign, 1.0); })
    .s('همه پشت همان یک باجه صف می‌کشند و هر بار فقط <b>یک نفر</b> رد می‌شود.', (t) => { crowd.forEach((p, i) => grow(t, p.g, i * 0.06, 0.5, 0.9)); pass(t, 1.6, 0); pass(t, 3.0, 1); })
    .s('سرور تقریباً بیکار است، ولی صف جلو نمی‌رود. گلوگاه، خودِ آن یک باجه است.', (t) => { pinIn(t, lCpu, 0); pinIn(t, lQ, 0.3); })
    .s('اگر به‌جای یک باجه، <b>چند باجه</b> داشتیم…', (t) => {
      pinOut(t, lSign, 0); pinOut(t, lQ, 0); pinOut(t, lCpu, 0);
      extra.forEach((g, i) => grow(t, g, 0.2 + i * 0.1));
      const lanesX = [0, -4.4, -2.2, 2.2, 4.4];
      for (let i = 2; i < crowd.length; i++) {
        const lane = (i - 2) % 5, rank = Math.floor((i - 2) / 5);
        t.to(crowd[i].g.position, { x: lanesX[lane], z: -1.3 + rank * 0.8, duration: 1.2, ease: 'power1.inOut' }, 0.6);
      }
      pinIn(t, lFix, 1.6);
    });
  return b.done();
}

// ---------------------------------------------------------------- hot row on the table

export function hotRow(stage: HTMLElement) {
  const b = build(stage, { id: 'hot', chapter: CH.problems, label: 'Hot Row', title: 'همه پشت یک ردیف', badge: prob(7, 'روی جدول') });
  const tb = new DbTable(b.el, { name: 'dbo.Stats', x: 220, y: 300, rowH: 88, cols: [{ key: 'name', label: 'Name', w: 360, kind: 'mono', pk: true }, { key: 'v', label: 'Value', w: 200, kind: 'num' }], rows: [{ id: 'reg', name: 'TotalEnrollments', v: '12431' }, { id: 'act', name: 'ActiveUsers', v: '3210' }] });
  const code = node(b.el, `<label>هر ثبت‌نام، این دستور را هم اجرا می‌کند</label><pre dir="ltr">${k('UPDATE')} Stats ${k('SET')} Value = ${hl('Value + 1')}\n${k('WHERE')} Name = ${str('TotalEnrollments')}</pre>`, 220, 560, 560, 'codebox');
  const y = tb.rowMid('reg');
  const q = Array.from({ length: 7 }, (_, i) => {
    const e = h('div', 'qchip', `U${i + 2}`, b.el);
    gsap.set(e, { x: 940 + i * 82, y: y - 31, opacity: 0 });
    return e;
  });
  const gThr = node(b.el, `${ICON.refresh}<b>۲۰۰</b><small>ثبت‌نام در ثانیه · ثابت</small>`, 1400, 560, 200, 'gauge');
  const gCpu = node(b.el, `${ICON.bolt}<b>۸٪</b><small>مشغول بودن CPU</small>`, 1624, 560, 200, 'gauge');
  const rule = ruleCard(b.el, { kicker: 'مشکل ۷', name: 'Hot Row', body: 'وقتی همهٔ Transactionها <b>یک ردیف</b> را Write می‌کنند، X Lock آن ردیف همه را پشت سر هم به صف می‌کند. سخت‌افزار بیشتر کمکی نمی‌کند؛ گلوگاه، همان یک ردیف است.' });
  const row = 'reg';
  let v = 12431;
  const cycle = (t: gsap.core.Timeline, at: number, who: number, holder: string) => {
    t.add(tb.dry(row), at).add(tb.unlock(row, holder), at + 0.2);
    t.to(q[who], { x: 862, opacity: 0, duration: 0.5 }, at + 0.5);
    for (let i = who + 1; i < q.length; i++) t.to(q[i], { x: 940 + (i - who - 1) * 82, duration: 0.5 }, at + 0.6);
    t.add(tb.lock(row, 'mute', `U${who + 2}`, 'X', 'right', 16, `u${who + 2}`), at + 0.6);
    t.add(tb.set(row, 'v', String(++v), { wet: 'mute' }), at + 1.1);
  };

  b.show('همان ماجرا روی جدول <code>Stats</code>: هر ثبت‌نام، علاوه بر کار خودش، شمارندهٔ <code>TotalEnrollments</code> را یکی زیاد می‌کند.', code, (t) => t.add(tb.focus(row, true), 0))
    .s('اولی <b>X Lock</b> را می‌گیرد؛ بقیه پشت همان Lock صف می‌کشند.', (t) => t.add(tb.lock(row, 't1', 'U1', 'X', 'right')).add(tb.set(row, 'v', String(++v), { wet: 't1' }), 0.6).fromTo(q, { opacity: 0, x: '+=60' }, { opacity: 1, x: '-=60', duration: 0.5, stagger: 0.12, immediateRender: false }, 1.0))
    .s('هر Commit فقط <b>یک نفر</b> را راه می‌دهد؛ صف یک خانه جلو می‌رود.', (t) => { cycle(t, 0, 0, 't1'); cycle(t, 1.8, 1, 'u2'); })
    .show('سرور بیکار است ولی ظرفیت صاف مانده: هر ثانیه همان تعداد.', [gThr, gCpu])
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- fixes: spread the counter, or derive it

export function hotFix(stage: HTMLElement) {
  const b = build(stage, { id: 'hot-fix', chapter: CH.problems, label: 'راه‌حل Hot Row', title: 'پخش کنید، یا اصلاً نگه ندارید', badge: prob(7, 'راه‌حل') });
  const tb = new DbTable(b.el, { name: 'dbo.StatShards', x: 260, y: 290, rowH: 74, cols: [{ key: 'name', label: 'Name', w: 380, kind: 'mono', pk: true }, { key: 'sh', label: 'Shard', w: 120, kind: 'num', pk: true }, { key: 'v', label: 'Value', w: 170, kind: 'num' }], rows: [0, 1, 2, 3].map((s) => ({ id: `s${s}`, name: 'TotalEnrollments', sh: String(s), v: String(3106 + s) })) });
  const who: ['t1' | 't2' | 't3' | 'mute', string][] = [['t1', 'U1'], ['t2', 'U2'], ['t3', 'U3'], ['mute', 'U4']];
  const pick = node(b.el, `<label>هر Write، یک ردیف تصادفی</label><pre dir="ltr">${k('UPDATE')} StatShards ${k('SET')} Value = Value + 1\n${k('WHERE')} Name = ${str('TotalEnrollments')}\n  ${k('AND')} Shard = ${hl('@random % 4')}</pre>`, 260, 690, 590, 'codebox');
  const sum = tag(b.el, `<span dir="ltr">SUM(Value) = 12,434</span>`, 'ink mono', { x: 595, y: 252 });
  const derive = node(b.el, `<div class="fx-t">راه دوم: از روی خود داده بشمارید</div><div class="fx-d">اصلاً شمارنده نگه ندارید. تعداد ثبت‌نام‌ها همان تعداد ردیف‌های Enrollments است؛ هر وقت لازم شد بشمارید (با ایندکس مناسب، یا هر چند ثانیه یک بار).</div><pre dir="ltr">${k('SELECT COUNT')}(*) ${k('FROM')} Enrollments\n${k('WHERE')} SectionId = 2</pre>`, 1180, 330, 640, 'fixpanel');
  b.hide(sum);
  const rule = ruleCard(b.el, { name: 'یک ردیفِ پر-Write نسازید', tone: 'ok', kicker: 'راه‌حل مشکل ۷', body: 'یا شمارنده را بین چند ردیف <b>پخش کنید</b> و موقع Read جمع بزنید، یا شمارنده را <b>از روی خود داده</b> حساب کنید. همین ایده را در سامانهٔ واقعی دوباره می‌بینیم.' });

  b.show('راه اول: شمارنده را بین ۴ ردیف پخش کنید؛ هر Write یکی از تکه‌ها را تصادفی انتخاب می‌کند.', pick)
    .s('چهار ثبت‌نام <b>هم‌زمان</b> پیش می‌روند، هر کدام روی ردیف خودش، و با هم Commit می‌کنند. صفی نیست.', (t) => who.forEach(([tone, w], i) => {
      t.add(tb.lock(`s${i}`, tone, w, 'X', 'right', 16, w), i * 0.15); t.add(tb.set(`s${i}`, 'v', String(3107 + i), { wet: tone }), 0.6 + i * 0.15);
      t.add(tb.dry(`s${i}`), 1.8 + i * 0.1); t.add(tb.unlock(`s${i}`, w), 2.0 + i * 0.1);
    }))
    .s('برای Read، تکه‌ها را جمع می‌زنیم.', (t) => t.fromTo(sum, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.5, immediateRender: false }))
    .show('راه دوم: اصلاً شمارنده نگه ندارید.', derive)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- recap quiz (retrieval practice)

export function problemQuiz(stage: HTMLElement) {
  const b = build(stage, { id: 'quiz1', chapter: CH.problems, label: 'مرور', title: 'کدام مشکل؟' });
  const items: string[] = [
    'کلاس ۳۰ نفره، ۳۱ دانشجو',
    'نمره‌ای دیدم که بعد ناپدید شد',
    'کارنامه با خودش نمی‌خواند',
    'شمارش دوم یک نفر بیشتر بود',
    'هر دو مراقب رفتند',
    'هر کدام منتظرِ کتابِ دیگری',
    'همه پشت یک ردیف',
  ];
  const grid = h('div', 'quiz', '', b.el);
  const FA = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  const cards = items.map((s, i) => {
    const c = h('div', 'qz', `<div class="qz-s">«${s}»</div><div class="qz-a"><b>مشکل ${FA(i + 1)}</b><span dir="ltr">${PROBLEMS[i]}</span></div>`, grid);
    return { c, a: c.querySelector('.qz-a') as HTMLElement };
  });
  b.show('قبل از ابزارها، یک مرور سریع. هر نشانه مال کدام مشکل است؟', cards.map((x) => x.c), undefined, { stagger: 0.1 });
  cards.forEach(({ a }) => { b.hide(a); b.s(null, (t) => t.fromTo(a, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false })); });
  return b.done();
}

