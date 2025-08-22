<template>
  <div class="pl-8 -mb-0.5">
    <LayoutMenu
      v-model:open="showMenu"
      :items="menuItems"
      show-ticks="right"
      :custom-menu-items-classes="['!w-24 !text-body-2xs']"
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
  </div>
</template>

<script setup lang="ts">
import {
  FilterCondition,
  type FilterData,
  type ConditionOption
} from '~/lib/viewer/helpers/filters/types'
import { LayoutMenu, FormButton, type LayoutMenuItem } from '@speckle/ui-components'

const props = defineProps<{
  filter: FilterData
}>()

const emit = defineEmits(['selectCondition'])

const showMenu = ref(false)

const getConditionLabel = (condition: FilterCondition): string => {
  switch (condition) {
    case FilterCondition.Is:
      return 'is'
    case FilterCondition.IsNot:
      return 'is not'
    default:
      return 'is'
  }
}

const menuItems = computed<LayoutMenuItem[][]>(() => [
  Object.values(FilterCondition).map((condition) => ({
    id: condition,
    title: getConditionLabel(condition),
    active: condition === (props.filter.condition || FilterCondition.Is)
  }))
])

const selectedConditionLabel = computed(() => {
  return getConditionLabel(props.filter.condition || FilterCondition.Is)
})

const onConditionChosen = ({ item }: { item: LayoutMenuItem }) => {
  // Since we control the menu items, we know item.id is a FilterCondition
  const condition = item.id as FilterCondition
  const conditionOption: ConditionOption = {
    value: condition,
    label: getConditionLabel(condition)
  }
  emit('selectCondition', conditionOption)
  showMenu.value = false
}
</script>
