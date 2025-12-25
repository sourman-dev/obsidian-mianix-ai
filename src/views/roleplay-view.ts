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

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('mianix-roleplay-container');
    container.createEl('div', {
      text: 'Roleplay View - React integration in Phase 2',
      cls: 'mianix-placeholder'
    });
  }

  async onClose(): Promise<void> {
    // React cleanup added in Phase 2
  }
}
