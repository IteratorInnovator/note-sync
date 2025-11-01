import { useState, useCallback } from "react";
import SavedVideoCard from "../components/ui/SavedVideoCard";
import { removeVideo, hasNotes, addVideosToPlaylist } from "../utils/firestore";
import { auth } from "..";
import { CircleCheck, CircleX } from "lucide-react";
import { Button } from "./ui/button";
import { useToasts } from "../stores/useToasts";

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
                        {playlists.map((p) => {
                            const playlistId = p.id ?? p.playlistId;
                            return (
                                <li key={playlistId}>
                                    <Button
                                        className="w-full justify-start"
                                        variant="outline"
                                        onClick={() => onSelect(playlistId)}
                                    >
                                        {p.name}
                                    </Button>
                                </li>
                            );
                        })}
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
    playlists = [], // pass from parent if available
    onRemoveSuccess,
    gridClassName = "grid-cols-2 md:grid-cols-3 lg:grid-cols-3",
    highlightFunc,
    onPlaylistRemove,
}) => {
    const [confirmingId, setConfirmingId] = useState(null);
    const [selectedVideos, setSelectedVideos] = useState(new Set());
    const [playlistDialogVideo, setPlaylistDialogVideo] = useState(null);
    const isPlaylistMode = typeof onPlaylistRemove === "function";
    const { addToast } = useToasts();

    const clearSelectionForVideo = useCallback((videoId) => {
        setSelectedVideos((prev) => {
            if (!prev.has(videoId)) return prev;
            const next = new Set(prev);
            next.delete(videoId);
            return next;
        });
    }, []);

    const handleRemove = useCallback(
        async (videoId) => {
            if (isPlaylistMode) {
                try {
                    await onPlaylistRemove(videoId);
                    addToast({
                        message: `Removed from playlist`,
                        Icon: CircleCheck,
                        iconColour: "text-emerald-400",
                    });
                    onRemoveSuccess?.(videoId);
                    clearSelectionForVideo(videoId);
                } catch {
                    addToast({
                        message: `Failed to remove from playlist`,
                        Icon: CircleX,
                        iconColour: "text-red-400",
                    });
                }
                return;
            }

            try {
                const uid = auth.currentUser.uid;
                const ok = await removeVideo(uid, videoId);
                if (!ok) throw new Error();
                addToast({
                    message: `Removed from My Videos`,
                    Icon: CircleCheck,
                    iconColour: "text-emerald-400",
                });
                onRemoveSuccess?.(videoId);
                clearSelectionForVideo(videoId);
            } catch {
                addToast({
                    message: `Failed to remove video`,
                    Icon: CircleX,
                    iconColour: "text-red-400",
                });
            }
        },
        [
            clearSelectionForVideo,
            isPlaylistMode,
            onPlaylistRemove,
            onRemoveSuccess,
            addToast,
        ]
    );

    const handleRemoveRequest = useCallback(
        async (videoId) => {
            if (isPlaylistMode) {
                await handleRemove(videoId);
                return;
            }
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
        [handleRemove, isPlaylistMode]
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

    const handlePlaylistSelect = async (playlistId) => {
        try {
            const uid = auth.currentUser.uid;
            await addVideosToPlaylist(uid, playlistId, [playlistDialogVideo]);
            addToast({
                message: `Added to playlist`,
                Icon: CircleCheck,
                iconColour: "text-emerald-400",
            });
        } catch {
            addToast({
                message: `Failed to add to playlist`,
                Icon: CircleX,
                iconColour: "text-red-400",
            });
        } finally {
            setPlaylistDialogVideo(null);
        }
    };

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
                        removeLabel={
                            isPlaylistMode ? "Remove from playlist" : undefined
                        }
                    />
                ))}
            </ul>

            <ConfirmDialog
                open={!!confirmingId}
                onConfirm={confirmRemove}
                onCancel={cancelRemove}
            />

            <PlaylistSelectDialog
                open={!!playlistDialogVideo}
                playlists={playlists}
                onSelect={handlePlaylistSelect}
                onCancel={() => setPlaylistDialogVideo(null)}
            />
        </>
    );
};

export default SavedVideoList;
