<script setup lang="ts">
const { t } = useI18n()

export interface PluginCardItem {
  id: string
  name: string
  pid: string
  source?: string
  logo?: string | null
  version: string
}

const props = withDefaults(
  defineProps<{
    plugin: PluginCardItem
    interactive?: boolean
  }>(),
  {
    interactive: false
  }
)

const emit = defineEmits<{
  remove: []
}>()

function handleRemove() {
  emit('remove')
}

const sourceLabel = computed(() => (props.plugin.source === 'system' ? t('plugins.system') : t('plugins.org')))

const avatarText = computed(() => props.plugin.name.slice(0, 2).toUpperCase())

const logoSrc = computed(() => (props.plugin.logo ? `data:image/png;base64,${props.plugin.logo}` : null))
</script>

<template>
  <UCard variant="soft">
    <template #header>
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <div v-if="logoSrc" class="bg-elevated size-8 shrink-0 overflow-hidden rounded-md p-1">
            <img :alt="plugin.name" :src="logoSrc" class="size-full object-contain" />
          </div>
          <UAvatar v-else :alt="plugin.name" :text="avatarText" size="sm" />
          <div class="flex min-w-0 flex-col">
            <span class="truncate text-sm font-semibold">{{ plugin.name }}</span>
            <span class="text-dimmed truncate font-mono text-xs">{{ plugin.pid }}</span>
          </div>
        </div>
        <UButton v-if="interactive" icon="i-lucide-x" size="xs" color="neutral" @click="handleRemove" />
      </div>
    </template>

    <div class="flex flex-wrap items-center gap-1">
      <UBadge :label="sourceLabel" color="neutral" variant="subtle" size="xs" />
      <UBadge :label="plugin.version" :color="interactive ? 'neutral' : 'success'" variant="subtle" size="xs" />
    </div>
  </UCard>
</template>
