<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="px-1 w-full">
    <div
      class="flex text-body-2xs items-center px-2 py-0.5 w-full hover:bg-highlight-1 rounded cursor-pointer"
      @click="handleSelectAllChange"
    >
      <FormCheckbox
        :name="`select-all-${selectedCount}-${totalCount}`"
        :model-value="areAllValuesSelected"
        :indeterminate="areSomeValuesSelected"
        class="pointer-events-none -mt-1"
        :class="selectAllCheckboxClasses"
        hide-label
      />
      <div class="flex items-center">
        <div class="text-foreground ml-0.5">
          {{ areAllValuesSelected ? 'Deselect all' : 'Select all' }}
        </div>
        <div class="text-foreground-2 text-body-3xs ml-1">
          ({{ selectedCount }} of {{ totalCount }})
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormCheckbox } from '@speckle/ui-components'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { isStringFilter, type FilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
}>()

const { updateActiveFilterValues, selectAllFilterValues } = useFilterUtilities()

const totalCount = computed(() => {
  if (isStringFilter(props.filter) && props.filter.filter) {
    const filter = props.filter.filter
    // Use valueGroups length directly for performance
    if ('valueGroups' in filter && Array.isArray(filter.valueGroups)) {
      return filter.valueGroups.length
    }
  }
  return 0
})

const isDefaultAllSelected = computed(() => {
  return (
    isStringFilter(props.filter) &&
    props.filter.isDefaultAllSelected &&
    props.filter.selectedValues.length === 0
  )
})

const selectedCount = computed(() => {
  if (isStringFilter(props.filter)) {
    // For lazy-loaded filters with isDefaultAllSelected, show all values as selected
    if (isDefaultAllSelected.value) {
      return totalCount.value
    }
    return props.filter.selectedValues.length
  }
  return 0
})

const areAllValuesSelected = computed(() => {
  return totalCount.value > 0 && selectedCount.value === totalCount.value
})

const areSomeValuesSelected = computed(() => {
  return selectedCount.value > 0 && selectedCount.value < totalCount.value
})

const selectAllCheckboxClasses = computed(() => {
  if (isDefaultAllSelected.value) {
    return 'opacity-50 !bg-transparent !border !border-outline-3 dark:!border-outline-5'
  }
  return undefined
})

const handleSelectAllChange = () => {
  if (isStringFilter(props.filter) && props.filter.filter) {
    if (areAllValuesSelected.value) {
      // All are selected → deselect all
      updateActiveFilterValues(props.filter.id, [])
    } else {
      // Not all selected → select all
      selectAllFilterValues(props.filter.id)
    }
  }
}
</script>
