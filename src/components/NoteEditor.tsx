import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Bold,
  CheckSquare,
  Code,
  Columns2,
  Copy,
  Download,
  Eye,
  Heading1,
  Heading2,
  Italic,
  List,
  PenLine,
  Pin,
  Plus,
  Quote,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { EditorMode, Folder, Note } from '../types/note';
import { countTasks, countWords, formatFullTimestamp } from '../data/initialNotes';
import { MarkdownPreview } from './MarkdownPreview';

interface NoteEditorProps {
  note: Note | null;
  folders: Folder[];
  editorMode: EditorMode;
  onChangeEditorMode: (mode: EditorMode) => void;
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onTogglePin: (id: string) => void;
  onTrashNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onDeleteForever: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onCreateNote: () => void;
  onBackToList: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  folders,
  editorMode,
  onChangeEditorMode,
  onUpdateNote,
  onTogglePin,
  onTrashNote,
  onRestoreNote,
  onDeleteForever,
  onDuplicateNote,
  onCreateNote,
  onBackToList,
}) => {
  const [tagInput, setTagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!note) {
    return (
      <main className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-950 text-center">
        <div className="max-w-sm">
          <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Select or create a note
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Your notes stay saved locally in this browser. Draft in Markdown, manage checklists, or organize ideas into folders.
          </p>
          <button
            type="button"
            onClick={onCreateNote}
            className="mt-5 h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </main>
    );
  }

  const words = countWords(note.content);
  const chars = note.content.length;
  const readingMinutes = Math.max(1, Math.ceil(words / 200));
  const tasks = countTasks(note.content);

  const applyFormat = (prefix: string, suffix = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onUpdateNote(note.id, { content: `${note.content}\n${prefix}${placeholder}${suffix}` });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = note.content.slice(start, end);
    const insertText = selected || placeholder;
    const updated =
      note.content.slice(0, start) + prefix + insertText + suffix + note.content.slice(end);

    onUpdateNote(note.id, { content: updated });

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + prefix.length;
      const cursorEnd = cursorStart + insertText.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onUpdateNote(note.id, { content: `${note.content}\n${prefix}` });
      return;
    }

    const start = textarea.selectionStart;
    const lineStart = note.content.lastIndexOf('\n', start - 1) + 1;
    const updated =
      note.content.slice(0, lineStart) + prefix + note.content.slice(lineStart);
    onUpdateNote(note.id, { content: updated });

    requestAnimationFrame(() => {
      textarea.focus();
      const nextPos = start + prefix.length;
      textarea.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Tab inserts 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const updated = note.content.slice(0, start) + '  ' + note.content.slice(end);
      onUpdateNote(note.id, { content: updated });
      requestAnimationFrame(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      });
      return;
    }

    // Enter continues checklists (- [ ] ) and bullet lists (- )
    if (e.key === 'Enter' && start === end) {
      const lineStart = note.content.lastIndexOf('\n', start - 1) + 1;
      const currentLine = note.content.slice(lineStart, start);

      const taskMatch = currentLine.match(/^(\s*[-*]\s+\[[ xX]\]\s)(.*)$/);
      if (taskMatch) {
        e.preventDefault();
        if (taskMatch[2].trim() === '') {
          // Exit empty checklist item
          const updated = note.content.slice(0, lineStart) + note.content.slice(start);
          onUpdateNote(note.id, { content: updated });
          requestAnimationFrame(() => textarea.setSelectionRange(lineStart, lineStart));
        } else {
          const indent = taskMatch[1].match(/^\s*/)?.[0] ?? '';
          const insertion = `\n${indent}- [ ] `;
          const updated = note.content.slice(0, start) + insertion + note.content.slice(end);
          onUpdateNote(note.id, { content: updated });
          requestAnimationFrame(() => {
            const pos = start + insertion.length;
            textarea.setSelectionRange(pos, pos);
          });
        }
        return;
      }

      const bulletMatch = currentLine.match(/^(\s*[-*+]\s)(.*)$/);
      if (bulletMatch) {
        e.preventDefault();
        if (bulletMatch[2].trim() === '') {
          const updated = note.content.slice(0, lineStart) + note.content.slice(start);
          onUpdateNote(note.id, { content: updated });
          requestAnimationFrame(() => textarea.setSelectionRange(lineStart, lineStart));
        } else {
          const insertion = `\n${bulletMatch[1]}`;
          const updated = note.content.slice(0, start) + insertion + note.content.slice(end);
          onUpdateNote(note.id, { content: updated });
          requestAnimationFrame(() => {
            const pos = start + insertion.length;
            textarea.setSelectionRange(pos, pos);
          });
        }
      }
    }
  };

  const handleToggleTaskLine = (lineIndex: number) => {
    const lines = note.content.split('\n');
    const line = lines[lineIndex];
    if (!line) return;
    if (/^\s*[-*]\s+\[ \]/.test(line)) {
      lines[lineIndex] = line.replace(/\[ \]/, '[x]');
    } else if (/^\s*[-*]\s+\[[xX]\]/.test(line)) {
      lines[lineIndex] = line.replace(/\[[xX]\]/, '[ ]');
    }
    onUpdateNote(note.id, { content: lines.join('\n') });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tagInput.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-');
    if (cleaned && !note.tags.includes(cleaned)) {
      onUpdateNote(note.id, { tags: [...note.tags, cleaned] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote(note.id, { tags: note.tags.filter((t) => t !== tagToRemove) });
  };

  const handleExportMarkdown = () => {
    const filename = `${(note.title.trim() || 'untitled-note')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}.md`;
    const mdContent = `# ${note.title.trim() || 'Untitled Note'}\n\n${note.content}`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-zinc-950">
      {/* Top Toolbar */}
      <header className="h-14 px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBackToList}
            aria-label="Back to notes list"
            className="md:hidden w-9 h-9 -ml-1.5 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <select
            aria-label="Select folder"
            disabled={note.trashed}
            value={note.folderId}
            onChange={(e) => onUpdateNote(note.id, { folderId: e.target.value })}
            className="h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
          >
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Switch & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!note.trashed && (
            <div
              role="tablist"
              aria-label="Editor view mode"
              className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800"
            >
              {[
                { id: 'write' as EditorMode, label: 'Write', icon: PenLine },
                { id: 'split' as EditorMode, label: 'Split', icon: Columns2, hideMobile: true },
                { id: 'preview' as EditorMode, label: 'Preview', icon: Eye },
              ].map((mode) => {
                const Icon = mode.icon;
                const active = editorMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onChangeEditorMode(mode.id)}
                    className={`${
                      mode.hideMobile ? 'hidden xl:flex' : 'flex'
                    } h-7 px-2.5 rounded-md text-xs font-medium items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {note.trashed ? (
            <>
              <button
                type="button"
                onClick={() => onRestoreNote(note.id)}
                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteForever(note.id)}
                className="h-8 px-3 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Delete Forever
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onTogglePin(note.id)}
                aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                title={note.pinned ? 'Unpin note' : 'Pin note'}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  note.pinned
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Pin className={`w-4 h-4 ${note.pinned ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => onDuplicateNote(note.id)}
                aria-label="Duplicate note"
                title="Duplicate note"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleExportMarkdown}
                aria-label="Export Markdown"
                title="Export as .md"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onTrashNote(note.id)}
                aria-label="Move note to trash"
                title="Move to trash"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Trash Notice Banner */}
      {note.trashed && (
        <div className="px-6 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between gap-4 shrink-0">
          <span>This note is in Trash. Restore it to continue editing.</span>
        </div>
      )}

      {/* Markdown Formatting Bar (when writing) */}
      {!note.trashed && editorMode !== 'preview' && (
        <div className="px-4 sm:px-6 h-10 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1 overflow-x-auto shrink-0">
          {[
            { label: 'Heading 1', icon: Heading1, action: () => insertLinePrefix('# ') },
            { label: 'Heading 2', icon: Heading2, action: () => insertLinePrefix('## ') },
            { label: 'Bold', icon: Bold, action: () => applyFormat('**', '**', 'bold text') },
            { label: 'Italic', icon: Italic, action: () => applyFormat('*', '*', 'italic text') },
            { label: 'Bullet list', icon: List, action: () => insertLinePrefix('- ') },
            { label: 'Checklist item', icon: CheckSquare, action: () => insertLinePrefix('- [ ] ') },
            { label: 'Quote', icon: Quote, action: () => insertLinePrefix('> ') },
            { label: 'Inline code', icon: Code, action: () => applyFormat('`', '`', 'code') },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.label}
                type="button"
                onClick={tool.action}
                aria-label={tool.label}
                title={tool.label}
                className="w-8 h-7 rounded flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Title + Tags + Content Split/Single Surface */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Title & Tags Header */}
        <div className="px-6 sm:px-10 pt-7 pb-4 max-w-4xl w-full mx-auto shrink-0">
          <input
            type="text"
            readOnly={note.trashed}
            value={note.title}
            onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
            placeholder="Untitled Note"
            aria-label="Note title"
            className="w-full font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 bg-transparent focus:outline-none"
          />

          {/* Clean unboxed inline tags */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-medium group"
              >
                <span>#{tag}</span>
                {!note.trashed && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}

            {!note.trashed && (
              <form onSubmit={handleAddTag} className="inline-flex items-center">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="+ add tag"
                  aria-label="Add tag"
                  className="w-24 focus:w-32 transition-all bg-transparent text-xs text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
                />
              </form>
            )}
          </div>
        </div>

        {/* Writing / Split / Preview Canvas */}
        <div className="flex-1 min-h-0 flex">
          {/* Write Pane */}
          {(editorMode === 'write' || editorMode === 'split') && !note.trashed && (
            <div
              className={`flex-1 min-h-0 flex flex-col ${
                editorMode === 'split'
                  ? 'border-r border-zinc-200 dark:border-zinc-800'
                  : ''
              }`}
            >
              <div
                className={`flex-1 min-h-0 px-6 sm:px-10 pb-8 w-full ${
                  editorMode === 'write' ? 'max-w-4xl mx-auto' : ''
                }`}
              >
                <textarea
                  ref={textareaRef}
                  value={note.content}
                  onChange={(e) => onUpdateNote(note.id, { content: e.target.value })}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Start writing... Use Markdown (# headings, **bold**, - [ ] checklist)"
                  aria-label="Note body"
                  className="w-full h-full resize-none bg-transparent text-[15px] leading-[1.7] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Preview Pane */}
          {(editorMode === 'preview' || editorMode === 'split' || note.trashed) && (
            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-10 pb-10">
              <div className={editorMode === 'preview' || note.trashed ? 'max-w-4xl mx-auto' : ''}>
                <MarkdownPreview
                  content={note.content}
                  onToggleTask={note.trashed ? undefined : handleToggleTaskLine}
                  readOnly={note.trashed}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiet Editorial Footer */}
      <footer className="h-10 px-6 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
        <div className="flex items-center gap-2 font-mono tabular-nums truncate">
          <span>{words} words</span>
          <span aria-hidden="true">·</span>
          <span>{chars} chars</span>
          <span aria-hidden="true">·</span>
          <span>{readingMinutes} min read</span>
          {tasks.total > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {tasks.completed}/{tasks.total} completed
              </span>
            </>
          )}
        </div>
        <div className="font-mono tabular-nums whitespace-nowrap shrink-0">
          Saved {formatFullTimestamp(note.updatedAt)}
        </div>
      </footer>
    </main>
  );
};
