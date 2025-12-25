import { Plugin, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_ROLEPLAY } from './constants';
import { MianixSettings, DEFAULT_SETTINGS } from './types';
import { RoleplayView } from './views/roleplay-view';
import { MianixSettingTab } from './settings-tab';

export default class MianixRoleplayPlugin extends Plugin {
  settings: MianixSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Register custom view
    this.registerView(
      VIEW_TYPE_ROLEPLAY,
      (leaf) => new RoleplayView(leaf, this)
    );

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

    console.log('Mianix Roleplay plugin loaded');
  }

  async onunload(): Promise<void> {
    console.log('Mianix Roleplay plugin unloaded');
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async activateView(): Promise<void> {
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
