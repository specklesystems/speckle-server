<template>
  <div class="mt-8 text-foreground">
    <div class="w-full text-sm overflow-x-auto overflow-y-visible">
      <div
        class="grid z-10 grid-cols-12 items-center gap-6 font-semibold bg-foundation rounded-t-lg w-full border-b border-outline-3 h-10 px-4 min-w-[900px]"
        :style="{ paddingRight: paddingRightStyle }"
      >
        <div
          v-for="(header, index) in headers"
          :key="index"
          :class="columnClasses[header.id]"
          class="capitalize"
        >
          {{ header.title }}
        </div>
      </div>
      <div class="divide-y divide-outline-3 h-full overflow-visible min-h-[500px]">
        <div
          v-for="(item, rowIndex) in items"
          :key="rowIndex"
          class="relative grid grid-cols-12 items-center gap-6 px-4 py-1 min-w-[900px] bg-white"
          :style="{ paddingRight: paddingRightStyle }"
        >
          <template v-for="(column, colIndex) in headers" :key="colIndex">
            <div :class="getClasses(column.id, colIndex)" tabindex="0">
              <slot :name="column.id" :item="item">
                <div class="text-gray-900 font-medium order-1">
                  {{ item[column.id] }}
                </div>
              </slot>
            </div>
          </template>
          <div class="absolute right-0 flex items-center p-0 pr-0.5">
            <div v-for="(button, btnIndex) in buttons" :key="btnIndex" class="p-1">
              <FormButton
                :icon-left="button.icon"
                :size="'sm'"
                color="secondary"
                hide-text="true"
                class="text-red-500"
                @click="button.action(item as User | Project)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType, defineComponent, ConcreteComponent } from 'vue'
import { User, Project } from '~~/lib/common/generated/gql/graphql'

interface RowButton {
  icon: ConcreteComponent
  label: string
  action: (item: User | Project) => void
}

interface Header {
  id: string
  title: string
}

export default defineComponent({
  props: {
    headers: {
      type: Array as PropType<Header[]>,
      required: true
    },
    items: {
      type: Array as PropType<Record<string, unknown>[]>,
      required: true
    },
    buttons: {
      type: Array as PropType<RowButton[]>,
      default: () => []
    },
    columnClasses: {
      type: Object as PropType<Record<string, string>>,
      required: true
    }
  },
  computed: {
    paddingRightStyle() {
      const padding = 52 + ((this.buttons as RowButton[]).length - 1) * 25
      return `${padding}px`
    }
  },
  methods: {
    getClasses(column: string, colIndex: number): string {
      const columnClass = this.columnClasses[column]

      // For the first column
      if (colIndex === 0) {
        return `bg-transparent py-3 pr-5 ${columnClass}`
      }

      return `lg:p-0 ${columnClass}`
    }
  }
})
</script>
