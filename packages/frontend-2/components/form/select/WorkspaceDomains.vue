<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="props.domains"
    name="workspaceDomains"
    label="Verified Domains"
    class="min-w-[110px]"
    size="sm"
  >
    <template #nothing-selected>Select domain</template>
    <template #something-selected="{ value }">
      {{ value }}
    </template>
    <template #option="{ item }">
      <div class="flex items-center">
        {{ item }}
      </div>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { useFormSelectChildInternals } from '@speckle/ui-components'

type ValueType = string | string[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps<{
  domains: string[]
  modelValue: ValueType
}>()

const { selectedValue } = useFormSelectChildInternals<string>({
  props: toRefs(props),
  emit
})
</script>
