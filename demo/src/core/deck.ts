import gsap from 'gsap';
import { h, fa, W, H } from './dom';

/**
 * A slide owns a paused master timeline. Step k's animation ends at label `s{k}`.
 * Going forward one step plays from `s{k-1}` to `s{k}`; anything else seeks.
 */
export interface Slide {
  id: string;
  chapter: string;
  label: string;
  steps: number;
  /** consecutive slides in the same group crossfade without moving (shared layout) */
  group?: string;
  el: HTMLElement;
  tl: gsap.core.Timeline;
  /** called when the slide becomes current (step) or stops being current (0) */
  onStep?: (step: number) => void;
}

/** Build helper: each call appends one step to the master timeline. */
export function stepper(master: gsap.core.Timeline) {
  let n = 0;
  return (build: (t: gsap.core.Timeline) => void, hold = 0) => {
    n++;
    const t = gsap.timeline();
    build(t);
    master.add(t);
    if (hold) master.to({}, { duration: hold });
    master.addLabel(`s${n}`);
    return n;
  };
}

export function newSlide(stage: HTMLElement, cls = '') {
  const el = h('section', `slide ${cls}`, '', stage);
  const master = gsap.timeline({ paused: true });
  return { el, master, step: stepper(master) };
}

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Playback rate of every step animation (< 1 = slower than authored). */
export const PACE = 0.78;

export class Deck {
  slides: Slide[] = [];
  i = -1;
  s = 1;
  private run?: gsap.core.Tween;
  private top: HTMLElement;
  private prog: HTMLElement;
  private stepno: HTMLElement;
  readonly capture = new URLSearchParams(location.search).has('capture');

  constructor(public stage: HTMLElement) {
    this.top = h('header', 'chrome-top', '<span class="ch"></span><span class="num"></span>', stage);
    const bottom = h('footer', 'chrome-bottom', '', stage);
    this.prog = h('div', 'prog', '', bottom);
    this.stepno = h('span', 'stepno', '', bottom);
  }

  add(s: Slide) {
    s.el.style.visibility = 'hidden';
    s.el.style.opacity = '0';
    this.slides.push(s);
  }

  start() {
    this.prog.innerHTML = this.slides.map(() => '<i><b></b></i>').join('');
    addEventListener('keydown', (e) => this.key(e));
    addEventListener('hashchange', () => this.fromHash());
    addEventListener('click', (e) => { if (e.button === 0) this.next(); });
    addEventListener('contextmenu', (e) => { e.preventDefault(); this.prev(); });
    let last = 0;
    addEventListener('wheel', (e) => {
      const now = performance.now();
      if (Math.abs(e.deltaY) < 30 || now - last < 650) return;
      last = now;
      e.deltaY > 0 ? this.next() : this.prev();
    }, { passive: true });
    let idle = 0;
    addEventListener('mousemove', () => {
      document.body.classList.remove('idle');
      clearTimeout(idle);
      idle = window.setTimeout(() => document.body.classList.add('idle'), 2200);
    });
    if (!this.fromHash()) this.goto(0, 1);
  }

  private fromHash() {
    const m = location.hash.match(/^#(\d+)(?:[.-](\d+))?/);
    if (!m) return false;
    const i = Math.min(this.slides.length - 1, Math.max(0, +m[1] - 1));
    const s = Math.min(this.slides[i].steps, Math.max(1, +(m[2] ?? 1)));
    if (i !== this.i || s !== this.s) this.goto(i, s, true);
    return true;
  }

  private key(e: KeyboardEvent) {
    const k = e.key;
    if ([' ', 'PageDown', 'ArrowLeft', 'ArrowDown', 'Enter'].includes(k)) { e.preventDefault(); this.next(); }
    // RTL: ← goes forward, → goes back
    else if (['PageUp', 'ArrowRight', 'ArrowUp', 'Backspace'].includes(k)) { e.preventDefault(); this.prev(); }
    else if (k === 'Home') this.goto(0, 1, true);
    else if (k === 'End') this.goto(this.slides.length - 1, 1, true);
    else if (k === 'r' || k === 'R') this.replay();
    else if (k === 'f' || k === 'F') {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
    } else if (k === 'b' || k === 'B' || k === '.') document.body.classList.toggle('blank');
  }

  private queued = false;

  next() {
    // a step is still playing: let it finish (faster) and then play the next one, so nothing is skipped
    if (this.run && this.run.isActive()) {
      this.run.timeScale(2.5);
      this.queued = true;
      return;
    }
    const sl = this.slides[this.i];
    if (this.s < sl.steps) this.goto(this.i, this.s + 1);
    else if (this.i < this.slides.length - 1) this.goto(this.i + 1, 1);
  }

  prev() {
    this.queued = false;
    if (this.s > 1) this.goto(this.i, this.s - 1);
    else if (this.i > 0) this.goto(this.i - 1, this.slides[this.i - 1].steps);
  }

  /** Re-run the current step's animation. */
  replay() {
    const sl = this.slides[this.i];
    this.seek(sl, this.s - 1);
    this.play(sl, this.s);
  }

  goto(i: number, s: number, jump = false) {
    const prev = this.slides[this.i];
    const sl = this.slides[i];
    const forward = i > this.i || (i === this.i && s > this.s);
    if (i !== this.i) {
      if (prev) this.transition(prev, sl, forward);
      else this.reveal(sl, 0, 0);
      prev?.onStep?.(0);
      this.i = i;
      this.s = s;
      if (forward && s === 1 && !jump) this.play(sl, 1, prev ? 0.35 : 0.1);
      else this.seek(sl, s);
    } else {
      const one = s === this.s + 1 && !jump;
      this.s = s;
      if (one) this.play(sl, s);
      else this.seek(sl, s);
    }
    history.replaceState(null, '', `#${i + 1}-${s}`);
    this.chrome();
  }

  private play(sl: Slide, s: number, delay = 0) {
    this.run?.kill();
    const from = s <= 1 ? 0 : sl.tl.labels[`s${s - 1}`];
    const to = sl.tl.labels[`s${s}`];
    sl.tl.pause();
    sl.tl.time(from, false);
    if (reduced) { sl.tl.time(to, false); sl.onStep?.(s); return; }
    this.run = gsap.to(sl.tl, {
      time: to, duration: Math.max(0.01, (to - from) / PACE), ease: 'none', delay,
      onComplete: () => {
        sl.onStep?.(s);
        if (this.queued) { this.queued = false; this.next(); }
      },
    });
    sl.onStep?.(s);
  }

  private seek(sl: Slide, s: number) {
    this.run?.kill();
    this.queued = false;
    sl.tl.pause();
    sl.tl.time(s <= 0 ? 0 : sl.tl.labels[`s${s}`], false);
    if (s > 0) sl.onStep?.(s);
  }

  private reveal(sl: Slide, dx: number, delay: number) {
    gsap.killTweensOf(sl.el);
    gsap.fromTo(sl.el, { autoAlpha: 0, x: dx }, { autoAlpha: 1, x: 0, duration: 0.6, delay, ease: 'power3.out' });
  }

  private transition(from: Slide, to: Slide, forward: boolean) {
    const same = !!from.group && from.group === to.group;
    // RTL: the talk moves leftwards, so new content arrives from the left
    const d = same ? 0 : forward ? 70 : -70;
    gsap.killTweensOf(from.el);
    gsap.to(from.el, { autoAlpha: 0, x: d, duration: same ? 0.45 : 0.45, ease: 'power2.in' });
    this.reveal(to, -d, same ? 0.2 : 0.3);
  }

  private chrome() {
    const sl = this.slides[this.i];
    (this.top.querySelector('.ch') as HTMLElement).textContent = sl.chapter;
    (this.top.querySelector('.num') as HTMLElement).innerHTML = this.i === 0 ? '' : `<b>${fa(this.i + 1)}</b> / ${fa(this.slides.length)}`;
    this.top.classList.toggle('off', this.i === 0);
    this.prog.querySelectorAll('i').forEach((b, k) => {
      b.classList.toggle('cur', k === this.i);
      b.classList.toggle('done', k < this.i);
      const fill = b.querySelector('b') as HTMLElement;
      const p = k < this.i ? 1 : k > this.i ? 0 : this.s / sl.steps;
      fill.style.transform = `scaleX(${p})`;
    });
    this.stepno.textContent = sl.steps > 1 ? `مرحلهٔ ${fa(this.s)} از ${fa(sl.steps)}` : '';
  }
}

/** Scale the fixed 1920×1080 stage into the window. */
export function fitStage(stage: HTMLElement) {
  const fit = () => {
    const k = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(${(innerWidth - W * k) / 2}px, ${(innerHeight - H * k) / 2}px) scale(${k})`;
  };
  addEventListener('resize', fit);
  fit();
}
