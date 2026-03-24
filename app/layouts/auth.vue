<template>
  <UApp>
    <div
      class="min-h-[100dvh] flex flex-col bg-default"
      style="background-image: radial-gradient(ellipse at 50% 0%, var(--color-primary-100) 0%, transparent 60%)"
    >
      <div class="flex flex-1 items-center justify-center px-4">
        <slot />
      </div>
    </div>
  </UApp>
</template>
