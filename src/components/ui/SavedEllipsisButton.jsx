import { useEffect, useRef } from "react";
import { MoreVertical, Delete, ListPlus } from "lucide-react";

const SavedEllipsisButton = ({
    open,
    onOpenChange,
    onRemove,
    onAddToPlaylist,
}) => {
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
            className="absolute right-2 top-2 z-20 sm:right-3 sm:top-3"
            onMouseEnter={cancelClose}
        >
            <button
                type="button"
                aria-label="More options"
                aria-haspopup="menu"
                aria-expanded={open}
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenChange(!open);
                }}
                className={`rounded-full p-1.5 text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                    open
                        ? "bg-black/80 opacity-100"
                        : "bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/70"
                }`}
            >
                <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Video actions"
                    className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-900 shadow-lg shadow-slate-900/10 sm:w-48 sm:p-2"
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={cancelClose}
                    onMouseLeave={() => {
                        cancelClose();
                        leaveTimer.current = setTimeout(
                            () => onOpenChange(false),
                            150
                        );
                    }}
                >
                    {[
                        {
                            key: "remove",
                            label: "Remove from List",
                            Icon: Delete,
                            handler: onRemove,
                        },
                        {
                            key: "playlist",
                            label: "Add to Playlist",
                            Icon: ListPlus,
                            handler: onAddToPlaylist,
                        },
                    ].map(({ key, label, Icon, handler }) => (
                        <button
                            key={key}
                            role="menuitem"
                            onClick={(e) => {
                                e.preventDefault();
                                onOpenChange(false);
                                handler();
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-slate-100 sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm"
                        >
                            <Icon className="h-3.5 w-3.5 text-slate-900 sm:h-4 sm:w-4" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedEllipsisButton;
