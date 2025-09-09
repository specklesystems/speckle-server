<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="flex items-center justify-between"
    :class="{ 'cursor-pointer': collapsed }"
    @click="toggleCollapsed"
  >
    <div
      class="flex items-center pl-0 min-w-0 flex-1"
      :class="{ 'opacity-50': !filter.isApplied }"
    >
      <FormButton
        v-tippy="'Change filter property'"
        color="subtle"
        class="m-0 gap-3 min-w-0"
        size="sm"
        @click.stop="handlePropertySwap"
      >
        <Hash
          v-if="filter.type === FilterType.Numeric"
          class="h-3 w-3 stroke-emerald-700 dark:stroke-emerald-500 shrink-0"
        />
        <CaseUpper
          v-else
          class="h-3 w-3 stroke-violet-600 dark:stroke-violet-500 shrink-0"
        />

        <span class="truncate">{{ getPropertyName(filter.filter?.key) }}</span>
      </FormButton>
    </div>
    <div class="flex items-start gap-0.5 shrink-0">
      <LayoutMenu
        v-model:open="showActionsMenu"
        :items="actionsItems"
        :menu-id="menuId"
        class="h-6 w-6"
        :menu-position="HorizontalDirection.Left"
        @click.stop.prevent
        @chosen="onActionChosen"
      >
        <FormButton
          color="subtle"
          hide-text
          size="sm"
          :icon-right="Ellipsis"
          class="!text-foreground"
          :class="showActionsMenu ? '!bg-highlight-2' : ''"
          @click="showActionsMenu = !showActionsMenu"
        ></FormButton>
      </LayoutMenu>
      <FormButton
        v-tippy="collapsed ? 'Show details' : 'Hide details'"
        color="subtle"
        size="sm"
        hide-text
        :icon-right="collapsed ? ChevronsUpDown : ChevronsDownUp"
        :is-expanded="!collapsed"
        @click.stop="collapsed = !collapsed"
      />
      <FormButton
        v-tippy="'Toggle coloring for this property'"
        :color="isColoringActive ? 'primary' : 'subtle'"
        size="sm"
        hide-text
        :icon-right="PaintBucket"
        @click.stop="toggleColors"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PaintBucket,
  Hash,
  CaseUpper,
  ChevronsUpDown,
  Ellipsis,
  ChevronsDownUp
} from 'lucide-vue-next'
import {
  FormButton,
  LayoutMenu,
  HorizontalDirection,
  type LayoutMenuItem
} from '@speckle/ui-components'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { useFilterColoringUtilities } from '~/lib/viewer/composables/filtering/coloring'
import type { FilterData } from '~/lib/viewer/helpers/filters/types'
import { FilterType } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
}>()

const collapsed = defineModel<boolean>('collapsed', { required: true })
const showActionsMenu = ref(false)
const menuId = useId()

const { removeActiveFilter, toggleFilterApplied, getPropertyName, filters } =
  useFilterUtilities()

const { toggleColorFilter } = useFilterColoringUtilities()

const emit = defineEmits<{
  swapProperty: [filterId: string]
}>()

const isColoringActive = computed(() => {
  return filters.activeColorFilterId.value === props.filter.id
})

const removeFilter = () => {
  removeActiveFilter(props.filter.id)
}

const toggleVisibility = () => {
  toggleFilterApplied(props.filter.id)
}

const toggleColors = () => {
  toggleColorFilter(props.filter.id)
}

const handlePropertySwap = () => {
  emit('swapProperty', props.filter.id)
}

const toggleCollapsed = () => {
  if (collapsed.value) {
    collapsed.value = false
  }
}

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: props.filter.isApplied ? 'Disable filter' : 'Enable filter',
      id: 'toggle-visibility'
    }
  ],
  [
    {
      title: 'Remove filter',
      id: 'remove-filter'
    }
  ]
])

const onActionChosen = (params: { item: LayoutMenuItem }) => {
  const { item } = params

  switch (item.id) {
    case 'toggle-visibility':
      toggleVisibility()
      break
    case 'remove-filter':
      removeFilter()
      break
  }
}
</script>
