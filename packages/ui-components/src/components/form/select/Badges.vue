<template>
  <FormSelectBase
    v-model="selectedValue"
    :multiple="multiple"
    :items="items"
    :label="label"
    :name="name"
    :help="help"
    :rules="rules"
    :by="by"
    :label-id="labelId"
    :button-id="buttonId"
  >
    <template #something-selected="{ value }">
      <ul class="flex flex-wrap gap-1.5">
        <li v-for="item in isArrayValue(value) ? value : [value]" :key="item[by]">
          <CommonBadge
            size="lg"
            color-classes="border border-outline-2 bg-foundation-page"
            dot-icon-color-classes="text-foreground"
            rounded
            :clickable-icon="true"
            :icon-left="XMarkIcon"
            @click-icon.stop="deselectItem(item)"
          >
            {{ item.text }}
          </CommonBadge>
        </li>
      </ul>
    </template>
    <template #option="{ item }">
      {{ item.text }}
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
// Vue components don't support generic props, so having to rely on any
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { toRefs } from 'vue'
import FormSelectBase from '~~/src/components/form/select/Base.vue'
import CommonBadge from '~~/src/components/common/Badge.vue'
import { useFormSelectChildInternals } from '~~/src/composables/form/select'
import { XMarkIcon } from '@heroicons/vue/24/solid'

type SingleItem = any

const emit = defineEmits<{
  (e: 'update:modelValue', val: Array<SingleItem>): void
}>()

const props = defineProps<{
  items: Array<SingleItem>
  label: string
  name: string
  help?: string
  modelValue?: SingleItem | SingleItem[] | undefined
  multiple?: boolean
  rules?: Array<any>
  by: string
  labelId?: string
  buttonId?: string
}>()

const { selectedValue, isArrayValue } = useFormSelectChildInternals<SingleItem>({
  props: toRefs(props),
  emit
})

const deselectItem = (item: SingleItem) => {
  if (isArrayValue(selectedValue.value)) {
    selectedValue.value = selectedValue.value.filter((i) => i.id !== item.id)
  } else {
    selectedValue.value = undefined
  }
}
</script>
