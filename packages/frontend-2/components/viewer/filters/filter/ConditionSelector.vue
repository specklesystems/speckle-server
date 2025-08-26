<template>
  <LayoutMenu
    v-model:open="showMenu"
    :items="menuItems"
    show-ticks="right"
    :custom-menu-items-classes="[
      '!text-body-2xs',
      filter.type === FilterType.Numeric ? '!w-36' : '!w-24'
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
  FilterType
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

const menuItems = computed<LayoutMenuItem[][]>(() => [
  conditionOptions.value.map((conditionOption) => ({
    id: conditionOption.value,
    title: conditionOption.label,
    active: conditionOption.value === props.filter.condition
  }))
])

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
