import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth } from "..";
import NoteSection from "../components/ui/NoteSection";
import { getVideoById, updateVideoProgress } from "../utils/firestore";
import {
    Maximize2,
    Minimize2,
    Pause,
    Play,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
} from "lucide-react";

let youtubeApiPromise = null;
const loadYouTubeIframeAPI = () => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    if (!document.querySelector("script[src='https://www.youtube.com/iframe_api']")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  return youtubeApiPromise;
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
};

const WatchView = ({ onTitleChange }) => {
  const { videoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid;

  const initialVideo = useMemo(() => location.state?.video ?? null, [location.state]);
  const [video, setVideo] = useState(initialVideo);
  const [loading, setLoading] = useState(!initialVideo);
  const [error, setError] = useState(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const lastSaveRef = useRef(Date.now());
  const videoContainerRef = useRef(null);

  const PLAYBACK_RATES = [0.25, 0.5, 1, 1.25, 1.5, 1.75, 2];
  const [playbackRateIndex, setPlaybackRateIndex] = useState(
    PLAYBACK_RATES.indexOf(1)
  );
  const playbackRate = PLAYBACK_RATES[playbackRateIndex];

  // Load video data
  useEffect(() => {
    if (!videoId || !uid) return;
    let cancelled = false;

    const fetchVideo = async () => {
      try {
        const v = await getVideoById(uid, videoId);
        if (!v) {
          setError("Video not found.");
          return;
        }
        if (!cancelled) {
          setVideo(v);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Error loading video.");
      }
    };

    if (!initialVideo) fetchVideo();

    return () => {
      cancelled = true;
    };
  }, [videoId, uid, initialVideo]);

  // 🔹 Initialize YouTube Player
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    const setupPlayer = async () => {
      const YT = await loadYouTubeIframeAPI();
      if (cancelled || !YT || !playerRef.current) return;

      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }

      playerInstanceRef.current = new YT.Player(playerRef.current, {
        videoId,
        playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, disablekb: 1 },
        events: {
          onReady: async (event) => {
            const player = event.target;
            setIsPlayerReady(true);
            const v = await getVideoById(uid, videoId);
            if (v?.progressSec) {
              player.seekTo(v.progressSec, true);
            }
            setDuration(player.getDuration());
            startProgressTracking();
          },
          onStateChange: (event) => {
            const player = playerInstanceRef.current;
            if (!player) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startProgressTracking();
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
              stopProgressTracking();
              saveProgress(player.getCurrentTime());
            }
          },
        },
      });
    };

    setupPlayer();

    return () => {
      cancelled = true;
      stopProgressTracking();
      playerInstanceRef.current?.destroy();
    };
  }, [videoId, uid]);

  // 🔹 Progress tracking + Firestore saving
  const startProgressTracking = useCallback(() => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      const player = playerInstanceRef.current;
      if (!player) return;
      const t = player.getCurrentTime();
      setCurrentTime(t);
      const now = Date.now();
      if (now - lastSaveRef.current > 5000 && uid) {
        saveProgress(t);
        lastSaveRef.current = now;
      }
    }, 1000);
  }, [uid]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const saveProgress = useCallback(
    async (time) => {
      if (!uid || !videoId || !Number.isFinite(time)) return;
      try {
        await updateVideoProgress(uid, videoId, time);
      } catch (e) {
        console.error("Error saving progress:", e);
      }
    },
    [uid, videoId]
  );

  // 🔹 Control handlers
  const handleTogglePlay = () => {
    const player = playerInstanceRef.current;
    if (!player || !isPlayerReady) return;
    isPlaying ? player.pauseVideo() : player.playVideo();
  };

  const handleSeek = (e) => {
    const player = playerInstanceRef.current;
    const next = Number(e.target.value);
    player.seekTo(next, true);
    setCurrentTime(next);
    saveProgress(next);
  };

  const handleSeekBackward = () => handleSeek({ target: { value: Math.max(0, currentTime - 10) } });
  const handleSeekForward = () => handleSeek({ target: { value: Math.min(duration, currentTime + 10) } });

  const handleToggleMute = () => {
    const player = playerInstanceRef.current;
    if (!player) return;
    const vol = player.getVolume();
    if (vol === 0) {
      player.setVolume(100);
      setVolume(100);
    } else {
      player.setVolume(0);
      setVolume(0);
    }
  };

  const handleVolume = (e) => {
    const v = Number(e.target.value);
    const player = playerInstanceRef.current;
    if (!player) return;
    player.setVolume(v);
    setVolume(v);
  };

  const handleCyclePlaybackRate = () => {
    const next = (playbackRateIndex + 1) % PLAYBACK_RATES.length;
    playerInstanceRef.current?.setPlaybackRate(PLAYBACK_RATES[next]);
    setPlaybackRateIndex(next);
  };

  const handleToggleFullscreen = () => {
    const container = videoContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // 🔹 Title
  useEffect(() => {
    if (onTitleChange) onTitleChange("Watch");
  }, [onTitleChange]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading video…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 rounded-xl border border-red-100 bg-red-50 p-6 text-center shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/videos")}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Back to My Videos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        ref={videoContainerRef}
        className={`group relative overflow-hidden border border-slate-200 shadow-xl ${
          isFullscreen ? "h-full w-full rounded-none" : "rounded-2xl"
        }`}
      >
        <div className={`relative w-full ${isFullscreen ? "h-full" : "aspect-video"}`}>
          <div ref={playerRef} className="absolute inset-0 h-full w-full" />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/60 via-black/40 to-transparent px-3 pb-3 pt-6 sm:px-6 sm:pb-5">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[10px] font-medium text-white/80 sm:text-xs">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.5}
                value={Number.isFinite(currentTime) ? currentTime : 0}
                onChange={handleSeek}
                className="w-full accent-indigo-500"
                disabled={!isPlayerReady}
              />
              <span>{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-row gap-1.5 sm:gap-3">
                <button onClick={handleTogglePlay} className="control-btn">
                  {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>
                <button onClick={handleSeekBackward} className="control-btn">
                  <SkipBack className="size-4" />
                </button>
                <button onClick={handleSeekForward} className="control-btn">
                  <SkipForward className="size-4" />
                </button>
                <button onClick={handleToggleMute} className="control-btn">
                  {volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={volume}
                  onChange={handleVolume}
                  className="w-16 md:w-32 accent-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={handleCyclePlaybackRate} className="control-btn text-xs">
                  {`${playbackRate}x`}
                </button>
                <button onClick={handleToggleFullscreen} className="control-btn">
                  {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          {video?.title || "YouTube Video"}
        </h1>
        {video?.channelTitle && (
          <p className="text-sm text-slate-500">{video.channelTitle}</p>
        )}
      </div>

      <NoteSection videoId={videoId} playerRef={playerInstanceRef} />
    </div>
  );
};

export default WatchView;
