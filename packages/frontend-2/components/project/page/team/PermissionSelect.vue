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
    :label-id="labelId"
    :button-id="buttonId"
    :disabled-item-predicate="disabledItemPredicate"
    :disabled-item-tooltip="disabledItemTooltip"
    by="id"
    class="min-w-60"
    mount-menu-on-body
    size="sm"
  >
    <template #something-selected="{ value }">
      <div class="text-right text-foreground text-body-xs font-medium">
        {{ isArray(value) ? value[0].title : value.title }}
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col space-y-0.5">
        <span
          class="truncate font-medium"
          :class="item.id === 'delete' ? '!text-danger' : ''"
        >
          {{ item.title }}
        </span>
        <span v-if="item.description" class="text-body-2xs text-foreground-2">
          {{ item.description }}
        </span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import {
  roleSelectItems,
  type SelectableStreamRoleSelectItem
} from '~~/lib/projects/helpers/components'
import { Roles } from '@speckle/shared'
import type { StreamRoles } from '@speckle/shared'
import { reduce, isArray } from 'lodash-es'

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
  disabledRoles?: StreamRoles[]
  disabledItemTooltip?: string
}>()

const labelId = useId()
const buttonId = useId()
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

const disabledItemPredicate = (item: SelectableStreamRoleSelectItem) => {
  if (!props.disabledRoles?.length) return false
  return (props.disabledRoles as string[]).includes(item.id)
}
</script>
