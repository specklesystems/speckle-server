<template>
  <div class="select-none">
    Updated
    <span v-tippy="updatedAtFormatted.full">
      {{ updatedAtFormatted.relative }}
    </span>
  </div>
</template>
<script setup lang="ts">
import { formattedFullDate } from '~/utils/dateFormatter'
/**
 * Separate component so that hydration mismatches only cause this component to re-render, not the entire model card.
 * Hydration mismatches can happen here when the server resolves the update as X minutes ago, but the client resolves it as X minutes and 1 second ago.
 */

const props = defineProps<{
  updatedAt: string
}>()

const updatedAtFormatted = computed(() => {
  return {
    full: formattedFullDate(props.updatedAt),
    relative: formattedRelativeDate(props.updatedAt, { prefix: true })
  }
})
</script>
