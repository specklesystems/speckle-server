<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="px-1">
    <div
      class="flex text-body-2xs items-center p-2 w-full hover:bg-highlight-1 rounded cursor-pointer"
      @click="handleSelectAllChange"
    >
      <div
        class="h-3.5 w-3.5 rounded border cursor-pointer flex items-center justify-center mr-2.5"
        :class="[
          areAllValuesSelected || areSomeValuesSelected
            ? 'border-outline-5 hover:border-foreground-2 text-foreground'
            : 'bg-foundation border-highlight-3 hover:border-foreground-2'
        ]"
      >
        <Minus v-if="areAllValuesSelected" class="h-3 w-3" />
        <Check v-else-if="areSomeValuesSelected" class="h-3 w-3" />
      </div>
      <span class="text-foreground ml-px">Select all</span>
      <div class="text-foreground-2 text-body-3xs ml-1">
        ({{ selectedCount }} of {{ totalCount }} selected)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, Minus } from 'lucide-vue-next'

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
