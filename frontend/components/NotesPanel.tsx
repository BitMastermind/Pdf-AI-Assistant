'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePencil, 
  HiOutlinePlus, 
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX
} from 'react-icons/hi';
import { useStore } from '@/lib/store';
import { getNotes, createNote, updateNote, deleteNote } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NotesPanel() {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  const { 
    currentDocument, 
    notes, 
    setNotes,
    addNote,
    updateNoteContent,
    removeNote
  } = useStore();

  useEffect(() => {
    if (currentDocument) {
      const fetchNotes = async () => {
        try {
          const result = await getNotes(currentDocument.id);
          setNotes(result);
        } catch (error) {
          console.error('Failed to fetch notes:', error);
        }
      };
      fetchNotes();
    }
  }, [currentDocument, setNotes]);

  const handleCreateNote = async () => {
    if (!currentDocument || !newContent.trim()) return;

    try {
      const note = await createNote(
        currentDocument.id, 
        newTitle || 'Untitled Note', 
        newContent
      );
      addNote(note);
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      toast.success('Note saved!');
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateNote(noteId, editContent, editTitle);
      updateNoteContent(noteId, editContent, editTitle);
      setIsEditing(null);
      toast.success('Note updated!');
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      removeNote(noteId);
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const startEditing = (note: typeof notes[0]) => {
    setIsEditing(note.id);
    setEditContent(note.content);
    setEditTitle(note.title);
  };

  if (!currentDocument) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="p-4 rounded-2xl bg-white shadow-inner mb-4 inline-block">
            <HiOutlinePencil className="w-12 h-12 text-accent-coral" />
          </div>
          <h3 className="text-xl font-display font-semibold text-slate-900 mb-2">
            Notes
          </h3>
          <p className="text-slate-500">Select a document to take notes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
              <HiOutlinePencil className="w-5 h-5 text-accent-coral" />
              Notes
            </h3>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {currentDocument.filename}
            </p>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="p-2 rounded-lg glass hover:bg-slate-100 transition-colors"
            title="Add note"
          >
            <HiOutlinePlus className="w-5 h-5 text-accent-coral" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* New Note Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card border border-accent-coral/30"
            >
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full bg-transparent text-slate-900 font-medium mb-3 outline-none placeholder:text-slate-400"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your note..."
                rows={4}
                className="w-full bg-transparent text-slate-700 resize-none outline-none placeholder:text-slate-400"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewTitle('');
                    setNewContent('');
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={!newContent.trim()}
                  className="p-2 rounded-lg bg-accent-coral/20 hover:bg-accent-coral/30 text-accent-coral transition-colors disabled:opacity-50"
                >
                  <HiOutlineCheck className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes List */}
        {notes.length === 0 && !isCreating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-slate-500 mb-4">No notes yet</p>
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <HiOutlinePlus className="w-5 h-5" />
              Create First Note
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card group"
            >
              {isEditing === note.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-transparent text-slate-900 font-medium mb-3 outline-none"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent text-slate-700 resize-none outline-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setIsEditing(null)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                      <HiOutlineX className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      className="p-2 rounded-lg bg-accent-coral/20 hover:bg-accent-coral/30 text-accent-coral transition-colors"
                    >
                      <HiOutlineCheck className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-slate-900">{note.title}</h4>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(note)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-lg hover:bg-accent-coral/10 text-slate-500 hover:text-accent-coral transition-colors"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                  {note.updated_at && (
                    <p className="text-xs text-slate-400 mt-3">
                      Updated {new Date(note.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

