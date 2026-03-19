<script lang="ts" setup>
const localePath = useLocalePath()

// Telemetry is now a tab in admin/settings; redirect legacy /admin/telemetry URLs
await navigateTo(localePath('/admin/settings'))
</script>

<template>
  <div />
</template>
