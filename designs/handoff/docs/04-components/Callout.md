# Callout

Prose inset — draws attention to a note inside article flow.

```jsx
<Callout>
  <strong>NOTE </strong>TTI 300ms 개선이 목표였고, 실제로는 CLS 쪽에서 더 큰 이득을 봤다.
</Callout>
```

## CSS

```css
.callout {
  margin: 28px 0;
  padding: 18px 22px;
  background: vars.color.accentTint;
  border-left: 3px solid vars.color.accent;
  border-radius: 2px 6px 6px 2px;
  color: vars.color.ink2;
  font-size: 15.5px;
  line-height: 1.7;
}
.callout > strong { color: vars.color.accentHover; font-weight: 600; margin-right: 4px; }
```

## Rules

- Keep to one callout per section. Two or more = the section needs restructuring.
- Body text only. No headings, no lists (lose the inset quality).
- `<strong>NOTE</strong>` / `<strong>CAUTION</strong>` prefix is optional but common.
- Never nest callouts.
