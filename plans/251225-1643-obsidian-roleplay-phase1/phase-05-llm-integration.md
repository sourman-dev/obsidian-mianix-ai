# Phase 5: LLM Integration

## Context

Final phase of Phase 1 core foundation. Implements single LLM provider with OpenAI-compatible API, streaming responses, and settings tab configuration.

## Overview

- LLMService for OpenAI-compatible API calls
- SSE streaming response handling
- Settings tab with baseUrl, apiKey, modelName
- System prompt construction with character context
- Connect LLM to chat interface

**Effort:** 3 hours

**Dependencies:** Phase 4 complete

---

## Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| OpenAI-compatible fetch | P0 | Chat completions API |
| Streaming responses | P0 | SSE parsing |
| Settings UI | P0 | Configure provider |
| System prompt construction | P1 | Character context injection |
| Error handling | P1 | API errors, network issues |
| API key security | P1 | Store in plugin data.json |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ChatView                                 │
│  handleSend() ──────────────────────────────────────────────>   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                         LLMService                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  buildMessages(character, dialogueHistory)              │    │
│  │  ↓                                                      │    │
│  │  [                                                      │    │
│  │    { role: "system", content: "You are Alice..." },    │    │
│  │    { role: "assistant", content: firstMessage },        │    │
│  │    { role: "user", content: userMessage },              │    │
│  │    ...                                                  │    │
│  │  ]                                                      │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │  sendMessage(messages) → fetch POST /chat/completions   │    │
│  │  ↓                                                      │    │
│  │  Stream SSE: data: {"choices":[{"delta":{"content":""}]│    │
│  │  ↓                                                      │    │
│  │  onChunk(text) → update message file                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

Settings (data.json):
{
  "llm": {
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-...",
    "modelName": "gpt-4-turbo"
  }
}
```

---

## File Structure

```
src/
├── services/
│   ├── character-service.ts
│   ├── dialogue-service.ts
│   └── llm-service.ts           # NEW: LLM API calls
├── components/
│   ├── chat/
│   │   └── ChatView.tsx         # UPDATE: Connect LLM
│   └── ...
├── settings-tab.ts              # UPDATE: LLM settings UI
└── types/
    └── index.ts                 # UPDATE: LLM types
```

---

## Implementation Steps

### Step 1: Update src/types/index.ts

```typescript
// ... existing types ...

// LLM API types
export interface LLMSettings {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  finishReason: string | null;
}

// OpenAI API types
export interface OpenAIRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface OpenAIStreamChunk {
  id: string;
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
    index: number;
  }>;
}
```

---

### Step 2: Create src/services/llm-service.ts

```typescript
import type {
  LLMSettings,
  ChatMessage,
  CharacterCard,
  DialogueMessageWithPath,
  OpenAIRequest,
  OpenAIStreamChunk,
} from '../types';

export class LLMService {
  constructor(private settings: LLMSettings) {}

  /**
   * Build messages array with character context
   */
  buildMessages(
    character: CharacterCard,
    dialogueHistory: DialogueMessageWithPath[]
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // System prompt with character context
    const systemPrompt = this.buildSystemPrompt(character);
    messages.push({ role: 'system', content: systemPrompt });

    // Add dialogue history
    for (const msg of dialogueHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return messages;
  }

  /**
   * Send message with streaming response
   */
  async sendMessage(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const { baseUrl, apiKey, modelName } = this.settings;

    if (!apiKey) {
      throw new Error('API key not configured. Check plugin settings.');
    }

    const url = this.normalizeBaseUrl(baseUrl) + '/chat/completions';

    const body: OpenAIRequest = {
      model: modelName,
      messages,
      stream: true,
      temperature: 0.8,
      max_tokens: 2048,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    return this.parseSSEStream(response.body, onChunk);
  }

  /**
   * Send message without streaming (for simple cases)
   */
  async sendMessageSync(messages: ChatMessage[]): Promise<string> {
    const { baseUrl, apiKey, modelName } = this.settings;

    if (!apiKey) {
      throw new Error('API key not configured. Check plugin settings.');
    }

    const url = this.normalizeBaseUrl(baseUrl) + '/chat/completions';

    const body: OpenAIRequest = {
      model: modelName,
      messages,
      stream: false,
      temperature: 0.8,
      max_tokens: 2048,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  // --- Private helpers ---

  private buildSystemPrompt(character: CharacterCard): string {
    const parts: string[] = [];

    parts.push(`You are ${character.name}.`);

    if (character.description) {
      parts.push(`\nDescription: ${character.description}`);
    }

    if (character.personality) {
      parts.push(`\nPersonality: ${character.personality}`);
    }

    if (character.scenario) {
      parts.push(`\nScenario: ${character.scenario}`);
    }

    parts.push('\n\nStay in character and respond naturally.');

    return parts.join('');
  }

  private normalizeBaseUrl(url: string): string {
    // Remove trailing slash
    return url.replace(/\/+$/, '');
  }

  private async parseSSEStream(
    body: ReadableStream<Uint8Array>,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();

          // Skip empty lines and comments
          if (!trimmed || trimmed.startsWith(':')) continue;

          // Handle data lines
          if (trimmed.startsWith('data:')) {
            const data = trimmed.slice(5).trim();

            // Check for stream end
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed: OpenAIStreamChunk = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;

              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              // Skip malformed JSON
              console.warn('Failed to parse SSE chunk:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }
}
```

---

### Step 3: Update src/settings-tab.ts

```typescript
import { App, PluginSettingTab, Setting } from 'obsidian';
import type MianixRoleplayPlugin from './main';

export class MianixSettingTab extends PluginSettingTab {
  plugin: MianixRoleplayPlugin;

  constructor(app: App, plugin: MianixRoleplayPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Mianix Roleplay Settings' });

    // LLM Section
    containerEl.createEl('h3', { text: 'LLM Provider' });

    new Setting(containerEl)
      .setName('Base URL')
      .setDesc('OpenAI-compatible API endpoint (e.g., https://api.openai.com/v1)')
      .addText((text) =>
        text
          .setPlaceholder('https://api.openai.com/v1')
          .setValue(this.plugin.settings.llm.baseUrl)
          .onChange(async (value) => {
            this.plugin.settings.llm.baseUrl = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Your API key (stored locally in plugin data)')
      .addText((text) => {
        text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings.llm.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.llm.apiKey = value;
            await this.plugin.saveSettings();
          });
        // Make it a password field
        text.inputEl.type = 'password';
      });

    new Setting(containerEl)
      .setName('Model Name')
      .setDesc('Model to use (e.g., gpt-4-turbo, claude-3-opus)')
      .addText((text) =>
        text
          .setPlaceholder('gpt-4-turbo')
          .setValue(this.plugin.settings.llm.modelName)
          .onChange(async (value) => {
            this.plugin.settings.llm.modelName = value;
            await this.plugin.saveSettings();
          })
      );

    // Test connection button
    new Setting(containerEl)
      .setName('Test Connection')
      .setDesc('Verify API connection works')
      .addButton((button) =>
        button.setButtonText('Test').onClick(async () => {
          button.setButtonText('Testing...');
          button.setDisabled(true);

          try {
            await this.testConnection();
            button.setButtonText('Success!');
            setTimeout(() => button.setButtonText('Test'), 2000);
          } catch (e) {
            button.setButtonText('Failed');
            console.error('LLM test failed:', e);
            setTimeout(() => button.setButtonText('Test'), 2000);
          } finally {
            button.setDisabled(false);
          }
        })
      );

    // Info section
    containerEl.createEl('h3', { text: 'Security Note' });
    containerEl.createEl('p', {
      text: 'API keys are stored in your vault\'s .obsidian/plugins/mianix-roleplay/data.json file. This file is not synced by Obsidian Sync and should be added to .gitignore.',
      cls: 'setting-item-description',
    });
  }

  private async testConnection(): Promise<void> {
    const { LLMService } = await import('./services/llm-service');
    const service = new LLMService(this.plugin.settings.llm);

    // Simple test message
    const result = await service.sendMessageSync([
      { role: 'user', content: 'Say "Hello" and nothing else.' },
    ]);

    if (!result) {
      throw new Error('Empty response from API');
    }
  }
}
```

---

### Step 4: Update src/components/chat/ChatView.tsx

```tsx
import { useState } from 'react';
import { useRoleplayStore } from '../../store';
import { useApp, useSettings } from '../../context/app-context';
import { useDialogue } from '../../hooks/use-dialogue';
import { LLMService } from '../../services/llm-service';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatView() {
  const { currentCharacter } = useRoleplayStore();
  const { settings } = useSettings();
  const [isStreaming, setIsStreaming] = useState(false);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    appendAssistantMessage,
    updateMessage,
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
    // Check if LLM is configured
    if (!settings.llm.apiKey) {
      alert('Please configure your API key in plugin settings.');
      return;
    }

    // Send user message
    await sendMessage(content);

    // Create LLM service
    const llmService = new LLMService(settings.llm);

    // Build messages with new user message included
    const updatedMessages = [
      ...messages,
      { id: 'temp', role: 'user' as const, content, parentId: null, timestamp: '', filePath: '' },
    ];

    const chatMessages = llmService.buildMessages(currentCharacter, updatedMessages);

    // Create placeholder assistant message
    const placeholderMsg = await appendAssistantMessage('');
    setIsStreaming(true);

    try {
      let fullContent = '';

      await llmService.sendMessage(chatMessages, (chunk) => {
        fullContent += chunk;
        // Update message file with accumulated content
        updateMessage(placeholderMsg.filePath, fullContent);
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'LLM request failed';
      await updateMessage(
        placeholderMsg.filePath,
        `*Error: ${errorMsg}*\n\nPlease check your LLM settings and try again.`
      );
    } finally {
      setIsStreaming(false);
    }
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

      <MessageList messages={messages} isLoading={isLoading || isStreaming} />

      <MessageInput
        onSend={handleSend}
        disabled={isLoading || isStreaming}
        placeholder={
          isStreaming
            ? 'Waiting for response...'
            : 'Type a message...'
        }
      />
    </div>
  );
}
```

---

### Step 5: Update useSettings hook in context

Ensure `useSettings` is exported from context:

```tsx
// src/context/app-context.tsx
export function useSettings() {
  const { settings, saveSettings } = useApp();
  return { settings, saveSettings };
}
```

---

## Todo List

- [ ] Update src/types/index.ts with LLM types
- [ ] Create src/services/llm-service.ts
- [ ] Update src/settings-tab.ts with LLM settings UI
- [ ] Update src/components/chat/ChatView.tsx to use LLMService
- [ ] Verify useSettings hook is exported
- [ ] Rebuild: `pnpm build`
- [ ] Configure settings: Add baseUrl, apiKey, modelName
- [ ] Test: Send message, verify streaming response
- [ ] Test: Verify response saves to file
- [ ] Test: Test connection button works
- [ ] Test: Handle API errors gracefully

---

## Success Criteria

1. Settings tab shows LLM configuration fields
2. API key stored as password field
3. Test connection button verifies API access
4. Sending message triggers LLM request
5. Response streams character by character
6. Streaming indicator visible during response
7. Response persists to message file
8. API errors display in message area

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CORS issues | High | Medium | Most providers allow browser requests |
| API key exposure | High | Low | Store in data.json (gitignored) |
| Streaming parse errors | Medium | Medium | Graceful fallback, log warnings |
| Rate limiting | Medium | Medium | Show error, suggest retry |
| Large context | Medium | Medium | Limit history to last N messages |

---

## Technical Notes

### SSE Parsing

OpenAI streaming format:
```
data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"Hello"}}]}
data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":" there"}}]}
data: [DONE]
```

Key parsing rules:
- Lines prefixed with `data: `
- JSON parse each data line
- Accumulate `choices[0].delta.content`
- `[DONE]` signals end

### Provider Compatibility

Tested with:
- OpenAI API
- OpenRouter
- Together AI
- Local LLMs (Ollama, LM Studio)

Most OpenAI-compatible providers work. Key requirement: `/chat/completions` endpoint with streaming support.

### Context Window Management

For Phase 1, no truncation. Future phases should:
- Count tokens (tiktoken or approximation)
- Truncate oldest messages when approaching limit
- Keep system prompt and last N exchanges

---

## Verification Steps

```bash
# 1. Build
pnpm build

# 2. Reload plugin in Obsidian

# 3. Configure settings
# - Set baseUrl: https://api.openai.com/v1
# - Set apiKey: sk-...
# - Set modelName: gpt-4-turbo

# 4. Test connection
# Click "Test" button, verify "Success!"

# 5. Chat test
# - Create/select character
# - Send message
# - Verify streaming response appears
# - Check message files created in vault
```

---

## Phase 1 Complete

After this phase, the plugin provides:
- Plugin boilerplate with React 18
- Character card management (CRUD)
- Basic chat interface with message history
- Single LLM provider with streaming

### Next: Phase 2 Features
- Message branching (tree navigation)
- Multi-provider LLM support
- Message editing/regeneration
- Token tracking
