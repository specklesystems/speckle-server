<template>
  <div class="pl-4 pr-2 py-2 flex items-center justify-between gap-3">
    <FormSelectBase
      name="filter-logic"
      label="Filter Logic"
      button-style="simple"
      size="sm"
      :allow-unset="false"
      class="w-40"
      :model-value="filterLogicOptions.find((opt) => opt.value === modelValue)"
      :items="filterLogicOptions"
      by="value"
      @update:model-value="handleLogicChange"
    >
      <template #something-selected="{ value }">
        <span class="text-foreground font-medium text-body-2xs">
          {{ Array.isArray(value) ? value[0]?.label : value?.label }}
        </span>
      </template>
      <template #option="{ item }">
        <span class="text-foreground text-body-2xs">{{ item.label }}</span>
      </template>
    </FormSelectBase>
  </div>
</template>

<script setup lang="ts">
import { FilterLogic } from '~/lib/viewer/helpers/filters/types'
import { FormSelectBase } from '@speckle/ui-components'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'

defineProps<{
  modelValue: FilterLogic
}>()

const { setFilterLogicAndUpdate } = useFilterUtilities()

const filterLogicOptions = ref([
  { value: FilterLogic.All, label: 'Match all rules' },
  { value: FilterLogic.Any, label: 'Match any rule' }
])

const handleLogicChange = (
  option:
    | { value: FilterLogic; label: string }
    | { value: FilterLogic; label: string }[]
    | undefined
) => {
  if (option && !Array.isArray(option)) {
    setFilterLogicAndUpdate(option.value)
  }
}
</script>
