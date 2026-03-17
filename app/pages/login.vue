<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage } from '~/utils'

definePageMeta({ layout: 'split' })

const auth = useAuth()
const toast = useToast()
const { t, locale, locales, setLocale } = useI18n()
const colorMode = useColorMode()

const localeItems = computed(() =>
  (locales.value as { code: string; name: string }[]).map((loc) => ({
    label: loc.name,
    type: 'checkbox' as const,
    checked: locale.value === loc.code,
    onSelect: (e: Event) => {
      e.preventDefault()
      setLocale(loc.code as any)
    }
  }))
)

const currentLocaleName = computed(
  () => (locales.value as { code: string; name: string }[]).find((l) => l.code === locale.value)?.name ?? t('userMenu.language')
)
const { appName, appTagline } = useAppBranding()
const localePath = useLocalePath()
const loading = ref(false)
const { withOverlay } = useLoadingOverlay()

const schema = z.object({
  username: z.string().min(1, { error: () => t('auth.usernameRequired') }),
  password: z.string().min(8, { error: () => t('auth.passwordRequired') }),
  remember: z.boolean().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  username: '',
  password: '',
  remember: false
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await withOverlay(async () => {
      const ok = await auth.login(event.data.username, event.data.password)
      if (!ok) {
        toast.add({ title: t('auth.loginFailed'), color: 'error', icon: 'i-lucide-x-circle' })
      } else if (auth.isSysAdmin.value && auth.orgList.value.length === 0) {
        await navigateTo(localePath('/admin/orgs'))
      } else {
        await navigateTo(localePath('/org-select'))
      }
    })
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

function toggleDarkMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="flex min-h-screen w-full font-sans bg-background">
    <!-- Left Side: Form -->
    <div class="flex w-full flex-col lg:w-1/2 relative z-10">
      <!-- Header / Nav -->
      <div class="p-6 md:p-8">
        <NuxtLink :to="localePath('/about')" class="text-sm font-medium text-muted hover:text-foreground inline-flex items-center gap-2 transition-colors">
          <UIcon name="i-lucide-chevron-left" class="size-4" />
          Go to about
        </NuxtLink>
      </div>

      <!-- Form Container -->
      <div class="flex flex-1 items-center justify-center p-6 md:p-8">
        <div class="w-full max-w-[420px]">
          <div class="mb-8">
            <h1 class="text-[32px] font-bold tracking-tight text-foreground">Sign In</h1>
            <p class="mt-2 text-[15px] text-muted">Enter your email and password to sign in!</p>
          </div>

          <!-- Social login buttons -->
          <div class="grid grid-cols-2 gap-4 mb-8">
            <UButton color="neutral" variant="subtle" class="w-full justify-center gap-2 font-medium" size="lg">
              <template #leading>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="size-5" />
              </template>
              Sign in with Google
            </UButton>
            <UButton color="neutral" variant="subtle" class="w-full justify-center gap-2 font-medium" size="lg">
              <template #leading>
                <svg class="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  />
                </svg>
              </template>
              Sign in with X
            </UButton>
          </div>

          <UDivider label="Or" class="mb-8 text-muted" />

          <UForm :schema="schema" :state="state" class="flex flex-col gap-5" method="post" @submit="onSubmit">
            <UFormField label="Email" name="username" required>
              <UInput v-model="state.username" autocomplete="email" class="w-full" placeholder="info@gmail.com" size="xl" />
            </UFormField>

            <UFormField label="Password" name="password" required>
              <UInput v-model="state.password" autocomplete="current-password" class="w-full" :placeholder="t('auth.enterPassword')" type="password" size="xl">
                <template #trailing>
                  <UIcon name="i-lucide-eye" class="text-muted cursor-pointer hover:text-foreground transition-colors size-5" />
                </template>
              </UInput>
            </UFormField>

            <div class="flex items-center justify-between text-[14px] mt-1 mb-2">
              <UCheckbox v-model="state.remember" label="Keep me logged in" />
              <NuxtLink to="#" class="font-medium text-primary hover:text-primary-600 transition-colors">Forgot password?</NuxtLink>
            </div>

            <UButton :loading="loading" block :label="t('auth.signIn')" type="submit" size="xl" class="font-bold tracking-wide" />
          </UForm>

          <p class="mt-8 text-[15px] font-medium text-muted text-left">
            Don't have an account?
            <NuxtLink to="#" class="font-bold text-primary hover:text-primary-600 transition-colors">Sign Up</NuxtLink>
          </p>
        </div>
      </div>

      <!-- Locale Selection -->
      <div class="p-6 md:p-8 flex justify-start mt-auto">
        <UDropdownMenu :items="[localeItems]">
          <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-languages" :label="currentLocaleName" />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Right Side: Dark Branding with AI Wave -->
    <div
      class="relative hidden w-1/2 flex-col items-center justify-center bg-primary-50 dark:bg-[#0B1120] transition-colors duration-500 lg:flex overflow-hidden"
    >
      <!-- AI Math Wave Background -->
      <div class="absolute inset-0 pointer-events-none">
        <svg class="absolute w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" class="text-primary-500 dark:text-primary-400" stop-color="currentColor" stop-opacity="0.8" />
              <stop offset="50%" class="text-primary-400 dark:text-primary-500" stop-color="currentColor" stop-opacity="0.4" />
              <stop offset="100%" class="text-primary-300 dark:text-primary-600" stop-color="currentColor" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="secondary-grad" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" class="text-primary-400 dark:text-primary-300" stop-color="currentColor" stop-opacity="0.6" />
              <stop offset="100%" class="text-primary-600 dark:text-primary-800" stop-color="currentColor" stop-opacity="0.1" />
            </linearGradient>

            <!-- glowing filter -->
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="15" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <!-- Math Grid Pattern -->
            <pattern id="math-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" class="text-primary-900/5 dark:text-primary-100/5" stroke="currentColor" stroke-width="1" />
            </pattern>
          </defs>

          <!-- Background Grid -->
          <rect width="100%" height="100%" fill="url(#math-grid)" />

          <!-- Ambient glowing orbs -->
          <circle cx="800" cy="200" r="300" fill="url(#primary-grad)" class="opacity-40 blur-3xl animate-pulse" style="animation-duration: 8s" />
          <circle cx="200" cy="800" r="400" fill="url(#secondary-grad)" class="opacity-30 blur-3xl animate-pulse" style="animation-duration: 12s" />

          <!-- Intersecting mathematical sine waves -->
          <g fill="none" class="stroke-primary-500 dark:stroke-primary-400" stroke-width="2" filter="url(#glow)">
            <path d="M-100,500 C150,200 350,800 600,500 C850,200 1050,800 1200,500" class="opacity-60 dark:opacity-60" stroke="currentColor" />
            <path
              d="M-100,550 C200,300 400,900 650,550 C900,200 1000,850 1200,550"
              class="stroke-primary-400 dark:stroke-primary-500 opacity-40 dark:opacity-40"
              stroke="currentColor"
            />
            <path
              d="M-100,600 C250,400 450,1000 700,600 C950,200 950,900 1200,600"
              class="stroke-primary-300 dark:stroke-primary-600 opacity-20 dark:opacity-20"
              stroke="currentColor"
            />

            <!-- High frequency wave -->
            <path
              d="M-100,450 Q 0,350 100,450 T 300,450 T 500,450 T 700,450 T 900,450 T 1100,450 T 1300,450"
              class="stroke-primary-600 dark:stroke-primary-300 opacity-30 dark:opacity-30"
              stroke="currentColor"
              stroke-width="1"
            />
            <!-- Another intersecting frequency -->
            <path
              d="M-100,500 Q 0,600 100,500 T 300,500 T 500,500 T 700,500 T 900,500 T 1100,500 T 1300,500"
              class="stroke-primary-500 dark:stroke-primary-400 opacity-20 dark:opacity-20"
              stroke="currentColor"
              stroke-width="1.5"
            />
          </g>

          <!-- Connective data points / math nodes -->
          <g class="fill-primary-600 dark:fill-primary-400 opacity-80" fill="currentColor">
            <circle cx="218" cy="505" r="3" />
            <circle cx="600" cy="500" r="4" />
            <circle cx="887" cy="486" r="3" />
            <circle cx="650" cy="550" r="5" />
            <circle cx="340" cy="620" r="2" />
            <circle cx="100" cy="450" r="3" class="animate-ping" style="animation-duration: 3s" />
            <circle cx="700" cy="450" r="3" class="animate-ping" style="animation-duration: 3s; animation-delay: 1s" />
            <circle cx="300" cy="500" r="4" class="animate-ping" style="animation-duration: 3s; animation-delay: 2s" />
          </g>
        </svg>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col items-center justify-center text-center p-8 max-w-md">
        <div class="flex items-center gap-4 mb-6">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-xl shadow-primary/20 dark:shadow-primary/10">
            <!-- Icon matching TailAdmin but Cadence flavored (using activity or layers) -->
            <UIcon name="i-lucide-chart-no-axes-column" class="size-6" />
          </div>
          <h2 class="text-[32px] font-bold text-slate-800 dark:text-white tracking-tight">{{ appName || 'TailAdmin' }}</h2>
        </div>
        <p class="text-base font-medium text-slate-600 dark:text-slate-400">
          {{ appTagline || 'Free and Open-Source Tailwind CSS Admin Dashboard Template' }}
        </p>
      </div>

      <!-- Theme Toggle -->
      <div class="absolute bottom-8 right-8 z-10">
        <UButton
          :icon="colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
          color="primary"
          variant="solid"
          class="rounded-full shadow-lg shadow-primary/20"
          square
          size="xl"
          @click="toggleDarkMode"
        />
      </div>
    </div>
  </div>
</template>
