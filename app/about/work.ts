import { SITE } from "app/lib/site";

/**
 * The posts that came out of each job, picked by hand: ones that name the
 * company or are about doing that job. A job with no posts isn't listed.
 */
export const WORK = [
    {
        company: SITE.employer.label,
        posts: [
            "2026-10-29-software-archaeology",
            "2025-01-20-waterfall-agile-kanban",
        ],
    },
    {
        company: SITE.company.label,
        posts: ["2025-01-26-what-i-learned-as-a-founder"],
    },
];
