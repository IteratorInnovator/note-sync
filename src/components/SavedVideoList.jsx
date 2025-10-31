import { useState, useCallback } from "react";
import SavedVideoCard from "../components/ui/SavedVideoCard";
import { ToastContainer } from "./ui/Toast";
import { removeVideo, hasNotes, addVideoToPlaylist, removeVideoFromPlaylist } from "../utils/firestore";
import { auth } from "..";
import { CircleCheck, CircleX } from "lucide-react";
import { Button } from "./ui/button";

let toastId = 0;

const ConfirmDialog = ({ open, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-sm text-center space-y-4">
                <p className="text-lg font-semibold text-red-600">
                    This video has notes attached to it.
                </p>
                <p className="text-sm text-gray-600">
                    Deleting will permanently remove the video and every note
                    linked to it. This cannot be undone.
                </p>
                <div className="flex justify-center gap-4 mt-4">
                    <Button variant="secondary" onClick={onCancel}>
                        No
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        Yes
                    </Button>
                </div>
            </div>
        </div>
    );
};

const PlaylistSelectDialog = ({ open, playlists, onSelect, onCancel }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-sm space-y-4">
                <h2 className="text-lg font-semibold">Add to Playlist</h2>
                {playlists.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        You don't have any playlists yet.
                    </p>
                ) : (
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {playlists.map((p) => (
                            <li key={p.id}>
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                    onClick={() => onSelect(p.id)}
                                >
                                    {p.name}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

const SavedVideoList = ({
    videoList,
    playlists = [],
    onRemoveSuccess,
    gridClassName = "grid-cols-2 md:grid-cols-3 lg:grid-cols-3",
    highlightFunc,
    showPlaylistRemove = false,
    playlistId = null,
    onPlaylistRemove = null,
}) => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [confirmingId, setConfirmingId] = useState(null);
    const [selectedVideos, setSelectedVideos] = useState(new Set());
    const [playlistDialogVideo, setPlaylistDialogVideo] = useState(null);

    const addToast = (message, Icon = null, iconColour = "", duration = 3000) => {
        const id = toastId++;
        setToasts((prev) => [...prev, { id, message, Icon, iconColour, duration }]);
    };
    const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    // --- remove video from "My Videos" (normal remove) ---
    const handleRemove = useCallback(
        async (videoId) => {
            try {
                const uid = auth.currentUser.uid;
                const ok = await removeVideo(uid, videoId);
                if (!ok) throw new Error();
                addToast(`Removed from My Videos`, CircleCheck, "text-emerald-400");
                onRemoveSuccess?.(videoId);
            } catch {
                addToast(`Failed to remove from My Videos`, CircleX, "text-red-400");
            } finally {
                setOpenMenuId(null);
            }
        },
        [onRemoveSuccess]
    );

    // --- request confirmation if notes exist ---
    const handleRemoveRequest = useCallback(
        async (videoId) => {
            setOpenMenuId(null);
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            try {
                const videoHasNotes = await hasNotes(uid, videoId);
                if (videoHasNotes) setConfirmingId(videoId);
                else await handleRemove(videoId);
            } catch {
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

    const toggleSelection = (videoId) => {
        const newSet = new Set(selectedVideos);
        if (newSet.has(videoId)) newSet.delete(videoId);
        else newSet.add(videoId);
        setSelectedVideos(newSet);
    };

    // --- add to playlist ---
    const handlePlaylistSelect = async (playlistId) => {
        try {
            const uid = auth.currentUser.uid;
            await addVideoToPlaylist(uid, playlistId, playlistDialogVideo);
            addToast("Added to playlist", CircleCheck, "text-emerald-400");
        } catch {
            addToast("Failed to add to playlist", CircleX, "text-red-400");
        } finally {
            setPlaylistDialogVideo(null);
        }
    };

    // --- remove from playlist ---
    const handlePlaylistRemoveClick = useCallback(
        async (videoId) => {
            try {
                const uid = auth.currentUser.uid;
                if (playlistId) {
                    await removeVideoFromPlaylist(uid, playlistId, videoId);
                }
                if (onPlaylistRemove) onPlaylistRemove(videoId);
                addToast("Removed from playlist", CircleCheck, "text-emerald-400");
            } catch {
                addToast("Failed to remove from playlist", CircleX, "text-red-400");
            }
        },
        [playlistId, onPlaylistRemove]
    );

    return (
        <>
            <ul className={`grid ${gridClassName} gap-4`}>
                {videoList.map((v) => (
                    <SavedVideoCard
                        key={v.videoId}
                        videoId={v.videoId}
                        thumbnail={v.thumbnailUrl}
                        title={v.title}
                        channelTitle={v.channelTitle}
                        highlightFunc={highlightFunc}
                        onRemove={() => handleRemoveRequest(v.videoId)}
                        isSelected={selectedVideos.has(v.videoId)}
                        onSelectToggle={toggleSelection}
                        showPlaylistRemove={showPlaylistRemove}
                        onPlaylistRemove={() => handlePlaylistRemoveClick(v.videoId)}
                    />
                ))}
            </ul>

            <ConfirmDialog open={!!confirmingId} onConfirm={confirmRemove} onCancel={cancelRemove} />
            <PlaylistSelectDialog
                open={!!playlistDialogVideo}
                playlists={playlists}
                onSelect={handlePlaylistSelect}
                onCancel={() => setPlaylistDialogVideo(null)}
            />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default SavedVideoList;
