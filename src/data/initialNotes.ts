import { Folder, Note } from '../types/note';

export const DEFAULT_FOLDERS: Folder[] = [
  { id: 'personal', name: 'Personal', isDefault: true },
  { id: 'work', name: 'Work', isDefault: true },
  { id: 'ideas', name: 'Ideas', isDefault: true },
  { id: 'study', name: 'Study', isDefault: true },
];

const now = Date.now();
const minute = 60 * 1000;
const hour = 60 * minute;

export const INITIAL_NOTES: Note[] = [
  {
    id: 'welcome-folio',
    title: 'Welcome to Folio Notes',
    content: `A calm, keyboard-friendly space for your daily writing, study notes, and checklists.

## Quick Capabilities
- **Instant local persistence**: Everything saves automatically in your browser as you type.
- **Markdown & Split Preview**: Switch between Write, Split, and Preview modes in the top toolbar.
- **Interactive Checklists**: Click any checkbox in Preview or Split mode to toggle progress live.
- **Folders & Tags**: Organize notes into folders or add \`#tags\` below the title.

## Handy Shortcuts
- Press \`Ctrl / Cmd + N\` to create a fresh note anytime
- Press \`Ctrl / Cmd + K\` to jump straight to search
- Press \`Enter\` after a list item or \`- [ ]\` task to continue the list automatically

> Good writing happens when tools get out of the way.`,
    folderId: 'personal',
    tags: ['guide', 'shortcuts'],
    pinned: true,
    trashed: false,
    createdAt: now - 3 * hour,
    updatedAt: now - 15 * minute,
  },
  {
    id: 'weekly-checklist',
    title: 'Weekly Tasks & Errands',
    content: `Keep track of priorities for the week. Toggle items directly in Split or Preview mode.

## Focus Priorities
- [x] Finalize project outline and milestones
- [x] Review design feedback from Tuesday sync
- [ ] Prepare slides for Friday demo
- [ ] Clean up inbox and archive old threads

## Errands
- [ ] Pick up coffee beans and oat milk
- [ ] Renew library books before Thursday
- [x] Back up workspace notes as JSON`,
    folderId: 'work',
    tags: ['tasks', 'weekly'],
    pinned: false,
    trashed: false,
    createdAt: now - 12 * hour,
    updatedAt: now - 2 * hour,
  },
  {
    id: 'reading-notes',
    title: 'System Design Study Notes',
    content: `Key principles distilled from recent reading on reliable distributed architectures.

### 1. Keep State Boundaries Clear
Separate fast, ephemeral UI state from persistent domain state. When local-first apps persist cleanly, perceived latency drops to zero.

### 2. Design for Predictable Recovery
- Prefer **idempotent** operations where possible
- Validate inputs at system boundaries
- Keep export formats human-readable (Markdown & JSON)

\`\`\`ts
// Example: deterministic note summary
const wordCount = text.trim().split(/\\s+/).filter(Boolean).length;
\`\`\``,
    folderId: 'study',
    tags: ['architecture', 'learning'],
    pinned: false,
    trashed: false,
    createdAt: now - 36 * hour,
    updatedAt: now - 5 * hour,
  },
];

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function countTasks(content: string): { total: number; completed: number } {
  const lines = content.split('\n');
  let total = 0;
  let completed = 0;
  for (const line of lines) {
    const match = line.match(/^\s*[-*]\s+\[([ xX])\]/);
    if (match) {
      total += 1;
      if (match[1].toLowerCase() === 'x') {
        completed += 1;
      }
    }
  }
  return { total, completed };
}

export function countWords(content: string): number {
  const cleaned = content.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function extractPlainTextPreview(content: string, maxLength = 110): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+\[([ xX])\]\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) return 'Empty note';
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}…`;
}

export function formatRelativeTime(timestamp: number): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 45) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

export function formatFullTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}
