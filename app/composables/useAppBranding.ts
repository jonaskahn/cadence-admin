export function useAppBranding() {
  const config = useRuntimeConfig().public as { appName: string; appTagline: string }
  return {
    appName: config.appName,
    appTagline: config.appTagline,
    fullTitle: `${config.appName} - ${config.appTagline}`
  }
}
