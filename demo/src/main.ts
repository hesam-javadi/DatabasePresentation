import '@fontsource-variable/estedad';
import '@fontsource-variable/jetbrains-mono';
import gsap from 'gsap';
import './style/base.css';
import './style/kit.css';
import './style/slides.css';
import { Deck, Slide, fitStage } from './core/deck';
import { h } from './core/dom';
import { titleSlide } from './slides/s01-title';
import { storySlide } from './slides/s02-story';
import { raceSlide } from './slides/s03-race';
import { fixSlide } from './slides/s04-fix';
import { isolationSlide } from './slides/s05-isolation';
import { deadlockSlide } from './slides/s06-deadlock';
import { chapterSlide } from './slides/s07-chapter';
import { claimSlide } from './slides/s08-claim';
import { leaseSlide } from './slides/s09-lease';
import { endSlide } from './slides/s10-end';

// Timelines are seeked back and forth; values must be written immediately, never deferred.
gsap.defaults({ lazy: false });

const builders: ((stage: HTMLElement) => Slide)[] = [
  titleSlide, storySlide, raceSlide, fixSlide, isolationSlide,
  deadlockSlide, chapterSlide, claimSlide, leaseSlide, endSlide,
];

async function boot() {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'fa';
  const app = document.getElementById('app')!;
  const stage = h('div', '', '', app);
  stage.id = 'stage';
  fitStage(stage);
  await Promise.all([
    document.fonts.load("850 40px 'Estedad Variable'", 'سلام'),
    document.fonts.load("500 40px 'Estedad Variable'", 'سلام'),
    document.fonts.load("700 40px 'JetBrains Mono Variable'", 'UPDATE'),
  ]).catch(() => {});

  const deck = new Deck(stage);
  for (const build of builders) deck.add(build(stage));
  deck.start();
  (window as unknown as { deck: Deck }).deck = deck;
}

boot();
