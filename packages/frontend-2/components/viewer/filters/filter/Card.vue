<template>
  <div class="border border-outline-2 rounded-lg p-1">
    <ViewerFiltersFilterHeader
      :selected-count="filter.selectedValues.length"
      :has-filter="!!filter.filter"
      :is-applied="filter.isApplied"
      @toggle-colors="$emit('toggleColors')"
      @remove="$emit('remove')"
    />

    <ViewerFiltersFilterPropertySelector
      :filter="filter"
      :property-options="propertyOptions"
      @property-selected="$emit('selectProperty', $event)"
    />

    <ViewerFiltersFilterConditionSelector
      :has-filter="!!filter.filter"
      :filter-id="filter.id"
      :current-condition="filter.condition"
      @select-condition="$emit('selectCondition', $event)"
    />

    <div v-if="filter.filter" class="px-2">
      <ViewerFiltersFilterValuesNumericRange
        v-if="isNumericPropertyInfo(filter.filter)"
        :filter-id="filter.id"
        :property-name="getPropertyName(filter.filter.key)"
        :min="filter.filter.min"
        :max="filter.filter.max"
        :current-min="filter.filter.passMin || filter.filter.min"
        :current-max="filter.filter.passMax || filter.filter.max"
        @range-change="$emit('rangeChange', $event)"
      />

      <ViewerFiltersFilterValuesStringCheckboxes
        v-else
        :filter-id="filter.id"
        :available-values="getAvailableFilterValues(filter.filter)"
        :is-value-selected="(value: string) => isActiveFilterValueSelected(filter.id, value)"
        :get-value-count="(value: string) => filter.filter ? getValueCount(filter.filter, value) : 0"
        @toggle-value="$emit('toggleValue', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropertyInfo } from '@speckle/viewer'
import type { FilterCondition } from '~/lib/viewer/helpers/filters/types'
import { isNumericPropertyInfo } from '~/lib/viewer/helpers/sceneExplorer'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'

type FilterData = {
  id: string
  filter: PropertyInfo | null
  isApplied: boolean
  selectedValues: string[]
  condition: FilterCondition
}

defineProps<{
  filter: FilterData
  propertyOptions: Array<{ value: string; label: string }>
}>()

defineEmits([
  'toggleColors',
  'remove',
  'selectProperty',
  'selectCondition',
  'rangeChange',
  'toggleValue'
])

const { getPropertyName, getAvailableFilterValues, isActiveFilterValueSelected } =
  useFilterUtilities()

const getValueCount = (filter: PropertyInfo, value: string): number => {
  // Type guard to check if filter has valueGroups property
  const hasValueGroups = (
    f: PropertyInfo
  ): f is PropertyInfo & {
    valueGroups: Array<{ value: unknown; ids?: string[] }>
  } => {
    return (
      'valueGroups' in f &&
      Array.isArray((f as unknown as Record<string, unknown>).valueGroups)
    )
  }

  if (hasValueGroups(filter)) {
    const valueGroup = filter.valueGroups.find((vg) => String(vg.value) === value)
    return valueGroup?.ids?.length || 0
  }

  return 0
}
</script>
