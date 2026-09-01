import * as React from 'react';

export interface MeterProps {
  /** All numbers arrive computed from @growthmak/core — this component does no scope maths. */
  contractedHours: number;
  inScopeHours: number;
  pendingHours: number;
  beyondHours: number;
  scaleHours: number;
  /** e.g. "Contracted scope · 60 hrs" or "Monthly capacity · 40 hrs" */
  lineLabel: string;
  ariaLabel: string;
}

const pct = (hours: number, scale: number) => `${(hours / scale) * 100}%`;

// A non-zero segment stays visible even when the scale dwarfs it — a single
// beyond-scope hour against a 60-hour contract is ~1% of the track, easy to
// miss entirely, which defeats the meter's purpose (M6: the client should
// see the overage, not have to search for it).
const MIN_SEGMENT_PX = 6;
const minWidth = (hours: number) => (hours > 0 ? MIN_SEGMENT_PX : 0);

const fillTransition = 'width 450ms var(--ease-meter), left 450ms var(--ease-meter)';

/**
 * The signature element. A measuring instrument, not a progress bar —
 * progress bars imply completion; this bar implies consumption.
 */
export function Meter({
  contractedHours,
  inScopeHours,
  pendingHours,
  beyondHours,
  scaleHours,
  lineLabel,
  ariaLabel,
}: MeterProps) {
  const clearW = pct(inScopeHours, scaleHours);
  // Flip the line label to the line's left side when the line sits in the
  // right third of the track, so the label never runs off the panel.
  const labelFlipped = contractedHours / scaleHours > 0.62;
  const pendingLeft = pct(inScopeHours, scaleHours);
  const pendingW = pct(pendingHours, scaleHours);
  const overLeft = pct(inScopeHours + pendingHours, scaleHours);
  const overW = pct(beyondHours, scaleHours);
  const lineLeft = pct(contractedHours, scaleHours);

  return (
    <div role="img" aria-label={ariaLabel}>
      {/* 34px zone holding the 20px track, so the contract line can overshoot the fills */}
      <div className="relative" style={{ height: 34 }}>
        {/* track */}
        <div
          className="absolute inset-x-0 overflow-hidden rounded-fill bg-paper border border-rule"
          style={{ top: 7, height: 20 }}
        >
          {/* decile ticks: this is a gauge */}
          {Array.from({ length: 11 }, (_, i) => (
            <span
              key={i}
              className="absolute top-0 bottom-0 w-px bg-rule"
              style={{ left: `${i * 10}%` }}
              aria-hidden
            />
          ))}
          <span
            className="absolute top-0 bottom-0 bg-clear"
            style={{ left: 0, width: clearW, minWidth: minWidth(inScopeHours), transition: fillTransition }}
          />
          <span
            className="absolute top-0 bottom-0 hatch"
            style={{ left: pendingLeft, width: pendingW, minWidth: minWidth(pendingHours), transition: fillTransition }}
          />
          <span
            className="absolute top-0 bottom-0 bg-over"
            style={{ left: overLeft, width: overW, minWidth: minWidth(beyondHours), transition: fillTransition }}
          />
        </div>
        {/* contract line spans the full zone height */}
        <span
          className="absolute top-0 bottom-0 bg-ink"
          style={{ left: lineLeft, width: 2, transition: 'left 450ms var(--ease-meter)' }}
          aria-hidden
        />
        <span
          className="absolute font-mono uppercase text-mute whitespace-nowrap"
          style={{
            left: labelFlipped ? `calc(${lineLeft} - 8px)` : `calc(${lineLeft} + 8px)`,
            transform: labelFlipped ? 'translateX(-100%)' : undefined,
            top: -4,
            fontSize: '9.5px',
            letterSpacing: '0.13em',
            transition: 'left 450ms var(--ease-meter)',
          }}
        >
          {lineLabel}
        </span>
      </div>
    </div>
  );
}

/** Written key for the three fills — colour never carries meaning alone. */
export function MeterLegend({ pendingNote }: { pendingNote?: string }) {
  const item = 'flex items-center gap-2 font-mono uppercase text-mute';
  const swatch = 'inline-block rounded-fill border border-rule';
  const swatchStyle = { width: 14, height: 8 };
  return (
    <div className="flex flex-wrap gap-5 mt-3" style={{ fontSize: '9.5px', letterSpacing: '0.11em' }}>
      <span className={item}>
        <span className={`${swatch} bg-clear`} style={swatchStyle} aria-hidden />
        In scope
      </span>
      <span className={item}>
        <span className={`${swatch} hatch`} style={swatchStyle} aria-hidden />
        {pendingNote ?? 'Pending review'}
      </span>
      <span className={item}>
        <span className={`${swatch} bg-over`} style={swatchStyle} aria-hidden />
        Beyond scope
      </span>
    </div>
  );
}
