import '@fontsource-variable/estedad';
import '@fontsource-variable/jetbrains-mono';
import gsap from 'gsap';
import './style/base.css';
import './style/kit.css';
import './style/slides.css';
import { Deck, Slide, fitStage } from './core/deck';
import { h } from './core/dom';
import { titleSlide } from './slides/p0-title';
import { roadSlide } from './slides/p0-road';
import { txnSlide, interleaveSlide, locksSlide, legendSlide } from './slides/p1-basics';
import { registerStory, registerRace, registerFix } from './slides/p2-register';
import { gradeStory, dirtyRead, nonRepeatable, phantom } from './slides/p2-reads';
import { proctorStory, writeSkew, skewFixes } from './slides/p2-skew';
import { swapStory, deadlock, deadlockFix } from './slides/p2-deadlock';
import { rushStory, hotRow, hotFix, problemQuiz } from './slides/p2-hot';
import { isoIntro, isoLevel, snapshotInside, snapshotConflict, isoSummary } from './slides/p3-iso';
import { pessimistic, optimistic, toolsTable } from './slides/p3-tools';
import { caseChapter, caseNeed, caseReqs, caseModel, caseLifecycle, caseFlow, caseBulk, caseWindow, caseAtLeastOnce, caseConsumers } from './slides/p4-case';
import { claim, lease, zombie, sweeper, counters, cancel, errors, oneClock, proof } from './slides/p4-issues';
import { riskExternal, riskDualWrite, riskRecap, riskEscalation, riskStorm, rules, qa } from './slides/p5-end';

// Timelines are seeked back and forth; values must be written immediately, never deferred.
gsap.defaults({ lazy: false });

const builders: ((stage: HTMLElement) => Slide)[] = [
  // opening
  titleSlide, roadSlide,
  // 1 · basics (pre-training)
  txnSlide, interleaveSlide, locksSlide, legendSlide,
  // 2 · problems: story → table → rule
  registerStory, registerRace, registerFix,
  gradeStory, dirtyRead, nonRepeatable, phantom,
  proctorStory, writeSkew, skewFixes,
  swapStory, deadlock, deadlockFix,
  rushStory, hotRow, hotFix, problemQuiz,
  // 3 · tools
  isoIntro, isoLevel(0), isoLevel(1), isoLevel(2), isoLevel(3), isoLevel(4), snapshotInside, snapshotConflict, isoSummary,
  pessimistic, optimistic, toolsTable,
  // 4 · a real system: need → design → concurrency issues
  caseChapter, caseNeed, caseReqs, caseModel, caseLifecycle, caseFlow, caseBulk, caseWindow, caseAtLeastOnce, caseConsumers,
  claim, lease, zombie, sweeper, counters, cancel, errors, oneClock, proof,
  // 5 · risks and closing
  riskExternal, riskDualWrite, riskRecap, riskEscalation, riskStorm, rules, qa,
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
