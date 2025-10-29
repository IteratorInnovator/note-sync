import { useState, useCallback } from "react";
import SavedVideoCard from "../components/ui/SavedVideoCard";
import { ToastContainer } from "./ui/Toast";
import { removeVideo, hasNotes } from "../utils/firestore";
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
          Deleting will permanently remove the video and every note linked to it. 
          This cannot be undone.
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <Button variant="secondary" onClick={onCancel}>No</Button>
          <Button variant="destructive" onClick={onConfirm}>Yes</Button>
        </div>
      </div>
    </div>
  );
};

const SavedVideoList = ({
  videoList,
  onRemoveSuccess,
  gridClassName = "grid-cols-2 md:grid-cols-3 lg:grid-cols-3",
  highlightFunc,
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState(new Set());

  const handleOpenChange = useCallback(
    (id, isOpen) => setOpenMenuId(isOpen ? id : null),
    []
  );

  const addToast = (message, Icon = null, iconColour = "", duration = 3000) => {
    const id = toastId++;
    setToasts(prev => [...prev, { id, message, Icon, iconColour, duration }]);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleRemove = useCallback(async (videoId) => {
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
  }, [onRemoveSuccess]);

  const handleRemoveRequest = useCallback(async (videoId) => {
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
  }, [handleRemove]);

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

  // Safe thumbnail helper
  const getThumbnail = (video) => {
    return (
      video.thumbnailUrl ||
      video.thumbnail ||
      video.thumbnails?.default?.url ||
      "/fallback-thumbnail.png"
    );
  };

  return (
    <>
      <ul className={`grid ${gridClassName} gap-4`}>
        {videoList.map(v => (
          <SavedVideoCard
            key={v.videoId}
            videoId={v.videoId}
            thumbnail={getThumbnail(v)} // always safe
            title={v.title}
            channelTitle={v.channelTitle}
            highlightFunc={highlightFunc}
            open={openMenuId === v.videoId}
            onOpenChange={(isOpen) => handleOpenChange(v.videoId, isOpen)}
            onRemove={() => handleRemoveRequest(v.videoId)}
            onAddToPlaylist={() => console.log("Add to playlist", v.videoId)}
            isSelected={selectedVideos.has(v.videoId)} // pass selection state
            onSelectToggle={toggleSelection} // toggle selection
          />
        ))}
      </ul>

      <ConfirmDialog open={!!confirmingId} onConfirm={confirmRemove} onCancel={cancelRemove} />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default SavedVideoList;
