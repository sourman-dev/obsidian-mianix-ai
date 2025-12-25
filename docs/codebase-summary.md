# Mianix Roleplay Plugin - Codebase Summary

**Status:** Phase 1 Plugin Setup - Complete
**Version:** 0.1.0
**Last Updated:** 2025-12-25

## Project Overview

Mianix Roleplay is an Obsidian plugin that enables AI-powered roleplay with character cards and LLM integration. It provides a framework for managing character profiles and facilitating dialogue through OpenAI-compatible API endpoints.

### Key Features
- Custom Obsidian view for roleplay interactions
- Plugin settings management with LLM configuration
- Character card system with frontmatter metadata
- Settings persistence to local storage
- Ribbon icon and command palette integration

## Project Structure

```
obsidian-mianix-ai/
├── manifest.json          # Plugin metadata & configuration
├── package.json           # Dependencies & build scripts
├── tsconfig.json          # TypeScript compiler configuration
├── esbuild.config.mjs     # Build configuration (ESM)
├── styles.css             # Plugin styling
├── .gitignore             # Git ignore patterns
├── src/
│   ├── main.ts            # Plugin entry point & lifecycle
│   ├── constants.ts       # Plugin-wide constants
│   ├── settings-tab.ts    # Settings UI component
│   ├── types/
│   │   └── index.ts       # Type definitions & interfaces
│   └── views/
│       └── roleplay-view.ts # Custom Obsidian view
├── docs/                  # Documentation (this folder)
└── main.js               # Compiled output (gitignored)
```

## Core Files

### `src/main.ts` - Plugin Entry Point
**Responsibility:** Plugin lifecycle and orchestration

Key exports:
- `MianixRoleplayPlugin`: Main plugin class extending Obsidian `Plugin`

Key methods:
- `onload()`: Registers custom view, ribbon icon, settings tab, and commands
- `onunload()`: Cleanup on plugin disable
- `loadSettings()`: Load plugin settings from storage
- `saveSettings()`: Persist settings to storage
- `activateView()`: Open/activate roleplay view in workspace

Lifecycle:
1. Load settings from persistent storage
2. Register custom view type (`mianix-roleplay-view`)
3. Add ribbon icon for quick access
4. Register settings tab for configuration
5. Add command to open view

### `src/constants.ts` - Plugin Constants
**Responsibility:** Centralized constant definitions

Exports:
- `VIEW_TYPE_ROLEPLAY`: 'mianix-roleplay-view' - Custom view identifier
- `PLUGIN_ID`: 'mianix-roleplay' - Plugin identifier
- `CHARACTERS_FOLDER`: 'characters' - Default folder for character files

### `src/types/index.ts` - Type Definitions
**Responsibility:** Central type system and interfaces

Core interfaces:
- `MianixSettings`: Plugin settings structure
  - `llm.baseUrl`: API endpoint URL
  - `llm.apiKey`: API authentication key
  - `llm.modelName`: LLM model identifier

- `CharacterCard`: Character profile metadata
  - `id`: UUID identifier
  - `name`: Display name
  - `description`: Character overview
  - `personality`: Behavior/traits definition
  - `scenario`: Scene/context setup
  - `firstMessage`: Initial dialogue message
  - `createdAt`: ISO timestamp

- `CharacterCardWithPath`: CharacterCard + file info
  - `folderPath`: Parent folder path
  - `filePath`: Full file path

- `CharacterFormData`: Form submission payload for character creation/editing

- `DialogueMessage`: Message metadata
  - `id`: Message UUID
  - `role`: 'user' | 'assistant'
  - `parentId`: Parent message reference (branching conversations)
  - `timestamp`: ISO timestamp

- `DialogueMessageWithContent`: DialogueMessage + content text

- `AppContextType`: React context for global app state
  - `app`: Obsidian App instance
  - `settings`: Current plugin settings
  - `saveSettings()`: Async settings persistence function

### `src/settings-tab.ts` - Settings UI
**Responsibility:** Plugin settings interface

Class: `MianixSettingTab extends PluginSettingTab`

Configurable fields:
1. **Base URL** - OpenAI-compatible API endpoint (default: https://api.openai.com/v1)
2. **API Key** - Authentication credential (masked input, stored locally)
3. **Model Name** - LLM model identifier (default: gpt-4-turbo)

All changes persist automatically to plugin storage.

### `src/views/roleplay-view.ts` - Custom View
**Responsibility:** Roleplay interface container

Class: `RoleplayView extends ItemView`

Methods:
- `getViewType()`: Returns 'mianix-roleplay-view'
- `getDisplayText()`: Returns 'Mianix Roleplay'
- `getIcon()`: Returns 'message-square' (Obsidian icon)
- `onOpen()`: Initializes view UI (Phase 2: React integration)
- `onClose()`: Cleanup handler (Phase 2: React cleanup)

Current state: Placeholder implementation ready for React integration in Phase 2.

### `styles.css` - Plugin Styling
**Responsibility:** UI/UX styling

CSS classes:
- `.mianix-roleplay-container`: Main view container (flex column, full height)
- `.mianix-placeholder`: Centered placeholder text (Phase 1)
- `.mianix-layout`: Two-column layout flex container
- `.mianix-sidebar`: Left sidebar (240px, scrollable)
- `.mianix-main`: Main content area (flex: 1, scrollable)

Uses Obsidian CSS variables for theme consistency:
- `--text-muted`: Muted text color
- `--background-modifier-border`: Border color

## Configuration & Build

### `tsconfig.json`
- Target: ES2018
- Module: ESNext (for esbuild bundling)
- Module resolution: bundler
- JSX: react-jsx
- Strict mode enabled
- Path aliases: `@/*` → `src/*`

### `esbuild.config.mjs`
- Entry: `src/main.ts`
- Output: `main.js` (CommonJS format for Obsidian)
- Bundles all dependencies except Obsidian built-ins
- Development: Inline sourcemaps + watch mode
- Production: Minified, no sourcemaps

### `package.json` Scripts
- `npm run dev`: Watch mode with inline sourcemaps
- `npm run build`: Production minified build
- `npm run typecheck`: TypeScript type checking without emit

## Dependencies

### Dev Dependencies
- `obsidian@^1.11.0`: Obsidian API
- `typescript@^5.3.0`: TypeScript compiler
- `esbuild@^0.19.0`: Build tool
- `@types/node@^20.0.0`: Node.js type definitions
- `@types/react@^18.2.0`: React type definitions
- `@types/react-dom@^18.2.0`: React DOM type definitions
- `builtin-modules@^3.3.0`: Built-in module detection for bundler

### Runtime Dependencies
- `react@^18.2.0`: UI library (Phase 2 integration)
- `react-dom@^18.2.0`: React DOM rendering
- `zustand@^4.4.0`: State management
- `gray-matter@^4.0.3`: Frontmatter parsing (YAML metadata)
- `uuid@^9.0.0`: UUID generation

## Plugin Metadata (`manifest.json`)

- **ID:** mianix-roleplay
- **Name:** Mianix Roleplay
- **Version:** 0.1.0
- **Min App Version:** 1.0.0
- **Description:** AI roleplay with character cards and LLM integration
- **Desktop Only:** false (works on desktop and mobile)

## Phase 1 Completion Checklist

- [x] Plugin scaffold with Obsidian API integration
- [x] TypeScript configuration with React JSX support
- [x] Build system setup (esbuild with dev/prod modes)
- [x] Plugin lifecycle implementation (onload, onunload)
- [x] Custom view registration and activation
- [x] Settings system with LLM configuration
- [x] Type system for settings, characters, and dialogue
- [x] CSS framework for UI layout
- [x] Ribbon icon and command palette integration

## Phase 2 Roadmap (Placeholder)

- [ ] React component integration in RoleplayView
- [ ] Character card CRUD operations
- [ ] Dialogue message history rendering
- [ ] LLM API integration for response generation
- [ ] File system operations for character/dialogue storage
- [ ] Message branching and conversation trees

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Runs esbuild in watch mode with inline sourcemaps.

### Production Build
```bash
npm run build
```
Generates minified `main.js`.

### Type Checking
```bash
npm run typecheck
```
Validates TypeScript without generating output.

## Key Patterns

### Settings Management
Settings are loaded from Obsidian's persistent storage on plugin load and saved after any change through the settings tab.

### Custom View Pattern
Views extend Obsidian's `ItemView` class and are registered in `onload()`. The `activateView()` method reuses existing view instances or creates new ones.

### Type-Safe Configuration
All configuration uses TypeScript interfaces with strict typing. Default settings are defined in `DEFAULT_SETTINGS` constant.

### CSS Variables
Styling uses Obsidian's CSS variables for theme consistency and automatic dark/light mode support.
