export default defineNuxtPlugin(() => {
  const { hydrateTheme } = useThemeStorage()
  hydrateTheme()
})
