/** Sentinel for USelect `value` when `nullable` and model is null (inherit / none). */
export const NULL_TEMPERATURE_SELECT_VALUE = '__cadence_inherit_temperature__' as const

/** Default temperature USelect: 0, 0.1, …, 2 (step 0.1). */
export const DEFAULT_TEMPERATURE_SELECT_VALUES: readonly number[] = Array.from({ length: 21 }, (_, i) => Number((i * 0.1).toFixed(1)))

export function snapTemperatureToSelectStep(n: number): number {
  const clamped = Math.min(2, Math.max(0, n))
  return Number((Math.round(clamped * 10) / 10).toFixed(1))
}
