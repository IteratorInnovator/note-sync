import { useState, useMemo, useEffect } from "react";
import SavedVideoCard from "./ui/SavedVideoCard";
import { getVideosByUserId } from "../services/utils/firestore";
import { getAuth } from "firebase/auth";

const SavedVideoList = () => {
    const [videoList, setVideoList] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [sortOption, setSortOption] = useState("addedAtDesc");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            console.warn("User not signed in");
            setVideoList([]);
            setLoading(false);
            return;
        }

        const fetchVideos = async () => {
            try {
                const videos = await getVideosByUserId(user.uid);
                setVideoList(videos || []);
            } catch (error) {
                console.error("Error fetching videos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    // Sort videos based on selected option (newest, oldest, title)
    const sortedVideos = useMemo(() => {
        if (!videoList || videoList.length === 0) return [];

        const sorted = [...videoList];
        switch (sortOption) {
            case "addedAtAsc":
                sorted.sort(
                    (a, b) =>
                        (a.addedAt?.seconds || 0) - (b.addedAt?.seconds || 0)
                );
                break;
            case "addedAtDesc":
                sorted.sort(
                    (a, b) =>
                        (b.addedAt?.seconds || 0) - (a.addedAt?.seconds || 0)
                );
                break;
            case "titleAsc":
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "titleDesc":
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
            default:
                break;
        }
        return sorted;
    }, [videoList, sortOption]);

    if (loading) {
        return (
            <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center text-slate-600">
                Loading your saved videos...
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            {/* Sort dropdown */}
            <div className="flex justify-end mb-4">
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm hover:shadow-md transition"
                >
                    <option value="addedAtDesc">Newest First</option>
                    <option value="addedAtAsc">Oldest First</option>
                    <option value="titleAsc">Title (A-Z)</option>
                    <option value="titleDesc">Title (Z-A)</option>
                </select>
            </div>

            {sortedVideos.length === 0 ? (
                <p className="text-slate-500">No saved videos yet.</p>
            ) : (
                <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedVideos.map((video) => (
                        <li key={video.videoId}>
                            <SavedVideoCard
                                videoId={video.videoId}
                                thumbnail={video.thumbnailUrl}
                                title={video.title}
                                channelTitle={video.channelTitle}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SavedVideoList;
