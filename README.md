# Mianix AI - Obsidian Roleplay Plugin

An AI-powered roleplay companion plugin for Obsidian. Chat with AI characters, import character cards, and have immersive conversations - all stored as markdown files in your vault.

## Features

- **Character Cards**: Import PNG character cards (SillyTavern/Chub.ai format) or create your own
- **AI Chat**: Chat with characters using OpenAI-compatible APIs
- **Markdown Storage**: All messages stored as markdown files - edit, search, and link them like any other note
- **Memory System**: BM25-based memory retrieval for context-aware conversations
- **Mobile-First UI**: Responsive design optimized for Obsidian Mobile
- **LLM Options**: Customize temperature, top-p, and response length per character

## Installation

### Via BRAT (Recommended)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin from Obsidian Community Plugins
2. Open BRAT settings
3. Click "Add Beta plugin"
4. Enter: `sourman-dev/obsidian-mianix-ai`
5. Click "Add Plugin"
6. Enable "Mianix Roleplay" in Community Plugins

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from [Releases](https://github.com/sourman-dev/obsidian-mianix-ai/releases)
2. Create folder: `<vault>/.obsidian/plugins/mianix-roleplay/`
3. Copy downloaded files into the folder
4. Reload Obsidian and enable the plugin

## Configuration

1. Go to **Settings > Mianix Roleplay**
2. Configure your LLM provider:
   - **Base URL**: API endpoint (e.g., `https://api.openai.com/v1`)
   - **API Key**: Your API key
   - **Model**: Model name (e.g., `gpt-4-turbo`, `claude-3-opus`)

### Optional: Memory Extraction

Enable automatic memory extraction to help the AI remember important facts:
- Toggle "Enable Memory Extraction"
- Configure a fast/cheap model (e.g., `gpt-4o-mini`, `gemini-2.0-flash`)

## Usage

1. Click the message icon in the ribbon or use command palette: "Open Roleplay View"
2. Import a character card (PNG) or create a new character
3. Start chatting!

### File Structure

```
mianix-ai/
├── characters/
│   └── {character-slug}/
│       ├── card.md          # Character info
│       ├── avatar.png       # Character image
│       ├── session.json     # LLM settings
│       ├── index.json       # Message index + memories
│       └── messages/
│           ├── 001.md       # First message
│           ├── 002.md       # Second message
│           └── ...
└── presets/
    ├── multi-mode.md        # Roleplay prompt
    └── output-format.md     # Output formatting
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Development build with watch
pnpm dev
```

## License

MIT

## Credits

- Built with [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- React integration for modern UI
- BM25 search for memory retrieval
