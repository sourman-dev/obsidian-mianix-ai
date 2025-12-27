# Phase 1: Lorebook System

**Effort:** 5h | **Priority:** P1 | **Status:** completed
**Reviewed:** 2025-12-27 | **Report:** [code-reviewer-251227-1957-lorebook-phase1.md](../reports/code-reviewer-251227-1957-lorebook-phase1.md)

## Context

- [Research: Lorebook Systems](./research/researcher-01-lorebook-systems.md)
- [Main Plan](./plan.md)

## Overview

Implement keyword-triggered lorebook system with two scopes:
1. **Private (Embedded)** - Per-character entries in `card.md` body
2. **Shared (Global)** - Reusable entries in `tale-vault/lorebooks/`

## Key Insights from Research

- SillyTavern uses keyword-indexed entries with content field
- Position in context affects response strength (after char = stronger)
- "Always active" toggle for constant entries vs conditional trigger
- Scan depth controls how many messages to check for keywords
- Keep entries concise to preserve token budget

## Requirements

### Functional
1. Parse lorebook entries from character card body (`## Lorebook` section)
2. Load shared lorebooks from `tale-vault/lorebooks/*.md`
3. Match keywords against recent messages (configurable scan depth)
4. Inject matched entries into LLM context before character definition
5. UI to view/edit lorebook entries in character settings

### Non-Functional
- Max 5 active entries per request (prevent context bloat)
- Case-insensitive keyword matching
- Support regex patterns (optional, advanced)

## Architecture

### Storage Format

**Private (in card.md body):**
```markdown
## Lorebook

### [Sunken Cathedral]
- keys: sunken cathedral, underwater temple
- always_active: false
- order: 100

A vast underwater structure from the ancient era...

### [Dragon Blood]
- keys: dragon blood, dragonkin
- always_active: true
- order: 50

Characters with dragon blood can sense magic...
```

**Shared (lorebooks/{slug}.md):**
```yaml
---
name: "Fantasy World"
description: "Common fantasy worldbuilding elements"
---

## Lorebook

### [Magic System]
- keys: magic, spell, enchant
- always_active: false

Magic in this world requires...
```

### Types

```typescript
// src/types/lorebook.ts
interface LorebookEntry {
  id: string;
  name: string;           // Entry title
  keys: string[];         // Trigger keywords
  content: string;        // Content to inject
  alwaysActive: boolean;  // Always include in context
  order: number;          // Insertion priority (higher = later)
  enabled: boolean;       // Toggle on/off
}

interface Lorebook {
  id: string;
  name: string;
  description?: string;
  scope: 'private' | 'shared';
  entries: LorebookEntry[];
  sourcePath: string;     // File path for persistence
}
```

### Service Layer

```typescript
// src/services/lorebook-service.ts
class LorebookService {
  constructor(app: App) {}

  // Load private lorebook from character card.md
  async loadPrivate(characterFolderPath: string): Promise<Lorebook | null>

  // Load all shared lorebooks
  async loadShared(): Promise<Lorebook[]>

  // Get active entries for context injection
  async getActiveEntries(
    characterFolderPath: string,
    recentMessages: string[],  // Last N messages for keyword scan
    scanDepth: number          // How many messages to scan
  ): Promise<LorebookEntry[]>

  // Save private lorebook to card.md
  async savePrivate(characterFolderPath: string, entries: LorebookEntry[]): Promise<void>

  // Create/update shared lorebook
  async saveShared(lorebook: Lorebook): Promise<void>
}
```

### Integration Points

1. **LLM Service** - Inject lorebook entries before character definition
2. **Character Service** - Parse lorebook section when loading card
3. **Settings** - Configure scan depth (default: 5 messages)

## Related Files

| File | Action |
|------|--------|
| `src/types/lorebook.ts` | Create |
| `src/services/lorebook-service.ts` | Create |
| `src/services/llm-service.ts` | Modify - inject lorebook context |
| `src/services/character-service.ts` | Modify - parse lorebook from card |
| `src/constants.ts` | Add `LOREBOOKS_FOLDER` |
| `src/types/index.ts` | Add lorebook settings |

## Implementation Steps

### Step 1: Types & Constants (30m)
- [x] Create `src/types/lorebook.ts` with interfaces
- [x] Add `LOREBOOKS_FOLDER = 'tale-vault/lorebooks'` to constants
- [x] Add `lorebookScanDepth: number` to settings interface

### Step 2: Lorebook Parser (1h)
- [x] Create utility to parse `## Lorebook` section from markdown
- [x] Parse entry format: `### [Name]` with metadata list and content
- [x] Handle both private (card body) and shared (separate file) formats

### Step 3: LorebookService (1.5h)
- [x] Implement `loadPrivate()` - extract from card.md body
- [x] Implement `loadShared()` - scan lorebooks folder
- [x] Implement `getActiveEntries()` with keyword matching
- [x] Implement `savePrivate()` - update card.md body
- [x] Implement `saveShared()` - write to lorebooks folder

### Step 4: LLM Integration (1h)
- [x] Modify `llm-service.ts` to call lorebook service
- [x] Inject entries into system prompt (before character)
- [x] Format entries for LLM consumption
- [x] Add setting for scan depth

### Step 5: UI Components (1h)
- [ ] Add lorebook section to character edit modal *(deferred to Phase 2)*
- [ ] Entry list with enable/disable toggle *(deferred to Phase 2)*
- [ ] Simple entry editor (name, keys, content) *(deferred to Phase 2)*
- [x] Display active entries indicator in chat

## Todo List

```
[ ] Create types/lorebook.ts
[ ] Add LOREBOOKS_FOLDER constant
[ ] Create lorebook parser utility
[ ] Implement LorebookService
[ ] Integrate with LLM service
[ ] Add scan depth setting
[ ] Create lorebook UI component
[ ] Test keyword matching
[ ] Test context injection
```

## Success Criteria

- [x] Private entries load from character card
- [x] Shared entries load from lorebooks folder
- [x] Keywords trigger entry injection
- [x] "Always active" entries always inject
- [x] Order value controls insertion sequence
- [x] UI shows active entry count
- [x] Settings control scan depth

**All criteria met ✅** - See [code review report](../reports/code-reviewer-251227-1957-lorebook-phase1.md)

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Context overflow | High | Medium | Limit to 5 active entries |
| Performance on large lorebooks | Medium | Low | Index keywords, lazy load |
| Parser edge cases | Low | Medium | Comprehensive tests |

## Security Considerations

- Sanitize lorebook content before LLM injection
- No code execution from lorebook entries
- Validate file paths for shared lorebooks

## Next Steps

After lorebook system works:
→ Phase 2: Stats & NPC System (can use lorebook for NPC entries)
