# Cover (SVG patterns)

Every article has a cover. We never use raster images — five inline SVG patterns, all on `accentTint` background.

## Patterns

| Kind       | Look                                    | Use                             |
|------------|-----------------------------------------|---------------------------------|
| `grid`     | Fine grid + one accent circle + block   | Default — general posts         |
| `stripes`  | 45° diagonal stripes                    | Infra, systems, ops             |
| `dots`     | Evenly-spaced dots                      | Notes, short-form               |
| `blocks`   | Offset rectangles in varying opacity    | Architecture, planning, decisions |
| `lines`    | Ascending sparse lines                  | Performance, data, numbers      |

Author chooses per-post via frontmatter: `cover: "grid"`.

## Component

```astro
---
// src/components/blog/Cover.astro
type Props = { kind: "grid" | "stripes" | "dots" | "blocks" | "lines"; ratio?: string };
const { kind, ratio = "16 / 9" } = Astro.props;
---
<div class="cover" style={`aspect-ratio: ${ratio}`} role="img" aria-hidden="true">
  {kind === "grid" && ( /* svg */ )}
  {kind === "stripes" && ( /* svg */ )}
  ...
</div>
```

## SVG source

Exact markup lives in `design-system/Design System.html` → **12. Cover pattern** section. Copy it verbatim. Do not hand-redraw.

Each SVG:
- `preserveAspectRatio="none"` so it fills any ratio
- `viewBox="0 0 400 225"` (16:9 reference)
- Accent color is the only fill; opacity drives depth
- No `<text>`, no gradients

## Container CSS

```css
.cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: vars.radius[2];
  overflow: hidden;
  background: vars.color.accentTint;
}
```

## Rule

Never load external images for covers. Every cover must be inline SVG — zero network round-trip, zero layout shift. If a post truly needs a photographic cover, escalate before adding it.
