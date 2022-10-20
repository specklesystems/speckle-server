<template>
  <div
    class="divide-y divide-background-3 overflow-hidden rounded-lg bg-background shadow"
  >
    <div v-if="$slots.header" class="px-4 py-4 sm:px-6">
      <slot name="header" />
    </div>
    <div class="px-4 py-4 sm:p-6">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-4 py-4 sm:px-6">
      <slot name="footer" />
    </div>
  </div>
</template>
