import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { DEFAULT_FOLDERS, INITIAL_NOTES, countTasks, generateId } from './data/initialNotes';
import { EditorMode, Folder, Note, SortOption, ThemeMode, ViewFilter } from './types/note';

const STORAGE_KEYS = {
  notes: 'folio_notes_v1',
  folders: 'folio_folders_v1',
  theme: 'folio_theme_v1',
  editorMode: 'folio_editor_mode_v1',
};

function loadInitialNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.notes);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback to initial notes if storage is unavailable or corrupted
  }
  return INITIAL_NOTES;
}

function loadInitialFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.folders);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback to default folders
  }
  return DEFAULT_FOLDERS;
}

function loadInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Default light
  }
  return 'light';
}

function loadInitialEditorMode(): EditorMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.editorMode);
    if (saved === 'write' || saved === 'split' || saved === 'preview') return saved;
  } catch {
    // Default write
  }
  return 'write';
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>(loadInitialNotes);
  const [folders, setFolders] = useState<Folder[]>(loadInitialFolders);
  const [theme, setTheme] = useState<ThemeMode>(loadInitialTheme);
  const [editorMode, setEditorMode] = useState<EditorMode>(loadInitialEditorMode);

  const [activeFilter, setActiveFilter] = useState<ViewFilter>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    const initial = loadInitialNotes();
    const firstActive = initial.find((n) => !n.trashed);
    return firstActive ? firstActive.id : null;
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);
  const [notice, setNotice] = useState<{ message: string; undoNoteId?: string } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const noticeTimeoutRef = useRef<number | null>(null);

  const showNotice = useCallback((message: string, undoNoteId?: string) => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }
    setNotice({ message, undoNoteId });
    noticeTimeoutRef.current = window.setTimeout(() => {
      setNotice(null);
    }, 4000);
  }, []);

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
    } catch {
      // Ignore storage quota errors
    }
  }, [notes]);

  // Persist folders
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.folders, JSON.stringify(folders));
    } catch {
      // Ignore
    }
  }, [folders]);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  // Persist editor mode
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.editorMode, editorMode);
    } catch {
      // Ignore
    }
  }, [editorMode]);

  const counts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    let all = 0;
    let pinned = 0;
    let checklists = 0;
    let trash = 0;

    for (const note of notes) {
      if (note.trashed) {
        trash += 1;
        continue;
      }
      all += 1;
      if (note.pinned) pinned += 1;
      if (countTasks(note.content).total > 0) checklists += 1;
      byFolder[note.folderId] = (byFolder[note.folderId] || 0) + 1;
    }

    return { all, pinned, checklists, trash, byFolder };
  }, [notes]);

  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const note of notes) {
      if (note.trashed) continue;
      for (const tag of note.tags) {
        map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matching = notes.filter((note) => {
      if (activeFilter.type === 'trash') {
        if (!note.trashed) return false;
      } else {
        if (note.trashed) return false;
        if (activeFilter.type === 'pinned' && !note.pinned) return false;
        if (activeFilter.type === 'checklists' && countTasks(note.content).total === 0) {
          return false;
        }
        if (activeFilter.type === 'folder' && note.folderId !== activeFilter.folderId) {
          return false;
        }
        if (activeFilter.type === 'tag' && !note.tags.includes(activeFilter.tag)) {
          return false;
        }
      }

      if (!query) return true;
      const inTitle = note.title.toLowerCase().includes(query);
      const inContent = note.content.toLowerCase().includes(query);
      const inTags = note.tags.some((t) => `#${t}`.toLowerCase().includes(query));
      return inTitle || inContent || inTags;
    });

    return [...matching].sort((a, b) => {
      // Pinned notes surface first outside of Trash
      if (activeFilter.type !== 'trash' && a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      if (sortBy === 'title') {
        return (a.title || 'Untitled Note').localeCompare(b.title || 'Untitled Note');
      }
      if (sortBy === 'created') {
        return b.createdAt - a.createdAt;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, activeFilter, searchQuery, sortBy]);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find((n) => n.id === selectedNoteId) ?? null;
  }, [notes, selectedNoteId]);

  const handleCreateNote = useCallback(() => {
    const now = Date.now();
    const targetFolderId =
      activeFilter.type === 'folder' ? activeFilter.folderId : folders[0]?.id || 'personal';
    const initialTag = activeFilter.type === 'tag' ? [activeFilter.tag] : [];

    const newNote: Note = {
      id: generateId(),
      title: '',
      content: '',
      folderId: targetFolderId,
      tags: initialTag,
      pinned: activeFilter.type === 'pinned',
      trashed: false,
      createdAt: now,
      updatedAt: now,
    };

    setNotes((prev) => [newNote, ...prev]);
    if (activeFilter.type === 'trash') {
      setActiveFilter({ type: 'all' });
    }
    setSelectedNoteId(newNote.id);
    setMobileShowEditor(true);
    if (editorMode === 'preview') {
      setEditorMode('write');
    }
  }, [activeFilter, folders, editorMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (isMod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateNote]);

  const handleUpdateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note
      )
    );
  }, []);

  const handleTogglePin = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note))
    );
  }, []);

  const handleTrashNote = useCallback(
    (id: string) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, trashed: true, pinned: false, updatedAt: Date.now() } : note
        )
      );
      setMobileShowEditor(false);
      showNotice('Note moved to Trash', id);
    },
    [showNotice]
  );

  const handleRestoreNote = useCallback(
    (id: string) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, trashed: false, updatedAt: Date.now() } : note
        )
      );
      setNotice(null);
      showNotice('Note restored');
    },
    [showNotice]
  );

  const handleDeleteForever = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((note) => note.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
        setMobileShowEditor(false);
      }
      showNotice('Note permanently deleted');
    },
    [selectedNoteId, showNotice]
  );

  const handleEmptyTrash = useCallback(() => {
    setNotes((prev) => prev.filter((note) => !note.trashed));
    setSelectedNoteId(null);
    setMobileShowEditor(false);
    showNotice('Trash emptied');
  }, [showNotice]);

  const handleDuplicateNote = useCallback(
    (id: string) => {
      const source = notes.find((n) => n.id === id);
      if (!source) return;
      const now = Date.now();
      const copy: Note = {
        ...source,
        id: generateId(),
        title: source.title ? `${source.title} (Copy)` : 'Untitled Note (Copy)',
        pinned: false,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [copy, ...prev]);
      setSelectedNoteId(copy.id);
      showNotice('Note duplicated');
    },
    [notes, showNotice]
  );

  const handleCreateFolder = useCallback(
    (name: string) => {
      const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
      setFolders((prev) => [...prev, { id, name, isDefault: false }]);
      setActiveFilter({ type: 'folder', folderId: id });
    },
    []
  );

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      const fallbackId = folders.find((f) => f.id !== folderId)?.id || 'personal';
      setNotes((prev) =>
        prev.map((note) => (note.folderId === folderId ? { ...note, folderId: fallbackId } : note))
      );
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (activeFilter.type === 'folder' && activeFilter.folderId === folderId) {
        setActiveFilter({ type: 'all' });
      }
      showNotice('Folder removed; notes moved to Personal');
    },
    [folders, activeFilter, showNotice]
  );

  const handleExportBackup = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      folders,
      notes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Workspace backup downloaded');
  }, [folders, notes, showNotice]);

  const handleImportFiles = useCallback(
    async (files: FileList) => {
      let importedCount = 0;
      const newNotes: Note[] = [];

      for (const file of Array.from(files)) {
        try {
          const text = await file.text();
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(text);
            const list = Array.isArray(parsed) ? parsed : parsed?.notes;
            if (Array.isArray(list)) {
              for (const item of list) {
                if (item && typeof item.content === 'string') {
                  newNotes.push({
                    id: generateId(),
                    title: typeof item.title === 'string' ? item.title : 'Imported Note',
                    content: item.content,
                    folderId:
                      typeof item.folderId === 'string' &&
                      folders.some((f) => f.id === item.folderId)
                        ? item.folderId
                        : 'personal',
                    tags: Array.isArray(item.tags) ? item.tags.filter((t: unknown) => typeof t === 'string') : [],
                    pinned: Boolean(item.pinned),
                    trashed: Boolean(item.trashed),
                    createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
                    updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
                  });
                  importedCount += 1;
                }
              }
            }
          } else {
            const titleFromName = file.name.replace(/\.(md|txt)$/i, '');
            const headingMatch = text.match(/^#\s+(.+)\n?/);
            const title = headingMatch ? headingMatch[1].trim() : titleFromName;
            const body = headingMatch ? text.slice(headingMatch[0].length).trimStart() : text;
            const now = Date.now();
            newNotes.push({
              id: generateId(),
              title,
              content: body,
              folderId: 'personal',
              tags: [],
              pinned: false,
              trashed: false,
              createdAt: now,
              updatedAt: now,
            });
            importedCount += 1;
          }
        } catch {
          // Skip invalid files gracefully
        }
      }

      if (importedCount > 0) {
        setNotes((prev) => [...newNotes, ...prev]);
        setSelectedNoteId(newNotes[0].id);
        setActiveFilter({ type: 'all' });
        showNotice(`Imported ${importedCount} ${importedCount === 1 ? 'note' : 'notes'}`);
      } else {
        showNotice('No valid notes found in selected file');
      }
    },
    [folders, showNotice]
  );

  // Keep selected note synchronized with active filter when current selection disappears
  useEffect(() => {
    if (selectedNoteId && filteredNotes.some((n) => n.id === selectedNoteId)) {
      return;
    }
    if (filteredNotes.length > 0) {
      setSelectedNoteId(filteredNotes[0].id);
    } else {
      setSelectedNoteId(null);
    }
  }, [filteredNotes, selectedNoteId]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar
        folders={folders}
        activeFilter={activeFilter}
        onSelectFilter={(filter) => {
          setActiveFilter(filter);
          setMobileShowEditor(false);
        }}
        onCreateNote={handleCreateNote}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        counts={counts}
        allTags={allTags}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onExportBackup={handleExportBackup}
        onImportFiles={handleImportFiles}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Note List Pane (hidden on mobile when editor is open) */}
      <div className={`${mobileShowEditor ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full shrink-0`}>
        <NoteList
          notes={filteredNotes}
          folders={folders}
          selectedNoteId={selectedNoteId}
          onSelectNote={(id) => {
            setSelectedNoteId(id);
            setMobileShowEditor(true);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchInputRef={searchInputRef}
          sortBy={sortBy}
          onSortChange={setSortBy}
          activeFilter={activeFilter}
          onCreateNote={handleCreateNote}
          onEmptyTrash={handleEmptyTrash}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />
      </div>

      {/* Note Editor Canvas (hidden on mobile when list is shown) */}
      <div className={`${mobileShowEditor ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 h-full`}>
        <NoteEditor
          note={selectedNote}
          folders={folders}
          editorMode={editorMode}
          onChangeEditorMode={setEditorMode}
          onUpdateNote={handleUpdateNote}
          onTogglePin={handleTogglePin}
          onTrashNote={handleTrashNote}
          onRestoreNote={handleRestoreNote}
          onDeleteForever={handleDeleteForever}
          onDuplicateNote={handleDuplicateNote}
          onCreateNote={handleCreateNote}
          onBackToList={() => setMobileShowEditor(false)}
        />
      </div>

      {/* Transient Feedback Notice */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium shadow-lg flex items-center gap-3"
        >
          <span>{notice.message}</span>
          {notice.undoNoteId && (
            <button
              type="button"
              onClick={() => handleRestoreNote(notice.undoNoteId!)}
              className="text-blue-400 dark:text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
