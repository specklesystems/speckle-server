<template>
  <div class="text-foreground">
    <div class="w-full text-sm overflow-x-auto overflow-y-visible simple-scrollbar">
      <div
        class="grid z-10 grid-cols-12 items-center gap-6 font-semibold bg-foundation rounded-t-lg w-full border-b border-outline-3 pb-2 pt-4 px-4 min-w-[900px]"
        :style="{ paddingRight: paddingRightStyle }"
      >
        <div
          v-for="column in columns"
          :key="column.id"
          :class="getHeaderClasses(column.id)"
          class="capitalize"
        >
          {{ column.header }}
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
          :class="{ 'cursor-pointer hover:bg-primary-muted': !!onRowClick }"
          tabindex="0"
          @click="handleRowClick(item)"
          @keypress="handleRowClick(item)"
        >
          <template v-for="(column, colIndex) in columns" :key="column.id">
            <div :class="getClasses(column.id, colIndex)" tabindex="0">
              <slot :name="column.id" :item="item">
                <div class="text-gray-900 font-medium order-1">Placeholder</div>
              </slot>
            </div>
          </template>
          <div class="absolute right-1.5 gap-1 flex items-center p-0">
            <div v-for="button in buttons" :key="button.label">
              <FormButton
                :icon-left="button.icon"
                size="sm"
                color="secondary"
                hide-text
                :class="button.class"
                @click.stop="button.action(item)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends {id: string}, C extends string">
import { ConcreteComponent, computed } from 'vue'
import { FormButton } from '~~/src/lib'

export type TableColumn<I> = {
  id: I
  header: string
  classes: string
}

export interface RowButton<T = unknown> {
  icon: ConcreteComponent
  label: string
  action: (item: T) => void
  class: string
}

const props = defineProps<{
  items: T[]
  buttons?: RowButton<T>[]
  columns: TableColumn<C>[]
  overflowCells?: boolean
  onRowClick?: (item: T) => void
}>()

const paddingRightStyle = computed(() => {
  const buttonCount = (props.buttons || []).length
  let padding = 16
  if (buttonCount > 0) {
    padding = 48 + (buttonCount - 1) * 42
  }
  return `${padding}px`
})

const getHeaderClasses = (column: C): string => {
  return props.columns.find((c) => c.id === column)?.classes || ''
}

const getClasses = (column: C, colIndex: number): string => {
  const columnClass = getHeaderClasses(column)

  if (colIndex === 0) {
    return `bg-transparent py-3 pr-5 px-1 ${columnClass}`
  }
  return `lg:p-0 px-1 ${columnClass}`
}

const handleRowClick = (item: T) => {
  if ('id' in item) {
    props.onRowClick?.(item)
  }
}
</script>
