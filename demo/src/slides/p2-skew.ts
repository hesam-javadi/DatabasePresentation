import * as THREE from 'three';
import { build } from '../core/build';
import { h, swapper } from '../core/dom';
import { arrow, ruleCard, node } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';
import { Stage3D, P, platform, person, desk, chair, board, door, grow, hidden, pinIn, pinOut, rug } from '../kit/three3d';
import { CH, card, k, hl, prob } from './common';

const PR_COLS = [
  { key: 'id', label: 'Id', w: 100, kind: 'mono' as const, pk: true },
  { key: 'name', label: 'Proctor', w: 240 },
  { key: 'duty', label: 'OnDuty', w: 160, kind: 'num' as const },
];
const proctors = (root: HTMLElement, y = 262, x = 710) => new DbTable(root, { name: 'dbo.Proctors', x, y, rowH: 88, cols: PR_COLS, rows: [{ id: '1', name: 'دکتر رحیمی', duty: '1' }, { id: '2', name: 'دکتر کریمی', duty: '1' }] });

// ---------------------------------------------------------------- story (3D): two exam proctors

export function proctorStory(stage: HTMLElement) {
  const b = build(stage, { id: 'skew-story', chapter: CH.problems, label: 'دو مراقب امتحان', title: 'دو مراقب امتحان', badge: prob(5, 'ماجرا') });
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
  b.onStep((s) => s3.active(s > 0));

  b.s('امتحان پایان‌ترم. آموزش یک قانون دارد: در سالن همیشه دست‌کم یک مراقب باشد.', (t) => { grow(t, ground, 0, 0.8); grow(t, hall, 0.3, 1.0); pinIn(t, sign, 1.1); })
    .s('دکتر رحیمی و دکتر کریمی، دو مراقب این جلسه‌اند.', (t) => { grow(t, pA.g, 0); pinIn(t, lA, 0.5); grow(t, pB.g, 0.3); pinIn(t, lB, 0.8); })
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
    });
  return b.done();
}

// ---------------------------------------------------------------- write skew on the table

const CODE = (id: number) => `n = ${k('SELECT COUNT')}(*)\n    ${k('FROM')} Proctors\n    ${k('WHERE')} OnDuty = 1\n${k('if')} n &gt; 1:\n  ${k('UPDATE')} Proctors\n  ${k('SET')} OnDuty = 0 ${k('WHERE')} Id = ${id}`;

export function writeSkew(stage: HTMLElement) {
  const b = build(stage, { id: 'skew', chapter: CH.problems, label: 'Write Skew', title: 'هر دو درست، با هم غلط', badge: prob(5, 'روی جدول') });
  const tb = proctors(b.el);
  const A = card.right(b.el, 't1', 'T1', { name: 'دکتر رحیمی', sub: 'درخواست خروج', exec: CODE(1), mem: [{ key: 'n' }] });
  const B = card.left(b.el, 't2', 'T2', { name: 'دکتر کریمی', sub: 'درخواست خروج', exec: CODE(2), mem: [{ key: 'n' }] });
  const meter = h('div', 'meter', '<label>مراقب‌های حاضر</label><div class="mv-big"></div><small>قانون: دست‌کم ۱</small>', b.el);
  const mv = swapper(meter.querySelector('.mv-big') as HTMLElement, '2');
  const a1 = arrow(b.f, A.side('left', 20), tb.edge('1', 'right', 10), 't1', { bend: 0.1 });
  const b1 = arrow(b.f, B.side('right', 20), tb.edge('2', 'left', 10), 't2', { bend: -0.1 });
  const rule = ruleCard(b.el, { kicker: 'مشکل ۵', name: 'Write Skew', body: 'دو Transaction یک <b>مجموعه</b> را Read می‌کنند و هر کدام بر اساس آن ردیف <b>متفاوتی</b> را Write می‌کند. ردیف مشترکی نیست، پس هیچ Lockی درگیر نمی‌شود؛ ولی قانونی که به <b>کل مجموعه</b> مربوط است می‌شکند.' });
  const count = (c: typeof A, tone: 't1' | 't2', o = 0) => (t: gsap.core.Timeline) => t.add(tb.flash('1', tone, 0.4), o).add(tb.flash('2', tone, 0.4), o + 0.35).add(c.mem('n', '2'), o + 1.0);

  b.s('همان قانون روی جدول <code>Proctors</code>: هر ردیف یک مراقب، <code>OnDuty = 1</code> یعنی در سالن است.', (t) => t)
    .show('شاخص وسط، قانون را نشان می‌دهد. هر دو Transaction یک کد دارند: بشمار؛ اگر بیش از یک نفر حاضرند، ردیف خودت را صفر کن.', [meter, A.el, B.el])
    .s('هر دو Read می‌کنند و می‌شمارند: ۲ نفر حاضرند. هر دو <b>درست</b> دیده‌اند.', (t) => { t.add(A.state('run', 'Running')); count(A, 't1')(t); t.add(B.state('run', 'Running'), 1.4); count(B, 't2', 1.4)(t); })
    .s('رحیمی ردیف <b>خودش</b> را Write می‌کند: <b class="k1">X Lock</b> فقط روی ردیف ۱.', (t) => t.add(a1.draw(0.8)).add(tb.lock('1', 't1', 'T1', 'X', 'right'), 0.8).add(tb.set('1', 'duty', '0', { wet: 't1' }), 1.4).add(a1.hide(), 1.8))
    .s('کریمی هم ردیف <b>خودش</b> را. دو X Lock روی <b>دو ردیف متفاوت</b>: هیچ تداخلی نیست.', (t) => t.add(b1.draw(0.8)).add(tb.lock('2', 't2', 'T2', 'X', 'left'), 0.8).add(tb.set('2', 'duty', '0', { wet: 't2' }), 1.4).add(b1.hide(), 1.8))
    .s('هر دو Commit می‌کنند. هیچ‌کس Wait نکرد و هیچ خطایی نیامد. نتیجه: <b class="kbad">صفر</b> مراقب.', (t) => t.add(tb.dry('1')).add(tb.dry('2'), 0.1).add(tb.unlock('1', 't1'), 0.4).add(tb.unlock('2', 't2'), 0.4).add(A.state('ok', 'Committed'), 0.6).add(B.state('ok', 'Committed'), 0.6).add(mv.to('<span class="kbad">0</span>'), 1.0).to(meter, { borderColor: '#e0313b', duration: 0.4 }, 1.2))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- three fixes

export function skewFixes(stage: HTMLElement) {
  const b = build(stage, { id: 'skew-fix', chapter: CH.problems, label: 'راه‌حل Write Skew', title: 'دو راه برای Write Skew', badge: prob(5, 'راه‌حل') });
  const W = 820, Y = 290;
  const panels = [
    { t: 'Lock کردنِ آنچه Read کردید', d: 'همان ردیف‌هایی را که می‌شمارید، برای Write رزرو کنید. نفر دوم پشت Lock، Wait می‌کند و بعد عدد درست را می‌بیند.', c: `${k('SELECT COUNT')}(*) ${k('FROM')} Proctors\n  ${hl(k('WITH (UPDLOCK, HOLDLOCK)'))}\n${k('WHERE')} OnDuty = 1`, o: 'دقیق؛ فقط همین مجموعه Lock می‌شود' },
    { t: 'قانون داخل Write', d: 'شرط را داخل خود UPDATE بگذارید و <code>@@ROWCOUNT</code> را ببینید؛ ۰ یعنی «اجازه نداری».', c: `${k('UPDATE')} Proctors ${k('SET')} OnDuty = 0\n${k('WHERE')} Id = 2 ${hl(k('AND'))}\n ${hl(`(${k('SELECT COUNT')}(*) … ) &gt; 1`)}`, o: 'همان Conditional UPDATE مشکل ۱' },
  ];
  const els = panels.map((p, i) => {
    const e = node(b.el, `<div class="fx-t">${p.t}</div><div class="fx-d">${p.d}</div><pre dir="ltr">${p.c}</pre><div class="fx-o">${ICON.check} ${p.o}</div>`, 1920 - 96 - W - i * (W + 44), Y, W, 'fixpanel');
    return { e, o: e.querySelector('.fx-o') as HTMLElement };
  });
  const rule = ruleCard(b.el, { name: 'قانونِ مجموعه، Lockِ مجموعه می‌خواهد', tone: 'ok', kicker: 'راه‌حل مشکل ۵', body: 'وقتی تصمیم شما به <b>چند ردیف</b> بستگی دارد، یا همان مجموعه را Lock کنید، یا شرط را داخل خود دستور ببرید.' });
  els.forEach(({ e }, i) => b.show(['دو راه برای این‌که قانونِ «دست‌کم یک مراقب» نشکند. اول: ردیف‌هایی را که Read کردید، Lock کنید.', 'دوم: قانون را به خود دستور بسپارید.'][i], e));
  b.s(null, (t) => t.add(rule.show()));
  return b.done();
}

