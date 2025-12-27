---
title: "Lorebook, Character Stats & Dice Roll System"
description: "Add lorebook (private/shared), character stats, NPC extraction, and dice roll mechanics to TaleVault AI"
status: in_progress
priority: P2
effort: 16h
branch: master
tags: [lorebook, stats, dice, npc, extraction]
created: 2025-12-27
---

# Lorebook, Character Stats & Dice Roll System

## Overview

Implement a comprehensive RPG-like system for TaleVault AI enabling:
1. **Lorebook** - Keyword-triggered world info (private per-character + shared global)
2. **Character Stats** - Per-character stat tracking with per-turn updates
3. **NPC Extraction** - LLM-based extraction of NPCs from character cards at import
4. **Dice Rolls** - Standard notation parsing with stat-based modifiers

## Architecture Summary

```
tale-vault/
├── lorebooks/               # Shared lorebooks (new)
│   └── {slug}.md            # Shared lorebook entries
├── character-cards/
│   └── {slug}/
│       ├── card.md          # + lorebook entries in body
│       ├── stats.json       # Character stats (new)
│       ├── characters/      # NPCs extracted from card (new)
│       │   └── {npc-slug}.md
│       └── messages/
```

## Phases

| Phase | Focus | Effort | Link |
|-------|-------|--------|------|
| 1 | Lorebook System | 5h | [phase-01-lorebook-system.md](./phase-01-lorebook-system.md) |
| 2 | Stats & NPCs | 6h | [phase-02-stats-npc-system.md](./phase-02-stats-npc-system.md) |
| 3 | Dice Roll Mechanics | 3h | [phase-03-dice-roll-mechanics.md](./phase-03-dice-roll-mechanics.md) |
| 4 | Per-turn Updates | 2h | [phase-04-per-turn-updates.md](./phase-04-per-turn-updates.md) |

## Key Design Decisions (Validated)

1. **Private lorebook** - Embedded in `card.md` body as `## Lorebook` section ✓
2. **Shared lorebook** - Separate folder `tale-vault/lorebooks/` (reusable)
3. **Stats schema** - D&D 6 base (STR/DEX/CON/INT/WIS/CHA) + `customStats` object ✓
4. **NPC extraction** - Toggle at import + re-extract button in character settings ✓
5. **Per-turn updates** - OFF by default (opt-in), async post-message hook ✓
6. **Dice notation** - `[[1d20+STR]]` inline double-bracket format ✓

## Dependencies

- Existing: CharacterService, DialogueService, MemoryExtractionService, BM25
- New: LorebookService, StatsService, DiceService, NPCExtractionService

## Progress

| Phase | Status | Completed |
|-------|--------|-----------|
| 1 - Lorebook System | ✅ Done | 2025-12-27 |
| 2 - Stats & NPCs | ✅ Done | 2025-12-27 |
| 3 - Dice Roll Mechanics | Pending | - |
| 4 - Per-turn Updates | Pending | - |

## Success Criteria

- [x] Lorebook entries trigger on keyword match in chat *(Phase 1)*
- [x] Stats persist and display in UI *(Phase 2)*
- [x] NPCs extracted at import (if enabled) *(Phase 2)*
- [ ] Dice rolls parse and show inline results
- [ ] Stats update after each turn (async)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Context bloat from lorebook | High | Limit active entries, scan depth |
| LLM cost for NPC extraction | Medium | Make extraction optional, use cheap model |
| Stats schema evolution | Low | Version in JSON, migration utility |
