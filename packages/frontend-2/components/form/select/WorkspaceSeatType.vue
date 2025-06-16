<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="Object.values(SeatTypes)"
    :multiple="multiple"
    name="seatTypes"
    class="min-w-[100px]"
    :label="label"
    :label-id="labelId"
    :button-id="buttonId"
    mount-menu-on-body
    :show-label="showLabel"
    :fully-control-value="fullyControlValue"
    :disabled="disabled"
    :clearable="clearable"
    :menu-max-width="250"
    menu-open-direction="left"
    :allow-unset="allowUnset"
  >
    <template #nothing-selected>
      {{ multiple ? 'Seat types' : 'Seat type' }}
    </template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div ref="elementToWatchForChanges" class="flex items-center space-x-0.5">
          <div
            ref="itemContainer"
            class="flex flex-wrap overflow-hidden space-x-0.5 h-6"
          >
            <div v-for="(item, i) in value" :key="item" class="text-foreground">
              {{ upperFirst(item) + (i < value.length - 1 ? ', ' : '') }}
            </div>
          </div>
          <div v-if="hiddenSelectedItemCount > 0" class="text-foreground-2 normal">
            +{{ hiddenSelectedItemCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="truncate text-foreground">
          {{ upperFirst(firstItem(value)) }}
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col space-y-0.5">
        <span class="truncate" :class="{ 'font-medium': !hideDescription }">
          {{ upperFirst(firstItem(item)) }}
        </span>
        <span v-if="!hideDescription" class="text-body-2xs text-foreground-2">
          {{ WorkspaceSeatTypeDescription['any'][firstItem(item)] }}
        </span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import type { WorkspaceSeatType } from '@speckle/shared'
import { SeatTypes } from '@speckle/shared'
import { useFormSelectChildInternals } from '@speckle/ui-components'
import { upperFirst } from 'lodash-es'
import { WorkspaceSeatTypeDescription } from '~/lib/settings/helpers/constants'

type ValueType = WorkspaceSeatType | WorkspaceSeatType[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  multiple: Boolean,
  modelValue: {
    type: [String, Array] as PropType<ValueType>,
    default: undefined
  },
  fullyControlValue: Boolean,
  label: {
    type: String,
    default: 'Seat type'
  },
  disabled: Boolean,
  showLabel: Boolean,
  clearable: Boolean,
  hideDescription: Boolean,
  allowUnset: {
    required: false,
    type: Boolean,
    default: true
  }
})

const labelId = useId()
const buttonId = useId()

const { selectedValue, isMultiItemArrayValue, hiddenSelectedItemCount, firstItem } =
  useFormSelectChildInternals<WorkspaceSeatType>({
    props: toRefs(props),
    emit
  })
</script>
