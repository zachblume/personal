const USER = "zachblume";

/** The projects worth showing, picked by hand. */
const PINNED = ["autospec"];

export type Repo = {
    name: string;
    url: string;
    description: string;
    language: string | null;
    stars: number;
};

type ApiRepo = {
    html_url: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
};

/**
 * The pinned repos, with their description and stars from GitHub's public
 * API (unauthenticated: 60 requests an hour per IP; a good response is cached
 * for a day). If GitHub can't be reached, a repo still shows by name.
 */
export async function getRepos(): Promise<Repo[]> {
    return Promise.all(
        PINNED.map(async (name) => {
            const fallback: Repo = {
                name,
                url: `https://github.com/${USER}/${name}`,
                description: "",
                language: null,
                stars: 0,
            };
            try {
                const res = await fetch(
                    `https://api.github.com/repos/${USER}/${name}`,
                    {
                        headers: {
                            Accept: "application/vnd.github+json",
                            "X-GitHub-Api-Version": "2022-11-28",
                        },
                        next: { revalidate: 86400 },
                        signal: AbortSignal.timeout(8000),
                    },
                );
                if (!res.ok) return fallback;
                const repo = (await res.json()) as ApiRepo;
                return {
                    name,
                    url: repo.html_url,
                    description: repo.description?.trim() ?? "",
                    language: repo.language,
                    stars: repo.stargazers_count,
                };
            } catch {
                return fallback;
            }
        }),
    );
}
