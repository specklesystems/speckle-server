<template>
  <div class="flex flex-col gap-y-4 sm:gap-y-6">
    <div
      class="relative flex gap-8 w-full overflow-x-auto no-scrollbar border-b border-outline-3 lg:border-none pr-20 lg:pr-0"
    >
      <div
        class="hidden lg:block absolute bottom-0 left-0 h-px w-full bg-outline-3"
      ></div>
      <div
        :style="borderStyle"
        class="h-px absolute bottom-0 z-20 bg-primary transition-all duration-300"
      ></div>
      <div
        class="lg:hidden h-full absolute right-0 z-30 bg-gradient-to-l from-foundation-page w-20"
      ></div>
      <button
        v-for="item in items"
        :id="`tab-${item.id}`"
        :key="item.id"
        class="relative z-10 flex items-center gap-1 pb-2 border-b border-transparent hover:border-outline-2 text-sm sm:text-base"
        :class="
          activeItem.id === item.id
            ? 'text-primary font-bold hover:text-primary'
            : 'text-foreground'
        "
        @click="onTabClick(item, $event)"
      >
        <Component :is="item.icon" v-if="item.icon" class="h-4 w-4" />
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
    <slot :active-item="activeItem" />
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import type { Nullable } from '@speckle/shared'
import type { LayoutPageTabItem } from '~~/src/helpers/layout/components'

const props = defineProps<{
  items: LayoutPageTabItem[]
}>()

const activeItemId = ref(null as Nullable<string>)
const borderStyle = ref({})

const activeItem = computed(() => {
  return activeItemId.value
    ? props.items.find((i) => i.id === activeItemId.value) || props.items[0]
    : props.items[0]
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
  nextTick(() => {
    if (!activeItemId.value && props.items.length > 0) {
      activeItemId.value = props.items[0].id
    }

    const initialActiveElement = document.getElementById(`tab-${activeItemId.value}`)
    if (initialActiveElement) {
      updateBorderStyle(initialActiveElement)
    }
  })
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
