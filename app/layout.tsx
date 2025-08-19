import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";
import { ViewTransitions } from "next-view-transitions";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import "./global.css";
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
        <ViewTransitions>
            <html lang="en">
                <body className="antialiased max-w-xl mx-4 mt-8 lg:mx-auto">
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
                                {/* <Navbar /> */}
                                {children}
                                <Footer />
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
                        </Theme>
                    </ThemeProvider>
                </body>
            </html>
        </ViewTransitions>
    );
}
