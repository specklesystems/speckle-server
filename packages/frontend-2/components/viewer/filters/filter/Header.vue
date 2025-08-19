<template>
  <div class="flex items-center justify-between mb-2 px-2 pt-1">
    <div class="flex items-center gap-2">
      <span class="text-body-3xs text-foreground-2">Filter</span>
      <span class="text-body-3xs text-foreground-2">
        ({{ selectedCount }} selected)
      </span>
    </div>
    <div class="flex items-center gap-1">
      <FormButton
        v-tippy="
          'Toggle coloring for this filter (only one filter can be colored at a time)'
        "
        color="subtle"
        size="sm"
        hide-text
        :disabled="!hasFilter"
        :icon-right="isApplied ? 'IconColouring' : 'IconColouringOutline'"
        @click="$emit('toggleColors')"
      />
      <FormButton
        v-tippy="'Remove filter'"
        color="subtle"
        size="sm"
        hide-text
        :icon-right="X"
        @click="$emit('remove')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { FormButton } from '@speckle/ui-components'

defineProps<{
  selectedCount: number
  hasFilter: boolean
  isApplied: boolean
}>()

defineEmits<{
  toggleColors: []
  remove: []
}>()
</script>
