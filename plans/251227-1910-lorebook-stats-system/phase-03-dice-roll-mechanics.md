# Phase 3: Dice Roll Mechanics

**Effort:** 3h | **Priority:** P2 | **Status:** pending

## Context

- [Research: Dice Roll Mechanics](./research/researcher-02-diceroll-mechanics.md)
- [Phase 2: Stats & NPC System](./phase-02-stats-npc-system.md)
- [Main Plan](./plan.md)

## Overview

Implement dice roll parsing and display with stat-based modifiers:
1. **Parser** - Regex-based `XdY+M` notation support
2. **Modifiers** - Link rolls to character stats
3. **Display** - Inline roll results in chat
4. **LLM Integration** - Provide roll results to AI for narrative

## Key Insights from Research

- Core format: `XdY±M` (X dice with Y sides, M modifier)
- D&D standardizes lowercase 'd' (1d20, not 1D20)
- Treat dice results as data, not instructions (injection safety)
- Inline display preferred for chat flow
- Summary format for LLM: `[Roll: 1d20+3 = 18]`

## Requirements

### Dice Parser
1. Parse standard notation: `1d20`, `2d6+3`, `4d6-2`
2. Support advantage/disadvantage: `2d20kh1` (keep highest)
3. Calculate total with modifiers
4. Return structured result (individual dice, total, breakdown)

### Stat Integration
1. Reference stats in rolls: `1d20+STR`
2. Auto-calculate modifier from stat value
3. Support custom stat references

### Display
1. Inline notation in messages: `[[1d20+5]]`
2. Render result inline with hover for breakdown
3. Color code: green (high), red (low/crit fail)

### LLM Integration
1. Detect roll notations in user message
2. Execute rolls before sending to LLM
3. Include results in context: `[Roll: 1d20+3 = 18 (success)]`

## Architecture

### Types

```typescript
// src/types/dice.ts
interface DiceRoll {
  notation: string;       // Original notation "2d6+3"
  quantity: number;       // 2
  sides: number;          // 6
  modifier: number;       // 3
  statRef?: string;       // "STR" if stat-based
}

interface RollResult {
  roll: DiceRoll;
  individualRolls: number[];  // [4, 6]
  modifierValue: number;      // 3 (or calculated from stat)
  total: number;              // 13
  critSuccess: boolean;       // Natural 20
  critFail: boolean;          // Natural 1
}

interface RollContext {
  notation: string;
  result: RollResult;
  formatted: string;      // "[Roll: 2d6+3 = 13]"
}
```

### Parser Implementation

```typescript
// src/utils/dice-parser.ts

// Pattern: XdY[+|-][M|STAT]
const DICE_PATTERN = /(\d*)d(\d+)([+-](?:\d+|[A-Z]{3}))?/gi;

function parseDiceNotation(notation: string): DiceRoll | null {
  const match = DICE_PATTERN.exec(notation);
  if (!match) return null;

  const quantity = parseInt(match[1] || '1', 10);
  const sides = parseInt(match[2], 10);
  const modPart = match[3];

  let modifier = 0;
  let statRef: string | undefined;

  if (modPart) {
    const modValue = modPart.slice(1);
    if (/^\d+$/.test(modValue)) {
      modifier = parseInt(modValue, 10);
      if (modPart[0] === '-') modifier = -modifier;
    } else {
      statRef = modValue.toUpperCase();
    }
  }

  return { notation, quantity, sides, modifier, statRef };
}

function rollDice(roll: DiceRoll, stats?: CharacterStats): RollResult {
  const individualRolls: number[] = [];
  for (let i = 0; i < roll.quantity; i++) {
    individualRolls.push(Math.floor(Math.random() * roll.sides) + 1);
  }

  let modifierValue = roll.modifier;
  if (roll.statRef && stats) {
    const statValue = getStatValue(stats, roll.statRef);
    modifierValue = Math.floor((statValue - 10) / 2);
  }

  const rollSum = individualRolls.reduce((a, b) => a + b, 0);
  const total = rollSum + modifierValue;

  return {
    roll,
    individualRolls,
    modifierValue,
    total,
    critSuccess: roll.sides === 20 && individualRolls.includes(20),
    critFail: roll.sides === 20 && individualRolls[0] === 1,
  };
}
```

### Service Layer

```typescript
// src/services/dice-service.ts
class DiceService {
  constructor(private statsService: StatsService) {}

  // Parse and execute roll
  async executeRoll(
    notation: string,
    characterFolderPath?: string
  ): Promise<RollResult>

  // Find roll notations in text
  findRollNotations(text: string): string[]

  // Execute all rolls in text, return text with results
  async processRolls(
    text: string,
    characterFolderPath?: string
  ): Promise<{ processed: string; rolls: RollContext[] }>

  // Format roll for LLM context
  formatForLLM(result: RollResult): string

  // Format roll for display
  formatForDisplay(result: RollResult): string
}
```

### Inline Notation Processing

```typescript
// Pattern for inline rolls: [[1d20+5]]
const INLINE_ROLL_PATTERN = /\[\[(\d*d\d+[+-]?(?:\d+|[A-Z]{3})?)\]\]/gi;

async function processInlineRolls(
  text: string,
  characterPath: string
): Promise<string> {
  const matches = text.matchAll(INLINE_ROLL_PATTERN);
  let result = text;

  for (const match of matches) {
    const notation = match[1];
    const rollResult = await executeRoll(notation, characterPath);
    const display = formatInline(rollResult);
    result = result.replace(match[0], display);
  }

  return result;
}
```

## Related Files

| File | Action |
|------|--------|
| `src/types/dice.ts` | Create |
| `src/utils/dice-parser.ts` | Create |
| `src/services/dice-service.ts` | Create |
| `src/components/DiceRoll.tsx` | Create - inline display component |
| `src/hooks/useDialogue.ts` | Modify - process rolls before send |

## Implementation Steps

### Step 1: Types & Parser (1h)
- [ ] Create `src/types/dice.ts` with interfaces
- [ ] Implement `parseDiceNotation()` regex parser
- [ ] Implement `rollDice()` execution
- [ ] Unit test parser with various notations
- [ ] Handle edge cases (0d6, d20, etc.)

### Step 2: DiceService (45m)
- [ ] Create `DiceService` class
- [ ] Implement `executeRoll()` with stat lookup
- [ ] Implement `findRollNotations()` for detection
- [ ] Implement `processRolls()` for batch processing
- [ ] Implement format methods

### Step 3: Display Component (45m)
- [ ] Create `DiceRoll.tsx` inline component
- [ ] Show total with color coding
- [ ] Hover/click for breakdown
- [ ] Animate on new roll (subtle)

### Step 4: Message Integration (30m)
- [ ] Detect `[[notation]]` in user input
- [ ] Execute rolls before LLM call
- [ ] Include roll results in context
- [ ] Display processed message with roll results

## Todo List

```
[ ] Create types/dice.ts
[ ] Implement dice parser utility
[ ] Implement rollDice function
[ ] Create DiceService
[ ] Create DiceRoll display component
[ ] Integrate with useDialogue hook
[ ] Add roll results to LLM context
[ ] Test various notations
[ ] Test stat-based modifiers
[ ] Test inline rendering
```

## Success Criteria

- [ ] `1d20` parses and rolls correctly
- [ ] `2d6+3` adds modifier correctly
- [ ] `1d20+STR` uses character stat
- [ ] `[[1d20+5]]` inline notation detected
- [ ] Roll results display inline
- [ ] Crits/fumbles color coded
- [ ] LLM receives roll results

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Parser edge cases | Low | Medium | Comprehensive regex tests |
| Random not cryptographic | Low | Very Low | Fine for game dice |
| Notation conflicts with markdown | Medium | Low | Use `[[]]` delimiter |

## Security Considerations

- Treat roll notations as data only
- Sanitize before injecting to LLM
- No eval() or code execution from roll strings
- Validate stat references against known stats

## Next Steps

After dice system works:
→ Phase 4: Per-turn Updates (can trigger rolls in AI responses)
