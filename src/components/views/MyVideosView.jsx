import { useState, useEffect, useMemo } from "react";
import SavedVideoList from "../SavedVideoList";
import { getVideosByUserId } from "../../services/utils/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../..";
import { ChevronDown } from "lucide-react";

const MyVideosView = () => {
    const [videoList, setVideoList] = useState([]);
    const [sortOption, setSortOption] = useState("addedAtDesc");

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

    // Sort videos based on selected option (newest, oldest, title)
        const sortedVideos = useMemo(() => {
            if (!videoList || videoList.length === 0) return [];
    
            const sorted = [...videoList];
            switch (sortOption) {
                case "addedAtAsc":
                    sorted.sort(
                        (a, b) =>
                            (a.addedAt?.seconds) - (b.addedAt?.seconds)
                    );
                    break;
                case "addedAtDesc":
                    sorted.sort(
                        (a, b) =>
                            (b.addedAt?.seconds) - (a.addedAt?.seconds)
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

    return videoList.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
            <div className="text-center md:text-lg text-slate-500/60">
                Your library is empty. Add a video.
            </div>
        </div>
    ) : (
        <div className="rounded-lg p-4 bg-gray-50 min-h-screen">
            {/* Sort dropdown */}
            <div className="flex items-center justify-end mb-6">
                <label
                    htmlFor="sort-select"
                    className="mr-3 hidden text-sm font-medium text-slate-500 md:block"
                >
                    Sort By
                </label>
                <div className="relative inline-flex items-center">
                    <select
                        id="sort-select"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="appearance-none rounded-xl border border-slate-200 bg-white/95 pl-3 pr-10 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-transparent transition hover:shadow-md focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="addedAtDesc">Recently Added</option>
                        <option value="addedAtAsc">Earliest Added</option>
                        <option value="titleAsc">Title (A-Z)</option>
                        <option value="titleDesc">Title (Z-A)</option>

                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                        <ChevronDown />
                    </span>
                </div>
            </div>
            <SavedVideoList videoList={sortedVideos} />
        </div>
    );
};

export default MyVideosView;
