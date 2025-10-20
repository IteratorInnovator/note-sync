import React, { useState, useEffect } from "react";
import { Grid2x2, Grid3x3, Rows } from "lucide-react";
import { Button } from "./ui/button";
import Searchbar from "./ui/Searchbar";

const GridControls = ({
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  isCondensedLayout,
  setIsCondensedLayout,
  onReset,
  centerSearch = false,
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

  const layoutOptions = isMdUp
    ? [
        { condensed: true, label: "2 Columns", Icon: Grid2x2 },
        { condensed: false, label: "3 Columns", Icon: Grid3x3 },
      ]
    : [
        { condensed: true, label: "1 Column", Icon: Rows },
        { condensed: false, label: "2 Columns", Icon: Grid2x2 },
      ];

  return (
    <div className="flex flex-col gap-4 mb-6 mt-0">
      {/* Row 1: Searchbar */}
      <div className={`flex ${centerSearch ? "justify-center" : "justify-start"}`}>
        <div className="w-full md:w-1/2">
          <Searchbar
            value={searchQuery}
            onChange={setSearchQuery}
            onResults={() => {}}
            placeholder="Search playlist..."

          />
        </div>
      </div>

      {/* Row 2: Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left side: Layout toggle */}
        <div className="flex items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {layoutOptions.map(({ condensed, label, Icon }, index) => {
              const active = condensed === isCondensedLayout;
              return (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => setIsCondensedLayout(condensed)}
                  className={`flex h-9 w-9 items-center justify-center text-slate-400 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 ${
                    active ? "bg-slate-100 text-slate-700" : ""
                  } ${index > 0 ? "border-l border-slate-200" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Sort + Reset */}
        <div className="flex items-center gap-3">
          {/* Sort by */}
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700 text-sm">Sort by:</label>
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none border border-slate-200 bg-white text-sm text-slate-700 rounded-full px-4 py-2 pr-8 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
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
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GridControls;
