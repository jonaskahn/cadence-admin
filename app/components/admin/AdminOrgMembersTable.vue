<script lang="ts" setup>
import type { UserMembershipResponse } from '~/types'

const props = defineProps<{
  columns: unknown[]
  members: UserMembershipResponse[]
  removing: string | null
}>()

const emit = defineEmits<{
  'remove-confirmed': [userId: string, close: () => void]
}>()

const { t } = useI18n()

const columnsForTable = computed(() => props.columns as never)
</script>

<template>
  <UCard variant="soft">
    <template #header>
      <p class="font-semibold">{{ t('settings.members') }}</p>
    </template>
    <UTable :columns="columnsForTable" :data="members">
      <template #is_admin-cell="{ row }">
        <UBadge :color="row.original.is_admin ? 'warning' : 'neutral'" size="sm" variant="subtle">
          {{ row.original.is_admin ? t('roles.orgAdmin') : t('roles.member') }}
        </UBadge>
      </template>
      <template #actions-cell="{ row }">
        <UPopover>
          <UButton color="error" icon="i-lucide-trash" size="xs" />
          <template #content="{ close }">
            <div class="min-w-48 p-4">
              <p class="text-dimmed mb-3 text-sm">{{ t('admin.removeMemberConfirm') }}</p>
              <div class="flex justify-end gap-2">
                <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                <UButton
                  color="error"
                  :label="t('common.remove')"
                  :loading="removing === row.original.user_id"
                  @click="emit('remove-confirmed', row.original.user_id, close)"
                />
              </div>
            </div>
          </template>
        </UPopover>
      </template>
    </UTable>
  </UCard>
</template>
