<script lang="ts" setup>
import * as z from 'zod'
import type { DropdownMenuItem, FormSubmitEvent } from '@nuxt/ui'
import { NEUTRAL_COLORS, PRIMARY_COLORS } from '~/constants/theme'
import { getApiErrorMessage } from '~/utils'

const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const { withOverlay } = useLoadingOverlay()

defineProps<{
  collapsed?: boolean
}>()

const auth = useAuth()
const colorMode = useColorMode()
const appConfig = useAppConfig()
const { persistTheme } = useThemeStorage()

const displayName = computed(() => auth.authUser.value?.display_name || auth.authUser.value?.username || 'User')

const passwordModalOpen = ref(false)
const changingPassword = ref(false)

const passwordSchema = z
  .object({
    current_password: z.string().min(1, { error: () => t('common.required') }),
    new_password: z.string().min(8, { error: () => t('profile.min8Chars') }),
    confirm_new_password: z.string().min(1, { error: () => t('common.required') })
  })
  .superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_new_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('userMenu.passwordMismatch'),
        path: ['confirm_new_password']
      })
    }
  })

type PasswordSchema = z.output<typeof passwordSchema>

const passwordState = reactive<Partial<PasswordSchema>>({
  current_password: '',
  new_password: '',
  confirm_new_password: ''
})

watch(passwordModalOpen, (open) => {
  if (!open) {
    passwordState.current_password = ''
    passwordState.new_password = ''
    passwordState.confirm_new_password = ''
  }
})

async function onPasswordSubmit(event: FormSubmitEvent<PasswordSchema>) {
  changingPassword.value = true
  try {
    await withOverlay(async () => {
      await $fetch('/api/me/profile', {
        method: 'PATCH',
        body: {
          current_password: event.data.current_password,
          new_password: event.data.new_password
        }
      })
      passwordModalOpen.value = false
      toast.add({ title: t('profile.passwordUpdated'), icon: 'i-lucide-check', color: 'success' })
    })
  } catch (err: unknown) {
    toast.add({
      title: getApiErrorMessage(err, t('profile.failedUpdatePassword')),
      description: t('profile.checkCurrentPassword'),
      color: 'error'
    })
  } finally {
    changingPassword.value = false
  }
}

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
      label: t('userMenu.changePassword'),
      icon: 'i-lucide-key-round',
      onSelect() {
        passwordModalOpen.value = true
      }
    },
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
  <div>
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
      >
        <template v-if="!collapsed" #default>
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="truncate">{{ displayName }}</span>
          </div>
        </template>
      </UButton>
    </UDropdownMenu>

    <UModal v-model:open="passwordModalOpen" :title="t('userMenu.changePassword')" :ui="{ content: 'sm:max-w-md' }">
      <template #content>
        <UForm
          :schema="passwordSchema"
          :state="passwordState"
          class="flex flex-col gap-4 p-4 sm:p-6"
          @submit="onPasswordSubmit"
        >
          <UFormField :label="t('profile.currentPassword')" name="current_password">
            <UInput
              v-model="passwordState.current_password"
              class="w-full"
              type="password"
              autocomplete="current-password"
            />
          </UFormField>
          <UFormField :label="t('profile.newPassword')" name="new_password">
            <UInput v-model="passwordState.new_password" class="w-full" type="password" autocomplete="new-password" />
          </UFormField>
          <UFormField :label="t('userMenu.confirmNewPassword')" name="confirm_new_password">
            <UInput
              v-model="passwordState.confirm_new_password"
              class="w-full"
              type="password"
              autocomplete="new-password"
            />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="subtle" :label="t('common.cancel')" @click="passwordModalOpen = false" />
            <UButton color="primary" type="submit" :loading="changingPassword" :label="t('profile.updatePassword')" />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
