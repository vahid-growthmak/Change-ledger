'use client';

import * as React from 'react';

/**
 * The console's vocabulary.
 *
 * A surface is separated from the ground by its shadow, never by a border —
 * the only hairlines in the interface divide content *inside* a card. Corners
 * are generous, and black is the accent: the primary action and the one
 * feature card are ink, and colour is kept for meaning.
 */

/*
 * Focus is declared once, globally, in each app's globals.css: a 2px indigo
 * outline offset from the control and following its radius. Doing it there
 * rather than per-component means it lands on every focusable thing in the
 * interface, including the ones nobody remembered to style.
 */

/* -------------------------------------------------------------------------- */
/* Controls                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * There are exactly two control heights in this interface, and everything a
 * person can click or type into is one of them.
 *
 *   MD (44px) — everything: actions, toggles and form fields alike. 44 is also
 *               the touch-target minimum, so the default size is the
 *               accessible one and nobody has to remember that.
 *   SM (38px) — the single exception: the four controls inside a log entry's
 *               triage row, which sit four-across under an entry rather than
 *               standing on their own. Nothing else uses it, deliberately —
 *               a second size available everywhere is how a row ends up with
 *               a 38px toggle beside a 44px select.
 *
 * They share a radius (`control`, 12px) as well as a height, so a button, a
 * select and a filter toggle standing in the same row read as one family.
 * This file is the only place these numbers appear; a hand-rolled control
 * somewhere in an app is how the interface ended up with five different button
 * heights and three different radii the first time.
 */
export const CONTROL_MD = 44;
export const CONTROL_SM = 38;

type Variant = 'primary' | 'ghost' | 'quiet';

/**
 * Primary is solid ink with a soft shade beneath it — in a console where every
 * colour is reserved for meaning, black is the only thing left that can carry
 * an action. Ghost is the same shape in white. Quiet is type alone, for an
 * action that has to sit inside a line of text without bulking it out.
 */
const looks: Record<Variant, string> = {
  primary: 'bg-ink text-on-ink shadow-ink hover:bg-ink-2 disabled:shadow-none',
  ghost:
    'bg-sheet text-ink border border-rule shadow-card hover:bg-stock hover:border-pencil-2 disabled:shadow-none',
  quiet: 'bg-transparent text-pencil hover:text-ink',
};

function controlClasses(variant: Variant, small?: boolean) {
  const base = `inline-flex items-center justify-center gap-2 rounded-control font-semibold
    transition-all duration-200 ease-soft disabled:opacity-40 disabled:cursor-not-allowed`;
  // Quiet carries no box, so it takes no box padding either — it has to align
  // on the baseline of the text it sits in.
  const size = variant === 'quiet' ? 'text-meta' : small ? 'text-meta px-4' : 'text-body px-5';
  return `${base} ${size} ${looks[variant]}`;
}

const controlStyle = (variant: Variant, small?: boolean): React.CSSProperties =>
  variant === 'quiet'
    ? { letterSpacing: '-0.012em' }
    : { minHeight: small ? CONTROL_SM : CONTROL_MD, letterSpacing: '-0.012em' };

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  small?: boolean;
};

export function Button({ variant = 'primary', small, className = '', style, ...rest }: ButtonProps) {
  return (
    <button
      className={`${controlClasses(variant, small)} ${className}`}
      style={{ ...controlStyle(variant, small), ...style }}
      {...rest}
    />
  );
}

type ButtonLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  small?: boolean;
};

/**
 * An action that happens to be a navigation — Export CSV, Settings, the link
 * that finishes a sign-in. It exists so those stop being hand-rolled anchors
 * that drift from `Button` one copy at a time: "Export CSV" was a 44px anchor
 * in the ledger and a 40px button in the public tool, the same action wearing
 * two different faces.
 */
export function ButtonLink({ variant = 'primary', small, className = '', style, ...rest }: ButtonLinkProps) {
  return (
    <a
      className={`${controlClasses(variant, small)} ${className}`}
      style={{ ...controlStyle(variant, small), ...style }}
      {...rest}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Verdicts                                                                    */
/* -------------------------------------------------------------------------- */

export type ScopeTone = 'clear' | 'over' | 'signal' | 'pending';

const chipTones: Record<ScopeTone, string> = {
  clear: 'bg-wash-clear text-clear',
  over: 'bg-wash-over text-over',
  signal: 'bg-wash-signal text-signal',
  // Pending carries no colour at all — it is neutral grey, so the chip never
  // reads as a verdict it has not been given.
  pending: 'bg-wash-pending text-pencil',
};

/**
 * A verdict is a soft chip: a tint of its own colour, no border, settling in
 * rather than popping. The written label always rides with the colour, so the
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
      className={`inline-flex items-center rounded-sm font-semibold px-3 py-1
        whitespace-nowrap text-stamp tracking-label ${chipTones[tone]}`}
      style={animate ? { animation: 'pop-in 160ms var(--ease-out) both' } : undefined}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Filters                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A toggle: a filter, or a choice between two engagement types. The pressed
 * one is solid ink — the same move the primary action makes, because choosing
 * one is the one place in a list where the interface is being told what to do.
 *
 * Deliberately the same height and radius as a `Button`, differing only in the
 * pressed state. It used to be a shorter full pill, which put a capsule
 * directly above the 12px-radius button submitting the same form, and left a
 * 38px toggle row sitting between 44px fields — close enough to look like a
 * mistake rather than a distinction.
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
      className={`inline-flex items-center justify-center rounded-control font-semibold text-meta px-4
        whitespace-nowrap transition-all duration-200 ease-soft ${
          pressed
            ? 'bg-ink text-on-ink shadow-ink'
            : 'bg-sheet text-pencil border border-rule shadow-card hover:text-ink hover:border-pencil-2'
        }`}
      style={{ minHeight: CONTROL_MD, letterSpacing: '-0.012em' }}
    >
      {children}
    </button>
  );
}

/**
 * A non-interactive label: an engagement type, a role. Shares the verdict
 * chip's radius and scale, because it is the same kind of object — a word
 * about something, not something to press.
 */
export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-sm bg-stock-2 text-pencil text-stamp font-semibold
        px-3 py-1 whitespace-nowrap"
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Structure                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A quiet caption above a group. Sentence case, because this console has no
 * pre-printed voice — everything on screen is written in the same one.
 */
export function PanelLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-pencil text-meta font-semibold tracking-label">{children}</div>;
}

/**
 * The card: a white surface lifted off the ground by its shade. No border —
 * the shadow is the edge.
 */
export function Sheet({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`bg-sheet rounded-card shadow-card ${className}`}>{children}</div>;
}

/**
 * The feature card, in ink.
 *
 * Exactly one thing on a page may be black, and it is whatever that page is
 * actually about — here, the hours standing against the agreement. It carries
 * its own palette (`on-ink-*`), so anything placed inside it has to say so.
 */
export function InkSheet({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-ink text-on-ink rounded-card shadow-ink ${className}`}>{children}</div>
  );
}

/**
 * The head of a card: its name, and anything that acts on it, on one line.
 * No divider — the padding beneath is what separates it from the content.
 */
export function SheetHead({
  children,
  right,
  onInk,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  onInk?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
      <h2
        className={`text-head font-bold tracking-snug ${onInk ? 'text-on-ink' : 'text-ink'}`}
      >
        {children}
      </h2>
      {right}
    </div>
  );
}

/**
 * The brand mark: the one black square on a page that is otherwise all white
 * cards. Lives here rather than in either app because it appeared in four
 * places — both mastheads and both sign-in pages — as four identical copies,
 * which is three opportunities for the mark to drift between surfaces.
 */
export function Mark({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-control bg-ink text-on-ink shrink-0 shadow-ink"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size / 2}
        height={size / 2}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      >
        <path d="M5 6h14M5 12h14M5 18h8" />
      </svg>
    </span>
  );
}

/**
 * A rounded tile holding one glyph, the way this world marks a figure or a
 * section. Decorative by definition — the label beside it carries the meaning.
 */
export function IconTile({
  children,
  onInk,
}: {
  children: React.ReactNode;
  onInk?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-lg shrink-0 ${
        onInk ? 'bg-on-ink-track text-on-ink' : 'bg-stock text-ink'
      }`}
      style={{ width: 44, height: 44 }}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="mx-auto max-w-measure text-pencil text-body">{children}</p>
    </div>
  );
}

/**
 * Confirmations only. Errors that need a decision use inline messaging
 * instead. It floats in ink at the foot of the page, the one element allowed
 * to sit above everything else.
 */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 rounded-full bg-ink text-on-ink shadow-float
        px-6 py-3 text-body font-semibold"
      style={{ animation: 'toast-in 240ms var(--ease-out) both' }}
    >
      {message}
    </div>
  );
}
