import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, MessagesSquare, Reply, Send } from "lucide-react";
import { auth } from "../..";
import {
    addVideoComment,
    addVideoReply,
    subscribeToCommentReplies,
    subscribeToVideoComments,
} from "../../utils/firestore";
import { hasMeaningfulText, sanitizeHtmlString } from "../../utils/htmlHelpers";
import { useToasts } from "../../stores/useToasts";
import { CircleUser } from "lucide-react";

const formatTimestamp = (value) => {
    if (!value) return "";
    try {
        const date =
            typeof value.toDate === "function"
                ? value.toDate()
                : new Date(value);
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    } catch {
        return "";
    }
};

const Avatar = ({ name = "", url }) => {
    if (url) {
        return (
            <img
                src={url}
                alt={name || "Avatar"}
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full object-cover"
                loading="lazy"
            />
        );
    }
    return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-500">
            <CircleUser className="h-5 w-5" aria-hidden="true" />
        </div>
    );
};

const ReplyList = ({ videoId, commentId, expanded, onCountChange }) => {
    const [replies, setReplies] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToCommentReplies(
            videoId,
            commentId,
            (nextReplies) => {
                setReplies(nextReplies);
                onCountChange?.(nextReplies.length);
            }
        );
        return unsubscribe;
    }, [videoId, commentId, onCountChange]);

    if (!expanded) return null;

    return (
        <div className="mt-4">
            {replies.length ? (
                <ul className="space-y-5 border-l border-slate-200 pl-4">
                    {replies.map((reply) => (
                        <li key={reply.replyId} className="flex gap-3">
                            <Avatar
                                name={reply.authorName}
                                url={reply.authorAvatar}
                            />
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-800">
                                        {reply.authorName || "Anonymous"}
                                    </p>
                                    <span className="text-[11px] text-slate-400">
                                        {formatTimestamp(reply.createdAt)}
                                    </span>
                                </div>
                                <p
                                    className="text-sm text-slate-600 whitespace-pre-wrap break-words"
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeHtmlString(
                                            reply.content ?? ""
                                        ),
                                    }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="border-l border-slate-200 pl-4 text-xs italic text-slate-400">
                    No replies yet.
                </p>
            )}
        </div>
    );
};

const CommentItem = ({
    videoId,
    comment,
    onReply,
    submittingReplyId,
    canReply,
}) => {
    const [replyText, setReplyText] = useState("");
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyCount, setReplyCount] = useState(0);
    const [showReplies, setShowReplies] = useState(false);

    const handleSubmitReply = async (event) => {
        event?.preventDefault();
        if (!onReply) return;

        await onReply(comment.commentId, replyText, () => setReplyText(""));
        setShowReplyBox(false);
    };

    const isSubmitting = submittingReplyId === comment.commentId;

    return (
        <li className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-indigo-200/60 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-purple-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex gap-4">
                <div className="shrink-0">
                    <Avatar
                        name={comment.authorName}
                        url={comment.authorAvatar}
                    />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-sm font-bold text-slate-900 tracking-tight">
                            {comment.authorName || "Anonymous"}
                        </p>
                        <span className="flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-500 backdrop-blur-sm">
                            {formatTimestamp(comment.createdAt)}
                        </span>
                    </div>
                    <p
                        className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{
                            __html: sanitizeHtmlString(comment.content ?? ""),
                        }}
                    />

                    <div className="flex items-center gap-4">
                        {canReply ? (
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/50 transition-all duration-200 hover:shadow-md hover:ring-indigo-300/50 hover:from-indigo-50 hover:to-purple-50 active:scale-95"
                                onClick={() => setShowReplyBox((prev) => !prev)}
                            >
                                <Reply className="h-3.5 w-3.5" /> Reply
                            </button>
                        ) : null}

                        {replyCount > 0 ? (
                            <button
                                type="button"
                                className="text-xs text-gray-900 transition-colors duration-150 hover:opacity-80 hover:underline active:scale-95"
                                onClick={() => setShowReplies((prev) => !prev)}
                            >
                                {showReplies
                                    ? "Hide replies"
                                    : `View ${replyCount} ${
                                          replyCount === 1 ? "reply" : "replies"
                                      }`}
                            </button>
                        ) : null}
                    </div>

                    {showReplyBox && canReply ? (
                        <form
                            onSubmit={handleSubmitReply}
                            className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                            <textarea
                                value={replyText}
                                onChange={(event) =>
                                    setReplyText(event.target.value)
                                }
                                className="w-full resize-none appearance-none rounded-xl border-0 bg-gradient-to-br from-slate-100 to-slate-50 px-4 py-3 text-sm text-slate-800 shadow-inner ring-1 ring-slate-200/60 transition-all duration-200 placeholder:text-slate-400 focus:from-slate-50 focus:to-white focus:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/80"
                                placeholder="Write a thoughtful reply…"
                                rows={3}
                            />
                            <div className="flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowReplyBox(false)}
                                    className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/40 hover:from-indigo-500 hover:to-indigo-600 disabled:cursor-not-allowed disabled:from-indigo-400 disabled:to-indigo-400 disabled:shadow-none active:scale-95"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    {isSubmitting ? "Posting…" : "Post Reply"}
                                </button>
                            </div>
                        </form>
                    ) : null}

                    <ReplyList
                        videoId={videoId}
                        commentId={comment.commentId}
                        expanded={showReplies}
                        onCountChange={setReplyCount}
                    />
                </div>
            </div>
        </li>
    );
};

const DiscussionForum = ({
    videoId,
    videoMeta = {},
    className = "",
    emptyState = "Be the first to comment.",
}) => {
    const [comments, setComments] = useState([]);
    const [input, setInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const { addToast } = useToasts();

    const user = auth.currentUser;
    const canComment = Boolean(user && user.uid);

    useEffect(() => {
        if (!videoId) return undefined;
        const unsubscribe = subscribeToVideoComments(videoId, (next) =>
            setComments(next)
        );
        return unsubscribe;
    }, [videoId]);

    const handleSubmit = useCallback(
        async (event) => {
            event?.preventDefault();
            if (!canComment) {
                addToast({
                    message: "You need to sign in to comment.",
                    iconColour: "text-amber-500",
                });
                return;
            }

            const sanitized = sanitizeHtmlString(input).trim();
            if (!hasMeaningfulText(sanitized)) return;

            setIsSubmitting(true);
            try {
                await addVideoComment(
                    videoId,
                    {
                        uid: user.uid,
                        authorName: user.displayName || "Anonymous",
                        authorAvatar: user.photoURL || null,
                        content: sanitized,
                    },
                    {
                        title: videoMeta.title ?? "",
                        channelTitle: videoMeta.channelTitle ?? "",
                        thumbnailUrl: videoMeta.thumbnailUrl ?? "",
                    }
                );
                setInput("");
            } catch (error) {
                console.error(error);
                addToast({
                    message: "Failed to post comment.",
                    iconColour: "text-red-500",
                });
            } finally {
                setIsSubmitting(false);
            }
        },
        [addToast, canComment, input, user, videoId, videoMeta]
    );

    const handleReply = useCallback(
        async (commentId, replyText, resetCallback) => {
            if (!canComment) {
                addToast({
                    message: "You need to sign in to reply.",
                    iconColour: "text-amber-500",
                });
                return;
            }
            const sanitized = sanitizeHtmlString(replyText).trim();
            if (!hasMeaningfulText(sanitized)) return;

            setReplyingTo(commentId);
            try {
                await addVideoReply(videoId, commentId, {
                    uid: user.uid,
                    authorName: user.displayName || "Anonymous",
                    authorAvatar: user.photoURL || null,
                    content: sanitized,
                });
                resetCallback?.();
            } catch (error) {
                console.error(error);
                addToast({
                    message: "Failed to post reply.",
                    iconColour: "text-red-500",
                });
            } finally {
                setReplyingTo(null);
            }
        },
        [addToast, canComment, user, videoId]
    );

    const sortedComments = useMemo(
        () =>
            [...comments].sort((a, b) => {
                const aDate =
                    a.createdAt?.toMillis?.() ??
                    new Date(a.createdAt ?? 0).getTime();
                const bDate =
                    b.createdAt?.toMillis?.() ??
                    new Date(b.createdAt ?? 0).getTime();
                return aDate - bDate;
            }),
        [comments]
    );

    return (
        <section
            className={`space-y-6 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-white p-6 shadow-lg backdrop-blur-sm ${className}`}
        >
            <header className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30">
                        <MessagesSquare className="size-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                            Discussion Forum
                        </h2>
                        <h3 className="text-xs font-medium text-slate-500 mt-0.5">
                            Ask questions, share insights, and learn together
                        </h3>
                    </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200/50">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-500" />
                    {comments.length}{" "}
                    {comments.length === 1 ? "comment" : "comments"}
                </span>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder={
                            canComment
                                ? "Share your thoughts about this video…"
                                : "Sign in to join the discussion."
                        }
                        className="w-full resize-none appearance-none rounded-2xl border-0 bg-gradient-to-br from-slate-100 to-slate-50 px-5 py-4 text-sm text-slate-800 shadow-inner ring-1 ring-slate-200/60 transition-all duration-200 placeholder:text-slate-400 focus:from-slate-50 focus:to-white focus:shadow-sm focus:outline-none focus:ring-2 focus:focus:ring-indigo-400/80 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        rows={4}
                        disabled={!canComment || isSubmitting}
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!canComment || isSubmitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/40 hover:from-indigo-500 hover:to-indigo-600 disabled:cursor-not-allowed disabled:from-indigo-400 disabled:to-indigo-400 disabled:shadow-none active:scale-95"
                    >
                        <Send className="h-4 w-4" />
                        {isSubmitting ? "Posting…" : "Post Comment"}
                    </button>
                </div>
            </form>

            {sortedComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100/50 px-6 py-12 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300">
                        <MessageSquare className="h-7 w-7 text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">
                        {emptyState}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Start the conversation
                    </p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {sortedComments.map((comment) => (
                        <CommentItem
                            key={comment.commentId}
                            videoId={videoId}
                            comment={comment}
                            canReply={canComment}
                            onReply={handleReply}
                            submittingReplyId={replyingTo}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
};

export default DiscussionForum;
