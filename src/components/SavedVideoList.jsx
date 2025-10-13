import SavedVideoCard from "./ui/SavedVideoCard";

const SavedVideoList = ({ videoList }) => {
    return (
        <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {videoList.map((v) => (
                <SavedVideoCard
                    key={v.videoId}
                    videoId={v.videoId}
                    thumbnail={v.thumbnailUrl}
                    title={v.title}
                    channelTitle={v.channelTitle}
                />
            ))}
        </ul>
    );
};

export default SavedVideoList;
