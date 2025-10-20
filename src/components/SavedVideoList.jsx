import { useState, useCallback } from "react";
import SavedVideoCard from "./ui/SavedVideoCard";
import { ToastContainer } from "./ui/Toast";
import { removeVideo, hasNotes } from "../services/utils/firestore";
import { auth } from "..";
import { CircleCheck, CircleX } from "lucide-react";
import { Button } from "./ui/button";

let toastId = 0;

// Small confirm dialog component (inline for simplicity)
const ConfirmDialog = ({ open, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-sm text-center space-y-4">
                <div className="space-y-1">
                    <p className="text-lg font-semibold text-red-600">
                        This video has notes attached to it.
                    </p>
                    <p className="text-sm text-gray-600">
                        Deleting will permanently remove the video and every
                        note linked to it. This cannot be undone.
                    </p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                    >
                        No
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                    >
                        Yes
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

    // Ask for confirmation only when notes are present on the video
    const handleRemoveRequest = useCallback(
        async (videoId) => {
            setOpenMenuId(null);

            const uid = auth.currentUser?.uid;
            if (!uid) return;

            try {
                const videoHasNotes = await hasNotes(uid, videoId);
                if (videoHasNotes) {
                    setConfirmingId(videoId);
                } else {
                    await handleRemove(videoId);
                }
            } catch (error) {
                console.error(
                    "Failed to determine if notes exist before removal",
                    error
                );
                setConfirmingId(videoId);
            }
        },
        [handleRemove]
    );

    const confirmRemove = async () => {
        const videoId = confirmingId;
        setConfirmingId(null);
        if (!videoId) return;
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
                onConfirm={confirmRemove}
                onCancel={cancelRemove}
            />

            {/* Toast notifications */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default SavedVideoList;
