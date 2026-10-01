'use client';

import * as React from 'react';
import { CONTROL_MD, CONTROL_SM } from './primitives';

/**
 * Form fields, as this console sets them: a quiet label above a soft-cornered
 * box filled a shade below the card it sits on, so a fillable field reads as
 * the part of the surface left open.
 */

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-meta font-semibold text-pencil mb-2">
      {children}
    </label>
  );
}

/**
 * Focus deepens the border and lays a soft indigo halo around it — the one
 * place this interface glows, because a field being written in is the one
 * thing it is useful to have catch the eye.
 */
const fieldLook =
  'w-full rounded-control border border-rule bg-stock text-ink px-4 ' +
  'placeholder:text-pencil-2 focus:outline-none focus:border-signal focus:bg-sheet ' +
  'focus:shadow-focus transition-all duration-200 ease-soft';

/**
 * A field is a control, so it stands exactly as tall as a button standing next
 * to it — and that means an exact `height`, not a `minHeight`. A minimum is
 * only a floor: with vertical padding on top of it, a 14px input computed out
 * at 48px and a select at 46px while the button beside them sat at 44, which
 * is how a form ends up looking subtly ragged for no reason anyone can name.
 * Single-line inputs centre their own text, so they need no padding at all.
 */
const singleLine: React.CSSProperties = { height: CONTROL_MD };

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', style, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`${fieldLook} text-body ${className}`}
        style={{ ...singleLine, ...style }}
        {...rest}
      />
    );
  },
);

/** The one field that grows, so it is padded rather than fixed. */
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', style, ...rest } = props;
  return (
    <textarea
      className={`${fieldLook} text-body ${className}`}
      style={{ lineHeight: 1.6, paddingBlock: 12, ...style }}
      {...rest}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', style, ...rest } = props;
  return (
    <select
      className={`${fieldLook} text-body ${className}`}
      style={{ ...singleLine, ...style }}
      {...rest}
    />
  );
}

/**
 * Compact select for inline triage rows. Smaller and tighter than a form
 * field, because four of them sit side by side under a single entry.
 */
export function InlineSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', style, ...rest } = props;
  return (
    <select
      className={`${fieldLook} text-meta font-medium ${className}`}
      style={{ height: CONTROL_SM, ...style }}
      {...rest}
    />
  );
}

/**
 * An error is a marginal note in red against the box it belongs to. The words
 * carry the meaning, not the colour, so it reads the same in greyscale. Never
 * a toast — an error that needs a decision has to stay where the decision is
 * made.
 */
export function InlineError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="text-over text-meta font-medium mt-2" role="alert">
      {children}
    </p>
  );
}
