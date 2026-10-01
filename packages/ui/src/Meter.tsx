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
  /** `ink` when the meter sits on the black feature card, which carries its own palette. */
  tone?: 'sheet' | 'ink';
}

const pct = (hours: number, scale: number) => `${(hours / scale) * 100}%`;

// A non-zero segment stays visible even when the scale dwarfs it — a single
// beyond-scope hour against a 60-hour contract is ~1% of the track, easy to
// miss entirely, which defeats the meter's purpose (M6: the client should
// see the overage, not have to search for it).
const MIN_SEGMENT_PX = 6;
const minWidth = (hours: number) => (hours > 0 ? MIN_SEGMENT_PX : 0);

/**
 * The fills animate width and left rather than a transform, deliberately.
 * Each segment carries a pixel minimum so a single beyond-scope hour against a
 * 60-hour contract stays visible (M6), and a transform would scale that
 * minimum away along with everything else. The cost is bounded instead: the
 * segments are absolutely positioned inside a contained, clipped track, so the
 * work never escapes the meter.
 */
const fillTransition = 'width 500ms var(--ease-out), left 500ms var(--ease-out)';

const TRACK_HEIGHT = 48;
const LABEL_BAND = 34;

/**
 * The signature element, and the one place this interface spends boldness.
 *
 * A measuring scale, not a progress bar: progress bars imply completion, this
 * implies consumption. It runs the full width of its card as one soft-capped
 * band, and the contract line is the argument — a marker that overshoots the
 * track at both ends and carries its own floating label. Everything the client
 * needs to know is whether the fills have passed it.
 *
 * It is the only element given the black card, because it is the only thing
 * on the page the page is actually about.
 */
export function Meter({
  contractedHours,
  inScopeHours,
  pendingHours,
  beyondHours,
  scaleHours,
  lineLabel,
  ariaLabel,
  tone = 'sheet',
}: MeterProps) {
  const onInk = tone === 'ink';
  const clearW = pct(inScopeHours, scaleHours);
  // Flip the line label to the line's left side when the line sits in the
  // right third of the track, so the label never runs off the card.
  const labelFlipped = contractedHours / scaleHours > 0.62;
  const pendingLeft = pct(inScopeHours, scaleHours);
  const pendingW = pct(pendingHours, scaleHours);
  const overLeft = pct(inScopeHours + pendingHours, scaleHours);
  const overW = pct(beyondHours, scaleHours);
  const lineLeft = pct(contractedHours, scaleHours);

  const track = onInk ? 'bg-on-ink-track' : 'bg-stock-2';
  const clearFill = onInk ? 'bg-clear-on-ink' : 'bg-clear';
  const pendingFill = onInk ? 'bg-pending-on-ink' : 'bg-pending-fill';
  const overFill = onInk ? 'bg-over-on-ink' : 'bg-over';
  const marker = onInk ? 'bg-on-ink' : 'bg-ink';
  const markerChip = onInk ? 'bg-on-ink text-ink' : 'bg-ink text-on-ink';
  const figures = onInk ? 'text-on-ink-soft' : 'text-pencil';

  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="relative" style={{ height: TRACK_HEIGHT + LABEL_BAND, paddingTop: LABEL_BAND }}>
        {/* The track: one soft-capped band. */}
        <div
          className={`absolute inset-x-0 overflow-hidden rounded-full ${track}`}
          style={{ top: LABEL_BAND, height: TRACK_HEIGHT, contain: 'layout paint' }}
        >
          <span
            className={`absolute top-0 bottom-0 ${clearFill}`}
            style={{ left: 0, width: clearW, minWidth: minWidth(inScopeHours), transition: fillTransition }}
          />
          <span
            className={`absolute top-0 bottom-0 ${pendingFill}`}
            style={{ left: pendingLeft, width: pendingW, minWidth: minWidth(pendingHours), transition: fillTransition }}
          />
          <span
            className={`absolute top-0 bottom-0 ${overFill}`}
            style={{ left: overLeft, width: overW, minWidth: minWidth(beyondHours), transition: fillTransition }}
          />

          {/* Quarter marks, laid over the fills: just enough structure to read a
              position against. Kept faint on purpose — at any higher contrast
              they read as segment boundaries, and the band stops looking like
              one continuous measure. */}
          {[25, 50, 75].map((p) => (
            <span
              key={p}
              aria-hidden
              className={onInk ? 'absolute inset-y-0 bg-ink' : 'absolute inset-y-0 bg-sheet'}
              style={{ left: `${p}%`, width: 1, opacity: onInk ? 0.3 : 0.35 }}
            />
          ))}
        </div>

        {/* The contract line, and the chip that names it. */}
        <span
          className={`absolute rounded-full ${marker}`}
          style={{
            left: lineLeft,
            width: 2,
            top: LABEL_BAND - 8,
            height: TRACK_HEIGHT + 16,
            transition: 'left 500ms var(--ease-out)',
          }}
          aria-hidden
        />
        <span
          className={`absolute rounded-full whitespace-nowrap px-3 py-1 text-label font-semibold shadow-card ${markerChip}`}
          style={{
            left: labelFlipped ? `calc(${lineLeft} - 8px)` : `calc(${lineLeft} + 8px)`,
            transform: labelFlipped ? 'translateX(-100%)' : undefined,
            top: 0,
            transition: 'left 500ms var(--ease-out)',
          }}
        >
          {lineLabel}
        </span>
      </div>

      {/* Printed decile figures, as a scale carries its own numbers. */}
      <div className="relative mt-2 h-3" aria-hidden>
        {[0, 25, 50, 75, 100].map((p) => (
          <span
            key={p}
            className={`absolute tabular text-label font-medium ${figures}`}
            style={{
              left: `${p}%`,
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
export function MeterLegend({
  pendingNote,
  tone = 'sheet',
}: {
  pendingNote?: string;
  tone?: 'sheet' | 'ink';
}) {
  const onInk = tone === 'ink';
  const item = `flex items-center gap-2 text-meta font-medium ${onInk ? 'text-on-ink-soft' : 'text-pencil'}`;
  const dot = 'inline-block rounded-full shrink-0';
  const dotStyle = { width: 10, height: 10 };
  return (
    <div className="flex flex-wrap gap-5 mt-6">
      <span className={item}>
        <span className={`${dot} ${onInk ? 'bg-clear-on-ink' : 'bg-clear'}`} style={dotStyle} aria-hidden />
        In scope
      </span>
      <span className={item}>
        <span className={`${dot} ${onInk ? 'bg-pending-on-ink' : 'bg-pending-fill'}`} style={dotStyle} aria-hidden />
        {pendingNote ?? 'Pending review'}
      </span>
      <span className={item}>
        <span className={`${dot} ${onInk ? 'bg-over-on-ink' : 'bg-over'}`} style={dotStyle} aria-hidden />
        Beyond scope
      </span>
    </div>
  );
}
