# Palette (⌘K search)

**The only client-side island.** Everything else is SSG. Uses Pagefind for static search.

## Trigger

- Bound globally to `⌘K` (macOS) and `Ctrl+K` (Win/Linux).
- `/` (forward slash) also opens, unless focus is in an input.
- Opens over any route.

## Structure

```
┌─ scrim (rgba(11,18,32,0.35)) ────────────────────────────┐
│                                                          │
│         ┌─────────────────────────────────┐             │
│         │ 🔎  글 검색…                  Esc │             │
│         ├─────────────────────────────────┤             │
│         │ ARTICLES                         │             │
│         │ ▸ 왜 vanilla-extract으로 옮겼는가   │  ← active  │
│         │   Next.js vs Astro: 선택의 기준      │             │
│         │ NOTES                            │             │
│         │   작은 단위 배포가 복리가 된다         │             │
│         │ TAGS                             │             │
│         │   #performance  #astro  #css     │             │
│         └─────────────────────────────────┘             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Mount

```tsx
// src/components/search/Palette.tsx  — client:idle
import { useEffect, useState, useRef } from "react";

export default function Palette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Grouped>({ articles: [], notes: [], tags: [] });
  const pfRef = useRef<any>(null);

  // Open / close
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setOpen(o => !o);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [open]);

  // Lazy-load Pagefind on first open
  useEffect(() => {
    if (!open || pfRef.current) return;
    // @ts-ignore
    import(/* @vite-ignore */ "/pagefind/pagefind.js").then(m => (pfRef.current = m));
  }, [open]);

  // Search
  useEffect(() => {
    if (!open || !pfRef.current || !query.trim()) return;
    pfRef.current.search(query).then((r: any) => {
      // group results by type, then hydrate with .data()
      setResults(groupResults(r.results));
    });
  }, [query, open]);

  // ... render scrim + dialog + list
}
```

## Build step

```sh
# astro.config: output: "static"
pnpm build          # runs `astro build && pagefind --site dist`
```

Pagefind creates `dist/pagefind/pagefind.js` — ships statically.

## Keyboard

| Key            | Action                                     |
|----------------|--------------------------------------------|
| ⌘K / Ctrl+K    | Toggle open / close                        |
| Esc            | Close                                      |
| ↑ / ↓          | Move highlight (wrap at ends)              |
| ↵ (Enter)      | Open highlighted result                    |
| Tab            | Cycles within the palette only (focus trap) |

## Accessibility

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on the input's label.
- Results list: `role="listbox"` with `role="option"` rows + `aria-selected`.
- `aria-activedescendant` on the input points at the highlighted option id.
- Focus trap while open. Focus returns to the trigger element (whatever was focused before ⌘K) on close.
- Background is `inert` or has `aria-hidden="true"` while the palette is open.

## Motion

The only place `--ease-spring` appears. See `07-motion.md § 4` for the exact keyframes.

```css
.palette       { animation: palette-in vars.duration.slow vars.easing.spring; }
.palette-scrim { animation: fade-in    vars.duration.base vars.easing.out; }
```
