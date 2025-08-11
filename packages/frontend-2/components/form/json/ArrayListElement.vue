<template>
  <div class="flex items-center space-x-2">
    <div class="flex flex-col space-y-1 justify-between">
      <FormButton
        size="sm"
        hide-text
        :icon-left="ArrowUp"
        :disabled="!moveUpEnabled"
        type="button"
        @click.stop="moveUp?.()"
      />

      <FormButton
        size="sm"
        color="danger"
        hide-text
        :icon-left="X"
        :disabled="!deleteEnabled"
        type="button"
        @click.stop="doDelete?.()"
      />
      <FormButton
        size="sm"
        hide-text
        :icon-left="ArrowDown"
        :disabled="!moveDownEnabled"
        type="button"
        @click.stop="moveDown?.()"
      />
    </div>
    <div class="grow">
      <slot></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ArrowDown, ArrowUp, X } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    initiallyExpanded?: boolean
    label?: string
    moveUpEnabled?: boolean
    moveDownEnabled?: boolean
    deleteEnabled?: boolean
    moveUp?: () => void
    moveDown?: () => void
    doDelete?: () => void
  }>(),
  {
    moveUpEnabled: true,
    moveDownEnabled: true,
    deleteEnabled: true
  }
)
</script>
