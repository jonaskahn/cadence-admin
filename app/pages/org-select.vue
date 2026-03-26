<script lang="ts" setup>
import { orgDisplayName, roleColor, subscriptionTierColor } from '~/utils'

definePageMeta({ layout: 'auth' })

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()

function roleLabelKey(role: string): string {
  if (role === 'sys_admin') return 'roles.sysAdmin'
  if (role === 'org_admin') return 'roles.orgAdmin'
  return 'roles.member'
}

function selectOrg(orgId: string) {
  auth.selectOrg(orgId)
}

function loadOrgs() {
  auth.loadOrgs()
}

function logout() {
  auth.logout()
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
  <div class="flex w-full max-w-lg flex-col gap-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">{{ t('auth.selectOrgTitle') }}</h1>
      <p class="text-dimmed mt-1 text-sm">{{ t('auth.selectOrgSubtitle') }}</p>
    </div>

    <div class="flex flex-col gap-3">
      <UCard
        v-for="org in auth.orgList.value"
        :key="org.org_id"
        variant="soft"
        class="cursor-pointer shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl"
        @click="selectOrg(org.org_id)"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">
              {{ orgDisplayName(org) }}
            </p>
            <p class="text-primary mt-0.5 text-xs dark:text-neutral-100">
              {{ org.org_id }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <UBadge v-if="org.tier" :color="subscriptionTierColor(org.tier)" size="sm" variant="solid">
              {{ org.tier.toUpperCase() }}
            </UBadge>
            <UBadge :color="roleColor(org.role)" size="sm" variant="soft">
              {{ t(roleLabelKey(org.role)) }}
            </UBadge>
          </div>
        </div>
      </UCard>

      <UCard v-if="auth.orgList.value.length === 0" variant="soft" class="py-8 text-center">
        <p class="text-dimmed">{{ t('auth.noOrgsAvailable') }}</p>
        <UButton class="mt-2" :label="t('common.refresh')" size="sm" @click="loadOrgs" />
      </UCard>
    </div>

    <div class="text-center">
      <UButton
        class="hover:bg-primary-50/5 cursor-pointer bg-neutral-50/5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl"
        color="neutral"
        :label="t('auth.signOut')"
        size="xl"
        @click="logout"
      />
    </div>
  </div>
</template>
