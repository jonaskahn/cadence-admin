export function useI18nEntityLabels() {
  const { t } = useI18n()

  function providerLabel(provider: string): string {
    const key = `providers.${provider}`
    const val = t(key)
    return val !== key ? val : provider
  }

  function adminModelCategoryLabel(category: string): string {
    const key = `admin.modelCategory.${category}`
    const val = t(key)
    return val !== key ? val : category
  }

  return { providerLabel, adminModelCategoryLabel }
}
