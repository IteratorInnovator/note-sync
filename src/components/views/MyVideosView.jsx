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
        <div>No results</div>
    ) : (
        <SavedVideoList videoList={videoList} />
    );
};

export default MyVideosView;
