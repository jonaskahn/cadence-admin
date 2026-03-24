<script lang="ts" setup>
definePageMeta({ layout: false })

const route = useRoute()
const { t } = useI18n()
const toast = useToast()

const handoff = computed(() => {
  const h = route.query.handoff
  return typeof h === 'string' ? h : ''
})

const {
  data: ctx,
  pending,
  error
} = await useAsyncData(
  'oauth-consent-context',
  () => {
    if (!handoff.value) return Promise.resolve(null)
    return $fetch<{ client_id: string; scope: string; requested_claims: string[] }>('/api/oauth2/consent/context', { query: { handoff: handoff.value } })
  },
  { watch: [handoff] }
)

const selected = ref<Record<string, boolean>>({})

watch(
  () => ctx.value?.requested_claims,
  (claims) => {
    if (!claims?.length) return
    const next: Record<string, boolean> = { ...selected.value }
    for (const c of claims) {
      if (next[c] === undefined) next[c] = true
    }
    selected.value = next
  },
  { immediate: true }
)

const submitting = ref(false)

async function submit(approve: boolean) {
  if (!handoff.value) return
  submitting.value = true
  try {
    const granted = approve
      ? Object.entries(selected.value)
          .filter(([, v]) => v)
          .map(([k]) => k)
      : []
    const res = await $fetch<{ redirect_to?: string }>('/api/oauth2/consent/decision', {
      method: 'POST',
      body: {
        handoff: handoff.value,
        approve,
        granted_profile_claims: granted
      }
    })
    if (res.redirect_to) {
      window.location.href = res.redirect_to
      return
    }
    toast.add({ title: t('consent.unexpectedResponse'), color: 'error' })
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    if (approve && err?.statusCode === 401) {
      await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
      return
    }
    toast.add({
      title: t('consent.submitFailed'),
      description: err?.message ?? (e instanceof Error ? e.message : String(e)),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
    <UCard class="w-full max-w-lg">
      <template #header>
        <h1 class="text-lg font-semibold">{{ t('consent.title') }}</h1>
      </template>

      <div v-if="pending" class="text-neutral-400">{{ t('consent.loading') }}</div>
      <div v-else-if="error || !ctx" class="text-red-400">
        {{ t('consent.invalidHandoff') }}
      </div>
      <div v-else class="flex flex-col gap-4">
        <p class="text-sm text-neutral-300">
          {{ t('consent.intro', { client: ctx.client_id }) }}
        </p>
        <p v-if="ctx.scope" class="text-xs text-neutral-500">{{ t('consent.scopeLabel') }}: {{ ctx.scope }}</p>
        <div v-if="ctx.requested_claims.length" class="flex flex-col gap-2">
          <p class="text-sm font-medium">{{ t('consent.claimsTitle') }}</p>
          <label v-for="claim in ctx.requested_claims" :key="claim" class="flex items-center gap-2 text-sm">
            <input v-model="selected[claim]" type="checkbox" class="rounded" />
            <span>{{ t('consent.claim.' + claim) }}</span>
          </label>
        </div>

        <div class="flex gap-2 justify-end pt-2">
          <UButton color="neutral" variant="soft" :loading="submitting" @click="submit(false)">
            {{ t('consent.deny') }}
          </UButton>
          <UButton :loading="submitting" @click="submit(true)">
            {{ t('consent.allow') }}
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
