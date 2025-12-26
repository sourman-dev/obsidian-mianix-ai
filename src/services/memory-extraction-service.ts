/**
 * Memory Extraction Service
 *
 * Uses a fast/cheap LLM model to extract important facts from conversations.
 * Runs asynchronously after each LLM response to avoid blocking UI.
 */

import type { LLMProviderConfig } from '../types';
import type { MemoryEntry } from '../utils/bm25';
import { extractKeywords } from '../utils/bm25';

/** Extraction prompt for the LLM */
const EXTRACTION_PROMPT = `Phân tích đoạn hội thoại sau và trích xuất các thông tin quan trọng cần ghi nhớ.

Chỉ trích xuất những thông tin có giá trị lâu dài như:
- Sự thật về người dùng (tên, tuổi, nghề nghiệp, sở thích)
- Sự kiện quan trọng đã xảy ra
- Mối quan hệ giữa các nhân vật
- Quyết định hoặc cam kết của người dùng

KHÔNG trích xuất những thông tin tạm thời như cảm xúc nhất thời, câu hỏi đơn giản.

User: {userMessage}
AI: {aiMessage}

Trả về JSON array (KHÔNG dùng markdown code block):
[{"content": "mô tả ngắn gọn", "type": "fact|event|preference|relationship", "importance": 0.1-1.0}]

Nếu không có thông tin quan trọng nào, trả về: []`;

/** Extracted memory from LLM response */
interface ExtractedMemory {
  content: string;
  type: 'fact' | 'event' | 'preference' | 'relationship';
  importance: number;
}

export class MemoryExtractionService {
  constructor(private config: LLMProviderConfig) {}

  /**
   * Extract memories from a conversation turn
   * @param userMessage - User's message
   * @param aiMessage - AI's response
   * @param sourceMessageId - ID of the message for linking
   */
  async extractMemories(
    userMessage: string,
    aiMessage: string,
    sourceMessageId: string
  ): Promise<MemoryEntry[]> {
    try {
      const prompt = EXTRACTION_PROMPT.replace('{userMessage}', userMessage).replace(
        '{aiMessage}',
        aiMessage
      );

      const response = await this.callLLM(prompt);
      const extracted = this.parseResponse(response);

      // Convert to MemoryEntry with keywords
      return extracted.map((item) => ({
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        content: item.content,
        type: item.type,
        importance: item.importance,
        sourceMessageId,
        keywords: extractKeywords(item.content),
        createdAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Memory extraction failed:', error);
      return [];
    }
  }

  /**
   * Call the extraction LLM
   */
  private async callLLM(prompt: string): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, // Low temperature for consistent output
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Extraction API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '[]';
  }

  /**
   * Parse LLM response to extract memories
   */
  private parseResponse(response: string): ExtractedMemory[] {
    try {
      // Clean up response - remove markdown code blocks if present
      let jsonText = response.trim();

      // Try to find JSON array in response
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      } else {
        // Remove markdown code blocks
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(jsonText);

      if (!Array.isArray(parsed)) {
        return [];
      }

      // Validate and filter valid entries
      return parsed.filter(
        (item): item is ExtractedMemory =>
          typeof item.content === 'string' &&
          ['fact', 'event', 'preference', 'relationship'].includes(item.type) &&
          typeof item.importance === 'number' &&
          item.importance >= 0 &&
          item.importance <= 1
      );
    } catch {
      console.warn('Failed to parse extraction response:', response);
      return [];
    }
  }
}
