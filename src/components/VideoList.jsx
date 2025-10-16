import { useState, useCallback } from "react";
import VideoCard from "./ui/VideoCard";
import { addVideo } from "../services/utils/firestore";
import { auth } from "..";
import { ToastContainer } from "./ui/toast"; 


let toastId = 0;

const VideoList = ({ videoList }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const handleOpenChange = useCallback(
    (id, isOpen) => setOpenMenuId(isOpen ? id : null),
    []
  );

  const addToast = (message, duration = 3000) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSave = useCallback(
    async (videoId, title, channelTitle, thumbnail) => {
      try {
        const uid = auth.currentUser.uid;
        await addVideo(uid, videoId, title, channelTitle, thumbnail);
        addToast(`"${title}" has been added to your saved videos!`);
      } catch (error) {
        console.error(error);
        addToast("Failed to save video. Please try again.");
      } finally {
        setOpenMenuId(null);
      }
    },
    []
  );

  const handleAddToPlaylist = useCallback((videoId) => {
    console.log("add to playlist", videoId);
    setOpenMenuId(null);
  }, []);

  return (
    <>
      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {videoList.map((v) => (
          <VideoCard
            key={v.videoId}
            videoId={v.videoId}
            thumbnail={v.thumbnail}
            title={v.title}
            channelTitle={v.channelTitle}
            open={openMenuId === v.videoId}
            onOpenChange={(isOpen) => handleOpenChange(v.videoId, isOpen)}
            onSave={() =>
              handleSave(v.videoId, v.title, v.channelTitle, v.thumbnail)
            }
            onAddToPlaylist={() => handleAddToPlaylist(v.videoId)}
          />
        ))}
      </ul>

      {/* Render toast container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default VideoList;
