import React from 'react';
import { ArrowUpDown, Menu, Pin, Plus, Search, Trash2, X } from 'lucide-react';
import { Folder, Note, SortOption, ViewFilter } from '../types/note';
import { countTasks, extractPlainTextPreview, formatRelativeTime } from '../data/initialNotes';

interface NoteListProps {
  notes: Note[];
  folders: Folder[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  activeFilter: ViewFilter;
  onCreateNote: () => void;
  onEmptyTrash: () => void;
  onOpenSidebar: () => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  folders,
  selectedNoteId,
  onSelectNote,
  searchQuery,
  onSearchChange,
  searchInputRef,
  sortBy,
  onSortChange,
  activeFilter,
  onCreateNote,
  onEmptyTrash,
  onOpenSidebar,
}) => {
  const getViewTitle = (): string => {
    switch (activeFilter.type) {
      case 'all':
        return 'All Notes';
      case 'pinned':
        return 'Pinned';
      case 'checklists':
        return 'Checklists';
      case 'trash':
        return 'Trash';
      case 'folder': {
        const f = folders.find((item) => item.id === activeFilter.folderId);
        return f ? f.name : 'Folder';
      }
      case 'tag':
        return `#${activeFilter.tag}`;
    }
  };

  const getFolderName = (folderId: string) => {
    return folders.find((f) => f.id === folderId)?.name ?? 'Personal';
  };

  const cycleSort = () => {
    const order: SortOption[] = ['updated', 'created', 'title'];
    const next = order[(order.indexOf(sortBy) + 1) % order.length];
    onSortChange(next);
  };

  const sortLabel =
    sortBy === 'updated' ? 'Updated' : sortBy === 'created' ? 'Created' : 'Title A–Z';

  return (
    <section className="flex flex-col h-full w-full md:w-80 xl:w-[340px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      {/* Top Bar */}
      <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open navigation menu"
            className="lg:hidden w-9 h-9 -ml-1.5 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
          <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {getViewTitle()}
          </h2>
          <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0">
            {notes.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {activeFilter.type === 'trash' && notes.length > 0 && (
            <button
              type="button"
              onClick={onEmptyTrash}
              className="h-8 px-2.5 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Empty Trash
            </button>
          )}
          <button
            type="button"
            onClick={cycleSort}
            title={`Sort by: ${sortLabel}`}
            className="h-8 px-2.5 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortLabel}</span>
          </button>
          <button
            type="button"
            onClick={onCreateNote}
            aria-label="New note"
            className="md:hidden w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes or #tags..."
            aria-label="Search notes"
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-zinc-100/80 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-2.5 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Note List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
        {notes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 mb-3">
              {activeFilter.type === 'trash' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {searchQuery
                ? 'No matching notes'
                : activeFilter.type === 'trash'
                ? 'Trash is empty'
                : 'No notes here yet'}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {searchQuery
                ? 'Try a different keyword or clear the search filter.'
                : activeFilter.type === 'trash'
                ? 'Deleted notes stay here until you remove them permanently.'
                : 'Capture an idea, meeting note, or checklist to get started.'}
            </p>
            {activeFilter.type !== 'trash' && !searchQuery && (
              <button
                type="button"
                onClick={onCreateNote}
                className="mt-4 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Note</span>
              </button>
            )}
          </div>
        ) : (
          notes.map((note) => {
            const active = note.id === selectedNoteId;
            const preview = extractPlainTextPreview(note.content);
            const tasks = countTasks(note.content);

            return (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelectNote(note.id)}
                className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                  active
                    ? 'bg-blue-50/70 dark:bg-blue-950/25'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-sm font-semibold truncate ${
                      active
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {note.title.trim() || 'Untitled Note'}
                  </h3>
                  {note.pinned && (
                    <Pin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 fill-current" />
                  )}
                </div>

                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {preview}
                </p>

                {/* Unboxed metadata row with typographic separators */}
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                  <span className="truncate">{getFolderName(note.folderId)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums shrink-0">
                    {formatRelativeTime(note.updatedAt)}
                  </span>
                  {tasks.total > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums shrink-0">
                        {tasks.completed}/{tasks.total} tasks
                      </span>
                    </>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};
