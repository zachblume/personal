import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import Script from "next/script";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { GeistSerifRegular } from "geist/font/serif/regular";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { baseUrl } from "./sitemap";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import "./global.css";
import { CommandPalette } from "app/components/command-palette/CommandPalette";
import { LocalStorageLinkSyncer } from "app/components/LocalStorageLinkSyncer";

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: {
        default: "Zach Blume",
        template: "%s | Zach Blume",
    },
    description: "My engineering blog and portfolio",
    openGraph: {
        title: "Zach Blume",
        description: "My engineering blog and portfolio",
        url: baseUrl,
        siteName: "Zach Blume",
        locale: "en_US",
        type: "website",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            className={`${GeistSans.variable} ${GeistMono.variable} ${GeistSerifRegular.variable}`}
            suppressHydrationWarning
        >
            <body className="antialiased max-w-xl mx-4 mt-8 lg:mx-auto bg-white dark:bg-black dark:bg-gradient-to-b dark:from-neutral-900/20 dark:to-black min-h-screen">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                    enableColorScheme
                >
                    <Theme
                        accentColor="ruby"
                        panelBackground="translucent"
                        hasBackground={false}
                    >
                        <main className="wrapper flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
                            {children}
                            {/* Bottom space for pages in the reading column.
                                Full-bleed pages bring their own footer, and
                                global.css hides this after them. */}
                            <div className="mb-16" />
                            <Analytics />
                            <SpeedInsights />
                            <LocalStorageLinkSyncer />
                            <Script
                                id="reb2b-tracking"
                                strategy="afterInteractive"
                                dangerouslySetInnerHTML={{
                                    __html: `
                                            !function(key) {
                                                if (window.reb2b) return;
                                                window.reb2b = {loaded: true};
                                                var s = document.createElement("script");
                                                s.async = true;
                                                s.src = "https://ddwl4m2hdecbv.cloudfront.net/b/" + key + "/" + key + ".js.gz";
                                                document.getElementsByTagName("script")[0].parentNode.insertBefore(s, document.getElementsByTagName("script")[0]);
                                            }("9NMMZH4YYDNW");
                                        `,
                                }}
                            />
                        </main>
                        {/* Outside <main>, so `.full-bleed ~ div` can't hide it. */}
                        <CommandPalette />
                    </Theme>
                </ThemeProvider>
            </body>
        </html>
    );
}
