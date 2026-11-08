import gsap from 'gsap';
import { newSlide, Slide } from './deck';
import { frame } from '../kit/parts';

type Els = Element | Element[];
const list = (e: Els) => (Array.isArray(e) ? e : [e]);

export interface BuildOpts {
  id: string;
  chapter: string;
  label: string;
  title: string;
  term?: string;
  cls?: string;
  narrW?: number;
  /** marks the slide as part of a numbered problem/challenge, shown as a badge in the title row */
  badge?: { kind: 'مشکل' | 'چالش'; n: number; of: number; name: string; stage?: string };
}

const FA = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
const plain = (s: string) => s.replace(/<[^>]+>/g, '');

/**
 * Slide author. Every `s()` call is one click: an optional narration line plus one action.
 * The slide opens with its title alone; everything else is revealed by later clicks.
 */
export function build(stage: HTMLElement, o: BuildOpts) {
  const { el, master, step } = newSlide(stage, o.cls ?? '');
  const f = frame(el, o.title, o.badge ? '' : o.term ?? '', { narrW: o.narrW });
  if (o.badge) {
    const g = o.badge;
    const bd = document.createElement('span');
    bd.className = `pbadge ${g.kind === 'مشکل' ? 'pb-p' : 'pb-c'}`;
    bd.innerHTML = `<b>${g.kind} ${FA(g.n)} از ${FA(g.of)}</b><span dir="ltr">${g.name}</span>${g.stage ? `<i>${g.stage}</i>` : ''}`;
    f.title.insertBefore(bd, f.title.firstChild);
  }
  gsap.set(f.title, { opacity: 0 });
  let n = 0;
  // a title-only opening is merged into the next click, so no slide starts empty
  let intro: string | null | undefined;
  const hooks: ((s: number) => void)[] = [];

  const b = {
    el, f, master,
    /** one click; `narr` replaces the narration (null keeps the current line) */
    s(narr: string | null, fn?: (t: gsap.core.Timeline) => void, hold = 0) {
      if (n === 0 && intro === undefined && !fn) { intro = narr; return b; }
      if (n === 0 && intro !== undefined) {
        const both = intro && narr ? `${intro} ${narr}` : intro ?? narr;
        if (both && plain(both).length > 120 && intro && narr) console.warn(`[build] ${o.id}: dropped narration "${plain(narr)}"`);
        narr = both && plain(both).length <= 120 ? both : intro ?? narr;
        intro = undefined;
      }
      const first = n === 0;
      n = step((t) => {
        if (first) t.fromTo(f.title, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', immediateRender: false }, 0);
        if (narr !== null) t.add(f.narr.to(narr), first ? 0.4 : 0);
        if (fn) {
          const sub = gsap.timeline();
          fn(sub);
          t.add(sub, first ? 0.7 : narr !== null ? 0.3 : 0);
        }
      }, hold);
      return b;
    },
    /** one click that reveals elements (hidden until then) */
    show(narr: string | null, els: Els, fn?: (t: gsap.core.Timeline) => void, o: { y?: number; x?: number; stagger?: number } = {}) {
      const l = list(els);
      gsap.set(l, { opacity: 0 });
      return b.s(narr, (t) => {
        t.fromTo(l, { opacity: 0, y: o.y ?? 26, x: o.x ?? 0 }, { opacity: 1, y: 0, x: 0, duration: 0.8, stagger: o.stagger ?? 0.18, ease: 'power3.out', immediateRender: false }, 0);
        if (fn) { const sub = gsap.timeline(); fn(sub); t.add(sub, 0.5); }
      });
    },
    /** hide at build time (for things revealed by custom tweens) */
    hide(...els: Element[]) { gsap.set(els, { opacity: 0 }); return b; },
    onStep(fn: (s: number) => void) { hooks.push(fn); return b; },
    done(extra: Partial<Slide> = {}): Slide {
      if (n === 0) { const i = intro; intro = undefined; b.s(i ?? null, () => {}); }
      return {
        id: o.id, chapter: o.chapter, label: o.label, steps: n, el, tl: master,
        onStep: hooks.length ? (s) => hooks.forEach((g) => g(s)) : undefined,
        ...extra,
      };
    },
  };
  return b;
}

export type Builder = ReturnType<typeof build>;
