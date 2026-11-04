# Multi-User Database Problems in Real Life

A Persian (RTL) talk about concurrency in multi-user databases, from the last seat on a flight to processing hundreds of thousands of items in parallel.

## The presentation (flat design)

Course: درس پایگاه داده · Instructor: دکتر محمد سلطانیان · Presenters: حسام جوادی، علی‌محمد قلی‌زاده

61 slides in five parts, built so that every click shows exactly one action:

1. **Basics**: transaction, interleaving, S/X locks, the visual language.
2. **Problems**: lost update, dirty read, non-repeatable read, phantom, write skew, deadlock, hot row. Each one goes from a flat-shaded 3D story from student life (course registration, grade entry, exam proctors, add/drop week, the 8 AM rush) to the same moment on a real table, then to a rule card.
3. **Tools**: one slide per isolation level on the same scenario, the version store, SNAPSHOT conflicts, `UPDLOCK`, `rowversion`, and when to use which.
4. **A real system**: why a background bulk-operation engine was needed, how it works (data model, item lifecycle, flow, bulk insert, dispatch window, at-least-once delivery), then its concurrency issues one by one (claim, lease, fencing token, sweeper, derived counters, cancel, retries, one clock, load-test proof).
5. **Risks in similar systems** and five rules.

Every slide opens with its title alone; objects are added one per click. Animations play slowly; pressing the key during one lets it finish and queues the next, so nothing is skipped.

- Design and teaching approach, slide by slide: [docs/DESIGN_PLAN.md](docs/DESIGN_PLAN.md)
- Source: [demo/](demo/)

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5180/demo/. To get one self-contained HTML file that works offline (fonts and scripts inlined):

```bash
npm run standalone
```

The file is written to `dist/standalone/demo.html`.

Controls: Space / PageDown / ← / click = next step; PageUp / → / right-click = previous; `R` replays the current step; `Home` / `End`; `F` fullscreen; `B` blank screen. The address bar keeps your place (`#8-12` is slide 8, step 12).

## Original 3D version

A 25-minute Persian (RTL) talk built as one continuous 3D world: the camera flies from scene to scene, and each click advances a build step. Light theme for bright rooms and projectors.

- Slide copy: [src/content.ts](src/content.ts) (put the presenter name and event in `title.presenter` / `title.event`)
- Speaker script with timings: [SCRIPT.md](SCRIPT.md)

## Run

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5180. For the talk itself, build once and serve the static files (works offline; fonts are bundled):

```bash
npm run build
```

```bash
npx vite preview --port 5180
```

## Controls

| Key | Action |
|---|---|
| Space, PageDown, ←, ↓, Enter, click | next step |
| PageUp, →, ↑, Backspace, right-click | previous step |
| Home / End | first / last scene |
| F | fullscreen |
| B or . | blank the screen |
| Q | toggle low-quality rendering (auto-enabled on slow machines) |

The address bar keeps your place: `#12.3` is scene 12, step 3. Most presentation clickers send PageUp/PageDown and work as-is.

## Scenes

| # | Scene | Steps | 3D |
|---|---|---|---|
| 1 | Title | 1 | a field of rows; four users circle one lifted row |
| 2 | One row, many hands | 4 | four pedestals: seat, coins, ticket, crates |
| 3 | Lost update | 4 | two users, read/write beams, timeline lanes, SQL fix |
| 4 | Unstable reads | 3 | reader vs a stack of rows: dirty, non-repeatable, phantom |
| 5 | Write skew | 3 | two on-call lamps switched off by two doctors |
| 6 | Deadlock | 4 | lock chains, spinning wait-for cycle, victim 1205 |
| 7 | Hot row | 3 | a queue behind one counter, then split counters |
| 8 | Isolation levels | 5 | staircase + snapshot glass platform, anomaly matrix |
| 9 | Three tools | 3 | padlock, version stamp, conditional-update gate |
| 10 | Chapter: BulkOperation | 1 | a 1,920-item table with a processing wave |
| 11 | Path of an item | 4 | API → table → dispatch window → queue → workers |
| 12 | Claim and lease | 4 | one winner, lease ring + heartbeat, fenced zombie, sweeper |
| 13 | Details | 4 | turntable: derived counters, cancel, retry, one clock |
| 14 | Risks in similar systems | 6 | a wall of flipping tiles |
| 15 | Five rules | 1 | every user with their own green row |
| 16 | Q&A | 1 | the camera lifts over the path of the talk |

## Verify

```bash
node tools/walk.mjs 1.1 999 shots
```

```bash
python tools/sheet.py shots sheets
```

`walk.mjs` drives headless Chrome (SwiftShader) against the dev server at `?capture`, screenshots every step, and prints page errors; `sheet.py` tiles the shots 2×2 for review.
