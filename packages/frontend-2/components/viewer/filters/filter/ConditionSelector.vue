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
import { FilterCondition } from '~/lib/viewer/helpers/filters/types'
import { LayoutMenu, FormButton, type LayoutMenuItem } from '@speckle/ui-components'

const props = defineProps<{
  filterId: string
  currentCondition: FilterCondition
}>()

const emit = defineEmits(['selectCondition'])

const showMenu = ref(false)

const conditionOptions = [
  { value: FilterCondition.Is, label: 'is' },
  { value: FilterCondition.IsNot, label: 'is not' }
]

const menuItems = computed<LayoutMenuItem[][]>(() => [
  conditionOptions.map((option) => ({
    id: option.value,
    title: option.label,
    active: option.value === (props.currentCondition || FilterCondition.Is)
  }))
])

const selectedConditionLabel = computed(() => {
  const selectedOption = conditionOptions.find(
    (opt) => opt.value === (props.currentCondition || FilterCondition.Is)
  )
  return selectedOption?.label || 'is'
})

const onConditionChosen = ({ item }: { item: LayoutMenuItem }) => {
  const selectedOption = conditionOptions.find((opt) => opt.value === item.id)
  if (selectedOption) {
    emit('selectCondition', selectedOption)
  }
  showMenu.value = false
}
</script>
