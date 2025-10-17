import SavedVideoCard from "./ui/SavedVideoCard";

const SavedVideoList = ({ videoList }) => {
    return (
        <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {videoList.map((video) => (
                <li key={video.videoId}>
                    <SavedVideoCard
                        videoId={video.videoId}
                        thumbnail={video.thumbnailUrl}
                        title={video.title}
                        channelTitle={video.channelTitle}
                    />
                </li>
            ))}
        </ul>
    );
};

export default SavedVideoList;
