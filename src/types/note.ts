export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  tags: string[];
  pinned: boolean;
  trashed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  isDefault?: boolean;
}

export type ViewFilter =
  | { type: 'all' }
  | { type: 'pinned' }
  | { type: 'checklists' }
  | { type: 'trash' }
  | { type: 'folder'; folderId: string }
  | { type: 'tag'; tag: string };

export type SortOption = 'updated' | 'created' | 'title';

export type EditorMode = 'write' | 'split' | 'preview';

export type ThemeMode = 'light' | 'dark';
