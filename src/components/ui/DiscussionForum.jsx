import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Reply, Send } from "lucide-react";
import { auth } from "../..";
import {
    addVideoComment,
    addVideoReply,
    subscribeToCommentReplies,
    subscribeToVideoComments,
} from "../../utils/firestore";
import {
    hasMeaningfulText,
    sanitizeHtmlString,
} from "../../utils/htmlHelpers";
import { useToasts } from "../../stores/useToasts";
import { CircleUser } from "lucide-react";

const formatTimestamp = (value) => {
    if (!value) return "";
    try {
        const date =
            typeof value.toDate === "function" ? value.toDate() : new Date(value);
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

const ReplyList = ({ videoId, commentId }) => {
    const [replies, setReplies] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToCommentReplies(
            videoId,
            commentId,
            (nextReplies) => setReplies(nextReplies)
        );
        return unsubscribe;
    }, [videoId, commentId]);

    if (!replies.length) return null;

    return (
        <ul className="mt-3 space-y-3 border-l border-slate-200 pl-4">
            {replies.map((reply) => (
                <li key={reply.replyId} className="flex gap-3">
                    <Avatar name={reply.authorName} url={reply.authorAvatar} />
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
                                __html: sanitizeHtmlString(reply.content ?? ""),
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
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

    const handleSubmitReply = async (event) => {
        event?.preventDefault();
        if (!onReply) return;

        await onReply(comment.commentId, replyText, () => setReplyText(""));
        setShowReplyBox(false);
    };

    const isSubmitting = submittingReplyId === comment.commentId;

    return (
        <li className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:shadow-md">
            <div className="flex gap-3">
                <Avatar
                    name={comment.authorName}
                    url={comment.authorAvatar}
                />
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                            {comment.authorName || "Anonymous"}
                        </p>
                        <span className="text-xs text-slate-400">
                            {formatTimestamp(comment.createdAt)}
                        </span>
                    </div>
                    <p
                        className="text-sm text-slate-700 whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{
                            __html: sanitizeHtmlString(comment.content ?? ""),
                        }}
                    />

                    {canReply ? (
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                            onClick={() => setShowReplyBox((prev) => !prev)}
                        >
                            <Reply className="h-3.5 w-3.5" /> Reply
                        </button>
                    ) : null}

                    {showReplyBox && canReply ? (
                        <form onSubmit={handleSubmitReply} className="space-y-2">
                            <textarea
                                value={replyText}
                                onChange={(event) => setReplyText(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Write a reply…"
                                rows={2}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReplyBox(false)}
                                    className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    {isSubmitting ? "Posting…" : "Post"}
                                </button>
                            </div>
                        </form>
                    ) : null}

                    <ReplyList
                        videoId={videoId}
                        commentId={comment.commentId}
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
            className={`space-y-4 rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm ${className}`}
        >
            <header className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-base font-semibold text-slate-900">
                        Discussion
                    </h2>
                </div>
                <span className="text-xs font-medium text-slate-500">
                    {comments.length}{" "}
                    {comments.length === 1 ? "comment" : "comments"}
                </span>
            </header>

            <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={
                        canComment
                            ? "Share your thoughts about this video…"
                            : "Sign in to join the discussion."
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:text-slate-400"
                    rows={3}
                    disabled={!canComment || isSubmitting}
                />
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!canComment || isSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                    >
                        <Send className="h-4 w-4" />
                        {isSubmitting ? "Posting…" : "Post"}
                    </button>
                </div>
            </form>

            {sortedComments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    {emptyState}
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
