import * as THREE from 'three';
import { build } from '../core/build';
import { h, swapper } from '../core/dom';
import { arrow, note, ruleCard, node } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';
import { Stage3D, P, platform, person, desk, chair, board, door, grow, hidden, pinIn, pinOut, rug } from '../kit/three3d';
import { CH, card, k, hl } from './common';

const PR_COLS = [
  { key: 'id', label: 'Id', w: 100, kind: 'mono' as const, pk: true },
  { key: 'name', label: 'Proctor', w: 240 },
  { key: 'duty', label: 'OnDuty', w: 160, kind: 'num' as const },
];
const proctors = (root: HTMLElement, y = 262, x = 710) => new DbTable(root, { name: 'dbo.Proctors', x, y, rowH: 88, cols: PR_COLS, rows: [{ id: '1', name: 'دکتر رحیمی', duty: '1' }, { id: '2', name: 'دکتر کریمی', duty: '1' }] });

// ---------------------------------------------------------------- story (3D): two exam proctors

export function proctorStory(stage: HTMLElement) {
  const b = build(stage, { id: 'skew-story', chapter: CH.problems, label: 'دو مراقب امتحان', title: 'دو مراقب امتحان' });
  const s3 = new Stage3D(b.el, { x: 96, y: 236, w: 1728, h: 780, cam: [0, 9.6, 13.4], look: [0, 0.5, -0.6], fov: 31 });
  const ground = platform(14, 9, 0xf1f4f9);
  const hall = new THREE.Group(); hall.add(rug(10, 7, 0xe6ebf3));
  const brd = board(3.6, 1.1); brd.position.set(0, 0, -3.2); hall.add(brd);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const g = new THREE.Group(); g.position.set(-3.5 + c * 1.4, 0, -1.9 + r * 1.15);
    const d = desk(0.7, 0.42); d.position.z = -0.1; g.add(d);
    const ch = chair(); ch.position.z = 0.3; ch.rotation.y = Math.PI; g.add(ch);
    const st = person(P.crowd, { seated: true, scale: 0.85, hair: (r + c) % 2 ? P.hair : P.hairL, long: (r * 6 + c) % 3 === 0 }); st.g.position.z = 0.27; st.g.rotation.y = Math.PI; g.add(st.g);
    g.userData.head = st.head; hall.add(g);
  }
  const dl = door(0x9aa7bb), dr = door(0x9aa7bb);
  dl.g.position.set(-4.9, 0, -2.8); dl.g.rotation.y = Math.PI / 2; dr.g.position.set(4.9, 0, -2.8); dr.g.rotation.y = -Math.PI / 2;
  hall.add(dl.g, dr.g);
  const pA = person(P.t1, { hair: 0x8b8f96 }); pA.g.position.set(3.6, 0, 2.6); pA.g.rotation.y = Math.PI;
  const pB = person(P.t2, { long: true }); pB.g.position.set(-3.6, 0, 2.6); pB.g.rotation.y = Math.PI;
  s3.add(ground, hall, pA.g, pB.g);
  hidden(ground, hall, pA.g, pB.g);
  const sign = s3.label('امتحان پایگاه داده<small>قانون: دست‌کم <b>یک مراقب</b> همیشه در سالن</small>', brd, [0, 1.6, 0.2], 'ui big');
  const lA = s3.label('دکتر رحیمی · مراقب', pA.g, [0, -0.2, -0.9], 't1');
  const lB = s3.label('دکتر کریمی · مراقب', pB.g, [0, -0.2, -0.9], 't2');
  const uA = s3.label('«دکتر کریمی هست» ✓', pA.g, [0, 2.4, 0], 'ui');
  const uB = s3.label('«دکتر رحیمی هست» ✓', pB.g, [0, 2.4, 0], 'ui');
  uA.style.setProperty('--c', 'var(--t1)'); uB.style.setProperty('--c', 'var(--t2)');
  const zero = s3.label(`${ICON.cross} مراقب در سالن: ۰`, brd, [0, 2.45, 0.2], 'bad big');
  const tb = proctors(b.el, 812, 700);
  b.hide(tb.el);
  b.onStep((s) => s3.active(s > 0));

  b.s('امتحان پایان‌ترم. آموزش یک قانون دارد: در سالن همیشه دست‌کم یک مراقب باشد.')
    .s('سالن امتحان.', (t) => { grow(t, ground, 0, 0.8); grow(t, hall, 0.3, 1.0); pinIn(t, sign, 1.1); })
    .s('دکتر رحیمی مراقب است.', (t) => { grow(t, pA.g, 0); pinIn(t, lA, 0.5); })
    .s('دکتر کریمی هم مراقب است.', (t) => { grow(t, pB.g, 0); pinIn(t, lB, 0.5); })
    .s('هر دو می‌خواهند چند دقیقه بیرون بروند. هر کدام نگاه می‌کند: «نفر دیگر هست». و درست می‌بیند.', (t) => {
      t.to(pA.g.rotation, { y: -Math.PI / 2 - 0.3, duration: 0.6 }, 0).to(pB.g.rotation, { y: Math.PI / 2 + 0.3, duration: 0.6 }, 0);
      pinIn(t, uA, 0.6); pinIn(t, uB, 0.8);
    })
    .s('پس هر دو بیرون می‌روند، هر کدام از یک در.', (t) => {
      [uA, uB, lA, lB].forEach((e) => pinOut(t, e, 0));
      t.to(pA.g.position, { x: 4.6, z: -2.6, duration: 2.2, ease: 'power1.inOut' }, 0.2).to(pB.g.position, { x: -4.6, z: -2.6, duration: 2.2, ease: 'power1.inOut' }, 0.2)
        .to([pA.g.scale, pB.g.scale], { x: 0.001, y: 0.001, z: 0.001, duration: 0.4 }, 2.4);
    })
    .s('سالن بدون مراقب ماند. قانون شکست، بی‌آن‌که هیچ‌کس کار «اشتباهی» کرده باشد.', (t) => {
      pinOut(t, sign, 0); pinIn(t, zero, 0.1);
      hall.children.filter((c) => c.userData.head).slice(0, 12).forEach((c, i) => t.to((c.userData.head as THREE.Mesh).rotation, { y: (i % 2 ? 1 : -1) * 0.9, duration: 0.5 }, 0.4 + (i % 4) * 0.08));
    })
    .show('پشت آن، جدول <code>Proctors</code> است.', tb.el);
  return b.done();
}

// ---------------------------------------------------------------- write skew on the table

const CODE = (id: number) => `n = ${k('SELECT COUNT')}(*) ${k('FROM')} Proctors\n    ${k('WHERE')} OnDuty = 1\n${k('if')} n &gt; 1:\n  ${k('UPDATE')} Proctors ${k('SET')} OnDuty = 0\n  ${k('WHERE')} Id = ${id}`;

export function writeSkew(stage: HTMLElement) {
  const b = build(stage, { id: 'skew', chapter: CH.problems, label: 'Write Skew', title: 'هر دو درست، با هم غلط', term: 'Write Skew' });
  const tb = proctors(b.el);
  const A = card.right(b.el, 't1', 'T1', { name: 'دکتر رحیمی', sub: 'درخواست خروج', exec: CODE(1), mem: [{ key: 'n' }] });
  const B = card.left(b.el, 't2', 'T2', { name: 'دکتر کریمی', sub: 'درخواست خروج', exec: CODE(2), mem: [{ key: 'n' }] });
  const meter = h('div', 'meter', '<label>مراقب‌های حاضر</label><div class="mv-big"></div><small>قانون: دست‌کم ۱</small>', b.el);
  const mv = swapper(meter.querySelector('.mv-big') as HTMLElement, '2');
  const a1 = arrow(b.f, A.side('left', 20), tb.edge('1', 'right', 10), 't1', { bend: 0.1 });
  const b1 = arrow(b.f, B.side('right', 20), tb.edge('2', 'left', 10), 't2', { bend: -0.1 });
  const snap = note(b.el, 'این اشکال در <b>SNAPSHOT</b> هم رخ می‌دهد؛ چون هیچ نوشتنِ مشترکی در کار نیست.', 'v', 560, 860, 800);
  snap.el.classList.add('one');
  const rule = ruleCard(b.el, { name: 'انحراف نوشتن', term: 'Write Skew', body: 'دو تراکنش یک <b>مجموعه</b> را می‌خوانند و هر کدام بر اساس آن ردیف <b>متفاوتی</b> را می‌نویسد. ردیف مشترکی نیست، پس قفلی هم درگیر نمی‌شود؛ ولی قانونی که به <b>کل مجموعه</b> مربوط است می‌شکند.' });
  const count = (c: typeof A, tone: 't1' | 't2') => (t: gsap.core.Timeline) => t.add(tb.flash('1', tone, 0.4), 0).add(tb.flash('2', tone, 0.4), 0.35).add(c.mem('n', '2'), 1.0);

  b.s('همان قانون، روی جدول <code>Proctors</code>.')
    .show('هر ردیف یک مراقب. <code>OnDuty = 1</code> یعنی در سالن است.', tb.el)
    .show('این شاخص، قانون را نشان می‌دهد: تعداد مراقب‌های حاضر.', meter)
    .show('تراکنش دکتر رحیمی: بشمار؛ اگر بیش از یک نفر حاضرند، ردیف خودت را صفر کن.', A.el)
    .show('تراکنش دکتر کریمی، با همان کد.', B.el)
    .s('رحیمی می‌شمارد: ۲ نفر حاضرند.', (t) => { t.add(A.state('run', 'در حال اجرا')); count(A, 't1')(t); })
    .s('کریمی هم می‌شمارد: ۲ نفر. هر دو <b>درست</b> دیده‌اند.', (t) => { t.add(B.state('run', 'در حال اجرا')); count(B, 't2')(t); })
    .s('رحیمی ردیف <b>خودش</b> را صفر می‌کند. قفل X فقط روی ردیف ۱.', (t) => t.add(a1.draw(0.8)).add(tb.lock('1', 't1', 'T1', 'X', 'right'), 0.8).add(tb.set('1', 'duty', '0', { wet: 't1' }), 1.4).add(a1.hide(), 1.8))
    .s('کریمی هم ردیف <b>خودش</b> را. دو قفل روی <b>دو ردیف متفاوت</b>: هیچ تداخلی نیست.', (t) => t.add(b1.draw(0.8)).add(tb.lock('2', 't2', 'T2', 'X', 'left'), 0.8).add(tb.set('2', 'duty', '0', { wet: 't2' }), 1.4).add(b1.hide(), 1.8))
    .s('هر دو commit می‌کنند. هیچ‌کس منتظر نماند و هیچ خطایی نیامد.', (t) => t.add(tb.dry('1')).add(tb.dry('2'), 0.1).add(tb.unlock('1', 't1'), 0.4).add(tb.unlock('2', 't2'), 0.4).add(A.state('ok', 'رفت'), 0.6).add(B.state('ok', 'رفت'), 0.6))
    .s('نتیجه: <b class="kbad">صفر</b> مراقب. قانون شکست.', (t) => t.add(mv.to('<span class="kbad">0</span>')).to(meter, { borderColor: '#e0313b', duration: 0.4 }, 0.2))
    .s('و نکتهٔ مهم:', (t) => t.add(snap.show()))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- three fixes

export function skewFixes(stage: HTMLElement) {
  const b = build(stage, { id: 'skew-fix', chapter: CH.problems, label: 'سه راه برای Write Skew', title: 'سه راه برای Write Skew' });
  const W = 520, Y = 280;
  const panels = [
    { t: 'SERIALIZABLE', d: 'خواندنِ مجموعه، قفل بازه می‌گذارد؛ نوشتنِ دوم منتظر می‌ماند و بعد بن‌بست یا شکست می‌خورد.', c: `${hl(k('SET TRANSACTION ISOLATION LEVEL'))}\n${hl(k('  SERIALIZABLE'))}\n${k('SELECT COUNT')}(*) … ${k('WHERE')} OnDuty = 1`, o: 'امن، ولی انتظار و بن‌بست بیشتر' },
    { t: 'قفلِ آنچه خواندید', d: 'همان ردیف‌هایی را که می‌شمارید، برای نوشتن رزرو کنید. نفر دوم پشت قفل منتظر می‌ماند و بعد عدد درست را می‌بیند.', c: `${k('SELECT COUNT')}(*) ${k('FROM')} Proctors\n  ${hl(k('WITH (UPDLOCK, HOLDLOCK)'))}\n${k('WHERE')} OnDuty = 1`, o: 'دقیق؛ فقط همین مجموعه قفل می‌شود' },
    { t: 'قانون داخل نوشتن', d: 'شرط را داخل خود UPDATE بگذارید و ردیف‌های تغییرکرده را بخوانید؛ ۰ یعنی «اجازه نداری».', c: `${k('UPDATE')} Proctors ${k('SET')} OnDuty = 0\n${k('WHERE')} Id = 2 ${hl(k('AND'))}\n ${hl(`(${k('SELECT COUNT')}(*) … ) &gt; 1`)}`, o: 'همان الگوی UPDATE شرطی' },
  ];
  const els = panels.map((p, i) => {
    const e = node(b.el, `<div class="fx-t">${p.t}</div><div class="fx-d">${p.d}</div><pre dir="ltr">${p.c}</pre><div class="fx-o">${ICON.check} ${p.o}</div>`, 1920 - 96 - W - i * (W + 44), Y, W, 'fixpanel');
    return { e, o: e.querySelector('.fx-o') as HTMLElement };
  });
  const rule = ruleCard(b.el, { name: 'قانونِ مجموعه، قفلِ مجموعه می‌خواهد', tone: 'ok', kicker: 'جمع‌بندی', body: 'وقتی تصمیم شما به <b>چند ردیف</b> بستگی دارد، یا همان مجموعه را قفل کنید، یا سطح SERIALIZABLE بگیرید، یا شرط را داخل خود دستور ببرید.' });
  b.s('سه راه برای این‌که قانونِ «دست‌کم یک مراقب» نشکند.');
  els.forEach(({ e, o }, i) => {
    b.hide(o);
    b.show(['اول: سخت‌گیرترین سطح جداسازی.', 'دوم: ردیف‌هایی را که خواندید، قفل کنید.', 'سوم: قانون را به خود دستور بسپارید.'][i], e);
    b.s(null, (t) => t.fromTo(o, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }));
  });
  b.s(null, (t) => t.add(rule.show()));
  return b.done();
}

