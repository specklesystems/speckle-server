<template>
  <ViewerLayoutSidePanel>
    <template #title>Filters</template>
    <template #actions>
      <div class="flex gap-x-0.5 items-center">
        <FormButton
          v-if="hasAnyFiltersApplied"
          size="sm"
          color="subtle"
          tabindex="-1"
          @click="resetFilters()"
        >
          Reset
        </FormButton>
        <FormButton
          v-tippy="showPropertySelection ? undefined : 'Add new filter'"
          color="subtle"
          size="sm"
          :class="showPropertySelection ? '!bg-highlight-3' : ''"
          hide-text
          :icon-left="showPropertySelection ? X : Plus"
          @click="handleAddFilterClick"
        />
      </div>
    </template>

    <!-- Filter Logic Selection -->
    <ViewerFiltersFilterLogicSelector
      v-if="propertyFilters.length > 0"
      v-model="filterLogic"
      @update:model-value="handleFilterLogicChange"
    />

    <div class="h-full flex flex-col select-none">
      <!-- Active Filters Section -->
      <div
        v-if="propertyFilters.length > 0"
        class="flex-1 overflow-y-scroll simple-scrollbar"
      >
        <div class="space-y-3 p-3">
          <ViewerFiltersFilterCard
            v-for="filter in propertyFilters"
            :key="filter.id"
            :filter="filter"
            @toggle-colors="toggleFilterColors(filter.id)"
            @remove="removeFilter(filter.id)"
            @select-condition="(val) => handleConditionSelect(filter.id, val)"
            @range-change="(event) => handleNumericRangeChange(filter.id, event)"
            @toggle-value="(value) => toggleActiveFilterValue(filter.id, value)"
            @select-all="(selected) => handleSelectAll(filter.id, selected)"
          />
        </div>
      </div>

      <!-- Empty State -->
      <ViewerFiltersFilterEmptyState v-else @add-filter="addNewEmptyFilter" />
    </div>

    <!-- Property Selection Portal -->
    <Portal v-if="showPropertySelection" to="panel-extension">
      <div ref="propertySelectionRef" class="h-full">
        <ViewerFiltersPropertySelectionPanel
          :options="propertySelectOptions"
          @select-property="selectProperty"
        />
      </div>
    </Portal>
  </ViewerLayoutSidePanel>
</template>

<script setup lang="ts">
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewer
} from '~~/lib/viewer/composables/setup'
import { FilterCondition, FilterLogic } from '~/lib/viewer/helpers/filters/types'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  useObjectDataStore,
  type QueryCriteria
} from '~~/composables/viewer/useObjectDataStore'
import { X, Plus } from 'lucide-vue-next'
import { FormButton } from '@speckle/ui-components'

const {
  filters: { propertyFilters },
  getRelevantFilters,
  getPropertyName,
  getPropertyType,
  addActiveFilter,
  removeActiveFilter,
  toggleActiveFilterValue,
  updateFilterCondition,
  resetFilters,
  toggleColorFilter,
  getAvailableFilterValues
} = useFilterUtilities()

const {
  metadata: { availableFilters: allFilters }
} = useInjectedViewer()

const {
  filters: { hasAnyFiltersApplied }
} = useInjectedViewerInterfaceState()

const objectDataStore = useObjectDataStore()

const relevantFilters = computed(() => {
  return getRelevantFilters(allFilters.value)
})

const propertySelectOptions = computed(() => {
  const allOptions = relevantFilters.value.map((filter) => {
    const pathParts = filter.key.split('.')
    const propertyName = pathParts[pathParts.length - 1] // Last part (e.g., "name")
    const parentPath = pathParts.slice(0, -1).join('.') // Everything except last part (e.g., "ab")

    return {
      value: filter.key,
      label: propertyName, // Clean property name for main display
      parentPath, // Full path without the property name
      type: getPropertyType(filter),
      hasParent: parentPath.length > 0
    }
  })

  // Sort: root properties first, then grouped by parent
  const sortedOptions = allOptions.sort((a, b) => {
    // Root properties (no parent) come first
    if (!a.hasParent && b.hasParent) return -1
    if (a.hasParent && !b.hasParent) return 1

    // If both have parents, group by parent path
    if (a.hasParent && b.hasParent) {
      const parentComparison = a.parentPath.localeCompare(b.parentPath)
      if (parentComparison !== 0) return parentComparison
    }

    // Within same group, sort by property name
    return a.label.localeCompare(b.label)
  })

  return sortedOptions
})

const filterLogic = ref<FilterLogic>(FilterLogic.All)

objectDataStore.setFilterLogic(filterLogic.value)

const mp = useMixpanel()

const showPropertySelection = ref(false)
const propertySelectionRef = ref<HTMLElement>()

// Watch for filter changes and update data store slices
watch(
  () => propertyFilters.value,
  (newFilters) => {
    // Clear existing slices from this panel
    const existingSlices = objectDataStore.dataSlices.value.filter((slice) =>
      slice.id.startsWith('filter-panel-')
    )

    existingSlices.forEach((slice) => objectDataStore.popSlice(slice))

    // Create new slices for filters with selected values
    newFilters.forEach((filter) => {
      if (filter.filter && filter.selectedValues.length > 0) {
        const queryCriteria: QueryCriteria = {
          propertyKey: filter.filter.key,
          condition: filter.condition,
          values: filter.selectedValues
        }

        const matchingObjectIds = objectDataStore.queryObjects(queryCriteria)

        const slice = {
          id: `filter-panel-${filter.id}`,
          name: `${getPropertyName(filter.filter.key)} ${
            filter.condition === FilterCondition.Is ? 'is' : 'is not'
          } ${filter.selectedValues.join(', ')}`,
          objectIds: matchingObjectIds
        }

        objectDataStore.pushOrReplaceSlice(slice)
      }
    })
  },
  { deep: true, immediate: true }
)

const addNewEmptyFilter = () => {
  showPropertySelection.value = true

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'open-property-selection'
  })
}

const handleAddFilterClick = () => {
  if (showPropertySelection.value) {
    showPropertySelection.value = false
  } else {
    addNewEmptyFilter()
  }
}

const selectProperty = (propertyKey: string) => {
  const property = relevantFilters.value.find((p) => p.key === propertyKey)

  if (property) {
    addActiveFilter(property)
  }

  showPropertySelection.value = false

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'add-new-filter',
    value: propertyKey
  })
}

const removeFilter = (filterId: string) => {
  removeActiveFilter(filterId)

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'remove-active-filter'
  })
}

const toggleFilterColors = (filterId: string) => {
  toggleColorFilter(filterId)

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'toggle-filter-colors'
  })
}

const handleConditionSelect = (filterId: string, val: unknown) => {
  if (
    val &&
    !Array.isArray(val) &&
    typeof val === 'object' &&
    val !== null &&
    'value' in val
  ) {
    updateFilterCondition(filterId, (val as { value: string }).value as FilterCondition)
  }
}

const handleFilterLogicChange = (val: unknown) => {
  if (
    val &&
    !Array.isArray(val) &&
    typeof val === 'object' &&
    val !== null &&
    'value' in val
  ) {
    filterLogic.value = (val as { value: string }).value as FilterLogic
  }
}

const handleNumericRangeChange = (filterId: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const _value = parseFloat(target.value)

  // For now, just update the passMin value
  // TODO: Implement proper range handling with min/max values
}

const handleSelectAll = (filterId: string, selected: boolean) => {
  const filter = propertyFilters.value.find((f) => f.id === filterId)
  if (!filter || !filter.filter) return

  const availableValues = getAvailableFilterValues(filter.filter)

  if (selected) {
    // Select all available values that aren't already selected
    availableValues.forEach((value) => {
      if (!filter.selectedValues.includes(value)) {
        toggleActiveFilterValue(filterId, value)
      }
    })
  } else {
    // Deselect all currently selected values
    const selectedValuesCopy = [...filter.selectedValues]
    selectedValuesCopy.forEach((value) => {
      toggleActiveFilterValue(filterId, value)
    })
  }

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: selected ? 'select-all-filter-values' : 'deselect-all-filter-values',
    filterId
  })
}

// Watch for filter logic changes and update data store
watch(filterLogic, (newLogic) => {
  objectDataStore.setFilterLogic(newLogic)
})
</script>
