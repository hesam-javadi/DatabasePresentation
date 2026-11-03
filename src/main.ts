import '@fontsource-variable/estedad';
import '@fontsource-variable/jetbrains-mono';
import './style/main.css';
import gsap from 'gsap';
import { World } from './three/world';
import { Deck, Pins, Ctx, Scene } from './deck';
import { titleScene } from './scenes/s01-title';
import { everydayScene } from './scenes/s02-everyday';
import { lostScene } from './scenes/s03-lost';
import { readsScene } from './scenes/s04-reads';
import { skewScene } from './scenes/s05-skew';
import { deadlockScene } from './scenes/s06-deadlock';
import { hotScene } from './scenes/s07-hot';
import { isolationScene } from './scenes/s08-isolation';
import { toolsScene } from './scenes/s09-tools';
import { chapterScene } from './scenes/s10-chapter';
import { pipelineScene } from './scenes/s11-pipeline';
import { leaseScene } from './scenes/s12-lease';
import { detailsScene } from './scenes/s13-details';
import { risksScene } from './scenes/s14-risks';
import { rulesScene, qaScene } from './scenes/s15-end';

const builders: [string, (ctx: Ctx, i: number) => Scene][] = [
  ['title', titleScene], ['everyday', everydayScene], ['lost', lostScene], ['reads', readsScene],
  ['skew', skewScene], ['deadlock', deadlockScene], ['hot', hotScene], ['isolation', isolationScene],
  ['tools', toolsScene], ['chapter', chapterScene], ['pipeline', pipelineScene], ['lease', leaseScene],
  ['details', detailsScene], ['risks', risksScene], ['rules', rulesScene], ['qa', qaScene],
];

async function boot() {
  const bar = document.querySelector('.loader-bar i') as HTMLElement;
  await Promise.all([
    document.fonts.load("700 40px 'Estedad Variable'", 'سلام'),
    document.fonts.load("400 40px 'Estedad Variable'", 'سلام'),
    document.fonts.load("600 40px 'JetBrains Mono Variable'", 'UPDATE'),
  ]);

  const world = new World(document.getElementById('gl') as HTMLCanvasElement);
  if (world.capture) gsap.ticker.lagSmoothing(0);
  const overlay = document.getElementById('overlay')!;
  const deck = new Deck(world, overlay);
  const pins = new Pins(world, overlay);

  for (let i = 0; i < builders.length; i++) {
    const [id, build] = builders[i];
    deck.add(build(deck.ctxFor(id, pins), i));
    bar.style.width = `${((i + 1) / builders.length) * 100}%`;
    await new Promise((r) => setTimeout(r, 30));
  }

  world.warm();
  world.start();
  deck.start();
  (window as any).deck = deck;
  document.getElementById('loader')!.classList.add('gone');
}

boot();
