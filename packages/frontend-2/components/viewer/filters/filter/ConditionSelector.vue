<template>
  <LayoutMenu
    v-model:open="showMenu"
    :items="menuItems"
    show-ticks="right"
    :custom-menu-items-classes="[
      '!text-body-2xs',
      filter.type === FilterType.Numeric ? '!w-36' : '!w-28'
    ]"
    @chosen="onConditionChosen"
  >
    <FormButton
      class="-ml-2"
      color="subtle"
      size="sm"
      :class="showMenu ? '!bg-highlight-2' : ''"
      @click="showMenu = !showMenu"
    >
      <span class="text-foreground-2 font-medium text-body-2xs">
        {{ selectedConditionLabel }}
      </span>
    </FormButton>
  </LayoutMenu>
</template>

<script setup lang="ts">
import type {
  FilterCondition,
  FilterData,
  ConditionOption,
  NumericFilterData
} from '~/lib/viewer/helpers/filters/types'
import {
  getConditionsForType,
  getConditionLabel,
  FilterType,
  StringFilterCondition,
  NumericFilterCondition,
  ExistenceFilterCondition,
  isNumericFilter
} from '~/lib/viewer/helpers/filters/types'
import { LayoutMenu, FormButton, type LayoutMenuItem } from '@speckle/ui-components'

const props = defineProps<{
  filter: FilterData
}>()

const emit = defineEmits(['selectCondition'])

const showMenu = ref(false)

// Check if a numeric condition should be disabled for problematic ranges
const isConditionDisabled = (condition: FilterCondition): boolean => {
  if (!isNumericFilter(props.filter)) return false

  const numericFilter = props.filter as NumericFilterData
  const hasProblematicRange =
    numericFilter.hasConstantValue || numericFilter.hasNearZeroRange

  // Disable range-based conditions for problematic filters
  if (hasProblematicRange) {
    return (
      condition === NumericFilterCondition.IsBetween ||
      condition === NumericFilterCondition.IsGreaterThan ||
      condition === NumericFilterCondition.IsLessThan ||
      condition === NumericFilterCondition.IsEqualTo ||
      condition === NumericFilterCondition.IsNotEqualTo
    )
  }

  return false
}

// Get disabled reason for tooltips
const getDisabledReason = (condition: FilterCondition): string | undefined => {
  if (!isConditionDisabled(condition)) return undefined

  if (isNumericFilter(props.filter)) {
    const numericFilter = props.filter as NumericFilterData
    return numericFilter.rangeDisabledReason
  }

  return undefined
}

// Get condition options based on filter type
const conditionOptions = computed<ConditionOption[]>(() => {
  const availableConditions = getConditionsForType(props.filter.type)
  return availableConditions.map((condition) => ({
    value: condition,
    label: getConditionLabel(condition)
  }))
})

const menuItems = computed<LayoutMenuItem[][]>(() => {
  if (props.filter.type === FilterType.String) {
    // Group string conditions: basic conditions first, then special conditions
    const basicConditions = conditionOptions.value.filter(
      (option) =>
        option.value === StringFilterCondition.Is ||
        option.value === StringFilterCondition.IsNot
    )
    const specialConditions = conditionOptions.value.filter(
      (option) =>
        option.value === ExistenceFilterCondition.IsSet ||
        option.value === ExistenceFilterCondition.IsNotSet
    )

    return [
      basicConditions.map((conditionOption) => ({
        id: conditionOption.value,
        title: conditionOption.label,
        active: conditionOption.value === props.filter.condition,
        disabled: isConditionDisabled(conditionOption.value),
        disabledTooltip: getDisabledReason(conditionOption.value)
      })),
      specialConditions.map((conditionOption) => ({
        id: conditionOption.value,
        title: conditionOption.label,
        active: conditionOption.value === props.filter.condition,
        disabled: isConditionDisabled(conditionOption.value),
        disabledTooltip: getDisabledReason(conditionOption.value)
      }))
    ]
  } else {
    // Group numeric conditions: basic conditions first, then special conditions
    const basicConditions = conditionOptions.value.filter(
      (option) =>
        option.value === NumericFilterCondition.IsEqualTo ||
        option.value === NumericFilterCondition.IsNotEqualTo ||
        option.value === NumericFilterCondition.IsGreaterThan ||
        option.value === NumericFilterCondition.IsLessThan ||
        option.value === NumericFilterCondition.IsBetween
    )
    const specialConditions = conditionOptions.value.filter(
      (option) =>
        option.value === ExistenceFilterCondition.IsSet ||
        option.value === ExistenceFilterCondition.IsNotSet
    )

    return [
      basicConditions.map((conditionOption) => ({
        id: conditionOption.value,
        title: conditionOption.label,
        active: conditionOption.value === props.filter.condition,
        disabled: isConditionDisabled(conditionOption.value),
        disabledTooltip: getDisabledReason(conditionOption.value)
      })),
      specialConditions.map((conditionOption) => ({
        id: conditionOption.value,
        title: conditionOption.label,
        active: conditionOption.value === props.filter.condition,
        disabled: isConditionDisabled(conditionOption.value),
        disabledTooltip: getDisabledReason(conditionOption.value)
      }))
    ]
  }
})

const selectedConditionLabel = computed(() => {
  return getConditionLabel(props.filter.condition)
})

const onConditionChosen = ({ item }: { item: LayoutMenuItem; event: MouseEvent }) => {
  if (item.disabled) {
    return
  }

  const condition = item.id as FilterCondition
  const conditionOption = conditionOptions.value.find(
    (option) => option.value === condition
  )

  if (conditionOption) {
    emit('selectCondition', conditionOption)
  }
  showMenu.value = false
}
</script>
