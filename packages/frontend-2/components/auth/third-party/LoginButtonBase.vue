<template>
  <NuxtLink
    :to="to"
    :class="[
      'grow px-3 inline-flex justify-center items-center outline-none h6 font-medium leading-7',
      'rounded-sm shadow bg-foundation text-foreground dark:text-foreground-on-primary',
      'ring-primary-outline-2 focus:ring-2 hover:ring-2',
      noVerticalPadding ? '' : 'py-2'
    ]"
  >
    <div class="flex items-center justify-center space-x-4">
      <slot />
    </div>
  </NuxtLink>
</template>
<script setup lang="ts">
defineProps<{
  to: string
  noVerticalPadding?: boolean
}>()
</script>
