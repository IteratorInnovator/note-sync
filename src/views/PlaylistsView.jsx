import { useEffect, useState, useMemo } from "react";
import { getVideosByUserId } from "../utils/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import GridControls from "../components/ui/ViewControls";
import SavedVideoList from "../components/SavedVideoList";

// Utility to highlight search matches
const highlightMatch = (text, query) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.split(regex).map((part, idx) =>
    regex.test(part) ? (
      <span key={idx} className="bg-yellow-200">{part}</span>
    ) : part
  );
};

const MyPlaylistView = () => {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("recent");
  const [isCondensedLayout, setIsCondensedLayout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const auth = getAuth();

  // Listen to auth state and fetch videos
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
        setVideos(data);
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

  // Filter videos by search query
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

  // Group videos by category or channel
  const groupedVideos = useMemo(() => {
    return sortedVideos.reduce((acc, video) => {
      const key = (video.category || video.channelTitle || "Uncategorized").trim();
      if (!acc[key]) acc[key] = [];
      acc[key].push(video);
      return acc;
    }, {});
  }, [sortedVideos]);

  // Grid layout classes
  const gridColumnsClass = isCondensedLayout
    ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
    : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

  // Render
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center md:text-lg text-slate-500/60">
          Loading your playlist...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <p className="p-6 text-center text-gray-600">
        Please log in to see your playlist.
      </p>
    );
  }

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Top Controls */}
      <GridControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOption={sortOption}
        setSortOption={setSortOption}
        isCondensedLayout={isCondensedLayout}
        setIsCondensedLayout={setIsCondensedLayout}
        onReset={() => {
          setSearchQuery("");
          setSortOption("recent");
        }}
        centerSearch={true}
        placeholder="Search videos..."
      />

      {/* Empty / No results */}
      {sortedVideos.length === 0 ? (
        <p className="text-center text-gray-600 mt-16">
          {videos.length === 0
            ? "Your playlist is empty."
            : `No videos found for "${searchQuery}".`}
        </p>
      ) : (
        Object.entries(groupedVideos).map(([category, vids]) => (
          <div key={category} className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-gray-300 pb-2">
              {category}
            </h2>
            <SavedVideoList
              videoList={vids}
              gridClassName={gridColumnsClass}
              highlightFunc={(text) => highlightMatch(text, searchQuery)}
            />
          </div>
        ))
      )}
    </div>
  );
};

export default MyPlaylistView;
