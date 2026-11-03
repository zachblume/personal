# AGENTS.md

Context for AI agents working in this repo.

## What this is

Zach Blume's personal site — an engineering blog + portfolio at `zachblume.com`.
Deployed on Vercel.

## Stack

- **Next.js 14** (App Router, `app/` at the repo root — note the import alias is `app/...`, not `@/...`)
- **React 18**, **TypeScript 5.6** (loose — several components are untyped `.tsx` with implicit `any` props)
- **Tailwind CSS v4 alpha** (`4.0.0-alpha.13`) via `@tailwindcss/postcss`. There is **no `tailwind.config.js`** — config is CSS-first in `app/global.css` (`@import "tailwindcss"`).
- **Radix Themes** (`@radix-ui/themes`) wrapping the app, `accentColor="ruby"`, plus `@radix-ui/react-icons`
- **Geist Sans / Geist Mono** via the `geist` package (Geist is not in Next 14.2's bundled Google Fonts list)
- **next-themes** for dark mode (`attribute="class"`, `defaultTheme="system"`)
- **next-view-transitions** for cross-page view transitions
- **next-mdx-remote** for rendering blog posts, **sugar-high** for syntax highlighting
- `@vercel/analytics` + `@vercel/speed-insights`

## Commands

- `npm run dev` (or `make dev`) — dev server
- `npm run build` / `npm run start`
- `npm run format` — Prettier (`.prettierrc`: `tabWidth: 4`)
- `npm run lint` — ESLint with `--fix` (next/core-web-vitals + mdx plugin)
- Husky is installed; keep the tree Prettier-clean before committing.

## Layout of the code

```
app/
  layout.tsx            Root layout: ViewTransitions > html > body > ThemeProvider > Theme > main
                        Body is width-constrained: `max-w-xl mx-4 lg:mx-auto`
  page.tsx              Homepage: full-bleed list of every post (PostRow + generated Art)
  about/page.tsx        About: bio, "now" list, pet photos, contact links
  global.css            Tailwind import + all `.prose` typography styles and misc utilities
  not-found.tsx
  sitemap.ts            Exports `baseUrl` — imported elsewhere for metadata
  robots.ts
  rss/route.ts
  og/route.tsx          Dynamic OG image generation
  blog/
    utils.ts            Server-side: getBlogPosts() reads+parses MDX frontmatter from posts/; formatDate()
    clientUtils.ts      Client-safe formatDate()
    page.tsx            Blog index
    [slug]/page.tsx     Post page; generateStaticParams + generateMetadata from frontmatter
    posts/*.mdx         The posts themselves, named `YYYY-MM-DD-slug.mdx`
  components/
    Link.tsx            Wrapper over next-view-transitions Link; also records visits in localStorage
    BlogLink.tsx        A post row (date + title), shows a "previously read" icon for visited posts
    posts.tsx           BlogPosts — sorted list of BlogLink
    nav.tsx             Navbar — currently EMPTY (`navItems = {}`) and commented out of layout.tsx
    footer.tsx          Currently just a spacer div; real footer is commented out
    mdx.tsx             CustomMDX component map for next-mdx-remote
    outline.tsx / OutlineNavLink.tsx   In-post table of contents
    EmailLink.tsx       Obfuscated mailto link
    LocalStorageLinkSyncer.tsx
  lib/slugify.ts
  lib/site.ts           SITE: name, role, city, email, links, pet photos — shared bio constants
public/                 zach.jpg (avatar), waldo/millie/luna.jpeg (pets)
```

## Content model

Posts are MDX files in `app/blog/posts/` with `---` frontmatter:

```
title, publishedAt (YYYY-MM-DD), summary, image?, draft?
```

`draft: "true"` filters a post out of `getBlogPosts()`. The slug is the filename
(including the date prefix), so URLs look like `/blog/2025-07-24-making-a-side-project-that-actually-ships`.

## Current design

Full-bleed, with a black-and-white interface. The only color on the page is the
generated per-post artwork.

- **Homepage** is the whole archive as an edge-to-edge listview: ordinal, artwork
  thumbnail, title, summary, date, hairline chevron. No hero, no CTA — the header
  rule sits directly on the first row. Rows highlight on hover.
- **About** (`/about`) holds the bio, a "now" definition list, the avatar, the three
  pet photos (grayscale, colorizing on hover), and contact links.
- Blog index and post pages are unchanged: they keep the narrow `max-w-xl`
  reading column from the root layout.
- Body font is **Geist Sans**, code is **Geist Mono** (the `geist` package, which ships
  them locally via `next/font/local`). Tight negative tracking on headings, hairline
  `neutral-200` / `neutral-800` rules.
- Light and dark are both first-class; dark is near-black with its own artwork ramp.

### Generated artwork

`app/components/Art.tsx` draws a unique SVG per post. An FNV-1a hash of the slug
seeds a mulberry32 PRNG, which picks one of seven compositions (concentric rings,
topographic contours, bar fields, ray fans, nested blocks, dot matrices, horizon
sweeps) and all of its parameters. Deterministic, so a post keeps its image across
builds, and there are no image assets to manage.

Color is a duotone per post. The seed picks two hues — stepped by the golden angle
(137.508°) so adjacent rows never land on near-identical colors — and `Art.tsx` sets
them inline on the `<svg>` as `--art-h` and `--art-h2`. `global.css` expands those
into the six-step `--art-bg` / `--art-0`…`--art-5` ramp with `oklch()`; slots 0-2
take the primary hue, 3-5 the secondary. The palette is pastel: high lightness, low
chroma.

Two things to know before touching it:

- **The ramp must stay on `.art`, not `:root`.** A custom property containing
  `var()` is substituted at the element that declares it, and only the resolved
  result inherits. A ramp on `:root` would resolve against an `--art-h` that doesn't
  exist there and compute to garbage for every descendant (symptom: every tile
  renders solid black).
- **`oklch`, not `hsl`.** Lightness and chroma stay perceptually even across hues;
  the same numbers in hsl make the yellows glare and the blues go muddy.

Several compositions draw hairlines out of the pale end of the ramp, so don't widen
the gap between `--art-bg` and slots 4-5 — at 0.45 stroke width a near-white tint
disappears.

To hand-author art for a post instead, add `image:` to its frontmatter and branch at
the call site — every layout uses a 16:9 slot.

### Full-bleed pages

The root layout still clamps pages to `max-w-xl`, which is right for posts and wrong
for the index. Pages that want the whole viewport add the `full-bleed` class to their
root element; `global.css` keys off it with `body:has(.full-bleed)` to zero out the
body/main margins and max-width, and to hide the Footer spacer.

Do **not** try to escape the column with negative margins — the body and main
margins collapse, so the arithmetic doesn't hold, and a `-translate-x-1/2` breakout
creates a transformed ancestor that breaks `position: fixed` for anything inside.

## Conventions and gotchas

- **4-space indentation**, double quotes — enforced by Prettier.
- Imports use bare `app/...` specifiers, e.g. `import { Link } from "app/components/Link"`. This works
  via `baseUrl: "."` in `tsconfig.json` — there is no `paths` map and no `@/` alias.
- Prefer the local `Link` component over `next/link` so view transitions and the
  visited-link localStorage tracking keep working.
- Tailwind v4 **alpha** — some v3 idioms and plugins don't apply. Add theme tokens in CSS, not a JS config.
- Dark mode styles are written inline as `dark:` variants everywhere; there are no CSS variables for color.
- The root layout constrains width for the whole site. A page that needs to be wider
  has to break out with CSS (e.g. `w-screen relative left-1/2 -translate-x-1/2`)
  rather than by overriding the layout.
- **Fonts must be set through Radix's tokens, not on `html`/`body`.** `<Theme>` renders a
  `.radix-themes` wrapper that hard-sets `font-family: var(--default-font-family)`. A class
  selector beats anything merely inherited, so a font applied to `<html>` reaches nothing
  visible — the app silently falls back to the system stack. `global.css` overrides
  `--default-font-family` / `--code-font-family` on `.radix-themes.radix-themes`; the class is
  doubled on purpose, because Next emits `@radix-ui/themes/styles.css` _after_ `global.css`,
  so a single-class rule ties on specificity and loses on source order.
- `app/layout.tsx` injects a third-party `reb2b` visitor-tracking script.
