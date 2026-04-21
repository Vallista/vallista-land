# Tokens

Three tiers: **core** (raw), **semantic** (role), **component** (per-component).
Export as CSS custom properties; optionally wrap in `createGlobalTheme` for
vanilla-extract + type safety.

All tokens below are copy-pastable. The reference artifact `blog/Blog A.html`
already uses the semantic layer.

## 1. Core scale

```css
:root {
  /* Neutral ramp (warm-cool hybrid, neutral at midpoints) */
  --gray-50:  #fafbfc;
  --gray-100: #f1f2f6;
  --gray-200: #e6e8ee;
  --gray-300: #d2d6df;
  --gray-400: #9aa1b4;
  --gray-500: #6b7389;
  --gray-600: #3a4255;
  --gray-700: #252c3d;
  --gray-800: #131a2b;
  --gray-900: #0b1220;

  /* Accent — single hue, 3 steps */
  --blue-50:  #eff4ff;
  --blue-500: #2b6cff;   /* primary */
  --blue-600: #1f56d6;   /* hover / pressed */

  /* Status */
  --green-50: #e8f6ee; --green-700: #2a7f3f;
  --amber-50: #fff7ed; --amber-700: #8a6628;
  --red-50:   #fef2f2; --red-700:   #b91c1c;
}
```

Core tokens are **raw hex values**. Never reference them directly from
components — always go through the semantic layer.

## 2. Semantic (the layer components consume)

```css
:root {
  /* Surface */
  --bg:          #ffffff;    /* page */
  --bg-soft:     #fafbfc;    /* cards at rest, inset wells */
  --bg-overlay:  rgba(11, 18, 32, 0.35);  /* modal scrim */

  /* Text */
  --ink:    var(--gray-900);  /* primary */
  --ink-2:  var(--gray-600);  /* secondary / body */
  --ink-3:  var(--gray-500);  /* tertiary / meta */
  --ink-4:  var(--gray-400);  /* disabled / placeholder */

  /* Lines */
  --line:   var(--gray-200);  /* emphasized divider, input border */
  --line-2: var(--gray-100);  /* hairline, row separator */

  /* Accent */
  --accent:        var(--blue-500);
  --accent-hover:  var(--blue-600);
  --accent-tint:   var(--blue-50);

  /* Focus ring (always accent at 40% @ 2px offset) */
  --focus-ring: 0 0 0 2px var(--bg), 0 0 0 4px rgba(43, 108, 255, 0.55);
}
```

**Rules**
- Body copy → `--ink-2` (not `--ink`). Only headings, buttons, and the first
  line of dense lists use `--ink`.
- Dividers: default to `--line-2`. Step up to `--line` only when the divider
  is load-bearing (section break, input edge).
- Never use core gray directly from a component. If you need another step,
  add a semantic token for the role first.

## 3. Dark

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg:         var(--gray-900);
    --bg-soft:    var(--gray-800);
    --bg-overlay: rgba(0, 0, 0, 0.6);

    --ink:        #ffffff;
    --ink-2:      #dbe2ff;
    --ink-3:      #9aa1b4;
    --ink-4:      #6b7389;

    --line:       #1c2540;
    --line-2:     #131c33;

    --accent-tint: rgba(43, 108, 255, 0.18);
  }
}
```

See `blog/Blog A.html` → `PaperDark` for the full dark article render.

## 4. Spacing

4px base grid. Named roles used in components:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

**Reading column:** `max-width: 680–720px`. Article uses 720, sidebars use 220.
**Card gutters:** 24–32px (cards on desktop), 16–20px on mobile.
**Section rhythm:** 40px between list rows, 64px between major sections.

## 5. Radii

```css
:root {
  --radius-1: 4px;    /* tiny chip internals */
  --radius-2: 6px;    /* nav rail items, small buttons */
  --radius-3: 8px;    /* inputs, secondary buttons */
  --radius-4: 10px;   /* search palette input, code block */
  --radius-5: 12px;   /* cards, callouts */
  --radius-6: 14px;   /* floating palette container */
  --radius-pill: 999px;  /* chips, tags */
}
```

**Rule:** a container's radius should be ≥ its children's radius. If a chip
is 999px inside a 12px card, fine. A 10px input inside a 6px rail is wrong.

## 6. Elevation

Paper Light uses **hairlines + tiny shadows** rather than big drops. Four
levels, all cheap:

```css
:root {
  --elev-0: none;
  --elev-1: 0 1px 0 rgba(11, 18, 32, 0.04);                                /* cards at rest */
  --elev-2: 0 2px 6px rgba(11, 18, 32, 0.06);                              /* hover lift */
  --elev-3: 0 12px 32px rgba(11, 18, 32, 0.10);                            /* dropdown */
  --elev-4: 0 24px 60px rgba(11, 18, 32, 0.20), 0 2px 6px rgba(11, 18, 32, 0.06); /* search palette */
}
```

Never combine `--elev-*` with a visible border. Pick one or the other.

## 7. Motion (tokens only — usage in `motion.md`)

```css
:root {
  --dur-fast:  120ms;
  --dur-base:  180ms;
  --dur-slow:  320ms;

  --ease-out: cubic-bezier(0.2, 0.7, 0.3, 1);
  --ease-in:  cubic-bezier(0.4, 0, 1, 1);
  --ease-inout: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* for palette open only */
}
```

## 8. z-index

```css
:root {
  --z-nav:     10;
  --z-tocrail: 20;
  --z-scrim:   900;
  --z-modal:   1000;
  --z-tooltip: 1100;
  --z-toast:   1200;
}
```
