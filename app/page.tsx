import { ArchiveViews } from "app/components/archive/ArchiveViews";
import { GridView, IndexView } from "app/components/archive/views";
import { ViewSwitcher } from "app/components/archive/ViewSwitcher";
import { PostHistory, PostRows } from "app/components/PostList";
import { SiteFooter, SiteHeader } from "app/components/SiteChrome";
import { getPosts } from "app/lib/posts";

export default function Page() {
    const posts = getPosts();

    return (
        <div className="full-bleed min-h-screen w-full bg-white dark:bg-black">
            <ArchiveViews
                header={
                    <SiteHeader current="home" actions={<ViewSwitcher />} />
                }
                list={<PostRows posts={posts} />}
                grid={<GridView posts={posts} />}
                index={<IndexView posts={posts} />}
            />
            <PostHistory posts={posts} />
            <SiteFooter />
        </div>
    );
}
