# Input

Text input, used for the newsletter form and the search palette.

## Props

```ts
type InputProps = {
  value?: string;
  placeholder?: string;
  type?: "text" | "email" | "search";
  icon?: "search" | null;       // leading 14px SVG with 1.4 stroke
  kbdHint?: string;              // e.g. "⌘K" — right-aligned mono badge
  disabled?: boolean;
  invalid?: boolean;             // renders red border + aria-invalid
  "aria-label"?: string;
  "aria-describedby"?: string;   // points at error message
};
```

## CSS

```css
.input {
  width: 100%;
  padding: 10px 14px;
  background: vars.color.bg;
  border: 1px solid vars.color.line;
  border-radius: vars.radius[3];
  font: 400 14px/1.4 vars.font.sans;
  color: vars.color.ink;
  transition: border-color vars.duration.fast vars.easing.out,
              box-shadow vars.duration.fast vars.easing.out;
}
.input::placeholder { color: vars.color.ink4; }
.input:focus-visible {
  outline: none;
  border-color: vars.color.accent;
  box-shadow: 0 0 0 3px rgba(43,108,255,0.18);
}
.input[aria-invalid="true"] { border-color: red.700; }
.input.has-icon { padding-left: 38px; }
```

## Search pattern

Leading icon, trailing `⌘K` hint:

```html
<div class="input-wrap">
  <svg class="icon" width="14" height="14" aria-hidden="true" ...></svg>
  <input class="input has-icon" type="search" aria-label="글 검색" placeholder="글 검색…" />
  <kbd class="kbd">⌘K</kbd>
</div>
```

The focus ring uses 3px at 18% opacity — slightly softer than buttons because inputs are typed-into.

## Accessibility

- **Always** a `<label>` — visible, not just `aria-label`, unless in a search palette where the context is unambiguous.
- Errors: `aria-invalid="true"` + `aria-describedby` → error text with `role="alert"`.
- `type="search"` enables the native clear button on some browsers.
