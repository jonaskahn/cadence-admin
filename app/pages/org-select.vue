<script lang="ts" setup>
import { roleColor } from '~/utils'

definePageMeta({ layout: 'auth' })

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()

function roleLabelKey(role: string): string {
  if (role === 'sys_admin') return 'roles.sysAdmin'
  if (role === 'org_admin') return 'roles.orgAdmin'
  return 'roles.member'
}

if (!auth.isAuthenticated.value) {
  await navigateTo(localePath('/login'))
}

onMounted(async () => {
  await auth.loadOrgs()
  if (auth.orgList.value.length === 1) {
    auth.selectOrg(auth.orgList.value[0]!.org_id)
  }
})
</script>

<template>
  <div class="w-full max-w-lg flex flex-col gap-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">{{ t('auth.selectOrgTitle') }}</h1>
      <p class="text-dimmed text-sm mt-1">{{ t('auth.selectOrgSubtitle') }}</p>
    </div>

    <div class="flex flex-col gap-3">
      <UCard
        v-for="org in auth.orgList.value"
        :key="org.org_id"
        class="cursor-pointer hover:bg-elevated/50 transition-colors"
        @click="auth.selectOrg(org.org_id)"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">
              {{ org.org_name }}
            </p>
            <p class="text-dimmed text-xs mt-0.5">
              {{ org.org_id }}
            </p>
          </div>
          <UBadge :color="roleColor(org.role)" size="sm" variant="subtle">
            {{ t(roleLabelKey(org.role)) }}
          </UBadge>
        </div>
      </UCard>

      <UCard v-if="auth.orgList.value.length === 0" class="text-center py-8">
        <p class="text-dimmed">{{ t('auth.noOrgsAvailable') }}</p>
        <UButton class="mt-2" :label="t('common.refresh')" size="sm" variant="ghost" @click="auth.loadOrgs()" />
      </UCard>
    </div>

    <div class="text-center">
      <UButton color="neutral" :label="t('auth.signOut')" size="sm" variant="ghost" @click="auth.logout()" />
    </div>
  </div>
</template>
