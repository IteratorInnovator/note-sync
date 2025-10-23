import { useEffect, useState } from "react";
import {
  getNotesByVideoId,
  createNote,
  updateNote,
  deleteNote,
} from "../../utils/firestore";
import { auth } from "../../";
import { Trash2, Edit3, Save, Clock, CheckCircle } from "lucide-react";
import { ToastContainer } from "../ui/toast";
import { Button } from "../ui/button";

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

  const addToast = (message, Icon = CheckCircle, iconColour = "text-green-400") => {
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
    setNotes((prev) => [...prev, { noteId: id, content: newNote.trim(), timeSec }]);
    setNewNote("");

    addToast("✅ Note successfully created");
  };

  // Delete a note
  const handleDelete = async (noteId) => {
    await deleteNote(uid, videoId, noteId);
    setNotes((prev) => prev.filter((n) => n.noteId !== noteId));
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
    addToast("📝 Note updated");
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
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-700 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" /> Notes
        </h2>

        <div className="flex flex-col gap-2 mb-4">
          <textarea
            rows={4}
            placeholder="Write a note... (Shift+Enter for newline)"
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
          <Button
            onClick={handleAddNote}
            className="self-end bg-indigo-600 hover:bg-indigo-700"
          >
            Add Note
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading notes…</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-slate-500">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes
              .sort((a, b) => a.timeSec - b.timeSec)
              .map((note) => (
                <li
                  key={note.noteId}
                  className="flex justify-between items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <div
                    className="text-indigo-600 cursor-pointer text-xs font-semibold"
                    onClick={() => handleSeek(note.timeSec)}
                  >
                    {formatTime(note.timeSec)}
                  </div>

                  {editingId === note.noteId ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <textarea
                        rows={4}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="flex-1 rounded border border-slate-300 p-1 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleSave(note.noteId)}
                        >
                          <Save size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 text-sm text-slate-700 whitespace-pre-wrap">
                      {note.content}
                    </div>
                  )}

                  {editingId !== note.noteId && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(note.noteId, note.content)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.noteId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>

      {/* ✅ Toast container bottom-left */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default NoteSection;
