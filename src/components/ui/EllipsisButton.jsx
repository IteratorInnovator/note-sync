// EllipsisButton.jsx
import { useEffect, useRef, useState } from "react";
import { MoreVertical, Save, ListPlus, Folder } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getPlaylistsByUserId, addVideoToPlaylist } from "../../utils/firestore";

const EllipsisButton = ({ open, onOpenChange, onSave, onAddToPlaylist }) => {
  const rootRef = useRef(null);
  const leaveTimer = useRef(null);

  // 🆕 added state
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [user, setUser] = useState(null);
  const auth = getAuth();

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) onOpenChange(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onOpenChange]);

  // 🆕 Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, [auth]);

  // Helper: cancel any scheduled close
  const cancelClose = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  // 🆕 Handle playlist loading
  const handleAddToPlaylistClick = async () => {
    if (!user) return alert("Please sign in to manage playlists.");
    setLoadingPlaylists(true);
    try {
      const data = await getPlaylistsByUserId(user.uid);
      setPlaylists(data || []);
      setShowPlaylistDropdown((prev) => !prev);
    } catch (err) {
      console.error("Error loading playlists:", err);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  // 🆕 Handle adding video to a selected playlist
  const handleSelectPlaylist = async (playlistId) => {
    try {
      await addVideoToPlaylist(user.uid, playlistId, onAddToPlaylist());
      alert("Video added to playlist!");
      setShowPlaylistDropdown(false);
      onOpenChange(false);
    } catch (err) {
      console.error("Error adding video to playlist:", err);
      alert("Failed to add video.");
    }
  };

  return (
    <div
      ref={rootRef}
      className="absolute right-2 top-2 z-20 sm:right-3 sm:top-3"
      onMouseEnter={cancelClose}
    >
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenChange(!open);
        }}
        className={`rounded-full p-1.5 text-white transform transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
          open
            ? "bg-black/80 opacity-100 scale-100"
            : "bg-black/50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 hover:bg-black/70"
        }`}
      >
        <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Video actions"
          className="absolute right-0 mt-2 w-44 rounded-md border border-slate-200 bg-white p-1 text-slate-900 shadow-lg shadow-slate-900/10"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={cancelClose}
          onMouseLeave={() => {
            cancelClose();
            leaveTimer.current = setTimeout(() => onOpenChange(false), 150);
          }}
        >
          {/* Save button */}
          <button
            role="menuitem"
            onClick={(e) => {
              e.preventDefault();
              onOpenChange(false);
              onSave();
            }}
            className="flex w-full items-center gap-2 rounded-md p-2 text-left text-xs transition-colors hover:bg-slate-100 md:rounded-lg md:text-sm"
          >
            <Save className="h-3.5 w-3.5 text-slate-900 sm:h-4 sm:w-4" />
            <span>Save to My Videos</span>
          </button>

          {/* Add to playlist button */}
          <div className="relative">
            <button
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                handleAddToPlaylistClick();
              }}
              className="flex w-full items-center gap-2 rounded-md p-2 text-left text-xs transition-colors hover:bg-slate-100 md:rounded-lg md:text-sm"
            >
              <ListPlus className="h-3.5 w-3.5 text-slate-900 sm:h-4 sm:w-4" />
              <span>Add to Playlist</span>
            </button>

            {/* 🆕 Playlist dropdown */}
            {showPlaylistDropdown && (
              <div className="absolute left-full top-0 ml-2 w-48 rounded-md border border-slate-200 bg-white shadow-lg z-50">
                {loadingPlaylists ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Loading...</p>
                ) : playlists.length > 0 ? (
                  playlists.map((pl) => (
                    <button
                      key={pl.playlistId}
                      onClick={() => handleSelectPlaylist(pl.playlistId)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-100"
                    >
                      <Folder className="h-3.5 w-3.5 text-slate-700" />
                      <span className="truncate">{pl.title}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-slate-500">
                    No playlists found
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EllipsisButton;
