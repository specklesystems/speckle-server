<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="flex items-center justify-between"
    :class="{ 'cursor-pointer': collapsed }"
    @click="toggleCollapsed"
  >
    <div class="flex items-center pl-0" :class="{ 'opacity-50': !filter.isApplied }">
      <FormButton color="subtle" class="m-0 gap-3" size="sm">
        <Hash
          v-if="filter.type === FilterType.Numeric"
          class="h-3 w-3 stroke-emerald-700 dark:stroke-emerald-500"
        />
        <CaseUpper v-else class="h-3 w-3 stroke-violet-600 dark:stroke-violet-500" />

        {{ getPropertyName(filter.filter?.key) }}
      </FormButton>
    </div>
    <div class="flex items-start gap-0.5">
      <FormButton
        v-tippy="'Show/hide details'"
        color="subtle"
        size="sm"
        hide-text
        class="opacity-0 group-hover:opacity-100 text-foreground-3"
        :icon-right="ChevronsUpDown"
        :is-expanded="!collapsed"
        @click.stop="collapsed = !collapsed"
      />
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
      <!-- <FormButton
        v-tippy="'Toggle coloring for this property'"
        color="subtle"
        size="sm"
        hide-text
        :icon-right="ChevronsUpDown"
        :is-expanded="!collapsed"
        @click.stop="collapsed = !collapsed"
      /> -->
      <FormButton
        v-tippy="'Toggle coloring for this property'"
        :color="isColoringActive ? 'primary' : 'subtle'"
        size="sm"
        hide-text
        :icon-right="PaintBucket"
        @click.stop="toggleColors"
      />
    </div>
    <!-- <ViewerExpansionTriangle
        :is-expanded="!collapsed"
        class="h-6"
        @click="collapsed = !collapsed"
      /> -->
  </div>
</template>

<script setup lang="ts">
import { PaintBucket, Hash, CaseUpper, ChevronsUpDown, Ellipsis } from 'lucide-vue-next'
import {
  FormButton,
  LayoutMenu,
  HorizontalDirection,
  type LayoutMenuItem
} from '@speckle/ui-components'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import type { FilterData } from '~/lib/viewer/helpers/filters/types'
import { FilterType } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
}>()

const collapsed = defineModel<boolean>('collapsed', { required: true })
const showActionsMenu = ref(false)
const menuId = useId()

const {
  removeActiveFilter,
  toggleColorFilter,
  toggleFilterApplied,
  getPropertyName,
  filters
} = useFilterUtilities()

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
      title: 'Remove filter...',
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
