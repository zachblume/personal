import "./global.css";
import type { Metadata } from "next";
// import { Navbar } from "./components/nav";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: {
        default: "Zach Blume",
        template: "%s | Zach Blume",
    },
    description: "This is my portfolio.",
    openGraph: {
        title: "Zach Blume",
        description: "This is my portfolio.",
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

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            className={cx("text-black bg-white dark:text-white dark:bg-black")}
        >
            <body className="antialiased max-w-xl mx-4 mt-8 lg:mx-auto">
                <main className="wrapper flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
                    {/* <Navbar /> */}
                    {children}
                    <Footer />
                    <Analytics />
                    <SpeedInsights />
                </main>
            </body>
        </html>
    );
}
