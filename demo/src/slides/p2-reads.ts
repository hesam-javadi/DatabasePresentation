import * as THREE from 'three';
import { build } from '../core/build';
import { arrow, fly, note, ruleCard, ask } from '../kit/parts';
import { DbTable, Row } from '../kit/table';
import { ICON } from '../kit/icons';
import { Stage3D, P, platform, person, desk, laptop, phone, grow, hidden, pinIn, pinOut, rug, dbStack, packet } from '../kit/three3d';
import { CH, card, lanes, k, cm, hl } from './common';

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
  const b = build(stage, { id: 'grade-story', chapter: CH.problems, label: 'نمره‌ای که نبود', title: 'نمره‌ای که هرگز ثبت نشد' });
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
  const uiP1 = s3.label('نیما ← <b>۱۸</b><small>هنوز ذخیرهٔ نهایی نشده</small>', p.g, [0, 2.5, 0], 'ui');
  const uiP2 = s3.label(`<span class="kbad">${ICON.cross} ذخیره ناموفق بود</span><small>همه‌چیز برگشت</small>`, p.g, [0, 2.5, 0], 'ui');
  const uiN1 = s3.label('پایگاه داده: <b>۱۸</b>', n.g, [0, 2.45, 0], 'ui');
  const uiN2 = s3.label('🎉 قبول شدم!', n.g, [0, 2.45, 0], 'ui');
  const uiN3 = s3.label('پایگاه داده: <b>—</b><small>نمره هنوز ثبت نشده</small>', n.g, [0, 2.45, 0], 'ui');
  [uiP1, uiP2].forEach((e) => e.style.setProperty('--c', 'var(--t1)'));
  [uiN1, uiN2, uiN3].forEach((e) => e.style.setProperty('--c', 'var(--t2)'));
  const row = grades(b.el, [G('401234', 'نیما', 'NULL')]);
  row.el.style.top = '820px';
  b.hide(row.el);
  b.onStep((s) => s3.active(s > 0));

  b.s('پایان ترم. استاد نمره‌ها را در سامانهٔ آموزش وارد می‌کند.', (t) => { grow(t, ground, 0, 0.8); grow(t, prof, 0.3); pinIn(t, lp, 1.0); })
    .s('نمره‌ها در پایگاه دادهٔ آموزش ذخیره می‌شوند.', (t) => { grow(t, db, 0); pinIn(t, ldb, 0.6); })
    .s('نیما دانشجوی همین درس است و منتظر نمره‌اش.', (t) => { grow(t, stu, 0); pinIn(t, ln, 0.6); })
    .s('استاد نمرهٔ نیما را ۱۸ وارد می‌کند. ذخیرهٔ نهایی هنوز تمام نشده.', (t) => {
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
    .s('ولی ذخیرهٔ استاد با خطا برمی‌گردد. ۱۸ هیچ‌وقت ثبت نشد.', (t) => {
      pinOut(t, uiP1, 0); pinIn(t, uiP2, 0.1);
      t.to(pk.scale, { x: 1.8, y: 1.8, z: 1.8, duration: 0.4 }, 0.5).to(pk.material as THREE.MeshLambertMaterial, { opacity: 0, duration: 0.8 }, 0.6).to(pk.position, { y: 2.6, duration: 0.9 }, 0.5);
    })
    .s('فردا نیما دوباره نگاه می‌کند: نمره‌ای در کار نیست. او با عددی خوشحال شد که <b>هرگز وجود نداشت</b>.', (t) => {
      pinOut(t, uiN2, 0); pinIn(t, uiN3, 0.1);
      t.to(n.body.rotation, { x: 0.25, duration: 0.6 }, 0.3).to(n.head.position, { z: 0.12, duration: 0.6 }, 0.3);
    })
    .show('پشت این ماجرا یک ردیف در جدول <code>Grades</code> است.', row.el);
  return b.done();
}

// ---------------------------------------------------------------- dirty read

const NOLOCK = `${k('SELECT')} Grade ${k('FROM')} Grades\n  ${hl(k('WITH (NOLOCK)'))}\n${k('WHERE')} StudentId = 401234`;

export function dirtyRead(stage: HTMLElement) {
  const b = build(stage, { id: 'dirty', chapter: CH.problems, label: 'خواندن کثیف', title: 'خواندنِ جوهر خیس', term: 'Dirty Read' });
  const tb = grades(b.el, [G('401230', 'سارا', '17'), G('401234', 'نیما', 'NULL'), G('401241', 'مینا', '15')]);
  const prof = card.right(b.el, 't1', 'T1', { name: 'استاد', sub: 'ورود نمره', exec: cm('waiting') });
  const nima = card.left(b.el, 't2', 'T2', { name: 'نیما', sub: 'پرتال نمره', exec: NOLOCK, mem: [{ key: 'grade' }] });
  const ln = lanes(b.el, [{ tone: 't1', label: 'T1 · استاد' }, { tone: 't2', label: 'T2 · نیما' }], 6);
  const R = tb.edge('401234', 'right', 10);
  const a1 = arrow(b.f, prof.side('left', 40), R, 't1', { bend: 0.1 });
  const a2 = arrow(b.f, nima.side('right', 40), { x: R.x + 6, y: R.y + 6 }, 't2', { bend: -0.08 });
  const q = ask(b.el, 'نیما الان چه می‌بیند؟', ['NULL', '۱۸', 'منتظر می‌ماند'], 610, 712, 700);
  const fix = note(b.el, 'در <b>READ COMMITTED</b> (پیش‌فرض) خواندن پشت قفل منتظر می‌ماند؛ و در نسخهٔ snapshotیِ آن (RCSI) مقدارِ commitشده، یعنی NULL، را می‌بیند.', 'ok', 560, 728, 800);
  const rule = ruleCard(b.el, { name: 'خواندن کثیف', term: 'Dirty Read', body: 'خواندنِ داده‌ای که <b>هنوز commit نشده</b>. اگر نویسنده rollback کند، خواننده با عددی تصمیم گرفته که <b>هرگز وجود نداشت</b>. <code>NOLOCK</code> و <code>READ UNCOMMITTED</code> دقیقاً همین را مجاز می‌کنند.' });
  const row = '401234';

  b.s('همان ماجرا، روی جدول <code>Grades</code>.')
    .show('ردیف نیما: نمره هنوز <code>NULL</code> است.', tb.el, (t) => t.add(tb.focus(row, true), 0.5))
    .show('تراکنش استاد که نمره را وارد می‌کند.', prof.el)
    .show('تراکنش پرتال نمره. دقت کنید: با <code>WITH (NOLOCK)</code> می‌خواند.', nima.el)
    .show('خط زمانی.', ln.el)
    .s('استاد نمره را می‌نویسد و قفل <b>X</b> می‌گیرد.', (t) => t.add(prof.exec(`${k('BEGIN TRAN')}\n${k('UPDATE')} Grades ${k('SET')} Grade = 18\n${k('WHERE')} StudentId = 401234`)).add(prof.state('run', 'در حال ذخیره'), 0).add(a1.draw(0.8), 0.3).add(tb.lock(row, 't1', 'T1', 'X', 'right'), 1.1))
    .s('۱۸ نوشته شد، ولی هنوز commit نشده: <b>جوهر خیس</b>.', (t) => t.add(tb.set(row, 'grade', '18', { wet: 't1' })).add(ln.ev(0, 1, 'UPDATE = 18'), 0.3).add(a1.hide(), 0.8))
    .s('یک لحظه فکر کنید…', (t) => t.add(q.show()))
    .s('<code>NOLOCK</code> یعنی «قفل‌ها را نادیده بگیر». خواندن از روی قفل رد می‌شود.', (t) => t.add(nima.state('run', 'در حال خواندن')).add(a2.draw(0.9), 0.2).add(tb.flash(row, 't2', 0.6), 1.0))
    .s('نیما ۱۸ را می‌خواند: یک مقدار <b>commitنشده</b>.', (t) => t.add(fly(b.f, tb.cell(row, 'grade'), nima.memPos('grade'), '18', 't2', { dur: 1.3 })).add(nima.mem('grade', '<span class="dirty">18</span>'), 1.4).add(ln.ev(1, 2, 'NOLOCK → 18'), 1.4).add(q.answer(1), 1.5).add(a2.hide(), 1.6))
    .s('و بر اساسش تصمیم می‌گیرد.', (t) => t.add(q.hide()).add(nima.msg('🎉 قبول شدم!', 'ok', false), 0.2).add(nima.state('ok', 'خوشحال'), 0.3))
    .s('ذخیرهٔ استاد خطا می‌دهد: <code>ROLLBACK</code>. جوهر خیس پاک می‌شود.', (t) => t.add(prof.exec(`${k('ROLLBACK')}  ${cm('save failed')}`)).add(tb.evaporate(row), 0.3).add(tb.unlock(row, 't1'), 0.9).add(ln.ev(0, 3, 'ROLLBACK', { cls: 'lost' }), 0.5).add(prof.state('bad', 'برگشت خورد'), 0.8))
    .s('نیما با عددی تصمیم گرفت که <b class="kbad">هرگز وجود نداشت</b>.', (t) => t.add(nima.mem('grade', '<span class="bad strike">18</span>')).add(nima.stale('grade', true), 0.2).add(nima.msg('این نمره هرگز وجود نداشت', 'bad', false), 0.4))
    .s('در سطح پیش‌فرض این اتفاق نمی‌افتاد.', (t) => t.add(fix.show()))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- non-repeatable read

export function nonRepeatable(stage: HTMLElement) {
  const b = build(stage, { id: 'nonrep', chapter: CH.problems, label: 'خواندن تکرارنشدنی', title: 'کارنامه‌ای که با خودش نمی‌خواند', term: 'Non-Repeatable Read' });
  const tb = grades(b.el, [G('401230', 'سارا', '14'), G('401234', 'نیما', '16'), G('401241', 'مینا', '15')]);
  const rep = card.left(b.el, 't2', 'T2', { name: 'گزارش کارنامه', sub: 'یک تراکنش، دو خواندن', mem: [{ key: 'list' }, { key: 'gpa' }], memLabel: 'آنچه گزارش دیده', exec: `${k('BEGIN TRAN')}\n${k('SELECT')} Grade … ${cm('course list')}\n${k('SELECT')} Grade … ${cm('GPA')}\n${k('COMMIT')}` });
  const ed = card.right(b.el, 't1', 'T1', { name: 'کارمند آموزش', sub: 'اصلاح نمره', exec: `${k('UPDATE')} Grades ${k('SET')} Grade = 17\n${k('WHERE')} StudentId = 401230` });
  const ln = lanes(b.el, [{ tone: 't1', label: 'T1 · اصلاح' }, { tone: 't2', label: 'T2 · گزارش' }], 6);
  const row = '401230';
  const R = tb.edge(row, 'right', 10), L = tb.edge(row, 'left', 10);
  const g1 = arrow(b.f, rep.side('right', 20), L, 't2', { bend: -0.1 });
  const g2 = arrow(b.f, rep.side('right', 70), L, 't2', { bend: -0.1 });
  const e1 = arrow(b.f, ed.side('left', 30), R, 't1', { bend: 0.1 });
  const sheet = note(b.el, 'کارنامهٔ سارا: نمرهٔ پایگاه داده <b>۱۴</b> · معدل با <b>۱۷</b> حساب شده', 'bad', 560, 744, 800);
  sheet.el.classList.add('one');
  const rule = ruleCard(b.el, { name: 'خواندن تکرارنشدنی', term: 'Non-Repeatable Read', body: 'یک تراکنش <b>یک ردیف را دو بار</b> می‌خواند و <b>دو جواب</b> می‌گیرد، چون تراکنش دیگری در این فاصله آن را تغییر داده و commit کرده است. در READ COMMITTED (پیش‌فرض) ممکن است.' });

  b.s('یک گزارش کارنامه که در یک تراکنش، دو بار سراغ یک ردیف می‌رود.')
    .show('نمره‌ها. ردیف سارا: ۱۴.', tb.el, (t) => t.add(tb.focus(row, true), 0.5))
    .show('تراکنش گزارش: یک بار برای فهرست درس‌ها می‌خواند، یک بار برای معدل.', rep.el)
    .show('و کارمندی که یک اصلاح نمره را ثبت می‌کند.', ed.el)
    .show('خط زمانی.', ln.el)
    .s('گزارش نمرهٔ سارا را می‌خواند. در سطح پیش‌فرض، قفل S فقط <b>لحظهٔ خواندن</b> نگه داشته می‌شود.', (t) => t.add(rep.state('run', 'در حال ساخت')).add(g1.draw(0.8), 0.2).add(tb.lock(row, 't2', 'T2', 'S', 'left'), 0.9).add(tb.unlock(row, 't2'), 1.8))
    .s('عدد ۱۴ در فهرست درس‌ها می‌نشیند.', (t) => t.add(fly(b.f, tb.cell(row, 'grade'), rep.memPos('list'), '14', 't2', { dur: 1.3 })).add(rep.mem('list', '14'), 1.4).add(ln.ev(1, 1, 'SELECT → 14'), 1.4).add(g1.hide(), 1.6))
    .s('در همین فاصله، اصلاح نمرهٔ سارا ثبت می‌شود: قفل X و ۱۷.', (t) => t.add(ed.state('run', 'در حال ثبت')).add(e1.draw(0.8), 0.2).add(tb.lock(row, 't1', 'T1', 'X', 'right'), 1.0).add(tb.set(row, 'grade', '17', { wet: 't1' }), 1.6).add(ln.ev(0, 2, 'UPDATE = 17'), 1.6))
    .s('اصلاح commit می‌شود.', (t) => t.add(e1.hide()).add(tb.dry(row), 0.2).add(tb.unlock(row, 't1'), 0.4).add(ln.ev(0, 3, 'COMMIT'), 0.4).add(ed.state('ok', 'ثبت شد'), 0.7))
    .s('گزارش برای محاسبهٔ معدل، <b>دوباره</b> همان ردیف را می‌خواند.', (t) => t.add(g2.draw(0.8)).add(tb.flash(row, 't2', 0.6), 0.8))
    .s('این بار ۱۷. <b>یک تراکنش، دو جواب.</b>', (t) => t.add(fly(b.f, tb.cell(row, 'grade'), rep.memPos('gpa'), '17', 't2', { dur: 1.3 })).add(rep.mem('gpa', '<span class="bad">17</span>'), 1.4).add(rep.mem('list', '<span class="bad">14</span>'), 1.4).add(ln.ev(1, 4, 'SELECT → 17'), 1.4).add(g2.hide(), 1.6))
    .s('خروجی: کارنامه‌ای که با خودش نمی‌خواند.', (t) => t.add(sheet.show()))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- phantom

export function phantom(stage: HTMLElement) {
  const b = build(stage, { id: 'phantom', chapter: CH.problems, label: 'ردیف شبح', title: 'فهرستی که شلوغ‌تر شد', term: 'Phantom' });
  const tb = new DbTable(b.el, {
    name: 'dbo.Enrollments', x: 700, y: 262, rowH: 74, gap: 22,
    cols: [{ key: 'sec', label: 'SectionId', w: 150, kind: 'mono', pk: true }, { key: 'sid', label: 'StudentId', w: 170, kind: 'mono', pk: true }, { key: 'name', label: 'Name', w: 200 }],
    rows: [{ id: 'a', sec: '2', sid: '401210', name: 'سارا' }, { id: 'b', sec: '2', sid: '401230', name: 'رضا' }, { id: 'c', sec: '2', sid: '401260', name: 'مینا' }],
  });
  const rep = card.left(b.el, 't2', 'T2', { name: 'فهرست حضور', sub: 'دو بار می‌شمارد', w: 410, mem: [{ key: 'count #1' }, { key: 'count #2' }], memLabel: 'شمارش‌ها', exec: `${hl(cm('REPEATABLE READ'))}\n${k('SELECT COUNT')}(*) ${k('FROM')} Enrollments\n${k('WHERE')} SectionId = 2  ${cm('×2')}` });
  const add = card.right(b.el, 't1', 'T1', { name: 'حذف و اضافه', sub: 'ثبت‌نام نیما', w: 410, exec: `${k('INSERT')} Enrollments\n${k('VALUES')} (2, 401245, N'<span class="fa-in">نیما</span>')` });
  const scan = (ids: string[], skip: string[] = []) => (t: gsap.core.Timeline) => ids.forEach((id, i) => { if (!skip.includes(id)) t.add(tb.lock(id, 't2', 'T2', 'S', 'left'), i * 0.5); else t.add(tb.flash(id, 't2', 0.3), i * 0.5); });
  const a1 = arrow(b.f, add.side('left', 30), { x: tb.x + tb.width + 14, y: tb.gapY(2) }, 't1', { bend: 0.1 });
  const glow = [1, 2, 3].map((i) => { const e = document.createElement('div'); e.className = 'gap-glow'; e.style.top = `${i * 96 - 22 - 4}px`; tb.body.appendChild(e); return e; });
  b.hide(...glow);
  const rule = ruleCard(b.el, { name: 'ردیف شبح', term: 'Phantom', body: 'یک تراکنش <b>یک مجموعه</b> را دو بار می‌خواند و بار دوم <b>ردیف تازه‌ای</b> می‌بیند. قفل روی ردیف‌های موجود جلویش را نمی‌گیرد، چون ردیف جدید <b>در فاصلهٔ بین ردیف‌ها</b> می‌نشیند.' });

  b.s('فهرست حاضران گروه ۲: یک گزارش که دانشجوها را دو بار می‌شمارد.')
    .show('جدول <code>Enrollments</code>: هر ردیف یک ثبت‌نام. ردیف‌ها به ترتیب کلید چیده شده‌اند و بینشان <b>فاصله</b> هست.', tb.el)
    .show('تراکنش گزارش. این بار سطح سخت‌گیرتر <code>REPEATABLE READ</code> است: قفل‌ها تا آخر می‌مانند.', rep.el)
    .show('و حذف و اضافه، که نیما را به گروه ۲ اضافه می‌کند.', add.el)
    .s('گزارش ردیف‌ها را می‌شمارد و روی هر کدام قفل S می‌گذارد که <b>تا پایان تراکنش</b> می‌ماند.', (t) => { t.add(rep.state('run', 'در حال شمارش')); scan(['a', 'b', 'c'])(t); })
    .s('شمارش اول: ۳ نفر.', (t) => t.add(rep.mem('count #1', '3')))
    .s('حذف و اضافه: ردیف نیما <b>از لای ردیف‌های قفل‌شده</b> وارد می‌شود. هیچ قفلی جلویش را نمی‌گیرد.', (t) => t.add(add.state('run', 'INSERT')).add(a1.draw(0.8), 0.2).add(tb.insert({ id: 'n', sec: '2', sid: '401245', name: 'نیما' }, 2, { wet: 't1', from: 'right' }), 1.0).add(a1.hide(), 1.8))
    .s('و commit می‌شود.', (t) => t.add(tb.dry('n')).add(add.state('ok', 'ثبت شد'), 0.3))
    .s('شمارش دوم: <b class="kbad">۴ نفر</b>. یک «شبح» پیدا شد.', (t) => { scan(['a', 'b', 'n', 'c'], ['a', 'b', 'c'])(t); t.add(rep.mem('count #2', '<span class="bad">4</span>'), 2.0); })
    .s('قفل‌ها روی ردیف‌ها بودند؛ ولی روی <b>فاصلهٔ بین ردیف‌ها</b> نه. جواب این مشکل را در سطوح جداسازی می‌بینیم.', (t) => t.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.2, immediateRender: false }))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}
