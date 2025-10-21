import { useState, useEffect, useMemo } from "react";
import SavedVideoList from "../components/SavedVideoList";
import { getVideosByUserId } from "../utils/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../";
import GridControls from "../components/ui/ViewControls";

const MyVideosView = () => {
    const [videoList, setVideoList] = useState([]);
    const [sortOption, setSortOption] = useState("recent");
    const [searchQuery, setSearchQuery] = useState("");
    const [isCondensedLayout, setIsCondensedLayout] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Fetch videos for the logged-in user
    useEffect(() => {
        let active = true;
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                if (active) setVideoList([]);
                return;
            }
            const list = await getVideosByUserId(user.uid);
            if (active) setVideoList(list);
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
                vids.sort(
                    (a, b) =>
                        (b.addedAt?.seconds || 0) - (a.addedAt?.seconds || 0)
                );
                break;
            case "earliest":
                vids.sort(
                    (a, b) =>
                        (a.addedAt?.seconds || 0) - (b.addedAt?.seconds || 0)
                );
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
            return vids.filter(
                (v) =>
                    v.title
                        .toLowerCase()
                        .includes(searchQuery.trim().toLowerCase()) ||
                    v.channelTitle
                        .toLowerCase()
                        .includes(searchQuery.trim().toLowerCase())
            );
        }

        return vids;
    }, [videoList, sortOption, searchQuery]);

    const hasVideosInLibrary = videoList.length > 0;
    const hasVideosAfterSearch = sortedVideos.length > 0;

    // Determine grid columns for layout
    const gridColumnsClass = isCondensedLayout
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
        : "grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

    // Reset handlers
    const confirmReset = () => {
        setSortOption("recent");
        setSearchQuery("");
        setShowResetConfirm(false);
    };
    const cancelReset = () => setShowResetConfirm(false);

    return (
        <div className="rounded-lg p-4 bg-gray-50 min-h-screen space-y-6">
            {/* Grid controls */}
            {hasVideosInLibrary && (
                <GridControls
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
                    placeholder="Search videos..."
                />
            )}

            {/* Empty library */}
            {!hasVideosInLibrary && (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center md:text-lg text-slate-500/60">
                        Your library is empty. Add a video.
                    </div>
                </div>
            )}

            {/* No results after search */}
            {hasVideosInLibrary && !hasVideosAfterSearch && (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center md:text-lg text-slate-500/60">
                        No videos found for "{searchQuery}".
                    </div>
                </div>
            )}

            {/* Video grid */}
            {hasVideosAfterSearch && (
                <SavedVideoList
                    videoList={sortedVideos}
                    gridClassName={gridColumnsClass}
                    onRemoveSuccess={(removedId) =>
                        setVideoList((prev) =>
                            prev.filter((video) => video.videoId !== removedId)
                        )
                    }
                />
            )}
        </div>
    );
};

export default MyVideosView;
