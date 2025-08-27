<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="px-1">
    <div
      class="flex items-center justify-between gap-2 text-body-3xs py-0.5 px-2 hover:bg-highlight-1 rounded cursor-pointer"
      @click="$emit('toggle')"
    >
      <div class="flex items-center min-w-0">
        <FormCheckbox
          :class="isSelected ? '' : 'border-transparent hover:border-highlight-2'"
          :name="`filter-${filterId}-${value}`"
          :model-value="isSelected"
          hide-label
          @update:model-value="$emit('toggle')"
        />
        <span class="flex-1 truncate text-foreground ml-1">
          {{ value }}
        </span>
      </div>
      <div class="flex items-center">
        <div class="shrink-0 text-foreground-2 text-body-3xs">
          {{ count }}
        </div>
        <div
          v-if="color"
          class="w-3 h-3 rounded-full border border-outline-3 ml-2 shrink-0"
          :style="{ backgroundColor: color }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormCheckbox } from '@speckle/ui-components'

defineProps<{
  filterId: string
  value: string
  isSelected: boolean
  count: number
  color?: string | null
}>()

defineEmits<{
  toggle: []
}>()
</script>
