// NoteSection.jsx
import { useState, useEffect, useMemo } from "react";
import {
    getNotesByVideoId,
    createNote,
    updateNote,
    deleteNote
} from "../../utils/firestore";
import { auth } from "../..";
import {
    Trash2,
    Edit3,
    Save,
    Clock,
    BookOpen,
    X,
    Sparkles,
    CircleCheck,
    CircleX,
    Download
} from "lucide-react";
import { ToastContainer } from "./toast";
import Editor from "./Editor";
import {
    getPlainTextLength,
    hasMeaningfulText,
    sanitizeHtmlString,
} from "../../utils/htmlHelpers";
import Quill from "quill";
import html2pdf from 'html2pdf.js';

const MAX_NOTE_LENGTH = 500;
let toastId = 0;

const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const NoteSection = ({
    videoId,
    video,
    playerRef,
    onNotesChange = () => undefined,
}) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentTimestamp, setCurrentTimestamp] = useState(0);

    // New note state
    const [newNote, setNewNote] = useState("");
    const [newNoteLength, setNewNoteLength] = useState(0);
    const canSaveNew = newNoteLength > 0;
    const [newEditorResetSignal, setNewEditorResetSignal] = useState(0);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editedContent, setEditedContent] = useState("");
    const [editedContentLength, setEditedContentLength] = useState(0);
    const editingHasContent = editedContentLength > 0;

    const [toasts, setToasts] = useState([]);

    // Fetch notes
    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid || !videoId) return;
        let active = true;
        (async () => {
            setLoading(true);
            const fetched = await getNotesByVideoId(uid, videoId);
            if (active) {
                setNotes(fetched);
                setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [videoId]);

    useEffect(() => {
        onNotesChange(notes);
    }, [notes, onNotesChange]);

    const handleDownload = async () => {
        if (!notes || notes.length === 0) {
            addToast("No notes available to download", CircleX, "text-red-400");
            return;
        }

        // Create hidden Quill container
        const container = document.createElement("div");
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        document.body.appendChild(container);
        
        const quill = new Quill(container, { theme: 'snow' });

        // Video Header (as Delta)
        if (video) {
            quill.insertText(0, `${video.title || "Untitled Video"}\n`, { bold: true, size: 'large' });
            const currentLength = quill.getLength();
            quill.insertText(currentLength, `Channel: ${video.channelTitle || "Unknown"}\n\n`);
        }

        // Notes section header
        quill.insertText(quill.getLength(), "Notes:\n", { bold: true, size: 'large' });
        quill.insertText(quill.getLength(), "\n");

        const sortedNotes = [...notes].sort((a, b) => a.timeSec - b.timeSec);
        
        for (let i = 0; i < sortedNotes.length; i++) {
            const note = sortedNotes[i];
            
            // Timestamp
            const minutes = Math.floor(note.timeSec / 60);
            const seconds = Math.floor(note.timeSec % 60).toString().padStart(2, "0");
            
            const currentLength = quill.getLength();
            quill.insertText(currentLength, `${i + 1}. [${minutes}:${seconds}]\n`, { bold: true });
            
            // Insert note content as HTML using clipboard
            const currentIndex = quill.getLength();
            quill.clipboard.dangerouslyPasteHTML(currentIndex, note.content);
            
            // Add spacing after note
            quill.insertText(quill.getLength(), "\n\n");
        }

        // Generate PDF from Quill's HTML
        const safeTitle = video?.title?.replace(/[\\/:*?"<>|]/g, "") || "Study_Notes";
        
        const opt = {
            margin: 16,
            filename: `${safeTitle}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(quill.root).save();
        } finally {
            // Cleanup
            document.body.removeChild(container);
        }
        addToast("Notes successfully downloaded");
        return;
    };

    // Track current player time
    useEffect(() => {
        const id = setInterval(() => {
            const t = playerRef?.current?.getCurrentTime?.();
            if (typeof t === "number")
                setCurrentTimestamp(Math.max(0, Math.floor(t)));
        }, 500);
        return () => clearInterval(id);
    }, [playerRef]);

    const addToast = (
        message,
        Icon = CircleCheck,
        iconColour = "text-emerald-400"
    ) => {
        const id = toastId++;
        setToasts((prev) => [...prev, { id, message, Icon, iconColour }]);
        setTimeout(() => removeToast(id), 3000);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Create a note
    const handleAddNote = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const htmlContent = sanitizeHtmlString(newNote).trim();
        if (!hasMeaningfulText(htmlContent)) return;

        const timeSec = playerRef.current?.getCurrentTime?.() || 0;
        const id = await createNote(uid, videoId, htmlContent, timeSec);
        setNotes((prev) => [
            ...prev,
            { noteId: id, content: htmlContent, timeSec },
        ]);
        handleCancelNewNote();
        addToast("Note successfully created");
    };

    const handleCancelNewNote = () => {
        setNewNote("");
        setNewNoteLength(0);
        setNewEditorResetSignal((k) => k + 1);
    };

    // Delete a note
    const handleDelete = async (noteId) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        await deleteNote(uid, videoId, noteId);
        setNotes((prev) => prev.filter((n) => n.noteId !== noteId));
        addToast("Note successfully deleted");
    };

    // Edit + save note
    const handleEdit = (noteId, content) => {
        setEditingId(noteId);
        const sanitized = sanitizeHtmlString(content);
        setEditedContent(sanitized);
        setEditedContentLength(getPlainTextLength(sanitized));
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditedContent("");
        setEditedContentLength(0);
    };

    const handleSave = async (noteId) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const htmlContent = sanitizeHtmlString(editedContent).trim();
        if (!hasMeaningfulText(htmlContent)) return;

        await updateNote(uid, videoId, noteId, htmlContent);
        setNotes((prev) =>
            prev.map((n) =>
                n.noteId === noteId ? { ...n, content: htmlContent } : n
            )
        );
        setEditingId(null);
        setEditedContent("");
        setEditedContentLength(0);
        addToast("Note updated", CircleCheck);
    };

    const handleSeek = (sec) => {
        const player = playerRef.current;
        if (!player) return;
        player.seekTo(sec, true);
        player.playVideo?.();
    };

    const sortedNotes = useMemo(
        () => [...notes].sort((a, b) => a.timeSec - b.timeSec),
        [notes]
    );

    return (
        <>
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg border border-blue-100">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                        <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Study Notes
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm border border-slate-200">
                                <Sparkles className="h-3 w-3 text-amber-500" />
                                <span className="text-xs font-semibold text-slate-600">
                                    {notes.length}{" "}
                                    {notes.length === 1 ? "note" : "notes"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="ml-auto flex h-10 min-w-[64px] items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 active:scale-90 transition"
                    >
                        <Download className="h-5 w-5 mr-2 text-white" />
                        Download Notes
                    </button>
                </div>

                {/* Input Section */}
                <div className="mb-6 rounded-xl bg-white p-4 shadow-sm border border-slate-200">
                    <div className="flex w-full flex-col md:flex-row items-start gap-4">
                        <div className="flex h-10 min-w-[64px] items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-semibold text-white shadow-sm">
                            {formatTime(currentTimestamp)}
                        </div>

                        {/* Right column */}
                        <div className="flex-1 w-full min-w-0 flex flex-col gap-4">
                            <Editor
                                className="w-full"
                                resetSignal={newEditorResetSignal}
                                placeholder="Add a new note at the current timestamp..."
                                maxLength={MAX_NOTE_LENGTH}
                                onChange={({ html, plainTextLength = 0 }) => {
                                    setNewNote(html);
                                    setNewNoteLength(plainTextLength);
                                }}
                            />
                            <div className="text-left text-xs font-medium text-slate-500">
                                {Math.max(
                                    0,
                                    MAX_NOTE_LENGTH -
                                        Math.min(newNoteLength, MAX_NOTE_LENGTH)
                                )}{" "}
                                characters remaining
                            </div>

                            <div className="mt-1 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancelNewNote}
                                    className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddNote}
                                    disabled={!canSaveNew}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                                >
                                    Save note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                        <p className="mt-3 text-sm text-slate-500">
                            Loading your notes...
                        </p>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-slate-200">
                        <Clock className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-3 text-sm font-medium text-slate-600">
                            No notes yet
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Add your first note to start studying!
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-6">
                        {sortedNotes.map((note) => (
                            <li
                                key={note.noteId}
                                className="group rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md border border-slate-200 hover:border-blue-200"
                            >
                                <div className="flex flex-col md:flex-row w-full min-w-0 items-start gap-4">
                                    <button
                                        onClick={() => handleSeek(note.timeSec)}
                                        className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2 shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95"
                                        title="Seek to timestamp"
                                    >
                                        <Clock className="h-3.5 w-3.5 text-white" />
                                        <span className="text-xs font-bold text-white">
                                            {formatTime(note.timeSec)}
                                        </span>
                                    </button>

                                    <div className="flex-1 min-w-0 w-full">
                                        {editingId === note.noteId ? (
                                            <div className="flex min-w-0 flex-col gap-3">
                                                <Editor
                                                    className="w-full"
                                                    initialHtml={editedContent}
                                                    placeholder="Update your note..."
                                                    maxLength={MAX_NOTE_LENGTH}
                                                    onChange={({
                                                        html,
                                                        plainTextLength = 0,
                                                    }) => {
                                                        setEditedContent(html);
                                                        setEditedContentLength(
                                                            plainTextLength
                                                        );
                                                    }}
                                                />
                                                <div className="text-left text-xs font-medium text-slate-500">
                                                    {Math.max(
                                                        0,
                                                        MAX_NOTE_LENGTH -
                                                            Math.min(
                                                                editedContentLength,
                                                                MAX_NOTE_LENGTH
                                                            )
                                                    )}{" "}
                                                    characters remaining
                                                </div>
                                                <div className="mt-2 flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleSave(
                                                                note.noteId
                                                            )
                                                        }
                                                        disabled={
                                                            !editingHasContent
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                                                        title="Save changes"
                                                    >
                                                        <Save
                                                            size={16}
                                                            strokeWidth={2}
                                                        />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={
                                                            handleCancelEdit
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 shadow-md transition-all hover:bg-slate-300 hover:text-slate-700"
                                                        title="Cancel editing"
                                                    >
                                                        <X size={16} />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative rounded-lg bg-white/40">
                                                <div
                                                    className="note-content break-words [overflow-wrap:anywhere]  bg-gray-100/90 p-6 text-sm leading-relaxed text-slate-700
    [&_ol]:ml-4 [&_ol]:list-decimal
    [&_ul]:ml-4 [&_ul]:list-disc
    [&_.ql-syntax]:whitespace-pre-wrap [&_.ql-syntax]:font-mono
  "
                                                    dangerouslySetInnerHTML={{
                                                        __html: sanitizeHtmlString(
                                                            note.content
                                                        ),
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {editingId !== note.noteId && (
                                        <div className="flex w-full justify-end shrink-0 gap-1 opacity-100 md:w-auto md:justify-start md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                                            <button
                                                onClick={() =>
                                                    handleEdit(
                                                        note.noteId,
                                                        note.content
                                                    )
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-blue-100 hover:text-blue-600"
                                                title="Edit note"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(note.noteId)
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-100 hover:text-red-600"
                                                title="Delete note"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default NoteSection;
