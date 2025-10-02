<template>
  <button
    v-tippy="tooltip"
    :disabled="disabled"
    class="bg-foundation size-8 rounded-md flex items-center justify-center hover:bg-primary-muted disabled:hover:bg-transparent text-foreground disabled:text-foreground-3"
  >
    <component :is="icon" class="size-4" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { ConcreteComponent } from 'vue'

defineProps<{
  icon: ConcreteComponent
  disabled?: boolean
  tooltip?: string
}>()
</script>
