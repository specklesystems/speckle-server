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
  ConditionOption
} from '~/lib/viewer/helpers/filters/types'
import {
  getConditionsForType,
  getConditionLabel,
  FilterType,
  StringFilterCondition,
  NumericFilterCondition,
  ExistenceFilterCondition
} from '~/lib/viewer/helpers/filters/types'
import { LayoutMenu, FormButton, type LayoutMenuItem } from '@speckle/ui-components'

const props = defineProps<{
  filter: FilterData
}>()

const emit = defineEmits(['selectCondition'])

const showMenu = ref(false)

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
        active: conditionOption.value === props.filter.condition
      })),
      specialConditions.map((conditionOption) => ({
        id: conditionOption.value,
        title: conditionOption.label,
        active: conditionOption.value === props.filter.condition
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
        active: conditionOption.value === props.filter.condition
      })),
      specialConditions.map((conditionOption) => ({
        id: conditionOption.value,
        title: conditionOption.label,
        active: conditionOption.value === props.filter.condition
      }))
    ]
  }
})

const selectedConditionLabel = computed(() => {
  return getConditionLabel(props.filter.condition)
})

const onConditionChosen = ({ item }: { item: LayoutMenuItem; event: MouseEvent }) => {
  // Since we control the menu items, we know item.id is a FilterCondition
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
