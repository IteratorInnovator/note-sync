import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getPlaylistsByUserId } from "../utils/firestore"; // fetch playlists for current user
import { getAuth, onAuthStateChanged } from "firebase/auth";
import playlistIcon from "../assets/folder.png";
import ViewControls from "../components/ui/ViewControls";

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

const MyPlaylistView = () => {
  const [playlists, setPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  // Fetch user's playlists
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setPlaylists([]);
        setLoading(false);
        return;
      }
      try {
        const data = await getPlaylistsByUserId(user.uid);
        if (active) setPlaylists(data);
      } catch (err) {
        console.error("Failed to fetch playlists:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth]);

  const filteredPlaylists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return playlists.filter(p => p.title.toLowerCase().includes(q));
  }, [playlists, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        
        {/* Search Bar */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-6">
          <ViewControls
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOption={""} // no sorting needed
            setSortOption={() => {}}
            isCondensedLayout={false}
            setIsCondensedLayout={() => {}}
            onReset={() => setSearchQuery("")}
            centerSearch={true}
            placeholder="Search playlists..."
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium text-center">Loading your playlists...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && playlists.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div
              onClick={() => navigate("/search")}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <img src={playlistIcon} alt="Playlist" className="w-20 h-20 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Playlists Yet</h2>
              <p className="text-sm text-gray-600">Start creating playlists to organize your videos. Click here to explore videos!</p>
            </div>
          </div>
        )}

        {/* Playlists Grid */}
        {!loading && filteredPlaylists.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="cursor-pointer bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col items-center hover:scale-[1.02] transition-transform"
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              >
                <img src={playlistIcon} alt="Playlist Icon" className="w-24 h-24 mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 text-center line-clamp-2">
                  {highlightMatch(playlist.title, searchQuery)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{playlist.videos?.length || 0} videos</p>
              </div>
            ))}
          </div>
        )}

        {/* No search results */}
        {!loading && filteredPlaylists.length === 0 && playlists.length > 0 && (
          <p className="text-center text-gray-600 mt-6">No playlists match "{searchQuery}"</p>
        )}

      </div>
    </div>
  );
};

export default MyPlaylistView;
