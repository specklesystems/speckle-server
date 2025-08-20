<template>
  <div class="max-h-48 overflow-y-auto overflow-x-hidden simple-scrollbar">
    <div
      v-for="value in availableValues"
      :key="value"
      class="flex items-center justify-between gap-2 text-body-2xs pr-2 py-1 px-2 hover:bg-primary-muted"
    >
      <div class="flex items-center min-w-0">
        <FormCheckbox
          :name="`filter-${filterId}-${value}`"
          :model-value="isValueSelected(value)"
          hide-label
          @update:model-value="$emit('toggleValue', value)"
        />
        <span class="flex-1 truncate text-foreground ml-2">
          {{ value }}
        </span>
      </div>
      <div class="flex items-center">
        <div class="shrink-0 text-foreground-2 text-body-3xs">
          {{ getValueCount(value) }}
        </div>
        <div
          v-if="getValueColor(value)"
          class="w-3 h-3 rounded-full border border-outline-3 ml-2 shrink-0"
          :style="{ backgroundColor: getValueColor(value) || undefined }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormCheckbox } from '@speckle/ui-components'

defineProps<{
  filterId: string
  availableValues: string[]
  isValueSelected: (value: string) => boolean
  getValueCount: (value: string) => number
  getValueColor: (value: string) => string | null
}>()

defineEmits<{
  toggleValue: [value: string]
}>()
</script>
