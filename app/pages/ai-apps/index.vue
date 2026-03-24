<script lang="ts" setup>
import type { OrchestratorResponse } from '~/types'
import { statusColor, tierColor } from '~/utils'

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()
const aiAppStore = useAiApps()

const columns = computed(() => [
  { accessorKey: 'name', header: t('dashboard.name') },
  { accessorKey: 'framework_type', header: t('dashboard.framework') },
  { accessorKey: 'mode', header: t('dashboard.mode') },
  { accessorKey: 'tier', header: t('dashboard.tier') },
  { accessorKey: 'status', header: t('dashboard.status') },
  { id: 'ready', header: t('aiApps.ready') },
  { id: 'actions' }
])

onMounted(aiAppStore.fetchAll)

const deactivating = ref<string | null>(null)
const unloading = ref<string | null>(null)
const loadingId = ref<string | null>(null)
const activating = ref<string | null>(null)
const purging = ref<string | null>(null)

async function onDeactivate(row: OrchestratorResponse) {
  deactivating.value = row.instance_id
  try {
    await aiAppStore.deactivate(row.instance_id)
  } finally {
    deactivating.value = null
  }
}

async function onActivate(row: OrchestratorResponse) {
  activating.value = row.instance_id
  try {
    await aiAppStore.activate(row.instance_id)
  } finally {
    activating.value = null
  }
}

async function onLoad(row: OrchestratorResponse) {
  loadingId.value = row.instance_id
  try {
    await aiAppStore.load(row.instance_id)
  } finally {
    loadingId.value = null
  }
}

function onClone(row: OrchestratorResponse) {
  navigateTo(localePath(`/ai-apps/create?clone=${row.instance_id}`))
}

async function onUnload(row: OrchestratorResponse) {
  unloading.value = row.instance_id
  try {
    await aiAppStore.unload(row.instance_id)
  } finally {
    unloading.value = null
  }
}

async function onPurge(row: OrchestratorResponse) {
  purging.value = row.instance_id
  try {
    await aiAppStore.purge(row.instance_id)
  } finally {
    purging.value = null
  }
}

async function handleLoadConfirm(row: OrchestratorResponse, close: () => void) {
  await onLoad(row)
  close()
}

async function handleUnloadConfirm(row: OrchestratorResponse, close: () => void) {
  await onUnload(row)
  close()
}

async function handleDeactivateConfirm(row: OrchestratorResponse, close: () => void) {
  await onDeactivate(row)
  close()
}

async function handleActivateConfirm(row: OrchestratorResponse, close: () => void) {
  await onActivate(row)
  close()
}

async function handlePurgeConfirm(row: OrchestratorResponse, close: () => void) {
  await onPurge(row)
  close()
}
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="ai-apps" :ui="{ body: 'min-w-0' }">
      <template #header>
        <UDashboardNavbar>
          <template #title>
            <span class="inline-flex items-center gap-2 flex-wrap">
              <span>{{ t('aiApps.title') }}</span>
              <UBadge color="neutral" size="xs" variant="subtle">{{ t('aiApps.legacyBadge') }}</UBadge>
            </span>
          </template>
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <InfoPopover title-key="info.pages.aiApps.title" description-key="info.pages.aiApps.description" />
              <UButton v-if="auth.isAdmin.value" icon="i-lucide-plus" :label="t('dashboard.create')" :to="localePath('/ai-apps/create')" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6 min-w-0 w-full">
          <UCard variant="soft">
            <UTable
              :columns="columns"
              :data="aiAppStore.aiApps.value"
              :loading="aiAppStore.loading.value"
              :meta="{ class: { tr: (row) => (row?.original?.is_deleted ? 'opacity-60' : '') } }"
            >
              <template #tier-cell="{ row }">
                <UBadge :color="tierColor(row.original.tier)" size="sm" variant="subtle">
                  {{ row?.original?.tier?.toUpperCase() }}
                </UBadge>
              </template>

              <template #status-cell="{ row }">
                <div class="flex items-center gap-1.5">
                  <UBadge :color="statusColor(row.original.status)" size="sm" variant="subtle">
                    {{ row.original.status }}
                  </UBadge>
                  <UBadge v-if="row.original.is_deleted" color="neutral" size="sm" variant="subtle">
                    {{ t('common.deleted') }}
                  </UBadge>
                </div>
              </template>

              <template #ready-cell="{ row }">
                <UIcon v-if="row.original.is_ready" class="text-success size-4" name="i-lucide-circle-check" />
                <UIcon v-else class="text-dimmed size-4" name="i-lucide-circle-x" />
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center gap-1">
                  <UButton :to="localePath(`/ai-apps/${row.original.instance_id}`)" icon="i-lucide-info" :label="t('common.view')" size="sm" />
                  <template v-if="auth.isAdmin.value">
                    <UButton icon="i-lucide-copy" :label="t('aiApps.clone')" size="sm" @click="onClone(row.original)" />
                    <template v-if="row.original.status === 'active'">
                      <UPopover>
                        <UButton icon="i-lucide-play" :label="t('aiApps.load')" size="sm" />
                        <template #content="{ close }">
                          <div class="p-4 min-w-48">
                            <p class="text-sm text-dimmed mb-3">{{ t('aiApps.loadConfirm', { name: row.original.name }) }}</p>
                            <div class="flex justify-end gap-2">
                              <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                              <UButton
                                :label="t('aiApps.load')"
                                :loading="loadingId === row.original.instance_id"
                                @click="handleLoadConfirm(row.original, close)"
                              />
                            </div>
                          </div>
                        </template>
                      </UPopover>
                      <UPopover>
                        <UButton icon="i-lucide-square" :label="t('aiApps.unload')" size="sm" />
                        <template #content="{ close }">
                          <div class="p-4 min-w-48">
                            <p class="text-sm text-dimmed mb-3">{{ t('aiApps.unloadConfirm', { name: row.original.name }) }}</p>
                            <div class="flex justify-end gap-2">
                              <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                              <UButton
                                :label="t('aiApps.unload')"
                                :loading="unloading === row.original.instance_id"
                                @click="handleUnloadConfirm(row.original, close)"
                              />
                            </div>
                          </div>
                        </template>
                      </UPopover>
                      <UPopover>
                        <UButton color="error" icon="i-lucide-route-off" :label="t('aiApps.deactivate')" size="sm" />
                        <template #content="{ close }">
                          <div class="p-4 min-w-48">
                            <p class="text-sm text-dimmed mb-3">{{ t('aiApps.deactivateConfirm', { name: row.original.name }) }}</p>
                            <div class="flex justify-end gap-2">
                              <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                              <UButton
                                color="primary"
                                :label="t('aiApps.deactivate')"
                                :loading="deactivating === row.original.instance_id"
                                @click="handleDeactivateConfirm(row.original, close)"
                              />
                            </div>
                          </div>
                        </template>
                      </UPopover>
                    </template>
                    <UPopover v-else>
                      <UButton color="success" icon="i-lucide-route" :label="t('aiApps.activate')" size="sm" />
                      <template #content="{ close }">
                        <div class="p-4 min-w-48">
                          <p class="text-sm text-dimmed mb-3">{{ t('aiApps.activateConfirm', { name: row.original.name }) }}</p>
                          <div class="flex justify-end gap-2">
                            <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                            <UButton
                              color="success"
                              :label="t('aiApps.activate')"
                              :loading="activating === row.original.instance_id"
                              @click="handleActivateConfirm(row.original, close)"
                            />
                          </div>
                        </div>
                      </template>
                    </UPopover>
                  </template>
                  <UPopover v-if="auth.isSysAdmin.value && row.original.is_deleted">
                    <UButton color="neutral" icon="i-lucide-shredder" size="sm" />
                    <template #content="{ close }">
                      <div class="p-4 min-w-48">
                        <p class="text-sm text-dimmed mb-3">{{ t('common.purgeConfirm') }}</p>
                        <div class="flex justify-end gap-2">
                          <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                          <UButton
                            color="error"
                            :label="t('common.purge')"
                            :loading="purging === row.original.instance_id"
                            @click="handlePurgeConfirm(row.original, close)"
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
    </UDashboardPanel>
  </div>
</template>
