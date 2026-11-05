import { SITE } from "app/lib/site";

const USER = "zachblume";
const ENDPOINT = `https://api.github.com/users/${USER}/repos?sort=pushed&per_page=100`;

export type Repo = {
    name: string;
    url: string;
    description: string;
    language: string | null;
    stars: number;
    /** ISO timestamp */
    pushedAt: string;
    /** Rank by creation date, oldest = 0 — what <Art index> takes. */
    artIndex: number;
};

export type RepoResult =
    { ok: true; repos: Repo[]; total: number } | { ok: false; profile: string };

type ApiRepo = {
    name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    pushed_at: string;
    created_at: string;
    fork: boolean;
    archived: boolean;
};

/**
 * Public repos, most recently pushed first, minus forks, archives and the
 * profile README repo. Unauthenticated, so GitHub allows 60 requests an hour
 * per IP; a good response is cached for a day. Next only caches 200s, so after
 * a rate limit or an outage the page's own hourly revalidation asks again
 * instead of serving the fallback until tomorrow.
 */
export async function getRepos(limit = 12): Promise<RepoResult> {
    const failed = { ok: false, profile: SITE.github.href } as const;
    try {
        const res = await fetch(ENDPOINT, {
            headers: {
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            next: { revalidate: 86400 },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return failed;
        const data: unknown = await res.json();
        if (!Array.isArray(data)) return failed;

        const own = (data as ApiRepo[]).filter(
            (repo) =>
                !repo.fork &&
                !repo.archived &&
                repo.name.toLowerCase() !== USER.toLowerCase(),
        );

        // Art is keyed on creation order, not on display position: the list
        // reorders every time something is pushed, and a repo's artwork
        // shouldn't change when it does.
        const rank = new Map(
            [...own]
                .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
                .map((repo, i) => [repo.name, i]),
        );

        return {
            ok: true,
            total: own.length,
            repos: own.slice(0, limit).map((repo) => ({
                name: repo.name,
                url: repo.html_url,
                description: repo.description?.trim() ?? "",
                language: repo.language,
                stars: repo.stargazers_count,
                pushedAt: repo.pushed_at,
                artIndex: rank.get(repo.name) ?? 0,
            })),
        };
    } catch {
        return failed;
    }
}
