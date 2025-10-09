import VideoCard from "./ui/VideoCard";

const VideoList = ({ videoList }) => {
    return (
        <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {videoList.map((v) => (
                <VideoCard
                    key={v.videoId}
                    videoId={v.videoId}
                    thumbnail={v.thumbnail}
                    title={v.title}
                    channelTitle={v.channelTitle}
                />
            ))}
        </ul>
    );
};

export default VideoList;
