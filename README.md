# Multi-User Database Problems in Real Life

A Persian (RTL) talk about concurrency in multi-user databases, from the last seat on a flight to processing hundreds of thousands of items in parallel.

## New flat design (demo)

The talk is being redesigned around real tables instead of 3D metaphors: every problem is replayed on actual rows, with transactions as colored sessions, visible row locks (hatched rows with padlock badges), uncommitted values in "wet ink", waiting sessions parked at the row, and a timeline that shows the order of events.

- Design plan for every slide of the expanded deck (55 slides, which ones are built, timing, open questions): [docs/DESIGN_PLAN.md](docs/DESIGN_PLAN.md)
- Demo (10 slides, ~50 animated steps): [demo/](demo/)

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

Demo controls: Space / PageDown / ← / click = next step; PageUp / → / right-click = previous; `R` replays the current step; `Home` / `End`; `F` fullscreen; `B` blank screen. The address bar keeps your place (`#5-3` is slide 5, step 3).

| # | Demo slide | Steps | Shows |
|---|---|---|---|
| 1 | Title | 1 | two multiplayer cursors land on the same cell of a tilted table |
| 2 | The last seat | 4 | two phones in perspective, 15 ms apart, two boarding passes, one row |
| 3 | Two bookings, one seat | 7 | lost update on `dbo.Seats`: reads into app memory, X lock, wet ink, overwrite, danger window |
| 4 | Conditional UPDATE | 5 | the fix: X lock, a blocked writer, re-check, `1 row` vs `0 rows` |
| 5 | Isolation levels | 6 | one report under five levels: no read locks, brief S locks, held S locks, gap locks, SNAPSHOT photo; matrix fills in |
| 6 | Deadlock | 7 | opposite lock order, wait-for loop, Lock Monitor victim (1205), then fixed order |
| 7 | Chapter: BulkOperation | 2 | live field of items changing status |
| 8 | Claim | 4 | duplicate delivery, three instances, one conditional UPDATE wins |
| 9 | Lease and fencing token | 5 | lock forever vs lease + heartbeat, GC pause, sweeper, stale write rejected |
| 10 | Closing | 1 | five rules |

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
