import * as React from 'react';

export interface ReadoutCellProps {
  label: string;
  value: string;
  /** Unit suffix ("hrs") — never competes with the magnitude. */
  unit?: string;
  /** Turns the figure `over` when the value it reports represents a breach (M6). */
  breached?: boolean;
}

export function ReadoutCell({ label, value, unit, breached }: ReadoutCellProps) {
  return (
    <div className="px-5 py-4 min-w-0">
      <div
        className="font-mono uppercase text-mute"
        style={{ fontSize: '9.5px', letterSpacing: '0.13em' }}
      >
        {label}
      </div>
      <div
        className={`font-mono mt-1 tabular-nums ${breached ? 'text-over' : 'text-ink'}`}
        style={{ fontSize: 'clamp(26px, 4vw, 31px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.15 }}
      >
        {value}
        {unit ? (
          <span className="text-mute" style={{ fontSize: 15, fontWeight: 400, letterSpacing: 0 }}>
            {' '}
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Four cells in a hairline-divided row. */
export function ReadoutRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 rounded-panel border border-rule bg-card shadow-card divide-x divide-y sm:divide-y-0 divide-rule overflow-hidden">
      {children}
    </div>
  );
}
