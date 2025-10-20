import React, { useState, useEffect } from "react";
import { Grid2x2, Grid3x3, Rows } from "lucide-react";
import { Button } from "./ui/button";

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
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
      {/* Left: Layout toggle */}
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

      {/* Right: Search + Sort + Reset */}
      <div className="flex flex-1 flex-col md:flex-row items-center gap-2">
        {/* Centered Search */}
        <div className={`flex flex-1 ${centerSearch ? "justify-center" : "justify-start"}`}>
          <input
            type="text"
            placeholder="Search by title or channel"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort + Reset aligned to right */}
        <div className="flex items-center gap-2 md:ml-auto">
          <label className="hidden md:block font-medium text-gray-700 mr-2">Sort by:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Recently Added</option>
            <option value="earliest">Earliest Added</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>

          <Button
            className="px-4 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GridControls;
