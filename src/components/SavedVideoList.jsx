
import { useState } from "react";
import SavedVideoCard from "./ui/SavedVideoCard";

const SavedVideoList = ({ videoList }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    return (
        <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {videoList.map((v, index) => (
                <li
                    key={v.videoId}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`
                        transition-all duration-300
                        ${hoveredIndex === index ? "scale-105 brightness-110 shadow-xl" : ""}
                        ${hoveredIndex !== null && hoveredIndex !== index ? "opacity-50" : ""}
                    `}
                >
                    <SavedVideoCard
                        videoId={v.videoId}
                        thumbnail={v.thumbnailUrl}
                        title={v.title}
                        channelTitle={v.channelTitle}
                    />
                </li>
            ))}
        </ul>
    );
};

export default SavedVideoList;

