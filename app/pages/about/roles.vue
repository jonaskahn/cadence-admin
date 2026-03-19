<script lang="ts" setup>
const { t } = useI18n()

const roleMatrix = computed(() => [
  {
    role: 'system_admin',
    color: 'error' as const,
    scope: t('about.roles.techSection.matrix.systemAdmin.scope'),
    permissions: [
      t('about.roles.techSection.matrix.systemAdmin.perm1'),
      t('about.roles.techSection.matrix.systemAdmin.perm2'),
      t('about.roles.techSection.matrix.systemAdmin.perm3'),
      t('about.roles.techSection.matrix.systemAdmin.perm4')
    ]
  },
  {
    role: 'org_admin',
    color: 'warning' as const,
    scope: t('about.roles.techSection.matrix.orgAdmin.scope'),
    permissions: [
      t('about.roles.techSection.matrix.orgAdmin.perm1'),
      t('about.roles.techSection.matrix.orgAdmin.perm2'),
      t('about.roles.techSection.matrix.orgAdmin.perm3'),
      t('about.roles.techSection.matrix.orgAdmin.perm4')
    ]
  },
  {
    role: 'member',
    color: 'success' as const,
    scope: t('about.roles.techSection.matrix.member.scope'),
    permissions: [t('about.roles.techSection.matrix.member.perm1'), t('about.roles.techSection.matrix.member.perm2')]
  }
])

const faqItems = computed(() => [
  {
    label: t('about.roles.faq1.question'),
    content: t('about.roles.faq1.answer')
  },
  {
    label: t('about.roles.faq2.question'),
    content: t('about.roles.faq2.answer')
  },
  {
    label: t('about.roles.faq3.question'),
    content: t('about.roles.faq3.answer')
  }
])
</script>

<template>
  <section class="space-y-8">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-shield-check" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.roles.title') }}</h2>
    </div>
    <p class="text-xs text-dimmed">{{ t('about.roles.subtitle') }}</p>
    <p class="text-sm">{{ t('about.roles.intro') }}</p>
    <ul class="text-sm list-disc list-inside space-y-1 mb-4">
      <li>{{ t('about.roles.bullet1') }}</li>
      <li>{{ t('about.roles.bullet2') }}</li>
      <li>{{ t('about.roles.bullet3') }}</li>
      <li>{{ t('about.roles.bullet4') }}</li>
      <li>{{ t('about.roles.bullet5') }}</li>
    </ul>

    <!-- Technical Reference -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-shield" class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-semibold">{{ t('about.roles.techSection.title') }}</h3>
      </div>
      <p class="text-sm text-dimmed">{{ t('about.roles.techSection.intro') }}</p>

      <div class="space-y-3">
        <div v-for="role in roleMatrix" :key="role.role" class="border border-(--ui-border) rounded-lg p-3 space-y-2">
          <div class="flex items-center gap-2">
            <UBadge :label="role.role" :color="role.color" variant="soft" />
            <span class="text-xs text-dimmed">{{ role.scope }}</span>
          </div>
          <ul class="space-y-1">
            <li v-for="(perm, idx) in role.permissions" :key="idx" class="flex items-start gap-2">
              <UIcon name="i-lucide-check" class="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
              <span class="text-xs">{{ perm }}</span>
            </li>
          </ul>
        </div>
      </div>

      <p class="text-xs text-dimmed">{{ t('about.roles.techSection.crossOrgNote') }}</p>
      <p class="text-xs text-dimmed">{{ t('about.roles.techSection.platformNote') }}</p>
    </div>

    <UAccordion :items="faqItems" />
  </section>
</template>
