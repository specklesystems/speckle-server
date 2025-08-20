<template>
  <div class="pl-7 py-2">
    <FormSelectBase
      v-model="selectedCondition"
      :name="`condition-${filterId}`"
      label="Condition"
      button-style="simple"
      :items="conditionOptions"
      by="value"
    >
      <template #something-selected="{ value }">
        <span class="text-foreground-2 font-medium text-body-2xs">
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
import { FilterCondition } from '~/lib/viewer/helpers/filters/types'
import { FormSelectBase } from '@speckle/ui-components'

const props = defineProps<{
  filterId: string
  currentCondition: FilterCondition
}>()

const emit = defineEmits(['selectCondition'])

const selectedCondition = computed({
  get: () =>
    conditionOptions.find(
      (opt) => opt.value === (props.currentCondition || FilterCondition.Is)
    ),
  set: (newVal) => {
    if (newVal && !Array.isArray(newVal)) {
      emit('selectCondition', newVal)
    }
  }
})

const conditionOptions = [
  { value: FilterCondition.Is, label: 'is' },
  { value: FilterCondition.IsNot, label: 'is not' }
]
</script>
