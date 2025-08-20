<template>
  <div class="px-3 pt-3">
    <FormSelectBase
      name="filter-logic"
      label="Filter Logic"
      button-style="simple"
      size="sm"
      class="w-40"
      :model-value="filterLogicOptions.find((opt) => opt.value === modelValue)"
      :items="filterLogicOptions"
      by="value"
      @update:model-value="$emit('update:modelValue', $event)"
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

defineProps<{
  modelValue: FilterLogic
}>()

defineEmits(['update:modelValue'])

const filterLogicOptions = ref([
  { value: FilterLogic.All, label: 'Match all rules' },
  { value: FilterLogic.Any, label: 'Match any rule' }
])
</script>
