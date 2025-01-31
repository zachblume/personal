"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const LocalStorageLinkSyncer = (): null => {
    const page = usePathname();
    useEffect(() => {
        // When the pathname changes, store it as visited in localstorage
        if (typeof window === "undefined") {
            return;
        }
        window.localStorage.setItem(page, "true");
    }, [page]);
    return null;
};
export { LocalStorageLinkSyncer };
