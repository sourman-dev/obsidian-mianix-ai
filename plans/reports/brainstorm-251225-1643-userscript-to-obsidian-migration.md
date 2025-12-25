# Brainstorm Report: Userscript to Obsidian Plugin Migration

**Date:** 2024-12-25
**Status:** Consensus Reached
**Participants:** User, AI Brainstormer

---

## Problem Statement

Current mianix-userscript (Vue 3 + Tampermonkey) experiences RAM issues on iPhone Safari:
- ~50+ LLM responses cause lag/jitter during input
- IndexedDB stores hidden messages but still consumes memory
- Only 10 messages displayed, rest hidden but not garbage collected

**Goal:** Convert roleplay-ai userscript to Obsidian plugin to:
1. Leverage file-based storage (no IndexedDB memory overhead)
2. Each vault/folder = character card dialogue
3. LLM responses = ordered markdown files
4. Native Obsidian features (search, graph, links)

---

## Source Analysis: Mianix Userscript

### Tech Stack (Current)
| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 + Composition API |
| State | Pinia + persistence plugin |
| Storage | SignalDB + IndexedDB + Greasemonkey |
| UI | PrimeVue + Tailwind CSS |
| Build | Vite + vite-plugin-monkey |
| Features | RAG memory, worldbook, token tracking, multi-model |

### Key Data Models
- **CharacterCards:** Profile, worldbook, linked globals
- **DialogueMessages:** Tree structure (parentId), token stats
- **Memories:** Embeddings for RAG semantic search
- **LLMModels:** Provider configs, API keys

### Source LOC: ~10,230 (Vue + TS)

---

## Target: Obsidian Plugin

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Framework | React | Obsidian-supported, large ecosystem, similar to Vue concepts |
| State Mgmt | Zustand/Jotai | Lightweight, React-native |
| Storage | Hybrid | Markdown for content, JSON for embeddings |
| LLM API | Direct fetch | Browser APIs available in Electron |

### Storage Structure (Hybrid Approach)

```
vault/
├── characters/
│   └── {character-name}/
│       ├── card.md                 # Character profile (frontmatter)
│       ├── worldbook.md            # Lore entries
│       └── dialogues/
│           └── {date}-{session}/
│               ├── _meta.json      # Tree structure, aggregate stats
│               └── messages/
│                   ├── 001.md      # Message with frontmatter
│                   ├── 002.md
│                   └── ...
├── _embeddings/                     # RAG vectors (JSON)
│   └── {character-name}.json
└── .obsidian/plugins/mianix-roleplay/
    └── data.json                   # Plugin settings, LLM configs
```

### Message Markdown Format

```markdown
---
id: "msg-001"
role: "assistant"
model: "claude-3-5-sonnet"
tokens:
  input: 1234
  output: 567
cost_usd: 0.0089
parent_id: "msg-000"
timestamp: 2024-12-25T16:00:00Z
---

*Cô gái nhìn bạn với đôi mắt đầy tò mò...*

"Chào bạn, tôi là Alice."
```

---

## Migration Strategy: Phased Approach

### Phase 1: Core Foundation
- Obsidian plugin boilerplate (manifest, main.ts)
- React view integration
- Character card CRUD (markdown files)
- Basic chat interface
- Single LLM provider support

### Phase 2: Chat Enhancement
- Message tree structure (branching)
- Multi-provider LLM support
- Streaming responses
- Message editing/regeneration

### Phase 3: Worldbook System
- Worldbook editor UI
- Selective injection (keyword matching)
- Global worldbooks (shared across characters)

### Phase 4: RAG Memory
- Embedding generation (via LLM)
- Semantic search implementation
- Memory extraction from responses
- Vector storage in JSON

### Phase 5: Analytics
- Token tracking per message
- Cost calculation (Helicone integration)
- Daily/weekly/monthly aggregates
- Dashboard UI

---

## Pros & Cons Analysis

### Pros of Migration
1. **Memory efficiency:** File-based storage, no IndexedDB bloat
2. **Native features:** Obsidian search, graph view, backlinks
3. **Version control:** Git-friendly markdown files
4. **Cross-device:** Obsidian Sync or iCloud
5. **Extensibility:** Plugin ecosystem, community support
6. **Desktop + Mobile:** Obsidian apps for all platforms

### Cons of Migration
1. **Development effort:** Significant rewrite (Vue → React)
2. **Feature parity:** Multiple phases to match current features
3. **File I/O overhead:** Reading/writing markdown vs IndexedDB
4. **Learning curve:** Obsidian plugin API

### Risk Mitigation
- Phased approach reduces scope per iteration
- Core features first, advanced features later
- Reuse business logic patterns from userscript

---

## Technical Mapping: Vue → React

| Vue Concept | React Equivalent |
|-------------|------------------|
| Composition API | Hooks (useState, useEffect) |
| Pinia store | Zustand/Jotai store |
| `<script setup>` | Function component |
| `ref()` / `reactive()` | `useState()` |
| `computed()` | `useMemo()` |
| `watch()` | `useEffect()` |
| `v-model` | Controlled input |
| `v-for` | `.map()` |
| `v-if` | Conditional rendering |
| PrimeVue | PrimeReact / Radix UI |

### Reusable Code (Patterns Only)
- LLM fetch logic (OpenAI-compatible format)
- Token extraction algorithms
- Pricing calculation formulas
- Worldbook retrieval logic
- RAG similarity scoring

---

## Implementation Considerations

### Obsidian Plugin Requirements
- `manifest.json` with plugin metadata
- `main.ts` entry point extending `Plugin`
- React views via `ItemView` or modal
- Settings tab for LLM configs
- Ribbon icon for quick access

### State Management
```typescript
// Zustand store example
const useDialogueStore = create((set) => ({
  currentCharacter: null,
  messages: [],
  setCharacter: (char) => set({ currentCharacter: char }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
}));
```

### File Operations
```typescript
// Obsidian Vault API
const file = await this.app.vault.create(path, content);
const content = await this.app.vault.read(file);
await this.app.vault.modify(file, newContent);
```

---

## Success Metrics

1. **Memory usage:** <50MB for 100+ messages (vs current RAM issues)
2. **Load time:** <2s to display last 10 messages
3. **Feature parity:** All P1-P3 features within first release
4. **User experience:** Smooth input without lag on mobile
5. **Maintainability:** Modular codebase, typed with TypeScript

---

## Next Steps

1. ✅ Architecture consensus reached
2. ⏳ Create detailed implementation plan (Phase 1)
3. ⏳ Set up Obsidian plugin boilerplate
4. ⏳ Implement character card management
5. ⏳ Build basic chat interface

---

## Unresolved Questions

1. **Obsidian Mobile:** Need to verify file I/O performance on iOS Obsidian app
2. **Sync conflicts:** How to handle concurrent edits (Obsidian Sync)
3. **Migration tool:** Should we build a userscript → plugin data migrator?
4. **Embedding model:** Which default embedding model for RAG?

---

**Recommendation:** Proceed with Phase 1 implementation using the hybrid storage architecture. Start with Obsidian plugin boilerplate + React views + character card CRUD.
