import gsap from 'gsap';
import { newSlide, Slide } from '../core/deck';
import { h, show, pop } from '../core/dom';
import { frame, arrow } from '../kit/parts';
import { DbTable } from '../kit/table';
import { ICON } from '../kit/icons';

const CH = 'بخش اول · مشکلات';

function phone(root: HTMLElement, tone: 't1' | 't2', name: string, device: string, x: number) {
  const el = h('div', `phone t-${tone}`, `
    <div class="ph-body"><div class="ph-screen">
      <div class="ph-bar"><span>۱۱:۵۹</span><i></i></div>
      <div class="ph-app">
        <div class="ph-route"><b>تهران</b>${ICON.plane}<b>مشهد</b></div>
        <div class="ph-date">پنجشنبه · پرواز ۴۵۲ · ۱۸:۳۰</div>
        <div class="ph-seats" dir="ltr">
          <span class="rowno">14</span><i class="seat">A</i><i class="seat">B</i><span class="aisle"></span><i class="seat free">C</i><i class="seat">D</i>
        </div>
        <div class="ph-left">فقط <b>۱</b> صندلی باقی مانده</div>
        <div class="ph-sel"><span>صندلی انتخابی</span><b dir="ltr">14C</b></div>
        <div class="ph-sel"><span>قیمت</span><b>۲٬۴۰۰٬۰۰۰ تومان</b></div>
        <div class="ph-btn">پرداخت و رزرو<i class="tap"></i></div>
      </div>
      <div class="ph-wait"><i class="spin"></i><span>در حال رزرو…</span></div>
      <div class="ph-done"><div class="okc">${ICON.check}</div><b>رزرو شد</b><span>صندلی <span dir="ltr">14C</span> به نام ${name}</span></div>
    </div></div>
    <div class="ph-name"><b>${name}</b><span>${device}</span></div>
  `, root);
  el.style.left = `${x}px`;
  el.style.top = '252px';
  const q = (s: string) => el.querySelector(s) as HTMLElement;
  return { el, body: q('.ph-body'), btn: q('.ph-btn'), tap: q('.tap'), wait: q('.ph-wait'), done: q('.ph-done'), name: q('.ph-name') };
}

function pass(root: HTMLElement, tone: 't1' | 't2', name: string) {
  const el = h('div', `pass t-${tone}`, `
    <div class="ps-top">${ICON.plane}<span>کارت پرواز</span><em dir="ltr">THR → MHD · 452</em></div>
    <div class="ps-main"><div><small>مسافر</small><b>${name}</b></div><div><small>صندلی</small><b class="mono" dir="ltr">14C</b></div></div>
  `, root);
  gsap.set(el, { opacity: 0 });
  return el;
}

/** Real-life opener: two phones, one seat, fifteen milliseconds apart. */
export function storySlide(stage: HTMLElement): Slide {
  const { el, master, step } = newSlide(stage, 's-story');
  const f = frame(el, 'آخرین صندلی پرواز', 'Race Condition');

  const reza = phone(el, 't2', 'رضا', 'وب‌سایت · مشهد', 450);
  const sara = phone(el, 't1', 'سارا', 'اپ موبایل · تهران', 1140);
  [reza, sara].forEach((p) => gsap.set([p.wait, p.done], { opacity: 0 }));

  // a tiny server log between the phones: who pressed when
  const log = h('div', 'clocklog', `
    <label>لاگ سرور</label>
    <div class="cl-row t-t1"><i></i><span>سارا</span><b>۱۲:۰۰:۰۰٫۱۲۰</b></div>
    <div class="cl-row t-t2"><i></i><span>رضا</span><b>۱۲:۰۰:۰۰٫۱۳۵</b></div>
    <div class="cl-gap">فاصله: <b>۱۵ میلی‌ثانیه</b></div>`, el);
  const logRows = Array.from(log.children);
  gsap.set(log, { opacity: 0 });

  const passR = pass(el, 't2', 'رضا');
  const passS = pass(el, 't1', 'سارا');
  passS.style.zIndex = '5';
  const stamp = h('div', 'stamp', 'یک صندلی، دو مسافر', el);
  gsap.set(stamp, { opacity: 0 });

  const row = new DbTable(el, {
    name: 'dbo.Seats', x: 705, y: 744, rowH: 84,
    cols: [
      { key: 'seat', label: 'SeatNo', w: 140, kind: 'mono', pk: true },
      { key: 'status', label: 'Status', w: 180, kind: 'pill' },
      { key: 'pax', label: 'Passenger', w: 190 },
    ],
    rows: [{ id: '14C', seat: '14C', status: 'Free', pax: 'NULL' }],
  });
  gsap.set(row.el, { opacity: 0 });
  const aS = arrow(f, { x: 1316, y: 610 }, row.edge('14C', 'right', 14), 't1', { bend: -0.3 });
  const aR = arrow(f, { x: 604, y: 610 }, row.edge('14C', 'left', 14), 't2', { bend: 0.3 });

  step((t) => {
    t.add(f.narr.to('پرواز تهران–مشهد فقط <b>یک</b> صندلی خالی دارد: <code>14C</code>. دو نفر هم‌زمان صفحهٔ پرداخت را باز کرده‌اند.'), 0.2)
      .add(show([reza.el, sara.el], { y: 60, dur: 0.9, stagger: 0.15 }), 0);
  });

  step((t) => {
    t.add(f.narr.to('سارا و رضا با <b>۱۵ میلی‌ثانیه</b> فاصله دکمهٔ پرداخت را می‌زنند.'), 0)
      .fromTo(sara.tap, { opacity: 0.8, scale: 0 }, { opacity: 0, scale: 3, duration: 0.6, immediateRender: false }, 0.3)
      .to(sara.btn, { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1 }, 0.3)
      .fromTo(reza.tap, { opacity: 0.8, scale: 0 }, { opacity: 0, scale: 3, duration: 0.6, immediateRender: false }, 0.45)
      .to(reza.btn, { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1 }, 0.45)
      .set(log, { opacity: 1 }, 0.35)
      .add(show(logRows, { y: 12, stagger: 0.18 }), 0.35)
      .to([sara.wait, reza.wait], { opacity: 1, duration: 0.3, stagger: 0.15 }, 0.6);
  });

  step((t) => {
    t.add(f.narr.to('هر دو پیام <b class="kok">«رزرو شد»</b> می‌گیرند. هیچ‌کدام خطایی نمی‌بیند.'), 0)
      .to([sara.wait, reza.wait], { opacity: 0, duration: 0.25 }, 0.3)
      .add(pop([sara.done, reza.done], { stagger: 0.25, dur: 0.6 }), 0.4);
  });

  step((t) => {
    t.add(f.narr.to('روز پرواز: دو کارت پرواز برای یک صندلی. پشت هر دو صفحه، فقط <b>یک ردیف</b> بود.'), 0)
      .to(sara.el, { x: 150, scale: 0.86, duration: 0.9, ease: 'power3.inOut' }, 0)
      .to(reza.el, { x: -150, scale: 0.86, duration: 0.9, ease: 'power3.inOut' }, 0)
      .to(log, { opacity: 0, duration: 0.3 }, 0)
      .fromTo(passR, { opacity: 0, x: 380, y: 520, rotation: -12, scale: 0.6 }, { opacity: 1, x: 690, y: 384, rotation: -4, scale: 1, duration: 0.9, ease: 'power3.out', immediateRender: false }, 0.5)
      .fromTo(passS, { opacity: 0, x: 1220, y: 520, rotation: 12, scale: 0.6 }, { opacity: 1, x: 900, y: 262, rotation: 4, scale: 1, duration: 0.9, ease: 'power3.out', immediateRender: false }, 0.7)
      .fromTo(stamp, { opacity: 0, scale: 2.2, rotation: -14 }, { opacity: 1, scale: 1, rotation: -9, duration: 0.45, ease: 'power4.in', immediateRender: false }, 1.6)
      .to([passS, passR], { x: '+=4', duration: 0.06, yoyo: true, repeat: 3 }, 2.05)
      .add(show(row.el, { y: 30 }), 2.4)
      .add(aS.draw(0.6), 2.9)
      .add(aR.draw(0.6), 3.0)
      .add(row.focus('14C', true, 'ink'), 3.4);
  });

  return { id: 'story', chapter: CH, label: 'آخرین صندلی', steps: 4, el, tl: master };
}
