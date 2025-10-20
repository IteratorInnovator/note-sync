import { useState, useEffect, useMemo } from "react";
import SavedVideoList from "../components/SavedVideoList";
import { getVideosByUserId } from "../utils/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../";
import { Grid2x2, Grid3x3, Rows } from "lucide-react";
import { Button } from "../components/ui/button";

const MyVideosView = () => {
  const [videoList, setVideoList] = useState([]);
  const [sortOption, setSortOption] = useState("addedAtDesc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCondensedLayout, setIsCondensedLayout] = useState(false);
  const [isMdUp, setIsMdUp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Fetch videos for the logged-in user
  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) setVideoList([]);
        return;
      }
      const list = await getVideosByUserId(user.uid);
      if (active) setVideoList(list);
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Handle responsive layout for column options
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (event) => setIsMdUp(event.matches);
    setIsMdUp(mediaQuery.matches);
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", handleChange);
    else mediaQuery.addListener(handleChange);
    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener("change", handleChange);
      else mediaQuery.removeListener(handleChange);
    };
  }, []);

  // Sort and filter videos
  const sortedVideos = useMemo(() => {
    if (!videoList || videoList.length === 0) return [];
    const sorted = [...videoList];

    switch (sortOption) {
      case "addedAtAsc":
        sorted.sort((a, b) => (a.addedAt?.seconds) - (b.addedAt?.seconds));
        break;
      case "addedAtDesc":
        sorted.sort((a, b) => (b.addedAt?.seconds) - (a.addedAt?.seconds));
        break;
      case "titleAsc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "titleDesc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      return sorted.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          v.channelTitle.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
    }

    return sorted;
  }, [videoList, sortOption, searchQuery]);

  const hasVideos = sortedVideos.length > 0;

  // Determine grid columns for layout
  const gridColumnsClass = isCondensedLayout
    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

  const layoutOptions = isMdUp
    ? [
        { condensed: true, label: "Show 2 columns", Icon: Grid2x2 },
        { condensed: false, label: "Show 3 columns", Icon: Grid3x3 },
      ]
    : [
        { condensed: true, label: "Show 1 column", Icon: Rows },
        { condensed: false, label: "Show 2 columns", Icon: Grid2x2 },
      ];

  // Handlers for Reset confirmation
  const handleResetClick = () => setShowResetConfirm(true);
  const confirmReset = () => {
    setSortOption("addedAtDesc");
    setSearchQuery("");
    setShowResetConfirm(false);
  };
  const cancelReset = () => setShowResetConfirm(false);

  return (
    <div className="rounded-lg p-4 bg-gray-50 min-h-screen">
      {hasVideos ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 relative">
          {/* Layout option buttons */}
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

          {/* Sort dropdown + Reset */}
          <div className="flex items-center gap-2 relative">
            <label
              htmlFor="sort-select"
              className="hidden text-sm font-medium text-slate-500 md:block"
            >
              Sort By
            </label>
            <div className="inline-flex items-center gap-2">
              {/* Sort select field */}
              <select
                id="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white/95 pl-3 pr-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-transparent transition hover:shadow-md focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="addedAtDesc">Recently Added</option>
                <option value="addedAtAsc">Earliest Added</option>
                <option value="titleAsc">Title (A-Z)</option>
                <option value="titleDesc">Title (Z-A)</option>
              </select>

              {/* Reset button */}
              <Button
                className="px-4 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                onClick={handleResetClick}
              >
                Reset
              </Button>

              {/* Inline reset confirmation */}
              {showResetConfirm && (
                <div className="absolute top-12 right-0 bg-white border border-gray-300 rounded-lg shadow-md p-4 z-10 w-64 text-center">
                  <p className="mb-3 text-gray-700 font-medium">
                    Reset to default (Recently Added) and clear search?
                  </p>
                  <div className="flex justify-between gap-2">
                    <Button
                      className="px-4 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex-1"
                      onClick={confirmReset}
                    >
                      Yes
                    </Button>
                    <Button
                      className="px-4 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex-1"
                      onClick={cancelReset}
                    >
                      No
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center md:text-lg text-slate-500/60">
            Your library is empty. Add a video.
          </div>
        </div>
      )}

      {/* Video grid */}
      <SavedVideoList
        videoList={sortedVideos}
        gridClassName={gridColumnsClass}
        onRemoveSuccess={(removedId) =>
          setVideoList((prev) =>
            prev.filter((video) => video.videoId !== removedId)
          )
        }
      />
    </div>
  );
};

export default MyVideosView;
