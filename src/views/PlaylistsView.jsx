import { useEffect, useState, useMemo } from "react";
import { getVideosByUserId } from "../utils/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ViewControls from "../components/ui/ViewControls";
import SavedVideoList from "../components/SavedVideoList";

// Highlight search matches
const highlightMatch = (text, query) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.split(regex).map((part, idx) =>
    regex.test(part) ? (
      <span key={idx} className="bg-yellow-200 rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const MyPlaylistView = () => {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("recent");
  const [isCondensedLayout, setIsCondensedLayout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const auth = getAuth();

  // Fetch user and videos
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!active) return;
      setUser(u);
      if (!u) {
        setVideos([]);
        setLoading(false);
        return;
      }
      try {
        const data = await getVideosByUserId(u.uid);
        if (active) setVideos(data);
      } catch (err) {
        console.error("Failed to fetch videos:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth]);

  // Filter & sort
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.channelTitle.toLowerCase().includes(q)
    );
  }, [videos, searchQuery]);

  const sortedVideos = useMemo(() => {
    const vids = [...filteredVideos];
    switch (sortOption) {
      case "recent":
        return vids.sort((a, b) => (b.addedAt?.seconds || 0) - (a.addedAt?.seconds || 0));
      case "earliest":
        return vids.sort((a, b) => (a.addedAt?.seconds || 0) - (b.addedAt?.seconds || 0));
      case "title-asc":
        return vids.sort((a, b) => a.title.localeCompare(b.title));
      case "title-desc":
        return vids.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return vids;
    }
  }, [filteredVideos, sortOption]);

  // Group by channel/category
  const groupedVideos = useMemo(() => {
    return sortedVideos.reduce((acc, video) => {
      const key = video.category || video.channelTitle || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(video);
      return acc;
    }, {});
  }, [sortedVideos]);

  const hasVideos = videos.length > 0;
  const hasResults = sortedVideos.length > 0;

  // Responsive grid
  const gridColumnsClass = isCondensedLayout
    ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4";

  // Reset
  const confirmReset = () => {
    setSearchQuery("");
    setSortOption("recent");
    setShowResetConfirm(false);
  };
  const cancelReset = () => setShowResetConfirm(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        {!loading && hasVideos && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                {videos.length} {videos.length === 1 ? "video" : "videos"}
              </span>
              {searchQuery && hasResults && (
                <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  {sortedVideos.length} result
                  {sortedVideos.length !== 1 ? "s" : ""} found
                </span>
              )}
              {Object.keys(groupedVideos).length > 0 && (
                <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  • {Object.keys(groupedVideos).length}{" "}
                  {Object.keys(groupedVideos).length === 1
                    ? "category"
                    : "categories"}
                </span>
              )}
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 overflow-hidden">
              <ViewControls
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
                placeholder="Search by title or channel..."
              />
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 font-medium text-center">
              Loading your playlist...
            </p>
          </div>
        )}

        {/* Not logged in */}
        {!loading && !user && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 md:p-12 max-w-md text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                Authentication Required
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
                Please log in to access your playlist and manage your saved
                videos.
              </p>
              <button className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-purple-700 transition-colors w-full sm:w-auto">
                Log In
              </button>
            </div>
          </div>
        )}

        {/* Empty Playlist */}
        {!loading && user && !hasVideos && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 md:p-12 max-w-md w-full text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                No Playlists Yet
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 leading-relaxed">
                Start organizing your videos into playlists for easy access.
              </p>
              <button className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-purple-700 transition-colors w-full sm:w-auto">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add First Video
              </button>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && user && hasVideos && !hasResults && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[50vh] px-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 md:p-12 max-w-md text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                No Results Found
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2">
                No videos match your search for
              </p>
              <p className="text-base sm:text-lg font-semibold text-gray-900 mb-5 sm:mb-6 break-words px-2">
                "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}

        {/* Grouped Playlist */}
        {!loading && user && hasResults && (
          <div className="space-y-10">
            {Object.entries(groupedVideos).map(([category, vids]) => (
              <div key={category} className="animate-fadeIn">
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      {category}
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-700">
                      {vids.length}
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-16 sm:w-20 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full"></div>
                </div>

                <SavedVideoList
                  videoList={vids}
                  gridClassName={gridColumnsClass}
                  highlightFunc={(text) => highlightMatch(text, searchQuery)}
                  onRemoveSuccess={(removedId) =>
                    setVideos((prev) =>
                      prev.filter((v) => v.videoId !== removedId)
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPlaylistView;
