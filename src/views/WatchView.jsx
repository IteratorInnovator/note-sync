import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth } from "..";
import NoteSection from "../components/ui/NoteSection";
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
    const [manualControlsVisible, setManualControlsVisible] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const PLAYBACK_RATES = [0.25, 0.5, 1, 1.25, 1.5, 1.75, 2];
    const [playbackRateIndex, setPlaybackRateIndex] = useState(
        PLAYBACK_RATES.indexOf(1)
    );
    const playbackRate = PLAYBACK_RATES[playbackRateIndex] ?? PLAYBACK_RATES[0];

    const playerRef = useRef(null);
    const playerInstanceRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const lastVolumeRef = useRef(100);
    const videoContainerRef = useRef(null);
    const hideControlsTimeoutRef = useRef(null);
    const manualControlsTimeoutRef = useRef(null);
    const skipNextClickRef = useRef(false);
    const isTouchDeviceRef = useRef(false);

    const shouldInterceptOverlay = useMemo(
        () =>
            isTouchDevice &&
            ((isFullscreen && !controlsVisible) ||
                (!isFullscreen && !manualControlsVisible)),
        [isTouchDevice, isFullscreen, controlsVisible, manualControlsVisible]
    );

    const clearHideControlsTimeout = useCallback(() => {
        if (hideControlsTimeoutRef.current) {
            window.clearTimeout(hideControlsTimeoutRef.current);
            hideControlsTimeoutRef.current = null;
        }
    }, []);

    const clearManualControlsTimeout = useCallback(() => {
        if (manualControlsTimeoutRef.current) {
            window.clearTimeout(manualControlsTimeoutRef.current);
            manualControlsTimeoutRef.current = null;
        }
    }, []);

    const showManualControls = useCallback(() => {
        if (typeof window === "undefined") return;
        clearManualControlsTimeout();
        setManualControlsVisible(true);
        manualControlsTimeoutRef.current = window.setTimeout(() => {
            setManualControlsVisible(false);
            manualControlsTimeoutRef.current = null;
        }, 3000);
    }, [clearManualControlsTimeout]);

    const showFullscreenControls = useCallback(() => {
        if (!isFullscreen) return;
        setControlsVisible(true);
        clearHideControlsTimeout();
        hideControlsTimeoutRef.current = window.setTimeout(() => {
            setControlsVisible(false);
            hideControlsTimeoutRef.current = null;
        }, 3000);
    }, [clearHideControlsTimeout, isFullscreen]);

    const refreshManualControls = useCallback(() => {
        if (isTouchDevice && !isFullscreen) {
            showManualControls();
        }
    }, [isTouchDevice, isFullscreen, showManualControls]);

    useEffect(() => {
        if (!isPlayerReady) return;
        playerInstanceRef.current?.setPlaybackRate?.(playbackRate);
    }, [playbackRate, isPlayerReady]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const touchCapable =
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;
        setIsTouchDevice(touchCapable);
    }, []);

    useEffect(() => {
        isTouchDeviceRef.current = isTouchDevice;
    }, [isTouchDevice]);

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
                    enablejsapi: 0,
                },
                events: {
                    onReady: (event) => {
                        if (cancelled) return;
                        setIsPlayerReady(true);
                        const player = event.target;
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
                            setManualControlsVisible(false);
                            clearManualControlsTimeout();
                            startProgressTracking();
                        } else if (
                            state === window.YT.PlayerState.PAUSED ||
                            state === window.YT.PlayerState.ENDED
                        ) {
                            setIsPlaying(false);
                            if (
                                state === window.YT.PlayerState.PAUSED &&
                                isTouchDeviceRef.current
                            ) {
                                showManualControls();
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
    }, [
        videoId,
        startProgressTracking,
        stopProgressTracking,
        clearManualControlsTimeout,
        showManualControls,
    ]);

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
            clearManualControlsTimeout();
        },
        [clearHideControlsTimeout, clearManualControlsTimeout]
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
        refreshManualControls();
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
        refreshManualControls();
        player.seekTo(nextTime, true);
        setCurrentTime(nextTime);
    };

    const seekBy = (offsetSeconds) => {
        const player = playerInstanceRef.current;
        if (!player || !isPlayerReady) return;
        const totalDuration =
            player.getDuration?.() ?? duration ?? Number.MAX_SAFE_INTEGER;
        const target = Math.min(
            Math.max(
                0,
                (player.getCurrentTime?.() ?? currentTime) + offsetSeconds
            ),
            totalDuration
        );
        refreshManualControls();
        player.seekTo(target, true);
        setCurrentTime(target);
    };

    const handleSeekBackward = () => seekBy(-10);
    const handleSeekForward = () => seekBy(10);
    const handleCyclePlaybackRate = () => {
        if (!isPlayerReady) return;
        const nextIndex = (playbackRateIndex + 1) % PLAYBACK_RATES.length;
        const nextRate = PLAYBACK_RATES[nextIndex];
        setPlaybackRateIndex(nextIndex);
        refreshManualControls();
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
        refreshManualControls();
    };

    const handleToggleMute = () => {
        const player = playerInstanceRef.current;
        if (!player || !isPlayerReady) return;
        refreshManualControls();
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
        refreshManualControls();

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

    const handleTouchIntent = useCallback(
        (forceTouchDevice = false) => {
            if (!isPlayerReady) return false;
            if (forceTouchDevice && !isTouchDevice) {
                setIsTouchDevice(true);
                isTouchDeviceRef.current = true;
            }

            if (!shouldInterceptOverlay) {
                return false;
            }

            let handled = false;

            if (!isFullscreen && !manualControlsVisible) {
                showManualControls();
                handled = true;
            } else if (isFullscreen && !controlsVisible) {
                showFullscreenControls();
                handled = true;
            } else if (!isFullscreen) {
                refreshManualControls();
            }

            return handled;
        },
        [
            controlsVisible,
            isFullscreen,
            isPlayerReady,
            isTouchDevice,
            manualControlsVisible,
            refreshManualControls,
            showFullscreenControls,
            showManualControls,
            shouldInterceptOverlay,
        ]
    );

    const handleOverlayPointerDown = useCallback(
        (event) => {
            skipNextClickRef.current = false;
            if (event.pointerType === "touch" || event.pointerType === "pen") {
                const handled = handleTouchIntent(true);
                skipNextClickRef.current = handled;
                if (handled) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        },
        [handleTouchIntent]
    );

    const handleOverlayTouchStart = useCallback(
        (event) => {
            skipNextClickRef.current = false;
            const handled = handleTouchIntent(true);
            skipNextClickRef.current = handled;
            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        [handleTouchIntent]
    );

    const handleVideoClick = () => {
        if (!isPlayerReady) return;
        if (skipNextClickRef.current) {
            skipNextClickRef.current = false;
            return;
        }
        if (isTouchDevice && shouldInterceptOverlay) {
            if (!isFullscreen && !manualControlsVisible) {
                showManualControls();
                return;
            }
            if (isFullscreen && !controlsVisible) {
                showFullscreenControls();
                return;
            }
        }
        if (isFullscreen) showFullscreenControls();
        handleTogglePlay();
    };

    const inlineControlsVisibilityClass = manualControlsVisible
        ? "pointer-events-auto opacity-100"
        : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100";

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
                    className={`relative w-full ${
                        isFullscreen ? "h-full" : "aspect-video"
                    }`}
                    role="presentation"
                >
                    <div
                        className={`absolute inset-0 z-10 ${
                            shouldInterceptOverlay
                                ? "pointer-events-auto cursor-pointer"
                                : "pointer-events-none"
                        }`}
                        onPointerDown={handleOverlayPointerDown}
                        onTouchStart={handleOverlayTouchStart}
                        onClick={handleVideoClick}
                        aria-hidden="true"
                    />
                    <div
                        ref={playerRef}
                        className="absolute inset-0 h-full w-full"
                    />
                </div>

                <div
                    className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/60 via-black/40 to-transparent px-3 pb-3 pt-6 transition-opacity duration-200 sm:px-6 sm:pb-5 ${
                        isFullscreen
                            ? controlsVisible
                                ? "pointer-events-auto opacity-100"
                                : "pointer-events-none opacity-0"
                            : inlineControlsVisibilityClass
                    }`}
                    onClick={(event) => {
                        refreshManualControls();
                        event.stopPropagation();
                    }}
                    onMouseDown={(event) => {
                        refreshManualControls();
                        event.stopPropagation();
                    }}
                    onTouchStart={(event) => {
                        refreshManualControls();
                        event.stopPropagation();
                    }}
                    onPointerDown={(event) => {
                        refreshManualControls();
                        event.stopPropagation();
                    }}
                >
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-2 text-[10px] font-medium text-white/80 sm:text-xs">
                            <span className="tabular-nums">
                                {formatTime(currentTime)}
                            </span>
                            <input
                                type="range"
                                min={0}
                                max={duration || 0}
                                step={0.5}
                                value={
                                    Number.isFinite(currentTime)
                                        ? currentTime
                                        : 0
                                }
                                onChange={handleSeek}
                                className="w-full accent-indigo-500"
                                disabled={!isPlayerReady}
                            />
                            <span className="tabular-nums">
                                {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-row gap-1.5 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={handleTogglePlay}
                                    className="flex w-6 h-6 md:w-9 md:h-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                    disabled={!isPlayerReady}
                                >
                                    {isPlaying ? (
                                        <Pause className="size-3 md:size-5" />
                                    ) : (
                                        <Play className="size-3 md:size-5" />
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSeekBackward}
                                    className="flex w-6 h-6 md:w-9 md:h-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Seek backward 10 seconds"
                                    disabled={!isPlayerReady}
                                >
                                    <SkipBack className="size-3 md:size-5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSeekForward}
                                    className="flex w-6 h-6 md:w-9 md:h-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Seek forward 10 seconds"
                                    disabled={!isPlayerReady}
                                >
                                    <SkipForward className="size-3 md:size-5" />
                                </button>

                                <div className="flex items-center gap-2 sm:w-auto sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={handleToggleMute}
                                        className="flex w-6 h-6 md:w-9 md:h-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label={
                                            volume === 0 ? "Unmute" : "Mute"
                                        }
                                        disabled={!isPlayerReady}
                                    >
                                        {volume === 0 ? (
                                            <VolumeX className="size-3 md:size-5" />
                                        ) : (
                                            <Volume2 className="size-3 md:size-5" />
                                        )}
                                    </button>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={1}
                                        value={volume}
                                        onChange={handleVolume}
                                        className="w-16 md:w-32 flex-1 accent-indigo-500"
                                        disabled={!isPlayerReady}
                                    />
                                </div>
                            </div>

                            <div className="order-6 flex items-center justify-between gap-2 sm:order-none sm:w-auto sm:gap-3 sm:ml-auto">
                                <button
                                    type="button"
                                    onClick={handleCyclePlaybackRate}
                                    className="flex h-6 md:h-9 min-w-[2rem] md:min-w-[2.75rem] items-center justify-center rounded-full bg-white/15 text-[8px] md:text-xs font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Change playback speed"
                                    disabled={!isPlayerReady}
                                >
                                    {`${playbackRate}x`}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleToggleFullscreen}
                                    className="flex w-6 h-6 md:w-9 md:h-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                                    aria-label={
                                        isFullscreen
                                            ? "Exit fullscreen"
                                            : "Enter fullscreen"
                                    }
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="size-3 md:size-5" />
                                    ) : (
                                        <Maximize2 className="size-3 md:size-5" />
                                    )}
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
                {video?.channelTitle ? (
                    <p className="text-sm text-slate-500">
                        {video.channelTitle}
                    </p>
                ) : null}
            </div>
            
            <NoteSection videoId={videoId} playerRef={playerInstanceRef} />

        </div>
    );
};

export default WatchView;