import { useEffect, useState } from "react";
import {
    getNotesByVideoId,
    createNote,
    updateNote,
    deleteNote,
} from "../../utils/firestore";
import { auth } from "../../";
import {
    Trash2,
    Edit3,
    Save,
    Clock,
    BookOpen,
    X,
    Sparkles,
    Plus,
    CheckCircle,
} from "lucide-react";
import { ToastContainer } from "../ui/toast";


const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const NoteSection = ({ videoId, playerRef }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editedContent, setEditedContent] = useState("");
    const [toasts, setToasts] = useState([]);

    const uid = auth.currentUser?.uid;

    const addToast = (
        message,
        Icon = CheckCircle,
        iconColour = "text-emerald-400"
    ) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, Icon, iconColour }]);
        setTimeout(() => removeToast(id), 3000);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Fetch notes
    useEffect(() => {
        if (!uid || !videoId) return;
        const fetchNotes = async () => {
            setLoading(true);
            const fetched = await getNotesByVideoId(uid, videoId);
            setNotes(fetched);
            setLoading(false);
        };
        fetchNotes();
    }, [uid, videoId]);

    // Create a note
    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        const timeSec = playerRef.current?.getCurrentTime?.() || 0;
        const id = await createNote(uid, videoId, newNote.trim(), timeSec);
        setNotes((prev) => [
            ...prev,
            { noteId: id, content: newNote.trim(), timeSec },
        ]);
        setNewNote("");

        addToast("Note successfully created");
    };

    // Delete a note
    const handleDelete = async (noteId) => {
        await deleteNote(uid, videoId, noteId);
        setNotes((prev) => prev.filter((n) => n.noteId !== noteId));

        addToast("Note successfully deleted");
    };

    // Edit + save note
    const handleEdit = (noteId, content) => {
        setEditingId(noteId);
        setEditedContent(content);
    };

    const handleSave = async (noteId) => {
        await updateNote(uid, videoId, noteId, editedContent);
        setNotes((prev) =>
            prev.map((n) =>
                n.noteId === noteId ? { ...n, content: editedContent } : n
            )
        );
        setEditingId(null);
        setEditedContent("");
        addToast("Note updated");
    };

    // Timestamp click → seek + play
    const handleSeek = (sec) => {
        const player = playerRef.current;
        if (!player) return;
        player.seekTo(sec, true);
        player.playVideo();
    };

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
                                        {notes.length} {notes.length === 1 ? "note" : "notes"}
                                    </span>
                                </div>
                            </div>
                    </div>
                </div>

                {/* Input Section */}
                <div className="mb-6 rounded-xl bg-white p-4 shadow-sm border border-slate-200">
                    <div className="flex flex-col gap-3">
                        <textarea
                            rows={4}
                            placeholder="Add a new note at current timestamp..."
                            className="flex-1 rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddNote();
                                }
                            }}
                        />
                        <button
                            onClick={handleAddNote}
                            className="self-end flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-95"
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
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
                    <ul className="space-y-3">
                        {notes
                            .sort((a, b) => a.timeSec - b.timeSec)
                            .map((note) => (
                                <li
                                    key={note.noteId}
                                    className="group rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md border border-slate-200 hover:border-blue-200"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Timestamp Badge */}
                                        <div
                                            onClick={() =>
                                                handleSeek(note.timeSec)
                                            }
                                            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2 shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95"
                                        >
                                            <Clock className="h-3.5 w-3.5 text-white" />
                                            <span className="text-xs font-bold text-white">
                                                {formatTime(note.timeSec)}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {editingId === note.noteId ? (
                                                <div className="flex-1 flex flex-col gap-2">
                                                    <textarea
                                                        rows={4}
                                                        value={editedContent}
                                                        onChange={(e) =>
                                                            setEditedContent(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="flex-1 rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() =>
                                                                handleSave(
                                                                    note.noteId
                                                                )
                                                            }
                                                            className="group/save relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg transition-all hover:shadow-xl hover:scale-110 active:scale-95 overflow-hidden"
                                                            title="Save changes"
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-700 opacity-0 transition-opacity group-hover/save:opacity-100"></div>
                                                            <Save
                                                                size={18}
                                                                strokeWidth={
                                                                    2
                                                                }
                                                                className="relative z-10"
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setEditingId(
                                                                    null
                                                                )
                                                            }
                                                            className="group/cancel flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-600 shadow-md transition-all hover:bg-slate-300 hover:shadow-lg hover:scale-110 active:scale-95"
                                                            title="Cancel editing"
                                                        >
                                                            <X className="text-lg font-bold leading-none transition-transform group-hover/cancel:rotate-90" />
                                                        
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <p className="text-sm leading-relaxed text-slate-700 pr-4 whitespace-pre-wrap">
                                                        {note.content}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {editingId !== note.noteId && (
                                            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                                                        handleDelete(
                                                            note.noteId
                                                        )
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

            {/* Toast container bottom-left */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default NoteSection;
