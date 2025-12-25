# Mianix Roleplay Plugin - Project Overview & PDR

**Document Version:** 1.0
**Last Updated:** 2025-12-25
**Phase:** Phase 1 Complete - Core Setup
**Target Phase:** Phase 2 - UI & LLM Integration

## Executive Summary

Mianix Roleplay is an Obsidian plugin designed to facilitate AI-powered roleplay conversations using character cards and large language models (LLMs). The plugin integrates with OpenAI-compatible API endpoints to enable dynamic character interactions within the Obsidian note-taking environment.

**Current Status:** Phase 1 (Plugin scaffolding and core infrastructure) completed. Plugin successfully registers with Obsidian, manages settings, and provides a custom view placeholder for Phase 2 UI development.

## Product Requirements Document (PDR)

### Project Vision
Enable users to engage in interactive roleplay conversations with AI-powered character personas within Obsidian, maintaining conversation history and character profiles as part of their knowledge base.

### Core Objectives

1. **Plugin Infrastructure** - Establish Obsidian plugin with settings management and custom views
2. **Character Management** - Define and persist character profiles with metadata
3. **Conversation System** - Track dialogue history with message branching
4. **LLM Integration** - Interface with OpenAI-compatible APIs for response generation
5. **User Experience** - Intuitive UI for character selection, conversation, and profile management

### Functional Requirements

#### FR-1: Plugin Initialization & Settings
- [x] Plugin loads and unloads without errors
- [x] Settings persist to Obsidian storage
- [x] LLM configuration (API endpoint, key, model name)
- [x] Settings accessible via settings panel
- [ ] Settings validation (Phase 2)

**Acceptance Criteria:**
- Plugin appears in Obsidian plugin list
- Settings changes persist across restarts
- Settings tab displays all three LLM configuration fields
- API Key field masks input for security

#### FR-2: Custom View & Navigation
- [x] Custom view type registered (`mianix-roleplay-view`)
- [x] View accessible via ribbon icon
- [x] View accessible via command palette
- [x] View reuses existing instance if open
- [ ] React UI rendered in view (Phase 2)

**Acceptance Criteria:**
- Ribbon icon shows "Mianix Roleplay" on hover
- Clicking icon opens view on right side
- Command palette entry: "Open Roleplay View"
- Only one view instance exists at a time
- View persists when switching between other views

#### FR-3: Type System & Interfaces
- [x] Settings interface with LLM configuration
- [x] Character card type definition
- [x] Dialogue message type definition
- [x] App context type for React (Phase 2)
- [ ] Validation and error types (Phase 2)

**Acceptance Criteria:**
- All TypeScript types exported from `types/index.ts`
- Type definitions match actual data storage format
- Character cards include: id, name, description, personality, scenario, firstMessage
- Dialogue messages support branching via parentId

#### FR-4: Build System & Development
- [x] TypeScript configuration with React support
- [x] ESBuild bundling with dev/prod modes
- [x] Development watch mode with sourcemaps
- [x] Production minification
- [x] Type checking script

**Acceptance Criteria:**
- `npm run dev` starts watch mode without errors
- `npm run build` generates minified main.js
- `npm run typecheck` catches TypeScript errors
- Production build < 200KB

#### FR-5: Styling Foundation
- [x] CSS framework with Obsidian theme variables
- [x] Layout containers and responsive design
- [ ] Component-specific styling (Phase 2)
- [ ] Dark mode support (automatic via CSS variables)

**Acceptance Criteria:**
- All colors use Obsidian CSS variables
- Layout works on desktop and mobile
- No hardcoded colors in CSS

### Non-Functional Requirements

#### NFR-1: Performance
- Plugin initialization < 500ms
- Settings load/save < 100ms
- View activation < 200ms

#### NFR-2: Compatibility
- Obsidian API version 1.0+
- Works on desktop and mobile
- ES2018+ target for broad browser support
- React 18.2+ for Phase 2 UI

#### NFR-3: Maintainability
- All code in TypeScript with strict mode
- Comprehensive type definitions
- Clear separation of concerns (main, views, settings)
- Documented patterns and standards

#### NFR-4: Security
- API keys stored locally in Obsidian data folder
- No keys exposed in console logs
- API Key field uses password input type
- No external network calls until LLM integration

#### NFR-5: Scalability
- Plugin handles 100+ character profiles
- Support for 1000+ conversation messages per character
- Modular architecture for future extensions

### Implementation Constraints

**Technology Stack:**
- Runtime: Obsidian API, Electron
- Language: TypeScript 5.3+
- Framework: React 18.2+ (Phase 2)
- State Management: Zustand 4.4+
- Build Tool: ESBuild 0.19+
- Parser: Gray-matter 4.0.3 (YAML frontmatter)

**Environment:**
- Node.js 18+ for development
- macOS, Windows, Linux support
- Obsidian 1.0+ required

**Data Storage:**
- Character profiles: YAML frontmatter + markdown content
- Dialogue messages: Nested file structure (character/conversation/)
- Settings: Obsidian plugin data.json

### Dependencies & External Services

**Build-time:**
- obsidian, @types/node, @types/react, builtin-modules
- esbuild, typescript

**Runtime:**
- react, react-dom: UI rendering (Phase 2)
- zustand: Global state management (Phase 2)
- gray-matter: Frontmatter parsing
- uuid: Unique identifier generation

**External Services (Phase 2):**
- OpenAI-compatible LLM API (configurable endpoint)
- Supports: OpenAI, Azure OpenAI, LocalAI, Ollama

### Phase Breakdown

#### Phase 1: Plugin Setup (COMPLETE)
- Plugin scaffold and Obsidian integration
- Settings system and persistence
- Custom view registration
- Type definitions and constants
- Build configuration
- CSS framework

#### Phase 2: UI & LLM Integration (UPCOMING)
- React component hierarchy for roleplay interface
- Character card CRUD operations
- Dialogue message rendering and history
- LLM API integration for response generation
- Message input and streaming responses
- Character selection sidebar

#### Phase 3: Advanced Features (FUTURE)
- Conversation branching and tree visualization
- Character relationship mapping
- Prompt templating and customization
- Multi-character conversations
- Conversation export/import
- Community character card sharing

### Testing Strategy

#### Unit Testing (Phase 2)
- Settings loading/saving
- Character card parsing
- Utility functions (UUID generation, path resolution)

#### Integration Testing (Phase 2)
- Plugin initialization and lifecycle
- Settings tab interaction
- View activation and deactivation
- LLM API communication

#### Manual Testing (Ongoing)
- Plugin enable/disable in Obsidian
- Settings persistence across restarts
- View creation and reuse
- Cross-platform (macOS, Windows)

### Success Metrics

**Phase 1:**
- [x] Plugin loads without errors
- [x] Settings persist to storage
- [x] TypeScript compiles with strict mode
- [x] Build process works for dev/prod
- [x] View registers and activates

**Phase 2 (Target):**
- [ ] Character CRUD operations functional
- [ ] LLM responses generated and displayed
- [ ] Conversation history persisted
- [ ] UI responsive on desktop and mobile
- [ ] Zero console errors/warnings

**Overall:**
- Plugin adoption by Obsidian community
- < 2 second plugin load time
- Positive user ratings and reviews

### Known Limitations & Future Considerations

**Current Limitations:**
- React UI not yet integrated (placeholder in Phase 1)
- No LLM API integration yet
- No character management UI
- Settings only support single LLM provider

**Future Considerations:**
- Multiple LLM provider support (Anthropic, Google, etc.)
- Voice input/output integration
- Image generation with LLM
- Conversation analysis and summarization
- Custom prompt engineering tools
- Plugin marketplace integration

### Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Obsidian API changes | Medium | Low | Monitor Obsidian changelog, version constraints |
| LLM API rate limiting | Medium | Medium | Implement request queuing, user warnings |
| Large conversation histories | High | Medium | Implement pagination, indexing |
| API key exposure | High | Low | Use password field, never log keys |
| Performance degradation | Medium | Low | Monitor bundle size, implement lazy loading |

### Acceptance Criteria - Overall

**Phase 1 Completion:**
- [x] Plugin successfully registers with Obsidian
- [x] Settings system persists configuration
- [x] Custom view appears in workspace
- [x] TypeScript compilation succeeds
- [x] Build produces valid plugin output
- [x] Documentation of architecture and standards

**Phase 2 Pre-requisites:**
- [ ] React environment verified
- [ ] Zustand state management integrated
- [ ] Character file parsing with gray-matter tested
- [ ] UUID generation working
- [ ] File system operations planned

### Roadmap Timeline

**Phase 1 (Complete):** Core infrastructure and plugin setup
- **Duration:** Week 1
- **Status:** DONE

**Phase 2 (Upcoming):** UI components and LLM integration
- **Duration:** Weeks 2-3
- **Start:** Upon Phase 1 completion
- **Deliverables:** React components, LLM integration, character CRUD

**Phase 3 (Future):** Advanced features and polish
- **Duration:** Weeks 4+
- **Deliverables:** Advanced UI, conversation features, optimizations

## Document Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-25 | Initial document - Phase 1 completion |

## Stakeholders & Contact

- **Project Lead:** Mianix Development Team
- **Repository:** /Users/uspro/Projects/mianix-v2/obsidian-mianix-ai
- **Platform:** Obsidian Marketplace

## Appendix: Technical Specifications

### Plugin Manifest
```json
{
  "id": "mianix-roleplay",
  "name": "Mianix Roleplay",
  "version": "0.1.0",
  "minAppVersion": "1.0.0",
  "description": "AI roleplay with character cards and LLM integration",
  "isDesktopOnly": false
}
```

### Build Output Specifications
- **Format:** CommonJS (Obsidian compatible)
- **Target:** ES2018
- **Minification:** Production only
- **Sourcemaps:** Inline (dev), none (prod)
- **Bundling:** All dependencies except Obsidian internals

### API Configuration Structure
```typescript
interface LLMConfig {
  baseUrl: string;      // "https://api.openai.com/v1"
  apiKey: string;       // Stored locally, never transmitted
  modelName: string;    // "gpt-4-turbo"
}
```

### File Organization Standards
- One class per file (exceptions: closely related interfaces)
- Type definitions centralized in `types/index.ts`
- Constants in `constants.ts`
- Views in `views/` subdirectory
- Utilities in `utils/` subdirectory (future)
- Hooks in `hooks/` subdirectory (Phase 2)
