import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SavedVideoList from "../components/SavedVideoList";
import { getPlaylistVideosById } from "../utils/firestore"; // implement this to fetch videos in a playlist
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "../"; // your firebase auth export
import ViewControls from "../components/ui/ViewControls";

// Utility to highlight search matches
const highlightMatch = (text, query) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.split(regex).map((part, idx) =>
    regex.test(part) ? (
      <span key={idx} className="bg-yellow-200">{part}</span>
    ) : (
      part
    )
  );
};

const PlaylistVideoView = () => {
  const { playlistId } = useParams();
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("recent");
  const [isCondensedLayout, setIsCondensedLayout] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const authInstance = getAuth();

  // Fetch videos in this playlist
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (!active) return;
      if (!user) {
        setVideos([]);
        setLoading(false);
        return;
      }

      try {
        const vids = await getPlaylistVideosById(user.uid, playlistId);
        if (active) setVideos(vids);
      } catch (err) {
        console.error("Failed to fetch playlist videos:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authInstance, playlistId]);

  // Filter videos by search
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.channelTitle.toLowerCase().includes(q)
    );
  }, [videos, searchQuery]);

  // Sort videos
  const sortedVideos = useMemo(() => {
    const vids = [...filteredVideos];
    switch (sortOption) {
      case "recent":
        return vids.sort(
          (a, b) => (b.addedAt?.seconds || 0) - (a.addedAt?.seconds || 0)
        );
      case "earliest":
        return vids.sort(
          (a, b) => (a.addedAt?.seconds || 0) - (b.addedAt?.seconds || 0)
        );
      case "title-asc":
        return vids.sort((a, b) => a.title.localeCompare(b.title));
      case "title-desc":
        return vids.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return vids;
    }
  }, [filteredVideos, sortOption]);

  const hasVideos = videos.length > 0;
  const hasResults = sortedVideos.length > 0;

  const gridColumnsClass = isCondensedLayout
    ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
    : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">

        {/* Header + Search */}
        {!loading && hasVideos && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 overflow-hidden">
              <ViewControls
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortOption={sortOption}
                setSortOption={setSortOption}
                isCondensedLayout={isCondensedLayout}
                setIsCondensedLayout={setIsCondensedLayout}
                onReset={() => setSearchQuery("")}
                centerSearch={true}
                placeholder="Search videos in this playlist..."
              />
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium text-center">Loading playlist videos...</p>
          </div>
        )}

        {/* Empty Playlist */}
        {!loading && !hasVideos && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <p className="text-gray-600 text-center text-lg">
              This playlist has no videos yet.
            </p>
            <button
              onClick={() => navigate("/search")}
              className="mt-4 px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Add Videos
            </button>
          </div>
        )}

        {/* No search results */}
        {!loading && hasVideos && !hasResults && (
          <p className="text-center text-gray-600 mt-6">
            No videos match "{searchQuery}" in this playlist.
          </p>
        )}

        {/* Video Grid */}
        {!loading && hasResults && (
          <SavedVideoList
            videoList={sortedVideos}
            gridClassName={gridColumnsClass}
            highlightFunc={(text) => highlightMatch(text, searchQuery)}
            onRemoveSuccess={(removedId) =>
              setVideos((prev) => prev.filter((v) => v.videoId !== removedId))
            }
          />
        )}
      </div>
    </div>
  );
};

export default PlaylistVideoView;
