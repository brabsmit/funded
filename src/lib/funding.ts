import type { FundingT } from '../schema/records';

export type FundingNode = FundingT & { depth: number; share?: number; children: FundingNode[] };

/** Nest funding rows by parent_id. `share` is a child's amount over its parent's, when both are priced. */
export function fundingTree(rows: FundingT[]): FundingNode[] {
  const byId = new Map(rows.map(r => [r.id, r]));
  const build = (r: FundingT, depth: number): FundingNode => {
    const parent = r.parent_id ? byId.get(r.parent_id) : undefined;
    const share = parent?.amount && r.amount !== undefined ? r.amount / parent.amount : undefined;
    return { ...r, depth, share, children: rows.filter(c => c.parent_id === r.id).map(c => build(c, depth + 1)) };
  };
  return rows.filter(r => !r.parent_id || !byId.has(r.parent_id)).map(r => build(r, 0));
}

export function fmtMoney(n: number): string {
  const compact = (v: number, suffix: string) => `$${parseFloat(v.toFixed(2))}${suffix}`;
  if (n >= 1_000_000) return compact(n / 1_000_000, 'M');
  if (n >= 1_000) return compact(n / 1_000, 'K');
  return `$${n}`;
}
