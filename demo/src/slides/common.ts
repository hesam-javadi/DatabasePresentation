import { DbTable, Row, Col } from '../kit/table';
import { TxnCard, TxnOpts, Lanes } from '../kit/parts';
import { Tone } from '../kit/table';

export const CH = {
  open: '',
  basics: 'بخش ۱ · پایه‌ها',
  problems: 'بخش ۲ · مشکلات',
  tools: 'بخش ۳ · ابزارها',
  real: 'بخش ۴ · یک سامانهٔ واقعی',
  end: 'بخش ۵ · خطرها و جمع‌بندی',
};

/** Standard mechanism layout: T2 card left, table centre, T1 card right, lanes at the bottom. */
export const LAY = { cardW: 420, cardY: 262, right: 1920 - 96 - 420, left: 96, lanesY: 858, tableY: 262 };

export const SEC_COLS: Col[] = [
  { key: 'id', label: 'Id', w: 100, kind: 'mono', pk: true },
  { key: 'title', label: 'Title', w: 230 },
  { key: 'cap', label: 'Capacity', w: 155, kind: 'num' },
  { key: 'enr', label: 'Enrolled', w: 155, kind: 'num' },
];

export function sections(root: HTMLElement, rows: Row[], o: { x?: number; y?: number; rowH?: number } = {}) {
  return new DbTable(root, { name: 'dbo.Sections', x: o.x ?? 640, y: o.y ?? LAY.tableY, rowH: o.rowH ?? 84, cols: SEC_COLS, rows });
}

export const SEC = {
  g1: (enr = '30') => ({ id: '1', title: 'پایگاه داده ۱', cap: '30', enr }),
  g2: (enr = '29') => ({ id: '2', title: 'پایگاه داده ۲', cap: '30', enr }),
  os: () => ({ id: '3', title: 'سیستم‌عامل ۱', cap: '40', enr: '12' }),
};

type CardO = Omit<TxnOpts, 'x' | 'y' | 'w' | 'tone' | 'who'> & { y?: number; w?: number };
export const card = {
  right: (root: HTMLElement, tone: Tone, who: string, o: CardO) => new TxnCard(root, { tone, who, x: LAY.right, y: o.y ?? LAY.cardY, w: o.w ?? LAY.cardW, ...o }),
  left: (root: HTMLElement, tone: Tone, who: string, o: CardO) => new TxnCard(root, { tone, who, x: LAY.left, y: o.y ?? LAY.cardY, w: o.w ?? LAY.cardW, ...o }),
};

export function lanes(root: HTMLElement, l: { tone: Tone; label: string }[], ticks = 8, y = LAY.lanesY) {
  return new Lanes(root, { x: 96, y, w: 1728, ticks, lanes: l });
}

/** SQL highlighting helpers (HTML, LTR). */
export const k = (s: string) => `<span class="kw">${s}</span>`;
export const str = (s: string) => `<span class="str">'${s}'</span>`;
export const fa = (s: string) => `<span class="str">N'<span class="fa-in">${s}</span>'</span>`;
export const cm = (s: string) => `<span class="cm">-- ${s}</span>`;
export const hl = (s: string) => `<span class="hl">${s}</span>`;
export const cur = (s: string) => `<span class="cur">${s}</span>`;
