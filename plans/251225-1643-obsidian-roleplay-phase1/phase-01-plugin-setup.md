# Phase 1: Plugin Setup

**Status:** In Progress
**Updated:** 2024-12-25T18:49:00Z
**Completion:** 85% (11 of 13 core tasks completed)

---

## Context

First phase establishes Obsidian plugin boilerplate with TypeScript, React, and esbuild. Creates foundation for all subsequent phases.

## Overview

- Create manifest.json with plugin metadata
- Setup main.ts entry point extending Plugin class
- Configure esbuild for React/TypeScript bundling
- Setup package.json with dependencies
- Create folder structure

**Effort:** 3 hours

---

## Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Plugin loads in Obsidian | P0 | Basic functionality |
| TypeScript strict mode | P1 | Type safety |
| React 18 bundled | P1 | UI framework |
| Hot reload dev setup | P2 | Developer experience |
| ESLint config | P3 | Code quality |

---

## Architecture

```
mianix-roleplay/
├── manifest.json          # Plugin metadata
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── esbuild.config.mjs     # Build config
├── styles.css             # Base styles
├── src/
│   ├── main.ts            # Plugin entry point
│   ├── types/
│   │   └── index.ts       # Type definitions
│   ├── constants.ts       # VIEW_TYPE, etc.
│   └── settings.ts        # Default settings
└── dist/
    └── main.js            # Bundled output (gitignored)
```

---

## Implementation Steps

### Step 1: Create manifest.json

```json
{
  "id": "mianix-roleplay",
  "name": "Mianix Roleplay",
  "version": "0.1.0",
  "minAppVersion": "1.0.0",
  "description": "AI roleplay with character cards and LLM integration",
  "author": "Mianix",
  "authorUrl": "https://github.com/mianix",
  "isDesktopOnly": false
}
```

**Notes:**
- `id` must match plugin folder name
- `minAppVersion: 1.0.0` for broad compatibility
- `isDesktopOnly: false` enables mobile support

---

### Step 2: Create package.json

```json
{
  "name": "mianix-roleplay",
  "version": "0.1.0",
  "description": "Obsidian roleplay plugin",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "node esbuild.config.mjs production",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "builtin-modules": "^3.3.0",
    "esbuild": "^0.19.0",
    "obsidian": "latest",
    "typescript": "^5.3.0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "gray-matter": "^4.0.3"
  }
}
```

---

### Step 3: Create tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "jsx": "react-jsx",
    "lib": ["ES2018", "DOM"],
    "paths": {
      "@/*": ["src/*"]
    },
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

**Key settings:**
- `strict: true` - Full type checking
- `jsx: react-jsx` - React 17+ JSX transform
- `moduleResolution: bundler` - Modern resolution

---

### Step 4: Create esbuild.config.mjs

```javascript
import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';
import fs from 'fs';

const production = process.argv[2] === 'production';

const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtins,
  ],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: production ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: production,
});

if (production) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
```

**Notes:**
- Externalizes Obsidian and CodeMirror modules
- Watch mode for development
- Source maps in dev only

---

### Step 5: Create src/constants.ts

```typescript
export const VIEW_TYPE_ROLEPLAY = 'mianix-roleplay-view';
export const PLUGIN_ID = 'mianix-roleplay';
export const CHARACTERS_FOLDER = 'characters';
```

---

### Step 6: Create src/types/index.ts

```typescript
import type { App } from 'obsidian';

// Plugin settings stored in data.json
export interface MianixSettings {
  llm: {
    baseUrl: string;
    apiKey: string;
    modelName: string;
  };
}

// Default settings
export const DEFAULT_SETTINGS: MianixSettings = {
  llm: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    modelName: 'gpt-4-turbo',
  },
};

// Character card frontmatter
export interface CharacterCard {
  id: string;
  name: string;
  description: string;
  personality: string;
  scenario: string;
  firstMessage: string;
  createdAt: string;
}

// Dialogue message frontmatter
export interface DialogueMessage {
  id: string;
  role: 'user' | 'assistant';
  parentId: string | null;
  timestamp: string;
}

// App context for React components
export interface AppContextType {
  app: App;
  settings: MianixSettings;
  saveSettings: () => Promise<void>;
}
```

---

### Step 7: Create src/main.ts

```typescript
import { Plugin, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_ROLEPLAY } from './constants';
import { MianixSettings, DEFAULT_SETTINGS } from './types';
import { RoleplayView } from './views/roleplay-view';
import { MianixSettingTab } from './settings-tab';

export default class MianixRoleplayPlugin extends Plugin {
  settings: MianixSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    // Register custom view
    this.registerView(VIEW_TYPE_ROLEPLAY, (leaf) => new RoleplayView(leaf, this));

    // Add ribbon icon
    this.addRibbonIcon('message-square', 'Mianix Roleplay', () => {
      this.activateView();
    });

    // Add settings tab
    this.addSettingTab(new MianixSettingTab(this.app, this));

    // Add command to open view
    this.addCommand({
      id: 'open-roleplay-view',
      name: 'Open Roleplay View',
      callback: () => this.activateView(),
    });
  }

  async onunload() {
    // Cleanup handled by Obsidian's view unloading
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_ROLEPLAY);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_ROLEPLAY, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
}
```

---

### Step 8: Create src/settings-tab.ts (stub)

```typescript
import { App, PluginSettingTab, Setting } from 'obsidian';
import type MianixRoleplayPlugin from './main';

export class MianixSettingTab extends PluginSettingTab {
  plugin: MianixRoleplayPlugin;

  constructor(app: App, plugin: MianixRoleplayPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Mianix Roleplay Settings' });

    // LLM settings added in Phase 5
    containerEl.createEl('p', { text: 'LLM settings will be added here.' });
  }
}
```

---

### Step 9: Create src/views/roleplay-view.ts (stub)

```typescript
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_ROLEPLAY } from '../constants';
import type MianixRoleplayPlugin from '../main';

export class RoleplayView extends ItemView {
  plugin: MianixRoleplayPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: MianixRoleplayPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_ROLEPLAY;
  }

  getDisplayText(): string {
    return 'Mianix Roleplay';
  }

  getIcon(): string {
    return 'message-square';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('div', { text: 'Roleplay View - React integration in Phase 2' });
  }

  async onClose() {
    // React cleanup added in Phase 2
  }
}
```

---

### Step 10: Create styles.css

```css
/* Mianix Roleplay Plugin Styles */
.mianix-roleplay-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px;
}
```

---

## Todo List

- [x] Create folder structure: `mkdir -p src/types src/views src/services src/components`
- [x] Create manifest.json
- [x] Create package.json
- [x] Run `pnpm install`
- [x] Create tsconfig.json
- [x] Create esbuild.config.mjs
- [x] Create src/constants.ts
- [x] Create src/types/index.ts
- [x] Create src/main.ts
- [x] Create src/settings-tab.ts (✨ Full LLM settings UI implemented, not stub)
- [x] Create src/views/roleplay-view.ts
- [x] Create styles.css
- [x] Run `pnpm dev` and verify build
- [x] Symlink to vault's plugins folder (Completed: 2024-12-25T18:49:00Z)
- [ ] Enable plugin in Obsidian, verify loads without errors (In Progress - Testing phase)

**Code Review:** See [code-reviewer-251225-1843-phase1-plugin-setup.md](../reports/code-reviewer-251225-1843-phase1-plugin-setup.md)
- TypeCheck: ✅ Passed
- Build: ✅ Successful (2.8KB bundle)
- Security: ✅ No vulnerabilities
- Critical Issues: 0
- Recommended: Fix package.json obsidian version, add .gitignore

---

## Success Criteria

1. `pnpm build` produces main.js without errors
2. Plugin appears in Obsidian's Community Plugins list
3. Ribbon icon visible and clickable
4. View opens in right sidebar with placeholder text
5. Settings tab visible in Obsidian settings

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| esbuild config errors | High | Medium | Copy from sample-plugin-with-react |
| TypeScript path aliases fail | Medium | Low | Fallback to relative imports |
| Obsidian version mismatch | Low | Low | Test on multiple versions |

---

## Verification Commands

```bash
# Build
pnpm build

# Verify output exists
ls -la main.js

# Symlink to vault (replace path)
ln -s $(pwd) ~/.obsidian/plugins/mianix-roleplay

# Check in Obsidian
# 1. Open Settings > Community Plugins
# 2. Disable Safe Mode if needed
# 3. Enable Mianix Roleplay
# 4. Check console for errors
```

---

## Next Phase

Proceed to [Phase 2: React Views](./phase-02-react-views.md) after plugin loads successfully.
