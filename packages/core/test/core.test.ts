import { describe, expect, it } from 'vitest';
import {
  computeTotals,
  currentPeriod,
  dualTimestamp,
  formatMoneyMinor,
  makeRef,
  meterScale,
  minorUnitFactor,
  periodForInsert,
  toCsv,
} from '../src';
import type { ChangeRequest, ProjectConfig } from '../src';

function req(over: Partial<ChangeRequest>): ChangeRequest {
  return {
    id: 'x',
    ref: 'GM-001',
    title: 'Change the hero',
    type: 'design',
    location: null,
    detail: null,
    link: null,
    layer: null,
    scope: null,
    hours: null,
    status: 'new',
    source: 'direct',
    sourceQuote: null,
    attachments: [],
    period: null,
    createdAt: '2026-08-14T18:00:00.000Z',
    updatedAt: null,
    ...over,
  };
}

const project: ProjectConfig = {
  clientName: 'Acme',
  projectName: 'Site build',
  mode: 'foundation',
  contractedHours: 60,
  rateMinor: 4500,
  currency: 'USD',
  clientTz: 'America/Chicago',
  startedOn: '2026-07-01',
};

describe('computeTotals', () => {
  it('buckets hours by verdict and derives cost from beyond-scope only', () => {
    const totals = computeTotals(
      [
        req({ scope: 'in_scope', hours: 10 }),
        req({ scope: 'in_scope', hours: 2.5 }),
        req({ scope: 'beyond_scope', hours: 4 }),
        req({ scope: 'beyond_scope', hours: 1.5 }),
        req({ scope: 'needs_quote', hours: 3 }),
        req({ scope: null, hours: 2 }),
        req({ scope: null, hours: null }),
      ],
      project,
    );
    expect(totals.requestCount).toBe(7);
    expect(totals.beyondCount).toBe(2);
    expect(totals.inScopeHours).toBe(12.5);
    expect(totals.beyondHours).toBe(5.5);
    // Needs-quote and unverdicted hours are pending, never silently covered (T6),
    // and never billed before agreement (open question 2).
    expect(totals.pendingHours).toBe(5);
    expect(totals.additionalCostMinor).toBe(5.5 * 4500);
  });

  it('counts only the given period for retainer projects', () => {
    const retainer = { ...project, mode: 'retainer' as const };
    const totals = computeTotals(
      [
        req({ period: '2026-08-01', scope: 'beyond_scope', hours: 3 }),
        req({ period: '2026-07-01', scope: 'beyond_scope', hours: 9 }),
      ],
      retainer,
      '2026-08-01',
    );
    expect(totals.requestCount).toBe(1);
    expect(totals.beyondHours).toBe(3);
  });

  it('an untriaged request never reads as in scope', () => {
    const totals = computeTotals([req({ hours: 8 })], project);
    expect(totals.inScopeHours).toBe(0);
    expect(totals.pendingHours).toBe(8);
  });
});

describe('meterScale', () => {
  it('keeps overage visible and never pins the line to the edge', () => {
    const totals = computeTotals([req({ scope: 'beyond_scope', hours: 40 })], project);
    expect(meterScale(60, totals)).toBeCloseTo(76.8); // 60 × 1.28
    const heavy = computeTotals([req({ scope: 'beyond_scope', hours: 100 })], project);
    expect(meterScale(60, heavy)).toBe(100); // usage exceeds the padded contract
    expect(meterScale(0, computeTotals([], project))).toBe(1); // never zero
  });
});

describe('periods', () => {
  it('stamps the first of the month for retainer, null for fixed scope', () => {
    const d = new Date('2026-08-17T04:00:00Z');
    expect(currentPeriod(d)).toBe('2026-08-01');
    expect(periodForInsert('retainer', d)).toBe('2026-08-01');
    expect(periodForInsert('foundation', d)).toBeNull();
  });
});

describe('formatting', () => {
  it('treats money as integer minor units, including 3-decimal currencies', () => {
    expect(formatMoneyMinor(4500, 'USD')).toBe('$45.00');
    expect(minorUnitFactor('USD')).toBe(100);
    expect(minorUnitFactor('KWD')).toBe(1000);
    expect(formatMoneyMinor(12500, 'KWD')).toContain('12.500');
  });

  it('generates zero-padded sequential refs', () => {
    expect(makeRef(0)).toBe('GM-001');
    expect(makeRef(6)).toBe('GM-007');
    expect(makeRef(99)).toBe('GM-100');
  });

  it('renders the same instant in client market time and India time', () => {
    const ts = dualTimestamp('2026-08-14T18:00:00.000Z', 'America/Chicago');
    expect(ts.client).toContain('14 Aug');
    expect(ts.india).toContain('11:30'); // IST is UTC+5:30
  });

  it('exports CSV with both timestamp columns and escapes commas', () => {
    const csv = toCsv([req({ title: 'Fix header, footer' })], project);
    const [header, row] = csv.split('\n');
    expect(header).toContain('Logged (America/Chicago)');
    expect(header).toContain('Logged (Asia/Kolkata)');
    expect(row).toContain('"Fix header, footer"');
    expect(row).toContain('Pending review');
  });
});
