# Dice Roll Mechanics Research
**Date:** 2025-12-27 | **Focus:** AI Roleplay Integration

## 1. Dice Notation Standards

**Core Format:** `XdY±M`
- X = number of dice
- Y = sides per die
- M = modifiers (additive/subtractive)
- Examples: `1d20`, `2d6+3`, `4d6-L` (drop lowest)

**Extended Variants:**
- Multipliers: `3d6×10+3`
- Advantage/Disadvantage: `2d20` (take higher/lower)
- Exploding dice: Roll max = reroll + add
- Fate dice: dF with +/−/blank faces

**Parser Requirements:** Standard parsers handle d4, d6, d8, d10, d12, d20, d100, dfate. Most patterns can be regex-matched as `{quantity}d{sides}[±modifier]`. Complex rules (drop/keep/explode) require dedicated parsers.

**Capitalization:** D&D standardizes lowercase 'd' (d20, not D20).

---

## 2. LLM Integration & Prompt Safety

**Key Risk:** Dice results embedded in prompts can be exploited for indirect injection attacks if untrusted sources generate roll values.

**Mitigation Strategies:**
- Treat dice results as **data, not instructions**—sanitize before passing to LLM
- Isolate roll generation in sandboxed environment
- Filter special chars/code in roll notation before parsing
- Use structured output templates for narrative (avoid free-form concatenation)
- Example: Rather than `"You roll [user_input] and get [result]"`, use `{narrative_template: "action", roll_result: 15, modifier: 3}`

**Safe Pattern:** Dice → JSON → LLM prompt (not string interpolation)

**Narrative Integration:** LLM should receive: roll outcome (success/partial/fail), target DC, net modifier—not raw values prone to re-interpretation.

---

## 3. Stats-to-Modifiers Linking

**Common Approaches:**

| System | Stat → Modifier | Pool Method |
|--------|-----------------|------------|
| D&D 5E | (Stat - 10) / 2 | Single d20 + mods |
| Dice Pools | Stat = # dice | Roll N dice, count successes |
| Fate Core | Direct: Stat = ±bonus | 2dF + skill rank |

**Stacking Rules:** Bonuses from different sources stack; same-source bonuses don't stack (avoid +5 STR from two items).

**Implementation:**
- Store stats as number (e.g., `strength: 16`)
- Compute modifier at roll-time: `modifier = (stat - 10) / 2`
- Apply circumstantial bonuses (condition-based, temporary)
- Penalty precedence: Wounds/status effects reduce dice pool or add negative mods

**Design Note:** Simpler systems use stat as direct modifier (e.g., Strength 3 = +3 bonus). Reduces calculation overhead for AI systems.

---

## 4. UI Display Patterns

**Inline Pattern (Preferred for Chat):**
- Roll notation `[[1d20+5]]` embeds result inline
- Hover/tap shows breakdown: "1d20: 14, +5 mod = **19**"
- Works in message flow without breaking narrative
- Examples: Roll20, Foundry VTT inline rolls

**Modal Pattern (High-Impact Rolls):**
- Critical/major rolls trigger modal popup
- Shows 3D dice animation + result prominently
- Useful for dramatic moments (death saves, boss attacks)
- Module: Dice So Nice (Foundry) adds 3D animation overlay

**Result Display Elements:**
- Roll expression + individual die results + modifiers + total
- Color coding: Green (success/crit), Red (fail/botch)
- Font-based visual: Some systems use dice fonts (convert rolls to Unicode symbols)
- Sound effects: Optional; enhances immersion

**Recommendation for AI Context:**
- Inline for narrative-driven rolls (keep momentum)
- Modal for mechanics-heavy rolls (attack, damage, death saves)
- Summary format: `[Roll: 1d20+3 = 18]` for LLM context (machine-readable)

---

## 5. Implementation Priorities

1. **Parsing:** Regex-based parser for standard notation (covers 95% cases)
2. **Safety:** Sanitize roll inputs; use JSON intermediate format before LLM
3. **Stats Binding:** Simple formula (stat - 10) / 2 for quick computation
4. **Display:** Inline for chats, modal fallback for emphasis
5. **Context Isolation:** Keep dice mechanics in separate execution layer from LLM prompts

---

## Sources
- [Dice notation - Wikipedia](https://en.wikipedia.org/wiki/Dice_notation)
- [RPG Dice Roller Documentation](https://dice-roller.github.io/documentation/guide/notation/)
- [OWASP LLM Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [NVIDIA LLM Security](https://developer.nvidia.com/blog/securing-llm-systems-against-prompt-injection/)
- [Ultimate Guide to Dice-Based Resolution Systems](https://www.ttrpg-games.com/blog/ultimate-guide-to-dice-based-resolution-systems/)
- [Roll20 Dice Reference](https://wiki.roll20.net/Dice_Reference)
- [Foundry VTT Dice Documentation](https://foundryvtt.com/article/dice/)
- [Dice So Nice Module](https://foundryvtt.com/packages/dice-so-nice/)

## Unresolved Questions
- How should criticals/fumbles affect LLM narrative (auto-success/failure vs. guidance)?
- Should roll history be queryable by character stats (e.g., "show all STR rolls")?
