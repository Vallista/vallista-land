# Chip

Small pill-shaped label. Tags, categories, statuses. Never used for actions — use `Button` for that.

## Tones

| Tone      | Background          | Text                | Use                             |
|-----------|---------------------|---------------------|---------------------------------|
| `neutral` (default) | `vars.color.line2` | `vars.color.ink3` | Tags, categories             |
| `blue`    | `vars.color.accentTint` | `vars.color.accentHover` | Featured posts, series info |
| `green`   | `green.50`          | `green.700`         | Status: active                  |
| `amber`   | `amber.50`          | `amber.700`         | Status: archived                |
| `red`     | `red.50`            | `red.700`           | Status: error / deprecated      |

Five tones is the ceiling. Don't invent new ones.

## Props

```ts
type ChipProps = {
  tone?: "neutral" | "blue" | "green" | "amber" | "red";
  dot?: boolean;        // leading 5px circle, uses currentColor
  as?: "span" | "a";    // anchor variant for tag links
  href?: string;
};
```

## CSS

```css
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 8px;
  border-radius: vars.radius.pill;
  background: vars.color.line2;
  color: vars.color.ink3;
  font: 500 11px/1 vars.font.sans;
}
.chip.dot::before {
  content: "";
  width: 5px; height: 5px; border-radius: 50%;
  background: currentColor;
}
.chip[data-tone="blue"]  { background: vars.color.accentTint; color: vars.color.accentHover; }
.chip[data-tone="green"] { background: green.50; color: green.700; }
.chip[data-tone="amber"] { background: amber.50; color: amber.700; }
.chip[data-tone="red"]   { background: red.50;   color: red.700;   }
```

## Accessibility

- Status chips (`dot` on) **must** include a text label. Color + dot alone is insufficient.
- When chip is a link (`as="a"`), give it `:focus-visible` and meaningful `href`.
