import React, { useState, useEffect } from "react";
import { Grid2x2, Grid3x3, Rows } from "lucide-react";
import { Button } from "./button";
import LibrarySearchbar from "./LibrarySeachbar";
import GridLayoutControls from "./GridLayoutControls";

const ViewControls = ({
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    isCondensedLayout,
    setIsCondensedLayout,
    onReset,
    centerSearch = false,
    placeholder,
}) => {
    const [isMdUp, setIsMdUp] = useState(false);

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

    return (
        <div className="flex flex-col gap-5 justify-between">
            {/* Row 1: Searchbar */}
            <div
                className={`flex ${centerSearch ? "justify-center" : "justify-start"
                    }`}
            >
                <div className="w-full md:w-1/2">
                    <LibrarySearchbar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={placeholder}
                    />
                </div>
            </div>

            {/* Row 2: Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left side: Layout toggle */}
                <GridLayoutControls
                    isMdUp={isMdUp}
                    isCondensedLayout={isCondensedLayout}
                    setIsCondensedLayout={setIsCondensedLayout}
                />

                {/* Right side: Sort + Reset */}
                <div className="flex items-center gap-3 justify-between">
                    {/* Sort by */}
                    <div className="flex items-center gap-2">
                        <label className="font-medium text-gray-700 text-sm">
                            Sort by:
                        </label>
                        <div className="relative">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="appearance-none border border-slate-200 bg-white text-xs md:text-sm text-slate-700 rounded-full px-3 py-1.5 md:px-4 md:py-2 pr-8 md:pr-9 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                            >
                                <option value="recent">Recently Added</option>
                                <option value="earliest">Earliest Added</option>
                                <option value="title-asc">Title (A-Z)</option>
                                <option value="title-desc">Title (Z-A)</option>
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                                ▼
                            </span>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <Button
                        onClick={onReset}
                        className="rounded-full bg-gray-400 hover:bg-gray-500 text-white text-xs md:text-sm font-medium shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"


                    >
                        Reset
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ViewControls;
