import { Link } from "react-router-dom";
import RemoveButton from "./RemoveButton";
import { Play } from "lucide-react";

const SavedVideoCard = ({
    videoId,
    thumbnail,
    title,
    channelTitle,
    onRemove,
    highlightFunc,
    removeLabel,
}) => {
    return (
        <li className="relative group">
            <Link
                to={`/watch/${videoId}`}
                state={{
                    video: {
                        videoId,
                        thumbnailUrl: thumbnail,
                        title,
                        channelTitle,
                    },
                }}
                className="block transform overflow-hidden rounded-xl border border-slate-200 bg-white cursor-pointer transition-transform duration-300 ease-out group-hover:shadow-lg group-hover:scale-[1.02] hover:shadow-lg hover:scale-[1.02]"
            >
                <div className="relative aspect-video bg-slate-100">
                    {thumbnail && (
                        <img
                            src={thumbnail}
                            alt={title || "Video thumbnail"}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                        />
                    )}

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
                        <div className="rounded-full bg-red-500/90 p-3 md:p-4">
                            <Play
                                aria-hidden
                                className="size-4 md:size-6 text-white fill-current"
                            />
                        </div>
                    </div>

                    <div
                        className="
              absolute right-2 top-2 z-20
              opacity-100 scale-100
              transition-all duration-300 ease-out
              sm:opacity-0 sm:scale-95 group-hover:opacity-100 group-hover:scale-100
            "
                    >
                        <RemoveButton
                            onRemove={() => onRemove(videoId)}
                            ariaLabel={removeLabel}
                        />
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="line-clamp-2 truncate text-xs font-semibold md:text-sm">
                        {highlightFunc ? highlightFunc(title) : title}
                    </h3>
                    <p className="mt-1 truncate text-[10px] text-slate-600">
                        {highlightFunc ? highlightFunc(channelTitle) : channelTitle}
                    </p>
                </div>
            </Link>
        </li>
    );
};

export default SavedVideoCard;
