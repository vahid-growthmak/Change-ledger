'use client';

import * as React from 'react';

/**
 * The manifest's vocabulary.
 *
 * Nothing here casts a shadow. Elevation is a printed rule, declared once, and
 * a control that needs to look raised gets a heavier rule rather than a glow.
 * Corners are square: a form has no pills.
 */

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal';

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  small?: boolean;
};

/**
 * The primary action is ink on stock with a hard rule — the way a form's
 * action block is printed, not a floating coloured capsule. Hover deepens the
 * rule rather than lifting the control off the page.
 */
export function Button({ variant = 'primary', small, className = '', ...rest }: ButtonProps) {
  const base = `inline-flex items-center justify-center rounded-control border font-sans font-semibold
    transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`;
  const size = small ? 'text-meta px-4 py-2 gap-2' : 'text-body px-6 py-3 gap-2';
  const look =
    variant === 'primary'
      ? 'bg-ink text-sheet border-ink hover:bg-signal hover:border-signal'
      : 'bg-transparent text-ink border-rule hover:border-ink hover:bg-stock-2';
  return (
    <button
      className={`${base} ${size} ${look} ${className}`}
      style={{ minHeight: 44, letterSpacing: '-0.01em' }}
      {...rest}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Stamped verdicts                                                            */
/* -------------------------------------------------------------------------- */

export type ScopeTone = 'clear' | 'over' | 'signal' | 'pending';

const stampTones: Record<ScopeTone, string> = {
  clear: 'bg-wash-clear text-clear border-clear',
  over: 'bg-wash-over text-over border-over',
  signal: 'bg-wash-signal text-signal border-signal',
  // Pending carries no ink at all — it hatches. The rule stays neutral so the
  // box never reads as a verdict it has not been given.
  pending: 'hatch text-ink border-rule',
};

/**
 * A verdict is stamped: a ruled box in the ink itself, condensed caps, landing
 * rather than fading. The written label always rides with the colour, so the
 * record survives greyscale, print and colour-blind reading.
 */
export function Tag({
  tone,
  children,
  animate,
}: {
  tone: ScopeTone;
  children: React.ReactNode;
  animate?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center border font-narrow font-semibold uppercase
        px-2 py-1 whitespace-nowrap text-stamp tracking-stamp ${stampTones[tone]}`}
      style={animate ? { animation: 'stamp-land 90ms var(--ease-stamp) both' } : undefined}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Filters                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Filters read as a row of index tabs along the top of the sheet, meeting on
 * their rules. The pressed tab is solid ink — the same relationship a selected
 * tab has to its file.
 */
export function FilterChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`-ml-px first:ml-0 border font-narrow uppercase tracking-label text-label
        px-4 transition-colors duration-150 ${focusRing} ${
          pressed
            ? 'bg-ink text-sheet border-ink relative z-10'
            : 'bg-sheet text-pencil border-rule hover:text-ink hover:border-ink hover:z-10 relative'
        }`}
      style={{ minHeight: 44 }}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Structure                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A pre-printed field label. Narrow, small, and set in the caps a form prints
 * its boxes with — deliberately a different voice from anything a person types.
 */
export function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-narrow uppercase text-pencil text-label tracking-label">{children}</div>
  );
}

/**
 * The sheet: the writing surface, bounded by a single ink rule. One border,
 * no shadow, square corners.
 */
export function Sheet({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`bg-sheet border border-rule ${className}`}>{children}</div>;
}

/**
 * A ruled band heading a section of the sheet — the printed strip a form uses
 * to name the block beneath it.
 */
export function SheetHead({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-rule bg-stock-2 px-5 py-3">
      <h2 className="font-narrow uppercase text-label tracking-label text-ink">{children}</h2>
      {right}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="mx-auto max-w-measure text-pencil font-sans text-body">{children}</p>
    </div>
  );
}

/**
 * Confirmations only. Errors that need a decision use inline messaging instead.
 * It docks to the foot of the sheet like a received stamp, not a floating card.
 */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 border-2 border-ink bg-ink text-sheet px-5 py-3
        font-narrow uppercase tracking-stamp text-stamp"
      style={{ animation: 'toast-in 200ms var(--ease-stamp) both' }}
    >
      {message}
    </div>
  );
}
