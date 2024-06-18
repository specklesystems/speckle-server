<template>
  <div>
    updated
    <b>{{ updatedAt }}</b>
  </div>
</template>
<script setup lang="ts">
/**
 * Separate component so that hydration mismatches only cause this component to re-render, not the entire model card.
 * Hydration mismatches can happen here when the server resolves the update as X minutes ago, but the client resolves it as X minutes and 1 second ago.
 */

defineProps<{
  updatedAt: string
}>()
</script>
