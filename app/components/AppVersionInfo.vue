<script lang="ts" setup>
const config = useRuntimeConfig()
const toast = useToast()
const { t } = useI18n()

defineProps<{
  collapsed?: boolean
}>()

const { appName } = useAppBranding()

const copyright = computed(() => {
  const raw = (config.public.copyright as string) || ''
  return `${raw.replace('{year}', String(new Date().getFullYear()))} ${appName}`
})
const versionText = computed(() => `v${(config.public.appVersion as string) || 'dev'}`)
const hashText = computed(() => {
  const hash = (config.public.gitHash as string) || ''
  return hash ? `#${hash.slice(0, 7)}` : ''
})

async function copyVersionInfo() {
  const parts = [copyright.value, versionText.value, hashText.value].filter(Boolean)
  try {
    await navigator.clipboard.writeText(parts.join(' '))
    toast.add({ title: t('footer.copied'), icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: t('footer.failedCopy'), color: 'error' })
  }
}
</script>

<template>
  <button
    type="button"
    class="flex flex-wrap gap-x-2 gap-y-0.5 m-2 text-[10px] text-dimmed transition-colors hover:text-primary-500 hover:cursor-copy"
    :class="collapsed ? 'flex-col' : ''"
    :title="t('footer.copyVersion')"
    @click="copyVersionInfo"
  >
    <span class="items-center justify-center justify-items-center">
      <span>{{ copyright }}</span>
      <span class="font-mono"> | {{ versionText }}</span>
      <span v-if="hashText" class="font-mono"> | {{ hashText }}</span>
    </span>
  </button>
</template>
