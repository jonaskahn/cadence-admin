<script lang="ts" setup>
const { t } = useI18n()

const globalSettingFields = computed(() => [
  { key: 'max_orgs',       desc: t('about.admin.techSection.globalSettings.maxOrgs') },
  { key: 'default_tier',   desc: t('about.admin.techSection.globalSettings.defaultTier') },
  { key: 'hot_quota',      desc: t('about.admin.techSection.globalSettings.hotQuota') },
  { key: 'warm_quota',     desc: t('about.admin.techSection.globalSettings.warmQuota') },
  { key: 'cold_quota',     desc: t('about.admin.techSection.globalSettings.coldQuota') },
  { key: 'model_catalog',  desc: t('about.admin.techSection.globalSettings.modelCatalog') },
  { key: 'feature_flags',  desc: t('about.admin.techSection.globalSettings.featureFlags') }
])

const healthServices = computed(() => [
  { name: 'PostgreSQL', icon: 'i-lucide-database',       desc: t('about.admin.techSection.health.postgresql') },
  { name: 'Redis',      icon: 'i-lucide-server',         desc: t('about.admin.techSection.health.redis') },
  { name: 'MongoDB',    icon: 'i-lucide-hard-drive',     desc: t('about.admin.techSection.health.mongodb') }
])

const poolTiers = computed(() => [
  { tier: 'hot',  color: 'error' as const,   desc: t('about.admin.techSection.pool.hot') },
  { tier: 'warm', color: 'warning' as const, desc: t('about.admin.techSection.pool.warm') },
  { tier: 'cold', color: 'info' as const,    desc: t('about.admin.techSection.pool.cold') }
])

const faqItems = computed(() => [
  {
    label: t('about.admin.faq1.question'),
    content: t('about.admin.faq1.answer')
  },
  {
    label: t('about.admin.faq2.question'),
    content: t('about.admin.faq2.answer')
  },
  {
    label: t('about.admin.faq3.question'),
    content: t('about.admin.faq3.answer')
  }
])
</script>

<template>
  <section class="space-y-8">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-sliders" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.admin.title') }}</h2>
    </div>
    <p class="text-xs text-dimmed">{{ t('about.admin.subtitle') }}</p>
    <p class="text-sm">{{ t('about.admin.intro') }}</p>
    <ul class="text-sm list-disc list-inside space-y-1 mb-4">
      <li>{{ t('about.admin.bullet1') }}</li>
      <li>{{ t('about.admin.bullet2') }}</li>
      <li>{{ t('about.admin.bullet3') }}</li>
      <li>{{ t('about.admin.bullet4') }}</li>
      <li>{{ t('about.admin.bullet5') }}</li>
    </ul>

    <!-- Technical Reference -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-settings-2" class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-semibold">{{ t('about.admin.techSection.title') }}</h3>
      </div>

      <!-- Global Settings Fields -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.admin.techSection.globalSettings.title') }}</p>
        <div class="space-y-2">
          <div v-for="field in globalSettingFields" :key="field.key" class="flex items-start gap-3">
            <code class="text-primary text-sm font-mono shrink-0">{{ field.key }}</code>
            <p class="text-xs text-dimmed">{{ field.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Health Services -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.admin.techSection.health.title') }}</p>
        <div class="space-y-2">
          <div v-for="svc in healthServices" :key="svc.name" class="flex items-start gap-3 border border-(--ui-border) rounded-lg p-3">
            <UIcon :name="svc.icon" class="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium">{{ svc.name }}</p>
              <p class="text-xs text-dimmed">{{ svc.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pool Tiers -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.admin.techSection.pool.title') }}</p>
        <div class="grid grid-cols-3 gap-2">
          <div v-for="tier in poolTiers" :key="tier.tier" class="border border-(--ui-border) rounded-lg p-3">
            <UBadge :label="tier.tier" :color="tier.color" variant="soft" class="mb-2" />
            <p class="text-xs text-dimmed">{{ tier.desc }}</p>
          </div>
        </div>
        <p class="text-xs text-dimmed mt-2">{{ t('about.admin.techSection.pool.memoryNote') }}</p>
      </div>
    </div>

    <UAccordion :items="faqItems" />
  </section>
</template>
