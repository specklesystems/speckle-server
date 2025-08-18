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
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center p-6">
          <div class="text-foreground-2 text-body-sm mb-2">No filters applied</div>
          <div class="text-foreground-3 text-body-xs">
            Click the + button above or select a property to add filters
          </div>
        </div>
      </div>
    </div>
  </ViewerLayoutSidePanel>
</template>
<script setup lang="ts">
import type { PropertyInfo } from '@speckle/viewer'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { isNumericPropertyInfo } from '~/lib/viewer/helpers/sceneExplorer'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'
import { X, Plus } from 'lucide-vue-next'
import { FormSelectBase } from '@speckle/ui-components'

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

// Options for property selection dropdown
const propertySelectOptions = computed(() => {
  return relevantFilters.value.map((filter) => ({
    value: filter.key,
    label: getPropertyName(filter.key)
  }))
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

const addNewEmptyFilter = () => {
  // Add a filter without a property selected - user will choose from dropdown
  const filterId = `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  activeFilters.value.push({
    id: filterId,
    filter: null, // No property selected yet
    isApplied: false,
    selectedValues: [],
    condition: 'is'
  })

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'add-new-filter'
  })

  return filterId
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
