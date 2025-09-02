<template>
  <ViewerLayoutSidePanel disable-scrollbar>
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
    <ViewerFiltersLogicSelector
      v-if="propertyFilters.length > 0"
      v-model="filterLogic"
    />

    <div class="h-full flex flex-col select-none group/panel">
      <!-- Active Filters Section -->
      <div
        v-if="propertyFilters.length > 0"
        class="flex-1 overflow-y-auto simple-scrollbar"
      >
        <div class="flex flex-col gap-1 p-2 py-0">
          <ViewerFiltersFilterCard
            v-for="filter in propertyFilters"
            :key="filter.id"
            :filter="filter"
            collapsed
            @swap-property="startPropertySwap"
          />
        </div>
        <div class="px-2 pb-6 mt-1 h-14">
          <div class="hidden group-hover/panel:block">
            <FormButton
              v-if="propertyFilters.length > 0"
              full-width
              color="outline"
              class="rounded-xl text-foreground-2 hover:text-foreground !shadow-none"
              :icon-left="Plus"
              hide-text
              @click="addNewEmptyFilter"
            >
              Add filter
            </FormButton>
          </div>
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
import {
  useInjectedViewerInterfaceState,
  useInjectedViewer
} from '~~/lib/viewer/composables/setup'
import type {
  PropertySelectOption,
  FilterLogic
} from '~/lib/viewer/helpers/filters/types'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { X, Plus } from 'lucide-vue-next'
import { FormButton } from '@speckle/ui-components'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'

const {
  filters: { propertyFilters },
  getRelevantFilters,
  addActiveFilter,
  updateFilterProperty,
  resetFilters,
  currentFilterLogic,
  setFilterLogic
} = useFilterUtilities()

const {
  metadata: { availableFilters: allFilters }
} = useInjectedViewer()

const {
  filters: { hasAnyFiltersApplied }
} = useInjectedViewerInterfaceState()

const relevantFilters = computed(() => {
  return getRelevantFilters(allFilters.value)
})

const propertySelectOptions = computed((): PropertySelectOption[] => {
  // Get keys of already added filters
  const existingFilterKeys = new Set(
    propertyFilters.value.map((f) => f.filter?.key).filter(Boolean)
  )

  const allOptions: PropertySelectOption[] = relevantFilters.value
    .filter((filter) => !existingFilterKeys.has(filter.key)) // Exclude already added filters
    .map((filter) => {
      const pathParts = filter.key.split('.')
      const propertyName = pathParts[pathParts.length - 1] // Last part (e.g., "name")
      const parentPath = pathParts.slice(0, -1).join('.') // Everything except last part (e.g., "ab")

      return {
        value: filter.key,
        label: propertyName, // Clean property name for main display
        parentPath, // Full path without the property name
        type: filter.type,
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

const filterLogic = computed({
  get: () => currentFilterLogic.value,
  set: (value: FilterLogic) => setFilterLogic(value)
})

const mp = useMixpanel()

const showPropertySelection = ref(false)
const propertySelectionRef = ref<HTMLElement>()
const swappingFilterId = ref<string | null>(null)

const addNewEmptyFilter = () => {
  swappingFilterId.value = null // Ensure we're adding, not swapping
  showPropertySelection.value = true

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'open-property-selection'
  })
}

const startPropertySwap = (filterId: string) => {
  swappingFilterId.value = filterId
  showPropertySelection.value = true

  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'open-property-swap'
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
    if (swappingFilterId.value) {
      // Swap property for existing filter
      updateFilterProperty(swappingFilterId.value, property)
      mp.track('Viewer Action', {
        type: 'action',
        name: 'filters',
        action: 'swap-filter-property',
        value: propertyKey
      })
    } else {
      // Add new filter
      addActiveFilter(property)
      mp.track('Viewer Action', {
        type: 'action',
        name: 'filters',
        action: 'add-new-filter',
        value: propertyKey
      })
    }
  }

  // Reset state
  showPropertySelection.value = false
  swappingFilterId.value = null
}
</script>
