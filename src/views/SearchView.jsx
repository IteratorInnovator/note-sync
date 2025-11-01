import { useState, useEffect, useMemo } from "react";
import Searchbar from "../components/ui/Searchbar";
import VideoList from "../components/VideoList";
import GridLayoutControls from "../components/ui/GridLayoutControls";
import { searchVideos } from "../utils/youtube";
import { LoaderCircle, ArrowBigLeft, ArrowBigRight, Loader  } from "lucide-react";

const SearchView = ({
    searchTerm = "",
    onSearchTermChange,
    results = { items: [], nextPageToken: null, prevPageToken: null },
    onResultsChange,
}) => {
    const [isMdUp, setIsMdUp] = useState(false);
    const [isPaging, setIsPaging] = useState(false);
    const [pagingDirection, setPagingDirection] = useState(null);
    const [pagingError, setPagingError] = useState("");

    // Determine grid column classes based on toggle
    const [isCondensedLayout, setIsCondensedLayout] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(min-width: 768px)");
        const handleChange = (e) => setIsMdUp(e.matches);
        setIsMdUp(mediaQuery.matches);

        mediaQuery.addEventListener
            ? mediaQuery.addEventListener("change", handleChange)
            : mediaQuery.addListener(handleChange);

        return () => {
            mediaQuery.removeEventListener
                ? mediaQuery.removeEventListener("change", handleChange)
                : mediaQuery.removeListener(handleChange);
        };
    }, []);

    const gridColumnsClass = isCondensedLayout
        ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
        : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

    const items = useMemo(() => results?.items ?? [], [results]);
    const nextPageToken = results?.nextPageToken ?? null;
    const prevPageToken = results?.prevPageToken ?? null;

    useEffect(() => {
        setPagingError("");
        setIsPaging(false);
        setPagingDirection(null);
    }, [results]);

    const handlePageChange = async (direction, pageToken) => {
        if (!pageToken || !searchTerm.trim() || isPaging) return;

        setIsPaging(true);
        setPagingDirection(direction);
        setPagingError("");
        const controller = new AbortController();
        try {
            const payload = await searchVideos(searchTerm.trim(), {
                pageToken,
                signal: controller.signal,
            });
            onResultsChange?.(payload);
            if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        } catch (error) {
            if (error?.name === "AbortError") return;
            console.error(error);
            setPagingError("Could not load more results. Please try again.");
        } finally {
            setIsPaging(false);
            setPagingDirection(null);
        }
    };

    return (
        <div className="rounded-lg max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 min-h-screen space-y-6">
            <Searchbar
                value={searchTerm}
                onChange={onSearchTermChange}
                onResults={onResultsChange}
            />
            {items.length !== 0 && (
                <GridLayoutControls
                    isMdUp={isMdUp}
                    isCondensedLayout={isCondensedLayout}
                    setIsCondensedLayout={setIsCondensedLayout}
                />
            )}

            {items.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center md:text-lg text-slate-500/60">
                        Start searching to discover new videos.
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <VideoList
                        videoList={items}
                        gridClassName={gridColumnsClass}
                    />

                    {pagingError ? (
                        <p className="text-sm text-red-500">{pagingError}</p>
                    ) : null}

                    <div className="flex items-center justify-center gap-3">
                        <button
                            type="button"
                            title="Previous Page"
                            onClick={() => handlePageChange("prev", prevPageToken)}
                            disabled={!prevPageToken || isPaging}
                            className="cursor-pointer inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isPaging && pagingDirection === "prev"
                                ? <Loader className="animate-spin size-5" />
                                : <ArrowBigLeft className="size-5" /> }
                        </button>
                        <button
                            type="button"
                            title="Next Page"
                            onClick={() => handlePageChange("next", nextPageToken)}
                            disabled={!nextPageToken || isPaging}
                            className="cursor-pointer inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isPaging && pagingDirection === "next"
                                ? <Loader className="animate-spin size-5" />
                                : <ArrowBigRight className="size-5" /> }
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchView;
