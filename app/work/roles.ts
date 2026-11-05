import { SITE } from "app/lib/site";

export type Role = {
    /** Seeds the artwork. */
    slug: string;
    artIndex: number;
    company: string;
    href: string;
    role: string;
    status: "Now" | "Previously" | "Founded";
    /** What the company is, as a clause: "Raise More is …". */
    blurb?: string;
    /** A paragraph on the work itself. Renders only when set. */
    description?: string;
    /** Free text, e.g. "2021–2024". Renders only when set. */
    dates?: string;
    /**
     * Slugs of posts about this work, picked by hand. Only posts that name
     * the company or are about doing this job — not ones that are merely on
     * a nearby subject.
     */
    writing: string[];
};

/**
 * Only what app/lib/site.ts says. The art indices sit past the posts' and are
 * a third of the wheel apart, so the three roles read as different colors and
 * none shares a composition with a post listed under it.
 */
export const ROLES: Role[] = [
    {
        slug: "work-stripe",
        artIndex: 17,
        company: SITE.employer.label,
        href: SITE.employer.href,
        role: SITE.employer.role,
        status: "Now",
        writing: [
            "2026-10-29-software-archaeology",
            "2025-01-20-waterfall-agile-kanban",
        ],
    },
    {
        slug: "work-democratic-data-exchange",
        artIndex: 21,
        company: SITE.previousEmployer.label,
        href: SITE.previousEmployer.href,
        role: SITE.previousEmployer.role,
        status: "Previously",
        writing: [],
    },
    {
        slug: "work-raise-more",
        artIndex: 13,
        company: SITE.company.label,
        href: SITE.company.href,
        role: "Founder",
        status: "Founded",
        blurb: SITE.companyBlurb,
        writing: ["2025-01-26-what-i-learned-as-a-founder"],
    },
];
