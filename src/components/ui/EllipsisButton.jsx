// EllipsisButton.jsx
import { useEffect, useRef } from "react";
import { MoreVertical, Save, ListPlus } from "lucide-react";

const EllipsisButton = ({ open, onOpenChange, onSave, onAddToPlaylist }) => {
  const rootRef = useRef(null);
  const leaveTimer = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) onOpenChange(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onOpenChange]);

  // Helper: cancel any scheduled close
  const cancelClose = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  return (
    <div
      ref={rootRef}
      className="absolute top-2 right-2 z-10"
      onMouseEnter={cancelClose}
      onMouseLeave={() => {
        // close after brief hover-out
        cancelClose();
        leaveTimer.current = setTimeout(() => onOpenChange(false), 150);
      }}
    >
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenChange(!open); }}
        className={`p-1 rounded-full text-white ${
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100 bg-transparent hover:bg-black/80"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Video actions"
          className="absolute right-0 mt-2 w-48 p-1 rounded-lg border border-slate-200 bg-white shadow-lg z-20"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={cancelClose}
          onMouseLeave={() => {
            cancelClose();
            leaveTimer.current = setTimeout(() => onOpenChange(false), 150);
          }}
        >
          {[
            { key: "save", label: "Save to My Videos", Icon: Save, handler: onSave },
            { key: "playlist", label: "Add to Playlist", Icon: ListPlus, handler: onAddToPlaylist },
          ].map(({ key, label, Icon, handler }) => (
            <button
              key={key}
              role="menuitem"
              onClick={(e) => { e.preventDefault(); onOpenChange(false); handler(); }}
              className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm hover:bg-gray-200"
            >
              <Icon className="h-4 w-4 text-slate-900" />
              <span className="text-slate-900 text-sm">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EllipsisButton;
