# Mianix-Userscript Data Models & Patterns

## 1. Character Card Data Model

**CharacterCardData** (normalized camelCase interface):
```typescript
{
  name: string
  description: string
  personality: string
  scenario: string
  firstMessage: string
  messageExamples: string
  alternateGreetings: string[]
  creatorNotes?: string
  tags?: string[]
  creator?: string
  worldBook: WorldBookEntry[]
}
```

**CharacterCardType** (DB storage wrapper):
```typescript
{
  id: string
  data: Partial<CharacterCardData>
  dataTranslated?: Partial<CharacterCardData>
  isUseTranslated: boolean
  isNSFW?: boolean
  createdAt: number
  linkedGlobalWorldbooks?: string[]
}
```

Stored via SignalDB with IndexedDB persistence. Supports multi-language with fallback merge via `mergeObjects()`.

---

## 2. Dialogue & Message Tree Structure

**DialogueMessageType** (tree node):
```typescript
{
  id: string
  dialogueId: string
  parentId: string | null        // Tree navigation: null = root
  userInput: string
  assistantResponse: string
  status: "pending" | "completed" | "failed"
  tokenStats?: TokenUsageStats
  parsedContent?: ParsedResponse  // Regex results, next prompts
  createdAt: number
}
```

**DialogType** (conversation container):
```typescript
{
  id: string
  createdAt: number
  currentNodeId: string           // Current position in message tree
  profileId?: string              // User profile reference
  llmOptions: LLMOptions         // Temperature, maxTokens, streaming flag
}
```

**Key Pattern**: Messages form a tree with `parentId` branching. `currentNodeId` tracks active exploration path. Supports non-linear dialogue replays.

---

## 3. LLM Fetch Pattern (OpenAI-Compatible)

**OpenAIRequest**:
```typescript
{
  model: string
  messages: { role: string; content: string }[]
  stream: boolean
  maxTokens?: number
  temperature?: number
  top_p?: number
}
```

**OpenAIOptions**:
```typescript
{
  baseURL: string                    // Normalized: ensures trailing /
  apiKey: string
  data: OpenAIRequest
  stream?: boolean
  provider?: string                  // "OPENAI", "ANTHROPIC" etc
  pricingReferenceModel?: string    // Helicone model ID override
}
```

**Core Functions**:
- `sendOpenAiRequestFetch(options, onChunk?)`: Native Fetch with SSE streaming support
  - Non-streaming: extracts `data.choices[0].message.content`
  - Streaming: parses `data: JSON` lines, captures delta chunks, extracts token stats from final chunk
- `sendOpenAiRequestFetchSync()`: Promise<LLMResponse> helper
- `testCORS(baseURL, apiKey)`: Validates provider CORS support

**Token Tracking**: Integrated via `TokenTrackingService.extractTokenUsage()` with per-provider pricing models.

---

## 4. World Book & Memory Systems

**WorldBookEntry** (knowledge injection):
```typescript
{
  keys: string[]              // Trigger keywords
  content: string
  comment?: string
  enabled?: boolean
  position?: 'before_char' | 'after_char' | 'before_input' | 'after_input'
  insertionOrder?: number
  selective?: boolean         // Activate on keyword match
  constant?: boolean          // Always include if enabled
  useRegex?: boolean
  embedding?: number[]        // RAG semantic vector
}
```

**MemoryEntryType** (dynamic recall):
```typescript
{
  id: string
  characterId: string
  content: string
  type: "fact" | "event" | "preference" | "relationship"
  tags: string[]
  importance: number          // 0-1 scale
  embedding: number[]         // Vector for similarity search
  relatedMessageId?: string   // Link to message that created it
  createdAt: number
  lastAccessed: number
}
```

---

## 5. User Profile & LLM Model Config

**UserProfileType** (player character):
```typescript
{
  id: string
  name: string               // {{user}} placeholder replacement
  appearance?: string
  personality?: string
  background?: string
  currentStatus?: string     // Dynamic state
  inventory?: string[]
  createdAt: number
}
```

**LLMModel** (provider configuration):
```typescript
{
  id: string
  name: string
  apiKey: string
  baseUrl: string
  modelName: string          // e.g. "gpt-4-turbo"
  llmProvider: string        // "OPENAI", "CLAUDE", "DEEPSEEK"
  isDefault: boolean
  modelType: 'chat' | 'embedding' | 'extraction'
  createdAt: number
  pricingReferenceModel?: string
}
```

---

## 6. Storage & Collection Pattern

All data persists via **SignalDB** with adapters:
- **IndexedDBAdapter**: Large data (DialogueMessages, Memories, DailyTokenStats)
- **MonkeyAdapter**: Config data (CharacterCards, UserProfiles, LLMModels)
- **Vue Reactivity**: Real-time UI binding

Default user profile created on first load (Roger persona).

---

## 7. Critical Migration Points

1. **Message Tree Navigation**: Use `parentId` + `currentNodeId` to rebuild dialogue history
2. **Token Tracking**: `TokenUsageStats` extracted per-request; pre-aggregated into Daily/Weekly/Monthly stats
3. **Streaming**: SSE parser expects `data: {...}` format; final chunk contains usage metadata
4. **RAG Embeddings**: `embedding` fields support semantic search; optional but recommended
5. **Multi-language**: `dataTranslated` merges with `data` when `isUseTranslated=true`

---

## 8. Type Definitions to Reuse

Export from userscript:
```typescript
export type {
  CharacterCardData,
  CharacterCardType,
  DialogueMessageType,
  DialogType,
  UserProfileType,
  LLMModel,
  WorldBookEntry,
  MemoryEntryType,
  OpenAIRequest,
  OpenAIOptions,
  LLMResponse
}
```

**Key utility**: `TokenTrackingService` for provider-agnostic cost calculation with Helicone pricing API.

---

## Unresolved Questions

- How are regex scripts (`regexScripts` from SillyTavern extension) currently handled?
- Is token pricing lookup real-time or cached?
- What is the `ParsedResponse` structure (regex results, next prompts)?
