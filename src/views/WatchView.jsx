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

    // Save progress to Firestore (throttled)
    const saveProgressToFirestore = useCallback(() => {
        const uid = auth.currentUser?.uid;
        const player = playerInstanceRef.current;
        if (!uid || !player) return;
        const current = Math.floor(player.getCurrentTime?.() || 0);
        updateVideoProgress(uid, videoId, current);
    }, [videoId]);

    // Periodically save progress every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPlayerReady) saveProgressToFirestore();
        }, 10000);
        return () => clearInterval(interval);
    }, [isPlayerReady, saveProgressToFirestore]);

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
                    onReady: async (event) => {
                        if (cancelled) return;
                        setIsPlayerReady(true);
                        const player = event.target;
                        const initialDuration = player.getDuration();
                        setDuration(initialDuration);
                        const initialVolume = player.getVolume();
                        setVolume(initialVolume);
                        lastVolumeRef.current = initialVolume || 100;
                        player.setPlaybackRate?.(playbackRate);

                        // Load saved progress
                        const uid = auth.currentUser?.uid;
                        if (uid) {
                            try {
                                const saved = await getVideoById(uid, videoId);
                                if (saved?.progressSec && saved.progressSec > 0) {
                                    player.seekTo(saved.progressSec, true);
                                }
                            } catch (err) {
                                console.warn("Failed to load video progress:", err);
                            }
                        }

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

                            // Save progress on pause or end
                            const uid = auth.currentUser?.uid;
                            if (uid && playerInstanceRef.current) {
                                const pos = Math.floor(playerInstanceRef.current.getCurrentTime() || 0);
                                updateVideoProgress(uid, videoId, pos);
                            }

                            if (state === window.YT.PlayerState.ENDED) {
                                setCurrentTime(playerInstanceRef.current?.getDuration() ?? 0);
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

    // Save progress when user leaves page
    useEffect(() => {
        const handleBeforeUnload = () => {
            const uid = auth.currentUser?.uid;
            const player = playerInstanceRef.current;
            if (uid && player) {
                const current = Math.floor(player.getCurrentTime?.() || 0);
                updateVideoProgress(uid, videoId, current);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [videoId]);

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
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMouseMove);
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
            }
        },
        [handleTouchIntent]
    );

    const handleOverlayClick = useCallback(() => {
        if (skipNextClickRef.current) {
            skipNextClickRef.current = false;
            return;
        }

        if (isTouchDevice) {
            const handled = handleTouchIntent(false);
            if (handled) return;
        }

        handleTogglePlay();
    }, [handleTouchIntent, handleTogglePlay, isTouchDevice]);

    const showControls =
        isFullscreen && controlsVisible
            ? true
            : !isFullscreen && manualControlsVisible;

    return (
        <div className="max-w-5xl mx-auto">
            <div
                ref={videoContainerRef}
                className="relative aspect-video bg-black rounded-xl overflow-hidden group"
            >
                <div ref={playerRef} className="w-full h-full"></div>
                <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                        showControls ? "opacity-100" : "opacity-0"
                    }`}
                >
                    <div
                        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={handleTogglePlay}>
                                {isPlaying ? <Pause /> : <Play />}
                            </button>
                            <button onClick={handleSeekBackward}>
                                <SkipBack />
                            </button>
                            <button onClick={handleSeekForward}>
                                <SkipForward />
                            </button>
                            <button onClick={handleToggleMute}>
                                {volume === 0 ? <VolumeX /> : <Volume2 />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={handleVolume}
                            />
                            <button onClick={handleCyclePlaybackRate}>
                                {PLAYBACK_RATES[playbackRateIndex]}x
                            </button>
                            <button onClick={handleToggleFullscreen}>
                                {isFullscreen ? <Minimize2 /> : <Maximize2 />}
                            </button>
                            <span>
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={duration}
                            step="1"
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full"
                        />
                    </div>
                </div>
                <div
                    className="absolute inset-0 cursor-pointer"
                    onPointerDown={handleOverlayPointerDown}
                    onClick={handleOverlayClick}
                />
            </div>

            <div className="mt-4">
                <h1 className="text-lg font-semibold">{video?.title}</h1>
                <p className="text-sm text-slate-500">{video?.channelTitle}</p>
            </div>

            <NoteSection uid={auth.currentUser?.uid} videoId={videoId} />
        </div>
    );
};

export default WatchView;
