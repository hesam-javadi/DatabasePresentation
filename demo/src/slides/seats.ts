import { DbTable, Row } from '../kit/table';
import { TxnCard, Lanes } from '../kit/parts';

/** Shared layout for the seat slides, so consecutive slides line up exactly. */
export const SEAT = {
  cardW: 420,
  cardY: 262,
  t1x: 1920 - 96 - 420,
  t2x: 96,
  tableX: 660,
  tableY: 262,
  lanesY: 858,
};

export const seatRows = (): Row[] => [
  { id: '14A', seat: '14A', status: 'Booked', pax: 'علی' },
  { id: '14B', seat: '14B', status: 'Booked', pax: 'مریم' },
  { id: '14C', seat: '14C', status: 'Free', pax: 'NULL' },
  { id: '14D', seat: '14D', status: 'Booked', pax: 'کاوه' },
];

export function seatTable(root: HTMLElement) {
  return new DbTable(root, {
    name: 'dbo.Seats', x: SEAT.tableX, y: SEAT.tableY, rowH: 86,
    cols: [
      { key: 'seat', label: 'SeatNo', w: 150, kind: 'mono', pk: true },
      { key: 'status', label: 'Status', w: 210, kind: 'pill' },
      { key: 'pax', label: 'Passenger', w: 240 },
    ],
    rows: seatRows(),
  });
}

export function seatCards(root: HTMLElement, mem: { key: string; init?: string }[], exec: [string, string]) {
  const sara = new TxnCard(root, { tone: 't1', who: 'T1', name: 'سارا', sub: 'اپ موبایل', x: SEAT.t1x, y: SEAT.cardY, w: SEAT.cardW, mem, exec: exec[0] });
  const reza = new TxnCard(root, { tone: 't2', who: 'T2', name: 'رضا', sub: 'وب‌سایت', x: SEAT.t2x, y: SEAT.cardY, w: SEAT.cardW, mem, exec: exec[1] });
  return { sara, reza };
}

export function seatLanes(root: HTMLElement, ticks = 8) {
  return new Lanes(root, {
    x: 96, y: SEAT.lanesY, w: 1728, ticks,
    lanes: [{ tone: 't1', label: 'T1 · سارا' }, { tone: 't2', label: 'T2 · رضا' }],
  });
}

// SQL snippets (HTML, LTR)
export const SQL = {
  select: `<span class="kw">SELECT</span> Status <span class="kw">FROM</span> Seats
<span class="kw">WHERE</span> SeatNo = <span class="str">'14C'</span>`,
  update: (name: string) => `<span class="kw">UPDATE</span> Seats
<span class="kw">SET</span> Status = <span class="str">'Booked'</span>,
    Passenger = <span class="str">N'<span class="fa-in">${name}</span>'</span>
<span class="kw">WHERE</span> SeatNo = <span class="str">'14C'</span>`,
  commit: `<span class="kw">COMMIT</span>`,
  logic: `<span class="cm">-- run by both sessions</span>
status = <span class="kw">SELECT</span> Status …
<span class="kw">if</span> status == <span class="str">'Free'</span>:
    <span class="kw">UPDATE</span> … <span class="str">'Booked'</span>`,
  cond: (name: string) => `<span class="kw">UPDATE</span> Seats
<span class="kw">SET</span> Status = <span class="str">'Booked'</span>,
    Passenger = <span class="str">N'<span class="fa-in">${name}</span>'</span>
<span class="kw">WHERE</span> SeatNo = <span class="str">'14C'</span>
  <span class="hl"><span class="kw">AND</span> Status = <span class="str">'Free'</span></span>`,
};
