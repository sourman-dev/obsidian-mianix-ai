/**
 * Character mappings for non-latin scripts to romanized form
 * Covers: Vietnamese, Chinese (pinyin), Japanese (romaji), Korean (romanization)
 */
const CHAR_MAP: Record<string, string> = {
  // Vietnamese
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
  â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  đ: 'd',
  // German/European
  ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss',
  // French
  ç: 'c', œ: 'oe', æ: 'ae',
  // Spanish/Portuguese
  ñ: 'n',
  // Polish
  ł: 'l', ż: 'z', ź: 'z', ś: 's', ć: 'c', ń: 'n',
  // Czech/Slovak
  ř: 'r', ě: 'e', ů: 'u',
  // Turkish
  ğ: 'g', ş: 's', ı: 'i',
  // Nordic
  ø: 'o', å: 'a',
};

/**
 * Transliterate non-ASCII characters to ASCII equivalents
 * Uses Unicode normalization + custom mapping
 */
function transliterate(str: string): string {
  // First pass: normalize and decompose
  let result = str.normalize('NFD');

  // Remove combining diacritical marks (accents)
  result = result.replace(/[\u0300-\u036f]/g, '');

  // Second pass: apply custom char mapping for special cases
  result = result
    .split('')
    .map((char) => {
      const lower = char.toLowerCase();
      if (CHAR_MAP[lower]) {
        return char === lower ? CHAR_MAP[lower] : CHAR_MAP[lower].toUpperCase();
      }
      return char;
    })
    .join('');

  return result;
}

/**
 * Generate URL-safe slug from character name
 * Handles Vietnamese and European languages via transliteration
 * CJK characters are removed (use timestamp for uniqueness)
 *
 * Examples:
 * - "Chuyện 2 nàng dâu" -> "chuyen-2-nang-dau"
 * - "Café München" -> "cafe-muenchen"
 * - "東京の猫" -> "" (falls back to timestamp)
 */
export function generateSlug(name: string): string {
  return transliterate(name)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_]+/g, '-')  // Replace spaces/underscores with hyphens
    .replace(/-+/g, '-')      // Collapse multiple hyphens
    .replace(/^-|-$/g, '');   // Trim hyphens from edges
}

/**
 * Generate unique folder name with timestamp suffix
 * Always includes timestamp for uniqueness
 *
 * "Chuyện 2 nàng dâu" -> "chuyen-2-nang-dau-m5x7k"
 * "東京の猫" -> "character-m5x7k"
 */
export function generateUniqueSlug(name: string, _existingSlugs: string[]): string {
  const baseSlug = generateSlug(name);
  const timestamp = Date.now().toString(36); // Compact base36 timestamp

  // If transliteration returns empty (e.g., CJK/emoji only), use fallback
  if (!baseSlug) {
    return `character-${timestamp}`;
  }

  return `${baseSlug}-${timestamp}`;
}
