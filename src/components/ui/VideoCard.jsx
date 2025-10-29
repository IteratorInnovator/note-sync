import { Play, X } from "lucide-react";
import PlusButton from "./PlusButton";

const VideoCard = ({
  videoId,
  thumbnail,
  title,
  channelTitle,
  onSave,
  onAddToPlaylist,
  onRemove, 
}) => {
  const href = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <li className="relative group">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
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
            <div className="rounded-full bg-red-500/90 p-4">
              <Play aria-hidden className="h-6 w-6 text-white fill-current" />
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
            <PlusButton
              onSave={() => onSave(videoId, title, channelTitle, thumbnail)}
              onAddToPlaylist={() => onAddToPlaylist(videoId)}
            />
          </div>

          {onRemove && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(videoId);
              }}
              className="
                absolute left-2 top-2 z-20
                opacity-100 scale-100
                transition-all duration-300 ease-out
                sm:opacity-0 sm:scale-95 group-hover:opacity-100 group-hover:scale-100
                rounded-full p-1.5 bg-black/50 text-white hover:bg-black/70
              "
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 truncate text-xs font-semibold md:text-sm">
            {title}
          </h3>
          <p className="mt-1 truncate text-[10px] text-slate-600">
            {channelTitle}
          </p>
        </div>
      </a>
    </li>
  );
};

export default VideoCard;
