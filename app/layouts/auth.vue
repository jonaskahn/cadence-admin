<template>
  <UApp>
    <div
      class="bg-default flex min-h-[100dvh] flex-col"
      style="background-image: radial-gradient(ellipse at 50% 0%, var(--color-primary-100) 0%, transparent 60%)"
    >
      <div class="flex flex-1 items-center justify-center px-4">
        <slot />
      </div>
    </div>
  </UApp>
</template>
