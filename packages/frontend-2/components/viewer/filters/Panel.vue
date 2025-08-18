<template>
  <ViewerLayoutSidePanel>
    <template #title>Filters</template>
    <template #actions>
      <div class="flex gap-x-0.5 items-center">
        <FormButton
          v-if="title !== 'Object Type'"
          size="sm"
          color="subtle"
          tabindex="-1"
          @click="removePropertyFilter(), refreshColorsIfSetOrActiveFilterIsNumeric()"
        >
          Reset
        </FormButton>
        <FormButton
          v-tippy="'Add new filter'"
          color="subtle"
          size="sm"
          hide-text
          :icon-left="Plus"
          @click="addNewEmptyFilter"
        />
      </div>
    </template>

    <div class="h-full flex flex-col">
      <!-- Active Filters Section -->
      <div
        v-if="activeFilters.length > 0"
        class="flex-1 overflow-y-scroll simple-scrollbar"
      >
        <div class="space-y-3 p-3">
          <div
            v-for="filter in activeFilters"
            :key="filter.id"
            class="border border-outline-2 rounded-lg p-1"
          >
            <!-- Filter Header -->
            <div class="flex items-center justify-between mb-2 px-2 pt-1">
              <div class="flex items-center gap-2">
                <span class="text-body-3xs text-foreground-2">Filter</span>
                <span class="text-body-3xs text-foreground-2">
                  ({{ filter.selectedValues.length }} selected)
                </span>
              </div>
              <div class="flex items-center gap-1">
                <!-- Independent Color Toggle -->
                <FormButton
                  v-tippy="
                    'Toggle coloring for this filter (only one filter can be colored at a time)'
                  "
                  color="subtle"
                  size="sm"
                  hide-text
                  :disabled="!filter.filter"
                  :icon-right="
                    filter.isApplied ? 'IconColouring' : 'IconColouringOutline'
                  "
                  @click="toggleFilterColors(filter.id)"
                />
                <FormButton
                  v-tippy="'Remove filter'"
                  color="subtle"
                  size="sm"
                  hide-text
                  :icon-right="X"
                  @click="removeFilter(filter.id)"
                />
              </div>
            </div>

            <!-- Property Selection -->
            <div class="px-2 mb-2">
              <FormSelectBase
                v-if="!filter.filter"
                name="property-select"
                label="Property"
                placeholder="Select a property..."
                :items="propertySelectOptions"
                @update:model-value="(val) => handlePropertySelect(filter.id, val)"
              />
              <div v-else class="text-body-xs font-medium text-foreground">
                {{ getPropertyName(filter.filter?.key || '') }}
              </div>
            </div>

            <!-- Condition Selection -->
            <div v-if="filter.filter" class="px-2 mb-2">
              <FormSelectBase
                :name="`condition-${filter.id}`"
                label="Condition"
                :model-value="
                  conditionOptions.find(
                    (opt) => opt.value === (filter.condition || 'is')
                  )
                "
                :items="conditionOptions"
                @update:model-value="(val) => handleConditionSelect(filter.id, val)"
              />
            </div>

            <!-- Filter Values with Checkboxes -->
            <div
              v-if="filter.filter"
              class="max-h-48 overflow-y-auto overflow-x-hidden simple-scrollbar"
            >
              <div
                v-for="value in getAvailableFilterValues(filter.filter)"
                :key="value"
                class="flex items-center justify-between gap-2 text-body-2xs pr-2 py-1 px-2 hover:bg-primary-muted"
              >
                <div class="flex items-center min-w-0">
                  <FormCheckbox
                    :name="`filter-${filter.id}-${value}`"
                    :model-value="isActiveFilterValueSelected(filter.id, value)"
                    hide-label
                    @update:model-value="toggleActiveFilterValue(filter.id, value)"
                  />
                  <span class="flex-1 truncate text-foreground ml-2">
                    {{ value }}
                  </span>
                </div>
                <div class="shrink-0 text-foreground-2 text-body-3xs">
                  {{ getValueCount(filter.filter, value) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex-1 flex flex-col gap-6 items-center justify-center">
        <IllustrationEmptystateFilters class="-mt-8" />
        <div class="text-foreground-2 text-body-xs">There are no filters, yet.</div>
        <FormButton @click="addNewEmptyFilter">Add filter</FormButton>
      </div>
    </div>
    <!-- Property Selection Portal -->
    <Portal v-if="showPropertySelection" to="panel-extension">
      <div class="h-full flex flex-col">
        <div class="relative border-b border-outline-2 flex-shrink-0">
          <input
            id="property-search"
            v-model="propertySearch"
            type="text"
            placeholder="Search for a property..."
            class="text-body-2xs text-foreground-2 placeholder:text-foreground-2 w-full rounded-t-md border-none h-8 pl-8"
          />
          <label for="property-search" class="sr-only">Search for a property...</label>
          <Search class="absolute top-2.5 left-3 h-3 w-3" />
        </div>

        <div class="flex-1 overflow-y-auto overflow-x-hidden simple-scrollbar p-2">
          <div class="flex flex-col">
            <button
              v-for="property in propertySelectOptions"
              :key="property.value"
              class="px-2 py-2 text-foreground rounded-md hover:bg-highlight-3 text-left flex items-center gap-2"
              @click="selectProperty(property.value)"
            >
              <component
                :is="getPropertyTypeIcon(property.type)"
                class="h-3 w-3 mt-0.5 text-foreground-2 shrink-0"
              />
              <div class="min-w-0">
                <div class="text-body-2xs font-medium text-foreground">
                  {{ property.label }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  </ViewerLayoutSidePanel>
</template>
<script setup lang="ts">
import type { PropertyInfo } from '@speckle/viewer'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { isNumericPropertyInfo } from '~/lib/viewer/helpers/sceneExplorer'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'
import { X, Plus, Search, CaseLower, Hash, ToggleLeft } from 'lucide-vue-next'
import { FormButton, FormSelectBase } from '@speckle/ui-components'

const {
  removePropertyFilter,
  applyPropertyFilter,
  unApplyPropertyFilter,
  filters: { propertyFilter, activeFilters },
  getRelevantFilters,
  getPropertyName,
  // New multi-filter functions
  removeActiveFilter,
  toggleFilterApplied,
  getAvailableFilterValues,
  toggleActiveFilterValue,
  isActiveFilterValueSelected,
  updateFilterCondition
} = useFilterUtilities()

const {
  metadata: { availableFilters: allFilters }
} = useInjectedViewer()

const relevantFilters = computed(() => {
  return getRelevantFilters(allFilters.value)
})

// Helper function to get property type icon
const getPropertyTypeIcon = (type: string) => {
  switch (type) {
    case 'string':
      return CaseLower
    case 'number':
      return Hash
    case 'boolean':
      return ToggleLeft
    default:
      return CaseLower
  }
}

// Helper function to get property type
const getPropertyType = (filter: PropertyInfo): string => {
  if (isNumericPropertyInfo(filter)) {
    return 'number'
  }
  // Check if it's a boolean type using the same type guard pattern
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

  if (
    hasValueGroups(filter) &&
    filter.valueGroups.some((vg) => typeof vg.value === 'boolean')
  ) {
    return 'boolean'
  }
  return 'string'
}

// Options for property selection dropdown
const propertySelectOptions = computed(() => {
  const allOptions = relevantFilters.value.map((filter) => ({
    value: filter.key,
    label: getPropertyName(filter.key),
    type: getPropertyType(filter)
  }))

  // Filter based on search input
  if (!propertySearch.value.trim()) {
    return allOptions
  }

  const searchTerm = propertySearch.value.toLowerCase().trim()
  return allOptions.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm) ||
      option.value.toLowerCase().includes(searchTerm) ||
      option.type.toLowerCase().includes(searchTerm)
  )
})

// Options for condition dropdown
const conditionOptions = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' }
]

const speckleTypeFilter = computed(() =>
  relevantFilters.value.find((f: PropertyInfo) => f.key === 'speckle_type')
)
const activeFilter = computed(
  () => propertyFilter.filter.value || speckleTypeFilter.value
)

const mp = useMixpanel()
watch(activeFilter, (newVal) => {
  if (!newVal) return
  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'set-active-filter',
    value: newVal.key
  })
})

const numericActiveFilter = computed(() =>
  isNumericPropertyInfo(activeFilter.value) ? activeFilter.value : undefined
)

const title = computed(() => getPropertyName(activeFilter.value?.key ?? ''))

const colors = computed(() => !!propertyFilter.isApplied.value)

// === NEW MULTI-FILTER LOGIC ===

// Property selection state
const showPropertySelection = ref(false)
const propertySearch = ref('')

const addNewEmptyFilter = () => {
  // Show property selection in panel extension instead of immediately adding filter
  showPropertySelection.value = true

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'open-property-selection'
  })
}

const selectProperty = (propertyKey: string) => {
  // Create the filter with the selected property
  const filterId = `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  activeFilters.value.push({
    id: filterId,
    filter: relevantFilters.value.find((p) => p.key === propertyKey) || null,
    isApplied: false,
    selectedValues: [],
    condition: 'is'
  })

  // Hide property selection
  showPropertySelection.value = false

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'add-new-filter',
    value: propertyKey
  })
}

const setFilterProperty = (filterId: string, propertyKey: string) => {
  const filter = activeFilters.value.find((f) => f.id === filterId)
  const property = relevantFilters.value.find((p) => p.key === propertyKey)

  if (filter && property) {
    filter.filter = property
    filter.selectedValues = [] // Reset selected values when property changes

    mp.track('Viewer Action', {
      type: 'action',
      name: 'filters',
      action: 'set-filter-property',
      value: propertyKey
    })
  }
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
  toggleFilterApplied(filterId)

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'toggle-filter-colors'
  })
}

const handlePropertySelect = (
  filterId: string,
  val: { value: string; label: string } | { value: string; label: string }[] | undefined
) => {
  if (val && !Array.isArray(val)) {
    setFilterProperty(filterId, val.value)
  }
}

const handleConditionSelect = (
  filterId: string,
  val: { value: string; label: string } | { value: string; label: string }[] | undefined
) => {
  if (val && !Array.isArray(val)) {
    updateFilterCondition(
      filterId,
      val.value as 'is' | 'is_not' | 'contains' | 'starts_with' | 'ends_with'
    )
  }
}

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

// Handles a rather complicated ux flow: user sets a numeric filter which only makes sense with colors on. we set the force colors flag in that scenario, so we can revert it if user selects a non-numeric filter afterwards.
let forcedColors = false
const refreshColorsIfSetOrActiveFilterIsNumeric = () => {
  if (!!numericActiveFilter.value && !colors.value) {
    forcedColors = true
    applyPropertyFilter()
    return
  }

  if (!colors.value) return

  if (forcedColors) {
    forcedColors = false
    unApplyPropertyFilter()
    return
  }

  // removePropertyFilter()
  applyPropertyFilter()
}
</script>
