/** Curated BCP-47 tags for conversation-starters language pickers (not exhaustive). */
export const BCP47_LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'de', label: 'Deutsch' },
  { value: 'vi-VN', label: 'Tiếng Việt' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh-CN', label: '中文（简体）' },
  { value: 'zh-TW', label: '中文（繁體）' },
  { value: 'ar', label: 'العربية' },
  { value: 'ru', label: 'Русский' },
  { value: 'it', label: 'Italiano' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'th', label: 'ภาษาไทย' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' }
] as const

export type Bcp47Language = (typeof BCP47_LANGUAGES)[number]

export function bcp47LabelFor(tag: string): string {
  const found = BCP47_LANGUAGES.find((l) => l.value === tag)
  return found?.label ?? tag
}
