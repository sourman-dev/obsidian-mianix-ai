# Code Standards & Patterns

**Last Updated:** 2025-12-25
**Version:** 1.0

## TypeScript Standards

### Configuration
- **Target:** ES2018 (broad browser compatibility)
- **Module System:** ESNext with bundler resolution
- **Strict Mode:** Enabled (`strict: true`)
- **JSX:** React JSX transform enabled
- **Path Aliases:** `@/*` maps to `src/*`

### Type Annotations
All function parameters and return types must be explicitly annotated:

```typescript
// Good
async function loadSettings(): Promise<void> {
  this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

// Bad
async function loadSettings() {
  // ...
}
```

### Interface Naming
Use `PascalCase` for interface names with semantic suffixes:

```typescript
// Settings interface
interface MianixSettings {
  llm: LLMConfig;
}

// Entity with file info
interface CharacterCardWithPath extends CharacterCard {
  filePath: string;
}

// Form data
interface CharacterFormData {
  name: string;
}

// Data with content
interface DialogueMessageWithContent extends DialogueMessage {
  content: string;
}

// Context/app types
interface AppContextType {
  app: App;
}
```

**Suffix conventions:**
- `WithPath`: Entity includes file path information
- `WithContent`: Entity includes text content
- `FormData`: Form submission payload
- `Type`: React context or app-wide types

### Const/Constant Naming
- Module-level constants: `UPPER_SNAKE_CASE`
- Type constants: Declare in separate constants file

```typescript
// constants.ts
export const VIEW_TYPE_ROLEPLAY = 'mianix-roleplay-view';
export const PLUGIN_ID = 'mianix-roleplay';
```

### Object Imports
Always use `import type` for type-only imports to reduce bundle size:

```typescript
// Good
import type { App } from 'obsidian';
import type MianixRoleplayPlugin from './main';

// Bad
import { App } from 'obsidian'; // Runtime import of type
```

## Code Organization

### File Structure
```
src/
├── main.ts                    # Plugin class & lifecycle
├── constants.ts              # Module constants
├── types/
│   └── index.ts             # All type definitions
├── settings-tab.ts          # Settings UI (one class per file)
└── views/
    └── roleplay-view.ts     # Custom view (one class per file)
```

**Principles:**
- One class per file (except closely related types)
- Type definitions centralized in `types/index.ts`
- Constants in dedicated file
- Views in subdirectory

### Class Organization
Classes should follow this member order:

```typescript
export class ClassName {
  // 1. Static members
  static staticMethod() {}

  // 2. Public properties
  publicProp: string;

  // 3. Constructor
  constructor() {}

  // 4. Lifecycle/Framework methods (onload, onunload, etc.)
  async onLoad(): Promise<void> {}

  // 5. Public methods
  publicMethod(): void {}

  // 6. Private methods
  private privateMethod(): void {}
}
```

### Obsidian Plugin Lifecycle
Required methods:
- `onload()`: Called when plugin enables; register views, commands, settings
- `onunload()`: Called when plugin disables; cleanup resources

```typescript
async onload(): Promise<void> {
  // 1. Load persisted state
  await this.loadSettings();

  // 2. Register UI components
  this.registerView(VIEW_TYPE, (leaf) => new MyView(leaf));
  this.addRibbonIcon('icon-name', 'Label', callback);
  this.addSettingTab(new MySettingTab());

  // 3. Register commands
  this.addCommand({
    id: 'command-id',
    name: 'Display Name',
    callback: () => this.method(),
  });

  console.log('Plugin loaded');
}

async onunload(): Promise<void> {
  console.log('Plugin unloaded');
}
```

## Settings Management

### Pattern
1. Define settings interface in `types/index.ts`
2. Create `DEFAULT_SETTINGS` constant next to interface
3. Load on plugin `onload()`
4. Save after each change

```typescript
// types/index.ts
export interface MianixSettings {
  llm: { baseUrl: string; apiKey: string; modelName: string };
}

export const DEFAULT_SETTINGS: MianixSettings = {
  llm: { baseUrl: 'https://api.openai.com/v1', apiKey: '', modelName: 'gpt-4' }
};

// main.ts
async loadSettings(): Promise<void> {
  this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings(): Promise<void> {
  await this.saveData(this.settings);
}

// settings-tab.ts
new Setting(containerEl)
  .setName('API Key')
  .addText((text) =>
    text.setValue(this.plugin.settings.llm.apiKey)
      .onChange(async (value) => {
        this.plugin.settings.llm.apiKey = value;
        await this.plugin.saveSettings();
      })
  );
```

## Obsidian Custom Views

### Implementation Pattern
```typescript
export class CustomView extends ItemView {
  plugin: PluginName;

  constructor(leaf: WorkspaceLeaf, plugin: PluginName) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_CONSTANT;
  }

  getDisplayText(): string {
    return 'Display Name';
  }

  getIcon(): string {
    return 'icon-name'; // Obsidian lucide icon
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    // Render UI here
  }

  async onClose(): Promise<void> {
    // Cleanup
  }
}
```

### View Activation Pattern
```typescript
async activateView(): Promise<void> {
  const { workspace } = this.app;
  let leaf: WorkspaceLeaf | null = null;
  const leaves = workspace.getLeavesOfType(VIEW_TYPE);

  if (leaves.length > 0) {
    leaf = leaves[0]; // Reuse existing
  } else {
    leaf = workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
  }

  if (leaf) {
    workspace.revealLeaf(leaf);
  }
}
```

## React Integration (Phase 2)

When integrating React in Phase 2, follow these patterns:

### JSX Configuration
TypeScript is configured with `"jsx": "react-jsx"` - no need to import React.

```typescript
// No import React needed with react-jsx
function Component() {
  return <div>Content</div>;
}
```

### Component Naming
- Components: `PascalCase`
- Files: Match component name or `index.ts` for component folder

```
views/
└── roleplay-view/
    ├── RoleplayView.tsx      # Main component
    ├── ChatPanel.tsx         # Subcomponent
    └── index.ts              # Re-exports
```

### Props Interface
```typescript
interface RoleplayViewProps {
  plugin: MianixRoleplayPlugin;
  settings: MianixSettings;
  onSettingsChange: (settings: MianixSettings) => Promise<void>;
}

function RoleplayView({ plugin, settings, onSettingsChange }: RoleplayViewProps) {
  // Component logic
}
```

### State Management (Zustand)
For global state, use Zustand with TypeScript:

```typescript
import create from 'zustand';

interface AppStore {
  characterId: string | null;
  setCharacterId: (id: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  characterId: null,
  setCharacterId: (id) => set({ characterId: id }),
}));

// Usage
function Component() {
  const characterId = useAppStore((state) => state.characterId);
  const setCharacterId = useAppStore((state) => state.setCharacterId);
  // ...
}
```

### Hook Pattern
Keep hooks in `hooks/` directory:

```
src/
├── hooks/
│   ├── useCharacters.ts    # Custom hook
│   └── useDialogue.ts
└── views/
```

## CSS Standards

### Class Naming
Use BEM (Block Element Modifier) with plugin prefix:

```css
.mianix-block { }
.mianix-block__element { }
.mianix-block--modifier { }

/* Example */
.mianix-chat { }
.mianix-chat__message { }
.mianix-chat__message--user { }
```

### CSS Variables
Always use Obsidian CSS variables for theme support:

```css
/* Good - automatic dark/light mode */
.mianix-text {
  color: var(--text-normal);
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
}

/* Bad - hardcoded colors */
.mianix-text {
  color: #000;
  background: #fff;
}
```

### Common Obsidian Variables
- `--text-normal`: Normal text color
- `--text-muted`: Dimmed/secondary text
- `--background-primary`: Main background
- `--background-modifier-border`: Border color
- `--interactive-accent`: Accent color

### Layout Patterns
```css
/* Flexbox containers */
.mianix-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
}

/* Scrollable content */
.mianix-scrollable {
  overflow-y: auto;
  flex: 1;
}

/* Fixed sidebar */
.mianix-sidebar {
  width: 240px;
  min-width: 200px;
  border-right: 1px solid var(--background-modifier-border);
  overflow-y: auto;
}
```

## Async/Await

Always use `async/await` for Promise-based operations:

```typescript
// Good
async function loadData(): Promise<void> {
  const data = await this.loadData();
  this.settings = Object.assign({}, DEFAULT, data);
}

// Bad
function loadData(): Promise<void> {
  return this.loadData().then(data => {
    this.settings = Object.assign({}, DEFAULT, data);
  });
}
```

## Error Handling

Use try-catch for async operations; log errors:

```typescript
async function operation(): Promise<void> {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    console.error('Operation failed:', error);
    // Handle gracefully or rethrow
    throw error;
  }
}
```

## Comments

Comments should explain *why*, not what:

```typescript
// Good - explains reasoning
const leaves = workspace.getLeavesOfType(VIEW_TYPE);
if (leaves.length > 0) {
  // Reuse existing view to maintain scroll position & state
  leaf = leaves[0];
}

// Bad - just repeats code
// Check if there are leaves
if (leaves.length > 0) {
  // Get first leaf
  leaf = leaves[0];
}
```

## Build Considerations

### Bundle Size
- Minimize dependencies (currently 5 runtime deps)
- Use `import type` for type-only imports
- Externalize: obsidian, electron, codemirror modules

### Development
- `npm run dev`: Watch mode with inline sourcemaps for debugging
- Preserve original formatting for error messages

### Production
- `npm run build`: Minified output, no sourcemaps
- Tree-shaking enabled in esbuild

## Naming Conventions Summary

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `settings-tab.ts` |
| Directories | kebab-case | `src/views/` |
| Classes | PascalCase | `MianixSettingTab` |
| Interfaces | PascalCase | `CharacterCard` |
| Functions | camelCase | `activateView()` |
| Constants | UPPER_SNAKE_CASE | `VIEW_TYPE_ROLEPLAY` |
| CSS classes | kebab-case with prefix | `.mianix-container` |
| Properties | camelCase | `baseUrl`, `apiKey` |
| Methods | camelCase | `loadSettings()` |

## Testing (Future)

When implementing tests:
- Test files: `*.test.ts` or `*.spec.ts`
- Test directory: `tests/` parallel to `src/`
- Framework: Vitest or Jest (TypeScript compatible)
