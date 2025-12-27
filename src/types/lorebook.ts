/**
 * Lorebook Types
 * Keyword-triggered world info entries for roleplay context injection
 */

/** Single lorebook entry */
export interface LorebookEntry {
  /** Unique identifier */
  id: string;
  /** Entry title/name */
  name: string;
  /** Trigger keywords (case-insensitive) */
  keys: string[];
  /** Content to inject into LLM context */
  content: string;
  /** Always include in context regardless of keywords */
  alwaysActive: boolean;
  /** Insertion priority (higher = closer to end = stronger influence) */
  order: number;
  /** Toggle on/off */
  enabled: boolean;
}

/** Lorebook container (private or shared) */
export interface Lorebook {
  /** Unique identifier */
  id: string;
  /** Lorebook name */
  name: string;
  /** Optional description */
  description?: string;
  /** Scope: private (per-character) or shared (global) */
  scope: 'private' | 'shared';
  /** Lorebook entries */
  entries: LorebookEntry[];
  /** Source file path for persistence */
  sourcePath: string;
}

/** Default values for new lorebook entry */
export const DEFAULT_LOREBOOK_ENTRY: Omit<LorebookEntry, 'id' | 'name' | 'keys' | 'content'> = {
  alwaysActive: false,
  order: 100,
  enabled: true,
};

/** Max active entries per request to prevent context bloat */
export const MAX_ACTIVE_ENTRIES = 5;

/** Default scan depth for keyword matching */
export const DEFAULT_SCAN_DEPTH = 5;
