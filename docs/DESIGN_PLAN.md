# Design plan: «مشکلات پایگاه دادهٔ چندکاربره در دنیای واقعی»

Course: درس پایگاه داده · Instructor: دکتر محمد سلطانیان · Presenters: حسام جوادی، علی‌محمد قلی‌زاده · Audience: university students.

The full deck is built in `demo/` (61 slides, about 640 clicks). Run `npm run dev` and open `http://localhost:5180/demo/`, or open the single offline file from `npm run standalone`.

---

## 1. How the deck teaches

The structure follows a few well-tested principles from instructional design. Each one is a concrete rule in the deck, not a slogan.

| Principle | What it says | How the deck applies it |
|---|---|---|
| **Segmenting** (Mayer) | People learn better when a process is cut into learner-paced pieces | One click = one action on the table (a read, a lock, a write, a commit). Each animation plays slowly and then waits. Pressing the key during an animation lets it finish faster and queues the next step, so no action is ever skipped |
| **Pre-training** (Mayer) | Learn the names and parts before the process | Part 1 teaches transaction, commit/rollback, interleaving and S/X locks before any anomaly appears. Each basics slide introduces one visual symbol, and a legend slide recaps them |
| **Coherence** (Mayer) | Leave out what isn't needed | Every slide opens with **only its title**. The table, cards, timeline and notes are added one per click, so the screen never shows more than the current idea needs |
| **Signaling** (Mayer) | Highlight what matters | A focus ring marks the row under discussion; locks hatch the row; the cell a `WHERE` checks gets a frame; stale memory gets a red outline |
| **Spatial and temporal contiguity** (Mayer) | Put words next to what they describe, at the moment it happens | The narration line changes on every click and describes exactly that action; labels sit on the rows and devices they name |
| **Concreteness fading** | Go from a concrete case to the general idea | Each problem has three stages: a real-life story (3D), the same moment on the real table, then a **rule card** with the general definition |
| **Worked example, then contrast** | Show a full solution; compare wrong and right | The race slide is followed by its fix with the same layout, so the only thing that changes is the code |
| **Prediction (predict–observe–explain)** | Asking learners to predict makes the answer stick | Before key moments a violet «پیش‌بینی کنید» card asks the audience what will happen (for example «رضا چه عددی می‌نویسد؟») and the next click reveals it |
| **Retrieval practice** | Recalling beats re-reading | A recap quiz closes Part 2 (seven symptoms → name the problem); the isolation matrix is filled in across slides and reviewed at the end |
| **Advance organizer** | Give the map first | A roadmap slide shows the five parts before the talk starts |
| **Activation of prior knowledge** (Merrill) | Start from what learners already know | Every story comes from student life: course registration at 8 AM, grade entry, exam proctors, add/drop week |

References for the principles: Mayer's multimedia principles ([Dartmouth summary](https://services.dartmouth.edu/TDClient/1806/Portal/KB/PrintArticle?ID=171655), [Mayer 2020 overview, PDF](https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf), [Multimedia Learning, 3rd ed.](https://www.lavoisier.fr/livre/sciences-humaines-et-sociales/multimedia-learning/descriptif_4369235)) and the worked-example effect ([overview](https://en.wikipedia.org/wiki/Worked-example_effect)). Concreteness fading, predict–observe–explain and Merrill's first principles are from my own background knowledge; I did not look them up for this plan.

---

## 2. Visual language

| Element | Looks like | Means |
|---|---|---|
| Table | Large grid, `dbo.Name` tab, key icon, LTR like SSMS | Real data |
| `NULL` | Grey italic mono | A real SQL NULL |
| Session card | Colored header (T1 blue, T2 magenta, T3 amber), «در حال اجرا» box, «حافظهٔ برنامه» slots, result line | One transaction and what its application believes |
| Read | Arrow to the row, row flashes, value chip flies into memory | A SELECT copied a value out |
| Wet ink | Value in the session color, dashed underline, shimmer | Written, not committed |
| Dry ink / evaporation | Ink turns normal / value blurs away and the old one returns | COMMIT / ROLLBACK |
| X lock | Solid outline, diagonal hatch, solid padlock badge | Exclusive |
| S lock | Dashed outline, light hatch, white badge | Shared |
| U lock | Solid outline, white badge with a colored base | Update lock (`UPDLOCK`) |
| Range lock | Hatched bar filling a gap between keys | No inserts here (SERIALIZABLE) |
| Waiting | Pulsing ring badge at the row edge, «منتظر» | Blocked on a lock |
| Timeline lanes | One lane per session, time right → left | Order of events; dashed brackets mark danger windows |
| Rule card | Centered card over a dimmed slide | The general rule behind the example |
| Prediction card | Violet card with lettered options | A question for the audience |

Green and red are only verdicts (correct / anomaly). T2 is magenta so it never reads as an error. Violet is for versions, time and questions.

**3D story slides.** Five stories are small flat-shaded, low-poly dioramas (Three.js): a classroom with 30 seats, a professor's desk and a student's phone, an exam hall with two proctors, two classroom doors, and a queue at one gate. Labels and phone screens are HTML pinned to the 3D objects, so text stays sharp. Each diorama is built up one piece per click like every other slide.

---

## 3. Structure (61 slides)

| Part | Slides | Clicks |
|---|---|---|
| Opening | 1–2 | 7 |
| 1 · Basics | 3–6 | ~45 |
| 2 · Problems | 7–23 | ~230 |
| 3 · Tools | 24–35 | ~140 |
| 4 · A real system | 36–54 | ~170 |
| 5 · Risks and closing | 55–61 | ~45 |

At roughly 4 seconds per click this is about 45 minutes plus Q&A.

### Opening
1. **Title** — a tilted `dbo.Accounts` table; two cursors (سارا, رضا) land on the same cell, which flickers between two values. Course, instructor and presenters.
2. **نقشهٔ راه** — five stations appear one per click: basics, problems, tools, a real system, risks.

### Part 1 · Basics (pre-training)
3. **تراکنش چیست؟** — Sara moves from group 1 to group 2: two wet updates, COMMIT dries both. Reza's move hits a full group: `CHECK` fails, ROLLBACK evaporates his first change. Rule: all or nothing.
4. **چند کاربر، یک پایگاه داده** — two sessions' statements land in the lanes one at a time; four of the six possible orders are shown. Rule: correct code must survive any order.
5. **قفل اشتراکی و انحصاری** — two readers share S locks; a writer waits; readers leave; the writer takes X; a reader now waits. A 2×2 compatibility grid fills in.
6. **چطور اسلایدهای بعد را بخوانیم** — the seven symbols, one per click.

### Part 2 · Problems (story → table → rule)
7. **آخرین صندلی کلاس** (3D) — classroom with 29 of 30 seats taken; Sara (laptop, dorm) and Reza (phone, home) both press «ثبت» at 08:00:00; both get «ثبت شد»; both walk to the same chair; the board reads «۳۱ دانشجو · ۳۰ صندلی».
8. **دو ثبت‌نام، یک صندلی** (Lost Update) — `Sections` row 29/30; both read 29 into memory; Sara writes 30 and commits; a prediction card asks what Reza writes; Reza's stale 29 makes him write 30 over hers; danger-window bracket; tally «۳۱ ثبت‌نام · شمارنده ۳۰»; rule card.
9. **شرط و محاسبه، داخل UPDATE** — `SET Enrolled = Enrolled + 1 WHERE … AND Enrolled < Capacity`; Sara gets 1 row; Reza waits, re-checks 30 < 30, gets 0 rows and a clear message; rule: conditional atomic UPDATE.
10. **نمره‌ای که هرگز ثبت نشد** (3D) — the professor's unsaved 18 travels to the database; Nima sees 18 and celebrates; the save fails and the packet evaporates; next day the grade is gone.
11. **خواندنِ جوهر خیس** (Dirty Read) — `Grades`; X lock and wet 18; prediction card; `NOLOCK` arrow passes through the lock; ROLLBACK; Nima's memory turns red; note on READ COMMITTED/RCSI; rule.
12. **کارنامه‌ای که با خودش نمی‌خواند** (Non-Repeatable Read) — the report reads 14 for the course list, a correction commits 17, the report reads 17 for the GPA; rule.
13. **فهرستی که شلوغ‌تر شد** (Phantom) — gapped `Enrollments`; REPEATABLE READ holds S locks on three rows; Nima's row slides into a gap; count 3 → 4; the gaps glow; rule.
14. **دو مراقب امتحان** (3D) — exam hall, rule «دست‌کم یک مراقب»; each proctor sees the other is present; both leave through different doors; students turn to each other; «مراقب در سالن: ۰».
15. **هر دو درست، با هم غلط** (Write Skew) — `Proctors`, an on-duty meter; both count 2; each X-locks only its own row; both commit; meter 0; note: SNAPSHOT doesn't help; rule.
16. **سه راه برای Write Skew** — SERIALIZABLE, `UPDLOCK, HOLDLOCK` on what you read, the rule inside the UPDATE; each panel then its outcome.
17. **جابه‌جایی گروه** (3D) — two classroom doors; Sara holds door 1, Reza door 2; each reaches for the other's; a red loop «هر کدام منتظر دیگری».
18. **هر کدام منتظر دیگری** (Deadlock) — rows 1 and 2 locked in opposite orders; two waits; red cycle; Lock Monitor; Reza is the victim (1205); Sara finishes; rule.
19. **همه با یک ترتیب** — both lock Id 1 first; Reza queues holding nothing; Sara finishes; Reza follows; retry loop for 1205; rule.
20. **همه پشت یک باجه** (3D) — 8 AM queue at one gate; one person passes at a time; «سرور: ۸٪ مشغول»; extra gates appear and the queue splits.
21. **همه پشت یک ردیف** (Hot Row) — `Stats.TotalEnrollments`; one holder, a queue of waiters; each commit advances the queue by one; throughput and CPU gauges; rule.
22. **شمارنده را پخش کنید، یا اصلاً نگه ندارید** — four shard rows locked at once; SUM to read; or derive from `COUNT(*)`; rule.
23. **کدام مشکل؟** — seven symptoms; each click reveals the problem's name.

### Part 3 · Tools
24. **سطح جداسازی یعنی چه؟** — the five levels as a dial; two questions (do readers lock, and for how long? or read an old version?); correctness vs concurrency; definition card.
25–29. **READ UNCOMMITTED / READ COMMITTED / REPEATABLE READ / SERIALIZABLE / SNAPSHOT** — one slide each, same scenario: a report reads grades 10–30 twice while the professor inserts 25 and corrects 20. The reader's scan band shows the level's behaviour (no locks, brief S, held S, held S plus range locks, reading from a photo). The matrix at the bottom carries earlier answers and fills in this level's column; a summary card ends each slide.
30. **عکس از کجا می‌آید؟** — version cards stack into tempdb as row 20 changes; a reader that started at 12:00:03 picks the version valid then; RCSI vs SNAPSHOT.
31. **وقتی دو نفر یک نسخه را تغییر می‌دهند** — SNAPSHOT update conflict, Msg 3960.
32. **همهٔ سطوح، یک‌جا** — the full matrix plus a Write Skew row; defaults (SQL Server: READ COMMITTED with locks; Azure SQL Database: RCSI).
33. **اول رزرو، بعد تصمیم** (UPDLOCK) — prerequisite check in the app; U lock; second reader waits; U → X; the second sees the fresh value and stops.
34. **کار کن، موقع ذخیره بسنج** (rowversion) — two staff edit a room; first save 1 row and the version ticks; second save 0 rows and «دوباره بارگذاری کنید».
35. **سه ابزار؛ کِی کدام؟** — decision table; the conditional UPDATE row is highlighted as the base of the real system.

### Part 4 · A real system (no product name): need → design → concurrency issues
36. **Chapter** — a live field of items changing status; what the system does; 500,000 items, 3 instances, 1 source of truth.
37. **یک کلیک، ۵۰۰٬۰۰۰ کار** — the need: one user action over 500k items, each an external call of ~200 ms → about 28 hours one by one; why one HTTP request can't do it (timeout, restarts, no progress or cancel, one server only); student analogy (sending 500k graduates' records to the ministry).
38. **از سامانه چه می‌خواستیم؟** — seven requirements; «دقیقاً یک بار» is singled out as where concurrency enters.
39. **دو جدول: عملیات و آیتم‌هایش** — `BulkOperation` and `BulkOperationItems`, explained column by column.
40. **چرخهٔ عمر یک آیتم** — Pending → Queued → Processing → Succeeded / Failed, the way back to Queued, and Cancelled.
41. **مسیر یک آیتم** — user → API (3 instances) → SQL Server → dispatcher → RabbitMQ → workers → external service → back to SQL Server.
42. **نیم میلیون ردیف، یکجا** — row-by-row INSERT round trips vs `SqlBulkCopy`.
43. **همه را یکجا در صف نریزید** — the dispatch window slides down the item column; the queue stays bounded.
44. **صف قول «دست‌کم یک‌بار» می‌دهد** — a worker crashes before ack; the same message goes to another worker.
45. **سه سرور، یک صف، یک پایگاه داده** — three workers each believe item 42 is theirs; only the database decides.
46. **مسئلهٔ ۱ · پیام تکراری** — three workers race; conditional claim; 1 row vs 0 rows.
47. **مسئلهٔ ۲ · کارگر مرده** — without expiry the item is stuck forever; with a lease bar and heartbeat it frees itself.
48. **مسئلهٔ ۳ · Fencing Token** — GC pause, lease expires, sweeper requeues, api-2 claims with a new token, api-1's stale write gets 0 rows.
49. **مسئلهٔ ۴ · پیام سمی** — the sweeper requeues expired leases with one more attempt; the fifth failure becomes Failed.
50. **مسئلهٔ ۵ · ردیف داغ** — `Succeeded++` queues everyone behind one row; replaced by periodic `COUNT(*) GROUP BY Status`.
51. **مسئلهٔ ۶ · لغو** — one UPDATE to Cancelled; the heartbeat's extra condition returns 0 rows and workers stop themselves; remaining items cancelled in batches.
52. **مسئلهٔ ۷ · تلاش دوباره** — error chips sorted into transient (retry with exponential backoff and jitter) and permanent (fail now).
53. **مسئلهٔ ۸ · اختلاف ساعت** — two server clocks 7 s apart produce two owners; fix: `SYSUTCDATETIME()` inside the statement.
54. **اثبات، نه امید** — the load test's three database checks: no overlapping executions, no duplicate effects, counters equal statuses.

### Part 5 · Risks and closing
55. **اثر بیرونی** — a grade SMS sent twice after a lost response; idempotency key.
56. **نوشتن دوگانه** — saved but never published; Outbox in the same transaction.
57. **دو خطر که قبلاً حلشان کردیم** — long pause (fencing) and poison message (attempt cap).
58. **تشدید قفل** — 240 cells light up as locks reach ~5,000, then one table lock covers everything; batched UPDATE.
59. **طوفان تلاش دوباره** — synchronized retry spikes above capacity vs jittered backoff.
60. **پنج قانون برای بردن به خانه** — one rule per click and the closing sentence.
61. **پرسش و پاسخ** — thanks, presenters, instructor, course.

---

## 4. How it is built

- `demo/src/core/build.ts` — the slide author. `b.s(narration, t => …)` adds one click; `b.show(narration, el)` reveals an element. Every slide opens title-only.
- `demo/src/core/deck.ts` — navigation. Each slide owns a paused GSAP timeline with a label per click. Forward plays one step at `PACE` (0.78× the authored speed); back and jumps seek exactly. A key press during an animation speeds it up and queues the next step.
- `demo/src/kit/table.ts` — tables, wet/dry/evaporate, X/S/U locks, waiters, gap locks, inserts.
- `demo/src/kit/parts.ts` — session cards, lanes, arrows, flying chips, notes, rule cards, prediction cards, diagram nodes.
- `demo/src/kit/three3d.ts` — the flat-shaded 3D kit (people, desks, chairs, laptop, phone, board, door, gate, database stack, data packet) with HTML pins.
- `demo/src/slides/p*.ts` — one file per part.

Controls: Space / PageDown / ← / click next; PageUp / → / right-click back; `R` replays a step; `Home` / `End`; `F` fullscreen; `B` blank. The hash keeps your place (`#8-12` is slide 8, click 12).
