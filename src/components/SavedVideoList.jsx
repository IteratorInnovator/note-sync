import { useState, useCallback } from "react";
import SavedVideoCard from "./ui/SavedVideoCard";
import { ToastContainer } from "./ui/Toast";
import { removeVideo } from "../services/utils/firestore";
import { auth } from "..";
import { CircleCheck, CircleX } from "lucide-react";

let toastId = 0;

const SavedVideoList = ({ videoList, onRemoveSuccess }) => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const [toasts, setToasts] = useState([]);

    const handleOpenChange = useCallback(
        (id, isOpen) => setOpenMenuId(isOpen ? id : null),
        []
    );

    const addToast = (
        message,
        Icon = null,
        iconColour = "",
        duration = 3000
    ) => {
        const id = toastId++;
        setToasts((prev) => [
            ...prev,
            { id, message, Icon, iconColour, duration },
        ]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const handleRemove = useCallback(
        async (videoId) => {
            try {
                const uid = auth.currentUser.uid;
                const ok = await removeVideo(uid, videoId);
                if (!ok) throw new Error();
                addToast(
                    `Removed from My Videos`,
                    CircleCheck,
                    "text-emerald-400"
                );
                onRemoveSuccess?.(videoId);
            } catch (err) {
                console.log(err);
                addToast(
                    `Failed to remove from My Videos`,
                    CircleX,
                    "text-red-400"
                );
            } finally {
                setOpenMenuId(null);
            }
        },
        [onRemoveSuccess]
    );

    const handleAddToPlaylist = useCallback((videoId) => {
        // TODO: add-to-playlist logic
        console.log("add to playlist", videoId);
        setOpenMenuId(null);
    }, []);
    return (
        <>
            <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {videoList.map((v) => (
                    <SavedVideoCard
                        key={v.videoId}
                        videoId={v.videoId}
                        thumbnail={v.thumbnailUrl}
                        title={v.title}
                        channelTitle={v.channelTitle}
                        open={openMenuId === v.videoId}
                        onOpenChange={(isOpen) =>
                            handleOpenChange(v.videoId, isOpen)
                        }
                        onRemove={handleRemove}
                        onAddToPlaylist={handleAddToPlaylist}
                    />
                ))}
            </ul>

            {/* Render toast container */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default SavedVideoList;
