import { useEffect, useState, useMemo } from "react";
import { getVideosByUserId } from "../utils/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ViewControls from "../components/ui/ViewControls";
import SavedVideoList from "../components/SavedVideoList";
import { useNavigate } from "react-router-dom";

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

const MyPlaylistView = () => {
    const [videos, setVideos] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("recent");
    const [isCondensedLayout, setIsCondensedLayout] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const auth = getAuth();
    const navigate = useNavigate();

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
                return vids.sort(
                    (a, b) =>
                        (b.addedAt?.seconds || 0) - (a.addedAt?.seconds || 0)
                );
            case "earliest":
                return vids.sort(
                    (a, b) =>
                        (a.addedAt?.seconds || 0) - (b.addedAt?.seconds || 0)
                );
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

    // Determine grid columns for layout - optimized for mobile
    const gridColumnsClass = isCondensedLayout
        ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
        : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

    return (
        <div className="min-h-screen rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                {/* Header Section */}
                {!loading && hasVideos && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
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
                            {Object.keys(groupedVideos).length > 0 && (
                                <span className="text-sm text-gray-600">
                                    • {Object.keys(groupedVideos).length}{" "}
                                    {Object.keys(groupedVideos).length === 1
                                        ? "category"
                                        : "categories"}
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
                    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4 cursor-pointer transition-transform hover:scale-[1.02]">
                        <div
                            onClick={() => navigate("/search")}
                            className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 md:p-12 max-w-md w-full text-center"
                        >
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
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Start organizing your videos into playlists. Tap
                                anywhere to explore and add videos!
                            </p>
                        </div>
                    </div>
                )}

                {/* No Search Results State */}
                {!loading && user && hasVideos && !hasResults && (
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

                {/* Grouped Videos */}
                {!loading && user && hasResults && (
                    <div className="space-y-10">
                        {Object.entries(groupedVideos).map(
                            ([category, vids]) => (
                                <div key={category} className="animate-fadeIn">
                                    {/* Category Header */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                {category}
                                            </h2>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {vids.length}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-1 w-20 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full"></div>
                                    </div>

                                    {/* Videos Grid */}
                                    <SavedVideoList
                                        videoList={vids}
                                        gridClassName={gridColumnsClass}
                                        highlightFunc={(text) =>
                                            highlightMatch(text, searchQuery)
                                        }
                                        onRemoveSuccess={(removedId) =>
                                            setVideos((prev) =>
                                                prev.filter(
                                                    (video) =>
                                                        video.videoId !==
                                                        removedId
                                                )
                                            )
                                        }
                                    />
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPlaylistView;
