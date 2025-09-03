<template>
  <div class="p-2 flex items-center justify-between gap-3">
    <LayoutMenu
      v-model:open="showMenu"
      :items="menuItems"
      show-ticks="right"
      :custom-menu-items-classes="['!text-body-2xs', '!w-40']"
      @chosen="onLogicChosen"
    >
      <FormButton
        color="subtle"
        size="sm"
        :class="showMenu ? '!bg-highlight-2' : ''"
        :icon-right="ChevronDown"
        role="button"
        tabindex="0"
        @click="showMenu = !showMenu"
        @keydown.enter="showMenu = !showMenu"
        @keydown.space.prevent="showMenu = !showMenu"
      >
        <span class="text-foreground font-medium text-body-2xs">
          {{ selectedLogicLabel }}
        </span>
      </FormButton>
    </LayoutMenu>
  </div>
</template>

<script setup lang="ts">
import { FilterLogic } from '~/lib/viewer/helpers/filters/types'
import { LayoutMenu, FormButton, type LayoutMenuItem } from '@speckle/ui-components'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: FilterLogic
}>()
const emit = defineEmits<{
  'update:modelValue': [value: FilterLogic]
}>()

const { setFilterLogic } = useFilterUtilities()

const showMenu = ref(false)

const filterLogicOptions = ref([
  { value: FilterLogic.All, label: 'Match all rules' },
  { value: FilterLogic.Any, label: 'Match any rule' }
])

const menuItems = computed<LayoutMenuItem[][]>(() => [
  filterLogicOptions.value.map((option) => ({
    id: option.value,
    title: option.label,
    active: option.value === props.modelValue
  }))
])

const selectedLogicLabel = computed(() => {
  return (
    filterLogicOptions.value.find((opt) => opt.value === props.modelValue)?.label || ''
  )
})

const onLogicChosen = ({ item }: { item: LayoutMenuItem; event: MouseEvent }) => {
  const logic = item.id as FilterLogic
  setFilterLogic(logic)
  emit('update:modelValue', logic)
  showMenu.value = false
}
</script>
