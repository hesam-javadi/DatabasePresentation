import { build } from '../core/build';
import { h } from '../core/dom';
import { arrow, fly, ruleCard, tag } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';
import { CH, sections, SEC, card, k, cm, hl } from './common';

// ---------------------------------------------------------------- pessimistic: reserve first, decide second

const UPD = `${k('BEGIN TRAN')}\ne = ${k('SELECT')} Enrolled\n  ${k('FROM')} Sections\n  ${hl(k('WITH (UPDLOCK, ROWLOCK)'))}\n  ${k('WHERE')} Id = 2\n${cm('check prerequisites')}\n${k('UPDATE')} … Enrolled = e+1`;

export function pessimistic(stage: HTMLElement) {
  const b = build(stage, { id: 'pess', chapter: CH.tools, label: 'Pessimistic Locking', title: 'اول رزرو، بعد تصمیم', term: 'Pessimistic · UPDLOCK' });
  const tb = sections(b.el, [SEC.g1(), SEC.g2('29'), SEC.os()]);
  const mem = [{ key: 'e' }];
  const sara = card.right(b.el, 't1', 'T1', { name: 'سارا', sub: 'ثبت‌نام با بررسی پیش‌نیاز', exec: UPD, mem });
  const reza = card.left(b.el, 't2', 'T2', { name: 'رضا', sub: 'ثبت‌نام با بررسی پیش‌نیاز', exec: UPD, mem });
  const R = tb.edge('2', 'right', 10), L = tb.edge('2', 'left', 10);
  const s1 = arrow(b.f, sara.side('left', 30), R, 't1', { bend: 0.1 });
  const r1 = arrow(b.f, reza.side('right', 30), { x: L.x - 84, y: L.y }, 't2', { bend: -0.1 });
  const rule = ruleCard(b.el, { name: 'Pessimistic Locking', tone: 'v', kicker: 'ابزار ۱', body: 'وقتی تصمیم پیچیده است و در یک UPDATE جا نمی‌شود، ردیف را <b>هنگام Read رزرو کنید</b> (<code>UPDLOCK</code>). قطعی و ساده است؛ بهایش Wait دیگران است. Transaction را کوتاه نگه دارید و هرگز منتظر کاربر نمانید.' });

  b.show('گاهی تصمیم در برنامه گرفته می‌شود (مثلاً بررسی پیش‌نیاز). پس ردیف را با <code>UPDLOCK</code> Read می‌کنیم: «Read و رزرو برای Write».', [sara.el, reza.el], (t) => t.add(tb.focus('2', true), 0))
    .s('سارا Read می‌کند و ردیف را رزرو می‌کند: <b>Update Lock (U)</b>. برنامه‌اش پیش‌نیازها را بررسی می‌کند.', (t) => t.add(sara.state('run', 'Running')).add(s1.draw(0.8), 0.2).add(tb.lock('2', 't1', 'T1', 'U', 'right'), 1.0).add(fly(b.f, tb.cell('2', 'enr'), sara.memPos('e'), '29', 't1', { dur: 1.2 }), 1.4).add(sara.mem('e', '29'), 2.6).add(s1.hide(), 2.6).add(sara.msg(`${ICON.check} پیش‌نیاز: پایگاه داده ۱`, 'ok', false), 2.9))
    .s('رضا هم می‌خواهد رزرو کند؛ <b>U با U کنار نمی‌آید</b>. Wait می‌کند.', (t) => t.add(reza.state('run', 'Running')).add(r1.draw(0.8), 0.2).add(tb.wait('2', 't2', 'T2', 'left'), 1.0).add(reza.state('wait', 'Waiting'), 1.0))
    .s('سارا Write می‌کند (U به X تبدیل می‌شود) و Commit.', (t) => t.add(tb.unlock('2', 't1')).add(tb.lock('2', 't1', 'T1', 'X', 'right'), 0.3).add(tb.set('2', 'enr', '30', { wet: 't1' }), 0.8).add(tb.dry('2'), 1.6).add(tb.unlock('2', 't1'), 1.8).add(sara.state('ok', 'Committed'), 1.9))
    .s('حالا رضا رزرو می‌کند و مقدارِ <b>تازه</b> را می‌بیند: ۳۰. کلاس پر است؛ چیزی Write نمی‌کند و پیام روشن می‌گیرد.', (t) => t.add(r1.hide()).add(tb.unwait('2', 't2'), 0).add(tb.lock('2', 't2', 'T2', 'U', 'left'), 0.3).add(fly(b.f, tb.cell('2', 'enr'), reza.memPos('e'), '30', 't2', { dur: 1.2 }), 0.7).add(reza.mem('e', '30'), 1.9)
      .add(tb.unlock('2', 't2'), 2.4).add(reza.state('idle', 'Done'), 2.6).add(reza.msg('ظرفیت این گروه تکمیل شد.', 'ink', false), 2.7))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- optimistic: rowversion

const SAVE = (room: string, v: string) => `${k('UPDATE')} Sections\n${k('SET')} Room = ${room}\n${k('WHERE')} Id = 2\n  ${hl(`${k('AND')} RowVersion = ${v}`)}`;

export function optimistic(stage: HTMLElement) {
  const b = build(stage, { id: 'opt', chapter: CH.tools, label: 'Optimistic Concurrency', title: 'کار کن، موقع ذخیره بسنج', term: 'Optimistic · rowversion' });
  const tb = new DbTable(b.el, {
    name: 'dbo.Sections', x: 620, y: 262, rowH: 84,
    cols: [{ key: 'id', label: 'Id', w: 90, kind: 'mono', pk: true }, { key: 'title', label: 'Title', w: 220 }, { key: 'room', label: 'Room', w: 170 }, { key: 'rv', label: 'RowVersion', w: 200, kind: 'mono' }],
    rows: [{ id: '1', title: 'پایگاه داده ۱', room: 'کلاس ۱۰۲', rv: '0x07C9' }, { id: '2', title: 'پایگاه داده ۲', room: 'کلاس ۱۰۴', rv: '0x07D1' }],
  });
  const mem = [{ key: 'v' }];
  const sadeghi = card.right(b.el, 't1', 'T1', { name: 'خانم صادقی', sub: 'فرم ویرایش کلاس', exec: `${k('SELECT')} Room, RowVersion\n${k('FROM')} Sections ${k('WHERE')} Id = 2`, mem });
  const nouri = card.left(b.el, 't2', 'T2', { name: 'آقای نوری', sub: 'فرم ویرایش کلاس', exec: `${k('SELECT')} Room, RowVersion\n${k('FROM')} Sections ${k('WHERE')} Id = 2`, mem });
  const R = tb.edge('2', 'right', 10), L = tb.edge('2', 'left', 10);
  const s1 = arrow(b.f, sadeghi.side('left', 50), R, 't1', { bend: 0.1 });
  const n1 = arrow(b.f, nouri.side('right', 50), L, 't2', { bend: -0.1 });
  const miss = tag(b.el, `${ICON.cross} <span dir="ltr">0x07D2 ≠ 0x07D1</span>`, 'bad mono check', { x: tb.cell('2', 'rv').x, y: tb.rowY('2') - 30 });
  b.hide(miss);
  const rule = ruleCard(b.el, { name: 'Optimistic Concurrency', tone: 'v', kicker: 'ابزار ۲', body: 'هیچ Lockی نگه نمی‌داریم. نسخهٔ ردیف را موقع Read به خاطر می‌سپاریم و موقع ذخیره شرط می‌کنیم که <b>هنوز همان باشد</b>. <b>۰ ردیف</b> یعنی کس دیگری زودتر تغییر داده. مناسب جایی که تعارض کم است و آدم‌ها کُند.' });

  b.show('دو کارمند فرم ویرایش یک کلاس را باز کرده‌اند؛ فرم دقیقه‌ها باز می‌ماند و نمی‌شود این‌همه مدت Lock نگه داشت.', [sadeghi.el, nouri.el], (t) => t.add(tb.focus('2', true), 0))
    .s('هر دو ردیف را Read می‌کنند و <code>RowVersion</code> را به خاطر می‌سپارند؛ این ستون با <b>هر تغییر</b> خودبه‌خود عوض می‌شود.', (t) => t.add(tb.mark('2', 'rv', 'v'), 0)
      .add(s1.draw(0.8), 0.3).add(tb.flash('2', 't1', 0.5), 1.1).add(fly(b.f, tb.cell('2', 'rv'), sadeghi.memPos('v'), '0x07D1', 't1', { dur: 1.2 }), 1.3).add(sadeghi.mem('v', '0x07D1'), 2.5).add(s1.hide(), 2.5)
      .add(n1.draw(0.8), 1.0).add(tb.flash('2', 't2', 0.5), 1.8).add(fly(b.f, tb.cell('2', 'rv'), nouri.memPos('v'), '0x07D1', 't2', { dur: 1.2 }), 2.0).add(nouri.mem('v', '0x07D1'), 3.2).add(n1.hide(), 3.2))
    .s('خانم صادقی ذخیره می‌کند، به شرطِ این‌که نسخه هنوز همان باشد. هست: <b>۱ ردیف</b>، و نسخه عوض می‌شود.', (t) => t.add(sadeghi.exec(SAVE(`N'<span class="fa-in">کلاس ۲۰۸</span>'`, '0x07D1'))).add(s1.draw(0.8), 0.3).add(tb.lock('2', 't1', 'T1', 'X', 'right'), 1.1).add(tb.set('2', 'room', 'کلاس ۲۰۸', { wet: 't1' }), 1.5).add(tb.set('2', 'rv', '0x07D2', { wet: 't1' }), 1.7).add(tb.dry('2'), 2.4).add(tb.unlock('2', 't1'), 2.5).add(sadeghi.msg('(1 row affected)', 'ok'), 2.5).add(s1.hide(), 2.6))
    .s('آقای نوری با نسخهٔ <b>قدیمی</b> ذخیره می‌کند. شرط برقرار نیست: <b class="kbad">۰ ردیف</b>؛ چیزی بازنویسی نشد.', (t) => t.add(nouri.exec(SAVE(`N'<span class="fa-in">سالن ۳</span>'`, '0x07D1'))).add(n1.draw(0.8), 0.3).fromTo(miss, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, immediateRender: false }, 1.2).to(tb.cellEl('2', 'rv'), { x: 6, duration: 0.07, yoyo: true, repeat: 5 }, 1.3).add(nouri.msg('(0 rows affected)', 'bad'), 1.8).add(n1.hide(), 2.0))
    .s('برنامه به آقای نوری می‌گوید چه شد: دوباره بارگذاری کند.', (t) => t.to(miss, { opacity: 0, duration: 0.3 }).add(nouri.msg('کس دیگری زودتر تغییر داد؛ دوباره بارگذاری کنید.', 'ink', false), 0.2))
    .s(null, (t) => t.add(rule.show()));
  return b.done();
}

// ---------------------------------------------------------------- which tool when

export function toolsTable(stage: HTMLElement) {
  const b = build(stage, { id: 'tools', chapter: CH.tools, label: 'کدام ابزار؟', title: 'سه ابزار؛ کِی کدام؟' });
  const g = h('div', 'dtable', '', b.el);
  const head = ['', 'کِی؟', 'چه کسی Wait می‌کند؟', 'برنامه چه می‌بیند؟'].map((x) => h('div', 'dh', x, g));
  const rows = [
    ['Pessimistic', 'WITH (UPDLOCK)', 'تصمیم پیچیده در برنامه، تعارض زیاد', 'نفر دوم، تا اولی تمام کند', 'همیشه مقدار تازه'],
    ['Optimistic', 'RowVersion = @v', 'فرم‌های طولانی، تعارض کم', 'هیچ‌کس', '۰ ردیف ← دوباره بارگذاری'],
    ['Conditional UPDATE', 'WHERE … AND …', 'شرط ساده که در خود دستور جا می‌شود', 'فقط به اندازهٔ یک دستور', '۱ ردیف یعنی بردی، ۰ یعنی دیر رسیدی'],
  ].map(([n, c, a, w, s], i) => [h('div', 'dn', `${n}<code dir="ltr">${c}</code>`, g), h('div', '', a, g), h('div', '', w, g), h('div', '', s, g)].map((e) => { if (i === 2) e.classList.add('hot'); return e; }));
  b.show('سه ابزار؛ هر کدام جای خودش. <b>Pessimistic</b>: وقتی تصمیم در برنامه گرفته می‌شود و تعارض زیاد است.', [...head, ...rows[0]], undefined, { stagger: 0.06 })
    .show('<b>Optimistic</b>: وقتی آدم‌ها کُندند و تعارض کم است.', rows[1], undefined, { stagger: 0.08 })
    .show('و <b>Conditional UPDATE</b>: ساده‌ترین و ارزان‌ترین؛ <b>ستون اصلی سامانهٔ واقعی‌ای که الان می‌بینیم</b>.', rows[2], undefined, { stagger: 0.08 });
  return b.done();
}

