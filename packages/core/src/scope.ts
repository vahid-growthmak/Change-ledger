import type { ChangeRequest, ProjectConfig } from './types';

export interface LedgerTotals {
  /** Requests logged (in the counted window). */
  requestCount: number;
  /** Requests with a beyond-scope verdict. */
  beyondCount: number;
  /** Hours confirmed in scope. */
  inScopeHours: number;
  /**
   * Estimated hours not yet confirmed either way: verdict unset, or
   * "Needs quote" pending the client's decision. Rendered hatched, and
   * excluded from the cost figure so the number reported is never larger
   * than what has actually been agreed (open question 2, resolved
   * conservatively).
   */
  pendingHours: number;
  /** Hours confirmed beyond scope. */
  beyondHours: number;
  /** Additional cost = beyond-scope hours × rate, in minor units (M5). */
  additionalCostMinor: number;
}

/** First day of the month containing `date`, as YYYY-MM-01 (UTC). */
export function currentPeriod(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/** Period to stamp on a new request: current month for retainer, null for fixed scope. */
export function periodForInsert(mode: ProjectConfig['mode'], date: Date = new Date()): string | null {
  return mode === 'retainer' ? currentPeriod(date) : null;
}

/**
 * The single derivation every displayed total comes from (M7).
 * For retainer projects pass `period` to count one cycle; fixed-scope
 * projects count the whole engagement.
 */
export function computeTotals(
  requests: ChangeRequest[],
  project: Pick<ProjectConfig, 'rateMinor' | 'mode'>,
  period?: string | null,
): LedgerTotals {
  const counted =
    project.mode === 'retainer' && period
      ? requests.filter((r) => r.period === period)
      : requests;

  let inScopeHours = 0;
  let pendingHours = 0;
  let beyondHours = 0;
  let beyondCount = 0;

  for (const r of counted) {
    const hours = r.hours ?? 0;
    if (r.scope === 'in_scope') {
      inScopeHours += hours;
    } else if (r.scope === 'beyond_scope') {
      beyondHours += hours;
      beyondCount += 1;
    } else {
      // Unset (pending review) or needs_quote: visibly not yet counted
      // either way (T6).
      pendingHours += hours;
    }
  }

  return {
    requestCount: counted.length,
    beyondCount,
    inScopeHours: round1(inScopeHours),
    pendingHours: round1(pendingHours),
    beyondHours: round1(beyondHours),
    additionalCostMinor: Math.round(beyondHours * project.rateMinor),
  };
}

/**
 * Meter scale in hours: max(contract × 1.28, used, 1) — overage stays
 * visible past the line and the line never pins to the far edge (M3).
 */
export function meterScale(contractedHours: number, totals: LedgerTotals): number {
  const used = totals.inScopeHours + totals.pendingHours + totals.beyondHours;
  return Math.max(contractedHours * 1.28, used, 1);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
