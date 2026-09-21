# @qwipo/tokens

The Qwipo brand foundation as framework-agnostic CSS custom properties, plus the
brand logos. This is the **single source of truth** for color, typography,
spacing, radii, shadows, and dark mode across every Qwipo web app.

> Change `--primary` here, publish a new version, and every app that installs it
> re-colors in lock-step on the next bump — Buttons, Badges, focus rings, active
> tabs, links, charts.

## Install

```bash
npm install @qwipo/tokens
```

## Use (Tailwind v4)

In your app's main CSS file, import Tailwind first, then the tokens:

```css
@import "tailwindcss";
@import "@qwipo/tokens/index.css";   /* font + light/dark tokens */
```

That's it. The `@theme inline { … }` block inside `theme.css` exposes every
token to Tailwind v4 as a utility class, so `bg-background`, `text-foreground`,
`bg-primary`, `border-border`, `rounded-lg`, etc. all resolve to Qwipo values.

Dark mode is driven by a `.dark` class on a parent element (typically `<html>`),
which pairs with [`next-themes`](https://github.com/pacocoursey/next-themes) or
your own toggle.

### Prefer explicit control?

Import the pieces separately:

```css
@import "tailwindcss";
@import "@qwipo/tokens/theme.css";   /* tokens only, no webfont */
/* load Inter yourself via <link> in index.html — see fonts.css */
```

## Logos

```ts
import iconLight from "@qwipo/tokens/assets/Qwipo_Icon_Logo_for_Light_BG@4x-8.png";
import iconDark from "@qwipo/tokens/assets/Qwipo_Icon_Logo_for_Dark_BG.svg";
```

| File | Use on |
|---|---|
| `Qwipo_Icon_Logo_for_Light_BG@4x-8.png` | Light backgrounds (icon mark) |
| `Qwipo_Icon_Logo_for_Dark_BG.svg` | Dark backgrounds (icon mark) |
| `Qwipo_Secondary_Logo_for_Light_BG@4x-8.png` | Light backgrounds (wordmark) |
| `Qwipo_Secondary_Logo_for_Dark_BG.svg` | Dark backgrounds (wordmark) |

## What's inside

- `css/theme.css` — all tokens, `:root` (light) + `.dark`, plus the Tailwind v4
  `@theme inline` mapping. **Never hard-code a hex — reference the token.**
- `css/fonts.css` — Inter webfont import (swap for a `<link>` in prod).
- `css/index.css` — barrel that pulls both of the above.
- `assets/` — brand logos (SVG + PNG, light + dark).
