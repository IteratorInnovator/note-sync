import { useEffect, useState, useMemo, useCallback } from "react";
import {
    getUserVideosAndPlaylists,
    removeVideoIdsFromPlaylist,
    createPlaylist,
    deletePlaylist,
    addVideosToPlaylist,
    renamePlaylist,
} from "../utils/firestore";
import { Check, CheckCircle, X, ListVideo } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ViewControls from "../components/ui/ViewControls";
import SavedVideoList from "../components/SavedVideoList";
import { useNavigate } from "react-router-dom";
import { useToasts } from "../stores/useToasts";

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

const MyPlaylistView = () => {
    const [videos, setVideos] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("recent");
    const [isCondensedLayout, setIsCondensedLayout] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [playlists, setPlaylists] = useState([]);

    const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [editingPlaylistId, setEditingPlaylistId] = useState(null);
    const [editingPlaylistName, setEditingPlaylistName] = useState("");
    const [selectedVideos, setSelectedVideos] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

    // Delete confirmation modal states
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [playlistToDelete, setPlaylistToDelete] = useState(null);

    const auth = getAuth();
    const navigate = useNavigate();

    const { addToast } = useToasts();

    const fetchUserData = useCallback(async (uid) => {
        if (!uid) {
            return { videos: [], playlists: [] };
        }

        const result = await getUserVideosAndPlaylists(uid);
        const { playlists } = result;

        const playlistsNeedingCleanup = playlists.filter(
            (playlist) => playlist.missingVideoIds?.length
        );

        if (playlistsNeedingCleanup.length) {
            await Promise.all(
                playlistsNeedingCleanup.map((playlist) =>
                    removeVideoIdsFromPlaylist(
                        uid,
                        playlist.playlistId,
                        playlist.missingVideoIds
                    ).catch((error) => {
                        console.error(
                            "Failed to prune playlist entries",
                            playlist.playlistId,
                            error
                        );
                    })
                )
            );

            return await getUserVideosAndPlaylists(uid);
        }

        return result;
    }, []);

    const refreshData = useCallback(
        async (uid) => {
            const { videos, playlists } = await fetchUserData(uid);
            setVideos(videos);
            setPlaylists(playlists);
        },
        [fetchUserData]
    );

    // Listen for auth changes and fetch videos + playlists
    useEffect(() => {
        let active = true;

        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (!active) return;
            setUser(u);

            if (!u) {
                setVideos([]);
                setPlaylists([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { videos: libraryVideos, playlists } =
                    await fetchUserData(u.uid);
                if (!active) return;

                setVideos(libraryVideos);
                setPlaylists(playlists);
            } catch (error) {
                console.error("Failed to load videos/playlists:", error);
                if (active) {
                    setVideos([]);
                    setPlaylists([]);
                }
            } finally {
                if (active) setLoading(false);
            }
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [auth, fetchUserData]);

    const [createErrorMessage, setCreateErrorMessage] = useState("");
    const [renameErrorMessage, setRenameErrorMessage] = useState("");
    const [addVideosErrorMessage, setAddVideosErrorMessage] = useState("");

    const handleCreatePlaylist = async () => {
        const name = newPlaylistName.trim();
        const uid = user?.uid;
        if (!name || !uid) return;

        // Check for duplicate playlist name
        const duplicate = playlists.some((playlist) => playlist.name === name);
        if (duplicate) {
            setCreateErrorMessage(
                `Playlist name "${name}" already exists. Please choose a different name.`
            );
            return;
        }

        try {
            setLoading(true);
            await createPlaylist(uid, name);
            await refreshData(uid);
            setNewPlaylistName("");
            setShowCreatePlaylist(false);
            setCreateErrorMessage(""); // clear error
            addToast({
                message: "Playlist created successfully",
                Icon: CheckCircle,
                iconColour: "text-emerald-400",
            });
        } catch {
            addToast({
                message: "Failed to create playlist",
                Icon: X,
                iconColour: "text-emerald-400",
            });
        } finally {
            setLoading(false);
        }
    };

    // Rename playlist
    const handleRenamePlaylist = async (playlistId) => {
        const nextName = editingPlaylistName.trim();
        const uid = user?.uid;
        if (!nextName || !uid) return;

        // Check for duplicate name excluding the current playlist
        const duplicate = playlists.some(
            (playlist) =>
                playlist.playlistId !== playlistId && playlist.name === nextName
        );
        if (duplicate) {
            setRenameErrorMessage(
                `Playlist name "${nextName}" already exists. Please choose a different name.`
            );
            return;
        }

        try {
            setLoading(true);
            await renamePlaylist(uid, playlistId, nextName);
            await refreshData(uid);
            setEditingPlaylistId(null);
            setEditingPlaylistName("");
            setRenameErrorMessage(""); // clear error if rename succeeds
            addToast({
                message: "Playlist renamed successfully",
                Icon: CheckCircle,
                iconColour: "text-emerald-400",
            });
        } catch {
            addToast({
                message: "Failed to rename playlist",
                Icon: X,
                iconColour: "text-red-400",
            });
        } finally {
            setLoading(false);
        }
    };

    // Delete playlist
    const handleDeletePlaylist = (playlistId) => {
        setPlaylistToDelete(playlistId);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        const uid = user?.uid;
        if (!playlistToDelete || !uid) return;
        try {
            setLoading(true);
            await deletePlaylist(uid, playlistToDelete);
            await refreshData(uid);
            addToast({
                message: "Playlist deleted successfully",
                Icon: CheckCircle,
                iconColour: "text-emerald-400",
            });
        } catch {
            addToast({
                message: "Failed to delete playlist",
                Icon: X,
                iconColour: "text-red-400",
            });
        } finally {
            setShowConfirmDelete(false);
            setPlaylistToDelete(null);
            setLoading(false);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDelete(false);
        setPlaylistToDelete(null);
    };

    // Add videos to playlist
    const handleAddToPlaylist = async (playlistId) => {
        const uid = user?.uid;
        if (!uid || !playlistId || selectedVideos.size === 0) return;

        // Find the target playlist
        const targetPlaylist = playlists.find(
            (playlist) => playlist.playlistId === playlistId
        );

        if (!targetPlaylist) return;

        // Get IDs of videos already in the playlist
        const existingVideoIds = new Set(targetPlaylist.videoIds || []);

        // Filter out videos that are already added
        const newVideosToAdd = Array.from(selectedVideos).filter(
            (id) => !existingVideoIds.has(id)
        );

        if (newVideosToAdd.length === 0) {
            // All selected videos already exist
            setAddVideosErrorMessage(
                "All selected videos already added to this playlist."
            );
            return;
        }

        try {
            setLoading(true);
            await addVideosToPlaylist(uid, playlistId, newVideosToAdd);
            await refreshData(uid);
            setSelectedVideos(new Set());
            setSelectionMode(false);
            setShowAddToPlaylist(false);
            setAddVideosErrorMessage(""); // Clear any previous errors
            addToast({
                message: "Videos added to playlist successfully",
                Icon: CheckCircle,
                iconColour: "text-emerald-400",
            });
        } catch {
            addToast({
                message: "Failed to add videos to playlist",
                Icon: X,
                iconColour: "text-red-400",
            });
        } finally {
            setLoading(false);
        }
    };

    // Remove video from playlist
    const handleRemoveFromPlaylist = async (playlistId, videoId) => {
        const uid = user?.uid;
        if (!uid || !playlistId) return;

        try {
            await removeVideoIdsFromPlaylist(uid, playlistId, [videoId]);
            setPlaylists((prev) =>
                prev.map((playlist) => {
                    if (playlist.playlistId !== playlistId) return playlist;
                    const nextVideoIds = (playlist.videoIds || []).filter(
                        (id) => id !== videoId
                    );
                    const nextVideos = (playlist.videos || []).filter(
                        (video) => video.videoId !== videoId
                    );
                    return {
                        ...playlist,
                        videoIds: nextVideoIds,
                        videos: nextVideos,
                    };
                })
            );
        } catch {
            addToast({
                message: "Failed to remove video from playlist",
                Icon: X,
                iconColour: "text-red-400",
            });
        }
    };

    // Toggle video selection
    const toggleVideoSelection = (videoId) => {
        const newSelection = new Set(selectedVideos);
        if (newSelection.has(videoId)) newSelection.delete(videoId);
        else newSelection.add(videoId);
        setSelectedVideos(newSelection);
    };

    // Filter videos
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
        return filteredVideos.slice().sort((a, b) => {
            switch (sortOption) {
                case "recent":
                    return (
                        (b.addedAt?.seconds || 0) - (a.addedAt?.seconds || 0)
                    );
                case "earliest":
                    return (
                        (a.addedAt?.seconds || 0) - (b.addedAt?.seconds || 0)
                    );
                case "title-asc":
                    return a.title.localeCompare(b.title);
                case "title-desc":
                    return b.title.localeCompare(a.title);
                default:
                    return 0;
            }
        });
    }, [filteredVideos, sortOption]);

    // Grouped videos
    const groupedVideos = useMemo(() => {
        return sortedVideos.reduce((acc, video) => {
            const key = (
                video.category ||
                video.channelTitle ||
                "Uncategorized"
            ).trim();
            if (!acc[key]) acc[key] = [];
            acc[key].push(video);
            return acc;
        }, {});
    }, [sortedVideos]);

    const hasVideos = videos.length > 0;
    const hasResults = sortedVideos.length > 0;

    const gridColumnsClass = isCondensedLayout
        ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
        : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

    const handleVideoRemoved = useCallback((removedId) => {
        setVideos((prev) =>
            prev.filter((video) => video.videoId !== removedId)
        );
        setPlaylists((prev) =>
            prev.map((playlist) => ({
                ...playlist,
                videoIds: (playlist.videoIds || []).filter(
                    (id) => id !== removedId
                ),
                videos: (playlist.videos || []).filter(
                    (video) => video.videoId !== removedId
                ),
                missingVideoIds: (playlist.missingVideoIds || []).filter(
                    (id) => id !== removedId
                ),
            }))
        );
    }, []);

    return (
        <div className="min-h-screen rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                {/* Header */}
                {!loading && hasVideos && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                {videos.length}{" "}
                                {videos.length === 1 ? "video" : "videos"}
                            </span>
                            {searchQuery && hasResults && (
                                <span className="text-sm text-gray-600">
                                    {sortedVideos.length} result
                                    {sortedVideos.length !== 1 ? "s" : ""} found
                                </span>
                            )}
                            <span className="text-sm text-gray-600">
                                • {playlists.length}{" "}
                                {playlists.length === 1
                                    ? "playlist"
                                    : "playlists"}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <button
                                onClick={() => setShowCreatePlaylist(true)}
                                className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                            >
                                + Create Playlist
                            </button>
                            {hasVideos && (
                                <button
                                    onClick={() => {
                                        setSelectionMode(!selectionMode);
                                        setSelectedVideos(new Set());
                                    }}
                                    className={`cursor-pointer px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                        selectionMode
                                            ? "bg-gray-600 border text-white hover:bg-gray-700"
                                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {selectionMode
                                        ? "Cancel Selection"
                                        : "Select Videos"}
                                </button>
                            )}
                            {selectionMode && selectedVideos.size > 0 && (
                                <button
                                    onClick={() => setShowAddToPlaylist(true)}
                                    className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    Add {selectedVideos.size} to Playlist
                                </button>
                            )}
                        </div>

                        {/* View Controls */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 overflow-hidden">
                            <ViewControls
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
                                placeholder="Search by title or channel..."
                            />
                        </div>
                    </div>
                )}

                {/* Create Playlist Modal */}
                {showCreatePlaylist && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold mb-4">
                                Create New Playlist
                            </h3>
                            <input
                                type="text"
                                value={newPlaylistName}
                                onChange={(e) => {
                                    setNewPlaylistName(e.target.value);
                                    setCreateErrorMessage(""); // Clear error while typing
                                }}
                                placeholder="Enter playlist name..."
                                className="w-full px-4 py-2 mb-2 rounded-lg focus:outline-none focus:ring-2 border border-gray-300 focus:ring-purple-500"
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handleCreatePlaylist()
                                }
                                autoFocus
                            />
                            {/* Display error if playlist name is duplicate */}
                            {createErrorMessage && (
                                <p className="text-red-600 text-sm mb-2">
                                    {createErrorMessage}
                                </p>
                            )}

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowCreatePlaylist(false);
                                        setNewPlaylistName("");
                                        setCreateErrorMessage(""); // Clear error on cancel
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreatePlaylist}
                                    disabled={!newPlaylistName.trim()}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add to Playlist Modal */}
                {showAddToPlaylist && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                            <h3 className="text-xl font-bold mb-4">
                                Add to Playlist
                            </h3>

                            {/* Error Message */}
                            {addVideosErrorMessage && (
                                <p className="text-red-600 text-sm mb-2">
                                    {addVideosErrorMessage}
                                </p>
                            )}

                            {playlists.length === 0 ? (
                                <p className="text-gray-600 mb-4">
                                    No playlists yet. Create one first!
                                </p>
                            ) : (
                                <div className="space-y-2 mb-4">
                                    {playlists.map((playlist) => (
                                        <button
                                            key={playlist.playlistId}
                                            onClick={() =>
                                                handleAddToPlaylist(
                                                    playlist.playlistId
                                                )
                                            }
                                            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <div className="font-medium">
                                                {playlist.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {playlist.videos.length} videos
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setShowAddToPlaylist(false);
                                    setAddVideosErrorMessage(""); // Clear error when cancel
                                }}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4">
                        <div className="relative">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 font-medium text-center">
                            Loading your playlists...
                        </p>
                    </div>
                )}

                {/* Empty Playlist State (Clickable) */}
                {!loading && !hasVideos && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4">
                        <div
                            onClick={() => navigate("/search")}
                            className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 md:p-12 max-w-md w-full text-center cursor-pointer transition-transform hover:scale-[1.02]"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <ListVideo className="size-8 sm:size-10 text-purple-600" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                                No Playlists Yet
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Start organizing your videos into playlists. Tap
                                anywhere to explore and add videos!
                            </p>
                        </div>
                    </div>
                )}

                {/* No Search Results State */}
                {!loading && hasVideos && !hasResults && (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[50vh] px-4">
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 md:p-12 max-w-md w-full text-center">
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
                                className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-gray-800 hover:scale-110 duration-200 ease-in-out transition-all w-auto"
                            >
                                Clear Search
                            </button>
                        </div>
                    </div>
                )}

                {/* My Playlists Section */}
                {!loading && user && playlists.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            My Playlists
                        </h2>
                        <div className="space-y-8">
                            {playlists.map((playlist) => (
                                <div
                                    key={playlist.playlistId}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                                >
                                    {/* Playlist Header */}
                                    <div className="flex items-center justify-between gap-2 mb-4">
                                        {editingPlaylistId ===
                                        playlist.playlistId ? (
                                            <div className="flex flex-col">
                                                <input
                                                    type="text"
                                                    value={editingPlaylistName}
                                                    onChange={(e) => {
                                                        setEditingPlaylistName(
                                                            e.target.value
                                                        );
                                                    }}
                                                    onKeyPress={(e) =>
                                                        e.key === "Enter" &&
                                                        handleRenamePlaylist(
                                                            playlist.playlistId
                                                        )
                                                    }
                                                    className="max-sm:max-w-40 text-xl font-bold px-2 py-1 border border-purple-500 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    autoFocus
                                                />
                                                {renameErrorMessage && (
                                                    <p className="text-red-600 text-sm mt-1">
                                                        {renameErrorMessage}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {playlist.name}
                                                </h3>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                    {playlist.videos.length}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            {editingPlaylistId ===
                                            playlist.playlistId ? (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleRenamePlaylist(
                                                                playlist.playlistId
                                                            )
                                                        }
                                                        className="cursor-pointer p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Save"
                                                    >
                                                        <Check className="size-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingPlaylistId(
                                                                null
                                                            );
                                                            setEditingPlaylistName(
                                                                ""
                                                            );
                                                            setRenameErrorMessage(
                                                                ""
                                                            );
                                                        }}
                                                        className="cursor-pointer p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="size-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditingPlaylistId(
                                                                playlist.playlistId
                                                            );
                                                            setEditingPlaylistName(
                                                                playlist.name
                                                            );
                                                        }}
                                                        className="cursor-pointer p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Rename"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeletePlaylist(
                                                                playlist.playlistId
                                                            )
                                                        }
                                                        className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Playlist Videos */}
                                    {playlist.videos.length > 0 ? (
                                        <SavedVideoList
                                            videoList={playlist.videos}
                                            gridClassName={gridColumnsClass}
                                            highlightFunc={(text) =>
                                                highlightMatch(
                                                    text,
                                                    searchQuery
                                                )
                                            }
                                            playlists={playlists}
                                            onPlaylistRemove={(videoId) =>
                                                handleRemoveFromPlaylist(
                                                    playlist.playlistId,
                                                    videoId
                                                )
                                            }
                                        />
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No videos in this playlist yet
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grouped Videos (Original Categories) */}
                {!loading && user && hasResults && (
                    <div className="space-y-10">
                        <h2 className="text-2xl font-bold text-gray-900">
                            All Videos
                        </h2>
                        {Object.entries(groupedVideos).map(
                            ([category, vids]) => (
                                <div key={category} className="animate-fadeIn">
                                    {/* Category Header */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {category}
                                            </h3>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {vids.length}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-1 w-20 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full"></div>
                                    </div>

                                    {/* Videos Grid */}
                                    {selectionMode ? (
                                        <div
                                            className={`grid ${gridColumnsClass} gap-3.5`}
                                        >
                                            {vids.map((video) => (
                                                <li
                                                    key={video.videoId}
                                                    onClick={() =>
                                                        toggleVideoSelection(
                                                            video.videoId
                                                        )
                                                    }
                                                    className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                                                        selectedVideos.has(
                                                            video.videoId
                                                        )
                                                            ? "border-purple-500 ring-2 ring-purple-300"
                                                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                                    }`}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="relative w-full aspect-video overflow-hidden bg-gray-100">
                                                        {video.thumbnailUrl && (
                                                            <img
                                                                src={
                                                                    video.thumbnailUrl
                                                                }
                                                                alt={
                                                                    video.title ||
                                                                    "Video thumbnail"
                                                                }
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        )}

                                                        {/* Circular tick icon overlay (only when selected) */}
                                                        {selectedVideos.has(
                                                            video.videoId
                                                        ) && (
                                                            <div className="absolute top-3 right-3 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                                                <svg
                                                                    className="w-5 h-5 text-white"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Video info */}
                                                    <div className="p-4">
                                                        <h3 className="line-clamp-2 truncate text-xs font-semibold md:text-sm">
                                                            {highlightMatch
                                                                ? highlightMatch(
                                                                      video.title,
                                                                      searchQuery
                                                                  )
                                                                : video.title}
                                                        </h3>
                                                        <p className="mt-1 truncate text-[10px] text-slate-600">
                                                            {highlightMatch
                                                                ? highlightMatch(
                                                                      video.channelTitle,
                                                                      searchQuery
                                                                  )
                                                                : video.channelTitle}
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                        </div>
                                    ) : (
                                        <SavedVideoList
                                            videoList={vids}
                                            gridClassName={gridColumnsClass}
                                            highlightFunc={(text) =>
                                                highlightMatch(
                                                    text,
                                                    searchQuery
                                                )
                                            }
                                            playlists={playlists}
                                            onRemoveSuccess={handleVideoRemoved}
                                        />
                                    )}
                                </div>
                            )
                        )}

                        {/* Delete Playlist Modal */}
                        {showConfirmDelete && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                                <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-xl">
                                    <h3 className="text-xl font-bold mb-3 text-gray-900">
                                        Delete Playlist?
                                    </h3>
                                    <p className="text-gray-600 mb-6 text-sm">
                                        This action cannot be undone. Are you
                                        sure you want to delete this playlist?
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        <button
                                            onClick={cancelDelete}
                                            className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmDelete}
                                            className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Yes, Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPlaylistView;
