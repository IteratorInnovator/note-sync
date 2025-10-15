import { useState, useEffect } from "react";
import SavedVideoList from "../SavedVideoList";
import { getVideosByUserId } from "../../services/utils/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../..";

const MyVideosView = () => {
    const [videoList, setVideoList] = useState([]);

    useEffect(() => {
        let active = true;
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                if (active) setVideoList([]);
                return;
            }
            const list = await getVideosByUserId(user.uid);
            if (active) setVideoList(list);
        });

        return () => {
            active = false;
            unsub();
        };
    }, []);

    return videoList.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
            <div className="text-center text-xl text-slate-500/60">
                Your library is empty. Add a video.
            </div>
        </div>
    ) : (
        <SavedVideoList videoList={videoList} />
    );
};

export default MyVideosView;
