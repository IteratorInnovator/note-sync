import { useState, useCallback } from "react";
import SavedVideoCard from "./ui/SavedVideoCard";
import { ToastContainer } from "./ui/Toast";
import { removeVideo } from "../services/utils/firestore";
import { auth } from "..";
import { CircleCheck, CircleX } from "lucide-react";
import { Button } from "./ui/button";


let toastId = 0;

// Small confirm dialog component (inline for simplicity)
const ConfirmDialog = ({ open, message, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-sm text-center space-y-4">
                <p className="text-gray-800 font-medium">{message}</p>
                <div className="flex justify-center gap-4">
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        className="px-4"
                    >
                        Yes
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        className="px-4"
                    >
                        No
                    </Button>
                </div>
            </div>
        </div>
    );
};

const SavedVideoList = ({ videoList, onRemoveSuccess }) => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [confirmingId, setConfirmingId] = useState(null);

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
            } catch {
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
        console.log("add to playlist", videoId);
        setOpenMenuId(null);
    }, []);

    // When user clicks delete → open confirmation
    const handleRemoveRequest = (videoId) => {
        setConfirmingId(videoId);
    };

    const confirmRemove = async () => {
        const videoId = confirmingId;
        setConfirmingId(null);
        await handleRemove(videoId);
    };

    const cancelRemove = () => setConfirmingId(null);

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
                        onRemove={() => handleRemoveRequest(v.videoId)}
                        onAddToPlaylist={handleAddToPlaylist}
                    />
                ))}
            </ul>

            {/* Confirmation dialog */}
            <ConfirmDialog
                open={!!confirmingId}
                message="Are you sure you want to delete this video?"
                onConfirm={confirmRemove}
                onCancel={cancelRemove}
            />

            {/* Toast notifications */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default SavedVideoList;
