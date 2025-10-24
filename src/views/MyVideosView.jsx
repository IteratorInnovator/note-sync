import { useState, useEffect, useMemo } from "react";
import SavedVideoList from "../components/SavedVideoList";
import { getVideosByUserId } from "../utils/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../";
import ViewControls from "../components/ui/ViewControls";

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

  // Determine grid columns for layout - optimized for mobile
  const gridColumnsClass = isCondensedLayout
    ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
    : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";


  // Reset handlers
  const confirmReset = () => {
    setSortOption("recent");
    setSearchQuery("");
    setShowResetConfirm(false);
  };
  const cancelReset = () => setShowResetConfirm(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        {!loading && hasVideosInLibrary && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                {videoList.length} {videoList.length === 1 ? 'video' : 'videos'}
              </span>
              {searchQuery && hasVideosAfterSearch && (
                <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  {sortedVideos.length} result{sortedVideos.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 overflow-hidden">
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

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 font-medium text-center">
              Loading your videos...
            </p>
          </div>
        )}

        {/* Empty Library State */}
        {!loading && !hasVideosInLibrary && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 md:p-12 max-w-md w-full text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                No Videos Yet
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 leading-relaxed">
                Start building your video library by adding your first video. Your saved videos will appear here.
              </p>
              <button className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Video
              </button>
            </div>
          </div>
        )}

        {/* No Search Results State */}
        {!loading && hasVideosInLibrary && !hasVideosAfterSearch && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[50vh] px-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 md:p-12 max-w-md w-full text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

        {/* Video Grid */}
        {!loading && hasVideosAfterSearch && (
          <div className="animate-fadeIn">
            <SavedVideoList
              videoList={sortedVideos}
              gridClassName={gridColumnsClass}
              highlightFunc={(text) => highlightMatch(text, searchQuery)}
              onRemoveSuccess={(removedId) =>
                setVideoList((prev) => prev.filter((video) => video.videoId !== removedId))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVideosView;