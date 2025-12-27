# Phase 4: Per-turn Updates

**Effort:** 2h | **Priority:** P2 | **Status:** pending

## Context

- [Phase 2: Stats & NPC System](./phase-02-stats-npc-system.md)
- [Main Plan](./plan.md)

## Overview

Implement automatic stat/character updates after each message turn:
1. **Stats Update** - Async LLM call to detect stat changes from narrative
2. **NPC Updates** - Detect new NPCs or relationship changes
3. **Non-blocking** - Updates run after response, don't block chat

## Key Insights

- Similar pattern to existing MemoryExtractionService
- Use cheap/fast model for extraction
- Run asynchronously after LLM response complete
- Update stats.json, not just memory

## Requirements

### Stats Detection
1. After each assistant message, analyze for stat changes
2. Detect: HP changes, condition gain/loss, stat modifications
3. Apply changes to stats.json
4. Optional: Show update notification in UI

### NPC Detection
1. Detect new named characters in responses
2. Check if NPC already exists
3. Create new NPC file if not exists
4. Update relationship if mentioned

### Async Processing
1. Non-blocking - chat continues immediately
2. Queue updates if multiple messages
3. Error handling - don't break chat on failure
4. Optional toggle in settings

## Architecture

### Types

```typescript
// src/types/game-update.ts
interface StatChange {
  path: string;           // "derivedStats.hp.current" or "conditions"
  action: 'set' | 'add' | 'remove' | 'modify';
  value: number | string;
  reason?: string;
}

interface NPCUpdate {
  name: string;
  action: 'create' | 'update';
  data: Partial<NPCCharacter>;
}

interface TurnUpdate {
  statChanges: StatChange[];
  npcUpdates: NPCUpdate[];
  timestamp: string;
}
```

### Extraction Prompt

```
Analyze this roleplay exchange for game state changes.

User: {userMessage}
AI: {aiMessage}

Current character stats:
{currentStats}

Detect any changes to:
1. HP (damage taken, healing)
2. Conditions (poisoned, stunned, etc.)
3. Stats (temporary buffs/debuffs)
4. New NPCs mentioned by name
5. Relationship changes with existing NPCs

Return JSON:
{
  "statChanges": [
    {"path": "derivedStats.hp.current", "action": "modify", "value": -5, "reason": "arrow hit"}
  ],
  "npcUpdates": [
    {"name": "Merchant Yuri", "action": "create", "data": {"role": "neutral", "description": "..."}}
  ]
}

If no changes, return: {"statChanges": [], "npcUpdates": []}
```

### Service Layer

```typescript
// src/services/turn-update-service.ts
class TurnUpdateService {
  constructor(
    private app: App,
    private settings: MianixSettings,
    private statsService: StatsService,
    private npcService: NPCExtractionService
  ) {}

  // Process turn for updates (async, non-blocking)
  async processTurn(
    characterFolderPath: string,
    userMessage: string,
    aiMessage: string
  ): Promise<void>

  // Apply stat changes
  private async applyStatChanges(
    characterFolderPath: string,
    changes: StatChange[]
  ): Promise<void>

  // Apply NPC updates
  private async applyNPCUpdates(
    characterFolderPath: string,
    updates: NPCUpdate[]
  ): Promise<void>
}
```

### Integration Hook

```typescript
// In useDialogue.ts or LLM service

async function onMessageComplete(
  characterFolderPath: string,
  userMessage: string,
  aiMessage: string
) {
  // Non-blocking - fire and forget
  if (settings.enableTurnUpdates) {
    turnUpdateService
      .processTurn(characterFolderPath, userMessage, aiMessage)
      .catch(err => console.warn('Turn update failed:', err));
  }
}
```

## Related Files

| File | Action |
|------|--------|
| `src/types/game-update.ts` | Create |
| `src/services/turn-update-service.ts` | Create |
| `src/services/llm-service.ts` | Modify - add post-message hook |
| `src/types/index.ts` | Add `enableTurnUpdates` setting |

## Implementation Steps

### Step 1: Types & Service Shell (30m)
- [ ] Create `src/types/game-update.ts`
- [ ] Create `TurnUpdateService` class skeleton
- [ ] Add `enableTurnUpdates` to settings

### Step 2: Extraction Logic (45m)
- [ ] Implement extraction prompt builder
- [ ] Call extraction LLM (reuse pattern from MemoryExtractionService)
- [ ] Parse response to TurnUpdate
- [ ] Handle malformed responses gracefully

### Step 3: Apply Updates (30m)
- [ ] Implement `applyStatChanges()` using StatsService
- [ ] Implement `applyNPCUpdates()` using NPCExtractionService
- [ ] Handle conflicts (NPC already exists, etc.)
- [ ] Log changes for debugging

### Step 4: Integration (15m)
- [ ] Add hook in LLM service after response complete
- [ ] Make async and non-blocking
- [ ] Add error boundary
- [ ] Add setting toggle

## Todo List

```
[ ] Create types/game-update.ts
[ ] Create TurnUpdateService
[ ] Implement extraction prompt
[ ] Implement stat change application
[ ] Implement NPC update application
[ ] Add post-message hook
[ ] Add settings toggle
[ ] Test stat updates from narrative
[ ] Test NPC detection
[ ] Test error handling
```

## Success Criteria

- [ ] Turn updates run after each message
- [ ] Stats update based on narrative
- [ ] New NPCs auto-created
- [ ] Updates don't block chat
- [ ] Errors don't break chat
- [ ] Toggle in settings works

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LLM cost per turn | Medium | High | Use cheap model, make optional |
| False positive updates | Medium | Medium | Conservative parsing, require explicit |
| Race conditions | Low | Low | Queue updates, atomic writes |

## Security Considerations

- Validate stat paths against whitelist
- Sanitize NPC names for file paths
- Don't execute arbitrary updates from LLM

## Performance Notes

- Extraction model should be cheap/fast (gpt-4o-mini, gemini-flash)
- Consider batching if messages come fast
- Cache current stats to reduce reads
- Non-blocking is critical for UX

## Future Enhancements

- Show update notifications in UI
- Undo last turn's changes
- Update history/log per character
- Configurable extraction aggressiveness
