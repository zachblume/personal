# AGENTS.md

Context for AI agents working in this repo.

## What this is

Zach Blume's personal site — an engineering blog + portfolio at `zachblume.com`.
Deployed on Vercel.

## Stack

- **Next.js 16** (App Router, `app/` at the repo root — note the import alias is `app/...`, not `@/...`)
- **React 19**, **TypeScript 7** (CLI; TypeScript 6 compatibility API for build/lint tooling) (loose — several components are untyped `.tsx` with implicit `any` props)
- **Tailwind CSS v4** via `@tailwindcss/postcss`. There is **no `tailwind.config.js`** — config is CSS-first in `app/global.css` (`@import "tailwindcss"`).
- **Radix Themes** (`@radix-ui/themes`) wrapping the app, `accentColor="ruby"`, plus `@radix-ui/react-icons`
- **Geist Sans / Geist Mono** via the `geist` package (the package ships the fonts locally)
- **next-themes** for dark mode (`attribute="class"`, `defaultTheme="system"`)
- **next-mdx-remote** for rendering blog posts, **sugar-high** for syntax highlighting
- `@vercel/analytics` + `@vercel/speed-insights`

## Commands

Use pnpm 10.34.4 (pinned in `package.json`) with Node.js 24. Run `pnpm install`
after cloning; CI installs should use `pnpm install --frozen-lockfile`. Commit
`pnpm-lock.yaml` when dependencies change.

- `pnpm run dev` (or `make dev`) — dev server
- `pnpm run build` / `pnpm run start`
- `pnpm run format` — Prettier (`.prettierrc`: `tabWidth: 4`)
- `pnpm run lint` — ESLint with `--fix` (next/core-web-vitals + mdx plugin)
- Husky is installed; keep the tree Prettier-clean before committing.

## Layout of the code

```
app/
  layout.tsx            Root layout: html > body > ThemeProvider > Theme > main, plus the
                        ⌘K CommandPalette (outside <main>). Body is width-constrained:
                        `max-w-xl mx-4 lg:mx-auto`
  page.tsx              Homepage: full-bleed list of every post (PostList)
  timeline/             /timeline — every post on a time axis, with a by-year tally
  about/                About: bio, work (roles.ts), open source (github.ts, revalidates
                        hourly), pet photos, contact links
  global.css            Tailwind import + all `.prose` typography styles and misc utilities
  not-found.tsx
  sitemap.ts            Exports `baseUrl` — imported elsewhere for metadata
  robots.ts
  rss/route.ts
  og/route.tsx          Legacy title-only OG image route; nothing links to it
  fonts/                Kern-free Geist Sans / Serif TTFs for the share card (OFL)
  blog/
    utils.ts            Server-side: getBlogPosts() reads+parses MDX frontmatter from posts/; formatDate()
    clientUtils.ts      Client-safe formatDate()
    page.tsx            Blog index
    [slug]/page.tsx     Post page; generateStaticParams + generateMetadata from frontmatter
    [slug]/opengraph-image.tsx   Per-post share card, prerendered (see "Share cards")
    posts/*.mdx         The posts themselves, named `YYYY-MM-DD-slug.mdx`
  components/
    SiteChrome.tsx      SiteHeader (nav, ⌘K button, an `actions` slot) and SiteFooter (sitemap)
    Link.tsx            Wrapper over next/link; also records visits in localStorage
    PostList.tsx / PostRow.tsx   The archive list (homepage and article "Past Writing")
    ReadingHistory.tsx  "You've read n of m" strip under the archive
    article/            Article page: reading bar, margin outline, sidenotes, link previews, Read next
    art-studio/         <ArtStudio />, the interactive artwork studio any post can embed in its MDX
    command-palette/    ⌘K palette; the dialog itself loads on first open
    BlogLink.tsx        A post row (date + title), shows a "previously read" icon for visited posts
    posts.tsx           BlogPosts — sorted list of BlogLink
    mdx.tsx             CustomMDX component map for next-mdx-remote
    EmailLink.tsx       Obfuscated mailto link
    LocalStorageLinkSyncer.tsx
  lib/posts.ts          getPosts(): every post with plain text, words, minutes, headings, art index
  lib/similarity.ts     TF-IDF over post prose, and the "Both about …" reasons — Read next
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

- **Header** (every full-bleed page): signature (the way home), then Timeline · About
  and a ⌘K search button — the same on every page. Timeline hides on narrow screens;
  the palette and the footer reach everything.
- **Homepage** is the whole archive as an edge-to-edge listview: ordinal, artwork
  thumbnail, title, summary, date, hairline chevron. No hero, no CTA — the header
  rule sits directly on the first row. Rows highlight on hover.
- **About** (`/about`) is also the portfolio, in one quiet column: the bio and avatar;
  **Work** (each role with its own generated artwork and the posts about it); **Open
  source** (recent public repos, text only); the three pet photos (grayscale,
  colorizing on hover); and contact links. Roles live in `app/about/roles.ts` with
  optional `description` / `dates` fields that render only when set.
- **Article pages** have a centered `max-w-xl` reading column. From `lg` long
  parentheticals (4+ words) are set as sidenotes in the right margin, automatically, by
  a transform of the MDX source (inline expanders on narrow screens). At `xl` the
  outline sits sticky in that same margin, lined up with the notes' column, and fades
  out of the way whenever a note scrolls up beside it. A fixed bar with the title and
  a hairline progress rule appears once the title scrolls away, and a resume prompt
  offers your place on return. Links to other posts show a preview card on hover. After
  the article: **Read next** (the three most similar posts by TF-IDF, not by date), then
  the archive list. The blog index keeps the narrow reading column from the root layout.
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

- **`index`** — the post's rank in _chronological_ order (oldest = 0), computed once in
  `app/lib/posts.ts` as `artIndex`. It picks the composition and the hue pair, so both advance
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

`Art.tsx` exports `COMPOSITIONS`, `HUE_STEP`, `HUE_OFFSETS`, `hash` and
`artParams(slug, index)` (a post's composition and two hues, without drawing it), so
code that describes the art — the `<ArtStudio />` embed — never copies its math. When the same post's art appears twice on one page, give one copy an
`idPrefix`: `url(#…)` resolves to the first matching id, and one inside a
`display: none` subtree doesn't paint. Don't render `<Art>` during SSR inside a client
component — its float coordinates differ in the last digit between Node and browsers,
so hydration mismatches. Render it on the server and pass it in.

To hand-author art for a post instead, add `image:` to its frontmatter and branch at
the call site — every layout on the site uses a 16:9 slot. (`image:` also replaces the
whole share card, below.)

### Share cards

`app/blog/[slug]/opengraph-image.tsx` draws each post's Open Graph / X card at build
time with `next/og` (Satori): the site header in miniature (signature, date, hairline
rule), the title in Geist Serif with the summary under it, and the post's artwork as a
full-height panel on the right. Title size steps down with length so most titles set
in two or three lines. Keep the bottom-left empty — X lays the domain over it.

Two Satori quirks shaped it:

- **It can't use the `geist` package's fonts as shipped.** Geist Serif is WOFF2-only,
  which Satori can't read. And Satori breaks lines using unkerned glyph widths but
  draws each word kerned, so a kerned font leaves a visibly wider gap after every
  word. The card reads TTF copies with the `kern` feature emptied from `app/fonts/`.
  To regenerate them after a Geist upgrade (`pip install fonttools brotli`):

    ```python
    from fontTools.ttLib import TTFont

    for src, dest in [
        ("node_modules/geist/dist/fonts/geist-serif/GeistSerif-Regular.woff2", "app/fonts/GeistSerif-Regular.ttf"),
        ("node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf", "app/fonts/Geist-Regular.ttf"),
    ]:
        font = TTFont(src)
        font.flavor = None  # WOFF2 -> TTF
        for record in font["GPOS"].table.FeatureList.FeatureRecord:
            if record.FeatureTag == "kern":
                record.Feature.LookupListIndex = []
        font.save(dest)
    ```

- **It stretches an `<svg>` to fill its box, ignoring `preserveAspectRatio`.** Given
  a `width` and `height`, `Art` crops its own viewBox to what `slice` would show, and
  turns the drawing on its side when the box is portrait: a centre crop to portrait
  keeps under half of a landscape composition.

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
  via the `app/*` paths map in `tsconfig.json` — there is no `@/` alias.
- Prefer the local `Link` component over `next/link` so the visited-link localStorage
  tracking keeps working.
- Tailwind v4 — some v3 idioms and plugins don't apply. Add theme tokens in CSS, not a JS config.
- Dark mode uses `dark:` variants with the class-based custom variant in `global.css` to match next-themes.
- The root layout constrains width for the whole site. A page that needs to be wider
  has to break out with CSS (e.g. `w-screen relative left-1/2 -translate-x-1/2`)
  rather than by overriding the layout.
- ESLint uses flat config in `eslint.config.mjs`. Keep ESLint on the latest 9.x until the React/import/accessibility plugins support 10.
- `typescript` aliases `@typescript/typescript6` for tooling APIs; `@typescript/native` aliases TypeScript 7 and supplies `pnpm exec tsc`. Both are required until tooling supports the TypeScript 7 API.
- Dynamic route `params` are promises in Next.js 16; await them in pages and metadata functions.
- **Fonts must be set through Radix's tokens, not on `html`/`body`.** `<Theme>` renders a
  `.radix-themes` wrapper that hard-sets `font-family: var(--default-font-family)`. A class
  selector beats anything merely inherited, so a font applied to `<html>` reaches nothing
  visible — the app silently falls back to the system stack. `global.css` overrides
  `--default-font-family` / `--code-font-family` on `.radix-themes.radix-themes`; the class is
  doubled on purpose, because Next emits `@radix-ui/themes/styles.css` _after_ `global.css`,
  so a single-class rule ties on specificity and loses on source order.
- Inside `.full-bleed`, `global.css` resets link hover to `color: inherit` (rows own
  their hover treatment), which silently cancels a Tailwind `hover:text-*` on the
  `<a>` itself. Put hover colors in a CSS module or on an inner span — see
  `SiteChrome.module.css`.
- `app/layout.tsx` injects a third-party `reb2b` visitor-tracking script.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
