<template>
  <FormSelectBase
    v-model="selectValue"
    :items="Object.values(items)"
    label="Project access level"
    button-style="simple"
    name="access-control"
    :allow-unset="false"
    :label-id="labelId"
    :button-id="buttonId"
    :disabled-item-predicate="disabledItemPredicate"
    disabled-item-tooltip="This feature will be available soon"
    by="id"
    class="w-28 sm:w-60"
    size="sm"
  >
    <template #something-selected="{ value }">
      <div class="text-right text-foreground text-body-2xs">
        {{ isArray(value) ? value[0].title : value.title }}
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col space-y-0.5">
        <span class="truncate font-medium">
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
// This component is not functional, and only used to inform the user of the coming soon feature
import {
  accessSelectItems,
  AccessSelectItems,
  type SelectableAccessSelectItem
} from '~~/lib/projects/helpers/components'
import { isArray } from 'lodash-es'

const emit = defineEmits<{
  (e: 'update:modelValue', v: AccessSelectItems): void
}>()

const props = defineProps<{
  modelValue: AccessSelectItems
}>()

const labelId = useId()
const buttonId = useId()
const items = ref(accessSelectItems)

const selectedValue = computed({
  get: () => props.modelValue as AccessSelectItems,
  set: (newVal) => emit('update:modelValue', newVal)
})

const selectValue = computed({
  get: () => items.value[selectedValue.value],
  set: (newVal) => {
    selectedValue.value = newVal.id
  }
})

const disabledItemPredicate = (item: SelectableAccessSelectItem) => {
  return item.id === AccessSelectItems.NoAccess
}
</script>
