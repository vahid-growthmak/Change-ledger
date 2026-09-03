import { INDIA_TZ } from './types';
import type { ChangeRequest, ProjectConfig } from './types';
import {
  GROWTH_LAYER_LABELS,
  PENDING_LABEL,
  REQUEST_SOURCE_LABELS,
  REQUEST_TYPE_LABELS,
  SCOPE_LABELS,
  STATUS_LABELS,
} from './types';

/** Format integer minor units as currency. 4500 + USD → $45.00. */
export function formatMoneyMinor(minor: number, currency: string): string {
  const fmt = new Intl.NumberFormat('en', { style: 'currency', currency });
  const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
  return fmt.format(minor / 10 ** digits);
}

/** Minor units per major unit for a currency (100 for USD, 1000 for KWD). */
export function minorUnitFactor(currency: string): number {
  const digits =
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return 10 ** digits;
}

export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

/** "hr" for exactly one hour, "hrs" otherwise — "1 hrs" reads as a typo. */
export function hoursUnit(hours: number): string {
  return hours === 1 ? 'hr' : 'hrs';
}

function formatInTz(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(new Date(iso));
}

/** Dual-timezone rendering of a UTC timestamp (C6). */
export function dualTimestamp(iso: string, clientTz: string): { client: string; india: string } {
  return {
    client: formatInTz(iso, clientTz),
    india: formatInTz(iso, INDIA_TZ),
  };
}

function csvCell(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Full log as CSV with both timestamp columns (O5). */
export function toCsv(requests: ChangeRequest[], project: ProjectConfig): string {
  const header = [
    'Ref',
    'Title',
    'Type',
    'Location',
    'Detail',
    'Link',
    'Layer',
    'Scope',
    'Hours',
    'Status',
    'Period',
    'Source',
    'Source quote',
    `Logged (${project.clientTz})`,
    `Logged (${INDIA_TZ})`,
  ];
  const rows = requests.map((r) => {
    const ts = dualTimestamp(r.createdAt, project.clientTz);
    return [
      r.ref,
      r.title,
      REQUEST_TYPE_LABELS[r.type],
      r.location,
      r.detail,
      r.link,
      r.layer ? GROWTH_LAYER_LABELS[r.layer] : '',
      r.scope ? SCOPE_LABELS[r.scope] : PENDING_LABEL,
      r.hours,
      STATUS_LABELS[r.status],
      r.period,
      REQUEST_SOURCE_LABELS[r.source],
      r.sourceQuote,
      ts.client,
      ts.india,
    ];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

/** Per-project sequential human-readable ID (C5): 0 → GM-001. */
export function makeRef(previousCount: number): string {
  return `GM-${String(previousCount + 1).padStart(3, '0')}`;
}
