const YOUTUBE_API_KEY = import.meta.env.VITE_APP_YOUTUBE_API_KEY;
const YOUTUBE_API_ENDPOINT = import.meta.env.VITE_APP_YOUTUBE_API_ENDPOINT;

const searchVideos = async (searchTerm, { signal }) => {
    const params = new URLSearchParams({
        part: "snippet",
        type: "video",
        q: String(searchTerm),
        maxResults: "30",
        key: YOUTUBE_API_KEY,
    });

    const url = `${YOUTUBE_API_ENDPOINT}/search?${params.toString()}`;

    const result = await fetch(url, { signal });

    if (!result.ok) {
        return [];
    }

    const body = await result.json();

    const items = body.items || [];
    return items.map((item) => ({
        videoId: item.id?.videoId ?? null,
        title: item.snippet?.title ?? "",
        description: item.snippet?.description ?? "",
        channelTitle: item.snippet?.channelTitle ?? "",
        publishedAt: item.snippet?.publishedAt ?? "",
        thumbnail: item.snippet?.thumbnails?.medium?.url ?? null,
    }));
};

export default searchVideos;