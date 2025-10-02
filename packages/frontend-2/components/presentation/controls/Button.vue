<template>
  <div v-tippy="tooltip">
    <button
      :disabled="disabled"
      class="bg-foundation size-8 rounded-md flex items-center justify-center hover:bg-primary-muted disabled:hover:bg-transparent text-foreground disabled:text-foreground-3"
      :class="[disabled ? 'cursor-not-allowed' : 'cursor-pointer']"
    >
      <component :is="icon" class="size-4" />
      <slot />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ConcreteComponent } from 'vue'

defineProps<{
  icon: ConcreteComponent
  disabled?: boolean
  tooltip?: string
}>()
</script>
