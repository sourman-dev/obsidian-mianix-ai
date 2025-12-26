/**
 * Memory and Index types for character dialogue history
 */

import type { MemoryEntry } from '../utils/bm25';

/**
 * Message index entry (lightweight, for quick lookup)
 */
export interface MessageIndexEntry {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  /** First 100 chars of content for preview */
  preview?: string;
}

/**
 * Character index file structure
 * Stored at: mianix-ai/characters/{slug}/index.json
 */
export interface CharacterIndex {
  /** Total message count */
  messageCount: number;
  /** Last update timestamp */
  lastUpdated: string;
  /** Message index (lightweight entries) */
  messages: MessageIndexEntry[];
  /** Extracted memories for BM25 search */
  memories: MemoryEntry[];
}

/**
 * Default empty index
 */
export const EMPTY_INDEX: CharacterIndex = {
  messageCount: 0,
  lastUpdated: new Date().toISOString(),
  messages: [],
  memories: [],
};
