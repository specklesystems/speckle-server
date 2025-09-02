<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="px-1">
    <div
      class="group/checkbox flex items-center justify-between gap-2 text-body-3xs py-0.5 px-2 hover:bg-highlight-1 rounded-md cursor-pointer"
      @click="$emit('toggle')"
    >
      <div class="flex items-center min-w-0">
        <!-- Checkbox is purely visual - so pointer-events-none -->
        <FormCheckbox
          class="pointer-events-none -mt-1"
          :class="{
            'border-transparent group-hover/checkbox:border-outline-5': !isSelected,
            'opacity-50 dark:!bg-transparent !border dark:!border-outline-5 !group-hover/checkbox:border-outline-5':
              isDefaultSelected
          }"
          :name="`filter-${filter.id}-${value}`"
          :model-value="isSelected"
          hide-label
        />
        <span v-if="value" class="flex-1 truncate text-foreground ml-0.5">
          {{ value }}
        </span>
        <span v-else class="flex-1 text-foreground ml-0.5 italic">null</span>
      </div>
      <div class="flex items-center">
        <div v-if="count" class="shrink-0 text-foreground-2 text-body-3xs">
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
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { getFilterValueCount } from '~/lib/viewer/composables/filtering/counts'
import { isStringFilter, type FilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
  value: string
}>()

defineEmits<{
  toggle: []
}>()

const { isActiveFilterValueSelected, getFilterValueColor, filters } =
  useFilterUtilities()

const isSelected = computed(() =>
  isActiveFilterValueSelected(props.filter.id, props.value)
)

const count = computed(() => {
  if (!props.filter.filter) return null
  return getFilterValueCount(props.filter.filter, props.value)
})

const color = computed(() => {
  if (filters.activeColorFilterId.value !== props.filter.id) {
    return null
  }
  return getFilterValueColor(props.value)
})

const isDefaultSelected = computed(() => {
  return (
    isStringFilter(props.filter) &&
    props.filter.isDefaultAllSelected &&
    isSelected.value
  )
})
</script>
