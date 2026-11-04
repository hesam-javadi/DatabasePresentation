import gsap from 'gsap';
import { h, pos, swapper, Swapper, P, fa } from '../core/dom';
import { ICON } from './icons';
import { Tone } from './table';

// ---------------------------------------------------------------- slide scaffold

export interface Frame {
  root: HTMLElement;
  svg: SVGSVGElement;
  fx: HTMLElement;
  narr: Swapper;
  title: HTMLElement;
}

/** Title row, narration line, an SVG layer for arrows and a layer for flying chips. */
export function frame(root: HTMLElement, title: string, term = '', o: { narrW?: number } = {}): Frame {
  const head = h('div', 'title-row', `<h1 class="h1">${title}</h1>${term ? `<span class="term" dir="ltr">${term}</span>` : ''}`, root);
  const narrBox = h('div', 'narr', '', root);
  if (o.narrW) narrBox.style.width = `${o.narrW}px`;
  const narr = swapper(narrBox);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'fx-svg');
  svg.setAttribute('viewBox', '0 0 1920 1080');
  root.appendChild(svg);
  const fx = h('div', 'fx-layer', '', root);
  return { root, svg, fx, narr, title: head };
}

/** A child frame with its own arrow and chip layers inside `root` (for slides with swappable layers). */
export function subFrame(f: Frame, root: HTMLElement): Frame {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'fx-svg');
  svg.setAttribute('viewBox', '0 0 1920 1080');
  root.appendChild(svg);
  return { ...f, root, svg, fx: h('div', 'fx-layer', '', root) };
}

// ---------------------------------------------------------------- transaction card

export interface TxnOpts {
  tone: Tone;
  who: string;
  name: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  mem?: { key: string; init?: string }[];
  exec?: string;
  execLabel?: string;
  memLabel?: string;
  noExec?: boolean;
}

export type TxnState = 'idle' | 'run' | 'wait' | 'ok' | 'bad' | 'dead' | 'pause';

const STATE_ICON: Record<TxnState, string> = {
  idle: '', run: ICON.bolt, wait: ICON.hourglass, ok: ICON.check, bad: ICON.cross, dead: ICON.skull, pause: ICON.pause,
};

/** A session: who it is, the statement it is executing, what it holds in memory, what it was told. */
export class TxnCard {
  el: HTMLElement;
  private execS?: Swapper;
  private stateS: Swapper;
  private msgS: Swapper;
  private memS = new Map<string, Swapper>();
  private memSlot = new Map<string, HTMLElement>();

  constructor(private root: HTMLElement, public o: TxnOpts) {
    this.el = h('div', `txn t-${o.tone}`, '', root);
    this.el.style.left = `${o.x}px`;
    this.el.style.top = `${o.y}px`;
    this.el.style.width = `${o.w}px`;
    const head = h('div', 'tx-head', `<span class="tx-badge">${o.who}</span><div class="tx-who"><b>${o.name}</b><small>${o.sub}</small></div>`, this.el);
    this.stateS = swapper(h('div', 'tx-state', '', head), '');
    if (!o.noExec) {
      const sec = h('div', 'tx-sec', `<label>${o.execLabel ?? 'در حال اجرا'}</label>`, this.el);
      this.execS = swapper(h('div', 'tx-exec', '', sec), `<pre>${o.exec ?? '<span class="cm">-- منتظر شروع</span>'}</pre>`);
      (sec.lastElementChild as HTMLElement).dir = 'ltr';
    }
    if (o.mem?.length) {
      const sec = h('div', 'tx-sec', `<label>${o.memLabel ?? 'حافظهٔ برنامه'}</label>`, this.el);
      const box = h('div', 'tx-mem', '', sec);
      box.dir = 'ltr';
      o.mem.forEach((m) => {
        const slot = h('div', 'slot', `<code class="mk">${m.key}</code><span class="eq">=</span>`, box);
        this.memSlot.set(m.key, slot);
        this.memS.set(m.key, swapper(h('div', 'mv', '', slot), m.init ?? '<span class="null">?</span>'));
      });
    }
    this.msgS = swapper(h('div', 'tx-msg', '', this.el), '');
  }

  exec(code: string) { return this.execS!.to(`<pre>${code}</pre>`); }
  mem(key: string, html: string, cls = '') { return this.memS.get(key)!.to(html, { cls }); }

  /** Mark a remembered value as stale (red outline pulse). */
  stale(key: string, on = true) {
    const slot = this.memSlot.get(key)!;
    return gsap.to(slot, { '--stale': on ? 1 : 0, duration: 0.4 });
  }

  state(kind: TxnState, text: string) {
    return this.stateS.to(kind === 'idle' && !text ? '' : `<span class="st st-${kind}">${STATE_ICON[kind]}<span>${text}</span></span>`, { dy: 8 });
  }

  /** What the database answered (rows affected, errors, app messages). */
  msg(html: string, tone: 'ok' | 'bad' | 'ink' | 'mute' = 'ink', ltr = true) {
    return this.msgS.to(html ? `<div class="m m-${tone}" dir="${ltr ? 'ltr' : 'rtl'}">${html}</div>` : '', { dy: 10 });
  }

  dim(on: boolean) { return gsap.to(this.el, { opacity: on ? 0.42 : 1, filter: on ? 'grayscale(1)' : 'grayscale(0)', duration: 0.5 }); }

  memPos(key: string): P { const b = pos(this.memSlot.get(key)!.querySelector('.mv') as HTMLElement, this.root); return { x: b.cx, y: b.cy }; }
  get box() { return pos(this.el, this.root); }
  /** Midpoint of the card's left or right edge, nudged vertically by `dy`. */
  side(side: 'left' | 'right', dy = 0): P {
    const b = this.box;
    return { x: side === 'left' ? b.x : b.r, y: b.y + 120 + dy };
  }
}

// ---------------------------------------------------------------- timeline lanes

export interface LanesOpts { x: number; y: number; w: number; ticks: number; lanes: { tone: Tone; label: string }[]; laneH?: number; labelW?: number }

/** Who did what, in which order. Time runs right → left (RTL). */
export class Lanes {
  el: HTMLElement;
  private colW: number;
  private laneH: number;
  private labelW: number;

  constructor(private root: HTMLElement, private o: LanesOpts) {
    this.laneH = o.laneH ?? 58;
    this.labelW = o.labelW ?? 176;
    this.colW = (o.w - this.labelW) / o.ticks;
    this.el = h('div', 'lanes', '', root);
    this.el.style.cssText = `left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.lanes.length * this.laneH + 46}px`;
    o.lanes.forEach((l, i) => {
      const lane = h('div', `lane t-${l.tone}`, `<span class="lane-name">${l.label}</span>`, this.el);
      lane.style.top = `${i * this.laneH}px`;
      lane.style.height = `${this.laneH}px`;
      (lane.firstElementChild as HTMLElement).style.width = `${this.labelW - 16}px`;
    });
    const ticks = h('div', 'ticks', '', this.el);
    ticks.style.top = `${o.lanes.length * this.laneH + 6}px`;
    for (let k = 1; k <= o.ticks; k++) {
      const t = h('span', '', fa(k), ticks);
      t.style.right = `${this.labelW + (k - 1) * this.colW}px`;
      t.style.width = `${this.colW}px`;
    }
    const axis = h('span', 'axis', `زمان ${ICON.arrowL}`, ticks);
    axis.style.left = '0';
  }

  private x(tick: number) { return this.o.w - this.labelW - tick * this.colW; }

  /** A chip in a lane at a tick (1-based). Spans `span` ticks. */
  ev(lane: number, tick: number, html: string, o: { cls?: string; span?: number } = {}) {
    const span = o.span ?? 1;
    const tone = this.o.lanes[lane].tone;
    const e = h('div', `ev t-${tone} ${o.cls ?? ''}`, html, this.el);
    e.dir = 'ltr';
    e.style.left = `${this.x(tick + span - 1) + 5}px`;
    e.style.top = `${lane * this.laneH + 7}px`;
    e.style.width = `${span * this.colW - 10}px`;
    e.style.height = `${this.laneH - 14}px`;
    gsap.set(e, { opacity: 0 });
    return gsap.fromTo(e, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false });
  }

  /** Dashed bracket around ticks t0..t1 of a lane, with a label. */
  bracket(lane: number, t0: number, t1: number, label: string, tone: Tone = 'bad') {
    const b = h('div', `bracket t-${tone}`, `<span>${label}</span>`, this.el);
    b.style.left = `${this.x(t1) + 1}px`;
    b.style.width = `${(t1 - t0 + 1) * this.colW - 2}px`;
    b.style.top = `${lane * this.laneH + 1}px`;
    b.style.height = `${this.laneH - 2}px`;
    gsap.set(b, { opacity: 0 });
    return gsap.fromTo(b, { opacity: 0, scaleX: 0.85 }, { opacity: 1, scaleX: 1, duration: 0.5, ease: 'power3.out', immediateRender: false });
  }

  /** Stage point at the centre of a lane cell. */
  at(lane: number, tick: number): P {
    const b = pos(this.el, this.root);
    return { x: b.x + this.x(tick) + this.colW / 2, y: b.y + lane * this.laneH + this.laneH / 2 };
  }
}

// ---------------------------------------------------------------- flying chips and arrows

/** A value chip that flies from one point to another along an arc. */
export function fly(f: Frame, a: P, b: P, html: string, tone: Tone, o: { arc?: number; keep?: boolean; dur?: number; cls?: string } = {}) {
  const chip = h('div', `chip t-${tone} ${o.cls ?? ''}`, html, f.fx);
  chip.dir = 'ltr';
  gsap.set(chip, { x: a.x, y: a.y, xPercent: -50, yPercent: -50, opacity: 0, scale: 0.6 });
  const arc = o.arc ?? -0.28;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const cx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) + arc * len;
  const proxy = { p: 0 };
  const dur = o.dur ?? 0.9;
  const t = gsap.timeline();
  t.to(chip, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, 0)
    .to(proxy, {
      p: 1, duration: dur, ease: 'power2.inOut',
      onUpdate() {
        const p = proxy.p, q = 1 - p;
        gsap.set(chip, { x: q * q * a.x + 2 * q * p * cx + p * p * b.x, y: q * q * a.y + 2 * q * p * cy + p * p * b.y });
      },
    }, 0.15)
    .to(chip, { scale: 1.15, duration: 0.12, yoyo: true, repeat: 1 }, 0.15 + dur);
  if (!o.keep) t.to(chip, { opacity: 0, scale: 0.8, duration: 0.25 }, 0.15 + dur + 0.2);
  return t;
}

export interface Arrow { path: SVGPathElement; head: SVGPathElement; len: number; draw: (dur?: number) => gsap.core.Timeline; hide: (dur?: number) => gsap.core.Tween }

/** Curved arrow in the SVG layer. Positive bend curves to the left of the direction of travel. */
export function arrow(f: Frame, a: P, b: P, tone: Tone, o: { bend?: number; dashed?: boolean; width?: number; cls?: string } = {}): Arrow {
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('class', `arr t-${tone} ${o.dashed ? 'dashed' : ''} ${o.cls ?? ''}`);
  const dx = b.x - a.x, dy = b.y - a.y, len0 = Math.hypot(dx, dy) || 1;
  const bend = o.bend ?? 0.2;
  const c = { x: (a.x + b.x) / 2 - (dy / len0) * len0 * bend, y: (a.y + b.y) / 2 + (dx / len0) * len0 * bend };
  // stop short so the head sits at b
  const tx = b.x - c.x, ty = b.y - c.y, tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl, uy = ty / tl;
  const hw = (o.width ?? 4.5) * 2.6;
  const end = { x: b.x - ux * hw * 1.2, y: b.y - uy * hw * 1.2 };
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', `M${a.x},${a.y} Q${c.x},${c.y} ${end.x},${end.y}`);
  path.setAttribute('stroke-width', String(o.width ?? 4.5));
  const head = document.createElementNS(ns, 'path');
  const px = -uy, py = ux;
  head.setAttribute('d', `M${b.x},${b.y} L${b.x - ux * hw * 2 + px * hw},${b.y - uy * hw * 2 + py * hw} L${b.x - ux * hw * 2 - px * hw},${b.y - uy * hw * 2 - py * hw} Z`);
  g.append(path, head);
  f.svg.appendChild(g);
  const len = path.getTotalLength();
  if (!o.dashed) gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(g, { opacity: 0 });
  gsap.set(head, { opacity: 0 });
  return {
    path, head, len,
    draw(dur = 0.6) {
      const t = gsap.timeline();
      if (o.dashed) t.to(g, { opacity: 1, duration: 0.35 }, 0).to(head, { opacity: 1, duration: 0.2 }, 0.1);
      else t.set(g, { opacity: 1 }, 0).to(path, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut' }, 0).to(head, { opacity: 1, duration: 0.15 }, dur * 0.85);
      return t;
    },
    hide(dur = 0.35) { return gsap.to(g, { opacity: 0, duration: dur }); },
  };
}

/** A note card placed on the stage, hidden until shown. */
export function note(root: HTMLElement, html: string, tone: 'ok' | 'bad' | 'ink' | 'v', x: number, y: number, w: number) {
  const el = h('div', `note n-${tone}`, html, root);
  el.style.cssText = `left:${x}px;top:${y}px;width:${w}px`;
  gsap.set(el, { opacity: 0 });
  return {
    el,
    show: () => gsap.fromTo(el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', immediateRender: false }),
    hide: () => gsap.to(el, { opacity: 0, duration: 0.3 }),
  };
}

/** Floating label at a point (centered). */
export function tag(root: HTMLElement, html: string, cls: string, p: P) {
  const el = h('div', `tag ${cls}`, html, root);
  gsap.set(el, { x: p.x, y: p.y, xPercent: -50, yPercent: -50, opacity: 0 });
  return el;
}

// ---------------------------------------------------------------- teaching devices

/** The general rule behind the example, shown over a dimmed slide (concrete → abstract). */
export function ruleCard(root: HTMLElement, o: { kicker?: string; name: string; term?: string; body: string; tone?: 'bad' | 'ok' | 'v' | 'ink' }) {
  const el = h('div', `rule r-${o.tone ?? 'bad'}`, `<div class="rule-card">
      <div class="rule-k">${o.kicker ?? 'قاعدهٔ کلی'}</div>
      <h2>${o.name}${o.term ? ` <span class="term" dir="ltr">${o.term}</span>` : ''}</h2>
      <p>${o.body}</p></div>`, root);
  const card = el.firstElementChild as HTMLElement;
  gsap.set(el, { opacity: 0 });
  return {
    el,
    show: () => gsap.timeline().to(el, { opacity: 1, duration: 0.5 }, 0)
      .fromTo(card, { y: 40, scale: 0.96 }, { y: 0, scale: 1, duration: 0.8, ease: 'power3.out', immediateRender: false }, 0),
    hide: () => gsap.to(el, { opacity: 0, duration: 0.4 }),
  };
}

/** A prediction question for the audience; `answer(i)` reveals the right option. */
export function ask(root: HTMLElement, q: string, opts: string[], x: number, y: number, w: number) {
  const L = ['الف', 'ب', 'ج', 'د'];
  const el = h('div', 'ask', `<div class="ask-k">پیش‌بینی کنید</div><div class="ask-q">${q}</div>
    <div class="ask-o">${opts.map((op, i) => `<div class="op"><b>${L[i]}</b><span>${op}</span></div>`).join('')}</div>`, root);
  el.style.cssText = `left:${x}px;top:${y}px;width:${w}px`;
  const ops = Array.from(el.querySelectorAll<HTMLElement>('.op'));
  gsap.set(el, { opacity: 0 });
  return {
    el,
    show: () => gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', immediateRender: false }),
    answer: (i: number) => {
      const t = gsap.timeline();
      ops.forEach((op, k) => t.to(op, k === i ? { backgroundColor: '#dff4ec', borderColor: '#0e9467', scale: 1.04, duration: 0.5 } : { opacity: 0.35, duration: 0.5 }, 0));
      return t;
    },
    hide: () => gsap.to(el, { opacity: 0, duration: 0.4 }),
  };
}

/** A box for diagrams (architecture, state machines, lists). */
export function node(root: HTMLElement, html: string, x: number, y: number, w: number, cls = '') {
  const el = h('div', `node ${cls}`, html, root);
  el.style.cssText = `left:${x}px;top:${y}px;width:${w}px`;
  return el;
}

/** Anchor points on an element's box. */
export function anchor(el: HTMLElement, root: HTMLElement) {
  const b = pos(el, root);
  return {
    l: { x: b.x, y: b.cy }, r: { x: b.r, y: b.cy }, t: { x: b.cx, y: b.y }, b: { x: b.cx, y: b.b }, c: { x: b.cx, y: b.cy }, box: b,
  };
}
