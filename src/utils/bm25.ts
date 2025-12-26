/**
 * BM25 Search Implementation - Pure JavaScript, no LLM needed
 *
 * BM25 (Best Matching 25) is a ranking function for text retrieval.
 * Used here to find relevant memories based on keyword matching.
 */

// Vietnamese stopwords - common words to ignore
const STOPWORDS = new Set([
  // Vietnamese
  'và', 'là', 'của', 'có', 'được', 'cho', 'này', 'đó', 'với', 'trong',
  'từ', 'để', 'theo', 'khi', 'nếu', 'nhưng', 'như', 'vì', 'do', 'bởi',
  'tôi', 'bạn', 'anh', 'chị', 'em', 'nó', 'họ', 'chúng', 'ta', 'mình',
  'một', 'các', 'những', 'cái', 'con', 'người', 'việc', 'điều', 'chuyện',
  'đã', 'đang', 'sẽ', 'rồi', 'rất', 'lắm', 'quá', 'thì', 'mà', 'hay',
  'cũng', 'còn', 'nữa', 'lại', 'ra', 'vào', 'lên', 'xuống', 'về',
  // English
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
  'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these',
  'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how',
]);

/**
 * Tokenize text into keywords for BM25 search
 * Works for both Vietnamese and English
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFC') // Normalize Vietnamese Unicode
    .replace(/[.,!?;:()\[\]{}""''\"\']/g, ' ') // Remove punctuation
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * Calculate term frequency (TF) for a term in a document
 */
function termFrequency(term: string, tokens: string[]): number {
  return tokens.filter((t) => t === term).length;
}

/**
 * BM25 scoring parameters
 */
const BM25_K1 = 1.5; // Term frequency saturation
const BM25_B = 0.75; // Length normalization

/**
 * Memory entry with keywords for BM25 search
 */
export interface MemoryEntry {
  id: string;
  content: string;
  type: 'fact' | 'event' | 'preference' | 'relationship';
  importance: number;
  sourceMessageId: string;
  keywords: string[];
  createdAt: string;
}

/**
 * BM25 Search Engine for memories
 */
export class BM25Search {
  private memories: MemoryEntry[] = [];
  private avgDocLength: number = 0;
  private docFrequency: Map<string, number> = new Map();

  constructor(memories: MemoryEntry[] = []) {
    this.setMemories(memories);
  }

  /**
   * Set/update the memory corpus
   */
  setMemories(memories: MemoryEntry[]): void {
    this.memories = memories;

    if (memories.length === 0) {
      this.avgDocLength = 0;
      this.docFrequency.clear();
      return;
    }

    // Calculate average document length
    const totalLength = memories.reduce((sum, m) => sum + m.keywords.length, 0);
    this.avgDocLength = totalLength / memories.length;

    // Calculate document frequency for each term
    this.docFrequency.clear();
    for (const memory of memories) {
      const uniqueTerms = new Set(memory.keywords);
      for (const term of uniqueTerms) {
        this.docFrequency.set(term, (this.docFrequency.get(term) || 0) + 1);
      }
    }
  }

  /**
   * Calculate IDF (Inverse Document Frequency) for a term
   */
  private idf(term: string): number {
    const n = this.memories.length;
    const df = this.docFrequency.get(term) || 0;
    // BM25 IDF formula with smoothing
    return Math.log((n - df + 0.5) / (df + 0.5) + 1);
  }

  /**
   * Calculate BM25 score for a document given query terms
   */
  private score(memory: MemoryEntry, queryTerms: string[]): number {
    const docLength = memory.keywords.length;
    let score = 0;

    for (const term of queryTerms) {
      const tf = termFrequency(term, memory.keywords);
      if (tf === 0) continue;

      const idf = this.idf(term);
      // BM25 scoring formula
      const numerator = tf * (BM25_K1 + 1);
      const denominator =
        tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLength / this.avgDocLength));
      score += idf * (numerator / denominator);
    }

    // Boost by importance
    return score * (0.5 + memory.importance * 0.5);
  }

  /**
   * Search for relevant memories given a query
   * @param query - User input text
   * @param limit - Maximum number of results
   * @param minScore - Minimum BM25 score threshold
   */
  search(query: string, limit: number = 5, minScore: number = 0.5): MemoryEntry[] {
    if (this.memories.length === 0) return [];

    const queryTerms = tokenize(query);
    if (queryTerms.length === 0) return [];

    // Score all memories
    const scored = this.memories
      .map((memory) => ({
        memory,
        score: this.score(memory, queryTerms),
      }))
      .filter((item) => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((item) => item.memory);
  }
}

/**
 * Extract keywords from content for storage
 * Use this when saving a new memory
 */
export function extractKeywords(content: string): string[] {
  return [...new Set(tokenize(content))]; // Unique keywords only
}
