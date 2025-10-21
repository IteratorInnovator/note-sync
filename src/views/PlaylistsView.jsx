import { useEffect, useState, useMemo } from "react";
import { getVideosByUserId } from "../utils/firestore";
import { getAuth } from "firebase/auth";
import { Button } from "../components/ui/button";
import GridControls from "../components/ui/ViewControls";

const MyPlaylistView = () => {
    const [videos, setVideos] = useState([]);
    const [hoveredVideo, setHoveredVideo] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("recent");
    const [isCondensedLayout, setIsCondensedLayout] = useState(false);

    const auth = getAuth();

    // Fetch saved videos for logged-in user
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

    // Show message if user not logged in
    if (!auth.currentUser) {
        return (
            <p className="p-6 text-center text-gray-600">
                Please log in to see your playlist.
            </p>
        );
    }

    // Filter videos by search query
    const filteredVideos = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return videos.filter(
            (v) =>
                v.title.toLowerCase().includes(q) ||
                v.channelTitle.toLowerCase().includes(q)
        );
    }, [videos, searchQuery]);

    // Sort videos safely
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

    // Highlight search matches
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

    // Determine grid column classes based on toggle
    const gridColumnsClass = isCondensedLayout
        ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
        : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

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
            />

            {/* No results */}
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
                        <ul className={`grid gap-6 ${gridColumnsClass}`}>
                            {vids.map((v) => (
                                <li
                                    key={v.videoId}
                                    onMouseEnter={() =>
                                        setHoveredVideo(v.videoId)
                                    }
                                    onMouseLeave={() => setHoveredVideo(null)}
                                    className={`bg-white shadow-md rounded-lg overflow-hidden flex flex-col transition-transform duration-200 ${
                                        hoveredVideo &&
                                        hoveredVideo !== v.videoId
                                            ? "opacity-50"
                                            : "opacity-100"
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
                                                window.open(
                                                    `https://www.youtube.com/watch?v=${v.videoId}`,
                                                    "_blank"
                                                )
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
        </div>
    );
};

export default MyPlaylistView;
