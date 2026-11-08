import gsap from 'gsap';
import * as THREE from 'three';
import { build } from '../core/build';
import { h } from '../core/dom';
import { arrow, ruleCard, node } from '../kit/parts';
import { DbTable, Row } from '../kit/table';
import { ICON } from '../kit/icons';
import { Stage3D, P, mat, own, platform, person, grow, hidden, pinIn, pinOut, rug, wall } from '../kit/three3d';
import { CH, card, lanes, k, cur, prob } from './common';

// ---------------------------------------------------------------- the library table

const BOOK = {
  b1: (a = '1'): Row => ({ id: '1', title: 'سیلبرشاتس', avail: a }),
  b2: (a = '1'): Row => ({ id: '2', title: 'الماسری', avail: a }),
  b3: (): Row => ({ id: '3', title: 'راماکریشنان', avail: '1' }),
};
function books(root: HTMLElement) {
  return new DbTable(root, {
    name: 'dbo.Books', x: 690, y: 262, rowH: 84,
    cols: [
      { key: 'id', label: 'Id', w: 100, kind: 'mono', pk: true },
      { key: 'title', label: 'Title', w: 270 },
      { key: 'avail', label: 'Available', w: 170, kind: 'num' },
    ],
    rows: [BOOK.b1(), BOOK.b2(), BOOK.b3()],
  });
}

// ---------------------------------------------------------------- story (3D): two students, two books

function shelf(x: number) {
  const g = new THREE.Group();
  const wood = mat(P.wood);
  const box = (w: number, hh: number, d: number, m: THREE.Material, px: number, py: number, pz: number) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); o.position.set(px, py, pz); g.add(o);
  };
  box(1.9, 2.1, 0.08, wood, 0, 1.05, -0.26);
  for (const sx of [-0.92, 0.92]) box(0.08, 2.1, 0.55, wood, sx, 1.05, 0);
  for (const sy of [0.06, 0.74, 1.42, 2.08]) box(1.9, 0.07, 0.55, wood, 0, sy, 0);
  // filler books on the lower and upper shelves
  const tones = [0xb7c2d3, 0x9aa7bb, 0xc4ccda, 0x8fa1bb];
  for (const sy of [0.1, 1.46]) for (let i = 0; i < 8; i++) box(0.16, 0.5 - (i % 3) * 0.06, 0.38, mat(tones[i % 4]), -0.75 + i * 0.2, sy + 0.25 - (i % 3) * 0.03, 0.02);
  g.position.set(x, 0, -1.4);
  return g;
}

function book(color: number) {
  const g = new THREE.Group();
  const o = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.56, 0.42), own(color));
  g.add(o);
  return g;
}

export function libraryStory(stage: HTMLElement) {
  const b = build(stage, { id: 'lib-story', chapter: CH.problems, label: 'دو کتاب، دو دانشجو', title: 'دو کتاب، دو دانشجو', badge: prob(6, 'ماجرا') });
  const s3 = new Stage3D(b.el, { x: 96, y: 236, w: 1728, h: 780, cam: [0, 7.4, 11.5], look: [0, 1.0, 0], fov: 30 });
  const ground = platform(12, 7, 0xf1f4f9);
  const room = new THREE.Group(); room.add(rug(10, 4, 0xe6ebf3));
  const wl = wall(10, 2.6); wl.position.z = -1.8; room.add(wl);
  const shR = shelf(2.6), shL = shelf(-2.6);
  room.add(shR, shL);
  const bk1 = book(P.t3), bk2 = book(P.ok);
  const B1 = { x: 2.6, y: 1.06, z: -1.2 }, B2 = { x: -2.6, y: 1.06, z: -1.2 };
  bk1.position.set(B1.x, B1.y, B1.z); bk2.position.set(B2.x, B2.y, B2.z);
  const sara = person(P.t1, { long: true }); sara.g.position.set(4.2, 0, 1.0);
  const reza = person(P.t2); reza.g.position.set(-4.2, 0, 1.0);
  s3.add(ground, room, bk1, bk2, sara.g, reza.g);
  hidden(ground, room, bk1, bk2, sara.g, reza.g);
  const l1 = s3.label('کتاب ۱ · سیلبرشاتس', bk1, [0, 0.62, 0.2], 'soft big');
  const l2 = s3.label('کتاب ۲ · الماسری', bk2, [0, 0.62, 0.2], 'soft big');
  const ls = s3.label('سارا', sara.g, [0, -0.2, 0.9], 't1');
  const lr = s3.label('رضا', reza.g, [0, -0.2, 0.9], 't2');
  const ws = s3.label('منتظرِ کتاب ۲', sara.g, [0.3, 2.3, 0], 'ui');
  const wr = s3.label('منتظرِ کتاب ۱', reza.g, [-0.3, 2.3, 0], 'ui');
  ws.style.setProperty('--c', 'var(--t1)'); wr.style.setProperty('--c', 'var(--t2)');
  const loop = h('div', 'loop3', `<svg viewBox="0 0 200 120"><path d="M40 60 A60 40 0 1 1 160 60 A60 40 0 1 1 40 60" /></svg><span>هر کدام منتظر دیگری</span>`, b.el);
  b.hide(loop);
  b.onStep((s) => s3.active(s > 0));
  // a person and the book in their hands move together
  const walk = (t: gsap.core.Timeline, p: THREE.Group, bk: THREE.Group | null, x: number, z: number, at: number, dur = 1.3) => {
    t.to(p.position, { x, z, duration: dur, ease: 'power1.inOut' }, at);
    if (bk) t.to(bk.position, { x, y: 1.0, z: z + 0.42, duration: dur, ease: 'power1.inOut' }, at);
  };
  const pick = (t: gsap.core.Timeline, bk: THREE.Group, x: number, z: number, at: number) => {
    t.to(bk.position, { x, y: 1.0, z: z + 0.42, duration: 0.6, ease: 'power2.out' }, at).to(bk.rotation, { y: Math.PI / 2, duration: 0.6 }, at);
  };

  b.s('کتابخانهٔ دانشکده، شبِ تحویل پروژه. پروژه به <b>دو کتاب</b> نیاز دارد و از هر کدام فقط <b>یک نسخه</b> مانده.', (t) => {
    grow(t, ground, 0, 0.8); grow(t, room, 0.3, 1.0); grow(t, bk1, 0.9, 0.5); grow(t, bk2, 0.9, 0.5); pinIn(t, l1, 1.3); pinIn(t, l2, 1.4);
  })
    .s('سارا و رضا هم‌زمان می‌رسند؛ هر دو، هر دو کتاب را می‌خواهند.', (t) => { grow(t, sara.g, 0); grow(t, reza.g, 0.15); pinIn(t, ls, 0.5); pinIn(t, lr, 0.6); })
    .s('هر کدام کتابِ نزدیک‌تر را برمی‌دارد: سارا <b>کتاب ۱</b> را، رضا <b>کتاب ۲</b> را.', (t) => {
      walk(t, sara.g, null, 2.6, -0.5, 0); walk(t, reza.g, null, -2.6, -0.5, 0);
      pick(t, bk1, 2.6, -0.5, 1.3); pick(t, bk2, -2.6, -0.5, 1.3);
    })
    .s('حالا هر کدام کتابِ دوم را می‌خواهد؛ ولی دستِ دیگری است، و هیچ‌کدام کتابش را پس نمی‌دهد.', (t) => {
      walk(t, sara.g, bk1, 1.25, 0.3, 0, 1.5); walk(t, reza.g, bk2, -1.25, 0.3, 0, 1.5);
      t.to(sara.armL.rotation, { z: -1.3, duration: 0.5 }, 1.4).to(reza.armR.rotation, { z: 1.3, duration: 0.5 }, 1.4);
      pinOut(t, ls, 0); pinOut(t, lr, 0); pinOut(t, l1, 0); pinOut(t, l2, 0); pinIn(t, ws, 1.6); pinIn(t, wr, 1.7);
    })
    .s('هر کدام <b>منتظر دیگری</b>، تا ابد. اسمش <b>Deadlock</b> است.', (t) => t.fromTo(loop, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.6, immediateRender: false }));
  return b.done();
}

// ---------------------------------------------------------------- deadlock on the table

/** A borrow: reserve two books, in the given order. `c` marks the current line. */
const BORROW = (first: number, second: number, c = 0) => [
  c === 1 ? cur(`${k('①')} ${k('UPDATE')} Books … Id=${first}`) : `${k('①')} ${k('UPDATE')} Books … Id=${first}`,
  c === 2 ? cur(`${k('②')} ${k('UPDATE')} Books … Id=${second}`) : `${k('②')} ${k('UPDATE')} Books … Id=${second}`,
  c === 3 ? cur(k('COMMIT')) : k('COMMIT'),
].join('\n');
const STMT = `${k('UPDATE')} Books ${k('SET')} Available = 0\n${k('WHERE')} Id = @id ${k('AND')} Available = 1`;

function cycle(root: SVGSVGElement, x: number, y: number, w: number, hh: number) {
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('class', 'cycle');
  g.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${hh / 2}" class="cyc-path"/>
    <path d="M ${x + w - 14} ${y + hh / 2 - 12} l 14 22 l 14 -22 z" class="cyc-head"/>
    <path d="M ${x - 14} ${y + hh / 2 + 12} l 14 -22 l 14 22 z" class="cyc-head"/>`;
  root.appendChild(g);
  gsap.set(g, { opacity: 0 });
  return g;
}

function setup(b: ReturnType<typeof build>, saraCode: string, rezaCode: string, label: string) {
  const tb = books(b.el);
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'سبد: کتاب ۱، بعد کتاب ۲', exec: saraCode, execLabel: label });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'سبد: کتاب ۲، بعد کتاب ۱', exec: rezaCode, execLabel: label });
  const ln = lanes(b.el, [{ tone: 't1', label: 'T1 · سارا' }, { tone: 't2', label: 'T2 · رضا' }], 6);
  const stmt = node(b.el, `<label>هر رزرو، یک Conditional UPDATE:</label><pre dir="ltr">${STMT}</pre>`, 600, 620, 720, 'codebox');
  b.hide(sara.el, reza.el, ln.el);
  return { tb, sara, reza, ln, stmt };
}

export function deadlock(stage: HTMLElement) {
  const b = build(stage, { id: 'deadlock', chapter: CH.problems, label: 'Deadlock', title: 'هر کدام منتظر دیگری', badge: prob(6, 'روی جدول') });
  const { tb, sara, reza, ln, stmt } = setup(b, BORROW(1, 2), BORROW(2, 1), 'Transaction');
  const r1 = tb.edge('1', 'right', 10), l1 = tb.edge('1', 'left', 10), r2 = tb.edge('2', 'right', 10), l2 = tb.edge('2', 'left', 10);
  const A = {
    s1: arrow(b.f, sara.side('left', 0), r1, 't1', { bend: 0.1 }),
    s2: arrow(b.f, sara.side('left', 50), { x: r2.x + 84, y: r2.y }, 't1', { bend: 0.1 }),
    r1: arrow(b.f, reza.side('right', 50), l2, 't2', { bend: -0.1 }),
    r2: arrow(b.f, reza.side('right', 0), { x: l1.x - 84, y: l1.y }, 't2', { bend: -0.1 }),
  };
  const cyc = cycle(b.f.svg, tb.x - 92, tb.rowMid('1'), tb.width + 184, tb.rowMid('2') - tb.rowMid('1'));
  const mon = h('div', 'monitor', `<span class="radar">${ICON.radar}</span><span dir="ltr">Deadlock Monitor</span><small>هر چند ثانیه دنبال حلقه می‌گردد</small>`, b.el);
  b.hide(mon);
  const rule = ruleCard(b.el, { kicker: 'مشکل ۶', name: 'Deadlock', body: 'دو Transaction هر کدام Lockی را نگه داشته‌اند و Lockِ دستِ دیگری را می‌خواهند. پایگاه داده جلویش را نمی‌گیرد؛ فقط <b>پیدایش می‌کند</b> و یکی را <b>Victim</b> می‌کند (خطای <code>1205</code>).' });

  b.s('همین ماجرا روی جدول <code>Books</code>. رزرو یعنی <code>Available</code> را صفر کنیم.', (t) => t.add(tb.focus('1', true), 0.4).add(tb.focus('2', true), 0.5))
    .show('هر Transaction کتاب‌ها را <b>به ترتیبِ سبدش</b> رزرو می‌کند: سارا اول ۱، رضا اول ۲.', [sara.el, reza.el, ln.el], (t) => t.to(stmt, { opacity: 0, duration: 0.4 }, 0.6))
    .s('هر دو، کتابِ اولِ سبدشان را با <b>X Lock</b> رزرو می‌کنند. هنوز Commit نشده.', (t) => t
      .add(sara.exec(BORROW(1, 2, 1))).add(sara.state('run', 'Running'), 0).add(A.s1.draw(0.8), 0.3).add(tb.lock('1', 't1', 'T1', 'X', 'right'), 1.1).add(tb.set('1', 'avail', '0', { wet: 't1' }), 1.5).add(ln.ev(0, 1, 'X · Id 1'), 1.5).add(A.s1.hide(), 1.9)
      .add(reza.exec(BORROW(2, 1, 1)), 0.5).add(reza.state('run', 'Running'), 0.5).add(A.r1.draw(0.8), 0.8).add(tb.lock('2', 't2', 'T2', 'X', 'left'), 1.6).add(tb.set('2', 'avail', '0', { wet: 't2' }), 2.0).add(ln.ev(1, 1, 'X · Id 2'), 2.0).add(A.r1.hide(), 2.4))
    .s('سارا حالا ردیف ۲ را می‌خواهد؛ دستِ رضاست. <b>Wait</b> می‌کند.', (t) => t.add(sara.exec(BORROW(1, 2, 2))).add(A.s2.draw(0.8), 0.3).add(tb.wait('2', 't1', 'T1', 'right'), 1.1).add(sara.state('wait', 'Waiting'), 1.1).add(ln.ev(0, 2, `${ICON.hourglass} Id 2`, { cls: 'wait', span: 2 }), 1.2))
    .s('رضا هم ردیف ۱ را می‌خواهد؛ دستِ ساراست. یک <b class="kbad">حلقهٔ Wait</b>: هیچ‌کدام تا ابد جلو نمی‌رود.', (t) => t.add(reza.exec(BORROW(2, 1, 2))).add(A.r2.draw(0.8), 0.3).add(tb.wait('1', 't2', 'T2', 'left'), 1.1).add(reza.state('wait', 'Waiting'), 1.1).add(ln.ev(1, 2, `${ICON.hourglass} Id 1`, { cls: 'wait' }), 1.2).to(cyc, { opacity: 1, duration: 0.6 }, 1.8))
    .show('SQL Server هر چند ثانیه دنبال حلقه می‌گردد و یکی را <b class="kbad">Victim</b> می‌کند: رضا با خطای <code>1205</code> Rollback می‌شود.', mon, (t) => t
      .add(reza.state('dead', 'Victim'), 0.6).add(reza.msg('Msg 1205: deadlock victim', 'bad'), 0.7).add(tb.unwait('1', 't2'), 0.9).add(A.r2.hide(), 0.9).add(tb.evaporate('2'), 1.1).add(tb.unlock('2', 't2'), 1.5).to(cyc, { opacity: 0, duration: 0.5 }, 1.5).add(ln.ev(1, 4, '1205 · Rollback', { cls: 'lost' }), 1.2).add(reza.dim(true), 1.8))
    .s('Lock ردیف ۲ آزاد شد؛ سارا آن را می‌گیرد و Commit می‌کند. رضا باید دوباره تلاش کند.', (t) => t
      .add(tb.unwait('2', 't1')).add(A.s2.hide(), 0).add(tb.lock('2', 't1', 'T1', 'X', 'right'), 0.3).add(tb.set('2', 'avail', '0', { wet: 't1' }), 0.7).add(ln.ev(0, 4, 'X · Id 2'), 0.7).add(sara.state('run', 'Running'), 0.3)
      .add(sara.exec(BORROW(1, 2, 3)), 1.3).add(tb.dry('1'), 1.5).add(tb.dry('2'), 1.5).add(tb.unlock('1', 't1'), 1.8).add(tb.unlock('2', 't1'), 1.8).add(ln.ev(0, 5, 'COMMIT'), 1.8).add(sara.state('ok', 'Committed'), 2.0).to(mon, { opacity: 0, duration: 0.4 }, 2.0))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- fix: one lock order for everyone

export function deadlockFix(stage: HTMLElement) {
  const b = build(stage, { id: 'deadlock-fix', chapter: CH.problems, label: 'راه‌حل Deadlock', title: 'همه با یک ترتیب', badge: prob(6, 'راه‌حل') });
  const { tb, sara, reza, ln, stmt } = setup(b, BORROW(1, 2), BORROW(1, 2), 'اول Id کوچک‌تر');
  const r1 = tb.edge('1', 'right', 10), l1 = tb.edge('1', 'left', 10), r2 = tb.edge('2', 'right', 10);
  const a = {
    s1: arrow(b.f, sara.side('left', 0), r1, 't1', { bend: 0.1 }),
    s2: arrow(b.f, sara.side('left', 50), r2, 't1', { bend: 0.1 }),
    r1: arrow(b.f, reza.side('right', 0), { x: l1.x - 84, y: l1.y }, 't2', { bend: -0.1 }),
  };
  const rule = ruleCard(b.el, { name: 'ترتیب ثابت، حلقه را غیرممکن می‌کند', tone: 'ok', kicker: 'راه‌حل مشکل ۶', body: 'اگر همه Lockها را <b>به یک ترتیب</b> بگیرند (مثلاً همیشه از Id کوچک‌تر)، حلقه شکل نمی‌گیرد؛ فقط <b>صف</b> داریم. Transaction را کوتاه نگه دارید و روی خطای <code>1205</code> با کمی تأخیر Retry کنید.' });
  gsap.set(stmt, { opacity: 0 });

  b.s('راه‌حل: همه Lockها را <b>به یک ترتیب</b> بگیرند؛ یعنی برنامه سبد را قبل از رزرو بر اساس <code>Id</code> مرتب کند.', (t) => t.add(tb.focus('1', true), 0.4).add(tb.focus('2', true), 0.5))
    .show('حالا هر دو اول ردیف ۱ را می‌گیرند، بعد ردیف ۲؛ هرچند سبد رضا برعکس بود.', [sara.el, reza.el, ln.el])
    .s('سارا ردیف ۱ را می‌گیرد. رضا هم ردیف ۱ را می‌خواهد و Wait می‌کند؛ ولی <b>هیچ Lockی در دست ندارد</b>.', (t) => t
      .add(sara.exec(BORROW(1, 2, 1))).add(sara.state('run', 'Running'), 0).add(a.s1.draw(0.8), 0.3).add(tb.lock('1', 't1', 'T1', 'X', 'right'), 1.1).add(tb.set('1', 'avail', '0', { wet: 't1' }), 1.5).add(ln.ev(0, 1, 'X · Id 1'), 1.5).add(a.s1.hide(), 1.9)
      .add(reza.exec(BORROW(1, 2, 1)), 1.6).add(a.r1.draw(0.8), 1.9).add(tb.wait('1', 't2', 'T2', 'left'), 2.7).add(reza.state('wait', 'Waiting'), 2.7).add(ln.ev(1, 2, `${ICON.hourglass} Id 1`, { cls: 'wait', span: 2 }), 2.8))
    .s('پس سارا ردیف ۲ را آزادانه می‌گیرد و Commit می‌کند.', (t) => t
      .add(sara.exec(BORROW(1, 2, 2))).add(a.s2.draw(0.8), 0.3).add(tb.lock('2', 't1', 'T1', 'X', 'right'), 1.1).add(tb.set('2', 'avail', '0', { wet: 't1' }), 1.5).add(ln.ev(0, 2, 'X · Id 2'), 1.5).add(a.s2.hide(), 1.9)
      .add(sara.exec(BORROW(1, 2, 3)), 2.1).add(tb.dry('1'), 2.3).add(tb.dry('2'), 2.3).add(tb.unlock('1', 't1'), 2.6).add(tb.unlock('2', 't1'), 2.6).add(ln.ev(0, 3, 'COMMIT'), 2.6).add(sara.state('ok', 'Committed'), 2.8))
    .s('نوبت رضاست؛ ولی کتاب‌ها امانت رفته‌اند: Conditional UPDATE او <b>۰ ردیف</b> تغییر می‌دهد. <b>صف بود، حلقه نبود.</b>', (t) => t
      .add(a.r1.hide()).add(tb.unwait('1', 't2'), 0).add(tb.flash('1', 't2', 0.4), 0.3).add(ln.ev(1, 4, '0 rows'), 0.6).add(reza.state('ok', 'Done'), 0.8).add(reza.msg('0 rows → «کتاب امانت رفته»', 'ok'), 0.9))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}
