<template>
  <NuxtLink
    :to="to"
    :class="[
      'transition grow px-3 inline-flex justify-center items-center outline-none h6 font-medium leading-7',
      'rounded shadow bg-foundation- text-foreground dark:text-foreground-on-primary',
      'border border-outline-2 hover:border-outline-3',
      noVerticalPadding ? '' : 'py-2'
    ]"
  >
    <div class="flex items-center justify-center">
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
