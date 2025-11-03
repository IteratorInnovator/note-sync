import { useState, useEffect, useMemo } from "react";
import Searchbar from "../components/ui/Searchbar";
import VideoList from "../components/VideoList";
import GridLayoutControls from "../components/ui/GridLayoutControls";
import { searchVideos } from "../utils/youtube";
import {
    ArrowBigLeft,
    ArrowBigRight,
    Loader,
    Search,
    Sparkles,
} from "lucide-react";

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
    const [currentPage, setCurrentPage] = useState(1);
    const [isCondensedLayout, setIsCondensedLayout] = useState(false);

    // Track screen size
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

    // Grid rules
    const gridColumnsClass = isCondensedLayout
        ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2" // condensed
        : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"; // default

    const items = useMemo(() => results?.items ?? [], [results]);
    const nextPageToken = results?.nextPageToken ?? null;
    const prevPageToken = results?.prevPageToken ?? null;
    const pageBadges = useMemo(() => {
        const badges = [];
        const previousValue = currentPage - 1;

        if (prevPageToken && previousValue >= 1) {
            badges.push({
                key: `page-${previousValue}`,
                value: previousValue,
                variant: "adjacent",
            });
        }

        badges.push({
            key: `page-${currentPage}`,
            value: currentPage,
            variant: "current",
        });

        if (nextPageToken) {
            const nextValue = currentPage + 1;
            badges.push({
                key: `page-${nextValue}`,
                value: nextValue,
                variant: "adjacent",
            });
        }

        return badges.slice(0, 3);
    }, [prevPageToken, nextPageToken, currentPage]);

    useEffect(() => {
        setPagingError("");
        setIsPaging(false);
        setPagingDirection(null);

        if (!results?.prevPageToken) {
            setCurrentPage(1);
        }
    }, [results]);

    // Handle paging with page counter
    const handlePageChange = async (direction, pageToken) => {
        if (!pageToken || !trimmedSearchTerm || isPaging) return;

        setIsPaging(true);
        setPagingDirection(direction);
        setPagingError("");

        const controller = new AbortController();
        try {
            const payload = await searchVideos(trimmedSearchTerm, {
                pageToken,
                signal: controller.signal,
            });
            onResultsChange?.(payload);

            // Update page number
            setCurrentPage((prev) =>
                direction === "next" ? prev + 1 : Math.max(1, prev - 1)
            );

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                {/* Header Section with Search */}
                <div className="mb-6 sm:mb-8">
                    {items.length === 0 && (
                        <div className="text-center mb-6 sm:mb-8">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                                Discover Videos
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">
                                Search for YouTube videos and save them with notes
                            </p>
                        </div>
                    )}

                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                        <Searchbar
                            value={searchTerm}
                            onChange={onSearchTermChange}
                            onResults={onResultsChange}
                        />
                    </div>
                </div>

                {/* Results Header with Controls */}
                {items.length !== 0 && (
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-4">
                            <GridLayoutControls
                                isMdUp={isMdUp}
                                isCondensedLayout={isCondensedLayout}
                                setIsCondensedLayout={setIsCondensedLayout}
                            />
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 min-h-[50vh] sm:min-h-[60vh]">
                        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-lg sm:p-12">
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-600 sm:mb-7 sm:h-20 sm:w-20">
                                <Search className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
                            </div>
                            {hasNoResults ? (
                                <>
                                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                                        No results for
                                        <span className="mt-1 block break-all text-green-600 sm:mt-2">
                                            "{noResultsTerm}"
                                        </span>
                                    </h2>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                                        Try adjusting your keywords, removing filters, or searching for a broader topic to find related videos.
                                    </p>
                                    <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500 sm:text-sm">
                                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                                        <span>Tip: keep it simple, then refine once you see promising results.</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                                        Start Exploring
                                    </h2>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                                        Enter a search term above to discover videos. Save your favorites and take notes!
                                    </p>
                                    <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500 sm:text-sm">
                                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                                        <span>Try searching for topics you're interested in.</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 sm:space-y-8">
                        {/* Video Grid */}
                        <div className="animate-fadeIn">
                            <VideoList
                                videoList={items}
                                gridClassName={gridColumnsClass}
                            />
                        </div>

                        {/* Pagination Error */}
                        {pagingError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-red-600">
                                    {pagingError}
                                </p>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-center gap-3 pb-4">
                            {/* Prev */}
                            <button
                                type="button"
                                title="Previous Page"
                                onClick={() => handlePageChange("prev", prevPageToken)}
                                disabled={!prevPageToken || isPaging}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border-2 border-gray-300 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isPaging && pagingDirection === "prev" ? (
                                    <Loader className="size-5 animate-spin" />
                                ) : (
                                    <ArrowBigLeft className="size-5" />
                                )}
                            </button>

                            {/* ✅ Numeric Pagination */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                                <span
                                    className={`px-2 py-1 rounded-md ${
                                        !prevPageToken
                                            ? "text-gray-400"
                                            : "cursor-pointer hover:text-gray-900"
                                    }`}
                                >
                                    {currentPage > 1 ? currentPage - 1 : ""}
                                </span>
                                <span className="px-3 py-1 bg-green-500 text-white rounded-md">
                                    {currentPage}
                                </span>
                                <span
                                    className={`px-2 py-1 rounded-md ${
                                        !nextPageToken
                                            ? "text-gray-400"
                                            : "cursor-pointer hover:text-gray-900"
                                    }`}
                                >
                                    {nextPageToken ? currentPage + 1 : ""}
                                </span>
                            </div>

                            {/* Next */}
                            <button
                                type="button"
                                title="Next Page"
                                onClick={() => handlePageChange("next", nextPageToken)}
                                disabled={!nextPageToken || isPaging}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border-2 border-gray-300 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isPaging && pagingDirection === "next" ? (
                                    <Loader className="size-5 animate-spin" />
                                ) : (
                                    <ArrowBigRight className="size-5" />
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchView;
