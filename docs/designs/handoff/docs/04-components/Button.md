# Button

## Variants

| Variant    | Use                              | Background       | Text          | Border         |
|------------|----------------------------------|------------------|---------------|----------------|
| `primary`  | Primary CTA (subscribe, submit)  | `vars.color.ink` | `#fff`        | none           |
| `secondary`| Any other action                 | `vars.color.bg`  | `vars.color.ink2` | 1px `vars.color.line` |
| `ghost`    | Tertiary / in-rail controls      | transparent      | `vars.color.ink3` | none           |

Three variants. No others. If you need a fourth, rethink the UI.

## Sizes

| Size      | Padding   | Font  | Height |
|-----------|-----------|-------|--------|
| `sm`      | 6/12      | 12    | 28px   |
| `md` (default) | 10/18 | 13    | 36px   |
| `lg`      | 14/22     | 14    | 46px   |

Icon-only buttons are square — width = height.

## Props

```ts
type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost";  // default "secondary"
  size?: "sm" | "md" | "lg";                    // default "md"
  href?: string;                                 // renders <a> when present
  disabled?: boolean;
  type?: "button" | "submit" | "reset";          // default "button"
  icon?: "leading" | "trailing";                 // hints icon placement for padding
  "aria-label"?: string;                         // required when children is icon-only
};
```

## States

- **Default** — styled per variant.
- **Hover** — `primary` → `vars.color.ink` with `opacity 0.92` OR step down to `ink-2`. `secondary` → `border-color: vars.color.ink3`. `ghost` → background `vars.color.bgSoft`.
- **Pressed** — `transform: translateY(1px)`.
- **Focus-visible** — `box-shadow: vars.focusRing`, never lose outline.
- **Disabled** — `opacity: 0.5`, `cursor: not-allowed`, `aria-disabled="true"`.

## CSS skeleton

```css
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px;
  border-radius: vars.radius[3];
  font: 500 13px/1 vars.font.sans;
  cursor: pointer;
  transition: background vars.duration.fast vars.easing.out,
              border-color vars.duration.fast vars.easing.out,
              transform vars.duration.fast vars.easing.out;
}
.btn:focus-visible { outline: none; box-shadow: vars.focusRing; }
.btn[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
```

## Accessibility

- Icon-only buttons **must** have `aria-label`.
- Toggle buttons use `aria-pressed`.
- When rendering as `<a>` (with `href`), switch role appropriately — nav = link, action = button.
