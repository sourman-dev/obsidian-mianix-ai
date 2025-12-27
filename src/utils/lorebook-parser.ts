/**
 * Lorebook Parser
 * Parses lorebook entries from markdown content
 *
 * Format:
 * ## Lorebook
 *
 * ### [Entry Name]
 * - keys: keyword1, keyword2
 * - always_active: false
 * - order: 100
 *
 * Entry content here...
 */

import { v4 as uuidv4 } from 'uuid';
import type { LorebookEntry } from '../types/lorebook';
import { DEFAULT_LOREBOOK_ENTRY } from '../types/lorebook';

/** Regex to find ## Lorebook section */
const LOREBOOK_SECTION_REGEX = /^##\s+Lorebook\s*$/m;

/** Regex to match individual entries: ### [Name] */
const ENTRY_HEADER_REGEX = /^###\s+\[([^\]]+)\]\s*$/;

/** Regex to parse metadata lines: - key: value */
const METADATA_REGEX = /^-\s+(\w+):\s*(.+)$/;

/**
 * Parse lorebook section from markdown content
 * @param content Full markdown content (body after frontmatter)
 * @returns Array of parsed lorebook entries
 */
export function parseLorebookSection(content: string): LorebookEntry[] {
  // Find ## Lorebook section
  const sectionMatch = content.match(LOREBOOK_SECTION_REGEX);
  if (!sectionMatch) {
    return [];
  }

  // Get content after "## Lorebook"
  const sectionStart = sectionMatch.index! + sectionMatch[0].length;
  const afterSection = content.slice(sectionStart);

  // Find next ## section to limit scope (or end of content)
  const nextSectionMatch = afterSection.match(/^##\s+[^#]/m);
  const sectionContent = nextSectionMatch
    ? afterSection.slice(0, nextSectionMatch.index)
    : afterSection;

  return parseLorebookEntries(sectionContent);
}

/**
 * Parse lorebook entries from section content
 * @param sectionContent Content within ## Lorebook section
 */
export function parseLorebookEntries(sectionContent: string): LorebookEntry[] {
  const entries: LorebookEntry[] = [];
  const lines = sectionContent.split('\n');

  let currentEntry: Partial<LorebookEntry> | null = null;
  let contentLines: string[] = [];
  let inMetadata = true;

  const flushEntry = () => {
    if (currentEntry?.name) {
      entries.push({
        id: currentEntry.id || uuidv4(),
        name: currentEntry.name,
        keys: currentEntry.keys || [],
        content: contentLines.join('\n').trim(),
        alwaysActive: currentEntry.alwaysActive ?? DEFAULT_LOREBOOK_ENTRY.alwaysActive,
        order: currentEntry.order ?? DEFAULT_LOREBOOK_ENTRY.order,
        enabled: currentEntry.enabled ?? DEFAULT_LOREBOOK_ENTRY.enabled,
      });
    }
  };

  for (const line of lines) {
    // Check for entry header: ### [Name]
    const headerMatch = line.match(ENTRY_HEADER_REGEX);
    if (headerMatch) {
      // Flush previous entry
      flushEntry();

      // Start new entry
      currentEntry = {
        id: uuidv4(),
        name: headerMatch[1],
        keys: [],
      };
      contentLines = [];
      inMetadata = true;
      continue;
    }

    if (!currentEntry) continue;

    // Check for metadata: - key: value
    if (inMetadata) {
      const metaMatch = line.match(METADATA_REGEX);
      if (metaMatch) {
        const [, key, value] = metaMatch;
        parseMetadata(currentEntry, key.toLowerCase(), value);
        continue;
      }

      // Empty line or non-metadata means content starts
      if (line.trim() && !line.startsWith('-')) {
        inMetadata = false;
      }
    }

    // Collect content lines
    if (!inMetadata || !line.startsWith('-')) {
      contentLines.push(line);
    }
  }

  // Flush last entry
  flushEntry();

  return entries;
}

/**
 * Parse metadata key-value into entry
 */
function parseMetadata(entry: Partial<LorebookEntry>, key: string, value: string): void {
  switch (key) {
    case 'keys':
      entry.keys = value.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      break;
    case 'always_active':
    case 'alwaysactive':
      entry.alwaysActive = value.toLowerCase() === 'true';
      break;
    case 'order':
      entry.order = parseInt(value, 10) || DEFAULT_LOREBOOK_ENTRY.order;
      break;
    case 'enabled':
      entry.enabled = value.toLowerCase() !== 'false';
      break;
    case 'id':
      entry.id = value;
      break;
  }
}

/**
 * Serialize lorebook entries to markdown section
 * @param entries Lorebook entries to serialize
 * @returns Markdown section content
 */
export function serializeLorebookSection(entries: LorebookEntry[]): string {
  if (entries.length === 0) {
    return '';
  }

  const lines: string[] = ['## Lorebook', ''];

  for (const entry of entries) {
    lines.push(`### [${entry.name}]`);
    lines.push(`- keys: ${entry.keys.join(', ')}`);
    lines.push(`- always_active: ${entry.alwaysActive}`);
    lines.push(`- order: ${entry.order}`);
    if (!entry.enabled) {
      lines.push(`- enabled: false`);
    }
    lines.push('');
    lines.push(entry.content);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Check if text contains any lorebook keywords
 * @param text Text to check
 * @param keywords Keywords to match (case-insensitive)
 * @returns true if any keyword matches
 */
export function matchesKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Update lorebook section in markdown content
 * Preserves other sections while replacing ## Lorebook
 */
export function updateLorebookInContent(
  content: string,
  entries: LorebookEntry[]
): string {
  const newSection = serializeLorebookSection(entries);

  // Find existing ## Lorebook section
  const sectionMatch = content.match(LOREBOOK_SECTION_REGEX);

  if (!sectionMatch) {
    // No existing section - append at end
    return content.trim() + '\n\n' + newSection;
  }

  // Find the end of the lorebook section (next ## or end)
  const sectionStart = sectionMatch.index!;
  const afterSection = content.slice(sectionStart + sectionMatch[0].length);
  const nextSectionMatch = afterSection.match(/^##\s+[^#]/m);

  const beforeSection = content.slice(0, sectionStart).trimEnd();
  const afterLorebook = nextSectionMatch
    ? afterSection.slice(nextSectionMatch.index)
    : '';

  // Rebuild content
  const parts = [beforeSection];
  if (newSection) {
    parts.push(newSection);
  }
  if (afterLorebook) {
    parts.push(afterLorebook);
  }

  return parts.join('\n\n').trim() + '\n';
}
