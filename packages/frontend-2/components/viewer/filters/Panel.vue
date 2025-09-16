<template>
  <ViewerLayoutSidePanel max-height-class="max-h-[calc(100dvh-5rem)]" disable-scrollbar>
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
          :class="showPropertySelection ? '!bg-highlight-3 !pointer-events-none' : ''"
          hide-text
          :icon-left="showPropertySelection ? X : Plus"
          @click="handleAddFilterClick"
        />
      </div>
    </template>
    <div class="flex items-center justify-between pr-0.5">
      <ViewerFiltersLogicSelector v-if="propertyFilters.length > 0" />

      <div
        v-if="propertyFilters.length > 0"
        class="flex items-center pr-4 text-body-3xs text-foreground-2 select-none"
      >
        <span>
          {{ filteredObjectsCount }} result{{ filteredObjectsCount === 1 ? '' : 's' }}
        </span>
      </div>
    </div>
    <div class="flex flex-col h-full justify-center select-none group/panel">
      <div
        v-if="propertyFilters.length > 0"
        ref="filtersContainerRef"
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

      <ViewerFiltersFilterEmptyState v-else @add-filter="addNewEmptyFilter" />
    </div>

    <Portal v-if="showPropertySelection" to="panel-extension">
      <div ref="propertySelectionRef" class="h-full">
        <ViewerFiltersPropertySelectionPanel
          :options="propertySelectOptions"
          @select-property="selectProperty"
        />
      </div>
    </Portal>

    <ViewerFiltersLargePropertyWarningDialog
      v-model:open="showLargePropertyWarning"
      :count="pendingProperty?.count"
      @confirm="confirmLargePropertySelection"
    />
  </ViewerLayoutSidePanel>
</template>

<script setup lang="ts">
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
import type {
  PropertySelectOption,
  ExtendedPropertyInfo
} from '~/lib/viewer/helpers/filters/types'
import { FilterType } from '~/lib/viewer/helpers/filters/types'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { X, Plus } from 'lucide-vue-next'
import { FormButton } from '@speckle/ui-components'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { onKeyStroke, onClickOutside } from '@vueuse/core'
import { useFilteredObjectsCount } from '~/lib/viewer/composables/filtering/counts'
import type { Nullable } from '@speckle/shared'

const {
  filters: { propertyFilters },
  getPropertyOptionsFromDataStore,
  addActiveFilter,
  updateFilterProperty,
  resetFilters,
  isLargeProperty
} = useFilterUtilities()

const { filteredObjectsCount } = useFilteredObjectsCount()
const mp = useMixpanel()
const {
  filters: { hasAnyFiltersApplied }
} = useInjectedViewerInterfaceState()

const showPropertySelection = ref(false)
const propertySelectionRef = ref<HTMLElement>()
const swappingFilterId = ref<Nullable<string>>(null)
const filtersContainerRef = ref<HTMLElement>()
const shouldScrollToNewFilter = ref(false)

const showLargePropertyWarning = ref(false)
const pendingProperty =
  ref<Nullable<{ property: ExtendedPropertyInfo; count: number }>>(null)

const propertySelectOptions = computed((): PropertySelectOption[] => {
  if (!showPropertySelection.value) {
    return []
  }

  const existingFilterKeys = new Set(
    propertyFilters.value.map((f) => f.filter?.key).filter(Boolean)
  )

  const relevantFilters = getPropertyOptionsFromDataStore()

  const allOptions: PropertySelectOption[] = relevantFilters
    .filter((filter) => !existingFilterKeys.has(filter.key))
    .map((filter) => {
      const lastDotIndex = filter.key.lastIndexOf('.')
      let propertyName =
        lastDotIndex === -1 ? filter.key : filter.key.slice(lastDotIndex + 1)
      let parentPath =
        lastDotIndex === -1
          ? ''
          : filter.key.slice(0, lastDotIndex).replace(/\./g, ' › ')

      // Handle name-value pairs by collapsing them to just the value
      // If the property name ends with '.value', use the parent as the display name
      if (propertyName === 'value' && lastDotIndex !== -1) {
        const valueParentPath = filter.key.slice(0, lastDotIndex)
        const valueParentLastDot = valueParentPath.lastIndexOf('.')
        propertyName =
          valueParentLastDot === -1
            ? valueParentPath
            : valueParentPath.slice(valueParentLastDot + 1)

        parentPath =
          valueParentLastDot === -1
            ? ''
            : valueParentPath.slice(0, valueParentLastDot).replace(/\./g, ' › ')
      }

      return {
        value: filter.key,
        label: propertyName,
        parentPath,
        type:
          filter.type === 'number'
            ? FilterType.Numeric
            : (filter as { type: string }).type === 'boolean'
            ? FilterType.Boolean
            : FilterType.String,
        hasParent: parentPath !== ''
      }
    })

  const sortedOptions = allOptions.sort((a, b) => {
    // First sort by whether they have parents (no-parent items first)
    if (a.hasParent !== b.hasParent) {
      return a.hasParent ? 1 : -1
    }

    // If both have parents, sort by parent path first
    if (a.hasParent && b.hasParent) {
      const parentComparison = a.parentPath.localeCompare(b.parentPath)
      if (parentComparison !== 0) return parentComparison
    }

    // Finally sort by label
    return a.label.localeCompare(b.label)
  })

  return sortedOptions
})

const addNewEmptyFilter = () => {
  swappingFilterId.value = null
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

const scrollToNewFilter = () => {
  if (filtersContainerRef.value) {
    filtersContainerRef.value.scrollTo({
      top: filtersContainerRef.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

const selectProperty = async (propertyKey: string) => {
  const relevantFilters = getPropertyOptionsFromDataStore()
  const property = relevantFilters.find((p) => p.key === propertyKey)

  if (!property) {
    return
  }

  // Check if this property has too many unique values
  const { isLarge, count } = isLargeProperty(property.key)

  if (isLarge) {
    // Store the pending property and show warning
    pendingProperty.value = { property, count }
    showLargePropertyWarning.value = true
    return
  }

  processPropertySelection(property, propertyKey)
}

const processPropertySelection = (
  property: ExtendedPropertyInfo,
  propertyKey: string
) => {
  if (swappingFilterId.value) {
    updateFilterProperty(swappingFilterId.value, property)
    mp.track('Viewer Action', {
      type: 'action',
      name: 'filters',
      action: 'swap-filter-property',
      value: propertyKey
    })
  } else {
    // Set flag to scroll when new filter is added
    shouldScrollToNewFilter.value = true
    addActiveFilter(property)
    mp.track('Viewer Action', {
      type: 'action',
      name: 'filters',
      action: 'add-new-filter',
      value: propertyKey
    })
  }
  showPropertySelection.value = false
  swappingFilterId.value = null
}

const confirmLargePropertySelection = () => {
  if (!pendingProperty.value) return

  processPropertySelection(
    pendingProperty.value.property,
    pendingProperty.value.property.key
  )
  pendingProperty.value = null
}

onKeyStroke('Escape', () => {
  if (showLargePropertyWarning.value) {
    showLargePropertyWarning.value = false
    showPropertySelection.value = false
    swappingFilterId.value = null
    pendingProperty.value = null
  } else if (showPropertySelection.value) {
    showPropertySelection.value = false
  }
})

onClickOutside(propertySelectionRef, () => {
  if (showPropertySelection.value) {
    showPropertySelection.value = false
    swappingFilterId.value = null
  }
})

// Watch for new filters being added and scroll when needed
watch(
  () => propertyFilters.value.length,
  (newLength, oldLength) => {
    if (shouldScrollToNewFilter.value && newLength > oldLength) {
      nextTick(() => {
        scrollToNewFilter()
        shouldScrollToNewFilter.value = false
      })
    }
  }
)
</script>
