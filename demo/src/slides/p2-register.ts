import * as THREE from 'three';
import { build } from '../core/build';
import { arrow, fly, note, tag, ruleCard, ask } from '../kit/parts';
import { ICON } from '../kit/icons';
import { Stage3D, P, platform, person, desk, chair, laptop, phone, board, grow, hidden, pinIn, pinOut, own, rug } from '../kit/three3d';
import { CH, sections, SEC, card, lanes, k, cm, hl } from './common';

// ---------------------------------------------------------------- story (3D): the last seat in the section

export function registerStory(stage: HTMLElement) {
  const b = build(stage, { id: 'reg-story', chapter: CH.problems, label: 'آخرین صندلی کلاس', title: 'آخرین صندلی کلاس', term: 'Race Condition' });
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
  const pBoard2 = s3.label('<span class="kbad">۳۱ دانشجو</span> · ۳۰ صندلی', brd, [0, 1.55, 0.2], 'ui big');
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
  const row = sections(b.el, [SEC.g2('29')], { x: 640, y: 812, rowH: 76 });
  b.hide(clock, clock2, row.el);

  b.onStep((s) => s3.active(s > 0));
  b.s('ساعت ۸ صبح، روز انتخاب واحد. احتمالاً همه این لحظه را تجربه کرده‌اید.')
    .s('گروه ۲ درس پایگاه داده: ۳۰ صندلی دارد و ۲۹ نفر ثبت‌نام کرده‌اند.', (t) => { grow(t, ground, 0, 0.8); grow(t, room, 0.3, 1.0); pinIn(t, pBoard, 1.2); })
    .s('یعنی فقط <b>یک</b> صندلی خالی مانده است.', (t) => { pinIn(t, pSeat, 0); t.to(emptyMat.emissive, { r: 0.1, g: 0.6, b: 0.4, duration: 0.5, yoyo: true, repeat: 3 }, 0.2); })
    .s('سارا در خوابگاه است، با لپ‌تاپ.', (t) => { grow(t, sIs, 0); pinIn(t, pSara, 0.6); })
    .s('رضا در خانه است، با گوشی.', (t) => { grow(t, rIs, 0); pinIn(t, pReza, 0.6); })
    .s('هر دو صفحهٔ ثبت‌نام را باز کرده‌اند و یک جای خالی می‌بینند.', (t) => { pinIn(t, sUi1, 0); pinIn(t, rUi1, 0.15); t.fromTo(clock, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 0.3); })
    .s('ساعت ۸:۰۰:۰۰. هر دو با چند میلی‌ثانیه فاصله دکمهٔ «ثبت» را می‌زنند.', (t) => {
      t.to(clock, { opacity: 0, duration: 0.2 }, 0).to(clock2, { opacity: 1, duration: 0.3 }, 0.1);
      pinOut(t, sUi1, 0.5); pinIn(t, sUi2, 0.6); pinOut(t, rUi1, 0.65); pinIn(t, rUi2, 0.75);
      t.to(lap.screen.material.color, { r: 1, g: 1, b: 1, duration: 0.15, yoyo: true, repeat: 1 }, 0.5);
      t.to(ph.screen.material.color, { r: 1, g: 1, b: 1, duration: 0.15, yoyo: true, repeat: 1 }, 0.65);
    })
    .s('هر دو پیام <b class="kok">«ثبت شد»</b> می‌گیرند.', (t) => { pinOut(t, sUi2, 0); pinIn(t, sUi3, 0.1); pinOut(t, rUi2, 0.25); pinIn(t, rUi3, 0.35); })
    .s('جلسهٔ اول کلاس: هر دو به سمت همان صندلی می‌روند.', (t) => {
      [sUi3, rUi3, pSara, pReza, clock2, pSeat].forEach((e) => pinOut(t, e, 0));
      const seatW = emptySeat!.position.clone().add(room.position);
      t.to(sara.g.position, { x: seatW.x - 5.6 + 0.55, z: seatW.z - 3.3 + 0.75, duration: 2.2, ease: 'power1.inOut' }, 0.3)
        .to(reza.g.position, { x: seatW.x + 5.6 - 0.55, z: seatW.z - 3.3 + 0.75, duration: 2.6, ease: 'power1.inOut' }, 0.3);
      pinOut(t, pBoard, 2.4); pinIn(t, pBoard2, 2.6);
    })
    .show('پشت این ماجرا فقط یک ردیف در جدول <code>Sections</code> است. برویم سراغ همان ردیف.', row.el);
  return b.done();
}

// ---------------------------------------------------------------- mechanism: lost update on the counter

const READ = `${k('SELECT')} Enrolled, Capacity\n${k('FROM')} Sections ${k('WHERE')} Id = 2`;
const LOGIC = `${cm('same code in both sessions')}\ne = ${k('SELECT')} Enrolled …\n${k('if')} e &lt; capacity:\n  ${k('UPDATE')} … Enrolled = e + 1`;
const WRITE = `${k('UPDATE')} Sections\n${k('SET')} Enrolled = 30  ${cm('e + 1')}\n${k('WHERE')} Id = 2`;

export function registerRace(stage: HTMLElement) {
  const b = build(stage, { id: 'reg-race', chapter: CH.problems, label: 'دو ثبت‌نام، یک صندلی', title: 'دو ثبت‌نام، یک صندلی', term: 'Lost Update' });
  const tb = sections(b.el, [SEC.g1(), SEC.g2('29'), SEC.os()]);
  const mem = [{ key: 'e' }];
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'ثبت‌نام در گروه ۲', mem, exec: LOGIC });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'ثبت‌نام در گروه ۲', mem, exec: LOGIC });
  const ln = lanes(b.el, [{ tone: 't1', label: 'T1 · سارا' }, { tone: 't2', label: 'T2 · رضا' }], 7);
  const R = tb.edge('2', 'right', 10), L = tb.edge('2', 'left', 10);
  const a = { s1: arrow(b.f, sara.side('left', 30), R, 't1', { bend: 0.1 }), s2: arrow(b.f, sara.side('left', 60), R, 't1', { bend: 0.1 }), r1: arrow(b.f, reza.side('right', 30), L, 't2', { bend: -0.1 }), r2: arrow(b.f, reza.side('right', 60), L, 't2', { bend: -0.1 }) };
  const q = ask(b.el, 'رضا چه عددی در Enrolled می‌نویسد؟', ['۳۰', '۳۱'], 610, 730, 700);
  const tally = note(b.el, 'ثبت‌نام‌ها: <b>۳۱</b> · شمارنده: <b>۳۰</b> · ظرفیت: <b>۳۰</b>', 'bad', 560, 744, 800);
  tally.el.classList.add('one');
  const rule = ruleCard(b.el, { name: 'به‌روزرسانی گم‌شده', term: 'Lost Update', body: 'دو تراکنش یک مقدار را <b>می‌خوانند</b> و هر کدام بر اساس آن <b>می‌نویسند</b>. نوشتن دوم، اثر اولی را پاک می‌کند. قفل‌ها بودند، ولی فقط <b>لحظهٔ نوشتن</b> را می‌پوشانند؛ نه فاصلهٔ خواندن تا نوشتن را.' });

  b.s('همان لحظه، این بار روی خود پایگاه داده.')
    .show('جدول <code>Sections</code>. ردیف گروه ۲: ظرفیت ۳۰، ثبت‌نامی ۲۹.', tb.el, (t) => t.add(tb.focus('2', true), 0.5))
    .show('تراکنش سارا. «حافظهٔ برنامه» مقداری است که برنامهٔ سارا در دست دارد.', sara.el)
    .show('تراکنش رضا، با همان کد: بخوان، اگر جا هست، یکی اضافه کن.', reza.el)
    .show('و خط زمانی: چه کسی، کی، چه کرد.', ln.el)
    .s('سارا ردیف گروه ۲ را می‌خواند.', (t) => t.add(sara.exec(READ)).add(sara.state('run', 'در حال اجرا'), 0).add(a.s1.draw(0.8), 0.3).add(tb.flash('2', 't1', 0.8), 1.1))
    .s('عدد ۲۹ به حافظهٔ برنامهٔ سارا می‌رود.', (t) => t.add(fly(b.f, tb.cell('2', 'enr'), sara.memPos('e'), '29', 't1', { dur: 1.3 })).add(sara.mem('e', '29'), 1.4).add(ln.ev(0, 1, 'SELECT → 29'), 1.4).add(a.s1.hide(), 1.6))
    .s('چند میلی‌ثانیه بعد، رضا هم همان ردیف را می‌خواند.', (t) => t.add(reza.exec(READ)).add(reza.state('run', 'در حال اجرا'), 0).add(a.r1.draw(0.8), 0.3).add(tb.flash('2', 't2', 0.8), 1.1))
    .s('رضا هم ۲۹ را می‌بیند. حالا <b>هر دو</b> فکر می‌کنند یک جا هست.', (t) => t.add(fly(b.f, tb.cell('2', 'enr'), reza.memPos('e'), '29', 't2', { dur: 1.3 })).add(reza.mem('e', '29'), 1.4).add(ln.ev(1, 2, 'SELECT → 29'), 1.4).add(a.r1.hide(), 1.6))
    .s('برنامهٔ سارا بررسی می‌کند: ۲۹ کمتر از ۳۰ است. جا هست.', (t) => t.add(sara.exec(`${cm('e = 29, capacity = 30')}\n${k('if')} 29 &lt; 30:  ${hl('✓')}`)))
    .s('سارا می‌نویسد. برای نوشتن، قفل <b>X</b> می‌گیرد.', (t) => t.add(sara.exec(WRITE)).add(a.s2.draw(0.8), 0.3).add(tb.lock('2', 't1', 'T1', 'X', 'right'), 1.1))
    .s('Enrolled می‌شود ۳۰؛ هنوز commit نشده.', (t) => t.add(tb.set('2', 'enr', '30', { wet: 't1' })).add(ln.ev(0, 3, 'UPDATE = 30'), 0.3).add(a.s2.hide(), 0.8))
    .s('سارا commit می‌کند. قفل آزاد می‌شود و پیامش: «ثبت شد».', (t) => t.add(sara.exec(k('COMMIT'))).add(tb.dry('2'), 0.3).add(tb.unlock('2', 't1'), 0.6).add(ln.ev(0, 4, 'COMMIT'), 0.6).add(sara.state('ok', 'ثبت شد'), 1.0))
    .s('حالا نوبت رضاست. یک لحظه فکر کنید…', (t) => t.add(q.show()))
    .s('برنامهٔ رضا هم بررسی می‌کند؛ ولی با ۲۹ در حافظه‌اش، که <b class="kbad">دیگر درست نیست</b>.', (t) => t.add(reza.stale('e', true)).add(reza.exec(`${cm('e = 29 (stale!)')}\n${k('if')} 29 &lt; 30:  ${hl('✓')}`), 0.2))
    .s('رضا هم می‌نویسد: ۲۹ + ۱. قفل X را می‌گیرد.', (t) => t.add(reza.exec(WRITE)).add(a.r2.draw(0.8), 0.3).add(tb.lock('2', 't2', 'T2', 'X', 'left'), 1.1))
    .s('رضا ۳۰ را روی ۳۰ِ سارا می‌نویسد. <b class="kbad">افزایشِ سارا گم شد.</b>', (t) => t.add(tb.set('2', 'enr', '30', { wet: 't2', knock: true })).add(ln.ev(1, 5, 'UPDATE = 30'), 0.4).add(a.r2.hide(), 0.9).add(q.answer(0), 1.0))
    .s('رضا هم commit می‌کند و پیام «ثبت شد» می‌گیرد.', (t) => t.add(q.hide()).add(reza.exec(k('COMMIT')), 0).add(tb.dry('2'), 0.3).add(tb.unlock('2', 't2'), 0.6).add(ln.ev(1, 6, 'COMMIT'), 0.6).add(reza.state('ok', 'ثبت شد'), 1.0))
    .s('مشکل کجا بود؟ بین خواندن و نوشتنِ رضا، داده عوض شده بود.', (t) => t.add(ln.bracket(1, 2, 5, 'پنجرهٔ خطر: بین خواندن و نوشتن')))
    .s('نتیجه: ۳۱ دانشجو در کلاس ۳۰ نفره، و شمارنده می‌گوید ۳۰. هیچ خطایی هم ثبت نشد.', (t) => t.add(tally.show()))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- fix: the check and the +1 move into the UPDATE

const COND = `${k('UPDATE')} Sections\n${k('SET')} Enrolled = ${hl('Enrolled + 1')}\n${k('WHERE')} Id = 2\n  ${hl(`${k('AND')} Enrolled &lt; Capacity`)}`;

export function registerFix(stage: HTMLElement) {
  const b = build(stage, { id: 'reg-fix', chapter: CH.problems, label: 'UPDATE شرطی', title: 'شرط و محاسبه، داخل UPDATE', term: 'Conditional UPDATE' });
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
  const rule = ruleCard(b.el, { name: 'UPDATE شرطی و اتمی', term: 'Conditional UPDATE', tone: 'ok', kicker: 'الگو', body: 'شرط را <b>داخل خود دستور</b> بگذارید و محاسبه را به <code>SET</code> بسپارید. بعد تعداد ردیف‌های تغییرکرده را بخوانید: <b>۱</b> یعنی موفق، <b>۰</b> یعنی کس دیگری زودتر رسید. بررسی و تغییر، یک کار اتمی می‌شوند.' });

  b.s('راه‌حل: بررسی و محاسبه را به <b>خود UPDATE</b> بسپارید.')
    .show('همان جدول، همان ردیف: ۲۹ از ۳۰.', tb.el, (t) => t.add(tb.focus('2', true), 0.5))
    .show('سارا حالا فقط <b>یک دستور</b> دارد: بدون خواندنِ قبلی. شرط ظرفیت داخل <code>WHERE</code> است و جمع داخل <code>SET</code>.', sara.el)
    .show('رضا هم همان یک دستور را دارد.', reza.el)
    .show('و خط زمانی.', ln.el)
    .s('سارا اول می‌رسد و قفل <b>X</b> می‌گیرد.', (t) => t.add(sara.state('run', 'در حال اجرا')).add(s1.draw(0.8), 0.2).add(tb.lock('2', 't1', 'T1', 'X', 'right'), 1.0))
    .s('شرط روی همین ردیفِ قفل‌شده بررسی می‌شود: ۲۹ کمتر از ۳۰. برقرار است.', (t) => t.fromTo(ok, { opacity: 0, y: above.y + 14 }, { opacity: 1, y: above.y, duration: 0.5, immediateRender: false }).add(tb.mark('2', 'enr', 't1'), 0.2))
    .s('Enrolled یکی زیاد می‌شود. پاسخ پایگاه داده: <b>۱ ردیف</b> تغییر کرد.', (t) => t.to(ok, { opacity: 0, duration: 0.3 }).add(tb.set('2', 'enr', '30', { wet: 't1' }), 0.2).add(sara.mem('@@ROWCOUNT', '1'), 0.8).add(sara.msg('(1 row affected)', 'ok'), 0.8).add(ln.ev(0, 1, 'UPDATE → 1 row'), 0.8).add(s1.hide(), 1.0))
    .s('دستور رضا می‌رسد؛ ردیف قفل است. <b>منتظر</b> می‌ماند: نه خطا، نه بازنویسی.', (t) => t.add(reza.state('wait', 'منتظر قفل')).add(r1.draw(0.8), 0.2).add(tb.wait('2', 't2', 'T2', 'left', 18), 1.0).add(ln.ev(1, 2, `${ICON.hourglass} WAIT`, { cls: 'wait', span: 2 }), 1.0))
    .s('سارا commit می‌کند و قفل آزاد می‌شود.', (t) => t.add(sara.exec(k('COMMIT'))).add(tb.dry('2'), 0.3).add(tb.unlock('2', 't1'), 0.5).add(tb.mark('2', 'enr', 't1', false), 0.5).add(ln.ev(0, 3, 'COMMIT'), 0.5).add(sara.state('ok', 'ثبت شد'), 0.9))
    .s('حالا رضا قفل را می‌گیرد.', (t) => t.add(r1.hide()).add(tb.unwait('2', 't2'), 0).add(tb.lock('2', 't2', 'T2', 'X', 'left'), 0.3).add(reza.state('run', 'در حال اجرا'), 0.3))
    .s('شرط را با مقدار <b>تازه</b> می‌سنجد: ۳۰ کمتر از ۳۰ نیست.', (t) => t.fromTo(no, { opacity: 0, y: above.y + 14 }, { opacity: 1, y: above.y, duration: 0.5, immediateRender: false }).add(tb.mark('2', 'enr', 'bad'), 0.2).to(tb.cellEl('2', 'enr'), { x: 6, duration: 0.07, yoyo: true, repeat: 5 }, 0.5))
    .s('هیچ ردیفی تغییر نکرد: <b class="kbad">۰ ردیف</b>. قفل آزاد می‌شود.', (t) => t.add(reza.mem('@@ROWCOUNT', '0', 'zero')).add(reza.msg('(0 rows affected)', 'bad'), 0).add(ln.ev(1, 4, 'UPDATE → 0 rows'), 0).add(tb.unlock('2', 't2'), 0.5).to(no, { opacity: 0, duration: 0.3 }, 0.8).add(tb.mark('2', 'enr', 'bad', false), 0.8))
    .s('برنامهٔ رضا پیام روشن می‌دهد. کلاس ۳۰ نفر ماند.', (t) => t.add(reza.state('idle', 'پیام به کاربر')).add(reza.msg('ظرفیت این گروه تکمیل شد.', 'ink', false), 0.2))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}
