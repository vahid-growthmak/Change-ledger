/**
 * Maps the CSS custom properties in src/tokens.css to utility names, so the
 * values exist in exactly one place. No arbitrary values in components:
 * `text-[#1A1815]` is a review rejection; `text-ink` is the only way to write it.
 *
 * The world is a printed manifest, which decides three things here that a
 * default Tailwind theme would get wrong: there is no boxShadow scale at all
 * (elevation is a rule, declared once), the radius scale tops out at 3px
 * (a form has no pills), and the spacing scale is tight and non-doubling so
 * rows tile hairline to hairline instead of floating apart.
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
    },
    fontFamily: {
      sans: ['var(--font-sans)', 'sans-serif'],
      narrow: ['var(--font-narrow)', 'sans-serif'],
      mono: ['var(--font-mono)', 'monospace'],
    },
    // Non-doubling and tight by design: the sheet is dense, and rows meet on
    // their rules rather than drifting apart on margins.
    spacing: {
      0: '0px',
      px: '1px',
      0.5: '2px',
      1: '4px',
      2: '6px',
      3: '9px',
      4: '12px',
      5: '16px',
      6: '20px',
      7: '26px',
      8: '32px',
      9: '44px',
      10: '64px',
    },
    // A printed form has square cells. The 3px step exists only so interactive
    // controls read as touchable; nothing here is ever a pill.
    borderRadius: {
      none: '0px',
      DEFAULT: '0px',
      sm: '2px',
      control: '3px',
      full: '9999px', // reserved for the one true circle: the status dot
    },
    borderWidth: {
      0: '0px',
      DEFAULT: '1px',
      2: '2px',
      3: '3px',
    },
    extend: {
      // Deliberately no boxShadow scale. Elevation is a rule.
      transitionTimingFunction: {
        stamp: 'var(--ease-stamp)',
        meter: 'var(--ease-meter)',
      },
      maxWidth: {
        page: '1180px',
        measure: '68ch',
      },
      letterSpacing: {
        label: '0.09em',
        stamp: '0.12em',
        tight: '-0.02em',
      },
      fontSize: {
        // The pre-printed label and the written value, at the sizes a form
        // actually sets them.
        label: ['10px', { lineHeight: '1.2' }],
        stamp: ['10px', { lineHeight: '1' }],
        meta: ['12px', { lineHeight: '1.45' }],
        body: ['14px', { lineHeight: '1.55' }],
        entry: ['15px', { lineHeight: '1.5' }],
        figure: ['19px', { lineHeight: '1.1' }],
        ref: ['22px', { lineHeight: '1' }],
        title: ['30px', { lineHeight: '1.08' }],
      },
    },
  },
};
