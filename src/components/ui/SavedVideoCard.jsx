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
  highlightFunc, // optional: (text) => JSX with highlights
}) => {
  return (
    <li className="relative group">
      <div className="relative">
        {/* Video Navigation */}
        <Link
          to={`/watch/${videoId}`}
          state={{ video: { videoId, thumbnailUrl: thumbnail, title, channelTitle } }}
          className="block overflow-hidden rounded-xl border border-slate-200 bg-white group-hover:shadow-lg"
        >
          <div className="relative aspect-video bg-slate-100">
            <img
              src={thumbnail}
              alt={title || "Video thumbnail"}
              loading="lazy"
              decoding="async"
              onError={(e) => { e.currentTarget.src = "/fallback-thumbnail.png"; }}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-4">
            <h3>{highlightFunc ? highlightFunc(title) : title}</h3>
            <p>{highlightFunc ? highlightFunc(channelTitle) : channelTitle}</p>
          </div>
        </Link>
      </div>

      {/* Ellipsis Button */}
      <SavedEllipsisButton
        open={open}
        onOpenChange={onOpenChange}
        onRemove={() => onRemove(videoId)}
        onAddToPlaylist={() => onAddToPlaylist(videoId)}
      />
    </li>
  );
};

export default SavedVideoCard;

