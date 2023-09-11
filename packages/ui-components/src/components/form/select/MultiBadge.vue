<template>
  <FormSelectBase
    v-model="selectedItems"
    :multiple="true"
    :items="props.items"
    :label="props.label"
    :name="props.name"
    :help="props.help"
  >
    <template #something-selected="{ value }">
      <ul class="flex flex-wrap gap-1.5 text-xs">
        <li v-for="item in value" :key="item">
          <CommonBadge
            size="lg"
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
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { ref, watch } from 'vue'
import FormSelectBase from '~~/src/components/form/select/Base.vue'
import { CommonBadge } from '~~/src/lib'
import { XMarkIcon } from '@heroicons/vue/24/solid'

type SingleItem = any

const props = defineProps<{
  items: Array<SingleItem>
  label: string
  name: string
  help?: string
}>()

const selectedItems = ref<Array<SingleItem>>([])

watch(selectedItems, (newVal) => {
  emit('update:modelValue', newVal)
})

const deselectItem = (item: SingleItem) => {
  selectedItems.value = selectedItems.value.filter((i) => i.id !== item.id)
}

const emit = defineEmits<{
  (e: 'update:modelValue', val: Array<SingleItem>): void
}>()
</script>
