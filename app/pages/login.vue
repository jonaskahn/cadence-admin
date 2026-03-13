<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage } from '~/utils'

definePageMeta({ layout: 'auth' })

const auth = useAuth()
const toast = useToast()
const { t, locale, locales, setLocale } = useI18n()

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
const { appName, appTagline } = useAppBranding()
const localePath = useLocalePath()
const loading = ref(false)

const schema = z.object({
  username: z.string().min(1, { error: () => t('auth.usernameRequired') }),
  password: z.string().min(8, { error: () => t('auth.passwordRequired') })
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  username: '',
  password: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const ok = await auth.login(event.data.username, event.data.password)
    if (!ok) {
      toast.add({ title: t('auth.loginFailed'), color: 'error', icon: 'i-lucide-x-circle' })
    } else if (auth.isSysAdmin.value && auth.orgList.value.length === 0) {
      await navigateTo(localePath('/admin/orgs'))
    } else {
      await navigateTo(localePath('/org-select'))
    }
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, t('auth.invalidCredentials'))
    toast.add({
      title: t('auth.loginFailed'),
      description: msg,
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <UCard class="w-md">
    <template #header>
      <div class="flex flex-col items-center gap-2 py-2">
        <h1 class="text-2xl font-bold">{{ appName }}</h1>
        <p class="text-dimmed text-sm">{{ appTagline }}</p>
      </div>
    </template>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-4" method="post" @submit="onSubmit">
      <UFormField :label="t('auth.username')" name="username">
        <UInput v-model="state.username" autocomplete="username" class="w-full" :placeholder="t('auth.enterUsername')" />
      </UFormField>

      <UFormField :label="t('auth.password')" name="password">
        <UInput v-model="state.password" autocomplete="current-password" class="w-full" :placeholder="t('auth.enterPassword')" type="password" />
      </UFormField>

      <UButton :loading="loading" block :label="t('auth.signIn')" type="submit" />
    </UForm>
    <template #footer>
      <div class="flex justify-end">
        <UDropdownMenu :items="[localeItems]">
          <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-languages" :label="currentLocaleName" />
        </UDropdownMenu>
      </div>
    </template>
    </UCard>
  </div>
</template>
