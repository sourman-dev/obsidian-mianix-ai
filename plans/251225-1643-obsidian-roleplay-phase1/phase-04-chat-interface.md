# Phase 4: Chat Interface

## Context

Builds on Phase 3 character management. Implements chat UI with message storage as markdown files. Linear message chain (no branching in Phase 1).

## Overview

- DialogueService for message file operations
- ChatView component with message list
- Message input with send button
- Auto-scroll to latest message
- Message storage in characters/{slug}/dialogues/{date}/messages/

**Effort:** 5 hours

**Dependencies:** Phase 3 complete

---

## Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Display message history | P0 | Load from files |
| Send user message | P0 | Create message file |
| Append assistant response | P0 | Create response file |
| Auto-scroll on new message | P1 | UX improvement |
| Message formatting | P1 | Basic markdown rendering |
| Date-based dialogue folders | P2 | Organization |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ChatView                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    MessageList                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Message (role: assistant)                           │  │  │
│  │  │ *waves* Hello, I'm Alice!                          │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Message (role: user)                                │  │  │
│  │  │ Hi Alice, nice to meet you!                        │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    MessageInput                            │  │
│  │  [____________________________________________] [Send]     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Storage:
characters/alice/dialogues/2024-12-25/messages/
├── 001.md  <- id: msg-001, role: assistant (firstMessage)
├── 002.md  <- id: msg-002, role: user, parentId: msg-001
└── 003.md  <- id: msg-003, role: assistant, parentId: msg-002
```

---

## File Structure

```
src/
├── services/
│   ├── character-service.ts
│   └── dialogue-service.ts      # NEW: Message file operations
├── components/
│   ├── chat/
│   │   ├── ChatView.tsx         # NEW: Main chat container
│   │   ├── MessageList.tsx      # NEW: Message display
│   │   ├── MessageItem.tsx      # NEW: Single message
│   │   └── MessageInput.tsx     # NEW: Input + send
│   ├── characters/
│   ├── Layout.tsx               # UPDATE: Use ChatView
│   └── App.tsx
├── hooks/
│   ├── use-characters.ts
│   └── use-dialogue.ts          # NEW: Dialogue data hook
└── types/
    └── index.ts                 # UPDATE: Dialogue types
```

---

## Implementation Steps

### Step 1: Update src/types/index.ts

```typescript
// ... existing types ...

// Dialogue message with file path
export interface DialogueMessageWithPath extends DialogueMessage {
  content: string;
  filePath: string;
}

// Dialogue session metadata
export interface DialogueSession {
  id: string;           // Date folder name: 2024-12-25
  folderPath: string;   // Full path to dialogue folder
  messageCount: number;
  createdAt: string;
}

// Chat message for LLM API
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

---

### Step 2: Create src/services/dialogue-service.ts

```typescript
import { App, TFile, TFolder, normalizePath } from 'obsidian';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import type {
  DialogueMessage,
  DialogueMessageWithPath,
  DialogueSession,
} from '../types';

export class DialogueService {
  constructor(private app: App) {}

  /**
   * Get or create today's dialogue folder for character
   */
  async getOrCreateTodayDialogue(
    characterFolderPath: string
  ): Promise<string> {
    const today = new Date().toISOString().split('T')[0]; // 2024-12-25
    const dialoguePath = normalizePath(
      `${characterFolderPath}/dialogues/${today}`
    );
    const messagesPath = normalizePath(`${dialoguePath}/messages`);

    await this.ensureFolderExists(dialoguePath);
    await this.ensureFolderExists(messagesPath);

    return dialoguePath;
  }

  /**
   * Load all messages from a dialogue folder
   */
  async loadMessages(
    dialogueFolderPath: string
  ): Promise<DialogueMessageWithPath[]> {
    const messagesPath = normalizePath(`${dialogueFolderPath}/messages`);
    const folder = this.app.vault.getAbstractFileByPath(messagesPath);

    if (!(folder instanceof TFolder)) {
      return [];
    }

    const messages: DialogueMessageWithPath[] = [];

    // Get all markdown files and sort by name
    const files = folder.children
      .filter((f): f is TFile => f instanceof TFile && f.extension === 'md')
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const file of files) {
      const msg = await this.readMessageFile(file);
      if (msg) {
        messages.push(msg);
      }
    }

    return messages;
  }

  /**
   * Load latest dialogue for character (most recent date folder)
   */
  async loadLatestDialogue(
    characterFolderPath: string
  ): Promise<{ dialoguePath: string; messages: DialogueMessageWithPath[] }> {
    const dialoguesPath = normalizePath(`${characterFolderPath}/dialogues`);
    const folder = this.app.vault.getAbstractFileByPath(dialoguesPath);

    if (!(folder instanceof TFolder)) {
      // No dialogues yet, create today's
      const dialoguePath = await this.getOrCreateTodayDialogue(
        characterFolderPath
      );
      return { dialoguePath, messages: [] };
    }

    // Find most recent date folder
    const dateFolders = folder.children
      .filter((f): f is TFolder => f instanceof TFolder)
      .sort((a, b) => b.name.localeCompare(a.name)); // Descending

    if (dateFolders.length === 0) {
      const dialoguePath = await this.getOrCreateTodayDialogue(
        characterFolderPath
      );
      return { dialoguePath, messages: [] };
    }

    const latestFolder = dateFolders[0];
    const messages = await this.loadMessages(latestFolder.path);

    return { dialoguePath: latestFolder.path, messages };
  }

  /**
   * Create initial first message from character
   */
  async createFirstMessage(
    dialogueFolderPath: string,
    firstMessageContent: string
  ): Promise<DialogueMessageWithPath> {
    return this.appendMessage(
      dialogueFolderPath,
      'assistant',
      firstMessageContent,
      null
    );
  }

  /**
   * Append a new message to dialogue
   */
  async appendMessage(
    dialogueFolderPath: string,
    role: 'user' | 'assistant',
    content: string,
    parentId: string | null
  ): Promise<DialogueMessageWithPath> {
    const messagesPath = normalizePath(`${dialogueFolderPath}/messages`);

    // Get next message number
    const nextNum = await this.getNextMessageNumber(messagesPath);
    const fileName = nextNum.toString().padStart(3, '0') + '.md';
    const filePath = normalizePath(`${messagesPath}/${fileName}`);

    // Create message metadata
    const message: DialogueMessage = {
      id: `msg-${nextNum.toString().padStart(3, '0')}`,
      role,
      parentId,
      timestamp: new Date().toISOString(),
    };

    // Generate file content
    const fileContent = matter.stringify(content, message);

    // Create file
    await this.app.vault.create(filePath, fileContent);

    return {
      ...message,
      content,
      filePath,
    };
  }

  /**
   * Update message content (for streaming)
   */
  async updateMessageContent(
    filePath: string,
    content: string
  ): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
      throw new Error(`Message file not found: ${filePath}`);
    }

    // Read existing to preserve metadata
    const existingContent = await this.app.vault.read(file);
    const { data } = matter(existingContent);

    // Generate new content with same metadata
    const newContent = matter.stringify(content, data);
    await this.app.vault.modify(file, newContent);
  }

  // --- Private helpers ---

  private async readMessageFile(
    file: TFile
  ): Promise<DialogueMessageWithPath | null> {
    const content = await this.app.vault.read(file);
    const { data, content: body } = matter(content);

    if (!data.id || !data.role) {
      return null;
    }

    return {
      id: data.id,
      role: data.role,
      parentId: data.parentId || null,
      timestamp: data.timestamp || new Date().toISOString(),
      content: body.trim(),
      filePath: file.path,
    };
  }

  private async getNextMessageNumber(messagesPath: string): Promise<number> {
    const folder = this.app.vault.getAbstractFileByPath(messagesPath);
    if (!(folder instanceof TFolder)) {
      return 1;
    }

    const files = folder.children.filter(
      (f) => f instanceof TFile && f.extension === 'md'
    );

    return files.length + 1;
  }

  private async ensureFolderExists(path: string): Promise<void> {
    const parts = path.split('/');
    let current = '';

    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      const exists = this.app.vault.getAbstractFileByPath(current);
      if (!exists) {
        await this.app.vault.createFolder(current);
      }
    }
  }
}
```

---

### Step 3: Create src/hooks/use-dialogue.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/app-context';
import { DialogueService } from '../services/dialogue-service';
import { useRoleplayStore } from '../store';
import type { DialogueMessageWithPath, CharacterCardWithPath } from '../types';

export function useDialogue(character: CharacterCardWithPath | null) {
  const { app } = useApp();
  const { setMessages } = useRoleplayStore();

  const [dialoguePath, setDialoguePath] = useState<string | null>(null);
  const [messages, setLocalMessages] = useState<DialogueMessageWithPath[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = new DialogueService(app);

  // Load dialogue when character changes
  const loadDialogue = useCallback(async () => {
    if (!character) {
      setLocalMessages([]);
      setDialoguePath(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { dialoguePath: path, messages: msgs } =
        await service.loadLatestDialogue(character.folderPath);

      setDialoguePath(path);

      // If no messages and character has firstMessage, create it
      if (msgs.length === 0 && character.firstMessage) {
        const firstMsg = await service.createFirstMessage(
          path,
          character.firstMessage
        );
        setLocalMessages([firstMsg]);
      } else {
        setLocalMessages(msgs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dialogue');
    } finally {
      setIsLoading(false);
    }
  }, [character, app]);

  useEffect(() => {
    loadDialogue();
  }, [loadDialogue]);

  // Sync to global store
  useEffect(() => {
    setMessages(messages);
  }, [messages, setMessages]);

  // Send user message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!dialoguePath) {
        throw new Error('No active dialogue');
      }

      const parentId =
        messages.length > 0 ? messages[messages.length - 1].id : null;

      const userMsg = await service.appendMessage(
        dialoguePath,
        'user',
        content,
        parentId
      );

      setLocalMessages((prev) => [...prev, userMsg]);
      return userMsg;
    },
    [dialoguePath, messages, app]
  );

  // Append assistant response (called after LLM response)
  const appendAssistantMessage = useCallback(
    async (content: string) => {
      if (!dialoguePath) {
        throw new Error('No active dialogue');
      }

      const parentId =
        messages.length > 0 ? messages[messages.length - 1].id : null;

      const assistantMsg = await service.appendMessage(
        dialoguePath,
        'assistant',
        content,
        parentId
      );

      setLocalMessages((prev) => [...prev, assistantMsg]);
      return assistantMsg;
    },
    [dialoguePath, messages, app]
  );

  // Update message content (for streaming)
  const updateMessage = useCallback(
    async (filePath: string, content: string) => {
      await service.updateMessageContent(filePath, content);
      setLocalMessages((prev) =>
        prev.map((m) => (m.filePath === filePath ? { ...m, content } : m))
      );
    },
    [app]
  );

  // Start new dialogue (new day folder)
  const startNewDialogue = useCallback(async () => {
    if (!character) return;

    const path = await service.getOrCreateTodayDialogue(character.folderPath);
    setDialoguePath(path);

    if (character.firstMessage) {
      const firstMsg = await service.createFirstMessage(
        path,
        character.firstMessage
      );
      setLocalMessages([firstMsg]);
    } else {
      setLocalMessages([]);
    }
  }, [character, app]);

  return {
    messages,
    dialoguePath,
    isLoading,
    error,
    sendMessage,
    appendAssistantMessage,
    updateMessage,
    startNewDialogue,
    reload: loadDialogue,
  };
}
```

---

### Step 4: Create src/components/chat/MessageItem.tsx

```tsx
import type { DialogueMessageWithPath } from '../../types';

interface MessageItemProps {
  message: DialogueMessageWithPath;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`mianix-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="mianix-message-header">
        <span className="mianix-message-role">
          {isUser ? 'You' : 'Assistant'}
        </span>
        <span className="mianix-message-time">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div className="mianix-message-content">{message.content}</div>
    </div>
  );
}

function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
```

---

### Step 5: Create src/components/chat/MessageList.tsx

```tsx
import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import type { DialogueMessageWithPath } from '../../types';

interface MessageListProps {
  messages: DialogueMessageWithPath[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="mianix-messages-empty">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="mianix-message-list">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div className="mianix-message assistant streaming">
          <div className="mianix-message-content">
            <span className="mianix-typing-indicator">...</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
```

---

### Step 6: Create src/components/chat/MessageInput.tsx

```tsx
import { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [value]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSending) return;

    setIsSending(true);
    try {
      await onSend(trimmed);
      setValue('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mianix-message-input">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSending}
        rows={1}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || isSending || !value.trim()}
      >
        {isSending ? '...' : 'Send'}
      </button>
    </div>
  );
}
```

---

### Step 7: Create src/components/chat/ChatView.tsx

```tsx
import { useRoleplayStore } from '../../store';
import { useDialogue } from '../../hooks/use-dialogue';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatView() {
  const { currentCharacter } = useRoleplayStore();

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    appendAssistantMessage,
    startNewDialogue,
  } = useDialogue(currentCharacter);

  if (!currentCharacter) {
    return (
      <div className="mianix-chat-empty">
        <p>Select a character to start chatting</p>
      </div>
    );
  }

  const handleSend = async (content: string) => {
    // Send user message
    await sendMessage(content);

    // TODO: Phase 5 - Call LLM and append response
    // For now, just add a placeholder response
    await appendAssistantMessage(
      '*LLM integration coming in Phase 5*\n\nThis is a placeholder response.'
    );
  };

  if (error) {
    return (
      <div className="mianix-chat-error">
        <p>{error}</p>
        <button onClick={() => startNewDialogue()}>Start New Dialogue</button>
      </div>
    );
  }

  return (
    <div className="mianix-chat-view">
      <div className="mianix-chat-header">
        <h3>{currentCharacter.name}</h3>
        <button onClick={startNewDialogue} title="Start new dialogue">
          + New
        </button>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      <MessageInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
```

---

### Step 8: Update src/components/Layout.tsx

```tsx
import { CharacterList } from './characters/CharacterList';
import { ChatView } from './chat/ChatView';

export function Layout() {
  return (
    <div className="mianix-layout">
      <aside className="mianix-sidebar">
        <CharacterList />
      </aside>
      <main className="mianix-main">
        <ChatView />
      </main>
    </div>
  );
}
```

---

### Step 9: Update src/components/App.tsx

```tsx
import { useRoleplayStore } from '../store';
import { Layout } from './Layout';

export function App() {
  const { error, setError } = useRoleplayStore();

  return (
    <div className="mianix-roleplay-container">
      {error && (
        <div className="mianix-error">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <Layout />
    </div>
  );
}
```

---

### Step 10: Update styles.css (add chat styles)

```css
/* ... existing styles ... */

/* Chat View */
.mianix-chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mianix-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--background-modifier-border);
  margin-bottom: 8px;
}

.mianix-chat-header h3 {
  margin: 0;
  font-size: 16px;
}

.mianix-chat-header button {
  padding: 4px 8px;
  font-size: 12px;
}

.mianix-chat-empty,
.mianix-chat-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  text-align: center;
  gap: 12px;
}

/* Message List */
.mianix-message-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.mianix-messages-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

/* Message Item */
.mianix-message {
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 85%;
}

.mianix-message.user {
  align-self: flex-end;
  background: var(--interactive-accent);
  color: var(--text-on-accent);
}

.mianix-message.assistant {
  align-self: flex-start;
  background: var(--background-secondary);
}

.mianix-message-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.mianix-message-role {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.7;
}

.mianix-message-time {
  font-size: 10px;
  opacity: 0.5;
}

.mianix-message-content {
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Typing indicator */
.mianix-typing-indicator {
  display: inline-block;
  animation: typing 1s infinite;
}

@keyframes typing {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* Message Input */
.mianix-message-input {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--background-modifier-border);
  margin-top: auto;
}

.mianix-message-input textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  background: var(--background-primary);
  color: var(--text-normal);
  font-family: inherit;
  font-size: 13px;
  resize: none;
  min-height: 36px;
  max-height: 150px;
}

.mianix-message-input button {
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--interactive-accent);
  color: var(--text-on-accent);
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.mianix-message-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Todo List

- [ ] Update src/types/index.ts with dialogue types
- [ ] Create src/services/dialogue-service.ts
- [ ] Create src/hooks/use-dialogue.ts
- [ ] Create src/components/chat/MessageItem.tsx
- [ ] Create src/components/chat/MessageList.tsx
- [ ] Create src/components/chat/MessageInput.tsx
- [ ] Create src/components/chat/ChatView.tsx
- [ ] Update src/components/Layout.tsx
- [ ] Update src/components/App.tsx
- [ ] Update styles.css with chat styles
- [ ] Rebuild: `pnpm build`
- [ ] Test: Select character, verify first message appears
- [ ] Test: Send message, verify 002.md created
- [ ] Test: Verify auto-scroll works
- [ ] Test: Verify Enter sends, Shift+Enter adds newline

---

## Success Criteria

1. Selecting character shows first message (if defined)
2. Message input visible at bottom
3. Enter key sends message
4. User messages styled on right
5. Assistant messages styled on left
6. Messages persist in characters/{slug}/dialogues/{date}/messages/
7. Auto-scroll to latest message
8. New dialogue button works

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Message file ordering | Medium | Medium | Zero-pad filenames (001, 002) |
| Slow file I/O | Medium | Low | Lazy load, paginate if needed |
| Race condition on save | Medium | Low | Sequential operations |
| Large message content | Low | Low | Use cachedRead for display |

---

## Technical Notes

### Message File Naming

Use zero-padded numbers for natural sort:
```
001.md
002.md
...
999.md
```

If >999 messages needed, switch to 4-digit in Phase 2.

### Folder Creation

Obsidian's `createFolder` doesn't create parents. Use helper:
```typescript
async function ensureFolderExists(path: string) {
  const parts = path.split('/');
  let current = '';
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!vault.getAbstractFileByPath(current)) {
      await vault.createFolder(current);
    }
  }
}
```

### Streaming Updates

For Phase 5 streaming, update message content incrementally:
```typescript
// Create placeholder message
const msg = await appendAssistantMessage('');

// Update as chunks arrive
for await (const chunk of stream) {
  content += chunk;
  await updateMessage(msg.filePath, content);
}
```

---

## Next Phase

Proceed to [Phase 5: LLM Integration](./phase-05-llm-integration.md) after chat interface verified.
