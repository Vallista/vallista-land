# Motion

Paper Light's motion budget is small. We animate to **confirm causality**, not
to entertain. If you can't explain what an animation is communicating in one
sentence, cut it.

## Token recap

| Token          | Value  | Usage                                         |
|----------------|--------|-----------------------------------------------|
| `--dur-fast`   | 120ms  | Hover, press, focus rings                     |
| `--dur-base`   | 180ms  | Menu open, tab switch, chip selection         |
| `--dur-slow`   | 320ms  | Page fade-in, palette open                    |

| Easing           | Curve                       | Usage                          |
|------------------|-----------------------------|--------------------------------|
| `--ease-out`     | (0.2, 0.7, 0.3, 1)          | Default for appearing elements |
| `--ease-in`     | (0.4, 0, 1, 1)              | Default for disappearing       |
| `--ease-inout`   | (0.4, 0, 0.2, 1)            | Sliding, reordering            |
| `--ease-spring`  | (0.34, 1.56, 0.64, 1)       | **Palette only.** Nowhere else. |

## Patterns

### 1. Hover / press (everything interactive)

```css
.btn,
.chip,
.nav-item,
.card a {
  transition:
    background var(--dur-fast) var(--ease-out),
    color      var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    transform  var(--dur-fast) var(--ease-out);
}
.btn:active { transform: translateY(1px); }
```

### 2. Card lift (on hover)

```css
.card {
  box-shadow: var(--elev-1);
  transition: box-shadow var(--dur-base) var(--ease-out),
              transform  var(--dur-base) var(--ease-out);
}
.card:hover {
  box-shadow: var(--elev-2);
  transform: translateY(-1px);
}
```

Never move more than 1–2px on hover. We're not on dribbble.

### 3. Reading progress bar (Article header)

2px bar at the top of the article main. Updates on scroll, NOT on a timer.
Use `requestAnimationFrame` + passive scroll listener.

```js
const bar = document.querySelector("[data-progress]");
const on = () => {
  const h = document.documentElement;
  const pct = Math.min(100, (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100);
  bar.style.width = pct + "%";
};
addEventListener("scroll", () => requestAnimationFrame(on), { passive: true });
```

No easing on the bar — it tracks 1:1.

### 4. Search palette (⌘K) open

The only place `--ease-spring` appears. Scrim fades, palette scales from 0.96 → 1
over `--dur-slow`.

```css
.palette-scrim { animation: fade-in var(--dur-base) var(--ease-out); }
.palette       { animation: palette-in var(--dur-slow) var(--ease-spring); }

@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes palette-in {
  from { opacity: 0; transform: translate(-50%, -4px) scale(0.96) }
  to   { opacity: 1; transform: translate(-50%, 0)    scale(1) }
}
```

### 5. Menu open (mobile)

Fullscreen menu slides from right over `--dur-base`. Inner list items stagger
with `animation-delay: calc(var(--i) * 20ms)` — cap at 8 items, total cost < 160ms.

### 6. Reduced motion

**Required.** Respect `prefers-reduced-motion: reduce` — collapse everything
to 0.01s, keep the final state.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Don'ts

- No **bounce** on hover. Spring only belongs on modal open.
- No **infinite** animations anywhere. No shimmer, no pulse.
- No **parallax**. Sidebar is sticky, nothing scrolls at different rates.
- No **scroll-triggered entrance animations** for text. Bodies appear fully rendered.
