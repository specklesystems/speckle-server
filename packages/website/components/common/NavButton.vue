<template>
  <div>
    <NuxtLink
      v-if="to"
      class="transition px-3 py-1 text-heading-sm rounded hover:bg-highlight-2 text-foreground-2 hover:text-foreground flex items-center"
      :to="to"
    >
      <slot default></slot>
    </NuxtLink>
    <button
      v-else
      class="transition px-3 py-1 text-heading-sm rounded hover:bg-highlight-2 text-foreground-2 hover:text-foreground flex items-center"
    >
      <slot default></slot>
    </button>
  </div>
</template>
<script setup lang="ts">
defineProps<{ to?: string }>()
</script>
