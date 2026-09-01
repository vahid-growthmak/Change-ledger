/**
 * Maps the CSS custom properties in src/tokens.css to utility names, so the
 * values exist in exactly one place. No arbitrary values in components:
 * `text-[#14161A]` is a review rejection; `text-ink` is the only way to write it.
 */
module.exports = {
  theme: {
    // Single breakpoint at 720px (PRD): readout 4-up → 2×2, form grids collapse.
    screens: {
      sm: '720px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      paper: 'var(--paper)',
      card: 'var(--card)',
      ink: 'var(--ink)',
      mute: 'var(--mute)',
      'mute-2': 'var(--mute-2)',
      rule: 'var(--rule)',
      signal: 'var(--signal)',
      'signal-ink': 'var(--signal-ink)',
      clear: 'var(--clear)',
      over: 'var(--over)',
      'tint-clear': 'var(--tint-clear)',
      'tint-over': 'var(--tint-over)',
      'tint-signal': 'var(--tint-signal)',
      'tint-pending': 'var(--tint-pending)',
    },
    fontFamily: {
      sans: ['var(--font-sans)', 'sans-serif'],
      mono: ['var(--font-mono)', 'monospace'],
    },
    // Non-doubling scale by design: compressed, dense rhythm. Nothing between the steps.
    spacing: {
      0: '0px',
      px: '1px',
      1: '4px',
      2: '6px',
      3: '9px',
      4: '13px',
      5: '16px',
      6: '22px',
      7: '26px',
      8: '34px',
    },
    // Rounder, pill-leaning scale — matches growthmak.com's own radius ramp
    // (--r:12px, --r-lg:24px, --r-xl:28px, --r-pill:50px) rather than the
    // tight machined corners of a standalone instrument panel.
    borderRadius: {
      none: '0px',
      fill: '9999px',
      tag: '8px',
      inline: '10px',
      input: '12px',
      btn: '9999px',
      card: '16px',
      panel: '22px',
      chip: '9999px',
      full: '9999px',
    },
    extend: {
      boxShadow: {
        card: 'var(--shadow-card)',
        blue: 'var(--shadow-blue)',
      },
      transitionTimingFunction: {
        meter: 'var(--ease-meter)',
      },
      maxWidth: {
        page: '1200px',
      },
    },
  },
};
