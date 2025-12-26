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

    // LLM settings section
    containerEl.createEl('h3', { text: 'LLM Provider' });

    new Setting(containerEl)
      .setName('Base URL')
      .setDesc('OpenAI-compatible API endpoint')
      .addText((text) =>
        text
          .setPlaceholder('https://api.openai.com/v1')
          .setValue(this.plugin.settings.llm.baseUrl)
          .onChange(async (value) => {
            this.plugin.settings.llm.baseUrl = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Your API key (stored locally)')
      .addText((text) => {
        text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings.llm.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.llm.apiKey = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      });

    new Setting(containerEl)
      .setName('Model Name')
      .setDesc('Model identifier to use')
      .addText((text) =>
        text
          .setPlaceholder('gpt-4-turbo')
          .setValue(this.plugin.settings.llm.modelName)
          .onChange(async (value) => {
            this.plugin.settings.llm.modelName = value;
            await this.plugin.saveSettings();
          })
      );

    // Memory Extraction section
    containerEl.createEl('h3', { text: 'Memory Extraction (RAG)' });

    new Setting(containerEl)
      .setName('Enable Memory Extraction')
      .setDesc(
        'Extract important facts from conversations using a fast/cheap model. Enables long-term memory for characters.'
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableMemoryExtraction)
          .onChange(async (value) => {
            this.plugin.settings.enableMemoryExtraction = value;
            await this.plugin.saveSettings();
            // Refresh to show/hide extraction model settings
            this.display();
          })
      );

    // Show extraction model settings only if enabled
    if (this.plugin.settings.enableMemoryExtraction) {
      // Initialize extractionModel if not exists
      if (!this.plugin.settings.extractionModel) {
        this.plugin.settings.extractionModel = {
          baseUrl: this.plugin.settings.llm.baseUrl,
          apiKey: '',
          modelName: 'gpt-4o-mini',
        };
      }

      new Setting(containerEl)
        .setName('Extraction Model - Base URL')
        .setDesc('API endpoint for extraction model (leave empty to use main)')
        .addText((text) =>
          text
            .setPlaceholder('Same as main LLM')
            .setValue(this.plugin.settings.extractionModel?.baseUrl || '')
            .onChange(async (value) => {
              if (this.plugin.settings.extractionModel) {
                this.plugin.settings.extractionModel.baseUrl =
                  value || this.plugin.settings.llm.baseUrl;
                await this.plugin.saveSettings();
              }
            })
        );

      new Setting(containerEl)
        .setName('Extraction Model - API Key')
        .setDesc('API key for extraction model (leave empty to use main)')
        .addText((text) => {
          text
            .setPlaceholder('Same as main LLM')
            .setValue(this.plugin.settings.extractionModel?.apiKey || '')
            .onChange(async (value) => {
              if (this.plugin.settings.extractionModel) {
                this.plugin.settings.extractionModel.apiKey = value;
                await this.plugin.saveSettings();
              }
            });
          text.inputEl.type = 'password';
        });

      new Setting(containerEl)
        .setName('Extraction Model - Model Name')
        .setDesc('Fast/cheap model: gpt-4o-mini, gemini-2.0-flash, kimi-2, glm-4-flash')
        .addText((text) =>
          text
            .setPlaceholder('gpt-4o-mini')
            .setValue(this.plugin.settings.extractionModel?.modelName || '')
            .onChange(async (value) => {
              if (this.plugin.settings.extractionModel) {
                this.plugin.settings.extractionModel.modelName = value;
                await this.plugin.saveSettings();
              }
            })
        );
    }

    // Presets section
    containerEl.createEl('h3', { text: 'Global Presets' });

    new Setting(containerEl)
      .setName('Reset Presets')
      .setDesc(
        'Restore all presets to default values. Your custom modifications will be overwritten.'
      )
      .addButton((btn) =>
        btn
          .setButtonText('Reset to Default')
          .setWarning()
          .onClick(async () => {
            await this.plugin.presetService.resetPresets();
            // Show notice
            const { Notice } = await import('obsidian');
            new Notice('Presets have been reset to defaults.');
          })
      );

    new Setting(containerEl)
      .setName('Open Presets Folder')
      .setDesc('Edit global prompts in mianix-ai/presets/')
      .addButton((btn) =>
        btn.setButtonText('Open Folder').onClick(async () => {
          const { PRESETS_FOLDER } = await import('./constants');
          const folder = this.app.vault.getAbstractFileByPath(PRESETS_FOLDER);
          if (folder) {
            // Reveal in file explorer
            const fileExplorer =
              this.app.workspace.getLeavesOfType('file-explorer')[0];
            if (fileExplorer) {
              // @ts-expect-error - accessing internal API
              fileExplorer.view.revealInFolder(folder);
            }
          }
        })
      );
  }
}
