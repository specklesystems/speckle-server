<template>
  <div class="px-3 pt-3 pb-2 border-b border-outline-2">
    <FormSelectBase
      name="filter-logic"
      label="Filter Logic"
      :model-value="filterLogicOptions.find((opt) => opt.value === modelValue)"
      :items="filterLogicOptions"
      by="value"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #something-selected="{ value }">
        <span class="text-foreground">
          {{ Array.isArray(value) ? value[0]?.label : value?.label }}
        </span>
      </template>
      <template #option="{ item }">
        <span class="text-foreground">{{ item.label }}</span>
      </template>
    </FormSelectBase>
  </div>
</template>

<script setup lang="ts">
import { FilterLogic } from '~/lib/viewer/helpers/filters/types'
import { FormSelectBase } from '@speckle/ui-components'

defineProps<{
  modelValue: FilterLogic
}>()

defineEmits(['update:modelValue'])

const filterLogicOptions = ref([
  { value: FilterLogic.All, label: 'Match all rules' },
  { value: FilterLogic.Any, label: 'Match any rule' }
])
</script>
