<template>
  <FormSelectBase
    v-model="selectValue"
    :items="Object.values(items)"
    label="Project access level"
    button-style="simple"
    :show-label="showLabel"
    :name="name || 'role'"
    :allow-unset="false"
    :disabled="disabled"
    hide-checkmarks
    by="id"
    class="min-w-[85px]"
    mount-menu-on-body
  >
    <template #something-selected="{ value }">
      <div class="text-normal text-right">
        {{ isArray(value) ? value[0].title : value.title }}
      </div>
    </template>
    <template #option="{ item, selected }">
      <div class="flex flex-col">
        <div
          :class="[
            'text-normal',
            selected ? 'text-primary' : '',
            item.id === 'delete' ? 'text-danger' : ''
          ]"
        >
          {{ item.title }}
        </div>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { roleSelectItems } from '~~/lib/projects/helpers/components'
import { Roles } from '@speckle/shared'
import type { StreamRoles } from '@speckle/shared'
import { reduce } from 'lodash-es'
import { isArray } from 'lodash-es'

const emit = defineEmits<{
  (e: 'update:modelValue', v: StreamRoles): void
  (e: 'delete'): void
}>()

const props = defineProps<{
  modelValue: StreamRoles | string
  showLabel?: boolean
  name?: string
  disabled?: boolean
  hideRemove?: boolean
  hideOwner?: boolean
}>()

const items = ref(
  reduce(
    roleSelectItems,
    (results, item) => {
      if (item.id === 'delete') {
        if (!props.hideRemove) {
          results[item.id] = item
        }
      } else if (item.id === Roles.Stream.Owner) {
        if (!props.hideOwner) {
          results[item.id] = item
        }
      } else {
        results[item.id] = item
      }

      return results
    },
    {} as typeof roleSelectItems
  )
)

const selectedValue = computed({
  get: () => props.modelValue as StreamRoles,
  set: (newVal) => emit('update:modelValue', newVal)
})

const selectValue = computed({
  get: () => items.value[selectedValue.value],
  set: (newVal) => {
    if (newVal.id === 'delete') return emit('delete')
    selectedValue.value = newVal.id
  }
})
</script>
