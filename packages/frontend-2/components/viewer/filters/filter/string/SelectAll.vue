<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="px-1">
    <div
      class="flex text-body-2xs items-center px-2 py-1.5 w-full hover:bg-highlight-1 rounded cursor-pointer"
      @click="handleSelectAllChange"
    >
      <FormCheckbox
        :name="`select-all-${selectedCount}-${totalCount}`"
        :model-value="areAllValuesSelected"
        :indeterminate="areSomeValuesSelected"
        class="mr-2.5 pointer-events-none"
        hide-label
      />
      <span class="text-foreground ml-px">Select all</span>
      <div class="text-foreground-2 text-body-3xs ml-1">
        ({{ selectedCount }} of {{ totalCount }})
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FormCheckbox } from '@speckle/ui-components'

const props = defineProps<{
  selectedCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  selectAll: [selected: boolean]
}>()

const areAllValuesSelected = computed(() => {
  return props.totalCount > 0 && props.selectedCount === props.totalCount
})

const areSomeValuesSelected = computed(() => {
  return props.selectedCount > 0 && props.selectedCount < props.totalCount
})

const handleSelectAllChange = () => {
  // If some are selected (indeterminate state), always select all
  // If all are selected, deselect all
  // If none are selected, select all
  const finalSelection = areSomeValuesSelected.value || !areAllValuesSelected.value

  emit('selectAll', finalSelection)
}
</script>
