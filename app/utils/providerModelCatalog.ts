export const MODEL_CATEGORIES = ['text_generation', 'image_generation', 'tts', 'stt'] as const

export type ModelCategory = (typeof MODEL_CATEGORIES)[number]

export const BILLING_UNITS = ['per_1m_tokens', 'per_1k_tokens', 'per_image', 'per_request', 'per_second', 'per_minute', 'per_1k_characters'] as const

export type BillingUnit = (typeof BILLING_UNITS)[number]

export function defaultBillingUnits(category: ModelCategory): {
  input: BillingUnit
  output: BillingUnit
} {
  switch (category) {
    case 'text_generation':
      return { input: 'per_1m_tokens', output: 'per_1m_tokens' }
    case 'image_generation':
      return { input: 'per_request', output: 'per_image' }
    case 'tts':
      return { input: 'per_1k_characters', output: 'per_second' }
    case 'stt':
      return { input: 'per_minute', output: 'per_1m_tokens' }
  }
}

export function parseOptionalPrice(raw: string): string | null {
  const trimmed = raw.trim()
  return trimmed === '' ? null : trimmed
}
