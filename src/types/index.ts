import type { App } from 'obsidian';

/** LLM provider configuration */
export interface LLMProviderConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

/** Plugin settings stored in data.json */
export interface MianixSettings {
  /** Main LLM for roleplay (can be expensive/slow thinking model) */
  llm: LLMProviderConfig;
  /** Extraction model for memory extraction (should be fast/cheap) */
  extractionModel?: LLMProviderConfig;
  /** Enable memory extraction after each response */
  enableMemoryExtraction: boolean;
}

/** Default settings */
export const DEFAULT_SETTINGS: MianixSettings = {
  llm: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    modelName: 'gpt-4-turbo',
  },
  extractionModel: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '', // Will use main API key if empty
    modelName: 'gpt-4o-mini',
  },
  enableMemoryExtraction: false, // Disabled by default until configured
};

/** Character card frontmatter */
export interface CharacterCard {
  id: string;
  name: string;
  avatar?: string; // Relative path to avatar image (e.g., "avatar.png")
  description: string;
  personality: string;
  scenario: string;
  firstMessage: string;
  createdAt: string;
}

/** Character card with file path info */
export interface CharacterCardWithPath extends CharacterCard {
  folderPath: string;
  filePath: string;
  avatarUrl?: string; // Data URL or vault resource URL for avatar
}

/** Form data for creating/editing characters */
export interface CharacterFormData {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  firstMessage: string;
}

/** LLM options per session */
export interface LLMOptions {
  temperature: number;
  topP: number;
  responseLength: number; // Target word count in response (used in prompt)
}

/** Dialogue session metadata (stored in session.json) */
export interface DialogueSession {
  id: string;
  characterId: string;
  createdAt: string;
  llmOptions: LLMOptions;
}

/** Dialogue message frontmatter */
export interface DialogueMessage {
  id: string;
  role: 'user' | 'assistant';
  parentId: string | null;
  timestamp: string;
  /** Suggested prompts extracted from assistant response */
  suggestions?: string[];
}

/** Dialogue message with content */
export interface DialogueMessageWithContent extends DialogueMessage {
  content: string;
  filePath: string;
}

/** App context for React components */
export interface AppContextType {
  app: App;
  settings: MianixSettings;
  saveSettings: () => Promise<void>;
}
