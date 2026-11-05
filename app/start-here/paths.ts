/**
 * The reading paths, by hand. Every line describing a post restates what
 * that post says; check it against the post when either one changes.
 *
 * Slugs are the post filenames. A slug that stops matching a published post
 * is dropped rather than breaking the page. A new post shows up here only
 * once it's added to a path.
 */

export type ReadingPath = {
    id: string;
    name: string;
    framing: string;
    posts: { slug: string; adds: string }[];
};

export const welcome = (posts: string, paths: string) =>
    `${posts} posts on testing, infrastructure, starting companies and the everyday craft of software, sorted into ${paths} short paths.`;

export const ONLY_ONE = {
    slug: "2026-10-29-software-archaeology",
    why: "Why so much of working in a fifty-million-line codebase is figuring out why things are the way they are, and what changes when AI agents start doing the digging.",
};

export const PATHS: ReadingPath[] = [
    {
        id: "testing",
        name: "Testing and reliability",
        framing:
            "Two ideas for tests that state what should always hold, even against production traffic, and what reliability feels like from the user’s side of the screen.",
        posts: [
            {
                slug: "2024-10-19-declarative-testing",
                adds: "A thought experiment: an assertion that holds for a test’s whole run, whenever the state changes, rather than after one particular step.",
            },
            {
                slug: "2024-10-26-continuous-verification",
                adds: "Pulls expectations apart from the journeys that drive them, so the same checks could run continuously against production traffic.",
            },
            {
                slug: "2024-10-22-reliability",
                adds: "Reliability as users feel it — a hammer, a spinner, Linear next to Jira — and whether something like “unexpected outcomes per hour” could measure trust.",
            },
        ],
    },
    {
        id: "infrastructure",
        name: "Infrastructure and tools",
        framing:
            "Notes from the plumbing: deploying, debugging, and the frameworks that might one day replace the wiring.",
        posts: [
            {
                slug: "2024-10-08-framework-defined-infrastructure-for-data-engineering",
                adds: "Imperative to declarative to zero-config, and why data engineering might be due its own Next.js.",
            },
            {
                slug: "2024-10-21-docker-compose-in-docker",
                adds: "A proof of concept: a whole compose stack on Fly.io that scales to zero, after EC2, Fargate and Docker-in-Docker each fell short.",
            },
            {
                slug: "2024-10-18-debugging-vscode-mitmproxy-bruno",
                adds: "Past print debugging: one launch.json for both ends of the stack, mitmproxy as a network tab, and Bruno instead of Postman.",
            },
        ],
    },
    {
        id: "founding",
        name: "Building and founding",
        framing:
            "Starting things: what founding a company taught, a step-by-step for getting a side project to paying customers, and what politics and tech have in common.",
        posts: [
            {
                slug: "2025-01-26-what-i-learned-as-a-founder",
                adds: "Four beliefs: failure is the norm, successful founders can’t quit, starting a business is a terrible idea, and caring about your customers matters more the longer you go.",
            },
            {
                slug: "2025-07-24-making-a-side-project-that-actually-ships",
                adds: "Fifteen steps from a barely working MVP to paying customers, most of them about talking to people.",
            },
            {
                slug: "2024-12-22-tech-and-politics",
                adds: "Seven metaphors the two fields share, from “a campaign is a start-up” to the money primary and the grassroots.",
            },
        ],
    },
    {
        id: "craft",
        name: "The craft",
        framing:
            "How the work actually gets done: digging through a big codebase, planning the work, a language with sharp edges, and learning something new.",
        posts: [
            {
                slug: "2026-10-29-software-archaeology",
                adds: "Why so much of the job in a big codebase is digging, what one nilable field revealed, and why agents make self-documenting code more urgent.",
            },
            {
                slug: "2025-01-20-waterfall-agile-kanban",
                adds: "Scrum, Stripe’s project-driven “waterfall” and kanban’s ticket-sized planning, compared from the inside.",
            },
            {
                slug: "2024-11-25-ruby",
                adds: "What’s elegant about Ruby (implicit return, chained dots) and what isn’t (“and” versus “&&”, a throw that isn’t for errors).",
            },
            {
                slug: "2024-11-29-ml",
                adds: "Coming back to code after a long break, and where to start learning machine learning, from Karpathy’s course to the math underneath.",
            },
        ],
    },
];
