# Design plan: «مشکلات پایگاه دادهٔ چندکاربره در دنیای واقعی»

This is the slide-by-slide plan for the new, flat version of the talk. The 10 slides marked **DEMO** are already built in `demo/` (run `npm run dev`, open `http://localhost:5180/demo/`). Everything else is planned here at the same level of detail, so it can be built with the same kit.

---

## 1. What changes, and why

| Old 3D version | New version |
|---|---|
| One metaphor per problem (seat, coins, ticket, crates, lamps, padlocks) | **One real table per problem**, with real columns, real SQL and real values |
| Each slide summarised a topic in 3–4 lines | Each line becomes its own slide, built click by click |
| 3D props stood in for database objects | The database objects themselves are the visuals: rows, cells, locks, versions |
| Order of events was implied | Order is always visible: a timeline at the bottom, numbered ticks, and the session cards show the statement running *now* |
| Generic actors | A fixed cast: **T1 = blue**, **T2 = magenta**, **T3 = amber**. The same person keeps the same color from the story slide to the table slide |

Two kinds of slides alternate:

1. **Story slides** (real life): a phone, an ATM, a hospital rota, a flash-sale page. Drawn as crisp vector illustrations with a little real depth (CSS 3D perspective), not WebGL models. They answer "where would I meet this?".
2. **Mechanism slides** (the table): the same story replayed on the actual rows, step by step. They answer "what exactly happened, in which order, and what stops it?".

Why CSS 3D instead of WebGL models: the 3D props in the old version had to compete with text and lost (soft shadows, small labels, aliasing on projectors). Here the depth moments use the *same* flat objects tilted in perspective (the title table, the phones, the SNAPSHOT photo, the version stack), so text stays sharp and the look stays consistent. If you still want true 3D models for the story slides, the plan marks where they go (§5, "3D option"), and they can be done as stylised, flat-shaded scenes for those slides only.

---

## 2. Visual language (learned once, used everywhere)

Slide 5 teaches this grammar explicitly. After that, the audience reads every mechanism slide the same way.

| Element | Looks like | Means |
|---|---|---|
| **Table** | Large white grid, `dbo.Name` tab, key icon on the PK, cells 72–88 px tall, values 34–38 px | The real data. Always LTR, like SSMS |
| **`NULL`** | Grey italic mono | A real SQL NULL (adds realism) |
| **Session card** | Colored header with badge (T1/T2/W1…), "در حال اجرا" box with the current SQL, "حافظهٔ برنامه" slots, result line | One connection/transaction. The memory slots show what the *application* believes; that gap is where most bugs live |
| **Read** | Request arrow from the card to the row, row flashes in the session color, a value chip flies back into the card's memory | A SELECT copied a value out of the database |
| **Write, not committed** ("wet ink") | Value in the session color, dashed underline, slow shimmer; pills get a dashed border | Written but not committed; can still disappear |
| **Commit** | Ink dries to normal color, a short green glow on the row | Durable |
| **Rollback** | Wet value lifts, blurs and evaporates; the old value fades back in | Never happened |
| **X lock** | Row outlined in the owner's color, diagonal hatch, solid badge `🔒 X · T1` at the row's edge, shackle snaps shut | Exclusive: nobody else may lock this row |
| **S lock** | Dashed outline, lighter hatch, white badge `🔒 S · T2` | Shared: other readers may join, writers must wait |
| **Range (gap) lock** | Hatched bar filling the gap between two keys, small padlock at the side | Nobody may insert between these keys (SERIALIZABLE) |
| **Waiting** | Ring badge of the waiting session parked at the row edge, pulsing, label «منتظر»; card status becomes ⌛ | Blocked on a lock |
| **Result** | SSMS-style message on the card: `(1 row affected)` green, `(0 rows affected)` red, `Msg 1205 …` red | What the database answered |
| **Timeline lanes** | One lane per session at the bottom; chips at numbered ticks; time runs right → left (RTL), arrow labelled «زمان» | The order of events. Brackets mark windows ("پنجرهٔ خطر") |
| **Focus ring** | Thick ink outline around one row | The row this slide is about |
| **Narration line** | One sentence under the title, swapped per click | What just happened, in plain Persian |

**Color rules.** Session colors identify *who*. Green and red are only *verdicts* (correct / anomaly). T2 is magenta, not red, so a T2 lock never reads as an error. Violet is reserved for versions and time (SNAPSHOT).

**Type.** Estedad (Persian, 850 for titles, 500 for narration), JetBrains Mono for SQL and values. Minimum 19 px at 1080p; table values 34–38 px; narration 33 px.

**Motion.** Every click plays one short, causal sequence (0.8–4 s). Arrows draw toward the row, then the row reacts, then the card reacts. Backwards and jumps are instant and exact (the engine seeks a timeline), so the presenter can go back freely. `R` replays the current step.

**Layout grid.** 1920×1080 stage. Title row at the top right, narration under it. Mechanism slides: T2 card left, table centre, T1 card right, lanes at the bottom. Consecutive slides that share a table keep it in exactly the same place, so the transition is a crossfade and the table appears to stay put.

---

## 3. Structure and timing

The expanded deck has **55 slides**. Played in full it is about **42 minutes** plus Q&A. Two shorter paths are marked:

- **Core (≈ 28 min):** slides marked ★.
- **Short (≈ 25 min):** ★ slides minus 9–11, 15, 26–28, 35, 46.

| Part | Slides | Full | Core |
|---|---|---|---|
| Opening | 1–3 | 1:45 | 1:15 |
| 1 · Problems | 4–24 | 17:00 | 11:30 |
| 2 · Tools & isolation | 25–32 | 7:30 | 5:00 |
| 3 · Real case: BulkOperation | 33–47 | 11:00 | 7:30 |
| 4 · Risks in similar systems | 48–53 | 3:30 | 2:15 |
| Closing | 54–55 | 0:45 | 0:45 |

---

## 4. Slide by slide

Each entry: **goal**, **layout**, **clicks** (one line per click), **takeaway**, and status.

### Opening

#### 1 ★ Title · «مشکلات پایگاه دادهٔ چندکاربره در دنیای واقعی» · **DEMO 1**
- **Goal:** state the subject in one image.
- **Layout:** left, a real `dbo.Accounts` table tilted in perspective; right, the title (the word «چندکاربره» in a blue→magenta gradient: two users), subtitle, `SQL Server · RabbitMQ · pep-mms`.
- **Clicks:** (1) rows drop in; two multiplayer cursors (سارا, رضا) glide in and click the *same* cell; the cell starts flickering between `150` and `80` inside a two-color ring.
- **Takeaway:** the whole talk is about that one cell.

#### 2 ★ «یک کاربر، هیچ مشکلی» · the premise
- **Layout:** the same table, flat and centred; one session card on the right.
- **Clicks:** (1) one user reads 100, writes 150, commits: every step green, timeline clean. (2) a second card slides in on the left and reaches for the same row; the timeline grows a second lane. (3) narration: «کد هر کاربر به‌تنهایی درست است؛ ترکیب هم‌زمانشان غلط است».
- **Takeaway:** concurrency bugs live in combinations, not in lines of code.

#### 3 · Map of the talk
- **Layout:** three stations on a right-to-left path, each with a thumbnail of its signature visual: a row with a padlock (مشکلات), the isolation matrix (ابزارها), the item field (یک مورد واقعی).
- **Clicks:** (1) path draws; stations pop in order.

### Part 1 · Problems

#### 4 ★ Story: «آخرین صندلی پرواز» · **DEMO 2**
- **Layout:** two phones in perspective facing each other (رضا · وب‌سایت on the left, سارا · اپ موبایل on the right), real booking UI: route, seat map with 14C glowing green, price, pay button.
- **Clicks:** (1) phones rise in. (2) both taps ripple; a small server log between them: 12:00:00.120 / 12:00:00.135, «فاصله: ۱۵ میلی‌ثانیه»; spinners. (3) both screens: «رزرو شد». (4) phones step apart; two boarding passes for 14C fan out with a red stamp «یک صندلی، دو مسافر»; a single `dbo.Seats` row appears below with arrows from both phones.
- **Takeaway:** behind both screens there was one row.

#### 5 ★ «چطور اسلایدهای بعد را بخوانیم» · the visual grammar
- **Layout:** a small sample table in the middle, one card; a legend column builds on the right.
- **Clicks:** (1) table + "this is real data". (2) card + memory slot: "what the app believes". (3) a read: arrow, flash, chip into memory. (4) a write: X lock badge + hatch + wet ink. (5) commit: ink dries, lock opens. (6) lanes at the bottom: "order of events, right to left".
- **Takeaway:** 45 seconds here makes every later slide faster.

#### 6 · «کدی که هر دو اجرا می‌کنند»
- **Layout:** one code panel (C#-ish pseudo code + SQL) centred; T1 and T2 program counters (blue and magenta arrows) in the gutter.
- **Clicks:** (1) code appears; highlight `if (status == "Free")`. (2) both counters on line 1: "same code, two sessions". (3) note: «برای یک کاربر بی‌عیب است».
- **Optional:** can be folded into slide 7, click 1 (the demo does this).

#### 7 ★ «دو رزرو، یک صندلی» · Lost Update / check-then-act · **DEMO 3**
- **Layout:** seat grid (`14A–14D`), T2 card left, T1 card right, lanes.
- **Clicks:** (1) 14C is Free; focus ring. (2) T1 SELECT: arrow, flash, `'Free'` flies into T1 memory. (3) T2 SELECT: same, 15 ms later. (4) T1 UPDATE: X lock, `Booked · سارا` in wet blue ink. (5) T1 COMMIT: ink dries, lock opens, «رزرو شد». (6) T2's memory still says `'Free'` (red outline: stale); T2 UPDATE knocks `سارا` out of the cell (it falls away in red), commits. (7) bracket on T2's lane over ticks 2–5 «پنجرهٔ خطر»; T1's UPDATE chip is struck through; note «دو پیام رزرو شد، یک صندلی؛ و هیچ خطایی در لاگ نیست»; T1 status «بلیت بی‌صندلی».
- **Takeaway:** locks were there, but they protect the moment of writing, not the gap between reading and writing.

#### 8 ★ «شرط را به خود UPDATE بسپارید» · Conditional UPDATE · **DEMO 4**
- **Layout:** identical to 7 (crossfade, the table doesn't move). Cards show one statement with `AND Status = 'Free'` highlighted; memory slot is `@@ROWCOUNT`.
- **Clicks:** (1) one statement instead of read-decide-write. (2) T1 arrives first: X lock, check tag `Status = 'Free' ✓`, values change, `(1 row affected)`. (3) T2 arrives: parks at the row edge, «منتظر»; lane chip `⌛ WAIT` spans two ticks. (4) T1 commits; T2 takes the lock, re-checks: `Status = 'Booked' ≠ 'Free' ✗`, cell shakes, `(0 rows affected)`. (5) T2's app shows «این صندلی همین الان رزرو شد»; note: one winner, one clear message.
- **Takeaway:** check and write become one atomic step. This is the pattern BulkOperation is built on (callback in slide 39).

#### 9 · Story: «حساب مشترک»
- **Layout:** left an ATM (رضا withdraws 20), right a phone (سارا deposits 50). Same 3D treatment as slide 4.
- **Clicks:** (1) both screens show balance 100. (2) both confirm. (3) bank SMS to both: «موجودی: ۸۰». A small receipt tally: 100 + 50 − 20 = 130.
- **Takeaway:** money disappeared and nobody got an error.

#### 10 ★ «به‌روزرسانی گم‌شده با عدد» · read-modify-write
- **Layout:** `dbo.Accounts` (Id, Owner, Balance); cards with memory `@balance`; a ledger panel under the table: expected vs actual.
- **Clicks:** (1) balance 100. (2) T1 reads 100 into memory. (3) T2 reads 100. (4) T1 computes in memory `100 + 50 = 150` (the arithmetic animates inside the card), writes 150, commits. (5) T2 computes `100 − 20 = 80` from its stale copy, writes 80; the 150 is knocked out. (6) ledger: `100 + 50 − 20 = 130 ≠ 80`, the 50 turns red: «واریز سارا ناپدید شد».
- **Takeaway:** the arithmetic happened in the application, on a stale copy.

#### 11 ★ «محاسبه را به خود دستور بسپارید»
- **Layout:** same as 10 (crossfade).
- **Clicks:** (1) cards now show `SET Balance = Balance + 50` / `Balance - 20`. (2) T1 X-locks, the cell shows `100 → 150` with a small `+50` floating. (3) T2 arrives and waits at the padlock. (4) T1 commits; T2 gets the lock; `150 → 130` with `−20`. (5) ledger turns green: `130 = 130`.
- **Takeaway:** when the statement reads and writes, the row lock covers both.

#### 12 ★ «قفل S و قفل X»
- **Layout:** one large row in the centre; a 2×2 compatibility grid builds in the corner.
- **Clicks:** (1) T1 reads: S badge. (2) T2 and T3 read too: three S badges stack on the same row; grid cell S/S ✓. (3) a writer W arrives: waits until all S badges leave; grid S/X ✗. (4) W holds X; a new reader waits; grid X/S ✗. (5) a second writer waits too; X/X ✗. (6) footnote: how long a reader keeps its S lock is decided by the isolation level (slide 25).
- **Takeaway:** readers share, writers are alone.

#### 13 · Story: «خریدی که با پول خیالی تأیید شد»
- **Layout:** a card terminal showing «تأیید شد ۸۰۰» next to a bank app where a 900 deposit turns into «برگشت خورد».
- **Clicks:** (1) deposit pending. (2) purchase approved. (3) deposit reversed; balance 100, purchase 800.

#### 14 ★ «خواندن کثیف» · Dirty Read
- **Layout:** `dbo.Accounts`; T1 = deposit, T2 = purchase check using `WITH (NOLOCK)`.
- **Clicks:** (1) balance 100. (2) T1 adds 900: X lock, `1000` in wet ink with tag «commit نشده». (3) T2 reads with NOLOCK: the arrow passes *through* the hatch, the padlock shakes but does nothing; `1000` lands in T2 memory; T2 approves 800. (4) T1 rolls back: `1000` evaporates, `100` returns; T2's memory value turns red with «این عدد هرگز وجود نداشت». (5) strip at the bottom: under READ COMMITTED T2 would wait at the padlock (mini replay), under RCSI it would read the committed 100 (mini polaroid).
- **Takeaway:** NOLOCK reads wet ink.

#### 15 · «خواندن تکرارنشدنی» · Non-Repeatable Read
- **Layout:** a report document (header, subtotal rows, total) beside the table.
- **Clicks:** (1) report transaction begins; subtotal reads Sara = 500. (2) T1 updates Sara to 900, commits. (3) report reads again for the total: 900. (4) the report shows subtotal 500 and total computed with 900; red mismatch line.
- **Takeaway:** inside one transaction, the same row gave two answers.

#### 16 ★ «ردیف شبح» · Phantom
- **Layout:** gapped `dbo.Orders` (orders of today, keys with visible gaps between rows).
- **Clicks:** (1) report counts today's orders: 3; S locks on all three rows stay held. (2) T1 inserts a new order: it slides into the gap between two locked rows; no lock blocks it. (3) the report counts again: 4. (4) narration introduces the idea that the *gaps* need protecting; the gaps glow.
- **Takeaway:** locking rows can't stop rows that don't exist yet.

#### 17 · Story: «دو پزشک کشیک»
- **Layout:** a hospital rota board with two doctor cards, rule banner «دست‌کم یک پزشک کشیک».
- **Clicks:** (1) both feel sick. (2) both open the app: "the other one is on call". (3) both request leave; the board ends empty.

#### 18 ★ «هر دو درست، با هم غلط» · Write Skew
- **Layout:** `dbo.OnCall` (Doctor, Shift, OnCall); an "invariant meter" (on-call count, threshold 1) beside it.
- **Clicks:** (1) two rows OnCall = 1; meter at 2. (2) T1 and T2 both run `SELECT COUNT(*) … = 2` (two scans). (3) T1 updates *its own* row: X lock on row A. (4) T2 updates *its own* row: X lock on row B; the two locks never meet. (5) both commit; meter drops to 0 in red. (6) note: no shared row, no conflict, and SNAPSHOT doesn't catch it either.
- **Takeaway:** the conflict is between a read and a write on *different* rows.

#### 19 · «سه راه برای Write Skew»
- **Layout:** three narrow panels with mini tables.
- **Clicks:** (1) SERIALIZABLE: range lock on `Shift = 'night'`; T2's update waits. (2) `UPDLOCK` on the rows you read: T2 waits at the read. (3) put the rule in the write: `UPDATE … WHERE (SELECT COUNT(*) …) > 1`, `(0 rows affected)` for the second doctor.

#### 20 ★ «هر کدام منتظر دیگری» · Deadlock · **DEMO 6 (clicks 1–6)**
- **Layout:** `dbo.Orders` above `dbo.Stock` in the centre; T2 (انبار) left, T1 (سفارش) right; cards list the two statements in each session's order; lanes.
- **Clicks:** (1) opposite orders highlighted. (2) T1 X-locks order 7001 (wet `Paid`). (3) T2 X-locks product 42 (wet `18`). (4) T1 wants 42: parks at its edge, ⌛. (5) T2 wants 7001: parks; a red dashed loop draws around both tables, running through the four locks and waits; label «T1 منتظر T2 · T2 منتظر T1». (6) Lock Monitor card appears with a spinning radar; T2 becomes «قربانی», `Msg 1205 … deadlock victim`; its write evaporates; T1 takes the lock and commits.
- **Takeaway:** deadlocks can't be prevented by the database, only detected.

#### 21 ★ «ترتیب ثابت» · deadlock fix · **DEMO 6 (click 7)**
- **Clicks:** (1) T2's two statements swap order (highlight). Replay: T1 locks Orders; T2 waits at Orders (holding nothing); T1 locks Stock, commits; T2 proceeds. Lanes show a queue, not a cycle. Checklist: fixed order, short transactions, retry on 1205.
- **Extra click (planned):** a 6-line retry loop with backoff for 1205/1222.

#### 22 · Story: «حراج و شمارندهٔ فروش»
- **Layout:** product page with a big counter «فروخته شد: ۹٬۲۱۳», a crowd of buy buttons.

#### 23 ★ «همه پشت یک ردیف» · Hot Row
- **Layout:** a one-row `dbo.Counters` table; a queue of waiter badges stretches sideways; two gauges: throughput (flat) and CPU (low).
- **Clicks:** (1) one increment: lock, +1, commit. (2) ten sessions arrive: the waiter queue grows to the edge of the screen. (3) time-lapse: each commit lets exactly one waiter in; throughput gauge stays flat while CPU idles.
- **Takeaway:** a single row serialises everyone, however strong the server is.

#### 24 ★ «شمارنده را پخش کنید، یا اصلاً نگه ندارید»
- **Clicks:** (1) the counter splits into 8 shard rows; writers spread out; queues shrink to one or two. (2) a reader sums the shards (`SUM(Value)`). (3) alternative: derive from data (`COUNT(*) … GROUP BY Status`). "We'll meet this again in BulkOperation" (slide 43).

### Part 2 · Tools and isolation

#### 25 ★ «یک گزارش، پنج قانون» · Isolation levels · **DEMO 5**
- **Layout:** gapped `dbo.Accounts` with keys 10, 20, 30; T1 (writer: `INSERT 25`, `UPDATE 20`) left, T2 (report: the same range read twice) right; at the bottom an anomaly matrix (legend + five level columns, each with its cost line).
- **Clicks:** (1) the scenario. (2) READ UNCOMMITTED: T1's insert is still wet; T2's scan band sweeps with no locks and counts it; T1 rolls back, row evaporates; T2's result struck through; column ✗✗✗. (3) READ COMMITTED: the S badge hops row to row and lets go; both T1 changes slip in between the reads; `3 rows · 1,450` then `4 rows · 2,050`; ✓✗✗. (4) REPEATABLE READ: S badges stay; T1's update waits at row 20 but the insert slides into a gap; `4 rows · 1,800`; ✓✓✗. (5) SERIALIZABLE: the gaps fill with hatched range locks; T1's `INSERT 25` waits outside the gap; both reads equal; ✓✓✓, cost «T1 منتظر ماند». (6) SNAPSHOT: camera flash; a polaroid of the table pins onto T2's card; T1 changes the live table freely; T2 reads the photo twice; ✓✓✓, nobody waited.
- **Takeaway:** a level is a choice of how long readers lock, and over what.

#### 26 · «قفل بازه از نزدیک»
- **Layout:** zoomed-in gapped table with key-range labels `(10..20]`, `(20..30]`, `(30..∞)`.
- **Clicks:** (1) range locks drawn with their key ranges. (2) `INSERT 25` blocked, `INSERT 40` blocked too (next range). (3) without an index on the predicate, the scan locks every row and every gap: the whole table turns hatched. Message: SERIALIZABLE needs the right index.

#### 27 · «SNAPSHOT از درون» · version store in 3D
- **Layout:** the table tilts back in CSS 3D; behind row 20 a stack of translucent version cards (`650 @ 12:00:00`, `900 @ 12:00:04`), linked to a `tempdb` cylinder.
- **Clicks:** (1) tilt reveals depth. (2) T1 updates: a new version card slides to the front; the old one moves back into tempdb. (3) a violet "snapshot time" plane slices the stack at T2's start; T2's arrow reads the card behind the plane. (4) RCSI vs SNAPSHOT: one photo per statement (two polaroids) vs one per transaction (one polaroid).
- **3D option:** this is the best place for a real 3D scene if wanted.

#### 28 · «تعارض در SNAPSHOT»
- **Clicks:** (1) two SNAPSHOT transactions read row 20. (2) T1 updates and commits. (3) T2 updates the same row: `Msg 3960 … update conflict`; T2 must retry. SNAPSHOT is optimistic by nature.

#### 29 ★ «جدول خلاصه»
- **Layout:** the finished matrix from 25, enlarged, plus a Write Skew column and a cost row.
- **Clicks:** (1) matrix. (2) Write Skew column: only SERIALIZABLE ✓. (3) note: SQL Server default is READ COMMITTED with locking; Azure SQL Database defaults to RCSI. «پیش‌فرض را کورکورانه نپذیرید».

#### 30 ★ «قفل بدبینانه» · `UPDLOCK`
- **Layout:** `dbo.Products` (Id, Stock); T1 and T2 both want to reserve stock.
- **Clicks:** (1) T1 `SELECT … WITH (UPDLOCK, ROWLOCK)`: a **U** badge (new color treatment: outlined with a solid corner). (2) a normal reader passes (U is compatible with S). (3) T2's UPDLOCK read waits at the door. (4) T1 decides, updates (U → X), commits; T2 reads the fresh value.
- **Takeaway:** reserve first, decide second; cost is waiting.

#### 31 ★ «قفل خوش‌بینانه» · `rowversion`
- **Layout:** `dbo.Products` with a visible `RowVersion` column (`0x07D1`); two admin edit forms (price) on both sides.
- **Clicks:** (1) both forms load v = 07D1. (2) admin 1 saves `WHERE RowVersion = 0x07D1`: 1 row; the version cell ticks like an odometer to 07D2. (3) admin 2 saves with 07D1: `(0 rows affected)`; the form shows «کس دیگری زودتر تغییر داد؛ دوباره بارگذاری کنید». No lock was held while the forms were open.
- **Takeaway:** good where conflicts are rare and humans are slow.

#### 32 ★ «سه ابزار، کِی کدام؟»
- **Layout:** decision table: pessimistic / optimistic / conditional UPDATE × (conflict rate, who waits, what the app sees, typical use). Each row has the tiny signature visual (U badge, version odometer, `1 / 0 rows`).
- **Clicks:** rows reveal one by one; the third row is highlighted «ستون اصلی مورد واقعی ما».

### Part 3 · Real case: BulkOperation in pep-mms

#### 33 ★ Chapter · **DEMO 7**
- **Layout:** a live field of ~5,000 squares (one per item) with a processing front sweeping right to left (Queued grey → Processing blue → Succeeded green, a few red Failed); a centred card with the title.
- **Clicks:** (1) title and lede. (2) three numbers (۵۰۰٬۰۰۰ items in the load test · ۳ API instances · ۱ source of truth) and the requirement «هیچ آیتمی دو بار اجرا نشود، و هیچ آیتمی جا نماند».
- **Note:** 500,000 is the load-test size the tool is built for, not a performance claim.

#### 34 ★ «تصویر کلی»
- **Layout:** flat architecture diagram: client → API ×3 → SQL Server (`BulkOperation`, `BulkOperationItems`) ⇄ RabbitMQ → the same 3 instances as consumers.
- **Clicks:** (1) one request enters. (2) it fans out into item rows. (3) items flow into the queue and back to the instances. (4) the database glows: "every decision is made here".

#### 35 · «ثبت دسته‌ای»
- **Clicks:** (1) row-by-row INSERT: a ping-pong of round trips with a counter racing to 500,000 and a clock. (2) `SqlBulkCopy`: one block slides into the table. Side-by-side timers.

#### 36 ★ «پنجرهٔ ارسال» · backpressure
- **Layout:** the items table zoomed out (many thin rows); a window frame of N rows; a queue gauge.
- **Clicks:** (1) only rows inside the window are published. (2) as rows complete, the window slides down; the gauge stays bounded. (3) cancel: only the window is in flight, so cancel takes effect quickly.

#### 37 ★ «دست‌کم یک‌بار»
- **Clicks:** (1) an envelope (item 42) travels to a consumer. (2) the consumer crashes before ack; the ack never returns. (3) the broker redelivers: two envelopes for item 42 now exist. «پیام تکراری را عادی بدانید».

#### 38 · «چند مصرف‌کننده»
- **Clicks:** (1) three instances pull from the same queue. (2) their memory bubbles disagree about item 42. (3) only the database's answer counts.

#### 39 ★ «یک آیتم، یک صاحب» · claim · **DEMO 8**
- **Layout:** `dbo.BulkOperationItems` (Id, Status, Attempt, LockToken, LockUntil); three worker cards (api-1/2/3) each holding the same message `item=42 seen=0`; the claim statement below the table with the `AND Status = 'Queued' AND AttemptCount = @seen` part highlighted.
- **Clicks:** (1) duplicate delivery. (2) all three fire; api-1 takes the X lock, both conditions ✓, row becomes Processing with token `7f3a` and a lease time; W2 and W3 queue at the row edge. (3) lock released; W2 and W3 re-check: `Status = 'Processing' ≠ 'Queued' ✗`, `(0 rows affected)`, messages acked and discarded. (4) note «همان الگوی صندلی 14C».
- **Takeaway:** no explicit lock, no long transaction; the database picks the owner.

#### 40 ★ «اجاره، نه قفل ابدی» · **DEMO 9 (clicks 1–2)**
- **Clicks:** (1) without expiry: api-1 crashes, the item stays Processing; a clock chip ticks «۱ دقیقه… ۱ ساعت… ۱ روز». (2) with a lease: `LockUntil` gets a progress bar inside the cell; api-1's heartbeat (pulse ring) refills it every few seconds; the heartbeat UPDATE is shown with `AND LockToken = '7f3a'`.

#### 41 ★ «کارگر زامبی و توکن حصار» · **DEMO 9 (clicks 3–5)**
- **Clicks:** (3) api-1 freezes in a GC pause (card greys out); the bar drains green → amber → red; the DB clock passes `LockUntil`. (4) the sweeper statement runs: row back to Queued, Attempt 1, token NULL; api-2 claims with token `c91e`; bar refills. (5) api-1 wakes and writes its result `WHERE LockToken = '7f3a'`: the LockToken cell is marked, tag `'c91e' ≠ '7f3a' ✗`, the row shakes, `(0 rows affected)`, «نتیجهٔ کهنه رد شد».
- **Takeaway:** a lease alone isn't enough; every write must prove ownership (fencing token).

#### 42 ★ «جاروکش و سقف تلاش»
- **Clicks:** (1) the sweeper sweeps several expired rows back to Queued (a broom pass across the table). (2) one poison item cycles: Attempt 1 → 2 → … → 5, a ring around its Attempt cell fills. (3) at 5 it becomes Failed and leaves the cycle.

#### 43 ★ «شمارنده‌ها مشتق‌اند»
- **Clicks:** (1) `BulkOperation.SucceededCount++` after every item: three workers queue behind one row (the hot row from 23, same visual). (2) replaced by a periodic `COUNT(*) … GROUP BY Status`; the progress bar is computed from items; no queue.

#### 44 · «لغو یک وضعیت است»
- **Clicks:** (1) operation row → Cancelled. (2) at their next heartbeat the workers see it and stop by themselves (their cards switch to «لغو شد»). (3) a cancel wave sweeps the remaining Queued items in batches over the item field.

#### 45 · «خطای گذرا یعنی دوباره»
- **Layout:** a sorting gate: errors arrive as chips (`1205`, `1222`, timeout, network, `BusinessRuleViolation`).
- **Clicks:** (1) transient errors go back to the queue with growing delays (1 s, 2 s, 4 s). (2) business errors go straight to Failed. «تکرار خطای کسب‌وکار فقط بار اضافه است».

#### 46 · «یک ساعت مرجع»
- **Clicks:** (1) two servers with clocks 5 s apart judge the same lease: one says expired, the other says alive: two owners. (2) fix: `SYSUTCDATETIME()` inside the statement; both servers ask the same clock.

#### 47 ★ «اثبات، نه امید»
- **Layout:** the load-test checker as three SQL queries with result gauges.
- **Clicks:** (1) overlapping executions = 0. (2) duplicate effects = 0. (3) counters = statuses. All green. «ادعای درستی هم‌زمانی بدون آزمونی که دنبال هم‌پوشانی بگردد، فقط امید است».

### Part 4 · Risks in similar systems

Each is one slide, about 30 s, with the same three-beat structure: what breaks (animation) → why → the fix (green panel).

#### 48 ★ «اثر بیرون از پایگاه داده»
- A worker calls an external payment API, times out, retries: the destination receives two calls. Fix: an idempotency key the destination checks; the second call returns the first result.

#### 49 ★ «نوشتن دوگانه»
- "Save, then publish": the process dies between the two; the row is saved, the message never sent. Fix: outbox row in the same transaction + a relay; or the BulkOperation sweeper that republishes stuck rows.

#### 50 · «توقف طولانی»
- Callback to slide 41 in 15 seconds: a lease without a token is not enough.

#### 51 ★ «پیام سمی»
- One item always throws; it circles forever and eats capacity. Fix: attempt cap, dead-letter, separate permanent from transient errors.

#### 52 ★ «تشدید قفل» · lock escalation
- A big UPDATE: padlocks multiply on rows (counter to ~5,000), then collapse into one giant padlock over the whole table; every other session starts waiting. Fix: small batches, an index that matches the predicate.

#### 53 ★ «طوفان تلاش دوباره»
- After an outage all clients retry at the same second: a spike chart. Fix: exponential backoff with jitter: the same chart, spread out.

### Closing

#### 54 ★ «داور، پایگاه داده است» · **DEMO 10**
- Five rules with one-line explanations, and the closing sentence: «هم‌زمانی را نمی‌شود حذف کرد؛ فقط می‌شود طوری طراحی کرد که وقتی رخ داد، پایگاه داده حَکَم باشد».
- **Planned:** the title's two cursors return, each now on its own row, both green.

#### 55 ★ Q&A
- The item field from slide 33 settles into all green behind «پرسش و پاسخ»; prepared answers from `SCRIPT.md` (why not Redis locks, why not SERIALIZABLE, what if the database goes down).

---

## 5. 3D option

If true 3D models are still wanted, use them only where depth carries meaning, and keep the flat grammar for everything else:

| Slide | What the 3D adds |
|---|---|
| 4, 9, 13, 17, 22 (stories) | A small stylised scene (phone, ATM, card terminal, rota board, sale page), flat-shaded, two-tone, no realism |
| 27 (version store) | A real stack of row versions with a slicing time plane |
| 33 (chapter) | The item field as a deep 3D grid with a moving front |

---

## 6. How the demo is built

- `demo/src/core/deck.ts`: navigation. Each slide owns a paused GSAP timeline; step *k* ends at label `s{k}`. Forward plays one step; back and jumps seek, so state is always exact. Hash `#slide.step`, `R` replays a step, `F` fullscreen, `B` blank.
- `demo/src/kit/table.ts`: `DbTable` (values, wet ink, dry, evaporate, X/S/U locks, waiters, gap locks, inserts, removes). Geometry is computed, not measured, so arrows always land on the right row even after inserts.
- `demo/src/kit/parts.ts`: session cards, timeline lanes, arrows, flying chips, notes.
- `demo/src/slides/*.ts`: one file per slide; most of each file is choreography (`t.add(table.lock(...), 0.8)`).
- New slides reuse the same calls; a typical mechanism slide is 80–150 lines.

---

## 7. Decisions I need from you

1. **Length.** The full plan is about 42 minutes. Keep it, or build only the ★ core (≈ 28 min) or the 25-minute cut?
2. **3D.** Keep the CSS-3D story illustrations as in the demo, or try stylised 3D models for the story slides (§5)?
3. **Stories.** Seat, shared wallet, card purchase, doctors, flash sale. Swap any for examples closer to your audience (for example, payment terminals from pep-mms itself)?
4. **Presenter name and event** for the title slide.
