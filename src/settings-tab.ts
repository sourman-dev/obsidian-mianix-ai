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
  }
}
