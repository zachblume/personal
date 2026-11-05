import { PostList } from "app/components/PostList";
import { SiteFooter, SiteHeader } from "app/components/SiteChrome";

export default function Page() {
    return (
        <div className="full-bleed min-h-screen w-full bg-white dark:bg-black">
            <SiteHeader current="home" />
            <PostList />
            <SiteFooter />
        </div>
    );
}
