import { useState, useEffect, useMemo } from "react";
import SavedVideoList from "../components/SavedVideoList";
import { getVideosByUserId } from "../utils/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../";
import GridControls from "../components/ui/ViewControls";

// Utility to highlight search matches
const highlightMatch = (text, query) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.split(regex).map((part, idx) =>
    regex.test(part) ? (
      <span key={idx} className="bg-yellow-200">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const MyVideosView = () => {
  const [videoList, setVideoList] = useState([]);
  const [sortOption, setSortOption] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCondensedLayout, setIsCondensedLayout] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch videos for the logged-in user
  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) setVideoList([]);
        setLoading(false);
        return;
      }
      const list = await getVideosByUserId(user.uid);
      if (active) setVideoList(list);
      setLoading(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Sort and filter videos
  const sortedVideos = useMemo(() => {
    if (!videoList || videoList.length === 0) return [];
    const vids = [...videoList];

    // Sorting
    switch (sortOption) {
      case "recent":
        vids.sort((a, b) => (b.addedAt?.seconds || 0) - (a.addedAt?.seconds || 0));
        break;
      case "earliest":
        vids.sort((a, b) => (a.addedAt?.seconds || 0) - (b.addedAt?.seconds || 0));
        break;
      case "title-asc":
        vids.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        vids.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    // Filtering
    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      return vids.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channelTitle.toLowerCase().includes(q)
      );
    }

    return vids;
  }, [videoList, sortOption, searchQuery]);

  const hasVideosInLibrary = videoList.length > 0;
  const hasVideosAfterSearch = sortedVideos.length > 0;

  // Determine grid columns for layout
  const gridColumnsClass = isCondensedLayout
    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" // condensed layout
    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"; // regular layout

  // Reset handlers
  const confirmReset = () => {
    setSortOption("recent");
    setSearchQuery("");
    setShowResetConfirm(false);
  };
  const cancelReset = () => setShowResetConfirm(false);

  return (
    <div className="rounded-lg p-4 bg-gray-50 min-h-screen space-y-6">
      {/* Grid controls */}
      {hasVideosInLibrary && (
        <GridControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
          isCondensedLayout={isCondensedLayout}
          setIsCondensedLayout={setIsCondensedLayout}
          onReset={confirmReset}
          showResetConfirm={showResetConfirm}
          cancelReset={cancelReset}
          centerSearch={true}
          placeholder="Search videos..."
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center md:text-lg text-slate-500/60">
            Loading your videos...
          </div>
        </div>
      )}

      {/* Empty library */}
      {!loading && !hasVideosInLibrary && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center md:text-lg text-slate-500/60">
            Your library is empty. Add a video.
          </div>
        </div>
      )}

      {/* No results after search */}
      {!loading && hasVideosInLibrary && !hasVideosAfterSearch && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center md:text-lg text-slate-500/60">
            No videos found for "{searchQuery}".
          </div>
        </div>
      )}

      {/* Video grid */}
      {!loading && hasVideosAfterSearch && (
        <SavedVideoList
          videoList={sortedVideos}
          gridClassName={gridColumnsClass}
          highlightFunc={(text) => highlightMatch(text, searchQuery)}
          onRemoveSuccess={(removedId) =>
            setVideoList((prev) => prev.filter((video) => video.videoId !== removedId))
          }
        />
      )}
    </div>
  );
};

export default MyVideosView;
