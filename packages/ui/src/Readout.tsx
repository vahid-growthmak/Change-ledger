import * as React from 'react';
import { IconTile } from './primitives';

/**
 * Four small glyphs, drawn to one grid so they sit at the same weight in their
 * tiles. Decorative by definition — every tile has a written caption beneath
 * it, and nothing here is the only carrier of any meaning.
 */
export type ReadoutIcon = 'requests' | 'beyond' | 'hours' | 'cost';

const glyphs: Record<ReadoutIcon, React.ReactNode> = {
  requests: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  beyond: (
    <>
      <path d="M12 3.8 21 19.5H3L12 3.8Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  hours: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  cost: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9.3A2.6 2.6 0 0 0 12 8c-1.4 0-2.5.8-2.5 2s1.1 2 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2a2.6 2.6 0 0 1-2.5-1.3M12 6.6v10.8" />
    </>
  ),
};

function Glyph({ name }: { name: ReadoutIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={21}
      height={21}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyphs[name]}
    </svg>
  );
}

export interface ReadoutCellProps {
  label: string;
  value: string;
  /** Unit suffix ("hrs") — never competes with the magnitude. */
  unit?: string;
  /** Turns the figure `over` when the value it reports represents a breach (M6). */
  breached?: boolean;
  icon?: ReadoutIcon;
}

/**
 * One figure, on its own card.
 *
 * The console states a total large and captions it small: the glyph marks what
 * kind of thing is being counted, the number is the headline, and the words
 * underneath say what it is. The figure is tabular so the column does not
 * shuffle as it changes — which, in a tool whose whole subject is a number
 * that moves, it constantly does.
 */
export function ReadoutCell({ label, value, unit, breached, icon }: ReadoutCellProps) {
  return (
    <div className="bg-sheet rounded-card shadow-card px-6 py-6 min-w-0">
      {icon ? (
        <div className="mb-5">
          <IconTile>
            <Glyph name={icon} />
          </IconTile>
        </div>
      ) : null}
      <div
        className={`tabular font-extrabold tracking-tight text-figure ${breached ? 'text-over' : 'text-ink'}`}
      >
        {value}
        {unit ? (
          <span className="text-pencil font-semibold ml-1" style={{ fontSize: 15 }}>
            {unit}
          </span>
        ) : null}
      </div>
      <div className="text-pencil text-body mt-2">{label}</div>
    </div>
  );
}

/**
 * The row of figures.
 *
 * Separate cards rather than one ruled block, with the column count following
 * the number of cells so they always fill the row. A fixed four-column grid
 * left the client view — which has only two figures, never the team's four —
 * stranding half an empty row.
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
    <div className={`grid gap-5 ${count === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${columns}`}>
      {children}
    </div>
  );
}
