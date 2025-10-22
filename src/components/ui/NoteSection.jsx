import { useEffect, useState } from "react";
import {
  getNotesByVideoId,
  createNote,
  updateNote,
  deleteNote,
  hasNotes
} from "../../utils/firestore"; // ⬅️ fixed path
import { auth } from "../../"; // ⬅️ adjust this if your file is elsewhere
import { Trash2, Edit3, Save, Clock } from "lucide-react";

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

  const uid = auth.currentUser?.uid;

  // 🔹 Fetch all notes when component mounts
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

  // 🔹 Create a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const timeSec = playerRef.current?.getCurrentTime?.() || 0;
    const id = await createNote(uid, videoId, newNote.trim(), timeSec);
    setNotes((prev) => [...prev, { noteId: id, content: newNote.trim(), timeSec }]);
    setNewNote("");
  };

  // 🔹 Delete a note
  const handleDelete = async (noteId) => {
    await deleteNote(uid, videoId, noteId);
    setNotes((prev) => prev.filter((n) => n.noteId !== noteId));
  };

  // 🔹 Start editing a note
  const handleEdit = (noteId, content) => {
    setEditingId(noteId);
    setEditedContent(content);
  };

  // 🔹 Save edited note
  const handleSave = async (noteId) => {
    await updateNote(uid, videoId, noteId, editedContent);
    setNotes((prev) =>
      prev.map((n) =>
        n.noteId === noteId ? { ...n, content: editedContent } : n
      )
    );
    setEditingId(null);
    setEditedContent("");
  };

  // 🔹 Jump to timestamp
  const handleSeek = (sec) => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(sec, true);
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-700 flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-500" /> Notes
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Write a note..."
          className="flex-1 rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
        />
        <button
          onClick={handleAddNote}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Add
        </button>
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
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="flex-1 rounded border border-slate-300 p-1 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSave(note.noteId)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Save size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-slate-700">{note.content}</div>
                )}

                <div className="flex items-center gap-2">
                  {editingId !== note.noteId && (
                    <button
                      onClick={() => handleEdit(note.noteId, note.content)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(note.noteId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default NoteSection;
