import { useState, useCallback } from "react";
import VideoCard from "./ui/VideoCard";
import { addVideo } from "../services/utils/firestore";
import { auth } from "..";

const VideoList = ({ videoList }) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  const handleOpenChange = useCallback(
    (id, isOpen) => setOpenMenuId(isOpen ? id : null),
    []
  );

  const handleSave = useCallback(async (videoId, title, channelTitle, thumbnail) => {
    const uid = auth.currentUser.uid;
    await addVideo(uid, videoId, title, channelTitle, thumbnail);
    setOpenMenuId(null);
  }, []);

  const handleAddToPlaylist = useCallback((videoId) => {
    // TODO: add-to-playlist logic
    console.log("add to playlist", videoId);
    setOpenMenuId(null);
  }, []);

  return (
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
          onSave={handleSave}
          onAddToPlaylist={handleAddToPlaylist}
        />
      ))}
    </ul>
  );
};

export default VideoList;
