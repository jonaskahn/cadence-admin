<script lang="ts" setup>
import type { OrchestratorResponse } from '~/types'
import { statusColor, tierColor } from '~/utils'

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()
const orchestrators = useOrchestrators()

const columns = computed(() => [
  { accessorKey: 'name', header: t('dashboard.name') },
  { accessorKey: 'framework_type', header: t('dashboard.framework') },
  { accessorKey: 'mode', header: t('dashboard.mode') },
  { accessorKey: 'tier', header: t('dashboard.tier') },
  { accessorKey: 'status', header: t('dashboard.status') },
  { id: 'ready', header: t('orchestrators.ready') },
  { id: 'actions' }
])

onMounted(orchestrators.fetchAll)

const deactivating = ref<string | null>(null)
const unloading = ref<string | null>(null)
const loadingId = ref<string | null>(null)
const activating = ref<string | null>(null)
const purging = ref<string | null>(null)

async function onDeactivate(row: OrchestratorResponse) {
  deactivating.value = row.instance_id
  try {
    await orchestrators.deactivate(row.instance_id)
  } finally {
    deactivating.value = null
  }
}

async function onActivate(row: OrchestratorResponse) {
  activating.value = row.instance_id
  try {
    await orchestrators.activate(row.instance_id)
  } finally {
    activating.value = null
  }
}

async function onLoad(row: OrchestratorResponse) {
  loadingId.value = row.instance_id
  try {
    await orchestrators.load(row.instance_id)
  } finally {
    loadingId.value = null
  }
}

function onClone(row: OrchestratorResponse) {
  navigateTo(localePath(`/orchestrators/create?clone=${row.instance_id}`))
}

async function onUnload(row: OrchestratorResponse) {
  unloading.value = row.instance_id
  try {
    await orchestrators.unload(row.instance_id)
  } finally {
    unloading.value = null
  }
}

async function onPurge(row: OrchestratorResponse) {
  purging.value = row.instance_id
  try {
    await orchestrators.purge(row.instance_id)
  } finally {
    purging.value = null
  }
}
</script>

<template>
  <UDashboardPanel id="orchestrators" :ui="{ body: 'min-w-0' }">
    <template #header>
      <UDashboardNavbar :title="t('orchestrators.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <InfoPopover title-key="info.pages.orchestrators.title" description-key="info.pages.orchestrators.description" />
            <UButton v-if="auth.isOrgAdmin.value || auth.isSysAdmin.value" icon="i-lucide-plus" :label="t('dashboard.create')" :to="localePath('/orchestrators/create')" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 min-w-0 w-full">
        <UCard>
          <UTable
            :columns="columns"
            :data="orchestrators.orchestrators.value"
            :loading="orchestrators.loading.value"
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
              <UIcon v-else class="text-muted size-4" name="i-lucide-circle-x" />
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton :to="localePath(`/orchestrators/${row.original.instance_id}`)" icon="i-lucide-info" :label="t('common.view')" size="xs" variant="outline" />
                <template v-if="auth.isOrgAdmin.value">
                  <UButton icon="i-lucide-copy" :label="t('orchestrators.clone')" size="xs" variant="outline" @click="onClone(row.original)" />
                  <template v-if="row.original.status === 'active'">
                    <UPopover>
                      <UButton icon="i-lucide-play" :label="t('orchestrators.load')" size="xs" variant="outline" />
                      <template #content="{ close }">
                        <div class="p-4 min-w-48">
                          <p class="text-sm text-dimmed mb-3">{{ t('orchestrators.loadConfirm', { name: row.original.name }) }}</p>
                          <div class="flex justify-end gap-2">
                            <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                            <UButton
                              variant="outline"
                              :label="t('orchestrators.load')"
                              :loading="loadingId === row.original.instance_id"
                              @click="async () => { await onLoad(row.original); close() }"
                            />
                          </div>
                        </div>
                      </template>
                    </UPopover>
                    <UPopover>
                      <UButton icon="i-lucide-square" :label="t('orchestrators.unload')" size="xs" variant="outline" />
                      <template #content="{ close }">
                        <div class="p-4 min-w-48">
                          <p class="text-sm text-dimmed mb-3">{{ t('orchestrators.unloadConfirm', { name: row.original.name }) }}</p>
                          <div class="flex justify-end gap-2">
                            <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                            <UButton
                              variant="outline"
                              :label="t('orchestrators.unload')"
                              :loading="unloading === row.original.instance_id"
                              @click="async () => { await onUnload(row.original); close() }"
                            />
                          </div>
                        </div>
                      </template>
                    </UPopover>
                    <UPopover>
                      <UButton
                        color="error"
                        icon="i-lucide-route-off"
                        :label="t('orchestrators.deactivate')"
                        size="xs"
                        variant="outline"
                      />
                      <template #content="{ close }">
                        <div class="p-4 min-w-48">
                          <p class="text-sm text-dimmed mb-3">{{ t('orchestrators.deactivateConfirm', { name: row.original.name }) }}</p>
                          <div class="flex justify-end gap-2">
                            <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                            <UButton
                              variant="outline"
                              color="primary"
                              :label="t('orchestrators.deactivate')"
                              :loading="deactivating === row.original.instance_id"
                              @click="async () => { await onDeactivate(row.original); close() }"
                            />
                          </div>
                        </div>
                      </template>
                    </UPopover>
                  </template>
                  <UPopover v-else>
                    <UButton
                      color="success"
                      icon="i-lucide-route"
                      :label="t('orchestrators.activate')"
                      size="xs"
                      variant="outline"
                    />
                    <template #content="{ close }">
                      <div class="p-4 min-w-48">
                        <p class="text-sm text-dimmed mb-3">{{ t('orchestrators.activateConfirm', { name: row.original.name }) }}</p>
                        <div class="flex justify-end gap-2">
                          <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                          <UButton
                            variant="outline"
                            color="success"
                            :label="t('orchestrators.activate')"
                            :loading="activating === row.original.instance_id"
                            @click="async () => { await onActivate(row.original); close() }"
                          />
                        </div>
                      </div>
                    </template>
                  </UPopover>
                </template>
                <UPopover v-if="auth.isSysAdmin.value && row.original.is_deleted">
                  <UButton color="neutral" icon="i-lucide-shredder" size="xs" />
                  <template #content="{ close }">
                    <div class="p-4 min-w-48">
                      <p class="text-sm text-dimmed mb-3">{{ t('common.purgeConfirm') }}</p>
                      <div class="flex justify-end gap-2">
                        <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                        <UButton
                          variant="outline"
                          color="error"
                          :label="t('common.purge')"
                          :loading="purging === row.original.instance_id"
                          @click="async () => { await onPurge(row.original); close() }"
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
</template>
