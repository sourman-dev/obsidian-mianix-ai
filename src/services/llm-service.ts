import type {
  MianixSettings,
  CharacterCardWithPath,
  DialogueMessageWithContent,
  LLMOptions,
} from '../types';
import { DEFAULT_LLM_OPTIONS } from '../presets';

/** OpenAI-compatible message format */
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Presets loaded from vault */
export interface LoadedPresets {
  multiModePrompt: string;
  outputFormatPrompt: string;
}

/** Context for LLM including memories */
export interface LLMContext {
  /** Retrieved memories from BM25 search (formatted string) */
  relevantMemories?: string;
}

/** Streaming callback */
type OnChunk = (chunk: string, done: boolean) => void;

/**
 * LLM Service for OpenAI-compatible APIs
 * Supports: OpenAI, OpenRouter, local models (Ollama, LM Studio), etc.
 */
export class LlmService {
  constructor(private settings: MianixSettings) {}

  /**
   * Build system prompt from character card + presets + memories
   */
  buildSystemPrompt(
    character: CharacterCardWithPath,
    presets: LoadedPresets,
    llmOptions: LLMOptions = DEFAULT_LLM_OPTIONS,
    context?: LLMContext
  ): string {
    const parts: string[] = [];

    // 1. Multi-mode roleplay prompt (persona system)
    parts.push(presets.multiModePrompt);

    // 2. Character card info
    parts.push('\n\n---\n## Character Information\n');
    parts.push(`**Name:** ${character.name}`);

    if (character.description) {
      parts.push(`\n**Description:** ${character.description}`);
    }

    if (character.personality) {
      parts.push(`\n**Personality:** ${character.personality}`);
    }

    if (character.scenario) {
      parts.push(`\n**Scenario:** ${character.scenario}`);
    }

    // 3. Long-term memories (from BM25 search)
    if (context?.relevantMemories) {
      parts.push('\n\n---\n## Long-term Memory\n');
      parts.push('**Thông tin quan trọng từ các cuộc trò chuyện trước:**\n');
      parts.push(context.relevantMemories);
    }

    // 4. Output format with responseLength
    const outputFormat = presets.outputFormatPrompt.replace(
      '${responseLength}',
      llmOptions.responseLength.toString()
    );
    parts.push('\n\n---\n');
    parts.push(outputFormat);

    return parts.join('');
  }

  /**
   * Build messages array for API call
   */
  buildMessages(
    character: CharacterCardWithPath,
    dialogueMessages: DialogueMessageWithContent[],
    presets: LoadedPresets,
    llmOptions: LLMOptions = DEFAULT_LLM_OPTIONS,
    context?: LLMContext
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // System prompt (includes memories if provided)
    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(character, presets, llmOptions, context),
    });

    // Dialogue history (only recent messages, not all)
    for (const msg of dialogueMessages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return messages;
  }

  /**
   * Send chat completion request (non-streaming)
   */
  async chat(
    character: CharacterCardWithPath,
    dialogueMessages: DialogueMessageWithContent[],
    presets: LoadedPresets,
    llmOptions: LLMOptions = DEFAULT_LLM_OPTIONS,
    context?: LLMContext
  ): Promise<string> {
    const { baseUrl, apiKey, modelName } = this.settings.llm;

    const messages = this.buildMessages(
      character,
      dialogueMessages,
      presets,
      llmOptions,
      context
    );

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: false,
        temperature: llmOptions.temperature,
        top_p: llmOptions.topP,
        // Note: maxTokens not sent - use responseLength in prompt instead
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Send chat completion request with streaming
   */
  async chatStream(
    character: CharacterCardWithPath,
    dialogueMessages: DialogueMessageWithContent[],
    onChunk: OnChunk,
    presets: LoadedPresets,
    llmOptions: LLMOptions = DEFAULT_LLM_OPTIONS,
    context?: LLMContext
  ): Promise<string> {
    const { baseUrl, apiKey, modelName } = this.settings.llm;

    const messages = this.buildMessages(
      character,
      dialogueMessages,
      presets,
      llmOptions,
      context
    );

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: true,
        temperature: llmOptions.temperature,
        top_p: llmOptions.topP,
        // Note: maxTokens not sent - use responseLength in prompt instead
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onChunk('', true);
              return fullContent;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk(content, false);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onChunk('', true);
    return fullContent;
  }
}
