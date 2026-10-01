/**
 * Maps the CSS custom properties in src/tokens.css to utility names, so the
 * values exist in exactly one place. No arbitrary values in components:
 * `text-[#121218]` is a review rejection; `text-ink` is the only way to write it.
 *
 * The world is a modern financial console, which decides four things here that
 * a default Tailwind theme would get wrong: elevation is a short, named shadow
 * scale (and a card uses one instead of a border), the radius scale starts at
 * 8px and tops out at a full pill, the spacing scale is a generous 4px ramp so
 * cards breathe, and there is exactly one font family — weight and size carry
 * the distinctions three families used to.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    // Single breakpoint at 720px (PRD): readout 4-up → 2×2, form grids collapse.
    screens: {
      sm: '720px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      stock: 'var(--stock)',
      'stock-2': 'var(--stock-2)',
      sheet: 'var(--sheet)',
      ink: 'var(--ink)',
      'ink-2': 'var(--ink-2)',
      pencil: 'var(--pencil)',
      'pencil-2': 'var(--pencil-2)',
      rule: 'var(--rule)',
      'rule-soft': 'var(--rule-soft)',
      'rule-ink': 'var(--rule-ink)',
      signal: 'var(--signal)',
      clear: 'var(--clear)',
      over: 'var(--over)',
      'wash-clear': 'var(--wash-clear)',
      'wash-over': 'var(--wash-over)',
      'wash-signal': 'var(--wash-signal)',
      'wash-pending': 'var(--wash-pending)',
      'pending-fill': 'var(--pending-fill)',
      // The black card carries its own palette, measured against --ink.
      'on-ink': 'var(--on-ink)',
      'on-ink-soft': 'var(--on-ink-soft)',
      'on-ink-track': 'var(--on-ink-track)',
      'on-ink-rule': 'var(--on-ink-rule)',
      'clear-on-ink': 'var(--clear-on-ink)',
      'over-on-ink': 'var(--over-on-ink)',
      'pending-on-ink': 'var(--pending-on-ink)',
    },
    fontFamily: {
      // One face. There is deliberately no `font-mono` and no `font-narrow`:
      // adding a second family back is a design-system change, not a
      // component decision.
      sans: ['var(--font-sans)', 'sans-serif'],
    },
    // A clean 4px ramp. The console is airy — cards carry 24px of padding and
    // sit 24px apart — so the scale doubles where the old manifest's crept.
    spacing: {
      0: '0px',
      px: '1px',
      0.5: '2px',
      1: '4px',
      1.5: '6px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '32px',
      8: '40px',
      9: '56px',
      10: '72px',
    },
    // Nothing in this interface has a square corner.
    borderRadius: {
      none: '0px',
      DEFAULT: '12px',
      sm: '8px',
      control: '12px',
      lg: '16px',
      card: '20px',
      xl: '24px',
      full: '9999px',
    },
    borderWidth: {
      0: '0px',
      DEFAULT: '1px',
      2: '2px',
      3: '3px',
    },
    // Elevation is a shadow, declared once. A card uses one of these instead
    // of a border; a hairline only ever divides content inside a card.
    boxShadow: {
      none: 'none',
      card: 'var(--shadow-card)',
      raised: 'var(--shadow-raised)',
      float: 'var(--shadow-float)',
      ink: 'var(--shadow-ink)',
      focus: 'var(--shadow-focus)',
    },
    extend: {
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        soft: 'var(--ease-soft)',
      },
      maxWidth: {
        page: '1240px',
        measure: '68ch',
      },
      letterSpacing: {
        tight: '-0.025em',
        snug: '-0.012em',
        label: '0.005em',
        stamp: '0.02em',
      },
      fontSize: {
        // A console reads at a comfortable size and states its totals large.
        label: ['11px', { lineHeight: '1.35' }],
        stamp: ['11px', { lineHeight: '1.2' }],
        meta: ['12px', { lineHeight: '1.5' }],
        body: ['14px', { lineHeight: '1.6' }],
        entry: ['15px', { lineHeight: '1.5' }],
        lead: ['16px', { lineHeight: '1.55' }],
        ref: ['12px', { lineHeight: '1.2' }],
        head: ['17px', { lineHeight: '1.3' }],
        figure: ['34px', { lineHeight: '1.05' }],
        title: ['28px', { lineHeight: '1.12' }],
      },
    },
  },
};
