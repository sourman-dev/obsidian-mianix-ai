---
title: "Obsidian Roleplay Plugin - Phase 1 Core Foundation"
description: "Build plugin boilerplate, React views, character CRUD, chat interface, single LLM provider"
status: in_progress
priority: P1
effort: 20h
branch: kai/feat/obsidian-roleplay-phase1
tags: [obsidian, plugin, react, roleplay, llm]
created: 2024-12-25
updated: 2024-12-25T18:49:00Z
---

# Obsidian Roleplay Plugin - Phase 1: Core Foundation

## Executive Summary

Migrate mianix-userscript roleplay features to Obsidian plugin. Phase 1 establishes core foundation: plugin boilerplate, React integration, character management, basic chat, single LLM provider.

**Problem:** Current userscript causes RAM issues on iOS Safari (50+ messages = lag). File-based Obsidian storage solves memory overhead.

**Solution:** Obsidian plugin with markdown storage, React UI, Zustand state, OpenAI-compatible LLM.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Obsidian Plugin Shell                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ RoleplayView │  │ SettingsTab  │  │   Ribbon Icon        │  │
│  │ (ItemView)   │  │              │  │                      │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘  │
│         │                                                       │
│  ┌──────▼───────────────────────────────────────────────────┐  │
│  │                    React 18 Root                          │  │
│  │  ┌────────────────┐  ┌────────────────┐                  │  │
│  │  │ CharacterList  │  │   ChatView     │                  │  │
│  │  │                │  │                │                  │  │
│  │  └───────┬────────┘  └───────┬────────┘                  │  │
│  │          │                   │                            │  │
│  │  ┌───────▼───────────────────▼────────────────────────┐  │  │
│  │  │              Zustand Store                          │  │  │
│  │  │  currentChar | messages | llmConfig                 │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Services Layer                         │  │
│  │  CharacterService  │  DialogueService  │  LLMService      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼──────────────────────────────┐  │
│  │                  Obsidian Vault API                       │  │
│  │  create() | read() | modify() | trash() | getFiles()     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Storage Structure

```
vault/
├── characters/
│   └── {slug}/
│       ├── card.md              # Character profile (frontmatter YAML)
│       └── dialogues/
│           └── {date}/
│               └── messages/
│                   ├── 001.md   # Individual message
│                   ├── 002.md
│                   └── ...
└── .obsidian/plugins/mianix-roleplay/
    └── data.json                # LLM settings, API keys
```

---

## Phase Breakdown

| Phase | Title | Effort | Dependencies |
|-------|-------|--------|--------------|
| [Phase 1](./phase-01-plugin-setup.md) | Plugin Setup | 3h | None |
| [Phase 2](./phase-02-react-views.md) | React Views | 4h | Phase 1 |
| [Phase 3](./phase-03-character-crud.md) | Character CRUD | 5h | Phase 2 |
| [Phase 4](./phase-04-chat-interface.md) | Chat Interface | 5h | Phase 3 |
| [Phase 5](./phase-05-llm-integration.md) | LLM Integration | 3h | Phase 4 |

**Total Effort:** ~20 hours

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Plugin | Obsidian API | Native integration |
| UI | React 18 | Obsidian-supported, hooks |
| State | Zustand | Lightweight, no boilerplate |
| Build | esbuild | Fast, simple config |
| Types | TypeScript strict | Type safety |
| Parsing | gray-matter | Frontmatter extraction |

---

## Key Data Models

### CharacterCard (card.md frontmatter)

```yaml
---
id: "uuid-v4"
name: "Alice"
description: "A curious adventurer..."
personality: "Friendly, witty, brave"
scenario: "Fantasy world setting"
firstMessage: "*waves* Hello traveler!"
createdAt: "2024-12-25T16:00:00Z"
---

# Additional Notes (optional body)
```

### DialogueMessage (messages/001.md)

```yaml
---
id: "msg-001"
role: "user" | "assistant"
parentId: null | "msg-000"
timestamp: "2024-12-25T16:05:00Z"
---

Message content here...
```

### LLMSettings (data.json)

```json
{
  "llm": {
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-...",
    "modelName": "gpt-4-turbo"
  }
}
```

---

## Success Criteria

1. Plugin loads in Obsidian without errors
2. React view renders in sidebar
3. Create/read/update/delete character cards
4. Send message, display streaming response
5. Messages persist as markdown files
6. Settings tab configures LLM provider

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| React 18 compatibility | High | Use createRoot pattern from docs |
| File I/O performance | Medium | Lazy load, cache active dialogue |
| Mobile Obsidian | Medium | Test early on iOS |
| API key security | High | Use plugin data.json (gitignored) |

---

## Dependencies

- Node.js 18+
- Obsidian 1.0.0+
- pnpm (package manager)

---

## References

- [Research: Obsidian Plugin API](./research/researcher-obsidian-plugin-api.md)
- [Research: Userscript Models](./research/researcher-userscript-models.md)
- [Brainstorm: Migration Architecture](../reports/brainstorm-251225-1643-userscript-to-obsidian-migration.md)

---

## Validation Summary

**Validated:** 2024-12-25
**Questions asked:** 6

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| Frontmatter parsing | gray-matter (npm) |
| Characters folder | `characters/` at vault root |
| Package manager | pnpm |
| Styling approach | Vanilla CSS with Obsidian vars |
| API key storage | Plain text in data.json |
| View position | Right sidebar |

### Resolved Questions

1. ✅ gray-matter confirmed for frontmatter parsing
2. ⏳ Hot reload setup - will configure in Phase 1
3. ⏳ Mobile I/O performance - test after MVP

---

## Remaining Questions

1. Hot reload dev setup details
2. Mobile file I/O performance validation
