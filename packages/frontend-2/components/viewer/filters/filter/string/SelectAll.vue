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
        <div class="text-foreground ml-0.5">Select all</div>
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
  searchQuery?: string
}>()

const {
  getFilteredFilterValues,
  isActiveFilterValueSelected,
  updateActiveFilterValues
} = useFilterUtilities()

const filteredValues = computed(() => {
  if (isStringFilter(props.filter) && props.filter.filter) {
    return getFilteredFilterValues(props.filter.filter, {
      searchQuery: props.searchQuery
    })
  }
  return []
})

const selectedCount = computed(() => {
  return filteredValues.value.filter((value) =>
    isActiveFilterValueSelected(props.filter.id, value)
  ).length
})

const totalCount = computed(() => filteredValues.value.length)

const areAllValuesSelected = computed(() => {
  return totalCount.value > 0 && selectedCount.value === totalCount.value
})

const areSomeValuesSelected = computed(() => {
  return selectedCount.value > 0 && selectedCount.value < totalCount.value
})

const selectAllCheckboxClasses = computed(() => {
  if (
    isStringFilter(props.filter) &&
    props.filter.isDefaultAllSelected &&
    areAllValuesSelected.value
  ) {
    return 'opacity-50 dark:!bg-transparent !border dark:!border-outline-5 !group-hover:border-outline-5'
  }
  return undefined
})

const handleSelectAllChange = () => {
  const finalSelection = areSomeValuesSelected.value || !areAllValuesSelected.value

  if (isStringFilter(props.filter) && props.filter.filter) {
    const allAvailableValues = getFilteredFilterValues(props.filter.filter)
    if (finalSelection) {
      updateActiveFilterValues(props.filter.id, allAvailableValues)
    } else {
      updateActiveFilterValues(props.filter.id, [])
    }
  }
}
</script>
