<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="px-1 w-full">
    <div
      class="flex text-body-2xs items-center px-2 py-0.5 w-full hover:bg-highlight-1 rounded"
      :class="
        disabled
          ? 'opacity-50 cursor-not-allowed pointer-events-none'
          : 'cursor-pointer'
      "
      @click="disabled ? undefined : handleSelectAllChange()"
    >
      <FormCheckbox
        :name="`select-all-${selectedCount}-${totalCount}`"
        :model-value="areAllValuesSelected"
        :indeterminate="areSomeValuesSelected"
        class="pointer-events-none"
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
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import type { StringFilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: StringFilterData
  disabled?: boolean
}>()

const { updateActiveFilterValues, selectAllFilterValues } = useFilterUtilities()

const totalCount = computed(() => {
  const filter = props.filter.filter
  if ('valueGroups' in filter && Array.isArray(filter.valueGroups)) {
    return filter.valueGroups.length
  }
  return 0
})

const isDefaultAllSelected = computed(() => {
  return props.filter.isDefaultAllSelected && props.filter.selectedValues.length === 0
})

const selectedCount = computed(() => {
  if (isDefaultAllSelected.value) {
    return totalCount.value
  }
  return props.filter.selectedValues.length
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
  if (areAllValuesSelected.value) {
    updateActiveFilterValues(props.filter.id, [])
  } else {
    selectAllFilterValues(props.filter.id)
  }
}
</script>
