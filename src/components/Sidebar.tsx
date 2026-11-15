import React, { useRef, useState } from 'react';
import {
  CheckSquare,
  Download,
  FileText,
  Folder as FolderIcon,
  FolderPlus,
  Hash,
  Moon,
  Pin,
  Plus,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Folder, ThemeMode, ViewFilter } from '../types/note';

interface SidebarProps {
  folders: Folder[];
  activeFilter: ViewFilter;
  onSelectFilter: (filter: ViewFilter) => void;
  onCreateNote: () => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  counts: {
    all: number;
    pinned: number;
    checklists: number;
    trash: number;
    byFolder: Record<string, number>;
  };
  allTags: { tag: string; count: number }[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onExportBackup: () => void;
  onImportFiles: (files: FileList) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  activeFilter,
  onSelectFilter,
  onCreateNote,
  onCreateFolder,
  onDeleteFolder,
  counts,
  allTags,
  theme,
  onToggleTheme,
  onExportBackup,
  onImportFiles,
  mobileOpen,
  onCloseMobile,
}) => {
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (trimmed) {
      onCreateFolder(trimmed);
      setNewFolderName('');
      setAddingFolder(false);
    }
  };

  const isSelected = (candidate: ViewFilter) => {
    if (candidate.type !== activeFilter.type) return false;
    if (candidate.type === 'folder' && activeFilter.type === 'folder') {
      return candidate.folderId === activeFilter.folderId;
    }
    if (candidate.type === 'tag' && activeFilter.type === 'tag') {
      return candidate.tag === activeFilter.tag;
    }
    return true;
  };

  const selectAndClose = (filter: ViewFilter) => {
    onSelectFilter(filter);
    onCloseMobile();
  };

  const sidebarContent = (
    <aside className="flex flex-col h-full w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <span className="font-display text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap shrink-0">
          Folio
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Action */}
      <div className="p-3 shrink-0">
        <button
          type="button"
          onClick={() => {
            onCreateNote();
            onCloseMobile();
          }}
          className="w-full h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
        {/* Library Views */}
        <div>
          <div className="px-2.5 mb-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            Library
          </div>
          <nav className="space-y-0.5">
            {[
              { filter: { type: 'all' } as ViewFilter, label: 'All Notes', icon: FileText, count: counts.all },
              { filter: { type: 'pinned' } as ViewFilter, label: 'Pinned', icon: Pin, count: counts.pinned },
              {
                filter: { type: 'checklists' } as ViewFilter,
                label: 'Checklists',
                icon: CheckSquare,
                count: counts.checklists,
              },
              { filter: { type: 'trash' } as ViewFilter, label: 'Trash', icon: Trash2, count: counts.trash },
            ].map((item) => {
              const active = isSelected(item.filter);
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => selectAndClose(item.filter)}
                  className={`w-full h-9 px-2.5 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </span>
                  <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Folders */}
        <div>
          <div className="px-2.5 mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Folders</span>
            <button
              type="button"
              onClick={() => setAddingFolder((prev) => !prev)}
              aria-label="Create folder"
              title="Create folder"
              className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {addingFolder && (
            <form onSubmit={handleFolderSubmit} className="mb-2 px-1">
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setAddingFolder(false);
                    setNewFolderName('');
                  }
                }}
                placeholder="Folder name..."
                className="w-full h-8 px-2.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>
          )}

          <div className="space-y-0.5">
            {folders.map((folder) => {
              const filter: ViewFilter = { type: 'folder', folderId: folder.id };
              const active = isSelected(filter);
              const count = counts.byFolder[folder.id] || 0;
              return (
                <div key={folder.id} className="group relative flex items-center">
                  <button
                    type="button"
                    onClick={() => selectAndClose(filter)}
                    className={`w-full h-9 px-2.5 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <FolderIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate whitespace-nowrap">{folder.name}</span>
                    </span>
                    <span
                      className={`text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0 ${
                        !folder.isDefault ? 'group-hover:opacity-0 transition-opacity' : ''
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                  {!folder.isDefault && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      aria-label={`Delete folder ${folder.name}`}
                      title="Delete folder"
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 absolute right-2 w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-opacity cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <div className="px-2.5 mb-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
              Tags
            </div>
            <div className="space-y-0.5">
              {allTags.map(({ tag, count }) => {
                const filter: ViewFilter = { type: 'tag', tag };
                const active = isSelected(filter);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => selectAndClose(filter)}
                    className={`w-full h-8 px-2.5 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Hash className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate whitespace-nowrap">{tag}</span>
                    </span>
                    <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Backup / Import Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.md,.txt"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onImportFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-9 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>
        <button
          type="button"
          onClick={onExportBackup}
          className="flex-1 h-9 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Backup</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <div className="hidden lg:block h-full shrink-0">{sidebarContent}</div>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
