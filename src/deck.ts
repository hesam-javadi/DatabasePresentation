import gsap from 'gsap';
import * as THREE from 'three';
import { World } from './three/world';
import { fa } from './content';

export interface ShowArgs {
  arriving: boolean;  // camera just came from another scene (or a jump)
  dir: 1 | -1;
}

export interface Scene {
  id: string;
  label: string;
  chapter: string;
  steps: number;
  caption?: string | ((step: number) => string);
  show(step: number, a: ShowArgs): void;
  leave(): void;
}

export interface Ctx {
  world: World;
  overlay: HTMLElement;
  pins: Pins;
  frame: (fn: (t: number, dt: number) => void) => void; // runs only while the scene is current
  isCurrent: () => boolean;
}

// ---------------------------------------------------------------- pins (labels on 3D points)

interface Pin { el: HTMLElement; obj: THREE.Object3D; offset: THREE.Vector3 }

export class Pins {
  private list: Pin[] = [];
  private tmp = new THREE.Vector3();
  constructor(private world: World, private overlay: HTMLElement) {
    world.onFrame(() => this.update());
  }
  add(text: string, obj: THREE.Object3D, offset: [number, number, number] = [0, 0, 0], cls = '') {
    const el = document.createElement('div');
    el.className = `pin ${cls}`;
    el.innerHTML = text;
    this.overlay.appendChild(el);
    const p = { el, obj, offset: new THREE.Vector3(...offset) };
    this.list.push(p);
    return el;
  }
  private update() {
    for (const p of this.list) {
      if (!p.el.classList.contains('on')) continue;
      p.obj.getWorldPosition(this.tmp).add(p.offset);
      const s = this.world.project(this.tmp);
      p.el.style.left = `${s.x}rem`;
      p.el.style.top = `${s.y}rem`;
    }
  }
}

// ---------------------------------------------------------------- text helpers

export function h(html: string, cls = '', tag = 'div') {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  el.innerHTML = html;
  return el;
}

/** Wrap words in spans for reveals. RTL words stay whole; consecutive LTR words stay together. */
export function splitWords(el: HTMLElement) {
  const text = el.textContent ?? '';
  const tokens = text.split(/\s+/).filter(Boolean);
  const groups: string[] = [];
  for (const t of tokens) {
    const ltr = /^[A-Za-z0-9()'`.\-–]+$/.test(t);
    const prevLtr = groups.length && /^[A-Za-z0-9()'`.\-– ]+$/.test(groups[groups.length - 1]);
    if (ltr && prevLtr) groups[groups.length - 1] += ' ' + t;
    else groups.push(t);
  }
  el.innerHTML = groups
    .map((g) => /^[A-Za-z0-9()'`.\-– ]+$/.test(g) ? `<span class="w ltr">${g}</span>` : `<span class="w">${g}</span>`)
    .join(' ');
  return Array.from(el.querySelectorAll<HTMLElement>('.w'));
}

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Show a text block: fade in, title words rise in sequence. */
export function reveal(panel: HTMLElement) {
  panel.classList.add('on');
  gsap.killTweensOf(panel);
  gsap.to(panel, { opacity: 1, duration: 0.5, delay: 0.25 });
  const words = panel.querySelectorAll<HTMLElement>('.h1 .w');
  if (words.length && !reduced) {
    const tw = (panel as any)._tw as gsap.core.Tween | undefined;
    tw?.kill();
    (panel as any)._tw = gsap.fromTo(words, { y: '0.6em', opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06, delay: 0.3 });
  }
}

export function conceal(panel: HTMLElement) {
  gsap.killTweensOf(panel);
  gsap.to(panel, { opacity: 0, duration: 0.35, onComplete: () => panel.classList.remove('on') });
}

/** Mark list items: < step = done, == step = on. */
export function markSteps(list: HTMLElement | null, step: number, offset = 0) {
  if (!list) return;
  list.querySelectorAll('li').forEach((li, i) => {
    const k = i + 1 + offset;
    li.classList.toggle('on', k === step);
    li.classList.toggle('done', k < step);
  });
}

// ---------------------------------------------------------------- deck

export class Deck {
  scenes: Scene[] = [];
  i = 0;
  s = 1;
  private head: HTMLElement;
  private bar: HTMLElement;
  private caption: HTMLElement;
  private stepno: HTMLElement;
  private frames = new Map<string, Set<(t: number, dt: number) => void>>();

  constructor(public world: World, public overlay: HTMLElement) {
    this.head = h('<span class="chapter"></span><span class="title"></span>', 'head');
    this.bar = h('', 'progress');
    this.caption = h('', 'caption');
    this.stepno = h('', 'stepno');
    overlay.append(this.head, this.bar, this.caption, this.stepno);

    world.onFrame((t, dt) => {
      const id = this.scenes[this.i]?.id;
      const fs = id ? this.frames.get(id) : undefined;
      fs?.forEach((f) => f(t, dt));
    });
  }

  ctxFor(id: string, pins: Pins): Ctx {
    const set = new Set<(t: number, dt: number) => void>();
    this.frames.set(id, set);
    return {
      world: this.world, overlay: this.overlay, pins,
      frame: (fn) => set.add(fn),
      isCurrent: () => this.scenes[this.i]?.id === id,
    };
  }

  add(s: Scene) { this.scenes.push(s); }

  start() {
    this.bar.innerHTML = this.scenes.map(() => '<i></i>').join('');
    addEventListener('keydown', (e) => this.key(e));
    addEventListener('hashchange', () => this.fromHash());
    addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > 30) this.debounced(e.deltaY > 0 ? 1 : -1); }, { passive: true });
    addEventListener('click', (e) => { if (e.button === 0) this.next(); });
    addEventListener('contextmenu', (e) => { e.preventDefault(); this.prev(); });
    let idle = 0;
    addEventListener('mousemove', () => {
      document.body.classList.remove('idle');
      clearTimeout(idle);
      idle = window.setTimeout(() => document.body.classList.add('idle'), 2000);
    });
    if (!this.fromHash()) this.goto(0, 1, true);
  }

  private lastWheel = 0;
  private debounced(d: 1 | -1) {
    const now = performance.now();
    if (now - this.lastWheel < 700) return;
    this.lastWheel = now;
    d > 0 ? this.next() : this.prev();
  }

  private fromHash() {
    const m = location.hash.match(/^#(\d+)(?:\.(\d+))?/);
    if (!m) return false;
    const i = Math.min(this.scenes.length - 1, Math.max(0, +m[1] - 1));
    const s = Math.min(this.scenes[i].steps, Math.max(1, +(m[2] ?? 1)));
    if (i !== this.i || s !== this.s || !this.started) this.goto(i, s, true);
    return true;
  }

  private started = false;

  private key(e: KeyboardEvent) {
    const k = e.key;
    if ([' ', 'PageDown', 'ArrowLeft', 'ArrowDown', 'Enter'].includes(k)) { e.preventDefault(); this.next(); }
    // RTL: ← moves forward, → moves back
    else if (['PageUp', 'ArrowRight', 'ArrowUp', 'Backspace'].includes(k)) { e.preventDefault(); this.prev(); }
    else if (k === 'Home') this.goto(0, 1, true);
    else if (k === 'End') this.goto(this.scenes.length - 1, 1, true);
    else if (k === 'f' || k === 'F') {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    } else if (k === 'b' || k === 'B' || k === '.') document.getElementById('blank')!.classList.toggle('on');
  }

  next() {
    const sc = this.scenes[this.i];
    if (this.s < sc.steps) this.goto(this.i, this.s + 1);
    else if (this.i < this.scenes.length - 1) this.goto(this.i + 1, 1);
  }

  prev() {
    if (this.s > 1) this.goto(this.i, this.s - 1);
    else if (this.i > 0) this.goto(this.i - 1, this.scenes[this.i - 1].steps);
  }

  goto(i: number, s: number, jump = false) {
    const prevI = this.i;
    const changing = i !== prevI || !this.started || jump;
    const dir: 1 | -1 = i > prevI || (i === prevI && s >= this.s) ? 1 : -1;
    if (changing && this.started && i !== prevI) this.scenes[prevI].leave();
    if (jump && this.started && i === prevI) this.scenes[prevI].leave();
    this.i = i; this.s = s; this.started = true;
    const sc = this.scenes[i];
    sc.show(s, { arriving: changing, dir });
    history.replaceState(null, '', `#${i + 1}.${s}`);
    this.chrome();
  }

  private chrome() {
    const sc = this.scenes[this.i];
    (this.head.querySelector('.chapter') as HTMLElement).textContent = sc.chapter;
    (this.head.querySelector('.title') as HTMLElement).innerHTML = `<b>${fa(this.i + 1)}</b>${sc.label}`;
    this.head.style.opacity = this.i === 0 ? '0' : '1';
    this.bar.querySelectorAll('i').forEach((b, k) => {
      b.classList.toggle('cur', k === this.i);
      b.classList.toggle('done', k < this.i);
    });
    const cap = typeof sc.caption === 'function' ? sc.caption(this.s) : sc.caption ?? '';
    this.caption.textContent = cap;
    this.stepno.textContent = sc.steps > 1 ? `${fa(this.s)} از ${fa(sc.steps)}` : '';
  }
}
