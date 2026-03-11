<script lang="ts" setup>
import type { CentralPointResponse, OrchestratorResponse } from '~/types'
import { CENTRAL_POINTS_TIERS, formatDate } from '~/utils'

const props = defineProps<{ orgId: string }>()

const emit = defineEmits<{ openModal: [] }>()

const injected = inject<ComputedRef<boolean>>('canUseCentralPoints', null)
const { centerPoints, loading, fetchAll, remove } = useCentralPoints(toRef(props, 'orgId'))
defineExpose({ fetchAll })

const { data: org } = await useFetch<{ tier?: string }>(() => `/api/orgs/${props.orgId}`, { watch: [() => props.orgId] })
const canUseCentralPoints = computed(
  () =>
    injected?.value ??
    (props.orgId &&
      org.value?.tier &&
      (CENTRAL_POINTS_TIERS as readonly string[]).includes(org.value.tier.toLowerCase()))
)

const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

const { data: orchestrators } = await useFetch<OrchestratorResponse[]>(() => `/api/orgs/${props.orgId}/orchestrators`, { watch: [() => props.orgId] })

onMounted(() => fetchAll())

const deleting = ref<string | null>(null)

async function onDelete(cp: CentralPointResponse) {
  deleting.value = cp.id
  try {
    await remove(cp.id)
  } catch {
    /* toast from composable */
  } finally {
    deleting.value = null
  }
}

const orchestratorLabel = (orchestratorId: string) => {
  const o = orchestrators.value?.find((x) => x.instance_id === orchestratorId)
  return o ? o.name : orchestratorId
}

const columns = computed(() => [
  { accessorKey: 'name', header: t('centralPoints.name') },
  { accessorKey: 'orchestrator_id', header: t('centralPoints.orchestrator') },
  { accessorKey: 'visibility', header: t('centralPoints.visibility') },
  { accessorKey: 'status', header: t('centralPoints.status') },
  { accessorKey: 'created_at', header: t('centralPoints.created') },
  { id: 'actions' }
])
</script>

<template>
  <div class="flex flex-col gap-6 pt-4">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold">{{ t('centralPoints.title') }}</p>
            <p class="text-dimmed text-sm">
              {{ t('centralPoints.description') }}
            </p>
          </div>
          <UButton v-if="canUseCentralPoints" icon="i-lucide-plus" :label="t('centralPoints.addCenterPoint')" @click="emit('openModal')" />
        </div>
      </template>
      <div v-if="loading" class="flex flex-col gap-2 p-4">
        <USkeleton v-for="n in 5" :key="n" class="h-10 w-full" />
      </div>
      <UTable v-else :columns="columns" :data="centerPoints" :empty-state="{ icon: 'i-lucide-radio', label: t('centralPoints.noCenterPoints') }">
        <template #orchestrator_id-cell="{ row }">
          <span>{{ orchestratorLabel(row.original.orchestrator_id) }}</span>
        </template>
        <template #visibility-cell="{ row }">
          <UBadge :color="row.original.visibility === 'public' ? 'success' : 'neutral'" size="sm" variant="subtle">
            {{ row.original.visibility }}
          </UBadge>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="row.original.status === 'active' ? 'success' : 'neutral'" size="sm" variant="subtle">
            {{ row.original.status }}
          </UBadge>
        </template>
        <template #created_at-cell="{ row }">
          <span class="text-dimmed text-sm">{{ formatDate(row.original.created_at) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              color="neutral"
              icon="i-lucide-pencil"
              size="xs"
              variant="ghost"
              @click="router.push(localePath(`/settings/central-points/${row.original.id}`))"
            />
            <UPopover>
              <UButton color="error" icon="i-lucide-trash-2" size="xs" variant="ghost" />
              <template #content="{ close }">
                <div class="p-4 min-w-48">
                  <p class="text-sm text-dimmed mb-3">{{ t('centralPoints.deleteConfirm', { name: row.original.name }) }}</p>
                  <div class="flex justify-end gap-2">
                    <UButton color="neutral" variant="ghost" :label="t('common.cancel')" @click="close" />
                    <UButton
                      color="error"
                      :label="t('common.delete')"
                      :loading="deleting === row.original.id"
                      @click="async () => { await onDelete(row.original); close() }"
                    />
                  </div>
                </div>
              </template>
            </UPopover>
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
