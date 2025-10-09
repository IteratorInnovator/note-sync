import { Play } from "lucide-react";

const VideoCard = ({
    videoId,
    thumbnail,
    title,
    channelTitle,
    // duration, // e.g. "12:34" (optional)
}) => {
    const href = `https://www.youtube.com/watch?v=${videoId}`;

    return (
        <li>
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                    if (!videoId) e.preventDefault();
                }}
                className="block overflow-hidden rounded-xl border border-slate-200 bg-white hover:shadow-lg transition-shadow cursor-pointer group"
            >
                {/* Media */}
                <div className="relative aspect-video bg-slate-100">
                    {thumbnail ? (
                        <img
                            src={thumbnail}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : null}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="rounded-full bg-red-500/90 p-4">
                            <Play className="h-6 w-6 text-white fill-current" />
                        </div>
                    </div>

                    {/* Duration badge */}
                    {/* {duration ? (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            {duration}
                        </div>
                    ) : null} */}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="font-semibold truncate line-clamp-2">{title}</h3>
                    <p className="text-xs text-slate-600 mt-1">
                        {channelTitle}
                    </p>
                </div>
            </a>
        </li>
    );
};

export default VideoCard;
