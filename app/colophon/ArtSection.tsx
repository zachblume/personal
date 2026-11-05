import { artByHash, JITTER, widestGap } from "app/colophon/hues";
import {
    FOCUS,
    Label,
    MONO,
    Prose,
    Section,
    TABLE,
    deg,
    ordinal,
    spell,
} from "app/colophon/ui";
import {
    Art,
    artParams,
    COMPOSITIONS,
    HUE_OFFSETS,
    HUE_STEP,
} from "app/components/Art";
import { Link } from "app/components/Link";
import type { Post } from "app/lib/posts";

/** The same post's art is drawn more than once on this page; `idPrefix`
 *  keeps each copy's gradient ids its own. */
function Disc({
    post,
    idPrefix,
    size = 14,
}: {
    post: Post;
    idPrefix: string;
    size?: number;
}) {
    return (
        <span
            className="relative block shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-black"
            style={{ width: size, height: size }}
            title={`${ordinal(post.artIndex)} ${post.title}`}
        >
            <Art
                slug={post.slug}
                index={post.artIndex}
                idPrefix={idPrefix}
                className="absolute inset-0 h-full w-full"
            />
        </span>
    );
}

function Tile({
    post,
    caption,
    note,
    idPrefix = "",
}: {
    post: Post;
    caption: string;
    note?: string;
    idPrefix?: string;
}) {
    return (
        <Link href={post.href} className={`group block ${FOCUS}`}>
            <span className="block overflow-hidden rounded-md border border-neutral-200/80 dark:border-neutral-800">
                <Art
                    slug={post.slug}
                    index={post.artIndex}
                    idPrefix={idPrefix}
                    className="block aspect-[16/9] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
            </span>
            <span
                className={`${MONO} mt-2.5 block text-[11px] text-neutral-900 dark:text-neutral-100`}
            >
                {caption}
            </span>
            {note ? (
                <span className="mt-1 block text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                    {note}
                </span>
            ) : null}
            <span className="mt-1.5 block truncate text-[12px] text-neutral-400 group-hover:text-neutral-900 dark:text-neutral-500 dark:group-hover:text-white">
                <span className={`${MONO} tabular-nums`}>
                    {ordinal(post.artIndex)}
                </span>{" "}
                {post.title}
            </span>
        </Link>
    );
}

type HuePost = { post: Post; h: number };

/** 0–360° laid flat, one dot per post, the widest empty stretch drawn in ink. */
function HueStrip({ label, hues }: { label: string; hues: HuePost[] }) {
    const gap = widestGap(hues.map((x) => x.h));
    // A gap that wraps past 360° is two segments on a flat line.
    const segments: [number, number][] =
        gap.to > gap.from
            ? [[gap.from, gap.to]]
            : [
                  [gap.from, 360],
                  [0, gap.to],
              ];
    const pct = (h: number) => `${((h / 360) * 100).toFixed(2)}%`;

    return (
        <figure>
            <figcaption className="flex items-baseline justify-between gap-4 text-[13px]">
                <span className="text-neutral-900 dark:text-neutral-100">
                    {label}
                </span>
                <span
                    className={`${MONO} text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400`}
                >
                    widest gap {deg(gap.size)}
                </span>
            </figcaption>
            <div className="relative mt-3 h-6" aria-hidden>
                <span className="absolute inset-x-0 top-1/2 h-px bg-neutral-200 dark:bg-neutral-800" />
                {segments.map(([a, b]) => (
                    <span
                        key={a}
                        className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-neutral-900 dark:bg-white"
                        style={{ left: pct(a), width: pct(b - a) }}
                    />
                ))}
                {hues.map(({ post, h }) => (
                    <span
                        key={post.slug}
                        className="art absolute top-1/2 block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white dark:ring-black"
                        style={
                            {
                                left: pct(h),
                                background: "var(--art-1)",
                                "--art-h": h.toFixed(1),
                                "--art-h2": h.toFixed(1),
                            } as React.CSSProperties
                        }
                        title={`${ordinal(post.artIndex)} ${post.title}: ${deg(h)}`}
                    />
                ))}
            </div>
            <div
                aria-hidden
                className={`${MONO} relative h-4 text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500`}
            >
                {[0, 90, 180, 270, 360].map((d) => (
                    <span
                        key={d}
                        className={`absolute top-0 ${d === 0 ? "" : d === 360 ? "-translate-x-full" : "-translate-x-1/2"}`}
                        style={{ left: pct(d) }}
                    >
                        {d}°
                    </span>
                ))}
            </div>
        </figure>
    );
}

export function ArtSection({ posts }: { posts: Post[] }) {
    const oldestFirst = [...posts].sort((a, b) => a.artIndex - b.artIndex);

    // The first twelve posts draw the twelve compositions, one each.
    const gallery = COMPOSITIONS.map((composition, i) => ({
        composition,
        post: oldestFirst.find((p) => p.artIndex === i),
    })).filter((g) => g.post);

    // Two posts a lap apart share a composition: the index picks the shape,
    // the slug makes them unalike.
    const pair = oldestFirst
        .map((post) => [post, oldestFirst[post.artIndex + COMPOSITIONS.length]])
        .find(([, later]) => later) as [Post, Post] | undefined;

    const next = oldestFirst.length;
    const nextComposition = COMPOSITIONS[next % COMPOSITIONS.length].name;
    const nextHue = (next * HUE_STEP) % 360;

    const byIndex = oldestFirst.map((post) => ({
        post,
        ...artParams(post.slug, post.artIndex),
    }));
    const byHash = oldestFirst.map((post) => ({
        post,
        ...artByHash(post.slug),
    }));
    const hashCounts = COMPOSITIONS.map(
        (c) => byHash.filter((x) => x.composition.name === c.name).length,
    );
    const unused = COMPOSITIONS.filter((_, i) => hashCounts[i] === 0);
    const most = Math.max(...hashCounts);
    const crowded = COMPOSITIONS.filter((_, i) => hashCounts[i] === most);

    return (
        <Section id="artwork" numeral="III" title="The artwork">
            <Prose>
                <p>
                    Every post has a drawing made for it in code, an SVG drawn
                    on the server. There are twelve compositions, all soft
                    gradients, blur and translucent shapes laid over each other.
                    Where they overlap, the post&rsquo;s two hues mix into
                    colors neither has alone, which is most of what keeps them
                    from reading as charts. Hover one and its shapes drift
                    about; with reduced motion they hold still.
                </p>
            </Prose>

            <div>
                <Label as="h3">The twelve compositions</Label>
                <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
                    {gallery.map(({ composition, post }) => (
                        <li key={composition.name}>
                            <Tile
                                post={post!}
                                caption={composition.name}
                                note={composition.note}
                            />
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-6">
                <Label as="h3">Two inputs</Label>
                <Prose>
                    <p>
                        A post&rsquo;s place in the archive — oldest first,
                        starting at 0 — picks its composition and its pair of
                        hues, so shape and color step forward together and
                        neighbours always differ in both. New posts join the end
                        of that order, so publishing never redraws a post
                        that&rsquo;s already out.
                    </p>
                    <p>
                        The slug, hashed, seeds a random number generator for
                        everything inside a composition: where the shapes sit,
                        how large, how many. That&rsquo;s what keeps two posts
                        drawing the same shape from looking alike.{" "}
                        <Link
                            href="/art"
                            className={`underline-link text-neutral-900 dark:text-neutral-100 ${FOCUS}`}
                        >
                            Try it in the Art studio
                        </Link>
                        , with any string as the seed.
                    </p>
                </Prose>
                {pair ? (
                    <figure>
                        <ul className="grid max-w-2xl grid-cols-2 gap-5">
                            {pair.map((post) => {
                                const art = artParams(post.slug, post.artIndex);
                                return (
                                    <li key={post.slug}>
                                        <Tile
                                            post={post}
                                            idPrefix="pair-"
                                            caption={`${art.composition.name} · index ${post.artIndex} · ${deg(art.h)} + ${deg(art.h2)}`}
                                        />
                                    </li>
                                );
                            })}
                        </ul>
                        <figcaption className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                            Posts {ordinal(pair[0].artIndex)} and{" "}
                            {ordinal(pair[1].artIndex)} are a full lap apart, so
                            both draw{" "}
                            {
                                artParams(pair[0].slug, pair[0].artIndex)
                                    .composition.name
                            }{" "}
                            at nearly the same first hue. Their slugs place the
                            shapes differently, and the second hue, which cycles
                            through {spell(HUE_OFFSETS.length)} offsets rather
                            than {spell(COMPOSITIONS.length)}, lands somewhere
                            else.
                        </figcaption>
                    </figure>
                ) : null}
                <Prose>
                    <p>
                        The next post will be number {ordinal(next)}: it will
                        draw {nextComposition}, with a first hue within {JITTER}
                        ° of {deg(nextHue)}.
                    </p>
                </Prose>
            </div>

            <div className="space-y-6">
                <Label as="h3">Why not just the hash</Label>
                <Prose>
                    <p>
                        The obvious move is to take the shape and the hue
                        straight from the slug&rsquo;s hash. It was tried, and
                        it clustered: one shape drew 4 of 13 posts, and 7 of 13
                        hues landed in blue-purple. A hash makes no promise
                        about spacing, and golden-angle stepping only spreads
                        consecutive integers; applied to hash values it does
                        nothing. So the index does the spreading, and the hash
                        only varies what happens inside a composition.
                    </p>
                    <p>
                        Here is the same FNV-1a hash the site uses, taken mod{" "}
                        {COMPOSITIONS.length} and mod 360, over today&rsquo;s
                        slugs: {crowded.map((c) => c.name).join(", ")}{" "}
                        {crowded.length > 1 ? "each draw" : "draws"} {most}, and{" "}
                        {unused.length
                            ? `${unused.length} of the twelve ${unused.length === 1 ? "is" : "are"} never drawn at all`
                            : "every shape is drawn at least once"}
                        .
                    </p>
                </Prose>

                <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
                    <figure>
                        <table
                            className={`${TABLE} text-[12px] [&_td]:py-[5px] [&_th]:py-[5px]`}
                        >
                            <caption className="sr-only">
                                Posts per composition, by index and by hash
                            </caption>
                            <thead>
                                <tr className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                    <th
                                        scope="col"
                                        className="pr-4 font-normal"
                                    >
                                        Shape
                                    </th>
                                    <th
                                        scope="col"
                                        className="pr-4 font-normal"
                                    >
                                        By index
                                    </th>
                                    <th scope="col" className="font-normal">
                                        By hash
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPOSITIONS.map((c) => {
                                    const mine = byIndex.filter(
                                        (x) => x.composition.name === c.name,
                                    );
                                    const theirs = byHash.filter(
                                        (x) => x.composition.name === c.name,
                                    );
                                    return (
                                        <tr
                                            key={c.name}
                                            className="border-t border-neutral-200 dark:border-neutral-800"
                                        >
                                            <th
                                                scope="row"
                                                className={`${MONO} pr-4 text-[11px] font-normal text-neutral-900 dark:text-neutral-100`}
                                            >
                                                {c.name}
                                            </th>
                                            {[mine, theirs].map((set, i) => (
                                                <td
                                                    key={i}
                                                    className="pr-4 align-middle"
                                                >
                                                    <span className="flex items-center gap-1">
                                                        <span className="sr-only">
                                                            {set.length}
                                                        </span>
                                                        {set.length ? (
                                                            set.map((x) => (
                                                                <Disc
                                                                    key={
                                                                        x.post
                                                                            .slug
                                                                    }
                                                                    post={
                                                                        x.post
                                                                    }
                                                                    idPrefix={
                                                                        i
                                                                            ? "hash-"
                                                                            : "index-"
                                                                    }
                                                                />
                                                            ))
                                                        ) : (
                                                            <span
                                                                aria-hidden
                                                                className="text-neutral-300 dark:text-neutral-700"
                                                            >
                                                                —
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </figure>
                    <div className="space-y-8 lg:pt-8">
                        <HueStrip
                            label="First hue by index — what the site does"
                            hues={byIndex}
                        />
                        <HueStrip
                            label="First hue by hash — what it doesn’t"
                            hues={byHash}
                        />
                        <p className="text-[12px] leading-relaxed text-neutral-400 dark:text-neutral-500">
                            Each dot is a post, in its own ramp at that hue. The
                            ink rule is the widest stretch of the wheel no
                            post&rsquo;s first hue falls in; the hash version is
                            drawn at the hue the hash would have picked.
                        </p>
                    </div>
                </div>
            </div>
        </Section>
    );
}
