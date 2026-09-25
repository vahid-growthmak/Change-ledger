import * as React from 'react';

export interface ReadoutCellProps {
  label: string;
  value: string;
  /** Unit suffix ("hrs") — never competes with the magnitude. */
  unit?: string;
  /** Turns the figure `over` when the value it reports represents a breach (M6). */
  breached?: boolean;
}

/**
 * One filled box in the manifest's title block.
 *
 * Deliberately not the hero-metric arrangement this app used to ship — a 31px
 * number over a small caption, two of them spending an entire screen band on
 * two integers. A form states a total at the size it states everything else,
 * and earns its authority from the ruling around it rather than from scale.
 */
export function ReadoutCell({ label, value, unit, breached }: ReadoutCellProps) {
  return (
    <div className="px-5 py-3 min-w-0">
      <div className="font-narrow uppercase text-pencil text-label tracking-label">{label}</div>
      <div
        className={`font-mono mt-1.5 tabular text-figure ${breached ? 'text-over' : 'text-ink'}`}
        style={{ letterSpacing: '-0.01em' }}
      >
        {value}
        {unit ? (
          <span className="text-pencil font-sans" style={{ fontSize: 12 }}>
            {' '}
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The title block: boxed cells meeting on shared rules, no gaps and no
 * shadow. One border around the block, hairlines between the cells.
 *
 * The column count follows the number of cells rather than being fixed, so
 * the cells always fill the row. A fixed four-column grid left the client
 * view — which has only two figures, never the team's four — filling half a
 * box whose border still ran the full width, and the block read as broken
 * rather than as short.
 */
const columnsForCount: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

export function ReadoutRow({ children }: { children: React.ReactNode }) {
  const count = React.Children.toArray(children).length;
  const columns = columnsForCount[Math.min(Math.max(count, 1), 4)];
  return (
    <div
      className={`grid ${count === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${columns}
        border border-rule bg-sheet divide-x divide-y sm:divide-y-0 divide-rule`}
    >
      {children}
    </div>
  );
}
