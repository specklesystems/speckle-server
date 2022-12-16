<template>
  <div
    :class="[
      'bg-foundation-page border-2 border-outline-2 rounded-lg py-4 px-6',
      gridItemWidthClasses
    ]"
  >
    <div class="flex flex-col">
      <div class="text-foreground-2 mb-2">
        <slot name="top" />
      </div>
      <div class="text-foreground">
        <slot name="bottom" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const gridItemWidthClasses = computed(() => 'col-span-12 sm:col-span-6 lg:col-span-3')
</script>
