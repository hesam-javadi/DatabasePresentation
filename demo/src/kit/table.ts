import gsap from 'gsap';
import { h, pos, P } from '../core/dom';
import { ICON } from './icons';
import { C } from './colors';

/** Who/what a color belongs to: transactions t1–t3, plus semantic tones. */
export type Tone = 't1' | 't2' | 't3' | 'ok' | 'bad' | 'ink' | 'v' | 'mute';

export interface Col { key: string; label: string; w: number; kind?: 'mono' | 'text' | 'pill' | 'num'; pk?: boolean }
export type Row = { id: string } & Record<string, string>;

export interface TableOpts {
  name: string;
  cols: Col[];
  rows: Row[];
  x: number;
  y: number;
  rowH?: number;
  gap?: number;
  cls?: string;
}

interface Cell { key: string; el: HTMLElement; cur: HTMLElement | null; text: string; wet: Tone | null; dry: string }
interface Lock { zone: HTMLElement; badge: HTMLElement; mode: string }
interface RowRec {
  id: string; el: HTMLElement; fx: HTMLElement; ring: HTMLElement; idx: number; dy: number;
  cells: Map<string, Cell>; locks: Map<string, Lock>; waiters: Map<string, HTMLElement>;
}

/** Render a raw value for a column. `NULL` gets SQL styling; pills map by value. */
export function fmt(col: Col, text: string) {
  if (text === 'NULL') return '<span class="null">NULL</span>';
  if (col.kind === 'pill') return `<span class="pill p-${text.toLowerCase().replace(/[^a-z]/g, '')}">${text}</span>`;
  if (col.kind === 'mono' || col.kind === 'num') return `<span class="mono">${text}</span>`;
  return `<span class="txt">${text}</span>`;
}

/**
 * A big, readable result grid that knows its own geometry.
 * All mutators return timelines and update the build-time state, so they must be called in story order.
 */
export class DbTable {
  el: HTMLElement;
  body: HTMLElement;
  card: HTMLElement;
  rows = new Map<string, RowRec>();
  cols: Col[];
  rowH: number;
  gap: number;
  width: number;
  private colX = new Map<string, number>();
  private n: number;
  private bodyTop = 0;
  readonly x: number;
  readonly y: number;

  constructor(root: HTMLElement, o: TableOpts, parent: HTMLElement = root) {
    this.cols = o.cols;
    this.rowH = o.rowH ?? 88;
    this.gap = o.gap ?? 0;
    this.x = o.x;
    this.y = o.y;
    this.width = o.cols.reduce((a, c) => a + c.w, 0);
    let acc = 0;
    o.cols.forEach((c) => { this.colX.set(c.key, acc); acc += c.w; });

    this.el = h('div', `tbl ${o.cls ?? ''} ${this.gap ? 'gapped' : ''}`, '', parent);
    this.el.dir = 'ltr';
    this.el.style.left = `${o.x}px`;
    this.el.style.top = `${o.y}px`;
    this.el.style.width = `${this.width}px`;
    h('div', 'tbl-tab', `${ICON.db}<span>${o.name}</span>`, this.el);
    this.card = h('div', 'tbl-card', '', this.el);
    const head = h('div', 'tbl-head', '', this.card);
    o.cols.forEach((c) => {
      const th = h('div', 'th', `${c.pk ? ICON.key : ''}<span>${c.label}</span>`, head);
      th.style.width = `${c.w}px`;
    });
    this.body = h('div', 'tbl-body', '', this.card);
    this.n = o.rows.length;
    this.body.style.height = `${this.bodyH(this.n)}px`;
    o.rows.forEach((r, i) => this.makeRow(r, i));
    this.bodyTop = pos(this.body, root).y;
  }

  private bodyH(n: number) { return n * this.rowH + Math.max(0, n - 1) * this.gap; }
  private top(idx: number) { return idx * (this.rowH + this.gap); }

  private makeRow(r: Row, idx: number) {
    const el = h('div', 'tr', '', this.body);
    el.style.top = `${this.top(idx)}px`;
    el.style.height = `${this.rowH}px`;
    const fx = h('div', 'tr-fx', '', el);
    const ring = h('div', 'tr-ring', '', el);
    const rec: RowRec = { id: r.id, el, fx, ring, idx, dy: 0, cells: new Map(), locks: new Map(), waiters: new Map() };
    this.cols.forEach((c) => {
      const td = h('div', `td k-${c.key}`, '', el);
      td.style.width = `${c.w}px`;
      const text = r[c.key] ?? '';
      const v = h('div', 'v', fmt(c, text), td);
      rec.cells.set(c.key, { key: c.key, el: td, cur: v, text, wet: null, dry: text });
    });
    this.rows.set(r.id, rec);
    return rec;
  }

  private row(id: string) {
    const r = this.rows.get(id);
    if (!r) throw new Error(`row ${id}`);
    return r;
  }
  private col(key: string) {
    const c = this.cols.find((c) => c.key === key);
    if (!c) throw new Error(`col ${key}`);
    return c;
  }

  // ------------------------------------------------------------- geometry (stage px, build-time state)

  rowY(id: string) { return this.bodyTop + this.top(this.row(id).idx); }
  rowMid(id: string) { return this.rowY(id) + this.rowH / 2; }
  cell(id: string, key: string): P {
    return { x: this.x + (this.colX.get(key) ?? 0) + this.col(key).w / 2, y: this.rowMid(id) };
  }
  /** Point on the left or right edge of a row. */
  edge(id: string, side: 'left' | 'right', out = 0): P {
    return { x: side === 'left' ? this.x - out : this.x + this.width + out, y: this.rowMid(id) };
  }
  /** y of the boundary between rows at index i-1 and i (i = 0 is the top edge). */
  gapY(i: number) { return this.bodyTop + i * (this.rowH + this.gap) - this.gap / 2; }
  get bottom() { return this.bodyTop + this.bodyH(this.n); }
  get top0() { return this.bodyTop; }

  // ------------------------------------------------------------- values

  private makeVal(cell: Cell, text: string, wet: Tone | null) {
    const v = h('div', `v ${wet ? `wet t-${wet}` : ''}`, fmt(this.col(cell.key), text), cell.el);
    if (wet) h('i', 'wet-tag', '', v);
    gsap.set(v, { opacity: 0 });
    return v;
  }

  /** Change a value. `wet` marks it as written but not committed by that transaction. */
  set(id: string, key: string, text: string, o: { wet?: Tone; knock?: boolean } = {}) {
    const cell = this.row(id).cells.get(key)!;
    const old = cell.cur;
    const v = this.makeVal(cell, text, o.wet ?? null);
    const t = gsap.timeline();
    if (old) {
      if (o.knock) {
        t.to(old, { color: C.bad, duration: 0.2 }, 0)
          .to(old, { y: 74, x: -26, rotation: -16, opacity: 0, duration: 1.0, ease: 'power2.in' }, 0.15);
      } else {
        t.to(old, { y: -28, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0);
      }
    }
    t.fromTo(v, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', immediateRender: false }, old ? 0.16 : 0);
    if (!o.wet) cell.dry = text;
    cell.cur = v; cell.text = text; cell.wet = o.wet ?? null;
    return t;
  }

  /** Commit: every wet value in the row dries into plain ink. */
  dry(id: string) {
    const r = this.row(id);
    const t = gsap.timeline();
    r.cells.forEach((cell) => {
      if (!cell.wet) return;
      const old = cell.cur!;
      const v = this.makeVal(cell, cell.text, null);
      t.to(old, { opacity: 0, duration: 0.35 }, 0)
        .to(v, { opacity: 1, duration: 0.35 }, 0);
      cell.cur = v; cell.wet = null; cell.dry = cell.text;
    });
    t.set(r.fx, { '--fx': 'var(--ok)' }, 0)
      .to(r.fx, { opacity: 0.9, duration: 0.2 }, 0)
      .to(r.fx, { opacity: 0, duration: 0.6 }, 0.25);
    return t;
  }

  /** Rollback: wet values evaporate and the last committed value returns. */
  evaporate(id: string) {
    const r = this.row(id);
    const t = gsap.timeline();
    r.cells.forEach((cell) => {
      if (!cell.wet) return;
      const old = cell.cur!;
      const v = this.makeVal(cell, cell.dry, null);
      t.to(old, { y: -46, scale: 1.25, filter: 'blur(9px)', opacity: 0, duration: 1.1, ease: 'power1.in' }, 0)
        .fromTo(v, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', immediateRender: false }, 0.65);
      cell.cur = v; cell.wet = null; cell.text = cell.dry;
    });
    return t;
  }

  /** Brief tinted flash on a row (a read touching it). */
  flash(id: string, tone: Tone, hold = 0.5) {
    const r = this.row(id);
    return gsap.timeline()
      .set(r.fx, { '--fx': `var(--${tone})` })
      .to(r.fx, { opacity: 1, duration: 0.2 })
      .to(r.fx, { opacity: 0, duration: 0.55 }, `+=${hold}`);
  }

  /** Persistent outline around a row (the row we are talking about). */
  focus(id: string, on: boolean, tone: Tone = 'ink') {
    const r = this.row(id);
    return gsap.timeline()
      .set(r.ring, { '--ring': `var(--${tone})` })
      .to(r.ring, { opacity: on ? 1 : 0, duration: 0.4 });
  }

  /** Highlight a single cell (e.g. the column a WHERE clause checks). */
  mark(id: string, key: string, tone: Tone, on = true) {
    const cell = this.row(id).cells.get(key)!;
    let m = cell.el.querySelector<HTMLElement>(`.cell-mark.t-${tone}`);
    if (!m) { m = h('div', `cell-mark t-${tone}`, '', cell.el); gsap.set(m, { opacity: 0 }); }
    return gsap.to(m, { opacity: on ? 1 : 0, scale: on ? 1 : 1.08, duration: 0.35 });
  }

  // ------------------------------------------------------------- locks

  /** Take a row lock: a hatched zone in the owner's color plus a padlock badge on one side. */
  lock(id: string, tone: Tone, who: string, mode: 'X' | 'S' | 'U' = 'X', side: 'left' | 'right' = 'right', out = 16, key: string = tone) {
    const r = this.row(id);
    const zone = h('div', `lk-zone t-${tone} m-${mode}`, '', r.el);
    const badge = h('div', `lk-badge t-${tone} m-${mode}`, `${ICON.lock}<b>${mode}</b><small>${who}</small>`, r.el);
    badge.style[side === 'right' ? 'left' : 'right'] = `calc(100% + ${out}px)`;
    const shackle = badge.querySelector('.shackle')!;
    gsap.set([zone, badge], { opacity: 0 });
    gsap.set(shackle, { y: -5 });
    r.locks.set(key, { zone, badge, mode });
    return gsap.timeline()
      .fromTo(zone, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out', immediateRender: false }, 0)
      .fromTo(badge, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: false }, 0.05)
      .to(shackle, { y: 0, duration: 0.25, ease: 'power3.in' }, 0.42)
      .to(badge, { scale: 1.12, duration: 0.1, yoyo: true, repeat: 1 }, 0.62);
  }

  unlock(id: string, key: string) {
    const r = this.row(id);
    const l = r.locks.get(key);
    if (!l) throw new Error(`no lock ${key} on ${id}`);
    r.locks.delete(key);
    const shackle = l.badge.querySelector('.shackle')!;
    return gsap.timeline()
      .to(shackle, { y: -6, rotation: -28, svgOrigin: '16 11', duration: 0.3, ease: 'power2.out' }, 0)
      .to(l.badge, { opacity: 0, y: -10, duration: 0.35 }, 0.45)
      .to(l.zone, { opacity: 0, duration: 0.4 }, 0.4);
  }

  hasLock(id: string, tone: Tone) { return this.row(id).locks.has(tone); }

  /** A blocked request parked at the row's edge, pulsing. */
  wait(id: string, tone: Tone, who: string, side: 'left' | 'right', out = 16, label = 'منتظر', key: string = tone) {
    const r = this.row(id);
    const w = h('div', `waiter t-${tone}`, `<i class="ring"></i><span class="wb">${who}</span><em>${label}</em>`, r.el);
    w.style[side === 'right' ? 'left' : 'right'] = `calc(100% + ${out}px)`;
    gsap.set(w, { opacity: 0 });
    r.waiters.set(key, w);
    return gsap.fromTo(w, { opacity: 0, x: side === 'right' ? 40 : -40 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out', immediateRender: false });
  }

  unwait(id: string, key: string) {
    const r = this.row(id);
    const w = r.waiters.get(key);
    if (!w) throw new Error(`no waiter ${key} on ${id}`);
    r.waiters.delete(key);
    return gsap.to(w, { opacity: 0, scale: 0.6, duration: 0.3 });
  }

  /** Lock on the gap between two keys (key-range lock); `i` as in gapY. */
  gapLock(i: number, tone: Tone, side: 'left' | 'right' = 'right') {
    const bar = h('div', `gap-lock t-${tone}`, `<span class="gl-pad ${side}">${ICON.lock}</span>`, this.body);
    bar.style.top = `${i * (this.rowH + this.gap) - this.gap - 4}px`;
    bar.style.height = `${this.gap + 8}px`;
    gsap.set(bar, { opacity: 0, scaleX: 0.2 });
    return {
      el: bar,
      t: gsap.to(bar, { opacity: 1, scaleX: 1, duration: 0.45, ease: 'power3.out' }),
      pulse: () => gsap.timeline().to(bar, { scaleY: 1.8, duration: 0.12 }).to(bar, { scaleY: 1, duration: 0.3 }),
    };
  }

  // ------------------------------------------------------------- structure

  /** Insert a row at `idx`, pushing later rows down. */
  insert(r: Row, idx: number, o: { wet?: Tone; from?: 'left' | 'right' } = {}) {
    const t = gsap.timeline();
    const step = this.rowH + this.gap;
    this.rows.forEach((rec) => {
      if (rec.idx >= idx) {
        rec.idx++;
        rec.dy += step;
        t.to(rec.el, { y: rec.dy, duration: 0.55, ease: 'power3.inOut' }, 0);
      }
    });
    this.n++;
    t.to(this.body, { height: this.bodyH(this.n), duration: 0.55, ease: 'power3.inOut' }, 0);
    const rec = this.makeRow(r, idx);
    rec.el.classList.add('fresh');
    if (o.wet) {
      rec.el.classList.add('wet-row');
      rec.cells.forEach((c) => {
        c.cur!.classList.add('wet', `t-${o.wet}`);
        h('i', 'wet-tag', '', c.cur!);
        c.wet = o.wet!; c.dry = 'NULL';
      });
    }
    gsap.set(rec.el, { opacity: 0, x: o.from === 'right' ? 80 : -80 });
    t.to(rec.el, { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' }, 0.35);
    return t;
  }

  /** Remove a row (e.g. a rolled-back insert) and close the gap. */
  remove(id: string, o: { evaporate?: boolean } = {}) {
    const r = this.row(id);
    const t = gsap.timeline();
    const step = this.rowH + this.gap;
    t.to(r.el, o.evaporate
      ? { opacity: 0, y: r.dy - 30, filter: 'blur(8px)', duration: 0.9, ease: 'power1.in' }
      : { opacity: 0, x: -60, duration: 0.5 }, 0);
    this.rows.forEach((rec) => {
      if (rec.idx > r.idx) {
        rec.idx--;
        rec.dy -= step;
        t.to(rec.el, { y: rec.dy, duration: 0.55, ease: 'power3.inOut' }, 0.6);
      }
    });
    this.rows.delete(id);
    this.n--;
    t.to(this.body, { height: this.bodyH(this.n), duration: 0.55, ease: 'power3.inOut' }, 0.6);
    return t;
  }

  rowEl(id: string) { return this.row(id).el; }
  cellEl(id: string, key: string) { return this.row(id).cells.get(key)!.el; }
}
