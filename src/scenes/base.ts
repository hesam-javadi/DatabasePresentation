import * as THREE from 'three';
import { Ctx, Scene, ShowArgs, reveal, conceal, splitWords } from '../deck';
import { anchor, Shot } from '../three/world';

export interface SceneDef {
  id: string;
  label: string;
  chapter: string;
  steps: number;
  caption?: string | ((step: number) => string);
  shot: (step: number) => Shot;
  /** apply the state of `step`; must work when jumped to directly */
  apply: (step: number, a: ShowArgs) => void;
  leave?: () => void;
}

/** Shared scaffolding: a group at this scene's anchor, its text panels, camera flights. */
export function stage(ctx: Ctx, index: number) {
  const origin = anchor(index);
  const group = new THREE.Group();
  group.position.copy(origin);
  ctx.world.scene.add(group);
  const panels: HTMLElement[] = [];
  const pins: HTMLElement[] = [];

  return {
    origin, group, panels, pins,
    /** create a text block; `.h1` titles get word spans */
    panel(html: string, cls = 'panel') {
      const el = document.createElement('section');
      el.className = cls;
      el.innerHTML = html;
      el.querySelectorAll<HTMLElement>('.h1').forEach(splitWords);
      ctx.overlay.appendChild(el);
      panels.push(el);
      return el;
    },
    pin(text: string, obj: THREE.Object3D, offset: [number, number, number] = [0, 0, 0], cls = '') {
      const el = ctx.pins.add(text, obj, offset, cls);
      pins.push(el);
      return el;
    },
    define(d: SceneDef): Scene {
      let lastShot = -1;
      return {
        id: d.id, label: d.label, chapter: d.chapter, steps: d.steps, caption: d.caption,
        show(step, a) {
          const shot = d.shot(step);
          const key = JSON.stringify(shot);
          if (a.arriving) {
            ctx.world.fly(origin, shot, ctx.world.capture ? 1.6 : 2.4);
            panels.forEach((p) => { if (!p.dataset.manual) reveal(p); });
          } else if (key !== JSON.stringify(d.shot(lastShot))) {
            ctx.world.fly(origin, shot, 1.4);
          }
          lastShot = step;
          d.apply(step, a);
        },
        leave() {
          panels.forEach(conceal);
          pins.forEach((p) => p.classList.remove('on'));
          d.leave?.();
        },
      };
    },
  };
}

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
