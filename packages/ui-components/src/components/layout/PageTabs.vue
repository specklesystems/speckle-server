<template>
  <div
    class="relative z-10 flex gap-4"
    :class="vertical ? 'sm:gap-8 flex-col sm:flex-row' : 'sm:gap-10 flex-col'"
  >
    <div
      class="relative flex sm:justify-between overflow-x-auto"
      :class="
        vertical
          ? 'items-center sm:items-start sm:flex-col sm:w-2/12 border-r border-outline gap-4 pl-4'
          : 'no-scrollbar border-b border-outline-3 lg:border-none gap-8 w-full'
      "
    >
      <div
        v-if="!vertical"
        class="hidden lg:block absolute bottom-0 left-0 h-px w-full bg-outline-3"
      ></div>
      <div
        v-if="!vertical"
        :style="borderStyle"
        class="h-[2px] absolute bottom-0 z-20 bg-primary transition-all duration-300"
      ></div>
      <div
        class="flex"
        :class="
          vertical ? 'flex-wrap sm:flex-nowrap flex-row sm:flex-col gap-4' : 'gap-8'
        "
      >
        <h1
          v-if="title"
          class="font-bold h4"
          :class="vertical ? 'w-full sm:w-auto -ml-4 mb-4' : 'mb-2'"
        >
          {{ title }}
        </h1>
        <button
          v-for="item in items"
          :id="`tab-${item.id}`"
          :key="item.id"
          class="relative z-10 flex items-center gap-1.5 pb-2 border-b-[2px] border-transparent text-sm sm:text-base max-w-max"
          :class="[
            activeItem.id === item.id
              ? 'text-primary hover:text-primary'
              : 'text-foreground',
            vertical ? 'hover:border-outline' : 'hover:border-outline-2'
          ]"
          @click="onTabClick(item, $event)"
        >
          <Component
            :is="item.icon"
            v-if="item.icon"
            class="shrink-0 h-4 w-4 stroke-[2px]"
          />
          <div class="relative">
            <!-- Transparent item to stop layout shift when font-bold is added -->
            <span class="font-bold opacity-0">{{ item.title }}</span>
            <span class="absolute inset-0">{{ item.title }}</span>
          </div>
          <div
            v-if="item.count"
            class="rounded-full px-2 text-[11px]"
            :class="
              activeItem.id === item.id
                ? 'text-primary-focus bg-blue-100'
                : 'text-foreground-2 bg-gray-200'
            "
          >
            <div class="relative">
              <!-- Transparent item to stop layout shift when font-bold is added -->
              <span class="font-bold opacity-0">{{ item.count }}</span>
              <span class="absolute inset-0 select-none">{{ item.count }}</span>
            </div>
          </div>
          <div
            v-if="item.tag"
            class="text-[10px] leading-tight py-0.5 text-foreground-on-primary font-medium px-1.5 rounded-full bg-gradient-to-tr from-[#7025EB] to-primary select-none mt-0.5"
          >
            {{ item.tag }}
          </div>
        </button>
      </div>
    </div>
    <div :class="vertical ? 'sm:w-10/12' : ''">
      <slot :active-item="activeItem" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { Nullable } from '@speckle/shared'
import type { LayoutPageTabItem } from '~~/src/helpers/layout/components'

const props = defineProps<{
  items: LayoutPageTabItem[]
  vertical?: boolean
  title?: string
}>()

const activeItemId = ref(null as Nullable<string>)
const borderStyle = ref({})

const activeItem = computed(() => {
  const item = props.items.find((i) => i.id === activeItemId.value)

  return item || props.items[0]
})

const updateBorderStyle = (element: HTMLElement) => {
  const { offsetLeft, clientWidth } = element
  borderStyle.value = {
    left: `${offsetLeft}px`,
    width: `${clientWidth}px`
  }
}

const onTabClick = (item: LayoutPageTabItem, event: MouseEvent) => {
  activeItemId.value = item.id
  updateBorderStyle(event.currentTarget as HTMLElement)
}

onMounted(() => {
  activeItemId.value = props.items[0].id

  const initialActiveElement = document.getElementById(`tab-${activeItemId.value}`)
  if (initialActiveElement) {
    updateBorderStyle(initialActiveElement)
  }
})
</script>
<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
