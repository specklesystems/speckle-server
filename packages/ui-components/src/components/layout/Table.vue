<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="text-foreground">
    <div
      class="w-full text-sm overflow-x-auto overflow-y-visible simple-scrollbar border border-outline-3 rounded-lg"
    >
      <div :class="headerRowClasses" :style="{ paddingRight: paddingRightStyle }">
        <div
          v-for="(column, colIndex) in columns"
          :key="column.id"
          :class="getHeaderClasses(column.id, colIndex)"
        >
          {{ column.header }}
        </div>
      </div>
      <div
        class="divide-y divide-outline-3 h-full overflow-visible"
        :class="{ 'pb-32': overflowCells }"
      >
        <div
          v-if="loading || !items"
          class="flex items-center justify-center py-3"
          tabindex="0"
        >
          <CommonLoadingIcon />
        </div>
        <template v-else-if="items?.length">
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
            <div
              v-if="buttons"
              class="absolute right-1.5 space-x-1 flex items-center p-0 h-full"
            >
              <div v-for="button in buttons" :key="button.label">
                <FormButton
                  v-tippy="button.tooltip"
                  :icon-left="button.icon"
                  size="sm"
                  color="outline"
                  hide-text
                  :class="button.class"
                  :to="isString(button.action) ? button.action : undefined"
                  @click.stop="!isString(button.action) ? button.action(item) : noop"
                />
              </div>
            </div>
          </div>
        </template>
        <div
          v-else
          tabindex="0"
          :style="{ paddingRight: paddingRightStyle }"
          :class="rowsWrapperClasses"
        >
          <div :class="getClasses(undefined, 0)" tabindex="0">
            <slot name="empty">
              <div class="w-full text-center label-light text-foreground-2 italic">
                {{ emptyMessage }}
              </div>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts" generic="T extends {id: string}, C extends string">
import { noop, isString } from 'lodash'
import { computed } from 'vue'
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import { CommonLoadingIcon, FormButton } from '~~/src/lib'
import { directive as vTippy } from 'vue-tippy'

export type TableColumn<I> = {
  id: I
  header: string
  classes: string
}

export type RowButton<T = unknown> = {
  icon: PropAnyComponent
  label: string
  action: (item: T) => unknown
  class?: string
  tooltip?: string
}

const props = withDefaults(
  defineProps<{
    items: T[] | undefined | null
    buttons?: RowButton<T>[]
    columns: TableColumn<C>[]
    overflowCells?: boolean
    onRowClick?: (item: T) => void
    rowItemsAlign?: 'center' | 'stretch'
    emptyMessage?: string
    loading?: boolean
  }>(),
  { rowItemsAlign: 'center', emptyMessage: 'No data found' }
)

const buttonCount = computed(() => {
  return (props.buttons || []).length
})
const paddingRightStyle = computed(() => {
  let padding = 16
  if (buttonCount.value > 0) {
    padding = 48 + (buttonCount.value - 1) * 42
  }
  return `${padding}px`
})

const rowsWrapperClasses = computed(() => {
  const classParts = [
    'relative grid grid-cols-12 items-center space-x-6 px-4 py-0.5 min-w-[750px] bg-foundation text-body-xs'
  ]

  if (props.onRowClick && props.items?.length) {
    classParts.push('cursor-pointer hover:bg-highlight-1')
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

const getHeaderClasses = (
  column: C | undefined,
  colIndex: number,
  options?: Partial<{
    noPadding: boolean
  }>
): string => {
  const columnClasses = column
    ? props.columns.find((c) => c.id === column)?.classes
    : ''
  const classParts = [columnClasses || '']

  if (!options?.noPadding) {
    if (colIndex === 0) {
      classParts.push('px-1')
    } else {
      classParts.push('lg:p-0 px-1')
    }
  }

  return classParts.join(' ')
}

const getClasses = (
  column: C | undefined,
  colIndex: number,
  options?: Partial<{
    noPadding: boolean
  }>
): string => {
  const classParts = [getHeaderClasses(column, colIndex, options)]

  if (colIndex === 0) {
    classParts.push(`bg-transparent py-2 ${column ? 'pr-5' : 'col-span-full'}`)
  } else {
    classParts.push(`my-2`)
  }

  return classParts.join(' ')
}

const handleRowClick = (item: T) => {
  props.onRowClick?.(item)
}

const headerRowClasses = computed(() => [
  'z-10 grid grid-cols-12 items-center',
  'w-full min-w-[750px] space-x-6',
  'px-4 py-3',
  'bg-foundation-page rounded-t-lg',
  'font-medium text-body-2xs text-foreground-2',
  'border-b border-outline-3'
])
</script>
