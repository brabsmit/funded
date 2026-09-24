const MS_DAY = 86_400_000;
const utc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));

/** Calendar days from `from` to `to` (ISO dates); negative once `to` has passed. */
export function daysUntil(from: string, to: string): number {
  return Math.round((utc(to) - utc(from)) / MS_DAY);
}

export function yearsUntil(from: string, to: string): number {
  return Math.round((daysUntil(from, to) / 365.25) * 10) / 10;
}

export function fmtDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** The date the site is built for. Set FUNDED_AS_OF=YYYY-MM-DD to pin it (deterministic screenshots). */
export function today(): string {
  const pinned = (globalThis as any).process?.env?.FUNDED_AS_OF ?? (import.meta as any).env?.FUNDED_AS_OF;
  return typeof pinned === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(pinned) ? pinned : new Date().toISOString().slice(0, 10);
}
