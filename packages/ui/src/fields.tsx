'use client';

import * as React from 'react';

/**
 * Form fields, as a manifest prints them: a pre-printed label in narrow caps
 * above a ruled box you write into. The box is the sheet — lighter than the
 * stock it sits on — so a fillable field is visibly the part of the document
 * left blank.
 */

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-narrow uppercase text-pencil text-label tracking-label mb-1"
    >
      {children}
    </label>
  );
}

/**
 * One rule, in ink, on focus. No ring, no glow, no colour fill: the box you
 * are writing in is simply drawn more firmly than the ones you are not.
 */
const inputClasses =
  'w-full rounded-sm border border-rule bg-sheet text-ink font-sans text-body px-3 py-2 ' +
  'placeholder:text-pencil-2 focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal ' +
  'transition-colors duration-150';
const inputStyle: React.CSSProperties = { minHeight: 44 };

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', style, ...rest }, ref) {
    return (
      <input ref={ref} className={`${inputClasses} ${className}`} style={{ ...inputStyle, ...style }} {...rest} />
    );
  },
);

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', style, ...rest } = props;
  return (
    <textarea
      className={`${inputClasses} ${className}`}
      style={{ lineHeight: 1.55, ...style }}
      {...rest}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', style, ...rest } = props;
  return (
    <select className={`${inputClasses} ${className}`} style={{ ...inputStyle, ...style }} {...rest} />
  );
}

/**
 * Compact select for inline triage rows. Set in narrow caps because it is a
 * pre-printed choice, not written prose.
 */
export function InlineSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props;
  return (
    <select
      className={`rounded-sm border border-rule bg-sheet text-ink font-narrow uppercase tracking-label
        text-label px-2 focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal
        transition-colors duration-150 ${className}`}
      style={{ minHeight: 44 }}
      {...rest}
    />
  );
}

/**
 * An error is a marginal note in stamp red against the box it belongs to.
 * The words carry the meaning, not the ink, so it reads the same in
 * greyscale. Never a toast — an error that needs a decision has to stay
 * where the decision is made.
 */
export function InlineError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="text-over font-sans text-meta mt-2" role="alert">
      {children}
    </p>
  );
}
