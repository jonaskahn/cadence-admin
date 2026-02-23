<script setup lang="ts">
import { roleColor, roleLabel } from '~/utils'

definePageMeta({ layout: 'auth' })

const auth = useAuth()

if (!auth.isAuthenticated.value) {
  await navigateTo('/login')
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
      <h1 class="text-2xl font-bold">Select Organization</h1>
      <p class="text-dimmed text-sm mt-1">Choose an organization to continue</p>
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
          <UBadge :color="roleColor(org.role)" variant="subtle" size="sm">
            {{ roleLabel(org.role) }}
          </UBadge>
        </div>
      </UCard>

      <UCard v-if="auth.orgList.value.length === 0" class="text-center py-8">
        <p class="text-dimmed">No organizations available</p>
        <UButton label="Refresh" variant="ghost" size="sm" class="mt-2" @click="auth.loadOrgs()" />
      </UCard>
    </div>

    <div class="text-center">
      <UButton label="Sign out" variant="ghost" color="neutral" size="sm" @click="auth.logout()" />
    </div>
  </div>
</template>
