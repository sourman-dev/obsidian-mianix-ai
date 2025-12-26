/**
 * IndexService - Manages index.json for each character
 *
 * Provides fast message/memory lookup without reading all files.
 * Uses BM25 for keyword-based memory retrieval.
 */

import { App, TFile, normalizePath } from 'obsidian';
import type { CharacterIndex, MessageIndexEntry } from '../types/memory';
import { EMPTY_INDEX } from '../types/memory';
import { BM25Search, extractKeywords, type MemoryEntry } from '../utils/bm25';

export class IndexService {
  private indexCache: Map<string, CharacterIndex> = new Map();
  private bm25Cache: Map<string, BM25Search> = new Map();

  constructor(private app: App) {}

  /**
   * Get index file path for a character
   */
  private getIndexPath(characterFolderPath: string): string {
    return normalizePath(`${characterFolderPath}/index.json`);
  }

  /**
   * Load index from file or return empty index
   */
  async loadIndex(characterFolderPath: string): Promise<CharacterIndex> {
    // Check cache first
    const cached = this.indexCache.get(characterFolderPath);
    if (cached) return cached;

    const indexPath = this.getIndexPath(characterFolderPath);
    const file = this.app.vault.getAbstractFileByPath(indexPath);

    if (!(file instanceof TFile)) {
      return { ...EMPTY_INDEX };
    }

    try {
      const content = await this.app.vault.read(file);
      const index = JSON.parse(content) as CharacterIndex;

      // Cache it
      this.indexCache.set(characterFolderPath, index);
      this.bm25Cache.set(characterFolderPath, new BM25Search(index.memories));

      return index;
    } catch {
      return { ...EMPTY_INDEX };
    }
  }

  /**
   * Save index to file
   */
  async saveIndex(
    characterFolderPath: string,
    index: CharacterIndex
  ): Promise<void> {
    const indexPath = this.getIndexPath(characterFolderPath);
    index.lastUpdated = new Date().toISOString();

    const content = JSON.stringify(index, null, 2);
    const file = this.app.vault.getAbstractFileByPath(indexPath);

    if (file instanceof TFile) {
      await this.app.vault.modify(file, content);
    } else {
      try {
        await this.app.vault.create(indexPath, content);
      } catch {
        // File may have been created by another call, try modify instead
        const newFile = this.app.vault.getAbstractFileByPath(indexPath);
        if (newFile instanceof TFile) {
          await this.app.vault.modify(newFile, content);
        }
      }
    }

    // Update cache
    this.indexCache.set(characterFolderPath, index);
    this.bm25Cache.set(characterFolderPath, new BM25Search(index.memories));
  }

  /**
   * Add a message to index (called after saving message file)
   */
  async addMessageToIndex(
    characterFolderPath: string,
    message: MessageIndexEntry
  ): Promise<void> {
    const index = await this.loadIndex(characterFolderPath);

    index.messages.push(message);
    index.messageCount = index.messages.length;

    await this.saveIndex(characterFolderPath, index);
  }

  /**
   * Remove a message from index (called after deleting message file)
   */
  async removeMessageFromIndex(
    characterFolderPath: string,
    messageId: string
  ): Promise<void> {
    const index = await this.loadIndex(characterFolderPath);

    index.messages = index.messages.filter((m) => m.id !== messageId);
    index.messageCount = index.messages.length;

    // Also remove any memories linked to this message
    index.memories = index.memories.filter(
      (m) => m.sourceMessageId !== messageId
    );

    await this.saveIndex(characterFolderPath, index);
  }

  /**
   * Add a memory to index (for future extraction model integration)
   */
  async addMemory(
    characterFolderPath: string,
    memory: Omit<MemoryEntry, 'keywords'>
  ): Promise<void> {
    const index = await this.loadIndex(characterFolderPath);

    const memoryWithKeywords: MemoryEntry = {
      ...memory,
      keywords: extractKeywords(memory.content),
    };

    index.memories.push(memoryWithKeywords);
    await this.saveIndex(characterFolderPath, index);
  }

  /**
   * Search for relevant memories using BM25
   * @param characterFolderPath - Character folder path
   * @param query - User input to match against
   * @param limit - Max results (default 5)
   */
  async searchMemories(
    characterFolderPath: string,
    query: string,
    limit: number = 5
  ): Promise<MemoryEntry[]> {
    // Get or create BM25 search instance
    let bm25 = this.bm25Cache.get(characterFolderPath);

    if (!bm25) {
      const index = await this.loadIndex(characterFolderPath);
      bm25 = new BM25Search(index.memories);
      this.bm25Cache.set(characterFolderPath, bm25);
    }

    return bm25.search(query, limit);
  }

  /**
   * Get recent message IDs for loading full content
   * @param characterFolderPath - Character folder path
   * @param count - Number of recent messages (default 10)
   */
  async getRecentMessageIds(
    characterFolderPath: string,
    count: number = 10
  ): Promise<string[]> {
    const index = await this.loadIndex(characterFolderPath);
    return index.messages.slice(-count).map((m) => m.id);
  }

  /**
   * Clear cache for a character (call when character is deleted)
   */
  clearCache(characterFolderPath: string): void {
    this.indexCache.delete(characterFolderPath);
    this.bm25Cache.delete(characterFolderPath);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.indexCache.clear();
    this.bm25Cache.clear();
  }
}
