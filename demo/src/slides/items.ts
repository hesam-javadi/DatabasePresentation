import { DbTable, Row } from '../kit/table';
import { TxnCard } from '../kit/parts';
import { Tone } from '../kit/table';

/** Shared pieces for the BulkOperation slides. */
export const ITEMS = { x: 150, y: 266, workerX: 1404, workerW: 420 };

export function itemsTable(root: HTMLElement, rows: Row[]) {
  return new DbTable(root, {
    name: 'dbo.BulkOperationItems', x: ITEMS.x, y: ITEMS.y, rowH: 80,
    cols: [
      { key: 'id', label: 'Id', w: 100, kind: 'mono', pk: true },
      { key: 'status', label: 'Status', w: 250, kind: 'pill' },
      { key: 'att', label: 'Attempt', w: 140, kind: 'num' },
      { key: 'tok', label: 'LockToken', w: 190, kind: 'mono' },
      { key: 'until', label: 'LockUntil', w: 200, kind: 'mono' },
    ],
    rows,
  });
}

export function worker(root: HTMLElement, tone: Tone, n: number, y: number, msg: string) {
  const c = new TxnCard(root, {
    tone, who: `W${n}`, name: `api-${n}`, sub: `Instance ${['', '۱', '۲', '۳'][n]}`,
    x: ITEMS.workerX, y, w: ITEMS.workerW, noExec: true, memLabel: 'Message', mem: [{ key: 'msg', init: msg }],
  });
  c.el.classList.add('compact');
  return c;
}

export const CLAIM_SQL = `<span class="kw">UPDATE</span> BulkOperationItems
<span class="kw">SET</span>    Status = <span class="str">'Processing'</span>, LockToken = @token,
       LockUntil = <span class="kw">SYSUTCDATETIME</span>() + @lease
<span class="kw">WHERE</span>  Id = 42 <span class="hl"><span class="kw">AND</span> Status = <span class="str">'Queued'</span> <span class="kw">AND</span> AttemptCount = @seen</span>`;
