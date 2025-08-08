<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="seatTypes"
    name="seatType"
    :label="label || 'Seat Type'"
    class="min-w-[110px]"
    :label-id="labelId"
    :button-id="buttonId"
    mount-menu-on-body
    :show-label="showLabel"
    :fully-control-value="fullyControlValue"
    :disabled="disabled"
    :clearable="clearable"
  >
    <template #nothing-selected>Filter by seat</template>
    <template #something-selected="{ value }">
      <div class="truncate text-foreground capitalize">
        {{ value }}
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col space-y-0.5">
        <span class="truncate capitalize">{{ item }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { useFormSelectChildInternals } from '@speckle/ui-components'
import { SeatTypes, type WorkspaceSeatType } from '@speckle/shared'

type ValueType = WorkspaceSeatType | WorkspaceSeatType[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps<{
  modelValue?: ValueType
  fullyControlValue?: boolean
  label?: string
  disabled?: boolean
  showLabel?: boolean
  clearable?: boolean
}>()

const labelId = useId()
const buttonId = useId()

const { selectedValue } = useFormSelectChildInternals<WorkspaceSeatType>({
  props: toRefs(props),
  emit
})

const seatTypes = Object.values(SeatTypes)
</script>
