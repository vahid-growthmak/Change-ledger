'use client';

import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  small?: boolean;
};

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal';

export function Button({ variant = 'primary', small, className = '', ...rest }: ButtonProps) {
  const base = `inline-flex items-center justify-center rounded-btn font-sans font-semibold transition-all disabled:opacity-50 ${focusRing}`;
  const size = small ? 'text-[12px] px-4 py-2' : 'text-[13.5px] px-6 py-3';
  const look =
    variant === 'primary'
      ? 'bg-signal text-white shadow-blue hover:opacity-90'
      : 'bg-transparent text-ink border border-rule hover:border-signal hover:text-signal-ink';
  return <button className={`${base} ${size} ${look} ${className}`} style={{ minHeight: 44 }} {...rest} />;
}

export type ScopeTone = 'clear' | 'over' | 'signal' | 'pending';

const tagTones: Record<ScopeTone, string> = {
  clear: 'bg-tint-clear text-clear',
  over: 'bg-tint-over text-over',
  // text-signal-ink, not text-signal: the brand blue alone is ~3.6:1 on
  // white, short of AA at this size — the darker ink variant is what
  // growthmak.com itself uses for text and links in blue.
  signal: 'bg-tint-signal text-signal-ink',
  pending: 'bg-tint-pending text-mute',
};

export function Tag({ tone, children }: { tone: ScopeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-tag font-mono uppercase px-2 py-1 whitespace-nowrap ${tagTones[tone]}`}
      style={{ fontSize: 9, letterSpacing: '0.11em' }}
    >
      {children}
    </span>
  );
}

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
      className={`rounded-chip font-mono px-4 py-2 border transition-all ${focusRing} ${
        pressed
          ? 'bg-ink text-card border-ink shadow-card'
          : 'bg-card text-ink border-rule hover:border-signal'
      }`}
      style={{ fontSize: '10.5px', minHeight: 44 }}
    >
      {children}
    </button>
  );
}

export function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono uppercase text-mute"
      style={{ fontSize: '9.5px', letterSpacing: '0.13em' }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-rule rounded-panel py-8 px-6 text-center">
      <p className="mx-auto text-mute font-sans" style={{ maxWidth: 400, fontSize: '13.5px', lineHeight: 1.55 }}>
        {children}
      </p>
    </div>
  );
}

/** Confirmations only. Errors that need a decision use inline messaging instead. */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card text-ink border border-rule rounded-btn px-5 py-3 font-mono"
      style={{ fontSize: '11.5px', animation: 'toast-in 250ms ease' }}
    >
      {message}
    </div>
  );
}
