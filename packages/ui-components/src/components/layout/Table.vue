<template>
  <div class="text-foreground">
    <div class="w-full text-sm overflow-x-auto overflow-y-visible simple-scrollbar">
      <div
        v-if="items.length > 0"
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
          :style="{ paddingRight: paddingRightStyle }"
          :class="rowsWrapperClasses"
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
          <div class="absolute right-1.5 gap-1 flex items-center p-0 h-full">
            <div v-for="button in buttons" :key="button.label">
              <FormButton
                :icon-left="button.icon"
                size="sm"
                color="secondary"
                hide-text
                :class="button.class"
                :text-color="button.textColor"
                :to="isString(button.action) ? button.action : undefined"
                @click.stop="!isString(button.action) ? button.action(item) : noop"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string }, C extends string">
import { noop, isString } from 'lodash'
import { computed } from 'vue'
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import type { FormButtonTextColor } from '~~/src/helpers/form/button'
import { FormButton } from '~~/src/lib'

export type TableColumn<I> = {
  id: I
  header: string
  classes: string
}

export interface RowButton<T = unknown> {
  icon: PropAnyComponent
  label: string
  action: (item: T) => void | string
  class?: string
  textColor?: FormButtonTextColor
}

const props = withDefaults(
  defineProps<{
    items: T[]
    buttons?: RowButton<T>[]
    columns: TableColumn<C>[]
    overflowCells?: boolean
    onRowClick?: (item: T) => void
    rowItemsAlign?: 'center' | 'stretch'
  }>(),
  { rowItemsAlign: 'center' }
)

const paddingRightStyle = computed(() => {
  const buttonCount = (props.buttons || []).length
  let padding = 16
  if (buttonCount > 0) {
    padding = 48 + (buttonCount - 1) * 42
  }
  return `${padding}px`
})

const rowsWrapperClasses = computed(() => {
  const classParts = [
    'relative grid grid-cols-12 items-center gap-6 px-4 py-1 min-w-[900px] bg-foundation'
  ]

  if (props.onRowClick) {
    classParts.push('cursor-pointer hover:bg-primary-muted')
  }

  switch (props.rowItemsAlign) {
    case 'center':
      classParts.push('items-center')
      break
    case 'stretch':
      classParts.push('items-stretch')
      break
  }

  return classParts.join(' ')
})

const getHeaderClasses = (column: C): string => {
  return props.columns.find((c) => c.id === column)?.classes || ''
}

const getClasses = (column: C, colIndex: number): string => {
  const columnClass = getHeaderClasses(column)

  if (colIndex === 0) {
    return `bg-transparent py-3 pr-5 px-1 ${columnClass}`
  }
  return `lg:p-0 px-1 my-2 ${columnClass}`
}

const handleRowClick = (item: T) => {
  props.onRowClick?.(item)
}
</script>
