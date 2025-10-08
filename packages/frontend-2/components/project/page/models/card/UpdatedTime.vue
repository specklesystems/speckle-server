<template>
  <div class="select-none">
    Updated
    <span v-tippy="updatedAtFormatted.full">
      {{ updatedAtFormatted.relative }}
    </span>
  </div>
</template>
<script setup lang="ts">
/**
 * Separate component so that hydration mismatches only cause this component to re-render, not the entire model card.
 * Hydration mismatches can happen here when the server resolves the update as X minutes ago, but the client resolves it as X minutes and 1 second ago.
 *
 * @deprecated Formatted dates now use a SSR-friendly now() date, so this doesnt need to be used anymore
 */
const props = defineProps<{
  updatedAt: string
}>()
const { formattedRelativeDate, formattedFullDate } = useDateFormatters()

const updatedAtFormatted = computed(() => {
  return {
    full: formattedFullDate(props.updatedAt),
    relative: formattedRelativeDate(props.updatedAt, { prefix: true })
  }
})
</script>
