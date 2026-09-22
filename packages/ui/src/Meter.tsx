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
const MIN_SEGMENT_PX = 5;
const minWidth = (hours: number) => (hours > 0 ? MIN_SEGMENT_PX : 0);

/**
 * The fills animate width and left rather than a transform, deliberately.
 * Each segment carries a pixel minimum so a single beyond-scope hour against a
 * 60-hour contract stays visible (M6), and a transform would scale that
 * minimum away along with everything else. The cost is bounded instead: the
 * segments are absolutely positioned inside a contained, clipped track, so the
 * work never escapes the meter.
 */
const fillTransition = 'width 450ms var(--ease-meter), left 450ms var(--ease-meter)';

const TRACK_HEIGHT = 46;

/**
 * The signature element, and the one place this interface spends boldness.
 *
 * A measuring scale, not a progress bar: progress bars imply completion, this
 * implies consumption. It runs the full width of the sheet as one unbroken
 * ruled band with graduated ticks and printed decile figures, the way a scale
 * is printed along the edge of a drawing — so reading it is measuring, not
 * glancing at a percentage.
 *
 * The contract line is the argument. It is the only 2px ink rule in the
 * interface, it overshoots the track at both ends, and it carries its own
 * flag; everything the client needs to know is whether the fills have passed
 * it.
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
  // right third of the track, so the label never runs off the sheet.
  const labelFlipped = contractedHours / scaleHours > 0.62;
  const pendingLeft = pct(inScopeHours, scaleHours);
  const pendingW = pct(pendingHours, scaleHours);
  const overLeft = pct(inScopeHours + pendingHours, scaleHours);
  const overW = pct(beyondHours, scaleHours);
  const lineLeft = pct(contractedHours, scaleHours);

  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="relative" style={{ height: TRACK_HEIGHT + 18, paddingTop: 18 }}>
        {/* The track: one unbroken ruled band, square, on stock. */}
        <div
          className="absolute inset-x-0 overflow-hidden border border-rule-ink bg-stock"
          style={{ top: 18, height: TRACK_HEIGHT, contain: 'layout paint' }}
        >
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

          {/* Graduations, printed over the fills: a scale is read, not filled.
              Every tick rises from the baseline; deciles run taller. */}
          {Array.from({ length: 21 }, (_, i) => {
            const isDecile = i % 2 === 0;
            if (i === 0 || i === 20) return null;
            return (
              <span
                key={i}
                aria-hidden
                className="absolute bottom-0 bg-ink"
                style={{
                  left: `${i * 5}%`,
                  width: 1,
                  height: isDecile ? 11 : 6,
                  opacity: 0.55,
                }}
              />
            );
          })}
        </div>

        {/* The contract line: the only 2px ink rule in the interface. */}
        <span
          className="absolute bg-ink"
          style={{
            left: lineLeft,
            width: 2,
            top: 10,
            height: TRACK_HEIGHT + 12,
            transition: 'left 450ms var(--ease-meter)',
          }}
          aria-hidden
        />
        <span
          className="absolute font-narrow uppercase text-ink whitespace-nowrap text-label tracking-label"
          style={{
            left: labelFlipped ? `calc(${lineLeft} - 7px)` : `calc(${lineLeft} + 7px)`,
            transform: labelFlipped ? 'translateX(-100%)' : undefined,
            top: 0,
            transition: 'left 450ms var(--ease-meter)',
          }}
        >
          {lineLabel}
        </span>
      </div>

      {/* Printed decile figures, as a scale carries its own numbers. */}
      <div className="relative mt-1 h-3" aria-hidden>
        {[0, 25, 50, 75, 100].map((p) => (
          <span
            key={p}
            className="absolute font-mono text-pencil tabular"
            style={{
              left: `${p}%`,
              fontSize: 10,
              transform: p === 0 ? undefined : p === 100 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            {Math.round((scaleHours * p) / 100)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Written key for the three fills — colour never carries meaning alone. */
export function MeterLegend({ pendingNote }: { pendingNote?: string }) {
  const item = 'flex items-center gap-2 font-narrow uppercase text-pencil text-label tracking-label';
  const swatch = 'inline-block border border-rule-ink';
  const swatchStyle = { width: 14, height: 10 };
  return (
    <div className="flex flex-wrap gap-5 mt-4">
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
