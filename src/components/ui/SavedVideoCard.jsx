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
    <li className="relative group">
        <Link
            to={`/watch/${videoId}`}
            state={{
                video: { videoId, thumbnailUrl: thumbnail, title, channelTitle },
            }}
            className="block transform overflow-hidden rounded-xl border border-slate-200 bg-white cursor-pointer transition-transform duration-300 ease-out group-hover:shadow-lg group-hover:scale-[1.02] hover:shadow-lg hover:scale-[1.02]"
        >
            <div className="relative aspect-video bg-slate-100">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={title || "Video thumbnail"}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                    />
                ) : null}

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full bg-red-500/90 p-4">
                        <Play
                            aria-hidden
                            className="h-6 w-6 text-white fill-current"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4">
                <h3 className="line-clamp-2 truncate text-xs font-semibold md:text-sm">
                    {title}
                </h3>
                <p className="mt-1 truncate text-[10px] text-slate-600">
                    {channelTitle}
                </p>
            </div>
        </Link>
        <SavedEllipsisButton
            open={open}
            onOpenChange={onOpenChange}
            onRemove={() => onRemove(videoId)}
            onAddToPlaylist={() => onAddToPlaylist(videoId)}
        />
    </li>
);

export default SavedVideoCard;
