'use client';

import * as React from 'react';

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-mono uppercase text-mute mb-2"
      style={{ fontSize: '9.5px', letterSpacing: '0.12em' }}
    >
      {children}
    </label>
  );
}

const inputClasses =
  'w-full rounded-input border border-rule bg-paper text-ink font-sans px-3 py-3 ' +
  'placeholder:text-mute focus:outline-none focus:border-signal focus:bg-card transition-colors';
const inputStyle: React.CSSProperties = { fontSize: '13.5px', minHeight: 44 };

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', style, ...rest }, ref) {
    return (
      <input ref={ref} className={`${inputClasses} ${className}`} style={{ ...inputStyle, ...style }} {...rest} />
    );
  },
);

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', style, ...rest } = props;
  return <textarea className={`${inputClasses} ${className}`} style={{ fontSize: '13.5px', ...style }} {...rest} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', style, ...rest } = props;
  return <select className={`${inputClasses} ${className}`} style={{ ...inputStyle, ...style }} {...rest} />;
}

/** Compact select for inline triage rows. */
export function InlineSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props;
  return (
    <select
      className={`rounded-inline border border-rule bg-paper text-ink font-mono px-2 py-1 focus:outline-none focus:border-signal focus:bg-card ${className}`}
      style={{ fontSize: '10.5px', minHeight: 44 }}
      {...rest}
    />
  );
}

export function InlineError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="text-over font-sans mt-2" style={{ fontSize: 13 }} role="alert">
      {children}
    </p>
  );
}
