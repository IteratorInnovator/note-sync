import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import SavedEllipsisButton from "./SavedEllipsisButton";

const SavedVideoCard = ({
    videoId,
    thumbnail,
    title,
    channelTitle,
    open, // boolean: controlled by parent
    onOpenChange, // (boolean) => void
    onRemove,
    onAddToPlaylist,
}) => (
    <li className="relative">
        <Link
            to={`/watch/${videoId}`}
            state={{
                video: { videoId, thumbnailUrl: thumbnail, title, channelTitle },
            }}
            className="block overflow-hidden rounded-xl border border-slate-200 bg-white cursor-pointer group hover:shadow-lg hover:scale-105 transition-all duration-300"
        >
            <div className="relative aspect-video bg-slate-100">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={title || "Video thumbnail"}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                    />
                ) : null}

                <div className="pointer-events-none absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="rounded-full bg-red-500/90 p-4">
                        <Play
                            aria-hidden
                            className="h-6 w-6 text-white fill-current"
                        />
                    </div>
                </div>
            </div>

            <SavedEllipsisButton
                open={open}
                onOpenChange={onOpenChange}
                onRemove={() => onRemove(videoId)}
                onAddToPlaylist={() => onAddToPlaylist(videoId)}
            />

            <div className="p-4">
                <h3 className="text-xs md:text-sm font-semibold line-clamp-2 truncate">
                    {title}
                </h3>
                <p className="text-[10px] text-slate-600 mt-1 truncate">
                    {channelTitle}
                </p>
            </div>
        </Link>
    </li>
);

export default SavedVideoCard;
