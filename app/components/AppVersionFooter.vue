<script lang="ts" setup>
const { appVersion, gitHash } = useRuntimeConfig().public
</script>

<template>
  <div class="fixed bottom-0 inset-x-0 z-50 flex items-center justify-center h-5 pointer-events-none">
    <span class="text-[12px] font-mono text-muted/50 select-none tracking-wide">
      v{{ appVersion }} <span class="opacity-60">@{{ gitHash }}</span>
    </span>
  </div>
</template>
