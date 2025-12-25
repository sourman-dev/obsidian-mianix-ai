# Obsidian Plugin Development with React Integration - Research Report

## 1. Plugin API Basics

**manifest.json Structure**: Required fields include `id`, `name`, `author`, `version`, `minAppVersion`, `description`. Optional: `authorUrl`, `fundingUrl`, `isDesktopOnly`. The `id` must match the plugin folder name for proper settings functionality.

**Plugin Class Lifecycle**:
- `onload()` - Initialize UI, register handlers, setup intervals
- `onunload()` - Clean up listeners, clear intervals, remove UI elements
- All child components auto-unload recursively; registrations auto-cleaned via `registerEvent()`

**main.ts Entry Point**: Must extend Plugin class, import Obsidian API via `require('obsidian')`, bundle all external dependencies.

## 2. React Integration Patterns

**Modern Approach (React 18+)**: Use `createRoot` from `react-dom/client`, store root instance as class property, cleanup with `root.unmount()` in `onClose()`.

```typescript
// ItemView with React
async onOpen() {
  this.root = createRoot(this.containerEl.children[1]);
  this.root.render(<StrictMode><ReactView /></StrictMode>);
}

async onClose() {
  this.root?.unmount();
}
```

**Context Pattern**: Use React Context to pass App object globally to component tree for accessing Obsidian API.

**Mount Flexibility**: React components can mount on any HTMLElement (status bar items, ribbons, etc.) with proper cleanup.

## 3. Build Tooling

**esbuild Configuration**:
- Entry: `src/main.ts`
- Format: CommonJS (`cjs`)
- Target: ES2018
- External: `obsidian`, `electron`, `@codemirror/*`
- Output: `main.js` (single bundled file)
- Enable tree-shaking for optimization

**Project Structure**:
```
src/
├── main.ts (plugin class)
├── components/ (React components)
├── views/ (ItemView classes)
└── types/ (TypeScript definitions)
```

**Sample Projects**: obsidian-sample-plugin-with-react (React 19, TypeScript, hot reload), obsidian-react-starter (community template).

## 4. File Operations via Vault API

**Reading Files**:
- `cachedRead()` - For display (avoids disk reads)
- `read()` - For modify operations (avoids stale data)

**Common Operations**:
- `app.vault.getMarkdownFiles()` - List all markdown files
- `app.vault.getFiles()` - List all files
- `app.vault.modify(file, content)` - Update file content
- `app.vault.adapter.append(path, content)` - Append to file
- `app.vault.trash(file)` - Delete to trash

**Type Safety**: Always check TAbstractFile type before operations (file vs folder distinction).

## 5. Settings Tab Implementation

**PluginSettingTab Pattern**: Extend PluginSettingTab class, override display() method, use Setting class for UI elements.

**Setting UI Components**: Text inputs, toggles, dropdowns, buttons with reactive callbacks. Settings persisted to plugin data via `plugin.data.save()`.

**Style Settings Alternative**: Define configurable settings in CSS comments with YAML format for theme/plugin customization without code.

---

## Sources

- [Obsidian Plugin Developer Docs - Getting Started](https://docs.obsidian.md/Plugins/Getting+started)
- [Use React in Plugins](https://docs.obsidian.md/Plugins/Getting+started/Use+React+in+your+plugin)
- [Vault API Reference](https://docs.obsidian.md/Plugins/Vault)
- [Settings Documentation](https://docs.obsidian.md/Plugins/User+interface/Settings)
- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- [React Sample Plugin](https://github.com/karutt/obsidian-sample-plugin-with-react)
- [Obsidian React Starter](https://github.com/obsidian-community/obsidian-react-starter)

## Unresolved Questions

- Specific PluginSettingTab class method signatures and advanced validation patterns
- Hot reload development setup configuration details beyond project structure
- Error handling best practices for Vault API operations under concurrent access
