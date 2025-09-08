'use client';

export function EmailLink() {
    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                const user = 'zachblume';
                const domain = 'gmail.com';
                window.location.href = `mailto:${user}@${domain}`;
            }}
            className="underline text-pink-500 decoration-pink-200 dark:decoration-pink-700 cursor-pointer"
        >
            <span dangerouslySetInnerHTML={{
                __html: ['zach', 'blume', '@', 'gmail', '.com'].join('')
            }} />
        </a>
    );
}