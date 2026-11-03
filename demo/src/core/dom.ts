import gsap from 'gsap';

export const W = 1920;
export const H = 1080;

/** Create an element, optionally with classes, inner HTML and a parent. */
export function h<K extends keyof HTMLElementTagNameMap = 'div'>(
  tag: K | string = 'div', cls = '', html = '', parent?: Element,
): HTMLElement {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  parent?.appendChild(el);
  return el;
}

/** Absolute placement in stage pixels. */
export function at(el: HTMLElement, x: number, y: number, w?: number, hh?: number) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  if (w !== undefined) el.style.width = `${w}px`;
  if (hh !== undefined) el.style.height = `${hh}px`;
  return el;
}

export interface Box { x: number; y: number; w: number; h: number; cx: number; cy: number; r: number; b: number }

/** Layout box of `el` relative to `root`, in unscaled stage pixels (ignores transforms). */
export function pos(el: HTMLElement, root: HTMLElement): Box {
  let x = 0, y = 0;
  let e: HTMLElement | null = el;
  while (e && e !== root) {
    x += e.offsetLeft;
    y += e.offsetTop;
    e = e.offsetParent as HTMLElement | null;
  }
  const w = el.offsetWidth, hh = el.offsetHeight;
  return { x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2, r: x + w, b: y + hh };
}

export interface P { x: number; y: number }

const FA = '۰۱۲۳۴۵۶۷۸۹';
/** Persian digits; `group` adds the ٬ thousands separator. */
export function fa(n: number | string, group = false) {
  let s = String(n);
  if (group) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return s.replace(/\d/g, (d) => FA[+d]);
}

/** A sub-timeline for one build step. */
export function tl() {
  return gsap.timeline();
}

/**
 * A box whose children are stacked in one grid cell, so content can be swapped with a crossfade.
 * Every swap creates a new child at build time; the returned timeline is reversible.
 */
export function swapper(box: HTMLElement, initial?: string, cls = '') {
  box.classList.add('swap');
  let cur: HTMLElement | null = null;
  if (initial !== undefined) cur = h('div', `sw ${cls}`, initial, box);
  return {
    get cur() { return cur; },
    to(html: string, o: { cls?: string; dy?: number; dur?: number } = {}) {
      const el = h('div', `sw ${o.cls ?? cls}`, html, box);
      gsap.set(el, { opacity: 0 });
      const t = gsap.timeline();
      const dy = o.dy ?? 14;
      if (cur) t.to(cur, { opacity: 0, y: -dy, duration: 0.28, ease: 'power2.in' }, 0);
      t.fromTo(el, { opacity: 0, y: dy }, { opacity: 1, y: 0, duration: o.dur ?? 0.45, ease: 'power3.out', immediateRender: false }, cur ? 0.14 : 0);
      cur = el;
      return t;
    },
  };
}

export type Swapper = ReturnType<typeof swapper>;

/** Fade/raise an element into view (it should start at opacity 0). */
export function show(el: Element | Element[], o: { y?: number; x?: number; scale?: number; dur?: number; ease?: string; stagger?: number } = {}) {
  return gsap.fromTo(el,
    { opacity: 0, y: o.y ?? 16, x: o.x ?? 0, scale: o.scale ?? 1 },
    { opacity: 1, y: 0, x: 0, scale: 1, duration: o.dur ?? 0.55, ease: o.ease ?? 'power3.out', stagger: o.stagger ?? 0, immediateRender: false });
}

export function hide(el: Element | Element[], o: { y?: number; dur?: number } = {}) {
  return gsap.to(el, { opacity: 0, y: o.y ?? 0, duration: o.dur ?? 0.35, ease: 'power2.in' });
}

/** Pop a badge in with a little overshoot. */
export function pop(el: Element | Element[], o: { dur?: number; stagger?: number } = {}) {
  return gsap.fromTo(el, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: o.dur ?? 0.5, ease: 'back.out(2.2)', stagger: o.stagger ?? 0, immediateRender: false });
}

/** Hold the timeline still for a moment (lets the eye catch up). */
export function wait(t: gsap.core.Timeline, d: number) {
  t.to({}, { duration: d });
  return t;
}

/** Screen box of a (possibly 3D-transformed) element, converted to stage pixels. */
export function screenBox(el: Element, stage: HTMLElement): Box {
  const s = stage.getBoundingClientRect();
  const k = s.width / W;
  const r = el.getBoundingClientRect();
  const x = (r.left - s.left) / k, y = (r.top - s.top) / k, w = r.width / k, hh = r.height / k;
  return { x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2, r: x + w, b: y + hh };
}
