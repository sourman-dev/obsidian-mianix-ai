# Lorebook & Character Stats Systems Research
**Report Date:** 2025-12-27 | **Focus:** SillyTavern, Chub.ai, Kobold AI

---

## 1. Lorebook Format & Structure

### SillyTavern World Info
- **Storage:** Keyword-indexed entries with content field
- **Keys:** Case-insensitive, comma-separated; supports regex patterns (JS style with `/` delimiters)
- **Secondary Keys:** AND ANY, AND ALL, NOT ANY, NOT ALL logic for conditional activation
- **Content:** Standalone description—only content field inserted into prompt; activation data excluded
- **Scan Depth:** Controls how many recent messages to scan for keyword matches

### Chub.ai Character Books
- **Structure:** Keyword-triggered definitions/lore embedded in character cards
- **Organization:** Universal search across characters, lorebooks, presets, tags
- **Format:** Comprehensive background database maintaining character consistency
- **Scope:** Per-character embedded books with no clear distinction between embedded vs global in public docs

### Kobold AI/KoboldCpp
- **Format:** Supports nested categories with priority tags and versioned entries
- **Activation:** Regex-based (e.g., "Sunken Cathedral" exact match)
- **Injection Points:** Before narrative context, after character action, or structured embedded
- **UI:** KoboldCpp bundles World Info tab with editing, save formats, and scenario support

---

## 2. Insertion Methods & Position Impact

### Context Positioning (SillyTavern standard)
1. **Before Character:** Inserted before character definition
2. **After Character:** Inserted after character context
3. **In Chat:** Mixed with chat messages (strongest influence)

**Order Value:** Numeric priority; higher numbers insert closer to end, maximizing influence on responses.

### Token Conservation
- Keep entry contents concise to preserve token budget
- Position strategically: entries near end of context have stronger influence
- Scan depth limits context processing for efficiency

---

## 3. Character-Specific vs Shared Lorebooks

| Aspect | Embedded | Global/Shared |
|--------|----------|----------------|
| **SillyTavern** | Not distinguished in standard docs | World Info entries reusable across characters |
| **Chub.ai** | Character Books embedded in card | Separate Lorebooks (universal search available) |
| **Kobold AI** | Per-character scenarios | Shared World Info with priority ordering |
| **Best Practice** | Private personality/traits | Common worldbuilding, factions, locations |

**Key Insight:** SillyTavern treats all entries as reusable; distinction made via "Always Active" toggle (constant entries) vs conditional trigger.

---

## 4. Stats & Attributes Systems

### Character Stat Tracking
- **Critical Placement:** Within first 3200 characters of definition for maximum LLM recognition
- **Common Attributes:** STR, DEX, CON, INT, WIS, CHA (RPG standard)
- **Extended Tracking:** Health, energy, inventory, relationships, skills

### Implementation Patterns
1. **Pre-load Method:** Tell AI to load all char info first, then initialize roleplay (near-perfect accuracy)
2. **JSON Format:** Recognized by SillyTavern/Character.AI for structured stat data
3. **External Tracking:** Complex games maintain spreadsheets/external docs (scalable approach)
4. **Derived Stats:** Combine multiple attributes (e.g., Attack = STR + weapon bonus + environment)

### Consistency Mechanisms
- Sample dialogue in definition captures voice/tone
- Regular testing & refinement cycles
- Two-prompt initialization (pre-load + roleplay)

---

## 5. Activation Rules & Best Practices

### Keyword Matching Logic
- **Primary Key:** Must match (or regex pattern)
- **Secondary Filters:** AND/NOT logic combinations for sophisticated triggering
- **Probability:** 0-100 value acting as additional randomness filter
- **Recursive Activation:** Keywords in triggered entries can activate others (controlled by setting)

### Recursion Handling
- **Order Processing:** Blue Circle entries first, then others in specified Order
- **Recursion Sequence:** Recursive triggers processed after initial activation in same order
- **"Delay Until Recursion":** Prevents first loop from triggering if no other lorebooks exist (critical gotcha)

### Priority & Ordering Strategy
1. Always active (Constant toggle) process first
2. Scan chat history for keywords within scan depth limit
3. Match primary key, apply secondary filters
4. Check probability threshold
5. Insert at specified position with Order value determining precedence

### Avoiding Recursion Pitfalls
- Set "Delay until recursion" only if ≥1 other lorebook exists
- Monitor activation order to prevent infinite loops
- Use probability to dampen over-triggered entries
- Test cascade effects with semantic vector matching

---

## 6. Semantic & Vector Matching (Emerging)

**SillyTavern Vector Storage:** Supplement keyword matching with semantic similarity—triggers related concepts without exact keyword match. Requires extension; preserves natural conversation flow.

---

## Key Takeaways

1. **Structure:** Keyword-indexed, position-aware, order-prioritized entries across all platforms
2. **Insertion:** Position in context (before/after/chat) directly impacts response strength
3. **Stats:** Define within first 3200 chars; use JSON for structure; test pre-load initialization
4. **Recursion:** Order matters; disable "delay" if single lorebook; test cascade activation
5. **Reusability:** Embed character traits in cards; house shared world lore in global books
6. **Performance:** Concise entries, limited scan depth, probability filtering conserve tokens

---

## Unresolved Questions

- Chub.ai exact spec for embedded vs global scope (private vs platform-wide visibility)
- KoboldAI nested category taxonomy & depth limits
- Semantic vector matching performance overhead vs keyword speed
- Optimal scan depth for large chat histories without latency

---

## Sources

- [SillyTavern World Info Docs](https://docs.sillytavern.app/usage/core-concepts/worldinfo/)
- [SillyTavern Lorebooks Guide](https://www.arsturn.com/blog/sillytavernai-lorebooks-with-gemini-2-5-a-complete-guide)
- [World Info Encyclopedia (Rentry)](https://rentry.co/world-info-encyclopedia)
- [KoboldAI GitHub](https://github.com/LostRuins/koboldcpp)
- [SillyTavern RPG Companion Extension](https://github.com/SpicyMarinara/rpg-companion-sillytavern)
- [AI Roleplay Best Practices (Medium)](https://medium.com/@enderdragon/my-ultimate-guide-to-ai-roleplaying-in-2025-seriously-777dd0771bc1)
- [Character.AI Profile Creation](https://medium.com/@adlerai/creating-a-character-ai-character-profile-5d50d2007a7f)
