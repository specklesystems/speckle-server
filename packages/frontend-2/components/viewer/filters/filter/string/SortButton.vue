<template>
  <LayoutMenu
    v-model:open="showSortMenu"
    :items="sortMenuItems"
    show-ticks="right"
    :menu-position="HorizontalDirection.Left"
    :custom-menu-items-classes="['!text-body-2xs', '!w-36']"
    @chosen="onSortOptionChosen"
  >
    <FormButton
      size="sm"
      color="subtle"
      hide-text
      :icon-right="ArrowUpDown"
      :class="[
        'text-xs transition-colors hover:text-foreground',
        showSortMenu ? '!bg-highlight-2 !text-foreground' : 'text-foreground-2'
      ]"
      @click="showSortMenu = !showSortMenu"
    />
  </LayoutMenu>
</template>

<script setup lang="ts">
import {
  LayoutMenu,
  FormButton,
  HorizontalDirection,
  type LayoutMenuItem
} from '@speckle/ui-components'
import { ArrowUpDown } from 'lucide-vue-next'
import { SortMode } from '~/lib/viewer/helpers/filters/types'

const modelValue = defineModel<SortMode>()

const showSortMenu = ref(false)

const sortMenuItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      id: SortMode.Alphabetical,
      title: 'A-Z',
      active: modelValue.value === SortMode.Alphabetical
    },
    {
      id: SortMode.SelectedFirst,
      title: 'Selected first',
      active: modelValue.value === SortMode.SelectedFirst
    }
  ]
])

const onSortOptionChosen = ({ item }: { item: LayoutMenuItem; event: MouseEvent }) => {
  modelValue.value = item.id as SortMode
  showSortMenu.value = false
}
</script>
