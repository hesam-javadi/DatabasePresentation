import * as THREE from 'three';
import { build } from '../core/build';
import { arrow, fly, note, tag, ruleCard, ask } from '../kit/parts';
import { ICON } from '../kit/icons';
import { Stage3D, P, platform, person, desk, chair, laptop, phone, board, grow, hidden, pinIn, pinOut, own, rug } from '../kit/three3d';
import { CH, sections, SEC, card, lanes, k, cm, hl, P1 } from './common';

// ---------------------------------------------------------------- story (3D): the last seat in the section

export function registerStory(stage: HTMLElement) {
  const b = build(stage, { id: 'reg-story', chapter: CH.problems, label: 'آخرین صندلی کلاس', title: 'آخرین صندلی کلاس', badge: P1('ماجرا') });
  const s3 = new Stage3D(b.el, { x: 96, y: 236, w: 1728, h: 780, cam: [0, 10.5, 15.5], look: [0, 0.4, -0.3], fov: 31 });

  // classroom island
  const ground = platform(16, 10.4, 0xf1f4f9);
  const room = new THREE.Group();
  room.position.set(0, 0, -1.2);
  room.add(rug(9.2, 6.4, 0xe3e9f2));
  const brd = board(3.4, 1.15);
  brd.position.set(0, 0, -2.9);
  room.add(brd);
  const seats: THREE.Group[] = [];
  let emptySeat: THREE.Group | null = null;
  const emptyMat = own(P.ok, { emissive: 0x0a5a40 });
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
    const g = new THREE.Group();
    g.position.set(-3.3 + c * 1.32, 0, -1.9 + r * 0.95);
    const d = desk(0.8, 0.42); d.position.z = -0.12; g.add(d);
    const ch = chair(); ch.position.z = 0.28; ch.rotation.y = Math.PI; g.add(ch);
    const last = r === 4 && c === 5;
    if (last) { (ch.children[0] as THREE.Mesh).material = emptyMat; (ch.children[1] as THREE.Mesh).material = emptyMat; emptySeat = g; }
    else { const st = person(P.crowd, { seated: true, scale: 0.86, hair: c % 3 ? P.hair : P.hairL, long: (r + c) % 3 === 0 }); st.g.position.z = 0.25; st.g.rotation.y = Math.PI; g.add(st.g); }
    room.add(g); seats.push(g);
  }
  s3.add(room);

  // Sara (laptop) and Reza (phone), each on a small island
  const island = (x: number, c: number) => { const g = new THREE.Group(); g.position.set(x, 0, 3.3); g.add(rug(2.6, 2.4, c)); return g; };
  const sIs = island(5.6, 0xe4ebfb), rIs = island(-5.6, 0xf6e4f1);
  const sara = person(P.t1, { long: true }); sara.g.position.set(0, 0, 0.3);
  const sDesk = desk(1.0, 0.5); sDesk.position.set(0, 0, -0.35);
  const lap = laptop(); lap.g.position.set(0, 0.77, -0.35); lap.g.rotation.y = Math.PI;
  sIs.add(sDesk, lap.g, sara.g);
  const reza = person(P.t2); reza.g.position.set(0, 0, 0.1);
  const ph = phone(); ph.g.position.set(0.12, 1.12, 0.32); ph.g.rotation.x = -0.5; reza.g.add(ph.g);
  reza.armR.rotation.x = -1.0;
  rIs.add(reza.g);
  s3.add(ground, sIs, rIs);
  hidden(ground, room, sIs, rIs);

  const pBoard = s3.label('پایگاه داده · گروه ۲<small>ثبت‌شده: ۲۹ از ۳۰</small>', brd, [0, 1.55, 0.2], 'ui big');
  const pBoard2 = s3.label('<span class="kbad">۳۱ دانشجو</span>، ۳۰ صندلی', brd, [0, 1.55, 0.2], 'ui big');
  const pSeat = s3.label('آخرین صندلی', emptySeat!, [0, 1.25, 0], 'ok');
  const pSara = s3.label('سارا · خوابگاه', sara.g, [0, -0.2, 0.9], 't1');
  const pReza = s3.label('رضا · خانه', reza.g, [0, -0.2, 0.9], 't2');
  const ui = (o: Person3, html: string) => s3.label(html, o.g, [0, 2.45, 0], 'ui');
  type Person3 = { g: THREE.Object3D };
  const sUi1 = ui(sara, 'ظرفیت: ۲۹ / ۳۰<small>[ ثبت ]</small>'), rUi1 = ui(reza, 'ظرفیت: ۲۹ / ۳۰<small>[ ثبت ]</small>');
  const sUi2 = ui(sara, 'در حال ثبت…'), rUi2 = ui(reza, 'در حال ثبت…');
  const sUi3 = ui(sara, `<span class="kok">${ICON.check} ثبت شد</span>`), rUi3 = ui(reza, `<span class="kok">${ICON.check} ثبت شد</span>`);
  [sUi1, sUi2, sUi3].forEach((e) => e.style.setProperty('--c', 'var(--t1)'));
  [rUi1, rUi2, rUi3].forEach((e) => e.style.setProperty('--c', 'var(--t2)'));
  const clock = tag(b.el, `${ICON.clock} <span class="cv">۰۷:۵۹:۵۸</span>`, 'ink clock3', { x: 960, y: 262 });
  const clock2 = tag(b.el, `${ICON.clock} <span class="cv">۰۸:۰۰:۰۰</span>`, 'ink clock3', { x: 960, y: 262 });
  b.hide(clock, clock2);

  b.onStep((s) => s3.active(s > 0));
  b.s('ساعت ۸ صبح، روز انتخاب واحد. گروه ۲ درس پایگاه داده: <b>۳۰</b> صندلی و <b>۲۹</b> ثبت‌نام.', (t) => { grow(t, ground, 0, 0.8); grow(t, room, 0.3, 1.0); pinIn(t, pBoard, 1.2); })
    .s('یعنی فقط <b>یک</b> صندلی خالی مانده است.', (t) => { pinIn(t, pSeat, 0); t.to(emptyMat.emissive, { r: 0.1, g: 0.6, b: 0.4, duration: 0.5, yoyo: true, repeat: 3 }, 0.2); })
    .s('سارا در خوابگاه با لپ‌تاپ، و رضا در خانه با گوشی.', (t) => { grow(t, sIs, 0); pinIn(t, pSara, 0.6); grow(t, rIs, 0.3); pinIn(t, pReza, 0.9); })
    .s('هر دو صفحهٔ ثبت‌نام را باز کرده‌اند و یک جای خالی می‌بینند.', (t) => { pinIn(t, sUi1, 0); pinIn(t, rUi1, 0.15); t.fromTo(clock, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 0.3); })
    .s('ساعت ۸:۰۰:۰۰. هر دو با چند میلی‌ثانیه فاصله دکمهٔ «ثبت» را می‌زنند.', (t) => {
      t.to(clock, { opacity: 0, duration: 0.2 }, 0).to(clock2, { opacity: 1, duration: 0.3 }, 0.1);
      pinOut(t, sUi1, 0.5); pinIn(t, sUi2, 0.6); pinOut(t, rUi1, 0.65); pinIn(t, rUi2, 0.75);
      t.to(lap.screen.material.color, { r: 1, g: 1, b: 1, duration: 0.15, yoyo: true, repeat: 1 }, 0.5);
      t.to(ph.screen.material.color, { r: 1, g: 1, b: 1, duration: 0.15, yoyo: true, repeat: 1 }, 0.65);
    })
    .s('هر دو پیام <b class="kok">«ثبت شد»</b> می‌گیرند.', (t) => { pinOut(t, sUi2, 0); pinIn(t, sUi3, 0.1); pinOut(t, rUi2, 0.25); pinIn(t, rUi3, 0.35); })
    .s('جلسهٔ اول کلاس: هر دو به سمت همان صندلی می‌روند. پشت این ماجرا فقط یک ردیف در جدول <code>Sections</code> است.', (t) => {
      [sUi3, rUi3, pSara, pReza, clock2, pSeat].forEach((e) => pinOut(t, e, 0));
      const seatW = emptySeat!.position.clone().add(room.position);
      t.to(sara.g.position, { x: seatW.x - 5.6 + 0.55, z: seatW.z - 3.3 + 0.75, duration: 2.2, ease: 'power1.inOut' }, 0.3)
        .to(reza.g.position, { x: seatW.x + 5.6 - 0.55, z: seatW.z - 3.3 + 0.75, duration: 2.6, ease: 'power1.inOut' }, 0.3);
      pinOut(t, pBoard, 2.4); pinIn(t, pBoard2, 2.6);
    });
  return b.done();
}

// ---------------------------------------------------------------- mechanism: lost update on the counter

const READ = `${k('SELECT')} Enrolled, Capacity\n${k('FROM')} Sections ${k('WHERE')} Id = 2`;
const LOGIC = `${cm('same code for both')}\ne = ${k('SELECT')} Enrolled …\n${k('if')} e &lt; capacity:\n  ${k('UPDATE')} … Enrolled = e + 1`;
const WRITE = `${k('UPDATE')} Sections\n${k('SET')} Enrolled = 30  ${cm('e + 1')}\n${k('WHERE')} Id = 2`;

export function registerRace(stage: HTMLElement) {
  const b = build(stage, { id: 'reg-race', chapter: CH.problems, label: 'دو ثبت‌نام، یک صندلی', title: 'دو ثبت‌نام، یک صندلی', badge: P1('روی جدول') });
  const tb = sections(b.el, [SEC.g1(), SEC.g2('29'), SEC.os()]);
  const mem = [{ key: 'e' }];
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'ثبت‌نام در گروه ۲', mem, exec: LOGIC });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'ثبت‌نام در گروه ۲', mem, exec: LOGIC });
  const ln = lanes(b.el, [{ tone: 't1', label: 'T1 · سارا' }, { tone: 't2', label: 'T2 · رضا' }], 7);
  const R = tb.edge('2', 'right', 10), L = tb.edge('2', 'left', 10);
  const a = { s1: arrow(b.f, sara.side('left', 30), R, 't1', { bend: 0.1 }), s2: arrow(b.f, sara.side('left', 60), R, 't1', { bend: 0.1 }), r1: arrow(b.f, reza.side('right', 30), L, 't2', { bend: -0.1 }), r2: arrow(b.f, reza.side('right', 60), L, 't2', { bend: -0.1 }) };
  const q = ask(b.el, 'رضا چه عددی در Enrolled می‌نویسد؟', ['30', '31'], 580, 650, 760);
  const tally = note(b.el, 'ثبت‌نام‌ها: <b>۳۱</b> · Enrolled: <b>۳۰</b> · Capacity: <b>۳۰</b>', 'bad', 560, 744, 800);
  tally.el.classList.add('one');
  const rule = ruleCard(b.el, { kicker: 'مشکل ۱', name: 'Lost Update', body: 'دو Transaction یک مقدار را <b>Read</b> می‌کنند و هر کدام بر اساس آن <b>Write</b> می‌کند. Write دوم، اثر اولی را پاک می‌کند. Lockها بودند، ولی فقط <b>لحظهٔ Write</b> را می‌پوشانند؛ نه فاصلهٔ Read تا Write را.' });

  b.s('همان لحظه، روی پایگاه داده: جدول <code>Sections</code>، ردیف گروه ۲ با ۲۹ از ۳۰.', (t) => t.add(tb.focus('2', true)))
    .show('دو Transaction با یک کد: Read کن؛ اگر جا هست، یکی اضافه کن. <b>App Memory</b> مقداری است که برنامه در دست دارد.', [sara.el, reza.el, ln.el])
    .s('سارا ردیف را <b>Read</b> می‌کند: ۲۹ به App Memory او می‌رود.', (t) => t.add(sara.exec(READ)).add(sara.state('run', 'Running'), 0).add(a.s1.draw(0.8), 0.3).add(tb.flash('2', 't1', 0.6), 1.1).add(fly(b.f, tb.cell('2', 'enr'), sara.memPos('e'), '29', 't1', { dur: 1.2 }), 1.6).add(sara.mem('e', '29'), 2.9).add(ln.ev(0, 1, 'SELECT → 29'), 2.9).add(a.s1.hide(), 3.0))
    .s('چند میلی‌ثانیه بعد، رضا هم <b>Read</b> می‌کند. او هم ۲۹ می‌بیند.', (t) => t.add(reza.exec(READ)).add(reza.state('run', 'Running'), 0).add(a.r1.draw(0.8), 0.3).add(tb.flash('2', 't2', 0.6), 1.1).add(fly(b.f, tb.cell('2', 'enr'), reza.memPos('e'), '29', 't2', { dur: 1.2 }), 1.6).add(reza.mem('e', '29'), 2.9).add(ln.ev(1, 2, 'SELECT → 29'), 2.9).add(a.r1.hide(), 3.0))
    .s('سارا: ۲۹ کمتر از ۳۰ است، پس <b>Write</b> می‌کند. UPDATE یک <b class="k1">X Lock</b> می‌گیرد و ۳۰ را می‌نویسد؛ هنوز <b>uncommitted</b>.', (t) => t.add(sara.exec(WRITE)).add(a.s2.draw(0.8), 0.3).add(tb.lock('2', 't1', 'T1', 'X', 'right'), 1.1).add(tb.set('2', 'enr', '30', { wet: 't1' }), 1.8).add(ln.ev(0, 3, 'UPDATE = 30'), 2.0).add(a.s2.hide(), 2.4))
    .s('سارا <b>Commit</b> می‌کند. Lock آزاد می‌شود و پیامش: «ثبت شد».', (t) => t.add(sara.exec(k('COMMIT'))).add(tb.dry('2'), 0.3).add(tb.unlock('2', 't1'), 0.6).add(ln.ev(0, 4, 'COMMIT'), 0.6).add(sara.state('ok', 'Committed'), 1.0))
    .s('حالا نوبت رضاست. یک لحظه فکر کنید…', (t) => t.add(q.show()))
    .s('رضا با ۲۹ِ <b class="kbad">کهنه</b> Write می‌کند: ۳۰ روی ۳۰ِ سارا. <b class="kbad">افزایشِ سارا گم شد.</b>', (t) => t.add(reza.stale('e', true)).add(reza.exec(WRITE), 0.2).add(a.r2.draw(0.8), 0.5).add(tb.lock('2', 't2', 'T2', 'X', 'left'), 1.3).add(tb.set('2', 'enr', '30', { wet: 't2', knock: true }), 2.0).add(ln.ev(1, 5, 'UPDATE = 30'), 2.2).add(a.r2.hide(), 2.6).add(q.answer(0), 2.6))
    .s('رضا هم Commit می‌کند و پیام «ثبت شد» می‌گیرد.', (t) => t.add(q.hide()).add(reza.exec(k('COMMIT')), 0).add(tb.dry('2'), 0.3).add(tb.unlock('2', 't2'), 0.6).add(ln.ev(1, 6, 'COMMIT'), 0.6).add(reza.state('ok', 'Committed'), 1.0))
    .s('مشکل کجا بود؟ بین Read و Write رضا، داده عوض شده بود.', (t) => t.add(ln.bracket(1, 2, 5, 'پنجرهٔ خطر: بین Read و Write')))
    .s('نتیجه: ۳۱ دانشجو در کلاس ۳۰ نفره. هیچ خطایی هم ثبت نشد.', (t) => t.add(tally.show()))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- fix: the check and the +1 move into the UPDATE

const COND = `${k('UPDATE')} Sections\n${k('SET')} Enrolled = ${hl('Enrolled + 1')}\n${k('WHERE')} Id = 2\n  ${hl(`${k('AND')} Enrolled &lt; Capacity`)}`;

export function registerFix(stage: HTMLElement) {
  const b = build(stage, { id: 'reg-fix', chapter: CH.problems, label: 'راه‌حل: UPDATE شرطی', title: 'شرط و محاسبه، داخل UPDATE', badge: P1('راه‌حل') });
  const tb = sections(b.el, [SEC.g1(), SEC.g2('29'), SEC.os()]);
  const mem = [{ key: '@@ROWCOUNT' }];
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'ثبت‌نام در گروه ۲', mem, exec: COND });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'ثبت‌نام در گروه ۲', mem, exec: COND });
  const ln = lanes(b.el, [{ tone: 't1', label: 'T1 · سارا' }, { tone: 't2', label: 'T2 · رضا' }], 7);
  const R = tb.edge('2', 'right', 10), L = tb.edge('2', 'left', 10);
  const s1 = arrow(b.f, sara.side('left', 40), R, 't1', { bend: 0.1 });
  const r1 = arrow(b.f, reza.side('right', 40), { x: L.x - 84, y: L.y }, 't2', { bend: -0.1 });
  const above = { x: tb.cell('2', 'enr').x - 40, y: tb.rowY('2') - 30 };
  const ok = tag(b.el, `<span dir="ltr">29 &lt; 30</span> ${ICON.check}`, 'ok mono check', above);
  const no = tag(b.el, `<span dir="ltr">30 &lt; 30</span> ${ICON.cross}`, 'bad mono check', above);
  b.hide(ok, no);
  const rule = ruleCard(b.el, { name: 'Conditional UPDATE', tone: 'ok', kicker: 'راه‌حل مشکل ۱', body: 'شرط را <b>داخل خود دستور</b> بگذارید و محاسبه را به <code>SET</code> بسپارید. بعد <code>@@ROWCOUNT</code> را ببینید: <b>۱</b> یعنی موفق، <b>۰</b> یعنی کس دیگری زودتر رسید. بررسی و Write، یک کار <b>Atomic</b> می‌شوند.' });

  b.s('راه‌حل: بررسی و محاسبه را به <b>خود UPDATE</b> بسپارید. همان ردیف: ۲۹ از ۳۰.', (t) => t.add(tb.focus('2', true)))
    .show('هر کدام فقط <b>یک دستور</b> دارد، بدون Read قبلی: شرط ظرفیت در <code>WHERE</code> و جمع در <code>SET</code>.', [sara.el, reza.el, ln.el])
    .s('سارا اول می‌رسد و <b class="k1">X Lock</b> می‌گیرد. شرط روی همین ردیف بررسی می‌شود: ۲۹ کمتر از ۳۰.', (t) => t.add(sara.state('run', 'Running')).add(s1.draw(0.8), 0.2).add(tb.lock('2', 't1', 'T1', 'X', 'right'), 1.0).fromTo(ok, { opacity: 0, y: above.y + 14 }, { opacity: 1, y: above.y, duration: 0.5, immediateRender: false }, 1.6).add(tb.mark('2', 'enr', 't1'), 1.7))
    .s('Enrolled یکی زیاد می‌شود. پاسخ: <b>۱ ردیف</b> تغییر کرد.', (t) => t.to(ok, { opacity: 0, duration: 0.3 }).add(tb.set('2', 'enr', '30', { wet: 't1' }), 0.2).add(sara.mem('@@ROWCOUNT', '1'), 0.8).add(sara.msg('(1 row affected)', 'ok'), 0.8).add(ln.ev(0, 1, 'UPDATE → 1 row'), 0.8).add(s1.hide(), 1.0))
    .s('دستور رضا می‌رسد؛ ردیف Locked است. <b>Wait</b> می‌کند: نه خطا، نه بازنویسی.', (t) => t.add(reza.state('wait', 'Waiting')).add(r1.draw(0.8), 0.2).add(tb.wait('2', 't2', 'T2', 'left', 18), 1.0).add(ln.ev(1, 2, `${ICON.hourglass} WAIT`, { cls: 'wait', span: 2 }), 1.0))
    .s('سارا <b>Commit</b> می‌کند و Lock آزاد می‌شود.', (t) => t.add(sara.exec(k('COMMIT'))).add(tb.dry('2'), 0.3).add(tb.unlock('2', 't1'), 0.5).add(tb.mark('2', 'enr', 't1', false), 0.5).add(ln.ev(0, 3, 'COMMIT'), 0.5).add(sara.state('ok', 'Committed'), 0.9))
    .s('رضا Lock را می‌گیرد و شرط را با مقدار <b>تازه</b> می‌سنجد: ۳۰ کمتر از ۳۰ نیست.', (t) => t.add(r1.hide()).add(tb.unwait('2', 't2'), 0).add(tb.lock('2', 't2', 'T2', 'X', 'left'), 0.3).add(reza.state('run', 'Running'), 0.3).fromTo(no, { opacity: 0, y: above.y + 14 }, { opacity: 1, y: above.y, duration: 0.5, immediateRender: false }, 1.0).add(tb.mark('2', 'enr', 'bad'), 1.2).to(tb.cellEl('2', 'enr'), { x: 6, duration: 0.07, yoyo: true, repeat: 5 }, 1.4))
    .s('<b class="kbad">۰ ردیف</b> تغییر کرد و برنامهٔ رضا پیام روشن می‌دهد. کلاس ۳۰ نفر ماند.', (t) => t.add(reza.mem('@@ROWCOUNT', '0', 'zero')).add(ln.ev(1, 4, 'UPDATE → 0 rows'), 0).add(tb.unlock('2', 't2'), 0.4).to(no, { opacity: 0, duration: 0.3 }, 0.7).add(tb.mark('2', 'enr', 'bad', false), 0.7).add(reza.state('idle', 'پیام به کاربر'), 0.8).add(reza.msg('ظرفیت این گروه تکمیل شد.', 'ink', false), 0.9))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}
