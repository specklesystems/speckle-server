<template>
  <div class="mt-8 text-foreground">
    <div class="w-full text-sm overflow-x-auto">
      <div
        class="grid z-10 grid-cols-12 items-center gap-2 font-semibold bg-foundation rounded-t-lg w-full border-b border-outline-3 h-10 px-4 min-w-[900px]"
        :style="{ paddingRight: paddingRightStyle }"
      >
        <div
          v-for="(header, index) in headers"
          :key="index"
          :class="columnClasses[header]"
        >
          {{ header }}
        </div>
      </div>
      <div class="divide-y divide-outline-3 h-full">
        <div
          v-for="(item, rowIndex) in items"
          :key="rowIndex"
          class="relative grid grid-cols-12 items-center gap-2 px-4 py-1 min-w-[900px] bg-white"
          :style="{ paddingRight: paddingRightStyle }"
        >
          <template v-for="(column, colIndex) in headers" :key="colIndex">
            <div :class="getClasses(column, colIndex, rowIndex)" tabindex="0">
              <slot :name="column" :item="item">
                <div class="text-gray-900 font-medium order-1">{{ item[column] }}</div>
              </slot>
            </div>
          </template>
          <div
            :class="{
              'h-0 h-full': openRow !== rowIndex,
              'p-3 h-full': openRow === rowIndex
            }"
            class="absolute right-0 flex items-center p-0 pr-0.5 overflow-auto"
          >
            <div v-for="(button, btnIndex) in buttons" :key="btnIndex" class="p-1">
              <FormButton
                :icon-left="button.icon"
                :size="'sm'"
                color="secondary"
                hide-text="true"
                class="text-red-500"
                @click="button.action(item)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'

interface Button {
  icon: any
  label: string
  action: (item: any) => void
}

export default defineComponent({
  props: {
    headers: {
      type: Array as PropType<string[]>,
      required: true
    },
    items: {
      type: Array as PropType<Record<string, any>[]>,
      required: true
    },
    buttons: {
      type: Array as PropType<Button[]>,
      default: () => []
    },
    columnClasses: {
      type: Object as PropType<Record<string, string>>,
      required: true
    }
  },
  data() {
    return {
      openRow: -1
    }
  },
  computed: {
    paddingRightStyle() {
      const padding = 52 + ((this.buttons as Button[]).length - 1) * 25
      return `${padding}px`
    }
  },
  methods: {
    getClasses(column: string, colIndex: number, rowIndex: number): string {
      const columnClass = this.columnClasses[column]

      // For the first column
      if (colIndex === 0) {
        return `bg-transparent py-3 px-5 ${columnClass}`
      }

      // For other columns
      const hideClass =
        this.openRow !== rowIndex ? 'overflow-visible' : 'overflow-visible'
      return `lg:p-0 ${hideClass} ${columnClass}`
    }
  }
})
</script>
