<template>
  <div class="border border-outline-2 rounded-lg">
    <div class="border-b border-outline-3 p-1">
      <ViewerFiltersFilterHeader
        :has-filter="!!filter.filter"
        :is-applied="filter.isApplied"
        :filter-id="filter.id"
        :property-name="getPropertyName(filter.filter?.key || '')"
        :property-filter="filter.filter"
        @toggle-colors="$emit('toggleColors')"
        @remove="$emit('remove')"
      />

      <ViewerFiltersFilterConditionSelector
        :filter-id="filter.id"
        :current-condition="filter.condition"
        @select-condition="$emit('selectCondition', $event)"
      />

      <FormTextInput
        v-model="searchQuery"
        name="filter-search"
        placeholder="Search for a value..."
        input-type="search"
        size="sm"
      />
    </div>

    <div v-if="filter.filter">
      <ViewerFiltersFilterValuesNumericRange
        v-if="isNumericPropertyInfo(filter.filter)"
        :filter-id="filter.id"
        :property-name="getPropertyName(filter.filter.key)"
        :min="filter.filter.min"
        :max="filter.filter.max"
        :current-min="filter.filter.passMin || filter.filter.min"
        :current-max="filter.filter.passMax || filter.filter.max"
        :has-colors="
          activeColorFilterId === filter.id && !!getFilterColorGroups().length
        "
        @range-change="$emit('rangeChange', $event)"
      />

      <ViewerFiltersFilterValuesStringCheckboxes
        v-else
        :filter-id="filter.id"
        :available-values="getAvailableFilterValues(filter.filter)"
        :search-query="searchQuery"
        :is-value-selected="(value: string) => isActiveFilterValueSelected(filter.id, value)"
        :get-value-count="(value: string) => filter.filter ? getValueCount(filter.filter, value) : 0"
        :get-value-color="(value: string) => activeColorFilterId === filter.id ? getFilterValueColor(value) : null"
        @toggle-value="$emit('toggleValue', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropertyInfo } from '@speckle/viewer'
import type { FilterCondition } from '~/lib/viewer/helpers/filters/types'
import { isNumericPropertyInfo } from '~/lib/viewer/helpers/sceneExplorer'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
import { FormTextInput } from '@speckle/ui-components'

type FilterData = {
  id: string
  filter: PropertyInfo | null
  isApplied: boolean
  selectedValues: string[]
  condition: FilterCondition
}

defineProps<{
  filter: FilterData
}>()

defineEmits(['toggleColors', 'remove', 'selectCondition', 'rangeChange', 'toggleValue'])

const {
  getPropertyName,
  getAvailableFilterValues,
  isActiveFilterValueSelected,
  getFilterValueColor,
  getFilterColorGroups
} = useFilterUtilities()

const searchQuery = ref('')

const {
  filters: { activeColorFilterId }
} = useInjectedViewerInterfaceState()

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
