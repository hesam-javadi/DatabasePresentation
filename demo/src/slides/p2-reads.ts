import * as THREE from 'three';
import { build } from '../core/build';
import { arrow, fly, note, ruleCard } from '../kit/parts';
import { DbTable, Row } from '../kit/table';
import { ICON } from '../kit/icons';
import { Stage3D, P, platform, person, desk, laptop, phone, grow, hidden, pinIn, pinOut, rug, dbStack, packet } from '../kit/three3d';
import { CH, card, lanes, k, cm, hl, prob } from './common';

const GR_COLS = [
  { key: 'sid', label: 'StudentId', w: 170, kind: 'mono' as const, pk: true },
  { key: 'name', label: 'Name', w: 170 },
  { key: 'course', label: 'Course', w: 200 },
  { key: 'grade', label: 'Grade', w: 120, kind: 'num' as const },
];
const grades = (root: HTMLElement, rows: Row[]) => new DbTable(root, { name: 'dbo.Grades', x: 630, y: 262, rowH: 84, cols: GR_COLS, rows });
const G = (sid: string, name: string, grade: string) => ({ id: sid, sid, name, course: 'پایگاه داده', grade });

// ---------------------------------------------------------------- story (3D): a grade that never existed

export function gradeStory(stage: HTMLElement) {
  const b = build(stage, { id: 'grade-story', chapter: CH.problems, label: 'نمره‌ای که نبود', title: 'نمره‌ای که هرگز ثبت نشد', badge: prob(2, 'ماجرا') });
  const s3 = new Stage3D(b.el, { x: 96, y: 236, w: 1728, h: 780, cam: [0, 8.6, 12.6], look: [0, 0.6, 0], fov: 30 });
  const ground = platform(15, 7.5, 0xf1f4f9);
  const prof = new THREE.Group(); prof.position.set(4.6, 0, 0.6); prof.add(rug(3.4, 3, 0xe4ebfb));
  const p = person(P.t1, { hair: 0x9aa0a8 }); p.g.position.set(0, 0, 0.55);
  const d = desk(1.2, 0.6); d.position.set(0, 0, -0.2);
  const lap = laptop(); lap.g.position.set(0, 0.77, -0.2); lap.g.rotation.y = Math.PI;
  prof.add(d, lap.g, p.g);
  const db = dbStack(); db.position.set(0, 0, -1.0);
  const stu = new THREE.Group(); stu.position.set(-4.6, 0, 0.6); stu.add(rug(3, 3, 0xf6e4f1));
  const n = person(P.t2); n.g.position.set(0, 0, 0.3);
  const ph = phone(); ph.g.position.set(0.12, 1.12, 0.32); ph.g.rotation.x = -0.5; n.g.add(ph.g); n.armR.rotation.x = -1.0;
  stu.add(n.g);
  const pk = packet(P.t1); pk.position.set(4.6, 1.2, 0.2);
  const pk2 = packet(P.t1); pk2.position.set(0, 1.6, -1.0);
  s3.add(ground, prof, db, stu, pk, pk2);
  hidden(ground, prof, db, stu, pk, pk2);
  const lp = s3.label('استاد · ورود نمره‌ها', p.g, [0, -0.25, 0.9], 't1');
  const ldb = s3.label('پایگاه دادهٔ آموزش', db, [0, 1.75, 0], 'soft');
  const ln = s3.label('نیما · منتظر نمره', n.g, [0, -0.25, 0.9], 't2');
  const uiP1 = s3.label('نیما ← <b>۱۸</b><small>هنوز Commit نشده</small>', p.g, [0, 2.5, 0], 'ui');
  const uiP2 = s3.label(`<span class="kbad">${ICON.cross} ذخیره ناموفق بود</span><small>Rollback</small>`, p.g, [0, 2.5, 0], 'ui');
  const uiN1 = s3.label('پایگاه داده: <b>۱۸</b>', n.g, [0, 2.45, 0], 'ui');
  const uiN2 = s3.label('🎉 قبول شدم!', n.g, [0, 2.45, 0], 'ui');
  const uiN3 = s3.label('پایگاه داده: <b>—</b><small>نمره هنوز ثبت نشده</small>', n.g, [0, 2.45, 0], 'ui');
  [uiP1, uiP2].forEach((e) => e.style.setProperty('--c', 'var(--t1)'));
  [uiN1, uiN2, uiN3].forEach((e) => e.style.setProperty('--c', 'var(--t2)'));
  b.onStep((s) => s3.active(s > 0));

  b.s('پایان ترم. استاد نمره‌ها را در سامانهٔ آموزش وارد می‌کند و نمره‌ها در پایگاه داده ذخیره می‌شوند.', (t) => { grow(t, ground, 0, 0.8); grow(t, prof, 0.3); pinIn(t, lp, 1.0); grow(t, db, 0.6); pinIn(t, ldb, 1.2); })
    .s('نیما دانشجوی همین درس است و منتظر نمره‌اش.', (t) => { grow(t, stu, 0); pinIn(t, ln, 0.6); })
    .s('استاد نمرهٔ نیما را ۱۸ وارد می‌کند؛ ولی هنوز <b>Commit</b> نشده.', (t) => {
      pinIn(t, uiP1, 0); grow(t, pk, 0.3, 0.4);
      t.to(pk.position, { x: 0, y: 1.6, z: -1.0, duration: 1.4, ease: 'power2.inOut' }, 0.6).to(pk.rotation, { y: 3, duration: 1.4 }, 0.6);
      t.to((pk.material as THREE.MeshLambertMaterial), { opacity: 0.55, duration: 0.6, yoyo: true, repeat: 3 }, 2.0);
    })
    .s('نیما همان لحظه پرتال نمره را باز می‌کند و ۱۸ می‌بیند.', (t) => {
      grow(t, pk2, 0, 0.3);
      t.to(pk2.position, { x: -4.6, y: 1.2, z: 0.9, duration: 1.4, ease: 'power2.inOut' }, 0.2).to(pk2.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.3 }, 1.6);
      pinIn(t, uiN1, 1.7);
    })
    .s('خوشحال است و به همه خبر می‌دهد.', (t) => {
      pinOut(t, uiN1, 0); pinIn(t, uiN2, 0.1);
      t.to(n.g.position, { y: 0.6, duration: 0.25, yoyo: true, repeat: 3, ease: 'power2.out' }, 0.2);
    })
    .s('ولی ذخیرهٔ استاد با خطا <b>Rollback</b> می‌شود. ۱۸ هیچ‌وقت ثبت نشد.', (t) => {
      pinOut(t, uiP1, 0); pinIn(t, uiP2, 0.1);
      t.to(pk.scale, { x: 1.8, y: 1.8, z: 1.8, duration: 0.4 }, 0.5).to(pk.material as THREE.MeshLambertMaterial, { opacity: 0, duration: 0.8 }, 0.6).to(pk.position, { y: 2.6, duration: 0.9 }, 0.5);
    })
    .s('فردا نیما دوباره نگاه می‌کند: نمره‌ای در کار نیست. او با عددی خوشحال شد که <b>هرگز وجود نداشت</b>.', (t) => {
      pinOut(t, uiN2, 0); pinIn(t, uiN3, 0.1);
      t.to(n.body.rotation, { x: 0.25, duration: 0.6 }, 0.3).to(n.head.position, { z: 0.12, duration: 0.6 }, 0.3);
    });

  return b.done();
}

// ---------------------------------------------------------------- dirty read

const NOLOCK = `${k('SELECT')} Grade ${k('FROM')} Grades\n  ${hl(k('WITH (NOLOCK)'))}\n${k('WHERE')} StudentId = 401234`;

export function dirtyRead(stage: HTMLElement) {
  const b = build(stage, { id: 'dirty', chapter: CH.problems, label: 'Dirty Read', title: 'Read کردنِ دادهٔ uncommitted', badge: prob(2, 'روی جدول') });
  const tb = grades(b.el, [G('401230', 'سارا', '17'), G('401234', 'نیما', 'NULL'), G('401241', 'مینا', '15')]);
  const prof = card.right(b.el, 't1', 'T1', { name: 'استاد', sub: 'ورود نمره', exec: `${k('BEGIN TRAN')}\n${k('UPDATE')} Grades\n${k('SET')} Grade = 18\n${k('WHERE')} StudentId = 401234` });
  const nima = card.left(b.el, 't2', 'T2', { name: 'نیما', sub: 'پرتال نمره', exec: NOLOCK, mem: [{ key: 'grade' }] });
  const ln = lanes(b.el, [{ tone: 't1', label: 'T1 · استاد' }, { tone: 't2', label: 'T2 · نیما' }], 6);
  const R = tb.edge('401234', 'right', 10);
  const a1 = arrow(b.f, prof.side('left', 40), R, 't1', { bend: 0.1 });
  const a2 = arrow(b.f, nima.side('right', 40), { x: R.x + 6, y: R.y + 6 }, 't2', { bend: -0.08 });
  const fix = note(b.el, 'راه‌حل این مشکل یک <b>Isolation Level</b> مناسب است، که در <b>بخش ۳</b> می‌بینیم.', 'ok', 560, 636, 800);
  fix.el.classList.add('one');
  const rule = ruleCard(b.el, { kicker: 'مشکل ۲', name: 'Dirty Read', body: 'Read کردنِ داده‌ای که <b>هنوز Commit نشده</b>. اگر Writer آن را Rollback کند، Reader با عددی تصمیم گرفته که <b>هرگز وجود نداشت</b>. <code>WITH (NOLOCK)</code> دقیقاً همین را مجاز می‌کند.' });
  const row = '401234';

  b.s('همان ماجرا روی جدول <code>Grades</code>. نمرهٔ نیما هنوز <code>NULL</code> است.', (t) => t.add(tb.focus(row, true)))
    .show('Transaction استاد نمره را وارد می‌کند. پرتال نمره با <code>WITH (NOLOCK)</code> Read می‌کند.', [prof.el, nima.el, ln.el])
    .s('استاد Write می‌کند: <b class="k1">X Lock</b> و نمرهٔ ۱۸، هنوز <b>uncommitted</b>.', (t) => t.add(prof.state('run', 'Running')).add(a1.draw(0.8), 0.3).add(tb.lock(row, 't1', 'T1', 'X', 'right'), 1.1).add(tb.set(row, 'grade', '18', { wet: 't1' }), 1.7).add(ln.ev(0, 1, 'UPDATE = 18'), 1.9).add(a1.hide(), 2.3))
    .s('پرتال نمره با <code>NOLOCK</code> یعنی «Lockها را نادیده بگیر» Read می‌کند و ۱۸ را می‌بیند: یک مقدار <b>uncommitted</b>.', (t) => t.add(nima.state('run', 'Reading')).add(a2.draw(0.9), 0.2).add(tb.flash(row, 't2', 0.6), 1.0).add(fly(b.f, tb.cell(row, 'grade'), nima.memPos('grade'), '18', 't2', { dur: 1.2 }), 1.6).add(nima.mem('grade', '<span class="dirty">18</span>'), 2.9).add(ln.ev(1, 2, 'NOLOCK → 18'), 2.9).add(a2.hide(), 3.0).add(nima.msg('🎉 قبول شدم!', 'ok', false), 3.1))
    .s('ذخیرهٔ استاد خطا می‌دهد: <code>ROLLBACK</code>. مقدار uncommitted پاک می‌شود.', (t) => t.add(prof.exec(`${k('ROLLBACK')}  ${cm('save failed')}`)).add(tb.evaporate(row), 0.3).add(tb.unlock(row, 't1'), 0.9).add(ln.ev(0, 3, 'ROLLBACK', { cls: 'lost' }), 0.5).add(prof.state('bad', 'Rolled back'), 0.8))
    .s('نیما با عددی تصمیم گرفت که <b class="kbad">هرگز وجود نداشت</b>.', (t) => t.add(nima.mem('grade', '<span class="bad strike">18</span>')).add(nima.stale('grade', true), 0.2).add(nima.msg('این نمره هرگز وجود نداشت', 'bad', false), 0.4))
    .s('راه‌حل؟', (t) => t.add(fix.show()))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- non-repeatable read

export function nonRepeatable(stage: HTMLElement) {
  const b = build(stage, { id: 'nonrep', chapter: CH.problems, label: 'Non-Repeatable Read', title: 'کارنامه‌ای که با خودش نمی‌خواند', badge: prob(3, 'روی جدول') });
  const tb = grades(b.el, [G('401230', 'سارا', '14'), G('401234', 'نیما', '16'), G('401241', 'مینا', '15')]);
  const rep = card.left(b.el, 't2', 'T2', { name: 'گزارش کارنامه', sub: 'یک Transaction، دو Read', mem: [{ key: 'list' }, { key: 'gpa' }], memLabel: 'App Memory', exec: `${k('BEGIN TRAN')}\n${k('SELECT')} Grade … ${cm('list')}\n${k('SELECT')} Grade … ${cm('GPA')}\n${k('COMMIT')}` });
  const ed = card.right(b.el, 't1', 'T1', { name: 'کارمند آموزش', sub: 'اصلاح نمره', exec: `${k('UPDATE')} Grades\n${k('SET')} Grade = 17\n${k('WHERE')} StudentId = 401230` });
  const ln = lanes(b.el, [{ tone: 't1', label: 'T1 · اصلاح' }, { tone: 't2', label: 'T2 · گزارش' }], 6);
  const row = '401230';
  const R = tb.edge(row, 'right', 10), L = tb.edge(row, 'left', 10);
  const g1 = arrow(b.f, rep.side('right', 20), L, 't2', { bend: -0.1 });
  const g2 = arrow(b.f, rep.side('right', 70), L, 't2', { bend: -0.1 });
  const e1 = arrow(b.f, ed.side('left', 30), R, 't1', { bend: 0.1 });
  const sheet = note(b.el, 'کارنامهٔ سارا: نمرهٔ پایگاه داده <b>۱۴</b> · معدل با <b>۱۷</b> حساب شده', 'bad', 560, 744, 800);
  sheet.el.classList.add('one');
  const rule = ruleCard(b.el, { kicker: 'مشکل ۳', name: 'Non-Repeatable Read', body: 'یک Transaction <b>یک ردیف را دو بار</b> Read می‌کند و <b>دو جواب</b> می‌گیرد، چون Transaction دیگری در این فاصله آن را Update و Commit کرده است. راه‌حل: Isolation Level مناسب (بخش ۳).' });

  b.s('گزارش کارنامه در یک Transaction، دو بار سراغ ردیف سارا (نمرهٔ ۱۴) می‌رود.', (t) => t.add(tb.focus(row, true)))
    .show('گزارش یک بار برای فهرست درس‌ها Read می‌کند، یک بار برای معدل. کارمند آموزش هم یک اصلاح نمره را ثبت می‌کند.', [rep.el, ed.el, ln.el])
    .s('گزارش نمرهٔ سارا را Read می‌کند و ۱۴ در فهرست می‌نشیند. <b>S Lock</b> فقط لحظهٔ Read نگه داشته می‌شود.', (t) => t.add(rep.state('run', 'Running')).add(g1.draw(0.8), 0.2).add(tb.lock(row, 't2', 'T2', 'S', 'left'), 0.9).add(tb.unlock(row, 't2'), 1.8).add(fly(b.f, tb.cell(row, 'grade'), rep.memPos('list'), '14', 't2', { dur: 1.2 }), 2.0).add(rep.mem('list', '14'), 3.2).add(ln.ev(1, 1, 'SELECT → 14'), 3.2).add(g1.hide(), 3.3))
    .s('در همین فاصله، اصلاح نمرهٔ سارا: <b class="k1">X Lock</b>، ۱۷ و <b>Commit</b>.', (t) => t.add(ed.state('run', 'Running')).add(e1.draw(0.8), 0.2).add(tb.lock(row, 't1', 'T1', 'X', 'right'), 1.0).add(tb.set(row, 'grade', '17', { wet: 't1' }), 1.6).add(ln.ev(0, 2, 'UPDATE = 17'), 1.6).add(e1.hide(), 2.2).add(tb.dry(row), 2.5).add(tb.unlock(row, 't1'), 2.7).add(ln.ev(0, 3, 'COMMIT'), 2.7).add(ed.state('ok', 'Committed'), 2.9))
    .s('گزارش برای معدل <b>دوباره</b> همان ردیف را Read می‌کند: این بار ۱۷. <b>یک Transaction، دو جواب.</b>', (t) => t.add(g2.draw(0.8)).add(tb.flash(row, 't2', 0.6), 0.8).add(fly(b.f, tb.cell(row, 'grade'), rep.memPos('gpa'), '17', 't2', { dur: 1.2 }), 1.4).add(rep.mem('gpa', '<span class="bad">17</span>'), 2.6).add(rep.mem('list', '<span class="bad">14</span>'), 2.6).add(ln.ev(1, 4, 'SELECT → 17'), 2.6).add(g2.hide(), 2.8))
    .s('خروجی: کارنامه‌ای که با خودش نمی‌خواند.', (t) => t.add(sheet.show()))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- phantom

export function phantom(stage: HTMLElement) {
  const b = build(stage, { id: 'phantom', chapter: CH.problems, label: 'Phantom Read', title: 'فهرستی که شلوغ‌تر شد', badge: prob(4, 'روی جدول') });
  const tb = new DbTable(b.el, {
    name: 'dbo.Enrollments', x: 700, y: 262, rowH: 74, gap: 22,
    cols: [{ key: 'sec', label: 'SectionId', w: 150, kind: 'mono', pk: true }, { key: 'sid', label: 'StudentId', w: 170, kind: 'mono', pk: true }, { key: 'name', label: 'Name', w: 200 }],
    rows: [{ id: 'a', sec: '2', sid: '401210', name: 'سارا' }, { id: 'b', sec: '2', sid: '401230', name: 'رضا' }, { id: 'c', sec: '2', sid: '401260', name: 'مینا' }],
  });
  const rep = card.left(b.el, 't2', 'T2', { name: 'فهرست حضور', sub: 'دو بار می‌شمارد', w: 410, mem: [{ key: 'count #1' }, { key: 'count #2' }], memLabel: 'App Memory', exec: `${hl(cm('S Locks kept to COMMIT'))}
${k('SELECT COUNT')}(*)\n${k('FROM')} Enrollments\n${k('WHERE')} SectionId = 2  ${cm('×2')}` });
  const add = card.right(b.el, 't1', 'T1', { name: 'حذف و اضافه', sub: 'ثبت‌نام نیما', w: 410, exec: `${k('INSERT')} Enrollments\n${k('VALUES')} (2, 401245, N'<span class="fa-in">نیما</span>')` });
  const scan = (ids: string[], skip: string[] = []) => (t: gsap.core.Timeline) => ids.forEach((id, i) => { if (!skip.includes(id)) t.add(tb.lock(id, 't2', 'T2', 'S', 'left'), i * 0.5); else t.add(tb.flash(id, 't2', 0.3), i * 0.5); });
  const a1 = arrow(b.f, add.side('left', 30), { x: tb.x + tb.width + 14, y: tb.gapY(2) }, 't1', { bend: 0.1 });
  const glow = [1, 2, 3].map((i) => { const e = document.createElement('div'); e.className = 'gap-glow'; e.style.top = `${i * 96 - 22 - 4}px`; tb.body.appendChild(e); return e; });
  b.hide(...glow);
  const rule = ruleCard(b.el, { kicker: 'مشکل ۴', name: 'Phantom Read', body: 'یک Transaction <b>یک مجموعه</b> را دو بار Read می‌کند و بار دوم <b>ردیف تازه‌ای</b> می‌بیند. Lock روی ردیف‌های موجود جلویش را نمی‌گیرد، چون ردیف جدید <b>در فاصلهٔ بین ردیف‌ها</b> Insert می‌شود. راه‌حل: Isolation Level مناسب (بخش ۳).' });

  b.s('فهرست حاضران گروه ۲. جدول <code>Enrollments</code>: ردیف‌ها به ترتیب کلید چیده شده‌اند و بینشان <b>فاصله</b> هست.', (t) => t)
    .show('گزارش دانشجوها را دو بار می‌شمارد و این بار <b>S Lock</b>ها را تا آخر نگه می‌دارد. همزمان، حذف و اضافه نیما را Insert می‌کند.', [rep.el, add.el])
    .s('گزارش ردیف‌ها را Read می‌کند و روی هر کدام <b>S Lock</b> می‌گذارد که تا پایان Transaction می‌ماند. شمارش اول: ۳ نفر.', (t) => { t.add(rep.state('run', 'Running')); t.add(rep.mem('count #1', '3'), 1.8); scan(['a', 'b', 'c'])(t); })
    .s('ردیف نیما <b>از لای ردیف‌های Locked</b> Insert و Commit می‌شود. هیچ Lockی جلویش را نمی‌گیرد.', (t) => t.add(add.state('run', 'INSERT')).add(a1.draw(0.8), 0.2).add(tb.insert({ id: 'n', sec: '2', sid: '401245', name: 'نیما' }, 2, { wet: 't1', from: 'right' }), 1.0).add(a1.hide(), 1.8).add(tb.dry('n'), 2.2).add(add.state('ok', 'Committed'), 2.4))
    .s('شمارش دوم: <b class="kbad">۴ نفر</b>. یک ردیف <b>Phantom</b> پیدا شد.', (t) => { scan(['a', 'b', 'n', 'c'], ['a', 'b', 'c'])(t); t.add(rep.mem('count #2', '<span class="bad">4</span>'), 2.0); })
    .s('Lockها روی ردیف‌ها بودند؛ ولی روی <b>فاصلهٔ بین ردیف‌ها</b> نه. راه‌حل را در بخش Isolation Levelها می‌بینیم.', (t) => t.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.2, immediateRender: false }))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}
