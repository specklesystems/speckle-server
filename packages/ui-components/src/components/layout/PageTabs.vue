<template>
  <div class="flex flex-col gap-y-0 sm:gap-y-4">
    <div class="relative flex gap-12">
      <div class="absolute bottom-0 left-0 h-px w-full bg-outline-3"></div>
      <button
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-1 relative z-10 pb-2 border-b"
        :class="
          activeItem.id === item.id
            ? 'text-primary font-bold border-primary'
            : 'text-foreground-2 border-transparent'
        "
        @click="onTabClick(item)"
      >
        <Component :is="item.icon" v-if="item.icon" class="h-4 w-4" />
        <div class="relative">
          <!-- Transparent item to stop layout shift when font-bold is added -->
          <span class="font-bold opacity-0">{{ item.title }}</span>
          <span class="absolute inset-0">{{ item.title }}</span>
        </div>
        <div
          v-if="item.count"
          class="rounded-full py-0.5 px-2 text-[11px]"
          :class="
            activeItem.id === item.id
              ? 'text-primary-focus bg-blue-100'
              : 'text-foreground-2 bg-gray-200'
          "
        >
          <div class="relative">
            <!-- Transparent item to stop layout shift when font-bold is added -->
            <span class="font-bold opacity-0">{{ item.count }}</span>
            <span class="absolute inset-0">{{ item.count }}</span>
          </div>
        </div>
      </button>
    </div>
    <slot :active-item="activeItem" />
  </div>
</template>
<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Nullable } from '@speckle/shared'
import { computed, ref } from 'vue'
import type { LayoutPageTabItem } from '~~/src/helpers/layout/components'

const props = defineProps<{
  items: LayoutPageTabItem<any>[]
}>()

const activeItemId = ref(null as Nullable<string>)
const activeItem = computed(() => {
  if (!activeItemId.value) return props.items[0]
  return props.items.find((i) => i.id === activeItemId.value) || props.items[0]
})

const onTabClick = (item: LayoutPageTabItem) => {
  activeItemId.value = item.id
}
</script>
