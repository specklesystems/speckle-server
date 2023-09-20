<template>
  <div class="text-foreground">
    <div class="w-full text-sm overflow-x-auto overflow-y-visible simple-scrollbar">
      <div
        class="grid z-10 grid-cols-12 items-center gap-6 font-semibold bg-foundation rounded-t-lg w-full border-b border-outline-3 pb-2 pt-4 px-4 min-w-[900px]"
        :style="{ paddingRight: paddingRightStyle }"
      >
        <div
          v-for="header in headers"
          :key="header.id"
          :class="columnClasses[header.id]"
          class="capitalize"
        >
          {{ header.title }}
        </div>
      </div>
      <div
        class="divide-y divide-outline-3 h-full overflow-visible"
        :class="{ 'pb-32': overflowCells }"
      >
        <div
          v-for="item in items"
          :key="item.id"
          class="relative grid grid-cols-12 items-center gap-6 px-4 py-1 min-w-[900px] bg-foundation"
          :style="{ paddingRight: paddingRightStyle }"
          :class="{ 'cursor-pointer hover:bg-primary-muted': !!props.onRowClick }"
          tabindex="0"
          @click="handleRowClick(item)"
          @keypress="keyboardClick(() => handleRowClick(item))"
        >
          <template v-for="(column, colIndex) in headers" :key="column.id">
            <div :class="getClasses(column.id, colIndex)" tabindex="0">
              <slot :name="column.id" :item="item">
                <div class="text-gray-900 font-medium order-1">
                  {{ (item as any)[column.id] }}
                </div>
              </slot>
            </div>
          </template>
          <div class="absolute right-0 flex items-center p-0 pr-0.5">
            <div v-for="button in buttons" :key="button.label" class="p-1">
              <FormButton
                :icon-left="button.icon"
                size="sm"
                color="secondary"
                hide-text
                class="text-red-500"
                @click.stop="button.action(item)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ConcreteComponent, computed } from 'vue'
import {
  ItemType,
  UserItem,
  ProjectItem,
  InviteItem
} from '~~/lib/server-management/helpers/types'
import { keyboardClick } from '~~/lib/common/helpers/accessibility'

type OnRowClickType = (item: ItemType) => void

interface RowButton {
  icon: ConcreteComponent
  label: string
  action: (item: ItemType) => void
}

interface Header {
  id: string
  title: string
}

const props = defineProps<{
  headers: Header[]
  items: Array<UserItem | ProjectItem | InviteItem>
  buttons?: RowButton[]
  columnClasses: Record<string, string>
  overflowCells?: boolean
  onRowClick?: OnRowClickType
}>()

const paddingRightStyle = computed(() => {
  const padding = 52 + ((props.buttons?.length || 0) - 1) * 25
  return `${padding}px`
})

const getClasses = (column: string, colIndex: number): string => {
  const columnClass = props.columnClasses[column]

  if (colIndex === 0) {
    return `bg-transparent py-3 pr-5 px-1 ${columnClass}`
  }
  return `lg:p-0 px-1 ${columnClass}`
}

const handleRowClick = (item: ItemType) => {
  props.onRowClick?.(item)
}
</script>
