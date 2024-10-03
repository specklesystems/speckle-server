<template>
  <button
    class="group text-left border border-outline-3 hover:border-outline-5 rounded-md bg-foundation-2"
    :class="title ? 'p-4' : 'px-4 py-2'"
    @click="$emit('click')"
  >
    <h6 v-if="title" class="text-body-sm font-medium mb-1 text-foreground">
      {{ title }}
    </h6>
    <p class="text-body-2xs text-foreground-2">
      {{ description }}
    </p>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description: string
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>
