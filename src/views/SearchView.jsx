import { useState, useEffect } from "react";
import Searchbar from "../components/ui/Searchbar";
import VideoList from "../components/VideoList";
import GridLayoutControls from "../components/ui/GridLayoutControls";

const SearchView = ({
    searchTerm = "",
    onSearchTermChange,
    results = [],
    onResultsChange,
}) => {
    const [isMdUp, setIsMdUp] = useState(false);

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

    return (
        <div className="rounded-lg max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 min-h-screen space-y-6">
            <Searchbar
                value={searchTerm}
                onChange={onSearchTermChange}
                onResults={onResultsChange}
            />
            {results.length != 0 && (
                <GridLayoutControls
                    isMdUp={isMdUp}
                    isCondensedLayout={isCondensedLayout}
                    setIsCondensedLayout={setIsCondensedLayout}
                />
            )}

            {results.length == 0 ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center md:text-lg text-slate-500/60">
                        Start searching to discover new videos.
                    </div>
                </div>
            ) : (
                <div>
                    <VideoList
                        videoList={results}
                        gridClassName={gridColumnsClass}
                    />
                </div>
            )}
        </div>
    );
};

export default SearchView;
