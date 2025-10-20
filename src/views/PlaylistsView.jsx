import { useEffect, useState, useMemo } from "react";
import { getVideosByUserId } from "../utils/firestore";
import { getAuth } from "firebase/auth";
import { Button } from "../components/ui/button";

const SavedVideosView = () => {
  const [videos, setVideos] = useState([]);
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("recent");
  const [showResetModal, setShowResetModal] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    const fetchVideos = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const data = await getVideosByUserId(user.uid);
        setVideos(data);
      } catch (err) {
        console.error("Failed to fetch videos:", err);
      }
    };
    fetchVideos();
  }, [auth]);

  if (!auth.currentUser) {
    return (
      <p className="p-6 text-center text-gray-600">
        Please log in to see your saved videos.
      </p>
    );
  }

  const handleReset = () => setShowResetModal(true);

  const confirmReset = (choice) => {
    if (choice) {
      setSearchQuery("");
      setSortOption("recent");
    }
    setShowResetModal(false);
  };

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
        return vids.sort((a, b) => b.addedAt?.seconds - a.addedAt?.seconds);
      case "earliest":
        return vids.sort((a, b) => a.addedAt?.seconds - b.addedAt?.seconds);
      case "title-asc":
        return vids.sort((a, b) => a.title.localeCompare(b.title));
      case "title-desc":
        return vids.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return vids;
    }
  }, [filteredVideos, sortOption]);

  const groupedVideos = useMemo(() => {
    return sortedVideos.reduce((acc, video) => {
      const key = (video.category || video.channelTitle || "Uncategorized").trim();
      if (!acc[key]) acc[key] = [];
      acc[key].push(video);
      return acc;
    }, {});
  }, [sortedVideos]);

  const highlightMatch = (text) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
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

  return (
    <div className="p-6 space-y-8 relative">
      {/* Search + Sort + Reset */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        {/* Search: centered horizontally */}
        <div className="w-full flex justify-center md:justify-center">
          <input
            type="text"
            placeholder="Search by title or channel"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 border rounded-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-2">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="font-medium text-gray-700 whitespace-nowrap">
              Sort By
            </label>
            <select
              id="sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Recently Added</option>
              <option value="earliest">Earliest Added</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
          </div>

          {/* Reset Button */}
          <Button
            className="px-4 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Video Content */}
      {sortedVideos.length === 0 ? (
        <p className="text-center text-gray-600">No videos match your search.</p>
      ) : (
        Object.entries(groupedVideos).map(([category, vids]) => (
          <div key={category} className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-gray-300 pb-2">{category}</h2>

            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {vids.map((v) => (
                <li
                  key={v.videoId}
                  onMouseEnter={() => setHoveredVideo(v.videoId)}
                  onMouseLeave={() => setHoveredVideo(null)}
                  className={`bg-white shadow-md rounded-lg overflow-hidden flex flex-col transition-transform duration-200 ${
                    hoveredVideo && hoveredVideo !== v.videoId ? "opacity-50" : "opacity-100"
                  } hover:shadow-lg`}
                >
                  {v.thumbnailUrl && (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-full h-40 object-cover"
                    />
                  )}

                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                        {highlightMatch(v.title)}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {highlightMatch(v.channelTitle)}
                      </p>
                    </div>
                    <Button
                      className="mt-4 w-full"
                      onClick={() =>
                        window.open(`https://www.youtube.com/watch?v=${v.videoId}`, "_blank")
                      }
                    >
                      Open
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {/* Reset Modal Overlay */}
      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Semi-transparent background */}
          <div className="absolute inset-0 bg-black opacity-40"></div>

          {/* Modal box */}
          <div className="relative bg-white p-6 rounded-xl shadow-lg w-80 max-w-full text-center z-50">
            <p className="mb-4 text-gray-700 font-medium">
              Reset to default (Recently Added) and clear search?
            </p>
            <div className="flex justify-center gap-4">
              <Button
                className="bg-green-500 hover:bg-green-600 text-white rounded-full px-4 py-1"
                onClick={() => confirmReset(true)}
              >
                Yes
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-1"
                onClick={() => confirmReset(false)}
              >
                No
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedVideosView;
