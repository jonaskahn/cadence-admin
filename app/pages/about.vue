<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

definePageMeta({ layout: false })

const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()

const showChangelog = ref(false)

function openChangelog() {
  showChangelog.value = true
}

const localeItems = computed(() =>
  (locales.value as { code: string; name: string }[]).map((loc) => ({
    label: loc.name,
    type: 'checkbox' as const,
    checked: locale.value === loc.code,
    onSelect: (e: Event) => {
      e.preventDefault()
      setLocale(loc.code)
    }
  }))
)

const currentLocaleName = computed(
  () => (locales.value as { code: string; name: string }[]).find((l) => l.code === locale.value)?.name ?? t('userMenu.language')
)

const links = computed<NavigationMenuItem[][]>(() => [
  [
    { label: t('about.tabs.overview'), icon: 'i-lucide-layout-panel-top', to: localePath('/about'), exact: true },
    { label: t('about.tabs.orchestrator'), icon: 'i-lucide-cpu', to: localePath('/about/orchestrator') },
    { label: t('about.tabs.modes'), icon: 'i-lucide-git-branch', to: localePath('/about/modes') },
    { label: t('about.tabs.frameworks'), icon: 'i-lucide-layers', to: localePath('/about/frameworks') },
    { label: t('about.tabs.plugins'), icon: 'i-lucide-shopping-cart', to: localePath('/about/plugins') },
    { label: t('about.tabs.chat'), icon: 'i-lucide-message-square', to: localePath('/about/chat') },
    { label: t('about.tabs.llmConfigs'), icon: 'i-lucide-cable', to: localePath('/about/llm-configs') },
    { label: t('about.tabs.centralPoints'), icon: 'i-lucide-radio', to: localePath('/about/central-points') },
    { label: t('about.tabs.orgs'), icon: 'i-lucide-building', to: localePath('/about/orgs') },
    { label: t('about.tabs.roles'), icon: 'i-lucide-shield-check', to: localePath('/about/roles') },
    { label: t('about.tabs.admin'), icon: 'i-lucide-sliders', to: localePath('/about/admin') }
  ]
])
</script>

<template>
  <div>
    <UApp>
      <div class="min-h-[100dvh] bg-default flex flex-col">
        <div class="h-16 border-b border-default flex items-center justify-between px-6 shrink-0">
          <h1 class="text-base font-semibold">{{ t('about.title') }}</h1>
          <div class="flex items-center gap-2">
            <UDropdownMenu :items="[localeItems]">
              <UButton icon="i-lucide-languages" variant="outline" color="neutral" :label="currentLocaleName" />
            </UDropdownMenu>
            <UButton icon="i-lucide-history" variant="outline" color="neutral" @click="openChangelog" />
            <UButton icon="i-lucide-house" to="/" external />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <UDashboardToolbar>
            <UNavigationMenu :items="links" class="-mx-1 flex-1" highlight />
          </UDashboardToolbar>
          <div class="p-6 max-w-4xl mx-auto">
            <NuxtPage />
          </div>
        </div>
      </div>

      <UModal v-model:open="showChangelog">
        <template #content>
          <UCard>
            <template #header>
              <span class="font-semibold">{{ t('about.changelog.title') }}</span>
            </template>
            <div class="flex flex-col items-center justify-center gap-3 py-16 text-center text-dimmed">
              <UIcon name="i-lucide-package-open" class="size-10 opacity-40" />
              <p class="text-sm">{{ t('about.changelog.empty') }}</p>
            </div>
          </UCard>
        </template>
      </UModal>
    </UApp>
  </div>
</template>
