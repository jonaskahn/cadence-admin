<script lang="ts" setup>
const auth = useAuth()
const orgId = computed(() => auth.currentOrgId.value || '')
const { t } = useI18n()
const showModal = ref(false)
const tabRef = ref<{ fetchAll: () => Promise<void> } | null>(null)
const { data: orchestrators } = await useFetch(() => (orgId.value ? `/api/orgs/${orgId.value}/orchestrators` : null), {
  watch: [orgId]
})

function onModalClose() {
  showModal.value = false
  tabRef.value?.fetchAll()
}
</script>

<template>
  <div>
    <ClientOnly>
      <div v-if="!orgId" class="flex flex-col gap-6 pt-4">
        <UAlert color="neutral" icon="i-lucide-building-2" :title="t('centralPoints.selectOrgTitle')" variant="subtle">
          {{ t('centralPoints.selectOrgDescription') }}
        </UAlert>
      </div>
      <CentralPointsTab v-else ref="tabRef" :org-id="orgId" @open-modal="showModal = true" />
      <template #fallback>
        <div class="flex flex-col gap-2 pt-4">
          <USkeleton class="h-32 w-full" />
          <USkeleton class="h-64 w-full" />
        </div>
      </template>
    </ClientOnly>

    <UModal v-model:open="showModal" @after:leave="onModalClose">
      <template #content>
        <CentralPointModal v-if="orgId" :org-id="orgId" :orchestrators="orchestrators || []" @close="onModalClose" />
      </template>
    </UModal>
  </div>
</template>
