# Phase 3: Character Card CRUD

## Context

Builds on Phase 2 React integration. Implements character card management with markdown file storage using frontmatter for structured data.

## Overview

- CharacterService for file operations
- Character list component with file-based loading
- Character form modal for create/edit
- Delete with confirmation
- Slug generation for folder names

**Effort:** 5 hours

**Dependencies:** Phase 2 complete

---

## Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| List all characters | P0 | Read from characters/ folder |
| Create new character | P0 | Generate UUID, create folder |
| View character details | P0 | Parse frontmatter |
| Edit character | P1 | Update card.md |
| Delete character | P1 | Trash folder |
| Slug generation | P1 | URL-safe folder names |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Components                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ CharacterList   │  │ CharacterCard   │  │ CharacterForm   │  │
│  │ - useCharacters │  │ - Display info  │  │ - Modal         │  │
│  │ - Select handler│  │ - Edit button   │  │ - Validation    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │            │
│  ┌────────▼────────────────────▼────────────────────▼────────┐  │
│  │                    CharacterService                        │  │
│  │  list() | create() | read() | update() | delete()          │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│                               │                                  │
│  ┌────────────────────────────▼───────────────────────────────┐  │
│  │                     Obsidian Vault API                      │  │
│  │  getAbstractFileByPath | create | read | modify | trash    │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Storage Structure:
vault/
└── characters/
    ├── alice-curious-girl/
    │   └── card.md
    └── bob-detective/
        └── card.md
```

---

## File Structure

```
src/
├── services/
│   └── character-service.ts     # NEW: File operations
├── components/
│   ├── characters/
│   │   ├── CharacterList.tsx    # NEW: List component
│   │   ├── CharacterCard.tsx    # NEW: Card display
│   │   └── CharacterForm.tsx    # NEW: Create/edit form
│   ├── ui/
│   │   └── Modal.tsx            # NEW: Modal wrapper
│   ├── Layout.tsx               # UPDATE: Use CharacterList
│   └── App.tsx
├── hooks/
│   └── use-characters.ts        # NEW: Character data hook
└── utils/
    └── slug.ts                  # NEW: Slug generation
```

---

## Implementation Steps

### Step 1: Create src/utils/slug.ts

```typescript
/**
 * Generate URL-safe slug from character name
 * "Alice the Explorer" -> "alice-the-explorer"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // Remove special chars
    .replace(/[\s_]+/g, '-')   // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Collapse multiple hyphens
    .replace(/^-|-$/g, '');    // Trim hyphens from edges
}

/**
 * Generate unique folder name with timestamp suffix if exists
 */
export function generateUniqueSlug(name: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(name);
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  // Add timestamp suffix
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}
```

---

### Step 2: Update src/types/index.ts

```typescript
// ... existing types ...

// Extended character card with file path
export interface CharacterCardWithPath extends CharacterCard {
  folderPath: string;  // e.g., "characters/alice-curious-girl"
  filePath: string;    // e.g., "characters/alice-curious-girl/card.md"
}

// Form data for creating/editing
export interface CharacterFormData {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  firstMessage: string;
}
```

---

### Step 3: Create src/services/character-service.ts

```typescript
import { App, TFile, TFolder, normalizePath } from 'obsidian';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import { CHARACTERS_FOLDER } from '../constants';
import type { CharacterCard, CharacterCardWithPath, CharacterFormData } from '../types';
import { generateUniqueSlug } from '../utils/slug';

export class CharacterService {
  constructor(private app: App) {}

  /**
   * List all characters from characters/ folder
   */
  async list(): Promise<CharacterCardWithPath[]> {
    const { vault } = this.app;
    const charactersPath = normalizePath(CHARACTERS_FOLDER);

    // Ensure folder exists
    const folder = vault.getAbstractFileByPath(charactersPath);
    if (!folder || !(folder instanceof TFolder)) {
      return [];
    }

    const characters: CharacterCardWithPath[] = [];

    for (const child of folder.children) {
      if (child instanceof TFolder) {
        const cardPath = normalizePath(`${child.path}/card.md`);
        const cardFile = vault.getAbstractFileByPath(cardPath);

        if (cardFile instanceof TFile) {
          try {
            const character = await this.readFile(cardFile, child.path);
            if (character) {
              characters.push(character);
            }
          } catch (e) {
            console.error(`Failed to read character at ${cardPath}:`, e);
          }
        }
      }
    }

    // Sort by creation date, newest first
    return characters.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Read single character by folder path
   */
  async read(folderPath: string): Promise<CharacterCardWithPath | null> {
    const cardPath = normalizePath(`${folderPath}/card.md`);
    const cardFile = this.app.vault.getAbstractFileByPath(cardPath);

    if (!(cardFile instanceof TFile)) {
      return null;
    }

    return this.readFile(cardFile, folderPath);
  }

  /**
   * Create new character
   */
  async create(data: CharacterFormData): Promise<CharacterCardWithPath> {
    const { vault } = this.app;

    // Generate unique slug
    const existingFolders = await this.getExistingFolderNames();
    const slug = generateUniqueSlug(data.name, existingFolders);
    const folderPath = normalizePath(`${CHARACTERS_FOLDER}/${slug}`);
    const filePath = normalizePath(`${folderPath}/card.md`);

    // Create character data
    const character: CharacterCard = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      personality: data.personality,
      scenario: data.scenario,
      firstMessage: data.firstMessage,
      createdAt: new Date().toISOString(),
    };

    // Create folder structure
    await this.ensureFolderExists(folderPath);

    // Generate markdown with frontmatter
    const content = matter.stringify('', character);

    // Create file
    await vault.create(filePath, content);

    return {
      ...character,
      folderPath,
      filePath,
    };
  }

  /**
   * Update existing character
   */
  async update(
    folderPath: string,
    data: Partial<CharacterFormData>
  ): Promise<CharacterCardWithPath | null> {
    const existing = await this.read(folderPath);
    if (!existing) {
      return null;
    }

    const updated: CharacterCard = {
      ...existing,
      ...data,
    };

    // Generate new content
    const content = matter.stringify('', updated);

    // Get file and update
    const file = this.app.vault.getAbstractFileByPath(existing.filePath);
    if (!(file instanceof TFile)) {
      return null;
    }

    await this.app.vault.modify(file, content);

    return {
      ...updated,
      folderPath: existing.folderPath,
      filePath: existing.filePath,
    };
  }

  /**
   * Delete character (move to trash)
   */
  async delete(folderPath: string): Promise<boolean> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) {
      return false;
    }

    await this.app.vault.trash(folder, true);
    return true;
  }

  // --- Private helpers ---

  private async readFile(
    file: TFile,
    folderPath: string
  ): Promise<CharacterCardWithPath | null> {
    const content = await this.app.vault.read(file);
    const { data } = matter(content);

    // Validate required fields
    if (!data.id || !data.name) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      personality: data.personality || '',
      scenario: data.scenario || '',
      firstMessage: data.firstMessage || '',
      createdAt: data.createdAt || new Date().toISOString(),
      folderPath,
      filePath: file.path,
    };
  }

  private async getExistingFolderNames(): Promise<string[]> {
    const folder = this.app.vault.getAbstractFileByPath(
      normalizePath(CHARACTERS_FOLDER)
    );
    if (!(folder instanceof TFolder)) {
      return [];
    }

    return folder.children
      .filter((child): child is TFolder => child instanceof TFolder)
      .map((f) => f.name);
  }

  private async ensureFolderExists(path: string): Promise<void> {
    const exists = this.app.vault.getAbstractFileByPath(path);
    if (!exists) {
      await this.app.vault.createFolder(path);
    }
  }
}
```

---

### Step 4: Create src/hooks/use-characters.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/app-context';
import { CharacterService } from '../services/character-service';
import type { CharacterCardWithPath, CharacterFormData } from '../types';

export function useCharacters() {
  const { app } = useApp();
  const [characters, setCharacters] = useState<CharacterCardWithPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = new CharacterService(app);

  const loadCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await service.list();
      setCharacters(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load characters');
    } finally {
      setIsLoading(false);
    }
  }, [app]);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const createCharacter = async (data: CharacterFormData) => {
    const created = await service.create(data);
    setCharacters((prev) => [created, ...prev]);
    return created;
  };

  const updateCharacter = async (
    folderPath: string,
    data: Partial<CharacterFormData>
  ) => {
    const updated = await service.update(folderPath, data);
    if (updated) {
      setCharacters((prev) =>
        prev.map((c) => (c.folderPath === folderPath ? updated : c))
      );
    }
    return updated;
  };

  const deleteCharacter = async (folderPath: string) => {
    const success = await service.delete(folderPath);
    if (success) {
      setCharacters((prev) => prev.filter((c) => c.folderPath !== folderPath));
    }
    return success;
  };

  return {
    characters,
    isLoading,
    error,
    reload: loadCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
  };
}
```

---

### Step 5: Create src/components/ui/Modal.tsx

```tsx
import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="mianix-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div className="mianix-modal">
        <div className="mianix-modal-header">
          <h3>{title}</h3>
          <button className="mianix-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="mianix-modal-body">{children}</div>
      </div>
    </div>
  );
}
```

---

### Step 6: Create src/components/characters/CharacterForm.tsx

```tsx
import { useState, useEffect } from 'react';
import type { CharacterFormData, CharacterCardWithPath } from '../../types';

interface CharacterFormProps {
  initialData?: CharacterCardWithPath;
  onSubmit: (data: CharacterFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CharacterForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: CharacterFormProps) {
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    description: '',
    personality: '',
    scenario: '',
    firstMessage: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        personality: initialData.personality,
        scenario: initialData.scenario,
        firstMessage: initialData.firstMessage,
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    await onSubmit(formData);
  };

  return (
    <form className="mianix-character-form" onSubmit={handleSubmit}>
      <div className="mianix-form-field">
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Character name"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="mianix-form-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Character description..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="mianix-form-field">
        <label htmlFor="personality">Personality</label>
        <textarea
          id="personality"
          name="personality"
          value={formData.personality}
          onChange={handleChange}
          placeholder="Personality traits..."
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <div className="mianix-form-field">
        <label htmlFor="scenario">Scenario</label>
        <textarea
          id="scenario"
          name="scenario"
          value={formData.scenario}
          onChange={handleChange}
          placeholder="Setting/context..."
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <div className="mianix-form-field">
        <label htmlFor="firstMessage">First Message</label>
        <textarea
          id="firstMessage"
          name="firstMessage"
          value={formData.firstMessage}
          onChange={handleChange}
          placeholder="Character's opening message..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="mianix-form-actions">
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || !formData.name.trim()}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
```

---

### Step 7: Create src/components/characters/CharacterCard.tsx

```tsx
import type { CharacterCardWithPath } from '../../types';

interface CharacterCardProps {
  character: CharacterCardWithPath;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CharacterCard({
  character,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: CharacterCardProps) {
  return (
    <div
      className={`mianix-character-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="mianix-character-name">{character.name}</div>
      <div className="mianix-character-desc">
        {character.description?.slice(0, 60) || 'No description'}
        {character.description?.length > 60 ? '...' : ''}
      </div>
      <div className="mianix-character-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
```

---

### Step 8: Create src/components/characters/CharacterList.tsx

```tsx
import { useState } from 'react';
import { useCharacters } from '../../hooks/use-characters';
import { useRoleplayStore } from '../../store';
import { CharacterCard } from './CharacterCard';
import { CharacterForm } from './CharacterForm';
import { Modal } from '../ui/Modal';
import type { CharacterCardWithPath, CharacterFormData } from '../../types';

export function CharacterList() {
  const {
    characters,
    isLoading,
    error,
    reload,
    createCharacter,
    updateCharacter,
    deleteCharacter,
  } = useCharacters();

  const { currentCharacter, setCurrentCharacter } = useRoleplayStore();

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] =
    useState<CharacterCardWithPath | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingCharacter(null);
    setIsFormOpen(true);
  };

  const handleEdit = (char: CharacterCardWithPath) => {
    setEditingCharacter(char);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: CharacterFormData) => {
    setIsSubmitting(true);
    try {
      if (editingCharacter) {
        await updateCharacter(editingCharacter.folderPath, data);
      } else {
        const created = await createCharacter(data);
        setCurrentCharacter(created);
      }
      setIsFormOpen(false);
      setEditingCharacter(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (folderPath: string) => {
    await deleteCharacter(folderPath);
    if (currentCharacter?.folderPath === folderPath) {
      setCurrentCharacter(null);
    }
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return <div className="mianix-loading-text">Loading characters...</div>;
  }

  if (error) {
    return (
      <div className="mianix-error-text">
        {error}
        <button onClick={reload}>Retry</button>
      </div>
    );
  }

  return (
    <div className="mianix-character-list">
      <div className="mianix-list-header">
        <span>Characters ({characters.length})</span>
        <button onClick={handleCreate}>+ New</button>
      </div>

      {characters.length === 0 ? (
        <div className="mianix-empty-state">
          No characters yet.
          <button onClick={handleCreate}>Create your first character</button>
        </div>
      ) : (
        <div className="mianix-list-items">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              isSelected={currentCharacter?.id === char.id}
              onSelect={() => setCurrentCharacter(char)}
              onEdit={() => handleEdit(char)}
              onDelete={() => setDeleteConfirm(char.folderPath)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCharacter ? 'Edit Character' : 'New Character'}
      >
        <CharacterForm
          initialData={editingCharacter || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Character?"
      >
        <p>This will move the character folder to trash.</p>
        <div className="mianix-form-actions">
          <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button
            className="mianix-btn-danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
```

---

### Step 9: Update src/components/Layout.tsx

```tsx
import type { ReactNode } from 'react';
import { CharacterList } from './characters/CharacterList';

interface LayoutProps {
  main: ReactNode;
}

export function Layout({ main }: LayoutProps) {
  return (
    <div className="mianix-layout">
      <aside className="mianix-sidebar">
        <CharacterList />
      </aside>
      <main className="mianix-main">{main}</main>
    </div>
  );
}

// Placeholder for main content
export function MainContent() {
  return (
    <div className="mianix-main-content">
      <p className="mianix-placeholder">
        Select a character to start chatting (Phase 4)
      </p>
    </div>
  );
}
```

---

### Step 10: Update styles.css (add character styles)

```css
/* ... existing styles ... */

/* Character List */
.mianix-character-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mianix-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--background-modifier-border);
  margin-bottom: 8px;
}

.mianix-list-header span {
  font-weight: 600;
  font-size: 13px;
}

.mianix-list-header button {
  padding: 2px 8px;
  font-size: 12px;
}

.mianix-list-items {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Character Card */
.mianix-character-card {
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  background: var(--background-secondary);
  transition: background 0.15s;
}

.mianix-character-card:hover {
  background: var(--background-secondary-alt);
}

.mianix-character-card.selected {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
}

.mianix-character-name {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}

.mianix-character-desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.3;
}

.mianix-character-card.selected .mianix-character-desc {
  color: var(--text-on-accent);
  opacity: 0.8;
}

.mianix-character-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.mianix-character-actions button {
  padding: 2px 6px;
  font-size: 10px;
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 3px;
}

/* Modal */
.mianix-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.mianix-modal {
  background: var(--background-primary);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.mianix-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--background-modifier-border);
}

.mianix-modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.mianix-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
}

.mianix-modal-body {
  padding: 16px;
  overflow-y: auto;
}

/* Form */
.mianix-character-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mianix-form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mianix-form-field label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.mianix-form-field input,
.mianix-form-field textarea {
  padding: 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-primary);
  color: var(--text-normal);
  font-family: inherit;
  font-size: 13px;
}

.mianix-form-field textarea {
  resize: vertical;
}

.mianix-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.mianix-form-actions button {
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.mianix-btn-danger {
  background: var(--text-error);
  color: white;
  border: none;
}

/* Empty/Loading States */
.mianix-empty-state {
  text-align: center;
  padding: 24px 8px;
  color: var(--text-muted);
}

.mianix-empty-state button {
  margin-top: 8px;
}

.mianix-loading-text,
.mianix-error-text {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
}
```

---

### Step 11: Add uuid dependency

Update package.json:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "gray-matter": "^4.0.3",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0",
    // ... other dev deps
  }
}
```

Run: `pnpm install`

---

## Todo List

- [ ] Create src/utils/slug.ts
- [ ] Update src/types/index.ts with new types
- [ ] Create src/services/character-service.ts
- [ ] Create src/hooks/use-characters.ts
- [ ] Create src/components/ui/Modal.tsx
- [ ] Create src/components/characters/CharacterForm.tsx
- [ ] Create src/components/characters/CharacterCard.tsx
- [ ] Create src/components/characters/CharacterList.tsx
- [ ] Update src/components/Layout.tsx
- [ ] Add uuid dependency: `pnpm add uuid && pnpm add -D @types/uuid`
- [ ] Update styles.css with character/modal styles
- [ ] Rebuild: `pnpm build`
- [ ] Test: Create character, verify folder created
- [ ] Test: Edit character, verify file updated
- [ ] Test: Delete character, verify moved to trash
- [ ] Test: Select character, verify state updates

---

## Success Criteria

1. Character list loads from characters/ folder
2. Create button opens modal form
3. Form validates name required
4. New character creates folder + card.md
5. Edit updates card.md frontmatter
6. Delete moves folder to Obsidian trash
7. Selected character highlighted in list
8. Store updates with current character

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| gray-matter import issues | High | Medium | Test CommonJS import |
| Folder creation race condition | Medium | Low | Use normalizePath |
| UUID collision | Low | Very Low | V4 UUID sufficient |
| Stale character list | Medium | Medium | Add refresh button |

---

## Technical Notes

### gray-matter Usage

```typescript
import matter from 'gray-matter';

// Parse frontmatter
const { data, content } = matter(fileContent);

// Generate file with frontmatter
const output = matter.stringify(bodyContent, frontmatterObject);
```

### Obsidian Folder Operations

```typescript
// Check if folder exists
const folder = vault.getAbstractFileByPath(path);
if (folder instanceof TFolder) { ... }

// Create folder
await vault.createFolder(path);

// Delete to trash
await vault.trash(folder, true);  // true = use system trash
```

---

## Next Phase

Proceed to [Phase 4: Chat Interface](./phase-04-chat-interface.md) after character CRUD verified.
