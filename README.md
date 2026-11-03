# Multi-User Database Problems in Real Life

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
