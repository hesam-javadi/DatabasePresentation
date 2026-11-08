# Design plan: «مشکلات پایگاه دادهٔ چندکاربره در دنیای واقعی»

Course: درس پایگاه داده · Instructor: دکتر محمد سلطانیان · Presenters: حسام جوادی، علی‌محمد قلی‌زاده · Audience: university students.

The full deck is built in `demo/` (57 slides, about 295 clicks). Run `npm run dev` and open `http://localhost:5180/demo/`, or open the single offline file from `npm run standalone`.

---

## 1. How the deck teaches

The structure follows a few well-tested principles from instructional design. Each one is a concrete rule in the deck, not a slogan.

| Principle | What it says | How the deck applies it |
|---|---|---|
| **Segmenting** (Mayer) | People learn better when a process is cut into learner-paced pieces | One click = one action on the table (a read, a lock, a write, a commit). Each animation plays slowly and then waits. Pressing the key during an animation lets it finish faster and queues the next step, so no action is ever skipped |
| **Pre-training** (Mayer) | Learn the names and parts before the process | Part 1 teaches transaction, commit/rollback, interleaving and Shared/Exclusive locks before any problem appears. Each basics slide introduces the visual symbols it uses |
| **Coherence** (Mayer) | Leave out what isn't needed | No slide opens empty: the first click already shows the title together with the first real content (the table, the cards or the scene). After that, related pieces arrive together and steps that only added a decoration were merged, so each click carries one idea |
| **Signaling** (Mayer) | Highlight what matters | Every problem slide carries a badge «مشکل N از ۷ · name · stage» (story, on the table, fix), the Part 4 challenges carry «چالش N از ۸», and a problem map opens Part 2. Within a slide, a focus ring marks the row under discussion; locks hatch the row; the cell a `WHERE` checks gets a frame; stale memory gets a red outline |
| **Spatial and temporal contiguity** (Mayer) | Put words next to what they describe, at the moment it happens | The narration line changes on every click and describes exactly that action; labels sit on the rows and devices they name |
| **Concreteness fading** | Go from a concrete case to the general idea | Each problem has three stages: a real-life story (3D), the same moment on the real table, then a **rule card** with the general definition |
| **Worked example, then contrast** | Show a full solution; compare wrong and right | The race slide is followed by its fix with the same layout, so the only thing that changes is the code |
| **Prediction (predict–observe–explain)** | Asking learners to predict makes the answer stick | At the key moment of Problem 1 a compact violet «پیش‌بینی کنید» card asks «رضا چه عددی در Enrolled می‌نویسد؟» and the next click reveals it |
| **Retrieval practice** | Recalling beats re-reading | A recap quiz closes Part 2 (seven symptoms → which numbered problem); the problem/isolation-level matrix is filled in one column per level and reviewed at the end |
| **Advance organizer** | Give the map first | A roadmap slide shows the five parts before the talk starts |
| **Activation of prior knowledge** (Merrill) | Start from what learners already know | Every story comes from student life: course registration at 8 AM, grade entry, exam proctors, add/drop week |

References for the principles: Mayer's multimedia principles ([Dartmouth summary](https://services.dartmouth.edu/TDClient/1806/Portal/KB/PrintArticle?ID=171655), [Mayer 2020 overview, PDF](https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf), [Multimedia Learning, 3rd ed.](https://www.lavoisier.fr/livre/sciences-humaines-et-sociales/multimedia-learning/descriptif_4369235)) and the worked-example effect ([overview](https://en.wikipedia.org/wiki/Worked-example_effect)). Concreteness fading, predict–observe–explain and Merrill's first principles are from my own background knowledge; I did not look them up for this plan.

---

## 2. Visual language

| Element | Looks like | Means |
|---|---|---|
| Table | Large grid, `dbo.Name` tab, key icon, LTR like SSMS | Real data |
| `NULL` | Grey italic mono | A real SQL NULL |
| Session card | Colored header (T1 blue, T2 magenta, T3 amber), `Query` box, `App Memory` slots, state pill (Running, Waiting, Committed…), result line | One transaction and what its application believes |
| Read | Arrow to the row, row flashes, value chip flies into memory | A SELECT copied a value out |
| Uncommitted value | Value in the session color, dashed underline, shimmer | Written, not committed yet |
| Committed / rolled back | Value turns normal / blurs away and the old one returns | COMMIT / ROLLBACK |
| X Lock | Solid outline, diagonal hatch, solid padlock badge | Exclusive Lock |
| S Lock | Dashed outline, light hatch, white badge | Shared Lock |
| U lock | Solid outline, white badge with a colored base | Update lock (`UPDLOCK`) |
| Range lock | Hatched bar filling a gap between keys | No inserts here (SERIALIZABLE) |
| Waiting | Pulsing ring badge at the row edge, `Waiting` | Blocked on a lock |
| Timeline lanes | One lane per session, time right → left | Order of events; dashed brackets mark danger windows |
| Rule card | Centered card over a dimmed slide | The general rule behind the example |
| Prediction card | Violet one-row card with lettered options | A question for the audience |
| Problem badge | Red «مشکل N از ۷» / green «چالش N از ۸» chip before the title | Which problem the audience is in |

Technical keywords are written in English inside the Persian text (Transaction, Read, Write, Shared Lock, Exclusive Lock, Commit, Rollback, uncommitted, Deadlock, Worker, Lease…). Green and red are only verdicts (correct / anomaly). T2 is magenta so it never reads as an error. Violet is for versions, time and questions.

**3D story slides.** Five stories are small flat-shaded, low-poly dioramas (Three.js): a classroom with 30 seats, a professor's desk and a student's phone, an exam hall with two proctors, a faculty library with two bookshelves, and a queue at one gate. Labels and phone screens are HTML pinned to the 3D objects, so text stays sharp. Each diorama is built up over a few clicks like every other slide.

---

## 3. Structure (57 slides)

| Part | Slides | Clicks |
|---|---|---|
| Opening | 1–2 | 2 |
| 1 · Basics | 3–5 | 19 |
| 2 · Problems | 6–23 | 120 |
| 3 · Tools | 24–34 | 63 |
| 4 · A real system | 35–52 | 73 |
| 5 · Risks and closing | 53–57 | 18 |

Each click now carries a full idea, so at roughly 8–10 seconds per click this is about 40–45 minutes plus questions.

### Opening
1. **Title** — a tilted `dbo.Accounts` table; two cursors (سارا, رضا) land on the same cell, which flickers between two values. Course, instructor and presenters.
2. **نقشهٔ راه** — the five parts appear together on one click.

### Part 1 · Basics (pre-training)
3. **Transaction چیست؟** — Sara moves from group 1 to group 2: two uncommitted updates, COMMIT makes both committed. Reza's move hits a full group: `CHECK` fails, ROLLBACK undoes his first change. Rule: all or nothing.
4. **چند کاربر، یک پایگاه داده** — both sessions and the timeline appear together; the four statements interleave on one click; four of the six possible orders are shown. Rule: correct code must survive any order.
5. **Shared Lock و Exclusive Lock** — two readers share S; a writer waits for X; readers leave and the writer takes X; a reader now waits. A 2×2 compatibility grid fills in.

### Part 2 · Problems (story → table → fix), numbered «مشکل ۱ از ۷» … «مشکل ۷ از ۷»
6. **هفت مشکل، یکی‌یکی** — the problem map: seven numbered cards; a note says problems 2–4 are solved by one tool (Isolation Level) in Part 3.
7. **آخرین صندلی کلاس** (مشکل ۱ · ماجرا, 3D) — classroom with 29 of 30 seats taken; Sara and Reza both press «ثبت» at 08:00:00; both get «ثبت شد»; both walk to the same chair.
8. **دو ثبت‌نام، یک صندلی** (مشکل ۱ · روی جدول, Lost Update) — `Sections` row 29/30 with both cards and the timeline; both Read 29; Sara Writes 30 with X Lock and commits; a prediction card; Reza's stale Write; danger-window bracket; tally; rule card «مشکل ۱ · Lost Update».
9. **شرط و محاسبه، داخل UPDATE** (مشکل ۱ · راه‌حل) — Conditional UPDATE; Sara gets 1 row; Reza waits, re-checks, gets 0 rows and a clear message.
10. **نمره‌ای که هرگز ثبت نشد** (مشکل ۲ · ماجرا, 3D) — the professor's unsaved 18 is seen by Nima; the save fails; the grade never existed.
11. **Read کردنِ دادهٔ uncommitted** (مشکل ۲ · Dirty Read) — X Lock and uncommitted 18; `NOLOCK` Read; ROLLBACK; Nima decided on a value that never existed; a note points to Part 3 for the fix.
12. **کارنامه‌ای که با خودش نمی‌خواند** (مشکل ۳ · Non-Repeatable Read) — one transaction Reads 14, a correction commits 17, the second Read gets 17.
13. **فهرستی که شلوغ‌تر شد** (مشکل ۴ · Phantom Read) — S Locks on three rows; a new row slides into a gap; count 3 → 4.
14. **دو مراقب امتحان** (مشکل ۵ · ماجرا, 3D) — rule «دست‌کم یک مراقب»; each proctor sees the other; both leave.
15. **هر دو درست، با هم غلط** (مشکل ۵ · Write Skew) — both count 2; each X-locks only its own row; both commit; meter 0.
16. **دو راه برای Write Skew** (مشکل ۵ · راه‌حل) — Lock what you Read (`UPDLOCK, HOLDLOCK`); put the rule inside the UPDATE.
17. **دو کتاب، دو دانشجو** (مشکل ۶ · ماجرا, 3D) — the night before a project deadline, two reference books with one copy each; Sara takes book 1, Reza book 2; each wants the other's; a red loop.
18. **هر کدام منتظر دیگری** (مشکل ۶ · Deadlock) — `dbo.Books`; each borrow reserves its cart in cart order (1→2 vs 2→1); two waits; cycle; the Deadlock Monitor makes Reza the victim (1205); Sara commits.
19. **همه با یک ترتیب** (مشکل ۶ · راه‌حل) — the app sorts the cart by Id; Reza queues holding nothing; Sara finishes; Reza's Conditional UPDATE gets 0 rows: «کتاب امانت رفته». A queue, not a cycle.
20. **همه پشت یک باجه** (مشکل ۷ · ماجرا, 3D) — 8 AM queue at one gate; one person at a time; idle CPU; more gates split the queue.
21. **همه پشت یک ردیف** (مشکل ۷ · Hot Row) — `Stats.TotalEnrollments`; one X Lock holder, a queue; each commit lets one through; flat throughput.
22. **پخش کنید، یا اصلاً نگه ندارید** (مشکل ۷ · راه‌حل) — four shard rows written and committed in parallel; SUM to Read; or derive from `COUNT(*)`.
23. **کدام مشکل؟** — seven symptoms; each click reveals «مشکل N» and its English name.

### Part 3 · Tools
24. **Isolation Level یعنی چه؟** — the five levels together; the two questions; correctness vs concurrency; definition.
25–29. **READ UNCOMMITTED / READ COMMITTED / REPEATABLE READ / SERIALIZABLE / SNAPSHOT** — one slide each, same scenario: the report Reads grades 10–30 twice while the professor inserts 25 and corrects 20. The first click shows the table and both cards; the level's behaviour plays in three or four clicks; then the scene fades and the problem/level matrix appears large in the middle and fills this level's column; a summary card ends each slide.
30. **وقتی دو نفر یک نسخه را تغییر می‌دهند** — SNAPSHOT update conflict, Msg 3960.
31. **همهٔ سطوح، یک‌جا** — the full matrix plus the Write Skew row (مشکل ۵); defaults (SQL Server: READ COMMITTED with locks; Azure SQL Database: RCSI).
32. **اول رزرو، بعد تصمیم** (Pessimistic Locking, `UPDLOCK`) — U Lock; the second reader waits; U → X; the second sees the fresh value.
33. **کار کن، موقع ذخیره بسنج** (Optimistic Concurrency, `rowversion`) — first save 1 row; second save 0 rows and «دوباره بارگذاری کنید».
34. **سه ابزار؛ کِی کدام؟** — Pessimistic, Optimistic, Conditional UPDATE.

### Part 4 · A real system (no product name): need → design → concurrency challenges, numbered «چالش ۱ از ۸» … «چالش ۸ از ۸»
35. **Chapter** — a live field of items; 500,000 items, 3 Instances, 1 source of truth.
36. **یک کلیک، ۵۰۰٬۰۰۰ کار** — the need; ~28 hours one by one; why one HTTP request can't do it (Timeout, Restart/Deploy, no progress or Cancel, one server only).
37. **از سامانه چه می‌خواستیم؟** — six requirements on one click, then «دقیقاً یک بار».
38. **دو جدول: عملیات و آیتم‌هایش** — `BulkOperation`, `BulkOperationItems`, then `LockToken` / `LockUntil`.
39. **چرخهٔ عمر یک آیتم** — Pending; Queued + Processing; Succeeded + Failed; back to Queued; Cancelled.
40. **مسیر یک آیتم** — user → API → SQL Server; Dispatcher → RabbitMQ; Workers → external service; back to SQL Server.
41. **نیم میلیون ردیف، یکجا** — row-by-row INSERT vs `SqlBulkCopy`, two clicks.
42. **همه را یکجا در صف نریزید** — the dispatch Window; bounded queue (Backpressure).
43. **صف قول «دست‌کم یک‌بار» می‌دهد** — a Worker crashes before ack; the same message goes to another Worker.
44. **سه سرور، یک صف، یک پایگاه داده** — three Workers each believe item 42 is theirs; only the database decides.
45. **چالش ۱ · Duplicate Message** — three Workers send the same Conditional UPDATE; api-1 takes the X Lock while the other two arrows end at their Waiting chips; 1 row vs 0 rows.
46. **چالش ۲ · Dead Worker** — no expiry: stuck forever; Lease bar and Heartbeat.
47. **چالش ۳ · Zombie Worker** — GC pause, Lease expires, Sweeper requeues, api-2 claims with a new Token, api-1's stale Write gets 0 rows (Fencing Token).
48. **چالش ۴ · Poison Message** — Sweeper requeues expired Leases with one more attempt; the fifth failure becomes Failed.
49. **چالش ۵ · Hot Counter** — `Succeeded++` is Problem 7 again; replaced by periodic `COUNT(*) GROUP BY Status`.
50. **چالش ۶ · Cancel** — one UPDATE to Cancelled; the Heartbeat's extra condition returns 0 rows and Workers stop.
51. **چالش ۷ · Retry** — transient (Deadlock, Lock Timeout, network) vs permanent errors; exponential backoff with jitter.
52. **چالش ۸ · Clock Skew** — two server clocks 7 s apart give two owners; fix: `SYSUTCDATETIME()` inside the statement.

### Part 5 · Risks and closing
53. **خطر ۱ · Idempotency** — a grade SMS sent twice after a lost response; idempotency key.
54. **خطر ۲ · Outbox** — saved but never published (Dual Write); Outbox in the same transaction.
55. **خطر ۳ · Lock Escalation** — cells light up as locks reach ~5,000, then one Table Lock covers everything; batched UPDATE.
56. **پنج قانون برای بردن به خانه** — the five rules on one click, then the closing sentence.
57. **سپاس از توجه شما** — presenters, instructor, course.

---

## 4. How it is built

- `demo/src/core/build.ts` — the slide author. `b.s(narration, t => …)` adds one click; `b.show(narration, el)` reveals elements. A title-only opening is merged into the first content click, so no slide starts empty; `badge` adds the «مشکل/چالش N از M» chip.
- `demo/src/core/deck.ts` — navigation. Each slide owns a paused GSAP timeline with a label per click. Forward plays one step at `PACE` (0.78× the authored speed); back and jumps seek exactly. A key press during an animation speeds it up and queues the next step.
- `demo/src/kit/table.ts` — tables, wet/dry/evaporate, X/S/U locks, waiters, gap locks, inserts.
- `demo/src/kit/parts.ts` — session cards, lanes, arrows, flying chips, notes, rule cards, prediction cards, diagram nodes.
- `demo/src/kit/three3d.ts` — the flat-shaded 3D kit (people, desks, chairs, laptop, phone, board, door, gate, database stack, data packet) with HTML pins.
- `demo/src/slides/p*.ts` — one file per part.

Controls: Space / PageDown / ← next; PageUp / → back (mouse clicks do nothing, so a stray click never advances the talk); `R` replays a step; `Home` / `End`; `F` fullscreen; `B` blank. The hash keeps your place (`#8-12` is slide 8, click 12).
