<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

import type { FlatApiError } from '~/types'
import { getApiError, getApiErrorMessage, getFetchErrorStatus } from '~/utils'

definePageMeta({ layout: 'split' })

const auth = useAuth()
const { t, locale, locales, setLocale } = useI18n()
const colorMode = useColorMode()

const localeItems = computed(() =>
  (locales.value as { code: string; name: string }[]).map((loc) => ({
    label: loc.name,
    type: 'checkbox' as const,
    checked: locale.value === loc.code,
    onSelect: (e: Event) => {
      e.preventDefault()
      setLocale(loc.code as Parameters<typeof setLocale>[0])
    }
  }))
)

const currentLocaleName = computed(
  () =>
    (locales.value as { code: string; name: string }[]).find((l) => l.code === locale.value)?.name ??
    t('userMenu.language')
)
const { appName, appTagline } = useAppBranding()
const localePath = useLocalePath()
const loading = ref(false)
const showPassword = ref(false)
const { withOverlay } = useLoadingOverlay()
/** Inline flat API error (BFF returns same shape as Cadence). */
const loginApiError = ref<FlatApiError | null>(null)

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

function buildLoginFallbackError(err: unknown, message: string): FlatApiError {
  return {
    statusCode: getFetchErrorStatus(err) ?? 401,
    code: 'SY-9000',
    message,
    request_id: ''
  }
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  loginApiError.value = null
  try {
    await withOverlay(async () => {
      const ok = await auth.login(event.data.username, event.data.password)
      if (!ok) {
        loginApiError.value = {
          statusCode: 401,
          code: 'SY-9000',
          message: t('auth.loginFailed'),
          request_id: ''
        }
      } else if (auth.isSysAdmin.value && auth.orgList.value.length === 0) {
        await navigateTo(localePath('/admin/orgs'))
      } else {
        await navigateTo(localePath('/org-select'))
      }
    })
  } catch (err: unknown) {
    loginApiError.value =
      getApiError(err) ?? buildLoginFallbackError(err, getApiErrorMessage(err, t('auth.invalidCredentials')))
  } finally {
    loading.value = false
  }
}

watch(
  () => [state.username, state.password] as const,
  () => {
    loginApiError.value = null
  }
)

function toggleDarkMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const valueProps = [
  { icon: 'i-lucide-git-branch', text: 'Multi-agent runs' },
  { icon: 'i-lucide-activity', text: 'Real-time monitoring' },
  { icon: 'i-lucide-puzzle', text: 'Plugin ecosystem' }
]

const { data: oauthProvidersData, refresh: refreshOAuthProviders } = await useFetch<string[]>(
  '/api/oauth2/social/providers',
  {
    default: () => []
  }
)
const oauthProviders = computed(() => oauthProvidersData.value ?? [])

onMounted(() => {
  refreshOAuthProviders()
})

const oauthProviderLabels: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  oauth2: 'OAuth2'
}

const oauthProviderIcons: Record<string, string> = {
  google: 'i-simple-icons-google',
  github: 'i-simple-icons-github',
  oauth2: 'i-lucide-key-round'
}
</script>

<template>
  <div class="bg-background flex min-h-[100dvh] w-full font-sans">
    <!-- Left Side: Form -->
    <div class="relative z-10 flex w-full flex-col lg:w-1/2">
      <!-- Form Container -->
      <div class="flex flex-1 items-center justify-center p-6 md:p-8">
        <div class="w-full max-w-[420px]">
          <div class="login-item mb-8" style="--delay: 80ms">
            <h1 class="text-foreground text-[40px] leading-none font-bold tracking-tighter">Welcome back.</h1>
            <p class="text-muted mt-3 text-[15px]">Sign in to your workspace.</p>
          </div>

          <UForm :schema="schema" :state="state" class="flex flex-col gap-5" method="post" @submit="onSubmit">
            <div v-if="loginApiError" class="login-item" style="--delay: 120ms">
              <ApiErrorAlert
                :code="loginApiError.code"
                :message="loginApiError.message"
                :request-id="loginApiError.request_id || undefined"
              />
            </div>
            <UFormField label="Username" name="username" required class="login-item" style="--delay: 160ms">
              <UInput
                v-model="state.username"
                autocomplete="username"
                class="w-full"
                placeholder="username"
                size="xl"
              />
            </UFormField>

            <UFormField label="Password" name="password" required class="login-item" style="--delay: 240ms">
              <UInput
                v-model="state.password"
                autocomplete="current-password"
                class="w-full"
                :placeholder="t('auth.enterPassword')"
                :type="showPassword ? 'text' : 'password'"
                size="xl"
              >
                <template #trailing>
                  <button
                    type="button"
                    class="text-muted hover:text-foreground flex items-center transition-colors"
                    @click.prevent="showPassword = !showPassword"
                  >
                    <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="size-5" />
                  </button>
                </template>
              </UInput>
            </UFormField>

            <div class="login-item mt-1 mb-2 flex items-center justify-between text-[14px]" style="--delay: 300ms">
              <UCheckbox v-model="state.remember" label="Keep me logged in" />
              <NuxtLink to="#" class="text-primary hover:text-primary-600 font-medium transition-colors"
                >Forgot password?</NuxtLink
              >
            </div>

            <UButton
              :loading="loading"
              block
              :label="t('auth.signIn')"
              type="submit"
              size="xl"
              class="login-item font-semibold tracking-wide active:scale-[0.98]"
              style="--delay: 360ms"
            />

            <template v-if="oauthProviders.length > 0">
              <div class="text-muted login-item flex justify-center text-xs" style="--delay: 380ms">
                Or continue with
              </div>
              <div class="login-item flex flex-row gap-2" style="--delay: 400ms">
                <UButton
                  v-for="provider in oauthProviders"
                  :key="provider"
                  class="flex-1"
                  color="neutral"
                  :icon="oauthProviderIcons[provider] ?? 'i-lucide-key-round'"
                  :label="oauthProviderLabels[provider] ?? provider"
                  @click="auth.loginWithOAuth(provider)"
                />
              </div>
            </template>
          </UForm>
        </div>
      </div>

      <!-- Footer: Locale + Theme Toggle -->
      <div class="login-item mt-auto flex items-center gap-2 p-6 md:p-8" style="--delay: 420ms">
        <UDropdownMenu :items="[localeItems]">
          <UButton color="neutral" size="sm" icon="i-lucide-languages" :label="currentLocaleName" />
        </UDropdownMenu>
        <UButton
          :icon="colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
          color="neutral"
          size="sm"
          square
          @click="toggleDarkMode"
        />
      </div>
    </div>

    <!-- Right Side: Dark Branding Panel -->
    <div class="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-stone-950 px-12 lg:flex">
      <!-- Orange radial glow -->
      <div
        class="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2"
        style="background: radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.25) 0%, transparent 70%)"
      />

      <!-- Grid pattern overlay -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.03]"
        style="
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
          background-size: 40px 40px;
        "
      />

      <!-- Floating product card -->
      <div class="floating-card absolute top-[10%] left-[8%] z-20">
        <div
          class="inline-flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-2xl backdrop-blur-sm"
        >
          <div class="flex items-center gap-3">
            <div
              class="bg-primary shadow-primary/30 flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-lg"
            >
              <UIcon name="i-lucide-chart-no-axes-column" class="size-4" />
            </div>
            <span class="text-[22px] font-bold tracking-tight text-white">{{ appName || 'Cadence' }}</span>
          </div>
          <p class="text-sm font-medium text-white/50">{{ appTagline || 'AI Orchestration Platform' }}</p>
        </div>
      </div>

      <!-- Value props -->
      <div class="relative z-10 mb-10 flex flex-col gap-3">
        <div v-for="prop in valueProps" :key="prop.text" class="flex items-center gap-3">
          <div class="bg-primary/15 flex h-6 w-6 items-center justify-center rounded-3xl">
            <UIcon :name="prop.icon" class="text-primary size-3.5" />
          </div>
          <span class="text-sm font-medium text-white/70">{{ prop.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-item {
  animation: fadeUp 0.5s cubic-bezier(0.32, 0.72, 0, 1) both;
  animation-delay: var(--delay, 0ms);
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.floating-card {
  animation: balloon-float 22s ease-in-out infinite;
}

@keyframes balloon-float {
  0% {
    transform: translate(0px, 0px) rotate(0deg) scale(1);
  }
  12% {
    transform: translate(200px, 50px) rotate(2deg) scale(1.02);
  }
  25% {
    transform: translate(160px, 210px) rotate(-1.5deg) scale(0.98);
  }
  37% {
    transform: translate(30px, 370px) rotate(2.5deg) scale(1.01);
  }
  50% {
    transform: translate(190px, 310px) rotate(-2deg) scale(0.99);
  }
  62% {
    transform: translate(250px, 160px) rotate(1.5deg) scale(1.02);
  }
  75% {
    transform: translate(110px, 70px) rotate(-1deg) scale(1);
  }
  87% {
    transform: translate(60px, 140px) rotate(1deg) scale(0.98);
  }
  100% {
    transform: translate(0px, 0px) rotate(0deg) scale(1);
  }
}
</style>
