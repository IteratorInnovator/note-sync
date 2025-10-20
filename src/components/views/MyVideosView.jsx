import { useState, useEffect, useMemo } from "react";
import SavedVideoList from "../SavedVideoList";
import { getVideosByUserId } from "../../services/utils/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../..";
import { ChevronDown, Grid2x2, Grid3x3, Rows } from "lucide-react";


const MyVideosView = () => {
    const [videoList, setVideoList] = useState([]);
    const [sortOption, setSortOption] = useState("addedAtDesc");
    const [isCondensedLayout, setIsCondensedLayout] = useState(false);
    const [isMdUp, setIsMdUp] = useState(false);

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

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(min-width: 768px)");
        const handleChange = (event) => setIsMdUp(event.matches);

        setIsMdUp(mediaQuery.matches);
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange);
        } else {
            mediaQuery.addListener(handleChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener("change", handleChange);
            } else {
                mediaQuery.removeListener(handleChange);
            }
        };
    }, []);

    // Sort videos based on selected option (newest, oldest, title)
    const sortedVideos = useMemo(() => {
        if (!videoList || videoList.length === 0) return [];

        const sorted = [...videoList];
        switch (sortOption) {
            case "addedAtAsc":
                sorted.sort(
                    (a, b) => (a.addedAt?.seconds) - (b.addedAt?.seconds)
                );
                break;
            case "addedAtDesc":
                sorted.sort(
                    (a, b) => (b.addedAt?.seconds) - (a.addedAt?.seconds)
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

    const hasVideos = sortedVideos.length > 0;
    const gridColumnsClass = isCondensedLayout
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
        : "grid-cols-2 md:grid-cols-3 lg:grid-cols-3";
    const layoutOptions = isMdUp
        ? [
              { condensed: true, label: "Show 2 columns", Icon: Grid2x2 },
              { condensed: false, label: "Show 3 columns", Icon: Grid3x3 },
          ]
        : [
              { condensed: true, label: "Show 1 column", Icon: Rows },
              { condensed: false, label: "Show 2 columns", Icon: Grid2x2 },
          ];

    return (
        <div className="rounded-lg p-4 bg-gray-50 min-h-screen">
            {hasVideos ? (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        {layoutOptions.map(({ condensed, label, Icon }, index) => {
                            const active = condensed === isCondensedLayout;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    aria-label={label}
                                    aria-pressed={active}
                                    onClick={() => setIsCondensedLayout(condensed)}
                                    className={`flex h-9 w-9 items-center justify-center text-slate-400 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 ${
                                        active ? "bg-slate-100 text-slate-700" : ""
                                    } ${index > 0 ? "border-l border-slate-200" : ""}`}
                                >
                                    <Icon className="h-4 w-4" />
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor="sort-select"
                            className="hidden text-sm font-medium text-slate-500 md:block"
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
                </div>
            ) : (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center md:text-lg text-slate-500/60">
                        Your library is empty. Add a video.
                    </div>
                </div>
            )}
            <SavedVideoList
                videoList={sortedVideos}
                gridClassName={gridColumnsClass}
                onRemoveSuccess={(removedId) =>
                    setVideoList((prev) =>
                        prev.filter((video) => video.videoId !== removedId)
                    )
                }
            />
        </div>
    );
};

export default MyVideosView;
