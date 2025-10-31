import { useState, useCallback } from "react";
import VideoCard from "../components/ui/VideoCard";
import { addVideo } from "../utils/firestore";
import { auth } from "..";
import { VideoAlreadySavedError } from "../utils/errors";
import { CircleCheck, CircleX, BadgeCheck } from "lucide-react";
import { useToasts } from "../stores/useToasts";

const VideoList = ({
    videoList,
    gridClassName = "grid-cols-2 md:grid-cols-3 lg:grid-cols-3",
}) => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const { addToast } = useToasts();

    const handleOpenChange = useCallback(
        (id, isOpen) => setOpenMenuId(isOpen ? id : null),
        []
    );

    const handleSave = useCallback(
        async (videoId, title, channelTitle, thumbnail) => {
            try {
                const uid = auth.currentUser.uid;
                await addVideo(uid, videoId, title, channelTitle, thumbnail);
                addToast({
                    message: "Added to My Videos",
                    Icon: CircleCheck,
                    iconColour: "text-emerald-400",
                });
            } catch (error) {
                if (error instanceof VideoAlreadySavedError) {
                    addToast({
                        message: "Video already in My Videos",
                        Icon: BadgeCheck,
                        iconColour: "text-emerald-400",
                    });
                } else {
                    addToast({
                        message: "Failed to add video",
                        Icon: CircleX,
                        iconColour: "text-red-400",
                    });
                }
            } finally {
                setOpenMenuId(null);
            }
        },
        [addToast]
    );

    return (
        <>
            <ul className={`grid ${gridClassName} gap-4`}>
                {videoList.map((v) => (
                    <VideoCard
                        key={v.videoId}
                        videoId={v.videoId}
                        thumbnailUrl={v.thumbnailUrl}
                        title={v.title}
                        channelTitle={v.channelTitle}
                        open={openMenuId === v.videoId}
                        onOpenChange={(isOpen) =>
                            handleOpenChange(v.videoId, isOpen)
                        }
                        onSave={() =>
                            handleSave(
                                v.videoId,
                                v.title,
                                v.channelTitle,
                                v.thumbnailUrl
                            )
                        }
                    />
                ))}
            </ul>
        </>
    );
};

export default VideoList;
