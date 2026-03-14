<script setup lang="ts">
export interface PluginCardItem {
  id: string
  name: string
  pid: string
  source: 'system' | 'org'
  logo?: string | null
  version: string
}

const props = withDefaults(defineProps<{
  plugin: PluginCardItem
  interactive?: boolean
}>(), {
  interactive: false
})

const emit = defineEmits<{
  remove: []
}>()

const sourceLabel = computed(() =>
  props.plugin.source === 'system' ? 'Sys' : 'Org'
)

const avatarText = computed(() =>
  props.plugin.name.slice(0, 2).toUpperCase()
)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <UAvatar
            :src="plugin.logo ?? undefined"
            :alt="plugin.name"
            :text="!plugin.logo ? avatarText : undefined"
            size="sm"
          />
          <div class="flex flex-col min-w-0">
            <span class="font-semibold text-sm truncate">{{ plugin.name }}</span>
            <span class="text-xs text-muted font-mono truncate">{{ plugin.pid }}</span>
          </div>
        </div>
        <UButton
          v-if="interactive"
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="emit('remove')"
        />
      </div>
    </template>

    <div class="flex items-center gap-1 flex-wrap">
      <UBadge :label="sourceLabel" color="neutral" variant="subtle" size="xs" />
      <UBadge
        :label="plugin.version"
        :color="interactive ? 'neutral' : 'success'"
        variant="subtle"
        size="xs"
      />
    </div>
  </UCard>
</template>
