<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="domains"
    name="workspaceDomains"
    label="Verified domains"
    class="min-w-[110px]"
    size="sm"
  >
    <template #nothing-selected>Select domain</template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div v-for="v in value" :key="v">@{{ v }}</div>
      </template>
      <template v-else>@{{ value }}</template>
    </template>
    <template #option="{ item }">
      <div class="flex items-center">@{{ item }}</div>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { useFormSelectChildInternals } from '@speckle/ui-components'

type ItemType = string
type ValueType = ItemType | ItemType[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps<{
  domains: ItemType[]
  modelValue: ValueType
}>()

const { selectedValue, isMultiItemArrayValue } = useFormSelectChildInternals<ItemType>({
  props: toRefs(props),
  emit
})
</script>
