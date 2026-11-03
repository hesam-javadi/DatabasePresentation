import { newSlide, Slide } from '../core/deck';
import { h, show } from '../core/dom';

/** Chapter card over a live field of thousands of items changing status. */
export function chapterSlide(stage: HTMLElement): Slide {
  const { el, master, step } = newSlide(stage, 's-chapter');
  const cv = h('canvas', 'field', '', el) as HTMLCanvasElement;
  cv.width = 1920; cv.height = 1080;
  const g = cv.getContext('2d')!;

  const card = h('div', 'ch-card', `
    <div class="kicker">بخش سوم · یک مورد واقعی</div>
    <h1><span dir="ltr">BulkOperation</span> در <span dir="ltr">pep&#8209;mms</span></h1>
    <p>یک درخواست، صدها هزار آیتم، چند نمونهٔ هم‌زمان سرویس، و یک پایگاه داده.</p>
    <div class="facts">
      <div><b>۵۰۰٬۰۰۰</b><span>آیتم در آزمون بار</span></div>
      <div><b>۳</b><span>نمونهٔ هم‌زمان API</span></div>
      <div><b>۱</b><span>منبع حقیقت: SQL Server</span></div>
    </div>
    <div class="req">هیچ آیتمی <b>دو بار</b> اجرا نشود، و هیچ آیتمی <b>جا نماند</b>.</div>
  `, el);
  const facts = card.querySelector('.facts') as HTMLElement;
  const req = card.querySelector('.req') as HTMLElement;
  h('div', 'field-fade', '', el);
  const legend = h('div', 'field-legend', `<span><i class="q"></i>Queued</span><span><i class="p"></i>Processing</span><span><i class="s"></i>Succeeded</span><span><i class="f"></i>Failed</span>`, el);
  legend.dir = 'ltr';
  facts.style.opacity = '0';
  req.style.opacity = '0';

  // the field: each square is one item; a processing front sweeps right → left
  const S = 16, GAP = 5, cols = Math.ceil(1920 / (S + GAP)), rows = Math.ceil(1080 / (S + GAP));
  const seed = Array.from({ length: cols * rows }, () => Math.random());
  let raf = 0, t0 = 0;
  const draw = (now: number) => {
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    g.clearRect(0, 0, 1920, 1080);
    const front = ((t * 0.1 + 0.35) % 1.3) * cols; // columns processed from the right
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i, r = seed[k];
        const fromRight = cols - 1 - i + (r - 0.5) * 9 + Math.sin(j * 0.35) * 3;
        let c: string;
        if (fromRight < front - 4) c = r < 0.012 ? '#e0313b' : '#7fcbb0';
        else if (fromRight < front) c = r < 0.33 ? '#2856e6' : r < 0.36 ? '#dc8300' : '#a9bdf5';
        else c = '#dde3ec';
        g.fillStyle = c;
        g.fillRect(i * (S + GAP), j * (S + GAP), S, S);
      }
    }
    raf = requestAnimationFrame(draw);
  };

  step((t) => {
    t.add(show(card, { y: 40, dur: 0.8 }), 0.1)
      .fromTo(cv, { opacity: 0 }, { opacity: 0.75, duration: 1.0, immediateRender: false }, 0)
      .add(show(legend, { y: 10 }), 0.6);
  });
  step((t) => {
    t.add(show(facts.children as unknown as Element[], { y: 20, stagger: 0.15 }), 0)
      .set(facts, { opacity: 1 }, 0)
      .add(show(req, { y: 14 }), 0.7);
  });

  return {
    id: 'chapter', chapter: 'بخش سوم · یک مورد واقعی', label: 'BulkOperation', steps: 2, el, tl: master,
    onStep: (s) => {
      cancelAnimationFrame(raf);
      if (s > 0) { raf = requestAnimationFrame(draw); }
    },
  };
}
