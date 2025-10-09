import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { VideoCard } from "./VideoCard";

export const VideoList = ({ uid }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      if (!uid) return; // wait for uid to be available
      setLoading(true);

      const videosRef = collection(db, "videos");

      // Query: get only videos for this user
      const q = query(
        videosRef,
        where("uid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setVideos(results);
      setLoading(false);
    }

    fetchVideos();
  }, [uid]);

  if (loading) {
    return <p className="p-6 text-muted-foreground">Loading videos...</p>;
  }

  if (videos.length === 0) {
    return <p className="p-6 text-muted-foreground">No videos found for this user.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          title={video.title}
          thumbnail={video.thumbnail}
          duration={video.duration}
          createdAt={new Date(video.createdAt).toLocaleDateString()}
        />
      ))}
    </div>
  );
};
