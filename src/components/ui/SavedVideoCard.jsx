import { Link } from "react-router-dom";
import SavedEllipsisButton from "./RemoveButton";

const SavedVideoCard = ({
  videoId,
  thumbnail,
  title,
  channelTitle,
  open, 
  onOpenChange, 
  onRemove,
  onAddToPlaylist,
  highlightFunc,
}) => {
  return (
    <li className="relative group">
      <div className="relative">
        <Link
          to={`/watch/${videoId}`}
          state={{ video: { videoId, thumbnailUrl: thumbnail, title, channelTitle } }}
          className="block overflow-hidden rounded-xl border border-slate-200 bg-white group-hover:shadow-lg"
        >
          <div className="relative aspect-video bg-slate-100">
              <img
              src={thumbnail || "/fallback-thumbnail.png"}
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

