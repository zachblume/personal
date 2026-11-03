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

`app/components/Art.tsx` draws a unique SVG per post from twelve compositions —
`aurora`, `halo`, `dunes`, `orbs`, `beams`, `bloom`, `ribbon`, `rays`, `mosaic`,
`lens`, `spiral`, `stripes` — all built from soft gradients, blur and overlapping
translucent shapes. The overlaps blend the two hues into colors neither slot
contains, which is most of what stops these reading as charts.

It takes two inputs:

- **`index`** — the post's rank in _chronological_ order (oldest = 0), computed in
  `app/page.tsx`. It picks the composition and the hue pair, so both advance
  together and neighbouring rows differ in shape and color.
- **`slug`** — hashed (FNV-1a) to seed a mulberry32 PRNG for the parameters inside
  a composition, so two posts drawing the same shape still look unalike.

Index chronologically, not by display position: new posts append to the end of that
order, so publishing never reshuffles the artwork of a post that's already out.

**Don't derive the composition or the hue from the hash.** It's the obvious move and
it doesn't work — a hash gives no spacing guarantee, so compositions cluster
(one shape drew 4 of 13 posts) and hues pile up in one corner of the wheel (7 of 13
landed in blue-purple). Golden-angle stepping only spreads _consecutive integers_;
applied to hash values it does nothing.

Color is a duotone per post. The two hues are set inline on the `<svg>` as `--art-h`
/ `--art-h2`, and `global.css` expands them into `--art-bg` / `--art-bg2` plus the
six-step `--art-0`…`--art-5` ramp with `oklch()`. Slots 0-2 take the primary hue,
3-5 the secondary.

Two things to know before touching it:

- **The ramp must stay on `.art`, not `:root`.** A custom property containing
  `var()` is substituted at the element that declares it, and only the resolved
  result inherits. A ramp on `:root` would resolve against an `--art-h` that doesn't
  exist there and compute to garbage for every descendant (symptom: every tile
  renders solid black).
- **`oklch`, not `hsl`.** Lightness and chroma stay perceptually even across hues;
  the same numbers in hsl make the yellows glare and the blues go muddy.

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
