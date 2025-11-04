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
    const [hasSearched, setHasSearched] = useState(false);
    const [noResultsTerm, setNoResultsTerm] = useState("");
    const trimmedSearchTerm = searchTerm.trim();
    const hasNoResults = hasSearched && Boolean(noResultsTerm);

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
        ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3" // condensed
        : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"; // default

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

    useEffect(() => {
        if (!trimmedSearchTerm) {
            setHasSearched(false);
            setNoResultsTerm("");
        }
    }, [trimmedSearchTerm]);

    useEffect(() => {
        if (!hasSearched) return;
        const totalItems = results?.items?.length ?? 0;
        if (totalItems > 0) {
            setNoResultsTerm("");
        }
    }, [results, hasSearched]);

    const handleSearchResults = (payload) => {
        const normalizedPayload = payload ?? {
            items: [],
            nextPageToken: null,
            prevPageToken: null,
        };

        onResultsChange?.(normalizedPayload);

        if (!trimmedSearchTerm) {
            setHasSearched(false);
            setNoResultsTerm("");
            return;
        }

        setHasSearched(true);
        const totalItems = normalizedPayload.items?.length ?? 0;
        if (totalItems === 0) {
            setNoResultsTerm(trimmedSearchTerm);
        } else {
            setNoResultsTerm("");
        }
    };

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
            handleSearchResults(payload);

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
                    <Searchbar
                        value={searchTerm}
                        onChange={onSearchTermChange}
                        onResults={handleSearchResults}
                    />
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
                                <Search
                                    className="h-8 w-8 sm:h-10 sm:w-10"
                                    aria-hidden="true"
                                />
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
                                        Try adjusting your keywords, removing
                                        filters, or searching for a broader
                                        topic to find related videos.
                                    </p>
                                    <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500 sm:text-sm">
                                        <Sparkles
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        <span>
                                            Tip: keep it simple, then refine
                                            once you see promising results.
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                                        Start Exploring
                                    </h2>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                                        Enter a search term above to discover
                                        videos. Save your favorites and take
                                        notes!
                                    </p>
                                    <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500 sm:text-sm">
                                        <Sparkles
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        <span>
                                            Try searching for topics you're
                                            interested in.
                                        </span>
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
                                onClick={() =>
                                    handlePageChange("prev", prevPageToken)
                                }
                                disabled={!prevPageToken || isPaging}
                                className="bg-white cursor-pointer inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isPaging && pagingDirection === "prev" ? (
                                    <Loader className="animate-spin size-5" />
                                ) : (
                                    <ArrowBigLeft className="size-5" />
                                )}
                            </button>

                            {/* Numeric Pagination */}
                            <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5">
                                {pageBadges.map((badge) => (
                                    <span
                                        key={badge.key}
                                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                                            badge.variant === "current"
                                                ? "border-green-600 bg-green-500 text-white"
                                                : "border-gray-300 bg-white text-gray-700"
                                        }`}
                                    >
                                        {badge.value}
                                    </span>
                                ))}
                            </div>

                            {/* Next */}
                            <button
                                type="button"
                                title="Next Page"
                                onClick={() =>
                                    handlePageChange("next", nextPageToken)
                                }
                                disabled={!nextPageToken || isPaging}
                                className="bg-white cursor-pointer inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isPaging && pagingDirection === "next" ? (
                                    <Loader className="animate-spin size-5" />
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
