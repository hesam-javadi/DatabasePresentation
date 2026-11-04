import gsap from 'gsap';
import * as THREE from 'three';
import { build } from '../core/build';
import { h } from '../core/dom';
import { arrow, ruleCard, node } from '../kit/parts';
import { ICON } from '../kit/icons';
import { C } from '../kit/colors';
import { Stage3D, P, platform, person, door, grow, hidden, pinIn, pinOut, rug, wall } from '../kit/three3d';
import { CH, sections, SEC, card, lanes, k, cm, cur } from './common';

// ---------------------------------------------------------------- story (3D): swapping groups

export function swapStory(stage: HTMLElement) {
  const b = build(stage, { id: 'swap-story', chapter: CH.problems, label: 'جابه‌جایی گروه', title: 'جابه‌جایی گروه' });
  const s3 = new Stage3D(b.el, { x: 96, y: 236, w: 1728, h: 780, cam: [0, 7.4, 11.5], look: [0, 1.0, 0], fov: 30 });
  const ground = platform(12, 7, 0xf1f4f9);
  const corridor = new THREE.Group(); corridor.add(rug(10, 4, 0xe6ebf3));
  const wl = wall(10, 2.6); wl.position.z = -1.6; corridor.add(wl);
  const d1 = door(0xb7c2d3), d2 = door(0xb7c2d3);
  d1.g.position.set(2.4, 0, -1.45); d2.g.position.set(-2.4, 0, -1.45);
  corridor.add(d1.g, d2.g);
  const sara = person(P.t1, { long: true }); sara.g.position.set(3.4, 0, 0.6);
  const reza = person(P.t2); reza.g.position.set(-3.4, 0, 0.6);
  s3.add(ground, corridor, sara.g, reza.g);
  hidden(ground, corridor, sara.g, reza.g);
  const l1 = s3.label('کلاس گروه ۱', d1.g, [0, 2.75, 0.2], 'soft big');
  const l2 = s3.label('کلاس گروه ۲', d2.g, [0, 2.75, 0.2], 'soft big');
  const ls = s3.label('سارا: از گروه ۱ به ۲', sara.g, [0, -0.2, 0.9], 't1');
  const lr = s3.label('رضا: از گروه ۲ به ۱', reza.g, [0, -0.2, 0.9], 't2');
  const ws = s3.label('منتظرِ درِ گروه ۲…', sara.g, [0, 2.4, 0], 'ui');
  const wr = s3.label('منتظرِ درِ گروه ۱…', reza.g, [0, 2.4, 0], 'ui');
  ws.style.setProperty('--c', 'var(--t1)'); wr.style.setProperty('--c', 'var(--t2)');
  const loop = h('div', 'loop3', `<svg viewBox="0 0 200 120"><path d="M40 60 A60 40 0 1 1 160 60 A60 40 0 1 1 40 60" /></svg><span>هر کدام منتظر دیگری</span>`, b.el);
  const tb = sections(b.el, [SEC.g1('28'), SEC.g2('27')], { y: 812, rowH: 76 });
  b.hide(loop, tb.el);
  b.onStep((s) => s3.active(s > 0));
  const tint = (c: string) => { const col = new THREE.Color(c); return { r: col.r, g: col.g, b: col.b, duration: 0.5 }; };

  b.s('هفتهٔ حذف و اضافه. سارا می‌خواهد از گروه ۱ به ۲ برود و رضا از گروه ۲ به ۱.')
    .s('دو کلاس، دو گروهِ یک درس.', (t) => { grow(t, ground, 0, 0.8); grow(t, corridor, 0.3); pinIn(t, l1, 1.0); pinIn(t, l2, 1.1); })
    .s('سارا، دانشجوی گروه ۱.', (t) => { grow(t, sara.g, 0); pinIn(t, ls, 0.5); })
    .s('رضا، دانشجوی گروه ۲.', (t) => { grow(t, reza.g, 0); pinIn(t, lr, 0.5); })
    .s('سامانه برای جابه‌جایی، اول گروهِ مبدأ را نگه می‌دارد. سارا درِ گروه ۱ را گرفته است.', (t) => {
      t.to(sara.g.position, { x: 2.4, z: -0.6, duration: 1.2, ease: 'power1.inOut' }, 0);
      t.to((d1.panel.material as THREE.MeshLambertMaterial).color, tint(C.t1), 1.0);
    })
    .s('هم‌زمان رضا درِ گروه ۲ را گرفته است.', (t) => {
      t.to(reza.g.position, { x: -2.4, z: -0.6, duration: 1.2, ease: 'power1.inOut' }, 0);
      t.to((d2.panel.material as THREE.MeshLambertMaterial).color, tint(C.t2), 1.0);
    })
    .s('حالا هر کدام درِ دیگری را می‌خواهد؛ ولی در دستِ آن یکی است.', (t) => {
      t.to(sara.g.position, { x: 0.55, z: 0.1, duration: 1.4, ease: 'power1.inOut' }, 0).to(reza.g.position, { x: -0.55, z: 0.1, duration: 1.4, ease: 'power1.inOut' }, 0)
        .to(sara.armL.rotation, { z: -1.3, duration: 0.5 }, 1.2).to(reza.armR.rotation, { z: 1.3, duration: 0.5 }, 1.2);
      pinOut(t, ls, 0); pinOut(t, lr, 0); pinIn(t, ws, 1.5); pinIn(t, wr, 1.6);
    })
    .s('هیچ‌کدام کوتاه نمی‌آید. هر کدام <b>منتظر دیگری</b> است، تا ابد.', (t) => t.fromTo(loop, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.6, immediateRender: false }))
    .show('روی جدول، این یعنی دو ردیف از <code>Sections</code>.', tb.el);
  return b.done();
}

// ---------------------------------------------------------------- deadlock on the table

const MOVE = (from: number, to: number, c = 0) => [
  `${c === 1 ? cur(`${k('①')} ${k('UPDATE')} … Enrolled - 1 ${k('WHERE')} Id=${from}`) : `${k('①')} ${k('UPDATE')} … Enrolled - 1 ${k('WHERE')} Id=${from}`}`,
  `${c === 2 ? cur(`${k('②')} ${k('UPDATE')} … Enrolled + 1 ${k('WHERE')} Id=${to}`) : `${k('②')} ${k('UPDATE')} … Enrolled + 1 ${k('WHERE')} Id=${to}`}`,
  c === 3 ? cur(k('COMMIT')) : k('COMMIT'),
].join('\n');

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

export function deadlock(stage: HTMLElement) {
  const b = build(stage, { id: 'deadlock', chapter: CH.problems, label: 'بن‌بست', title: 'هر کدام منتظر دیگری', term: 'Deadlock' });
  const tb = sections(b.el, [SEC.g1('28'), SEC.g2('27'), SEC.os()]);
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'گروه ۱ ← ۲', exec: MOVE(1, 2), execLabel: 'تراکنش' });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'گروه ۲ ← ۱', exec: MOVE(2, 1), execLabel: 'تراکنش' });
  const ln = lanes(b.el, [{ tone: 't1', label: 'T1 · سارا' }, { tone: 't2', label: 'T2 · رضا' }], 7);
  const r1 = tb.edge('1', 'right', 10), l1 = tb.edge('1', 'left', 10), r2 = tb.edge('2', 'right', 10), l2 = tb.edge('2', 'left', 10);
  const A = { s1: arrow(b.f, sara.side('left', 0), r1, 't1', { bend: 0.1 }), s2: arrow(b.f, sara.side('left', 50), { x: r2.x + 84, y: r2.y }, 't1', { bend: 0.1 }), r1: arrow(b.f, reza.side('right', 50), l2, 't2', { bend: -0.1 }), r2: arrow(b.f, reza.side('right', 0), { x: l1.x - 84, y: l1.y }, 't2', { bend: -0.1 }) };
  const cyc = cycle(b.f.svg, tb.x - 92, tb.rowMid('1'), tb.width + 184, tb.rowMid('2') - tb.rowMid('1'));
  const mon = h('div', 'monitor', `<span class="radar">${ICON.radar}</span><span dir="ltr">Lock Monitor</span><small>هر چند ثانیه دنبال حلقه می‌گردد</small>`, b.el);
  b.hide(mon);
  const rule = ruleCard(b.el, { name: 'بن‌بست', term: 'Deadlock', body: 'دو تراکنش هر کدام قفلی را نگه داشته‌اند و قفلِ دستِ دیگری را می‌خواهند. پایگاه داده نمی‌تواند جلویش را بگیرد؛ فقط <b>پیدایش می‌کند</b> و یکی را <b>قربانی</b> می‌کند (خطای <code>1205</code>).' });

  b.s('همان جابه‌جایی، روی جدول. هر جابه‌جایی <b>دو ردیف</b> را عوض می‌کند.')
    .show('ردیف‌های گروه ۱ و گروه ۲.', tb.el, (t) => t.add(tb.focus('1', true), 0.4).add(tb.focus('2', true), 0.5))
    .show('تراکنش سارا: اول از گروه ۱ کم می‌کند، بعد به گروه ۲ اضافه.', sara.el)
    .show('تراکنش رضا: اول از گروه ۲، بعد گروه ۱. <b>ترتیب برعکس.</b>', reza.el)
    .show('خط زمانی.', ln.el)
    .s('سارا ردیف گروه ۱ را با قفل <b>X</b> می‌گیرد.', (t) => t.add(sara.exec(MOVE(1, 2, 1))).add(sara.state('run', 'در حال اجرا'), 0).add(A.s1.draw(0.8), 0.3).add(tb.lock('1', 't1', 'T1', 'X', 'right'), 1.1).add(tb.set('1', 'enr', '27', { wet: 't1' }), 1.6).add(ln.ev(0, 1, 'X · گروه ۱'), 1.6).add(A.s1.hide(), 2.0))
    .s('هم‌زمان، رضا ردیف گروه ۲ را با قفل <b>X</b> می‌گیرد.', (t) => t.add(reza.exec(MOVE(2, 1, 1))).add(reza.state('run', 'در حال اجرا'), 0).add(A.r1.draw(0.8), 0.3).add(tb.lock('2', 't2', 'T2', 'X', 'left'), 1.1).add(tb.set('2', 'enr', '26', { wet: 't2' }), 1.6).add(ln.ev(1, 2, 'X · گروه ۲'), 1.6).add(A.r1.hide(), 2.0))
    .s('سارا حالا ردیف گروه ۲ را می‌خواهد؛ دستِ رضاست. <b>منتظر می‌ماند.</b>', (t) => t.add(sara.exec(MOVE(1, 2, 2))).add(A.s2.draw(0.8), 0.3).add(tb.wait('2', 't1', 'T1', 'right'), 1.1).add(sara.state('wait', 'منتظر رضا'), 1.1).add(ln.ev(0, 3, `${ICON.hourglass} گروه ۲`, { cls: 'wait', span: 2 }), 1.2))
    .s('رضا ردیف گروه ۱ را می‌خواهد؛ دستِ ساراست. او هم منتظر می‌ماند.', (t) => t.add(reza.exec(MOVE(2, 1, 2))).add(A.r2.draw(0.8), 0.3).add(tb.wait('1', 't2', 'T2', 'left'), 1.1).add(reza.state('wait', 'منتظر سارا'), 1.1).add(ln.ev(1, 4, `${ICON.hourglass} گروه ۱`, { cls: 'wait' }), 1.2))
    .s('یک <b class="kbad">حلقهٔ انتظار</b>: سارا منتظر رضا، رضا منتظر سارا. هیچ‌کدام تا ابد جلو نمی‌رود.', (t) => t.to(cyc, { opacity: 1, duration: 0.6 }))
    .show('SQL Server هر چند ثانیه دنبال چنین حلقه‌هایی می‌گردد.', mon)
    .s('یکی را <b class="kbad">قربانی</b> می‌کند: تراکنش رضا با خطای <code>1205</code> برمی‌گردد.', (t) => t.add(reza.state('dead', 'قربانی')).add(reza.msg('Msg 1205: deadlock victim', 'bad'), 0.1).add(tb.unwait('1', 't2'), 0.3).add(A.r2.hide(), 0.3).add(tb.evaporate('2'), 0.5).add(tb.unlock('2', 't2'), 0.9).to(cyc, { opacity: 0, duration: 0.5 }, 0.9).add(ln.ev(1, 5, '1205 · rollback', { cls: 'lost' }), 0.6).add(reza.dim(true), 1.2))
    .s('قفل گروه ۲ آزاد شد؛ سارا آن را می‌گیرد و ادامه می‌دهد.', (t) => t.add(tb.unwait('2', 't1')).add(A.s2.hide(), 0).add(tb.lock('2', 't1', 'T1', 'X', 'right'), 0.3).add(tb.set('2', 'enr', '28', { wet: 't1' }), 0.8).add(ln.ev(0, 5, 'X · گروه ۲'), 0.8).add(sara.state('run', 'ادامه'), 0.4))
    .s('سارا commit می‌کند. رضا باید دوباره تلاش کند.', (t) => t.add(sara.exec(MOVE(1, 2, 3))).add(tb.dry('1'), 0.3).add(tb.dry('2'), 0.3).add(tb.unlock('1', 't1'), 0.6).add(tb.unlock('2', 't1'), 0.6).add(ln.ev(0, 6, 'COMMIT'), 0.6).add(sara.state('ok', 'انجام شد'), 0.9).to(mon, { opacity: 0, duration: 0.4 }, 0.9))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- fix: one lock order for everyone

const ORDERED = (first: string, second: string, c = 0) => [
  c === 1 ? cur(`${k('①')} ${first}`) : `${k('①')} ${first}`,
  c === 2 ? cur(`${k('②')} ${second}`) : `${k('②')} ${second}`,
  c === 3 ? cur(k('COMMIT')) : k('COMMIT'),
].join('\n');
const S1 = (c = 0) => ORDERED(`${k('UPDATE')} … - 1 ${k('WHERE')} Id=1`, `${k('UPDATE')} … + 1 ${k('WHERE')} Id=2`, c);
const R1 = (c = 0) => ORDERED(`${k('UPDATE')} … + 1 ${k('WHERE')} Id=1`, `${k('UPDATE')} … - 1 ${k('WHERE')} Id=2`, c);

export function deadlockFix(stage: HTMLElement) {
  const b = build(stage, { id: 'deadlock-fix', chapter: CH.problems, label: 'ترتیب ثابت', title: 'همه با یک ترتیب', term: 'Lock Ordering' });
  const tb = sections(b.el, [SEC.g1('28'), SEC.g2('27'), SEC.os()]);
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'گروه ۱ ← ۲', exec: S1(), execLabel: 'اول Id کوچک‌تر' });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'گروه ۲ ← ۱', exec: R1(), execLabel: 'اول Id کوچک‌تر' });
  const ln = lanes(b.el, [{ tone: 't1', label: 'T1 · سارا' }, { tone: 't2', label: 'T2 · رضا' }], 7);
  const r1 = tb.edge('1', 'right', 10), l1 = tb.edge('1', 'left', 10), r2 = tb.edge('2', 'right', 10), l2 = tb.edge('2', 'left', 10);
  const a = { s1: arrow(b.f, sara.side('left', 0), r1, 't1', { bend: 0.1 }), s2: arrow(b.f, sara.side('left', 50), r2, 't1', { bend: 0.1 }), r1: arrow(b.f, reza.side('right', 0), { x: l1.x - 84, y: l1.y }, 't2', { bend: -0.1 }), r2: arrow(b.f, reza.side('right', 50), l2, 't2', { bend: -0.1 }) };
  const retry = node(b.el, `<label>و اگر باز هم 1205 آمد:</label><pre dir="ltr">${k('for')} attempt ${k('in')} 1..3:\n  ${k('try')}: run_transaction(); ${k('break')}\n  ${k('except')} SqlError ${k('as')} e ${k('if')} e.number == 1205:\n    sleep(backoff(attempt))  ${cm('then retry')}</pre>`, 560, 640, 800, 'codebox');
  const rule = ruleCard(b.el, { name: 'ترتیب ثابت، حلقه را غیرممکن می‌کند', tone: 'ok', kicker: 'راه‌حل', body: 'اگر همه قفل‌ها را <b>به یک ترتیب</b> بگیرند (مثلاً همیشه از Id کوچک‌تر)، حلقه شکل نمی‌گیرد؛ فقط <b>صف</b> داریم. تراکنش را کوتاه نگه دارید و روی خطای <code>1205</code> با کمی تأخیر دوباره تلاش کنید.' });

  b.s('راه‌حل: همه قفل‌ها را <b>به یک ترتیب</b> بگیرند؛ مثلاً همیشه اول ردیفِ با Id کوچک‌تر.')
    .show('همان دو ردیف.', tb.el, (t) => t.add(tb.focus('1', true), 0.4).add(tb.focus('2', true), 0.5))
    .show('سارا: اول گروه ۱، بعد گروه ۲. مثل قبل.', sara.el)
    .show('رضا هم <b>اول گروه ۱</b> را می‌گیرد، بعد گروه ۲؛ هرچند جهت جابه‌جایی‌اش برعکس است.', reza.el)
    .show('خط زمانی.', ln.el)
    .s('سارا ردیف گروه ۱ را قفل می‌کند.', (t) => t.add(sara.exec(S1(1))).add(sara.state('run', 'در حال اجرا'), 0).add(a.s1.draw(0.8), 0.3).add(tb.lock('1', 't1', 'T1', 'X', 'right'), 1.1).add(tb.set('1', 'enr', '27', { wet: 't1' }), 1.6).add(ln.ev(0, 1, 'X · گروه ۱'), 1.6).add(a.s1.hide(), 2.0))
    .s('رضا هم گروه ۱ را می‌خواهد و منتظر می‌ماند؛ ولی <b>هنوز هیچ قفلی ندارد</b>.', (t) => t.add(reza.exec(R1(1))).add(a.r1.draw(0.8), 0.3).add(tb.wait('1', 't2', 'T2', 'left'), 1.1).add(reza.state('wait', 'در صف'), 1.1).add(ln.ev(1, 2, `${ICON.hourglass} گروه ۱`, { cls: 'wait', span: 3 }), 1.2))
    .s('پس سارا گروه ۲ را آزادانه می‌گیرد.', (t) => t.add(sara.exec(S1(2))).add(a.s2.draw(0.8), 0.3).add(tb.lock('2', 't1', 'T1', 'X', 'right'), 1.1).add(tb.set('2', 'enr', '28', { wet: 't1' }), 1.6).add(ln.ev(0, 2, 'X · گروه ۲'), 1.6).add(a.s2.hide(), 2.0))
    .s('سارا commit می‌کند و هر دو قفل آزاد می‌شوند.', (t) => t.add(sara.exec(S1(3))).add(tb.dry('1'), 0.3).add(tb.dry('2'), 0.3).add(tb.unlock('1', 't1'), 0.6).add(tb.unlock('2', 't1'), 0.6).add(ln.ev(0, 3, 'COMMIT'), 0.6).add(sara.state('ok', 'انجام شد'), 0.9))
    .s('حالا نوبت رضاست: گروه ۱…', (t) => t.add(a.r1.hide()).add(tb.unwait('1', 't2'), 0).add(tb.lock('1', 't2', 'T2', 'X', 'left'), 0.3).add(tb.set('1', 'enr', '28', { wet: 't2' }), 0.8).add(ln.ev(1, 5, 'X · گروه ۱'), 0.8).add(reza.state('run', 'در حال اجرا'), 0.3))
    .s('…بعد گروه ۲، و commit. <b>صف بود، حلقه نبود.</b>', (t) => t.add(reza.exec(R1(2))).add(a.r2.draw(0.8), 0.2).add(tb.lock('2', 't2', 'T2', 'X', 'left'), 1.0).add(tb.set('2', 'enr', '27', { wet: 't2' }), 1.4).add(ln.ev(1, 6, 'X · گروه ۲'), 1.4).add(a.r2.hide(), 1.8).add(tb.dry('1'), 2.2).add(tb.dry('2'), 2.2).add(tb.unlock('1', 't2'), 2.4).add(tb.unlock('2', 't2'), 2.4).add(ln.ev(1, 7, 'COMMIT'), 2.4).add(reza.state('ok', 'انجام شد'), 2.6))
    .show('بن‌بست را نمی‌شود صفر کرد؛ پس برنامه باید برایش آماده باشد.', retry)
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}
