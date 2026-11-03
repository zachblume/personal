/** Hairline chevron. Stays out of the way until the row is hovered. */
export function Chevron({ className = "" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3.5 w-3.5 shrink-0 text-neutral-300 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:text-neutral-700 dark:group-hover:text-white ${className}`}
            aria-hidden
        >
            <path d="m5.25 2.75 4.25 4.25-4.25 4.25" />
        </svg>
    );
}
