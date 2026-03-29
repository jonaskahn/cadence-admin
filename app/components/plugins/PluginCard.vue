<script lang="ts" setup>
import type { PluginMetadataResponse, SystemPluginResponse } from '~/types'

const { t } = useI18n()

type PluginCardItem = PluginMetadataResponse | (SystemPluginResponse & { source?: string })

const props = defineProps<{
  plugin: PluginCardItem
  source: 'system' | 'org'
}>()

const emit = defineEmits<{
  select: [plugin: PluginCardItem]
}>()

const pluginAvatarSrc = computed(() => {
  const logo = props.plugin.logo_image
  if (!logo) return null
  return `data:image/png;base64,${logo}`
})

const pluginInitial = computed(() => props.plugin.name?.charAt(0)?.toUpperCase() || '?')

const truncatedDescription = computed(() => {
  const desc = props.plugin.description || ''
  if (desc.length <= 80) return desc
  return `${desc.slice(0, 80)}…`
})

function onCardClick() {
  emit('select', props.plugin)
}
</script>

<template>
  <UCard @click="onCardClick">
    <div class="flex flex-col gap-3">
      <div class="flex items-start gap-3">
        <div v-if="pluginAvatarSrc" class="bg-elevated size-12 shrink-0 overflow-hidden rounded-lg p-2">
          <img :alt="plugin.name" :src="pluginAvatarSrc" class="size-full object-cover" />
        </div>
        <UAvatar v-else :alt="plugin.name" :text="pluginInitial" class="size-12 shrink-0 p-2" size="lg" />
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium">
            {{ plugin.name }}
          </p>
          <p class="text-dimmed truncate text-xs">
            {{ plugin.pid }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-1">
        <UBadge> v{{ plugin.version }} </UBadge>
        <UBadge
          v-if="'enabled' in plugin && plugin.enabled !== undefined"
          :color="plugin.enabled ? 'success' : 'neutral'"
        >
          {{ plugin.enabled ? t('plugins.enabled') : t('plugins.disabled') }}
        </UBadge>
        <UBadge v-if="plugin.tag" color="primary">
          {{ plugin.tag }}
        </UBadge>
        <UBadge
          v-if="(source === 'org' && 'source' in plugin && plugin.source) || source === 'system'"
          :color="source === 'system' || plugin.source === 'system' ? 'info' : 'success'"
        >
          {{ source === 'system' || plugin.source === 'system' ? t('plugins.system') : t('plugins.org') }}
        </UBadge>
      </div>

      <p v-if="plugin.description" class="text-dimmed line-clamp-2 text-sm">
        {{ truncatedDescription }}
      </p>

      <div class="text-dimmed mt-auto flex items-center gap-2 pt-1 text-xs">
        <span v-if="plugin.is_scoped"> • SCOPED</span>
        <span v-if="plugin.is_specialized"> • SPECIALIZED</span>
        <span v-if="plugin.stateless"> • STATELESS</span>
        <span v-else> • STATEFUL</span>
      </div>
    </div>
  </UCard>
</template>
