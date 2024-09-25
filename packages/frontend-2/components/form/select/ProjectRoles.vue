<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="Object.values(Roles.Stream)"
    :multiple="multiple"
    :clearable="clearable"
    name="projectRoles"
    label="Project roles"
    class="min-w-[150px]"
    :label-id="labelId"
    :button-id="buttonId"
    :disabled-item-tooltip="disabledItemsTooltip"
    :disabled-item-predicate="disabledItemPredicate"
    :allow-unset="allowUnset"
    :disabled="disabled"
  >
    <template #nothing-selected>
      {{ multiple ? 'Select roles' : 'Select role' }}
    </template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div ref="elementToWatchForChanges" class="flex items-center space-x-0.5">
          <div
            ref="itemContainer"
            class="flex flex-wrap overflow-hidden space-x-0.5 h-6"
          >
            <div v-for="(item, i) in value" :key="item" class="text-foreground">
              {{ roleSelectItems[item].title + (i < value.length - 1 ? ', ' : '') }}
            </div>
          </div>
          <div v-if="hiddenSelectedItemCount > 0" class="text-foreground-2 normal">
            +{{ hiddenSelectedItemCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="truncate text-foreground">
          {{ roleSelectItems[isArrayValue(value) ? value[0] : value].title }}
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex items-center">
        <span class="truncate">{{ roleSelectItems[item].title }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { StreamRoles, Nullable } from '@speckle/shared'
import { useFormSelectChildInternals } from '~~/lib/form/composables/select'
import { roleSelectItems } from '~~/lib/projects/helpers/components'

type ValueType = StreamRoles | StreamRoles[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps<{
  multiple?: boolean
  modelValue?: ValueType
  clearable?: boolean
  disabledItems?: StreamRoles[]
  disabledItemsTooltip?: string
  allowUnset?: boolean
  disabled?: boolean
}>()

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)
const labelId = useId()
const buttonId = useId()

const { selectedValue, isArrayValue, isMultiItemArrayValue, hiddenSelectedItemCount } =
  useFormSelectChildInternals<StreamRoles>({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const disabledItemPredicate = (item: StreamRoles) =>
  props.disabledItems && props.disabledItems.length > 0
    ? props.disabledItems.includes(item)
    : false
</script>
