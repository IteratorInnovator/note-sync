import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth } from "..";
import { getVideoById } from "../utils/firestore";
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

    if (window.YT && window.YT.Player) {
        return Promise.resolve(window.YT);
    }

    if (youtubeApiPromise) {
        return youtubeApiPromise;
    }

    youtubeApiPromise = new Promise((resolve) => {
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            previous?.();
            resolve(window.YT);
        };

        if (
            !document.querySelector(
                "script[src='https://www.youtube.com/iframe_api']"
            )
        ) {
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

    const initialVideo = useMemo(
        () => location.state?.video ?? null,
        [location.state]
    );

    const [video, setVideo] = useState(initialVideo);
    const [loading, setLoading] = useState(!initialVideo);
    const [error, setError] = useState(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(false);
    const [centerCue, setCenterCue] = useState(null);
    const PLAYBACK_RATES = [0.25, 0.5, 1, 1.25, 1.5, 1.75, 2];
    const [playbackRateIndex, setPlaybackRateIndex] = useState(
        PLAYBACK_RATES.indexOf(1)
    );
    const playbackRate =
        PLAYBACK_RATES[playbackRateIndex] ?? PLAYBACK_RATES[0];

    const playerRef = useRef(null);
    const playerInstanceRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const lastVolumeRef = useRef(100);
    const videoContainerRef = useRef(null);
    const hideControlsTimeoutRef = useRef(null);
    const centerCueTimeoutRef = useRef(null);
    const skipCueActiveRef = useRef(false);
    const skipCueTimeoutRef = useRef(null);

    const clearHideControlsTimeout = useCallback(() => {
        if (hideControlsTimeoutRef.current) {
            window.clearTimeout(hideControlsTimeoutRef.current);
            hideControlsTimeoutRef.current = null;
        }
    }, []);

    const showFullscreenControls = useCallback(() => {
        if (!isFullscreen) return;
        setControlsVisible(true);
        clearHideControlsTimeout();
        hideControlsTimeoutRef.current = window.setTimeout(() => {
            setControlsVisible(false);
            hideControlsTimeoutRef.current = null;
        }, 3000);
    }, [clearHideControlsTimeout, isFullscreen]);

    const showCenterCue = useCallback((cue) => {
        if (!cue) return;
        setCenterCue(cue);
        if (centerCueTimeoutRef.current) {
            window.clearTimeout(centerCueTimeoutRef.current);
        }
        centerCueTimeoutRef.current = window.setTimeout(() => {
            setCenterCue(null);
            centerCueTimeoutRef.current = null;
        }, 450);
    }, []);

    useEffect(() => {
        if (!isPlayerReady) return;
        playerInstanceRef.current?.setPlaybackRate?.(playbackRate);
    }, [playbackRate, isPlayerReady]);

    useEffect(() => {
        if (!videoId) return;

        if (initialVideo) {
            setVideo(initialVideo);
            setLoading(false);
            setError(null);
            return;
        }

        const uid = auth.currentUser?.uid;
        if (!uid) {
            navigate("/videos", { replace: true });
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        const loadVideo = async () => {
            try {
                const fetched = await getVideoById(uid, videoId);
                if (cancelled) return;
                if (fetched) {
                    setVideo(fetched);
                } else {
                    setError("We couldn't find this saved video.");
                }
            } catch {
                if (!cancelled) {
                    setError("We couldn't load this video. Please try again.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadVideo();

        return () => {
            cancelled = true;
        };
    }, [videoId, initialVideo, navigate]);

    useEffect(() => {
        if (onTitleChange) onTitleChange("Watch");
    }, [onTitleChange]);

    const startProgressTracking = useCallback(() => {
        stopProgressTracking();
        progressIntervalRef.current = window.setInterval(() => {
            const player = playerInstanceRef.current;
            if (!player) return;
            setCurrentTime(player.getCurrentTime());
            const total = player.getDuration();
            if (Number.isFinite(total)) {
                setDuration(total);
            }
        }, 500);
    }, []);

    const stopProgressTracking = useCallback(() => {
        if (progressIntervalRef.current) {
            window.clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!videoId) return undefined;

        let cancelled = false;

        const setupPlayer = async () => {
            setIsPlayerReady(false);
            setIsPlaying(false);
            setDuration(0);
            setCurrentTime(0);

            const YT = await loadYouTubeIframeAPI();
            if (cancelled || !YT || !playerRef.current) return;

            if (playerInstanceRef.current) {
                playerInstanceRef.current.destroy();
                playerInstanceRef.current = null;
            }

            playerInstanceRef.current = new YT.Player(playerRef.current, {
                videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    rel: 0,
                    modestbranding: 1,
                    disablekb: 1,
                },
                events: {
                    onReady: (event) => {
                        if (cancelled) return;
                        setIsPlayerReady(true);
                        const player = event.target;
                        const iframe = player.getIframe?.();
                        if (iframe) {
                            iframe.style.pointerEvents = "none";
                        }
                        const initialDuration = player.getDuration();
                        setDuration(initialDuration);
                        const initialVolume = player.getVolume();
                        setVolume(initialVolume);
                        lastVolumeRef.current = initialVolume || 100;
                        player.setPlaybackRate?.(playbackRate);
                        startProgressTracking();
                    },
                    onStateChange: (event) => {
                        if (cancelled) return;
                        const state = event.data;
                        if (state === window.YT.PlayerState.PLAYING) {
                            setIsPlaying(true);
                            if (!skipCueActiveRef.current) {
                                showCenterCue("play");
                            }
                            startProgressTracking();
                        } else if (
                            state === window.YT.PlayerState.PAUSED ||
                            state === window.YT.PlayerState.ENDED
                        ) {
                            setIsPlaying(false);
                            if (state === window.YT.PlayerState.PAUSED) {
                                showCenterCue("pause");
                            }
                            if (state === window.YT.PlayerState.ENDED) {
                                setCurrentTime(
                                    playerInstanceRef.current?.getDuration() ??
                                        0
                                );
                            }
                            stopProgressTracking();
                        }
                    },
                },
            });
        };

        setupPlayer();

        return () => {
            cancelled = true;
            stopProgressTracking();
            if (playerInstanceRef.current) {
                playerInstanceRef.current.destroy();
                playerInstanceRef.current = null;
            }
        };
    }, [videoId, startProgressTracking, stopProgressTracking, showCenterCue]);

    useEffect(() => {
        const handler = () => {
            const fullscreenElement =
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement;
            setIsFullscreen(fullscreenElement === videoContainerRef.current);
        };

        document.addEventListener("fullscreenchange", handler);
        document.addEventListener("webkitfullscreenchange", handler);
        document.addEventListener("mozfullscreenchange", handler);
        document.addEventListener("MSFullscreenChange", handler);

        return () => {
            document.removeEventListener("fullscreenchange", handler);
            document.removeEventListener("webkitfullscreenchange", handler);
            document.removeEventListener("mozfullscreenchange", handler);
            document.removeEventListener("MSFullscreenChange", handler);
        };
    }, []);

    useEffect(() => {
        if (!isFullscreen) {
            setControlsVisible(false);
            clearHideControlsTimeout();
            return;
        }

        showFullscreenControls();

        return () => {
            clearHideControlsTimeout();
        };
    }, [isFullscreen, clearHideControlsTimeout, showFullscreenControls]);

    useEffect(() => {
        if (!isFullscreen) return undefined;

        const handleMouseMove = () => showFullscreenControls();

        window.addEventListener("mousemove", handleMouseMove, {
            passive: true,
        });

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [isFullscreen, showFullscreenControls]);

    useEffect(
        () => () => {
            clearHideControlsTimeout();
            if (centerCueTimeoutRef.current) {
                window.clearTimeout(centerCueTimeoutRef.current);
                centerCueTimeoutRef.current = null;
            }
            if (skipCueTimeoutRef.current) {
                window.clearTimeout(skipCueTimeoutRef.current);
                skipCueTimeoutRef.current = null;
            }
            skipCueActiveRef.current = false;
        },
        [clearHideControlsTimeout]
    );

    if (!videoId) return null;

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

    const handleTogglePlay = () => {
        const player = playerInstanceRef.current;
        if (!player || !isPlayerReady) return;
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    };

    const handleSeek = (event) => {
        const player = playerInstanceRef.current;
        if (!player || !isPlayerReady) return;
        const nextTime = Number(event.target.value);
        player.seekTo(nextTime, true);
        setCurrentTime(nextTime);
    };

    const seekBy = (offsetSeconds) => {
        const player = playerInstanceRef.current;
        if (!player || !isPlayerReady) return;
        const totalDuration =
            player.getDuration?.() ?? duration ?? Number.MAX_SAFE_INTEGER;
        const target = Math.min(
            Math.max(0, (player.getCurrentTime?.() ?? currentTime) + offsetSeconds),
            totalDuration
        );
        player.seekTo(target, true);
        setCurrentTime(target);
        showCenterCue(offsetSeconds > 0 ? "forward" : "backward");
        skipCueActiveRef.current = true;
        if (skipCueTimeoutRef.current) {
            window.clearTimeout(skipCueTimeoutRef.current);
        }
        skipCueTimeoutRef.current = window.setTimeout(() => {
            skipCueActiveRef.current = false;
            skipCueTimeoutRef.current = null;
        }, 400);
    };

    const handleSeekBackward = () => seekBy(-10);
    const handleSeekForward = () => seekBy(10);
    const handleCyclePlaybackRate = () => {
        if (!isPlayerReady) return;
        const nextIndex = (playbackRateIndex + 1) % PLAYBACK_RATES.length;
        const nextRate = PLAYBACK_RATES[nextIndex];
        setPlaybackRateIndex(nextIndex);
        playerInstanceRef.current?.setPlaybackRate?.(nextRate);
    };

    const handleVolume = (event) => {
        const player = playerInstanceRef.current;
        if (!player || !isPlayerReady) return;
        const nextVolume = Number(event.target.value);
        player.setVolume(nextVolume);
        setVolume(nextVolume);
        if (nextVolume > 0) {
            lastVolumeRef.current = nextVolume;
        }
    };

    const handleToggleMute = () => {
        const player = playerInstanceRef.current;
        if (!player || !isPlayerReady) return;
        if (volume === 0) {
            const restoreVolume = lastVolumeRef.current || 100;
            player.setVolume(restoreVolume);
            setVolume(restoreVolume);
        } else {
            lastVolumeRef.current = volume;
            player.setVolume(0);
            setVolume(0);
        }
    };

    const handleToggleFullscreen = () => {
        const container = videoContainerRef.current;
        if (!container) return;
        setControlsVisible(true);
        clearHideControlsTimeout();

        if (!isFullscreen) {
            const request =
                container.requestFullscreen ||
                container.webkitRequestFullscreen ||
                container.mozRequestFullScreen ||
                container.msRequestFullscreen;
            request?.call(container);
        } else {
            showFullscreenControls();
            const exit =
                document.exitFullscreen ||
                document.webkitExitFullscreen ||
                document.mozCancelFullScreen ||
                document.msExitFullscreen;
            exit?.call(document);
        }
    };

    const handleVideoClick = () => {
        if (!isPlayerReady) return;
        if (isFullscreen) showFullscreenControls();
        handleTogglePlay();
    };

    return (
        <div className="space-y-6">
            <div
                ref={videoContainerRef}
                className={`group relative overflow-hidden border border-slate-200 shadow-xl transition-[border-radius] ${
                    isFullscreen ? "h-full w-full rounded-none" : "rounded-2xl"
                }`}
                onMouseEnter={() => {
                    if (isFullscreen) showFullscreenControls();
                }}
                onMouseMove={() => {
                    if (isFullscreen) showFullscreenControls();
                }}
                onFocus={() => {
                    if (isFullscreen) showFullscreenControls();
                }}
                onBlur={(event) => {
                    if (
                        isFullscreen &&
                        !event.currentTarget.contains(event.relatedTarget)
                    ) {
                        showFullscreenControls();
                    }
                }}
            >
                <div
                    className={`relative w-full cursor-pointer ${
                        isFullscreen ? "h-full" : "aspect-video"
                    }`}
                    onClick={handleVideoClick}
                    role="presentation"
                >
                    <div
                        ref={playerRef}
                        className="absolute inset-0 h-full w-full"
                    />
                </div>

                <div
                    className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                        centerCue ? "opacity-100" : "opacity-0"
                    }`}
                >
                    <div
                        className={`flex h-20 w-20 items-center justify-center rounded-full bg-black/70 text-white shadow-lg ring-1 ring-white/30 transition-transform duration-300 ${
                            centerCue ? "scale-110" : "scale-90"
                        }`}
                    >
                        {centerCue === "pause" && <Pause className="h-10 w-10" />}
                        {centerCue === "play" && <Play className="h-10 w-10" />}
                        {centerCue === "forward" && (
                            <SkipForward className="h-10 w-10" />
                        )}
                        {centerCue === "backward" && (
                            <SkipBack className="h-10 w-10" />
                        )}
                    </div>
                </div>

                <div
                    className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent px-4 pb-4 pt-6 transition-opacity duration-200 ${
                        isFullscreen
                            ? controlsVisible
                                ? "pointer-events-auto opacity-100"
                                : "pointer-events-none opacity-0"
                            : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                    }`}
                >
                    <div className="flex flex-col gap-3">
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            step={0.5}
                            value={
                                Number.isFinite(currentTime) ? currentTime : 0
                            }
                            onChange={handleSeek}
                            className="w-full accent-indigo-500"
                            disabled={!isPlayerReady}
                        />

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleTogglePlay}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={isPlaying ? "Pause" : "Play"}
                                disabled={!isPlayerReady}
                            >
                                {isPlaying ? (
                                    <Pause className="h-5 w-5" />
                                ) : (
                                    <Play className="h-5 w-5" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleSeekBackward}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Seek backward 10 seconds"
                                disabled={!isPlayerReady}
                            >
                                <SkipBack className="h-5 w-5" />
                            </button>

                            <button
                                type="button"
                                onClick={handleSeekForward}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Seek forward 10 seconds"
                                disabled={!isPlayerReady}
                            >
                                <SkipForward className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleToggleMute}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label={
                                        volume === 0 ? "Unmute" : "Mute"
                                    }
                                    disabled={!isPlayerReady}
                                >
                                    {volume === 0 ? (
                                        <VolumeX className="h-5 w-5" />
                                    ) : (
                                        <Volume2 className="h-5 w-5" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={volume}
                                    onChange={handleVolume}
                                    className="w-24 accent-indigo-500"
                                    disabled={!isPlayerReady}
                                />
                            </div>

                            <div className="text-sm text-white/80">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>

                            <button
                                type="button"
                                onClick={handleCyclePlaybackRate}
                                className="ml-auto flex h-9 min-w-[3.25rem] items-center justify-center rounded-full bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Change playback speed"
                                disabled={!isPlayerReady}
                            >
                                {`${playbackRate}x`}
                            </button>

                            <button
                                type="button"
                                onClick={handleToggleFullscreen}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
                                aria-label={
                                    isFullscreen
                                        ? "Exit fullscreen"
                                        : "Enter fullscreen"
                                }
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-slate-900">
                    {video?.title || "YouTube Video"}
                </h1>
                {video?.channelTitle ? (
                    <p className="text-sm text-slate-500">
                        {video.channelTitle}
                    </p>
                ) : null}
            </div>
        </div>
    );
};

export default WatchView;
