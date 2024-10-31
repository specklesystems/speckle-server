<template>
  <FormSelectBase
    v-bind="props"
    v-model="selectedValue"
    :name="name || 'regions-key'"
    :allow-unset="false"
    mount-menu-on-body
  >
    <template #option="{ item }">
      <div class="flex items-center">
        <span class="truncate">{{ item }}</span>
      </div>
    </template>
    <template #nothing-selected>
      {{ multiple ? 'Select region keys' : 'Select a region key' }}
    </template>
    <template #something-selected="{ value }">
      <template v-if="isArray(value)">
        {{ value.join(', ') }}
      </template>
      <template v-else>
        {{ value }}
      </template>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { isArray } from 'lodash-es'
import type { RuleExpression } from 'vee-validate'
import { useFormSelectChildInternals } from '~/lib/form/composables/select'

type ValueType = string | string[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps<{
  modelValue?: ValueType
  label: string
  items: string[]
  multiple?: boolean
  name?: string
  showOptional?: boolean
  showRequired?: boolean
  showLabel?: boolean
  labelId?: string
  buttonId?: string
  help?: string
  rules?: RuleExpression<string | string[] | undefined>
}>()

const { selectedValue } = useFormSelectChildInternals<string>({
  props: toRefs(props),
  emit
})
</script>
