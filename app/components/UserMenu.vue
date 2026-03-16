<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'
import { NEUTRAL_COLORS, PRIMARY_COLORS } from '~/constants/theme'

const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()

defineProps<{
  collapsed?: boolean
}>()

const auth = useAuth()
const colorMode = useColorMode()
const appConfig = useAppConfig()
const { persistTheme } = useThemeStorage()

const displayName = computed(() => auth.authUser.value?.display_name || auth.authUser.value?.username || 'User')

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: displayName.value,
      avatar: { icon: 'i-lucide-user' }
    }
  ],
  [
    {
      label: t('userMenu.theme'),
      icon: 'i-lucide-palette',
      children: [
        {
          label: t('userMenu.primary'),
          slot: 'chip',
          chip: appConfig.ui.colors.primary,
          content: { align: 'center', collisionPadding: 16 },
          children: PRIMARY_COLORS.map((color) => ({
            label: color,
            chip: color,
            slot: 'chip',
            checked: appConfig.ui.colors.primary === color,
            type: 'checkbox',
            onSelect: (e: Event) => {
              e.preventDefault()
              appConfig.ui.colors.primary = color
              persistTheme()
            }
          }))
        },
        {
          label: t('userMenu.neutral'),
          slot: 'chip',
          chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
          content: { align: 'end', collisionPadding: 16 },
          children: NEUTRAL_COLORS.map((color) => ({
            label: color,
            chip: color === 'neutral' ? 'old-neutral' : color,
            slot: 'chip',
            type: 'checkbox',
            checked: appConfig.ui.colors.neutral === color,
            onSelect: (e: Event) => {
              e.preventDefault()
              appConfig.ui.colors.neutral = color
              persistTheme()
            }
          }))
        }
      ]
    },
    {
      label: t('userMenu.appearance'),
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: t('userMenu.light'),
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault()
            colorMode.preference = 'light'
          }
        },
        {
          label: t('userMenu.dark'),
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked(checked: boolean) {
            if (checked) colorMode.preference = 'dark'
          },
          onSelect(e: Event) {
            e.preventDefault()
          }
        }
      ]
    },
    {
      label: t('userMenu.language'),
      icon: 'i-lucide-languages',
      children: (locales.value as { code: string; name: string }[]).map((loc) => ({
        label: loc.name,
        type: 'checkbox',
        checked: locale.value === loc.code,
        onSelect: (e: Event) => {
          e.preventDefault()
          setLocale(loc.code)
        }
      }))
    }
  ],
  [
    {
      label: t('userMenu.profile'),
      icon: 'i-lucide-user-circle',
      to: localePath('/profile')
    },
    {
      label: t('userMenu.logOut'),
      icon: 'i-lucide-log-out',
      onSelect() {
        auth.logout()
      }
    }
  ]
])
</script>

<template>
  <UDropdownMenu
    :content="{ align: 'center', collisionPadding: 12 }"
    :items="items"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          :style="{
            '--chip-light': `var(--color-${item?.chip ?? 'neutral'}-500)`,
            '--chip-dark': `var(--color-${item?.chip ?? 'neutral'}-400)`
          }"
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
        />
      </div>
    </template>
    <UButton
      :class="[!collapsed && 'py-2']"
      :label="collapsed ? undefined : undefined"
      :square="collapsed"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up'"
      :ui="{ trailingIcon: 'text-dimmed' }"
      block
      class="data-[state=open]:bg-elevated"
      color="neutral"
      leading-icon="i-lucide-user-circle"
      variant="ghost"
    >
      <template v-if="!collapsed" #default>
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <span class="truncate">{{ displayName }}</span>
        </div>
      </template>
    </UButton>
  </UDropdownMenu>
</template>
