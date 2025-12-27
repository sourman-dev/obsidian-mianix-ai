# Phase 2: Stats & NPC System

**Effort:** 6h | **Priority:** P1 | **Status:** ✅ complete (with minor fixes needed)

## Context

- [Research: Lorebook Systems](./research/researcher-01-lorebook-systems.md)
- [Phase 1: Lorebook System](./phase-01-lorebook-system.md)
- [Main Plan](./plan.md)

## Overview

Implement character stats tracking and NPC extraction system:
1. **Stats** - Structured JSON per-character with common RPG attributes
2. **NPC Extraction** - Optional LLM-based extraction from character cards at import
3. **NPC Files** - Extracted NPCs stored as markdown in character's `/characters/` folder

## Key Insights from Research

- Stats work best within first 3200 chars of definition
- Common attributes: STR, DEX, CON, INT, WIS, CHA + derived (HP, mana)
- Pre-load method: Tell AI to load stats first → higher accuracy
- JSON format recognized by most AI platforms
- External tracking scales better for complex games

## Requirements

### Stats System
1. Store stats in `{character}/stats.json`
2. Support common RPG stats (STR, DEX, CON, INT, WIS, CHA)
3. Support custom stats (user-defined)
4. Track HP, conditions, inventory (extensible)
5. Display stats in character panel
6. Stats available in LLM context

### NPC Extraction
1. Toggle at import time: "Extract NPCs from card"
2. LLM analyzes character description for mentioned NPCs
3. Creates `{character}/characters/{npc-slug}.md` for each NPC
4. Each NPC gets basic stats template
5. NPCs link back to main character

## Architecture

### Storage Format

**stats.json:**
```json
{
  "version": 1,
  "baseStats": {
    "strength": 14,
    "dexterity": 12,
    "constitution": 13,
    "intelligence": 10,
    "wisdom": 11,
    "charisma": 16
  },
  "derivedStats": {
    "hp": { "current": 45, "max": 50 },
    "mp": { "current": 20, "max": 20 }
  },
  "conditions": [],
  "customStats": {},
  "lastUpdated": "2025-12-27T10:00:00Z"
}
```

**NPC file (characters/{slug}.md):**
```yaml
---
id: npc-uuid
name: "Guard Captain Marcus"
role: "ally"
extractedFrom: "main-character-id"
createdAt: "2025-12-27T10:00:00Z"
---

## Description
A stern but fair guard captain who...

## Stats
- Strength: 15
- Constitution: 14

## Relationship
Allied with the main character since...
```

### Types

```typescript
// src/types/stats.ts
interface BaseStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface ResourceStat {
  current: number;
  max: number;
}

interface CharacterStats {
  version: number;
  baseStats: BaseStats;
  derivedStats: {
    hp: ResourceStat;
    mp?: ResourceStat;
    [key: string]: ResourceStat | undefined;
  };
  conditions: string[];           // ["poisoned", "exhausted"]
  customStats: Record<string, number>;
  lastUpdated: string;
}

interface NPCCharacter {
  id: string;
  name: string;
  role: 'ally' | 'enemy' | 'neutral' | 'unknown';
  description: string;
  stats?: Partial<BaseStats>;
  relationship?: string;
  extractedFrom: string;          // Parent character ID
  createdAt: string;
}
```

### Service Layer

```typescript
// src/services/stats-service.ts
class StatsService {
  constructor(app: App) {}

  // Load stats for character
  async loadStats(characterFolderPath: string): Promise<CharacterStats | null>

  // Save stats
  async saveStats(characterFolderPath: string, stats: CharacterStats): Promise<void>

  // Calculate modifier (D&D style: (stat - 10) / 2)
  getModifier(statValue: number): number

  // Get stats formatted for LLM context
  formatForContext(stats: CharacterStats): string

  // Update single stat
  async updateStat(
    characterFolderPath: string,
    path: string,           // e.g., "baseStats.strength" or "derivedStats.hp.current"
    value: number
  ): Promise<void>

  // Apply condition
  async addCondition(characterFolderPath: string, condition: string): Promise<void>
  async removeCondition(characterFolderPath: string, condition: string): Promise<void>
}

// src/services/npc-extraction-service.ts
class NPCExtractionService {
  constructor(app: App, settings: MianixSettings) {}

  // Extract NPCs from character description
  async extractNPCs(
    characterDescription: string,
    characterId: string
  ): Promise<NPCCharacter[]>

  // Save extracted NPCs to character folder
  async saveNPCs(
    characterFolderPath: string,
    npcs: NPCCharacter[]
  ): Promise<void>

  // Load NPCs for character
  async loadNPCs(characterFolderPath: string): Promise<NPCCharacter[]>
}
```

### NPC Extraction Prompt

```
Analyze this character description and extract any named NPCs (Non-Player Characters) mentioned.

Character Description:
{description}

For each NPC found, provide:
1. Name
2. Role (ally/enemy/neutral/unknown)
3. Brief description (1-2 sentences)
4. Relationship to main character
5. Any stats mentioned (strength, intelligence, etc.)

Return JSON array:
[{"name": "...", "role": "...", "description": "...", "relationship": "...", "stats": {...}}]

If no NPCs found, return: []
```

## Related Files

| File | Action |
|------|--------|
| `src/types/stats.ts` | Create |
| `src/services/stats-service.ts` | Create |
| `src/services/npc-extraction-service.ts` | Create |
| `src/services/character-service.ts` | Modify - add NPC extraction option |
| `src/types/index.ts` | Export stats types |
| `src/components/StatsPanel.tsx` | Create |

## Implementation Steps

### Step 1: Stats Types & Service (1.5h)
- [ ] Create `src/types/stats.ts` with interfaces
- [ ] Implement `StatsService.loadStats()` and `saveStats()`
- [ ] Implement `getModifier()` for D&D-style modifiers
- [ ] Implement `formatForContext()` for LLM injection
- [ ] Implement stat update methods

### Step 2: Stats UI Component (1h)
- [ ] Create `StatsPanel.tsx` component
- [ ] Display base stats with modifiers
- [ ] Display HP/MP bars
- [ ] Show conditions as badges
- [ ] Edit mode for stat adjustments

### Step 3: NPC Extraction Service (1.5h)
- [ ] Create `NPCExtractionService`
- [ ] Implement extraction prompt
- [ ] Parse LLM response to NPCCharacter[]
- [ ] Handle edge cases (no NPCs, malformed response)
- [ ] Use extraction model (cheap/fast)

### Step 4: NPC Storage & Loading (1h)
- [ ] Create `/characters/` folder structure
- [ ] Implement `saveNPCs()` with markdown format
- [ ] Implement `loadNPCs()` from folder
- [ ] Link NPCs to parent character

### Step 5: Import Integration (1h)
- [ ] Add "Extract NPCs" toggle to import modal
- [ ] Call extraction after character import
- [ ] Show extraction progress/results
- [ ] Initialize default stats.json on import

## Todo List

```
[x] Create types/stats.ts
[x] Implement StatsService
[x] Create StatsPanel component
[x] Implement NPCExtractionService
[x] Add NPC storage methods
[x] Add import toggle for NPC extraction
[x] Initialize stats.json on import
[x] Test stat modifier calculation
[x] Test NPC extraction with various cards
[x] Test NPC file creation
[ ] P1: Add prompt input sanitization (Finding #1)
[ ] P1: Fix NaN handling in number inputs (Finding #2)
[ ] P1: Fix useEffect race condition (Finding #3)
```

## Success Criteria

- [x] stats.json created on character import
- [x] Stats load and display in UI
- [x] Stats included in LLM context
- [x] NPC extraction toggle works at import
- [x] NPCs saved as markdown files
- [x] NPCs load from characters folder
- [x] Modifiers calculate correctly
- [x] Build passes with no errors
- [ ] P1 security/validation fixes implemented

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LLM extraction cost | Medium | Medium | Use cheap model, make optional |
| NPC extraction misses entities | Low | High | Manual add option |
| Stats schema changes | Low | Medium | Version field, migration |
| Large NPC counts | Low | Low | Limit to 10 NPCs per extraction |

## Security Considerations

- Validate NPC extraction response before parsing
- Sanitize NPC names for file paths
- No executable content in NPC files

## Code Review Summary

**Review Date:** 2025-12-27
**Reviewer:** code-reviewer
**Report:** [plans/reports/code-reviewer-251227-2047-stats-npc-phase2.md](../reports/code-reviewer-251227-2047-stats-npc-phase2.md)

**Status:** ✅ APPROVED WITH MINOR FIXES

**Quality:** High - production-ready implementation with strong type safety and error handling.

**Critical Findings:**
- P1: Add prompt input sanitization for NPC extraction (security)
- P1: Fix NaN handling in number inputs (data corruption risk)
- P1: Fix useEffect race condition (performance)

**Strengths:**
- Comprehensive input validation
- Proper React hook patterns
- D&D mechanics correctly implemented
- Good separation of concerns
- Secure by default

**Metrics:**
- Build: ✅ PASS (336 KB)
- Type coverage: 100%
- Code quality: High

## Next Steps

After P1 fixes implemented:
→ Phase 3: Dice Roll Mechanics (uses stats for modifiers)
→ Phase 4: Per-turn Updates (updates stats after messages)
