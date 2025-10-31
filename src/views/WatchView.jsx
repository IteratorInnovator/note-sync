import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth } from "..";
import NoteSection from "../components/ui/NoteSection";
import Editor from "../components/ui/Editor";
import { createNote, getVideoById } from "../utils/firestore";
import { hasMeaningfulText, sanitizeHtmlString } from "../utils/htmlHelpers";
import {
    CircleCheck,
    CircleX,
    Maximize2,
    Minimize2,
    Pause,
    Pencil,
    Play,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    X,
} from "lucide-react";
import { useToasts } from "../stores/useToasts";

let youtubeApiPromise = null;

const MAX_NOTE_LENGTH = 500;

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
    const [activeMarkerId, setActiveMarkerId] = useState(null);
    const [notes, setNotes] = useState([]);
    const [notesRefreshTrigger, setNotesRefreshTrigger] = useState(0);
    const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
    const [quickNoteContent, setQuickNoteContent] = useState("");
    const [quickNoteLength, setQuickNoteLength] = useState(0);
    const [quickNoteResetSignal, setQuickNoteResetSignal] = useState(0);
    const [quickNoteTimestamp, setQuickNoteTimestamp] = useState(0);
    const [isSavingQuickNote, setIsSavingQuickNote] = useState(false);
    const [quickNoteError, setQuickNoteError] = useState("");
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
    const { addToast } = useToasts();

    const shouldInterceptOverlay = useMemo(
        () =>
            isTouchDevice &&
            ((isFullscreen && !controlsVisible) ||
                (!isFullscreen && !manualControlsVisible)),
        [isTouchDevice, isFullscreen, controlsVisible, manualControlsVisible]
    );

    const handleNotesChange = useCallback((nextNotes) => {
        setNotes(Array.isArray(nextNotes) ? nextNotes : []);
    }, []);


    const handleOpenQuickNote = useCallback(() => {
        if (!isPlayerReady) return;

        const rawTime =
            playerInstanceRef.current?.getCurrentTime?.() ?? currentTime;
        const safeTime = Number.isFinite(rawTime) ? rawTime : 0;

        setQuickNoteTimestamp(safeTime);
        setQuickNoteContent("");
        setQuickNoteLength(0);
        setQuickNoteResetSignal((signal) => signal + 1);
        setQuickNoteError("");
        setIsQuickNoteOpen(true);
        playerInstanceRef.current?.pauseVideo?.();
    }, [currentTime, isPlayerReady]);

    const handleCloseQuickNote = useCallback(() => {
        setIsQuickNoteOpen(false);
        setQuickNoteError("");
        setQuickNoteContent("");
        setQuickNoteLength(0);
        playerInstanceRef.current?.playVideo?.();
    }, []);

    const handleQuickNoteChange = useCallback(
        ({ html, plainTextLength = 0 }) => {
            setQuickNoteContent(html);
            setQuickNoteLength(plainTextLength);
            if (quickNoteError) {
                setQuickNoteError("");
            }
        },
        [quickNoteError]
    );

    const handleQuickNoteBackdropClick = useCallback(
        (event) => {
            if (event.target === event.currentTarget) {
                handleCloseQuickNote();
            }
        },
        [handleCloseQuickNote]
    );

    const handleSaveQuickNote = useCallback(async () => {
        if (isSavingQuickNote) return;

        const uid = auth.currentUser?.uid;
        if (!uid) {
            setQuickNoteError("You need to sign in to save notes.");
            return;
        }

        const htmlContent = sanitizeHtmlString(quickNoteContent).trim();
        if (!hasMeaningfulText(htmlContent)) {
            setQuickNoteError("Add some note text before saving.");
            return;
        }

        const timestamp = Number.isFinite(quickNoteTimestamp)
            ? quickNoteTimestamp
            : 0;

        setIsSavingQuickNote(true);
        setQuickNoteError("");

        try {
            const noteId = await createNote(
                uid,
                videoId,
                htmlContent,
                timestamp
            );
            setNotes((prev) => [
                ...prev,
                { noteId, content: htmlContent, timeSec: timestamp },
            ]);
            setNotesRefreshTrigger((value) => value + 1);
            setIsQuickNoteOpen(false);
            setQuickNoteContent("");
            setQuickNoteLength(0);
            addToast({
                message: "Note saved",
                Icon: CircleCheck,
                iconColour: "text-emerald-400",
            })
        } catch {
            addToast({
                message: "Failed to save note",
                Icon: CircleX,
                iconColour: "text-red-400",
            })
        } finally {
            setIsSavingQuickNote(false);
            playerInstanceRef.current?.playVideo?.();
        }
    }, [
        isSavingQuickNote,
        quickNoteContent,
        quickNoteTimestamp,
        videoId,
        addToast,
        playerInstanceRef,
    ]);

    useEffect(() => {
        setNotes((prev) => (prev.length ? [] : prev));
        setNotesRefreshTrigger(0);
    }, [videoId]);

    useEffect(() => {
        if (!isQuickNoteOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                handleCloseQuickNote();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleCloseQuickNote, isQuickNoteOpen]);

    const EDGE_THRESHOLD_PERCENT = 15;
    const CENTER_THRESHOLD_PERCENT = 10;

    const noteMarkers = useMemo(() => {
        if (!Array.isArray(notes) || duration <= 0) return [];

        const sortedNotes = [...notes].filter((note) =>
            Number.isFinite(note?.timeSec)
        );

        sortedNotes.sort((a, b) => a.timeSec - b.timeSec);

        return sortedNotes.map((note, index) => {
            const safeTime = Math.max(0, note.timeSec ?? 0);
            const position = Math.min(
                100,
                Math.max(0, (safeTime / duration) * 100)
            );
            const anchor = (() => {
                if (position < EDGE_THRESHOLD_PERCENT) return "left";
                if (position > 100 - EDGE_THRESHOLD_PERCENT) return "right";
                if (Math.abs(position - 50) <= CENTER_THRESHOLD_PERCENT)
                    return "center";
                if (position < 50) return "center-left";
                return "center-right";
            })();

            return {
                id: note.noteId ?? `note-marker-${index}`,
                timeSec: safeTime,
                position,
                safeContent: sanitizeHtmlString(note.content ?? ""),
                anchor,
            };
        });
    }, [notes, duration]);

    const quickNoteSanitizedContent = useMemo(
        () => sanitizeHtmlString(quickNoteContent).trim(),
        [quickNoteContent]
    );

    const quickNoteCharactersRemaining = Math.max(
        0,
        MAX_NOTE_LENGTH - Math.min(quickNoteLength, MAX_NOTE_LENGTH)
    );

    const canSaveQuickNote =
        hasMeaningfulText(quickNoteSanitizedContent) && !isSavingQuickNote;

    const quickNoteDisplayTime = formatTime(quickNoteTimestamp ?? 0);

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

    const handleJumpToNote = (timeSec) => {
        const player = playerInstanceRef.current;
        if (!player || !isPlayerReady) return;
        const totalDuration =
            player.getDuration?.() ?? duration ?? Number.MAX_SAFE_INTEGER;
        const target = Math.min(Math.max(0, timeSec), totalDuration);
        refreshManualControls();
        player.seekTo(target, true);
        setCurrentTime(target);
        setActiveMarkerId(null);
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

    const handleMarkerEnter = useCallback((markerId) => {
        setActiveMarkerId(markerId);
    }, []);

    const handleMarkerLeave = useCallback(() => {
        setActiveMarkerId(null);
    }, []);

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
                            <span className="tabular-nums min-w-[2.5rem] text-center">
                                {formatTime(currentTime)}
                            </span>
                            <div className="relative flex-1">
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
                                {noteMarkers.length > 0 ? (
                                    <div className="pointer-events-none absolute inset-0 z-10">
                                        {noteMarkers.map((marker) => {
                                            const isActive =
                                                activeMarkerId === marker.id;
                                            const tooltipAlignmentBase =
                                                "left-1/2 -translate-x-1/2";
                                            const tooltipAlignmentClass =
                                                marker.anchor === "left"
                                                    ? `${tooltipAlignmentBase} items-start translate-x-[-5%]`
                                                    : marker.anchor ===
                                                      "center-left"
                                                    ? `${tooltipAlignmentBase} items-start -translate-x-[40%]`
                                                    : marker.anchor ===
                                                      "center-right"
                                                    ? `${tooltipAlignmentBase} items-end -translate-x-[60%]`
                                                    : marker.anchor === "right"
                                                    ? `${tooltipAlignmentBase} items-end -translate-x-[90%]`
                                                    : `${tooltipAlignmentBase} items-center`;
                                            return (
                                                <div
                                                    key={marker.id}
                                                    className="pointer-events-none absolute top-1/2 h-full"
                                                    style={{
                                                        left: `${marker.position}%`,
                                                    }}
                                                >
                                                    <div
                                                        className="pointer-events-auto relative flex h-full"
                                                        onPointerEnter={() =>
                                                            handleMarkerEnter(
                                                                marker.id
                                                            )
                                                        }
                                                        onPointerLeave={(event) => {
                                                            if (
                                                                !event.currentTarget.contains(
                                                                    event.relatedTarget
                                                                )
                                                            ) {
                                                                handleMarkerLeave();
                                                            }
                                                        }}
                                                        onFocusCapture={() =>
                                                            handleMarkerEnter(
                                                                marker.id
                                                            )
                                                        }
                                                        onBlurCapture={(event) => {
                                                            if (
                                                                !event.currentTarget.contains(
                                                                    event.relatedTarget
                                                                )
                                                            ) {
                                                                handleMarkerLeave();
                                                            }
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="relative flex h-3 w-[3px] md:h-4 md:w-[4px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-200 shadow-[0_0_8px_rgba(234,179,8,0.75)] ring-1 ring-yellow-500 transition hover:scale-110 focus-visible:scale-110 focus-visible:outline-none"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                handleJumpToNote(
                                                                    marker.timeSec
                                                                );
                                                            }}
                                                            onKeyDown={(event) => {
                                                                if (
                                                                    event.key ===
                                                                        "Enter" ||
                                                                    event.key ===
                                                                        " "
                                                                ) {
                                                                    event.preventDefault();
                                                                    handleJumpToNote(
                                                                        marker.timeSec
                                                                    );
                                                                }
                                                            }}
                                                            onFocus={() =>
                                                                handleMarkerEnter(
                                                                    marker.id
                                                                )
                                                            }
                                                            aria-label={`Jump to note at ${formatTime(
                                                                marker.timeSec
                                                            )}`}
                                                            aria-expanded={isActive}
                                                        />
                                                        {isActive ? (
                                                            <div
                                                                className={`pointer-events-auto absolute bottom-full mb-2 lg:mb-3 flex flex-col ${tooltipAlignmentClass}`}
                                                                style={{ transform: "translateY(-4px)" }}
                                                            >
                                                                <div className="w-[min(65vw,260px)] sm:w-[min(55vw,320px)] md:w-[min(45vw,380px)] rounded-lg border border-slate-200 bg-white/95 p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:max-w-[640px] xl:p-4 text-left text-[9px] sm:text-[9px] md:text-[10px] lg:text-[11px] xl:text-xs text-slate-600 shadow-2xl ring-1 ring-black/5 overflow-y-auto max-h-[35vh] sm:max-h-[40vh] md:max-h-[45vh] lg:max-h-[300px] xl:max-h-[340px]">
                                                                    <div className="mb-1 inline-flex items-center rounded-full bg-slate-900 px-1 py-0.5 text-[8px] font-semibold text-white shadow sm:mb-1.5 sm:px-1.5 sm:text-[9px] md:text-[10px] lg:mb-2 lg:px-2 lg:text-[10px] xl:text-[11px]">
                                                                        {formatTime(
                                                                            marker.timeSec
                                                                        )}
                                                                    </div>
                                                                    {marker.safeContent ? (
                                                                        <div
                                                                            className="note-marker-content whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[9px] leading-relaxed text-slate-700 sm:text-[9px] md:text-[10px] lg:text-[11px] xl:text-xs"
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: marker.safeContent,
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <p className="text-[9px] italic text-slate-400 sm:text-[9px] md:text-[10px] lg:text-[11px] xl:text-xs">
                                                                            No
                                                                            content
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                            <span className="tabular-nums min-w-[2.5rem] text-center">
                                {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-row gap-1.5 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={handleTogglePlay}
                                    title={isPlaying ? "Pause" : "Play"}
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
                                    title="Skip backward 10s"
                                    className="flex w-6 h-6 md:w-9 md:h-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Seek backward 10 seconds"
                                    disabled={!isPlayerReady}
                                >
                                    <SkipBack className="size-3 md:size-5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSeekForward}
                                    title="Skip forward 10s"
                                    className="flex w-6 h-6 md:w-9 md:h-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Seek forward 10 seconds"
                                    disabled={!isPlayerReady}
                                >
                                    <SkipForward className="size-3 md:size-5" />
                                </button>

                                <div className="flex items-center gap-2 sm:w-auto sm:gap-3">
                                    <button
                                        type="button"
                                        title="Volume"
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
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={handleOpenQuickNote}
                                        title="Add quick note"
                                        className="flex w-6 h-6 md:w-9 md:h-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label="Add quick note"
                                        disabled={!isPlayerReady}
                                    >
                                        <Pencil className="size-3 md:size-5" />
                                    </button>

                                    {isQuickNoteOpen && isFullscreen ? (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40 bg-black/30"
                                                onClick={
                                                    handleQuickNoteBackdropClick
                                                }
                                            />
                                            <div
                                                className="absolute bottom-full right-0 z-50 mb-3 w-[92vw] max-w-[22rem] sm:max-w-[24rem] md:max-w-[26rem] origin-bottom-right animate-fadeIn"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                <div className="relative flex w-full max-h-[78vh] flex-col rounded-2xl bg-white/95 p-4 shadow-2xl ring-1 ring-black/10 backdrop-blur sm:max-h-[70vh] md:max-h-[64vh]">
                                                    <div className="absolute -bottom-1 right-6 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-white/95 drop-shadow-lg" />
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold text-white shadow">
                                                            {
                                                                quickNoteDisplayTime
                                                            }
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                handleCloseQuickNote
                                                            }
                                                            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                                                            aria-label="Close quick note"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>

                                                    <div className="mt-3 flex-1 overflow-hidden">
                                                        <Editor
                                                            className="h-full w-full [&_.ql-container]:h-full [&_.ql-container]:rounded-b-xl [&_.ql-container]:max-h-[52vh] sm:[&_.ql-container]:max-h-[48vh] md:[&_.ql-container]:max-h-[44vh] [&_.ql-editor]:min-h-[6rem] sm:[&_.ql-editor]:min-h-[7rem] md:[&_.ql-editor]:min-h-[8rem] [&_.ql-editor]:max-h-[50vh] sm:[&_.ql-editor]:max-h-[44vh] md:[&_.ql-editor]:max-h-[40vh] [&_.ql-editor]:text-sm [&_.ql-toolbar]:rounded-t-xl [&_.ql-toolbar]:border-none"
                                                            placeholder="Capture a quick thought..."
                                                            maxLength={
                                                                MAX_NOTE_LENGTH
                                                            }
                                                            resetSignal={
                                                                quickNoteResetSignal
                                                            }
                                                            onChange={
                                                                handleQuickNoteChange
                                                            }
                                                        />
                                                    </div>

                                                    {quickNoteError ? (
                                                        <p className="mt-2 text-xs font-medium text-red-500">
                                                            {quickNoteError}
                                                        </p>
                                                    ) : null}

                                                    <div className="mt-3 flex items-center justify-between gap-3">
                                                        <span className="text-[11px] font-medium text-slate-500">
                                                            {
                                                                quickNoteCharactersRemaining
                                                            }{" "}
                                                            characters remaining
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    handleCloseQuickNote
                                                                }
                                                                className="px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-700"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    handleSaveQuickNote
                                                                }
                                                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                                                                disabled={
                                                                    !canSaveQuickNote
                                                                }
                                                            >
                                                                {isSavingQuickNote
                                                                    ? "Saving..."
                                                                    : "Save"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : null}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCyclePlaybackRate}
                                    title="Playback rate"
                                    className="flex h-7 min-w-[2rem] md:min-w-[2.75rem] items-center justify-center bg-white/15 text-[8px] md:text-xs font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Change playback speed"
                                    disabled={!isPlayerReady}
                                >
                                    {`${playbackRate}x`}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleToggleFullscreen}
                                    title={
                                        isFullscreen
                                            ? "Exit fullscreen"
                                            : "Enter fullscreen"
                                    }
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

            <NoteSection
                videoId={videoId}
                playerRef={playerInstanceRef}
                onNotesChange={handleNotesChange}
                refreshTrigger={notesRefreshTrigger}
            />


            {isQuickNoteOpen && !isFullscreen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Quick note"
                    onClick={handleQuickNoteBackdropClick}
                >
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                                {quickNoteDisplayTime}
                            </span>
                            <button
                                type="button"
                                onClick={handleCloseQuickNote}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                                aria-label="Close quick note"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <Editor
                            className="w-full"
                            placeholder="Capture a quick thought..."
                            maxLength={MAX_NOTE_LENGTH}
                            resetSignal={quickNoteResetSignal}
                            onChange={handleQuickNoteChange}
                        />

                        {quickNoteError ? (
                            <p className="text-sm font-medium text-red-500">
                                {quickNoteError}
                            </p>
                        ) : null}

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs font-medium text-slate-500">
                                {quickNoteCharactersRemaining} characters
                                remaining
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseQuickNote}
                                    className="px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveQuickNote}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                                    disabled={!canSaveQuickNote}
                                >
                                    {isSavingQuickNote
                                        ? "Saving..."
                                        : "Save note"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default WatchView;
