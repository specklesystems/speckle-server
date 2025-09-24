<template>
  <LayoutMenu
    v-model:open="showMenu"
    :class="noPadding ? '' : 'pl-9'"
    :items="menuItems"
    mount-menu-on-body
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
        {{ getConditionLabel(props.filter.condition) }}
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
  getConditionLabel
} from '~/lib/viewer/helpers/filters/constants'
import {
  FilterType,
  StringFilterCondition,
  NumericFilterCondition,
  ExistenceFilterCondition,
  ArrayFilterCondition,
  isNumericFilter
} from '~/lib/viewer/helpers/filters/types'
import { LayoutMenu, FormButton, type LayoutMenuItem } from '@speckle/ui-components'

const props = defineProps<{
  filter: FilterData
  noPadding?: boolean
}>()

const emit = defineEmits(['selectCondition'])

const showMenu = ref(false)

const isConditionDisabled = (condition: FilterCondition): boolean => {
  if (!isNumericFilter(props.filter)) return false

  const numericFilter = props.filter as NumericFilterData
  const hasProblematicRange =
    numericFilter.hasConstantValue || numericFilter.hasNearZeroRange

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

const getDisabledReason = (condition: FilterCondition): string | undefined => {
  if (!isConditionDisabled(condition)) return undefined

  if (isNumericFilter(props.filter)) {
    const numericFilter = props.filter as NumericFilterData
    return numericFilter.rangeDisabledReason
  }

  return undefined
}

const conditionOptions = computed<ConditionOption[]>(() => {
  const availableConditions = getConditionsForType(props.filter.type)
  return availableConditions.map((condition) => ({
    value: condition,
    label: getConditionLabel(condition)
  }))
})

const menuItems = computed<LayoutMenuItem[][]>(() => {
  if (props.filter.type === FilterType.String) {
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
  } else if (props.filter.type === FilterType.Array) {
    const contentConditions = conditionOptions.value.filter(
      (option) =>
        option.value === ArrayFilterCondition.Contains ||
        option.value === ArrayFilterCondition.DoesNotContain
    )
    const emptyConditions = conditionOptions.value.filter(
      (option) =>
        option.value === ArrayFilterCondition.IsEmpty ||
        option.value === ArrayFilterCondition.IsNotEmpty
    )
    const specialConditions = conditionOptions.value.filter(
      (option) =>
        option.value === ExistenceFilterCondition.IsSet ||
        option.value === ExistenceFilterCondition.IsNotSet
    )

    return [
      contentConditions.map((conditionOption) => ({
        id: conditionOption.value,
        title: conditionOption.label,
        active: conditionOption.value === props.filter.condition,
        disabled: isConditionDisabled(conditionOption.value),
        disabledTooltip: getDisabledReason(conditionOption.value)
      })),
      emptyConditions.map((conditionOption) => ({
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

const onConditionChosen = ({ item }: { item: LayoutMenuItem }) => {
  if (item.disabled) {
    return
  }

  emit('selectCondition', { value: item.id })
  showMenu.value = false
}
</script>
